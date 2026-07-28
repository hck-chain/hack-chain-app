// Covers the HTTP contract of the talent profile endpoints:
//   GET   /api/students/me
//   PATCH /api/students/me
//   GET   /api/students/:wallet_address/public
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
jest.mock("../services/studentService", () => ({
  validateDeletionMessage: jest.fn(),
  deleteStudentAccount: jest.fn(),
}));

describe("Student profile routes", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession;
  let app;

  const STUDENT = "0x" + "aa".repeat(20);
  const ISSUER = "0x" + "bb".repeat(20);

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
    // SQLite requires UNIQUE on any column referenced by a FK; the production
    // Student model doesn't declare it (Postgres is more permissive).
    Student.rawAttributes.wallet_address.unique = true;
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);

    const modelsMock = { User, Issuer, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = {
            wallet: req.headers["x-test-wallet"] || STUDENT,
            role: req.headers["x-test-role"] || "student",
          };
          next();
        },
      }));

      const studentsRoute = require("../routes/students");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/students", studentsRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await User.create({
      wallet_address: STUDENT,
      role: "student",
      name: "Ana",
      lastname: "Perez",
      email: "ana@example.com",
      email_verified: true,
      nonce: nonce(),
    });
    await Student.create({ wallet_address: STUDENT, field_of_study: "Ciberseguridad", share_count: 2 });

    await User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: STUDENT,
      title: "A",
      certificate_hash: "h1",
      token_id: "1",
      issue_date: "2026-01-01",
    });
  });

  describe("GET /api/students/me", () => {
    test("200 with the full own profile including email", async () => {
      const res = await request(app).get("/api/students/me").expect(200);
      expect(res.body).toEqual({
        wallet_address: STUDENT,
        field_of_study: "Ciberseguridad",
        photo_url: null,
        bio: null,
        knowledge_areas: [],
        github_url: null,
        linkedin_url: null,
        twitter_url: null,
        instagram_url: null,
        share_count: 2,
        name: "Ana",
        lastname: "Perez",
        email: "ana@example.com",
        email_verified: true,
      });
    });

    test("403 for a non-student role", async () => {
      const res = await request(app).get("/api/students/me").set("x-test-role", "issuer").expect(403);
      expect(res.body).toEqual({ error: "Only talent accounts can access this endpoint" });
    });

    test("404 when the authenticated wallet has no student row", async () => {
      const res = await request(app).get("/api/students/me").set("x-test-wallet", "0x" + "ff".repeat(20)).expect(404);
      expect(res.body).toEqual({ error: "Student not found" });
    });

    test("is not captured by GET /:wallet_address", async () => {
      const res = await request(app).get("/api/students/me").expect(200);
      expect(res.body).not.toHaveProperty("student");
    });
  });

  describe("PATCH /api/students/me", () => {
    test("200 and persists the update", async () => {
      const res = await request(app)
        .patch("/api/students/me")
        .send({ bio: "Talento en formacion", knowledge_areas: ["Rust"], github_url: "https://github.com/ana" })
        .expect(200);

      expect(res.body.message).toBe("Profile updated");
      expect(res.body.student.bio).toBe("Talento en formacion");

      const stored = await Student.findOne({ where: { wallet_address: STUDENT } });
      expect(stored.github_url).toBe("https://github.com/ana");
    });

    test("400 for a bio over 500 characters", async () => {
      const res = await request(app).patch("/api/students/me").send({ bio: "x".repeat(501) }).expect(400);
      expect(res.body).toEqual({ error: "bio must be 500 characters or less" });
    });

    test("400 for more than 5 knowledge areas", async () => {
      const res = await request(app)
        .patch("/api/students/me")
        .send({ knowledge_areas: ["a", "b", "c", "d", "e", "f"] })
        .expect(400);
      expect(res.body).toEqual({ error: "Maximum 5 knowledge areas allowed" });
    });

    test("400 for a non-https social link", async () => {
      const res = await request(app).patch("/api/students/me").send({ linkedin_url: "ftp://x" }).expect(400);
      expect(res.body).toEqual({ error: "linkedin_url must be a valid https:// URL" });
    });

    test("403 for a non-student role", async () => {
      const res = await request(app).patch("/api/students/me").set("x-test-role", "recruiter").send({ bio: "x" }).expect(403);
      expect(res.body).toEqual({ error: "Only talent accounts can update this profile" });
    });

    test("ignores User-owned fields sent in the body", async () => {
      await request(app).patch("/api/students/me").send({ bio: "ok", email: "evil@example.com", name: "Hacker" }).expect(200);

      const user = await User.findOne({ where: { wallet_address: STUDENT } });
      expect(user.email).toBe("ana@example.com");
      expect(user.name).toBe("Ana");
    });
  });

  describe("GET /api/students/:wallet_address/public", () => {
    test("200 with the public profile and no email anywhere in the response", async () => {
      const res = await request(app).get(`/api/students/${STUDENT}/public`).expect(200);

      expect(res.body.student.wallet_address).toBe(STUDENT);
      expect(res.body.student.total_certificates).toBe(1);
      expect(res.body.student.share_count).toBe(2);
      expect(res.body.student).not.toHaveProperty("email");
      expect(JSON.stringify(res.body)).not.toContain("ana@example.com");
    });

    test("400 for a malformed wallet", async () => {
      const res = await request(app).get("/api/students/not-a-wallet/public").expect(400);
      expect(res.body).toEqual({ error: "Invalid wallet address" });
    });

    test("404 for an unknown wallet", async () => {
      const res = await request(app).get(`/api/students/0x${"ff".repeat(20)}/public`).expect(404);
      expect(res.body).toEqual({ error: "Student not found" });
    });
  });
});
