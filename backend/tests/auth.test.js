// backend/tests/auth.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(20000);

describe("Auth endpoints (login + /me + logout)", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, Certificate, UserSession;
  let app;

  const TEST_WALLET = "0xdeadbeef00000000000000000000000000000000";

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

    // Wire up all associations so includes work in getUserFromToken
    Object.values(modelsMock).forEach((model) => {
      if (model?.associate) model.associate(modelsMock);
    });

    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    process.env.JWT_EXPIRES_IN = "1h";

    await sequelize.sync({ force: true });

    await User.create({
      wallet_address: TEST_WALLET,
      role: "student",
      name: "Test User",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await Student.create({ wallet_address: TEST_WALLET });

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

  test("POST /api/auth/login returns token for valid wallet", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: TEST_WALLET })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("role", "student");
    expect(res.body.user).toHaveProperty("wallet_address", TEST_WALLET);
  });

  test("POST /api/auth/login returns 404 for unknown wallet", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: "0x0000000000000000000000000000000000000000" })
      .expect(404);
  });

  test("GET /api/auth/me returns user for valid token + active session", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: TEST_WALLET })
      .expect(200);

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`)
      .expect(200);

    expect(meRes.body).toHaveProperty("user");
    expect(meRes.body.user).not.toHaveProperty("passwordHash");
    expect(meRes.body.user).not.toHaveProperty("privateKey");
  });

  test("GET /api/auth/me returns 401 without a token", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  test("POST /api/auth/logout destroys session — subsequent requests return 401", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: TEST_WALLET })
      .expect(200);

    const token = loginRes.body.token;

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // JWT is still cryptographically valid, but the session is gone
    await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });
});
