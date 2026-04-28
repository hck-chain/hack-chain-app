// backend/tests/auth.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(20000);

describe("Auth endpoints", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, Certificate, UserSession;
  let app;

  const STUDENT_WALLET  = "0xdeadbeef00000000000000000000000000000001";
  const ISSUER_WALLET   = "0xdeadbeef00000000000000000000000000000002";
  const RECRUITER_WALLET = "0xdeadbeef00000000000000000000000000000003";

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User        = require("../models/users")(sequelize, DataTypes);
    Student     = require("../models/students")(sequelize, DataTypes);
    Issuer      = require("../models/issuers")(sequelize, DataTypes);
    Recruiter   = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);

    const modelsMock = {
      User, Student, Issuer, Recruiter, Certificate, UserSession,
      sequelize,
      Sequelize: SequelizePkg,
    };

    Object.values(modelsMock).forEach((model) => {
      if (model?.associate) model.associate(modelsMock);
    });

    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    process.env.JWT_EXPIRES_IN = "1h";

    await sequelize.sync({ force: true });

    // Student
    await User.create({ wallet_address: STUDENT_WALLET, role: "student", name: "Alice Student", nonce: crypto.randomBytes(16).toString("hex") });
    await Student.create({ wallet_address: STUDENT_WALLET });

    // Issuer
    await User.create({ wallet_address: ISSUER_WALLET, role: "issuer", name: "Bob Issuer", nonce: crypto.randomBytes(16).toString("hex") });
    await Issuer.create({ wallet_address: ISSUER_WALLET, organization_name: "HackAcademy" });

    // Recruiter
    await User.create({ wallet_address: RECRUITER_WALLET, role: "recruiter", name: "Carol Recruiter", nonce: crypto.randomBytes(16).toString("hex") });
    await Recruiter.create({ wallet_address: RECRUITER_WALLET, company_name: "TechCorp" });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      const authRoute = require("../routes/auth");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/auth", authRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  // -------------------------------------------------------------------------
  // Login
  // -------------------------------------------------------------------------

  test("POST /api/auth/login — valid student wallet returns token + role", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: STUDENT_WALLET })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "student");
    expect(res.body.user).toHaveProperty("wallet_address", STUDENT_WALLET);
  });

  test("POST /api/auth/login — valid issuer wallet returns token + role", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ISSUER_WALLET })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "issuer");
    expect(res.body.user).toHaveProperty("wallet_address", ISSUER_WALLET);
  });

  test("POST /api/auth/login — valid recruiter wallet returns token + role", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: RECRUITER_WALLET })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "recruiter");
    expect(res.body.user).toHaveProperty("wallet_address", RECRUITER_WALLET);
  });

  test("POST /api/auth/login — unknown wallet returns 404", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: "0x0000000000000000000000000000000000000000" })
      .expect(404);
  });

  // -------------------------------------------------------------------------
  // GET /me — role dispatch optimization (1.2)
  // Each role must route to the correct table and return the right shape.
  // -------------------------------------------------------------------------

  test("GET /api/auth/me — student role returns student data without secrets", async () => {
    const { body: { token } } = await request(app)
      .post("/api/auth/login").send({ wallet_address: STUDENT_WALLET }).expect(200);

    const { body } = await request(app)
      .get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);

    expect(body.modelName).toBe("student");
    expect(body.user).toHaveProperty("wallet_address", STUDENT_WALLET);
    expect(body.user).not.toHaveProperty("passwordHash");
    expect(body.user).not.toHaveProperty("privateKey");
  });

  test("GET /api/auth/me — issuer role returns issuer data with organization_name", async () => {
    const { body: { token } } = await request(app)
      .post("/api/auth/login").send({ wallet_address: ISSUER_WALLET }).expect(200);

    const { body } = await request(app)
      .get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);

    expect(body.modelName).toBe("issuer");
    expect(body.user).toHaveProperty("wallet_address", ISSUER_WALLET);
    expect(body.user).toHaveProperty("organization_name", "HackAcademy");
    expect(body.user).not.toHaveProperty("passwordHash");
  });

  test("GET /api/auth/me — recruiter role returns recruiter data with company_name", async () => {
    const { body: { token } } = await request(app)
      .post("/api/auth/login").send({ wallet_address: RECRUITER_WALLET }).expect(200);

    const { body } = await request(app)
      .get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);

    expect(body.modelName).toBe("recruiter");
    expect(body.user).toHaveProperty("wallet_address", RECRUITER_WALLET);
    expect(body.user).toHaveProperty("company_name", "TechCorp");
    expect(body.user).not.toHaveProperty("passwordHash");
  });

  test("GET /api/auth/me — no token returns 401", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  // -------------------------------------------------------------------------
  // Logout + session revocation
  // -------------------------------------------------------------------------

  test("POST /api/auth/logout — destroys session, subsequent requests return 401", async () => {
    const { body: { token } } = await request(app)
      .post("/api/auth/login").send({ wallet_address: STUDENT_WALLET }).expect(200);

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // JWT still cryptographically valid — DB session is gone
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  test("POST /api/auth/logout — without token returns 401", async () => {
    await request(app).post("/api/auth/logout").expect(401);
  });
});
