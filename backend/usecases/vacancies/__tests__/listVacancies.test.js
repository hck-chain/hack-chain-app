const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../createVacancy");
const { closeVacancy } = require("../closeVacancy");
const { listVacancies } = require("../listVacancies");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);

describe("listVacancies", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    const User = require("../../../models/users")(sequelize, DataTypes);
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);
    const Vacancy = require("../../../models/vacancies")(sequelize, DataTypes);
    const VacancyApplication = require("../../../models/vacancyApplications")(sequelize, DataTypes);

    models = { User, Issuer, Student, Recruiter, Certificate, UserSession, Vacancy, VacancyApplication, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
  });

  afterAll(() => sequelize.close());

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await models.User.create({ wallet_address: RECRUITER, role: "recruiter", name: "Rita", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Recruiter.create({ wallet_address: RECRUITER, company_name: "Acme Corp" });
  });

  async function makeVacancy(overrides = {}) {
    const created = await createVacancy({
      models,
      recruiterWallet: RECRUITER,
      position: "Ingeniero de Software",
      company: "Acme Corp",
      area: "backend",
      modality: "remoto",
      salaryMin: 1000,
      salaryMax: 2000,
      salaryCurrency: "USD",
      salaryPeriod: "mes",
      description: "x".repeat(60),
      requirements: ["Node.js"],
      ...overrides,
    });
    return created.data.vacancy;
  }

  test("only lists open vacancies", async () => {
    const v1 = await makeVacancy({ position: "Puesto A" });
    await makeVacancy({ position: "Puesto B" });
    await closeVacancy({ models, vacancyId: v1.id, recruiterWallet: RECRUITER });

    const result = await listVacancies({ models });
    expect(result.data.vacancies).toHaveLength(1);
    expect(result.data.vacancies[0].position).toBe("Puesto B");
  });

  // RF-08, RN-05 — cronológico descendente, nunca por popularidad.
  test("orders results by published_at descending", async () => {
    await makeVacancy({ position: "Primero" });
    await new Promise((r) => setTimeout(r, 5));
    await makeVacancy({ position: "Segundo" });

    const result = await listVacancies({ models });
    expect(result.data.vacancies.map((v) => v.position)).toEqual(["Segundo", "Primero"]);
  });

  test("filters by area", async () => {
    await makeVacancy({ position: "Backend role", area: "backend" });
    await makeVacancy({ position: "Design role", area: "diseno" });

    const result = await listVacancies({ models, area: "diseno" });
    expect(result.data.vacancies).toHaveLength(1);
    expect(result.data.vacancies[0].position).toBe("Design role");
  });

  test("filters by modality", async () => {
    await makeVacancy({ position: "Remote role", modality: "remoto" });
    await makeVacancy({ position: "Onsite role", modality: "presencial", country: "Mexico", city: "CDMX" });

    const result = await listVacancies({ models, modality: "presencial" });
    expect(result.data.vacancies).toHaveLength(1);
    expect(result.data.vacancies[0].position).toBe("Onsite role");
  });

  test("searches by position or company", async () => {
    await makeVacancy({ position: "Pentester Senior", company: "SecureCo" });
    await makeVacancy({ position: "Frontend Dev", company: "PixelWorks" });

    const byPosition = await listVacancies({ models, q: "pentester" });
    expect(byPosition.data.vacancies).toHaveLength(1);

    const byCompany = await listVacancies({ models, q: "pixel" });
    expect(byCompany.data.vacancies).toHaveLength(1);
    expect(byCompany.data.vacancies[0].company).toBe("PixelWorks");
  });

  test("rejects an invalid area filter", async () => {
    const result = await listVacancies({ models, area: "not-a-real-area" });
    expect(result.code).toBe("INVALID_AREA");
  });

  // RF-10, RF-27, RN-06 — never the applicant count.
  test("never includes applications_count or unreviewed_count", async () => {
    await makeVacancy();
    const result = await listVacancies({ models });
    expect(result.data.vacancies[0]).not.toHaveProperty("applications_count");
    expect(result.data.vacancies[0]).not.toHaveProperty("unreviewed_count");
    expect(JSON.stringify(result.data)).not.toMatch(/applications_count|unreviewed_count/);
  });
});
