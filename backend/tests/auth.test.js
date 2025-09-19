// backend/tests/auth.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const bcrypt = require("bcrypt");

jest.setTimeout(20000);

describe("Auth endpoints (login + /me)", () => {
  let sequelize;
  let Student, Issuer, Recruiter;
  let app;

  beforeAll(async () => {
    // 1) Sequelize sqlite in-memory
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    // 2) Define models with the same factories used in the app
    Student = require("../models/students")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);

    const modelsMock = {
      Student,
      Issuer,
      Recruiter,
      sequelize,
      Sequelize: SequelizePkg,
    };

    // Put a JWT_SECRET for the auth middleware/signing
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";

    // 3) Create tables
    await sequelize.sync({ force: true });

    // 4) Create a test student (hash password manually so hook is consistent)
    const hashed = await bcrypt.hash("Passw0rd!", 10);
    await Student.create({
      name: "Test",
      lastName: "User",
      age: 25,
      email: "authuser@example.com",
      passwordHash: hashed,
      walletAddress: "0xDEADBEEF00000000000000000000000000000000",
    });

    // 5) Mock models and require auth route after mock
    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      // require auth route (which uses ../middleware/auth internally)
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

  test("POST /api/auth/login returns token for valid credentials", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "authuser@example.com", password: "Passw0rd!" })
      .expect(200);

    expect(loginRes.body).toHaveProperty("token");
    expect(loginRes.body).toHaveProperty("expiresIn");
    expect(loginRes.body).toHaveProperty("user");
    expect(loginRes.body.user).toHaveProperty("role", "student");
    expect(loginRes.body.user).toHaveProperty("email", "authuser@example.com");
  });

  test("GET /api/auth/me with token returns the user object without secrets", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "authuser@example.com", password: "Passw0rd!" })
      .expect(200);

    const token = loginRes.body.token;
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(meRes.body).toHaveProperty("user");
    const user = meRes.body.user;
    expect(user).toHaveProperty("email", "authuser@example.com");
    // No exponer passwordHash ni privateKey
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("privateKey");
    expect(meRes.body).toHaveProperty("role", "student");
  });
});
