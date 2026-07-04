// backend/tests/issuers.test.js
//
// Tests for the issuer share counter:
//   POST /api/issuers/:wallet/share  and  share_count in GET /api/issuers/:wallet_address
// Covers: 200 with share_count, 404 unknown wallet, 400 malformed wallet.

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

describe("Issuer share counter", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession;
  let app;

  const makeWallet = () => "0x" + crypto.randomBytes(20).toString("hex");

  const seedIssuer = async ({ wallet, status = "approved", org = "Org" } = {}) => {
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
      certificates_issued: 0,
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

    sequelize.random = () => SequelizePkg.literal("RANDOM()");

    await sequelize.sync({ force: true });

    process.env.JWT_SECRET = "test-issuers-secret";
    process.env.REFRESH_SECRET = "test-issuers-refresh";

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
  // POST /api/issuers/:wallet/share
  // -------------------------------------------------------------------------

  test("share: 200 increments share_count from 0 to 1", async () => {
    const wallet = await seedIssuer();

    const res = await request(app)
      .post(`/api/issuers/${wallet}/share`)
      .expect(200);

    expect(res.body).toEqual({ success: true, share_count: 1 });
  });

  test("share: consecutive posts keep incrementing", async () => {
    const wallet = await seedIssuer();

    await request(app).post(`/api/issuers/${wallet}/share`).expect(200);
    const res = await request(app)
      .post(`/api/issuers/${wallet}/share`)
      .expect(200);

    expect(res.body.share_count).toBe(2);
  });

  test("share: 404 when the wallet does not belong to any issuer", async () => {
    const res = await request(app)
      .post(`/api/issuers/${makeWallet()}/share`)
      .expect(404);

    expect(res.body).toHaveProperty("error");
  });

  test("share: 400 when the wallet is malformed", async () => {
    const res = await request(app)
      .post("/api/issuers/not-a-wallet/share")
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });

  // -------------------------------------------------------------------------
  // GET /api/issuers/:wallet_address — share_count is exposed
  // -------------------------------------------------------------------------

  test("profile: GET exposes share_count and reflects the current value", async () => {
    const wallet = await seedIssuer();

    const before = await request(app).get(`/api/issuers/${wallet}`).expect(200);
    expect(before.body.issuer).toHaveProperty("share_count", 0);

    await request(app).post(`/api/issuers/${wallet}/share`).expect(200);

    const after = await request(app).get(`/api/issuers/${wallet}`).expect(200);
    expect(after.body.issuer.share_count).toBe(1);
  });
});
