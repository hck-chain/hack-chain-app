// Covers the HTTP contract of the vacancies module (11 endpoints), route
// ordering (/mine, /applications/mine, /applications/:id before their
// param-catching siblings), and the RN-06/RF-10/RF-27 guarantee that the
// applicant count never leaks to a public or talent-facing endpoint.
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(20000);

jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
}));
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("../services/emailService", () => ({
  notifyTalentVacancyApplicationUpdate: jest.fn().mockResolvedValue(undefined),
}));

describe("Vacancies routes", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession, Vacancy, VacancyApplication;
  let app;

  const RECRUITER = "0x" + "aa".repeat(20);
  const OTHER_RECRUITER = "0x" + "ee".repeat(20);
  const ISSUER = "0x" + "bb".repeat(20);
  const TALENT = "0x" + "cc".repeat(20);

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    User = require("../models/users")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Student = require("../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);
    Vacancy = require("../models/vacancies")(sequelize, DataTypes);
    VacancyApplication = require("../models/vacancyApplications")(sequelize, DataTypes);

    const modelsMock = { User, Issuer, Student, Recruiter, Certificate, UserSession, Vacancy, VacancyApplication, sequelize, Sequelize: SequelizePkg };
    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = {
            wallet: req.headers["x-test-wallet"] || RECRUITER,
            role: req.headers["x-test-role"] || "recruiter",
          };
          next();
        },
      }));

      const vacanciesRoute = require("../routes/vacancies");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/vacancies", vacanciesRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  let vacancyId, vacancySlug;

  beforeEach(async () => {
    jest.clearAllMocks();
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await User.create({ wallet_address: RECRUITER, role: "recruiter", name: "Rita", email: "rita@example.com", nonce: nonce() });
    await Recruiter.create({ wallet_address: RECRUITER, company_name: "Acme Corp" });
    await User.create({ wallet_address: OTHER_RECRUITER, role: "recruiter", name: "Otro", nonce: nonce() });
    await Recruiter.create({ wallet_address: OTHER_RECRUITER, company_name: "Other Co" });
    await User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await User.create({ wallet_address: TALENT, role: "student", name: "Tomás", email: "tomas@example.com", nonce: nonce() });
    await Student.create({ wallet_address: TALENT });

    const vacancy = await Vacancy.create({
      slug: "ingeniero-de-software-acme-corp",
      recruiter_wallet_address: RECRUITER,
      position: "Ingeniero de Software",
      company: "Acme Corp",
      area: "backend",
      modality: "remoto",
      salary_min: 1000,
      salary_max: 2000,
      salary_currency: "USD",
      salary_period: "mes",
      description: "x".repeat(60),
      requirements: ["Node.js"],
      closing_date: "2099-01-01",
      status: "abierta",
      published_at: new Date(),
    });
    vacancyId = vacancy.id;
    vacancySlug = vacancy.slug;
  });

  describe("POST /api/vacancies", () => {
    test("201 for a recruiter", async () => {
      const res = await request(app)
        .post("/api/vacancies")
        .send({
          position: "Analista de Seguridad",
          company: "SecureCo",
          area: "ciberseguridad",
          modality: "remoto",
          salary_min: 1500,
          salary_max: 2500,
          salary_currency: "USD",
          salary_period: "mes",
          description: "y".repeat(60),
          requirements: ["OSCP"],
        })
        .expect(201);
      expect(res.body.vacancy.status).toBe("abierta");
    });

    test("403 for a non-recruiter role", async () => {
      const res = await request(app).post("/api/vacancies").set("x-test-role", "student").send({}).expect(403);
      expect(res.body).toEqual({ error: "Only recruiters can create vacancies" });
    });

    // RN-01
    test("400 when salary is missing", async () => {
      const res = await request(app)
        .post("/api/vacancies")
        .send({ position: "Analista", company: "SecureCo", area: "ciberseguridad", modality: "remoto", description: "y".repeat(60), requirements: ["OSCP"] })
        .expect(400);
      expect(res.body.error).toMatch(/salary_min/);
    });
  });

  describe("GET /api/vacancies", () => {
    test("200 with only open vacancies, no applicant count anywhere", async () => {
      const res = await request(app).get("/api/vacancies").expect(200);
      expect(res.body.vacancies).toHaveLength(1);
      expect(JSON.stringify(res.body)).not.toMatch(/applications_count|unreviewed_count/);
    });

    test("filters by area and modalidad, and searches by q", async () => {
      const byArea = await request(app).get("/api/vacancies?area=diseno").expect(200);
      expect(byArea.body.vacancies).toHaveLength(0);

      const byModalidad = await request(app).get("/api/vacancies?modalidad=presencial").expect(200);
      expect(byModalidad.body.vacancies).toHaveLength(0);

      const byQuery = await request(app).get("/api/vacancies?q=Ingeniero").expect(200);
      expect(byQuery.body.vacancies).toHaveLength(1);
    });
  });

  describe("GET /api/vacancies/mine", () => {
    test("200 with counts, not captured by GET /:slug", async () => {
      const res = await request(app).get("/api/vacancies/mine").expect(200);
      expect(res.body.vacancies).toHaveLength(1);
      expect(res.body.vacancies[0].applications_count).toBe(0);
      expect(res.body).not.toHaveProperty("vacancy");
    });

    test("403 for a non-recruiter", async () => {
      await request(app).get("/api/vacancies/mine").set("x-test-role", "student").expect(403);
    });
  });

  describe("GET /api/vacancies/:slug", () => {
    test("200 without any session, no applicant count", async () => {
      const res = await request(app).get(`/api/vacancies/${vacancySlug}`).expect(200);
      expect(res.body.vacancy.slug).toBe(vacancySlug);
      expect(res.body.unverified_company_notice).toContain("HackChain no comprueba la identidad");
      expect(JSON.stringify(res.body)).not.toMatch(/applications_count|unreviewed_count/);
    });

    test("404 for an unknown slug", async () => {
      await request(app).get("/api/vacancies/no-existe").expect(404);
    });
  });

  describe("PUT /api/vacancies/:id", () => {
    test("200 updates an open vacancy", async () => {
      const res = await request(app).put(`/api/vacancies/${vacancyId}`).send({ description: "z".repeat(60) }).expect(200);
      expect(res.body.vacancy.description).toBe("z".repeat(60));
    });

    // RF-06
    test("409 when trying to change salary after an application exists", async () => {
      await VacancyApplication.create({ vacancy_id: vacancyId, student_wallet_address: TALENT, status: "enviada", submitted_at: new Date() });
      const res = await request(app).put(`/api/vacancies/${vacancyId}`).send({ salary_min: 3000 }).expect(409);
      expect(res.body).toEqual({ error: "Salary can't be edited once the vacancy has applications" });
    });
  });

  describe("POST /api/vacancies/:id/close", () => {
    test("200 closes the vacancy and it disappears from the public listing", async () => {
      await request(app).post(`/api/vacancies/${vacancyId}/close`).expect(200);
      const res = await request(app).get("/api/vacancies").expect(200);
      expect(res.body.vacancies).toHaveLength(0);
    });

    test("409 on a second close (no reopening)", async () => {
      await request(app).post(`/api/vacancies/${vacancyId}/close`).expect(200);
      const res = await request(app).post(`/api/vacancies/${vacancyId}/close`).expect(409);
      expect(res.body).toEqual({ error: "Vacancy is already closed" });
    });
  });

  describe("POST /api/vacancies/:id/applications", () => {
    test("201 for a talent applying without sharing certificates", async () => {
      const res = await request(app)
        .post(`/api/vacancies/${vacancyId}/applications`)
        .set("x-test-role", "student")
        .set("x-test-wallet", TALENT)
        .send({})
        .expect(201);
      expect(res.body.application.status).toBe("enviada");
    });

    test("403 for a recruiter", async () => {
      await request(app).post(`/api/vacancies/${vacancyId}/applications`).send({}).expect(403);
    });

    // RF-19
    test("409 on a second application to the same vacancy", async () => {
      await request(app).post(`/api/vacancies/${vacancyId}/applications`).set("x-test-role", "student").set("x-test-wallet", TALENT).send({}).expect(201);
      const res = await request(app).post(`/api/vacancies/${vacancyId}/applications`).set("x-test-role", "student").set("x-test-wallet", TALENT).send({}).expect(409);
      expect(res.body).toEqual({ error: "You already applied to this vacancy" });
    });
  });

  describe("GET /api/vacancies/applications/mine — must not be captured by /:id/applications", () => {
    test("200 with the talent's own applications", async () => {
      await request(app).post(`/api/vacancies/${vacancyId}/applications`).set("x-test-role", "student").set("x-test-wallet", TALENT).send({}).expect(201);
      const res = await request(app).get("/api/vacancies/applications/mine").set("x-test-role", "student").set("x-test-wallet", TALENT).expect(200);
      expect(res.body.applications).toHaveLength(1);
    });

    test("403 for a recruiter", async () => {
      await request(app).get("/api/vacancies/applications/mine").expect(403);
    });
  });

  describe("GET /api/vacancies/applications/:id — must not be captured by /:id/applications", () => {
    test("200 and transitions the application to vista", async () => {
      const created = await request(app).post(`/api/vacancies/${vacancyId}/applications`).set("x-test-role", "student").set("x-test-wallet", TALENT).send({}).expect(201);
      const res = await request(app).get(`/api/vacancies/applications/${created.body.application.id}`).expect(200);
      expect(res.body.application.status).toBe("vista");
    });
  });

  describe("PUT /api/vacancies/applications/:id", () => {
    test("200 moves the application to contactado", async () => {
      const created = await request(app).post(`/api/vacancies/${vacancyId}/applications`).set("x-test-role", "student").set("x-test-wallet", TALENT).send({}).expect(201);
      const res = await request(app).put(`/api/vacancies/applications/${created.body.application.id}`).send({ status: "contactado" }).expect(200);
      expect(res.body.application.status).toBe("contactado");
    });
  });

  describe("GET /api/vacancies/:id/applications", () => {
    test("200 lists applicants with certificates, only for the owning recruiter", async () => {
      await request(app).post(`/api/vacancies/${vacancyId}/applications`).set("x-test-role", "student").set("x-test-wallet", TALENT).send({}).expect(201);

      const res = await request(app).get(`/api/vacancies/${vacancyId}/applications`).expect(200);
      expect(res.body.applications).toHaveLength(1);

      const forbidden = await request(app).get(`/api/vacancies/${vacancyId}/applications`).set("x-test-wallet", OTHER_RECRUITER).expect(404);
      expect(forbidden.body).toEqual({ error: "Vacancy not found" });
    });
  });
});
