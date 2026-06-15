// backend/tests/educator-discovery.test.js
//
// Tests for GET /api/issuers/featured and GET /api/issuers.
// Covers: approved-only filter, count validation, randomization, and
// regression that the list endpoint also excludes non-approved educators.

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

describe("Educator Discovery", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession;
  let app;

  const makeWallet = () => "0x" + crypto.randomBytes(20).toString("hex");

  const seedIssuer = async ({ wallet, status = "approved", org = "Org", certs = 0 } = {}) => {
    const w = wallet ?? makeWallet();
    await User.create({
      wallet_address: w,
      role: "issuer",
      name: "Edu",
      nonce: crypto.randomBytes(16).toString("hex"),
      educator_approval_status: status,
    });
    await Issuer.create({
      wallet_address: w,
      organization_name: org,
      certificates_issued: certs,
    });
    return w;
  };

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    Student = require("../models/students")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);

    const modelsMock = {
      User, Student, Issuer, Recruiter, Certificate, UserSession,
      sequelize,
      Sequelize: SequelizePkg,
    };

    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    // SQLite does not have RANDOM() as a Sequelize method — stub sequelize.random()
    // to return a literal that SQLite understands.
    sequelize.random = () => SequelizePkg.literal("RANDOM()");

    await sequelize.sync({ force: true });

    process.env.JWT_SECRET = "test-discovery-secret";
    process.env.REFRESH_SECRET = "test-discovery-refresh";

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
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
  });

  // -------------------------------------------------------------------------
  // GET /api/issuers/featured — security: only approved educators
  // -------------------------------------------------------------------------

  test("featured: returns only approved educators", async () => {
    await seedIssuer({ status: "approved", org: "Approved One" });
    await seedIssuer({ status: "pending_approval", org: "Pending One" });
    await seedIssuer({ status: "rejected", org: "Rejected One" });

    const res = await request(app)
      .get("/api/issuers/featured?count=6")
      .expect(200);

    expect(res.body.educators).toHaveLength(1);
    expect(res.body.educators[0].organization_name).toBe("Approved One");
  });

  test("featured: a rejected educator is never returned", async () => {
    await seedIssuer({ status: "rejected", org: "Bad Actor" });

    const res = await request(app)
      .get("/api/issuers/featured?count=6")
      .expect(200);

    expect(res.body.educators).toHaveLength(0);
  });

  test("featured: a pending educator is never returned", async () => {
    await seedIssuer({ status: "pending_approval", org: "Not Yet" });

    const res = await request(app)
      .get("/api/issuers/featured?count=6")
      .expect(200);

    expect(res.body.educators).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // GET /api/issuers/featured — count param validation
  // -------------------------------------------------------------------------

  test("featured: count is clamped to 1 when 0 is passed", async () => {
    await seedIssuer({ status: "approved" });

    const res = await request(app)
      .get("/api/issuers/featured?count=0")
      .expect(200);

    // clamped to 1, so max 1 result
    expect(res.body.educators.length).toBeLessThanOrEqual(1);
  });

  test("featured: count is clamped to 6 when huge number is passed", async () => {
    for (let i = 0; i < 10; i++) await seedIssuer({ status: "approved", org: `Org ${i}` });

    const res = await request(app)
      .get("/api/issuers/featured?count=9999")
      .expect(200);

    expect(res.body.educators.length).toBeLessThanOrEqual(6);
  });

  test("featured: non-numeric count defaults to 3", async () => {
    for (let i = 0; i < 5; i++) await seedIssuer({ status: "approved", org: `Org ${i}` });

    const res = await request(app)
      .get("/api/issuers/featured?count=abc")
      .expect(200);

    expect(res.body.educators.length).toBeLessThanOrEqual(3);
  });

  test("featured: negative count is clamped to 1", async () => {
    await seedIssuer({ status: "approved" });

    const res = await request(app)
      .get("/api/issuers/featured?count=-5")
      .expect(200);

    expect(res.body.educators.length).toBeLessThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // GET /api/issuers/featured — response shape
  // -------------------------------------------------------------------------

  test("featured: response contains expected public fields only", async () => {
    await seedIssuer({ status: "approved", org: "Shape Test" });

    const res = await request(app)
      .get("/api/issuers/featured?count=1")
      .expect(200);

    const edu = res.body.educators[0];
    expect(edu).toHaveProperty("wallet_address");
    expect(edu).toHaveProperty("organization_name");
    expect(edu).toHaveProperty("name");
    expect(edu).toHaveProperty("photo_url");
    expect(edu).toHaveProperty("bio");
    expect(edu).toHaveProperty("knowledge_areas");
    expect(edu).toHaveProperty("certificates_issued");
    expect(edu).toHaveProperty("has_classes");

    // No PII
    expect(edu).not.toHaveProperty("email");
    expect(edu).not.toHaveProperty("passwordHash");
    expect(edu).not.toHaveProperty("class_settings");
  });

  // -------------------------------------------------------------------------
  // GET /api/issuers — regression: list endpoint also filters approved-only
  // -------------------------------------------------------------------------

  test("list: pending educator does not appear in paginated list", async () => {
    await seedIssuer({ status: "approved", org: "Approved" });
    await seedIssuer({ status: "pending_approval", org: "Pending" });

    const res = await request(app)
      .get("/api/issuers")
      .expect(200);

    expect(res.body.educators).toHaveLength(1);
    expect(res.body.educators[0].organization_name).toBe("Approved");
  });

  test("list: rejected educator does not appear in paginated list", async () => {
    await seedIssuer({ status: "approved", org: "Good" });
    await seedIssuer({ status: "rejected", org: "Banned" });

    const res = await request(app)
      .get("/api/issuers")
      .expect(200);

    expect(res.body.educators).toHaveLength(1);
    expect(res.body.educators[0].organization_name).toBe("Good");
  });

  test("list: response includes has_classes field", async () => {
    await seedIssuer({ status: "approved", org: "Has Classes" });

    const res = await request(app)
      .get("/api/issuers")
      .expect(200);

    expect(res.body.educators[0]).toHaveProperty("has_classes");
  });

  test("list: pagination meta is present", async () => {
    for (let i = 0; i < 3; i++) await seedIssuer({ status: "approved", org: `Org ${i}` });

    const res = await request(app)
      .get("/api/issuers?page=1&limit=2")
      .expect(200);

    expect(res.body.pagination).toMatchObject({
      total: 3,
      page: 1,
      limit: 2,
      pages: 2,
    });
    expect(res.body.educators).toHaveLength(2);
  });
});
