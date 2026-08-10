// backend/tests/issuers-class-settings.test.js
//
// Regression test for the GET/PATCH /api/issuers/me/classes refactor
// (routes/issuers.js -> usecases/issuers/{getOwnClassSettings,updateClassSettings}).
// Confirms the HTTP contract (status codes + response bodies) is byte-identical
// to the pre-refactor inline implementation.

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

describe("GET/PATCH /api/issuers/me/classes", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession;
  let app;

  const ISSUER = "0x" + "bb".repeat(20);

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    Student = require("../models/students")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);

    const modelsMock = { User, Student, Issuer, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = {
            wallet: req.headers["x-test-wallet"] || ISSUER,
            role: req.headers["x-test-role"] || "issuer",
          };
          next();
        },
      }));

      const issuersRoute = require("../routes/issuers");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/issuers", issuersRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: crypto.randomBytes(16).toString("hex") });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
  });

  test("GET: 403 for a non-issuer role", async () => {
    const res = await request(app)
      .get("/api/issuers/me/classes")
      .set("x-test-role", "student")
      .expect(403);
    expect(res.body).toEqual({ error: "Only educator accounts can access this endpoint" });
  });

  test("GET: 404 when the issuer row does not exist", async () => {
    const res = await request(app)
      .get("/api/issuers/me/classes")
      .set("x-test-wallet", "0x" + "ff".repeat(20))
      .expect(404);
    expect(res.body).toEqual({ error: "Issuer not found" });
  });

  test("GET: 200 with null class_settings for a fresh issuer", async () => {
    const res = await request(app).get("/api/issuers/me/classes").expect(200);
    expect(res.body).toEqual({ class_settings: null });
  });

  test("PATCH: 403 for a non-issuer role", async () => {
    const res = await request(app)
      .patch("/api/issuers/me/classes")
      .set("x-test-role", "student")
      .send({ hourly_rate_usd: 50 })
      .expect(403);
    expect(res.body).toEqual({ error: "Only educator accounts can update this endpoint" });
  });

  test("PATCH: 400 with the exact original message for an invalid duration", async () => {
    const res = await request(app)
      .patch("/api/issuers/me/classes")
      .send({ durations: [999] })
      .expect(400);
    expect(res.body).toEqual({ error: "durations must be a non-empty array of unique values from [30, 45, 60]" });
  });

  test("PATCH: 400 with the exact original message for invalid availability", async () => {
    const res = await request(app)
      .patch("/api/issuers/me/classes")
      .send({ availability: { mon: { enabled: true, start: "10:00", end: "09:00" } } })
      .expect(400);
    expect(res.body).toEqual({ error: "availability.mon.start must be before end" });
  });

  test("PATCH: 200 persists and returns updated class_settings", async () => {
    const res = await request(app)
      .patch("/api/issuers/me/classes")
      .send({ hourly_rate_usd: 60, accept_usdt: true, durations: [30, 60] })
      .expect(200);
    expect(res.body).toEqual({
      class_settings: { hourly_rate_usd: 60, accept_usdt: true, durations: [30, 60] },
    });

    const getRes = await request(app).get("/api/issuers/me/classes").expect(200);
    expect(getRes.body).toEqual({
      class_settings: { hourly_rate_usd: 60, accept_usdt: true, durations: [30, 60] },
    });
  });
});
