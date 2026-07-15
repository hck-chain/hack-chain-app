// backend/tests/issuers-discovery.test.js
//
// Regression test for the discovery/share routes refactor
// (routes/issuers.js -> usecases/issuers/{listIssuers,incrementIssuerCertificatesIssued,
// getIssuerBusySlots,getIssuerCertificatesCount,registerIssuerProfileShare}).
// Confirms the HTTP contract (status codes + response bodies) is byte-identical
// to the pre-refactor inline implementation. GET /featured and POST /authorize
// were left untouched — they already delegated to services with no inline logic.

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
jest.mock("../services/emailService", () => ({ notifyAdminEducatorReapply: jest.fn() }));
jest.mock("../services/adminService", () => ({ getAdminEmails: jest.fn().mockResolvedValue([]) }));
jest.mock("../services/authorizeIssuer.js", () => ({ authorizeIssuer: jest.fn() }));
jest.mock("../services/issuerDiscoveryService", () => ({ getFeaturedIssuers: jest.fn().mockResolvedValue([]) }));
jest.mock("../services/issuerService", () => ({ validateDeletionMessage: jest.fn(), deleteIssuerAccount: jest.fn() }));

describe("Issuer discovery and share routes", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession, ClassRequest, IssuerClass;
  let app;

  const ISSUER = "0x" + "bb".repeat(20);
  const OTHER = "0x" + "cc".repeat(20);

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    Student = require("../models/students")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);
    ClassRequest = require("../models/classRequests")(sequelize, DataTypes);
    IssuerClass = require("../models/issuerClasses")(sequelize, DataTypes);

    const modelsMock = { User, Student, Issuer, Recruiter, Certificate, UserSession, ClassRequest, IssuerClass, sequelize, Sequelize: SequelizePkg };
    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = { wallet: req.headers["x-test-wallet"] || ISSUER, role: "issuer" };
          next();
        },
      }));
      jest.doMock("../middleware/requireAdmin", () => ({ requireAdmin: (req, res, next) => next() }));

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
    await User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: crypto.randomBytes(16).toString("hex"), educator_approval_status: "approved" });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", certificates_issued: 3, share_count: 1 });
  });

  // ---- GET / ----

  test("GET /: 200 lists only approved educators", async () => {
    const res = await request(app).get("/api/issuers").expect(200);
    expect(res.body.educators).toHaveLength(1);
    expect(res.body.educators[0].organization_name).toBe("HackAcademy");
    expect(res.body.pagination).toEqual({ total: 1, page: 1, limit: 20, pages: 1 });
  });

  // ---- POST /increment-certificates ----

  test("POST /increment-certificates: 403 for another issuer's wallet", async () => {
    const res = await request(app)
      .post("/api/issuers/increment-certificates")
      .send({ issuerWallet: OTHER })
      .expect(403);
    expect(res.body).toEqual({ error: "Cannot increment certificates for another issuer" });
  });

  test("POST /increment-certificates: 200 increments own counter", async () => {
    const res = await request(app)
      .post("/api/issuers/increment-certificates")
      .send({ issuerWallet: ISSUER })
      .expect(200);
    expect(res.body).toEqual({ success: true });
  });

  // ---- GET /:wallet/busy-slots ----

  test("GET /:wallet/busy-slots: 400 for a malformed wallet", async () => {
    const res = await request(app).get("/api/issuers/not-a-wallet/busy-slots").expect(400);
    expect(res.body).toEqual({ error: "Invalid wallet address" });
  });

  test("GET /:wallet/busy-slots: 200 with an empty list when there are none", async () => {
    const res = await request(app).get(`/api/issuers/${ISSUER}/busy-slots`).expect(200);
    expect(res.body).toEqual({ slots: [] });
  });

  // ---- GET /:wallet/certificates-count ----

  test("GET /:wallet/certificates-count: 200 with the total", async () => {
    const res = await request(app).get(`/api/issuers/${ISSUER}/certificates-count`).expect(200);
    expect(res.body).toEqual({ total: 3 });
  });

  test("GET /:wallet/certificates-count: 200 with 0 for an unknown wallet", async () => {
    const res = await request(app).get(`/api/issuers/${OTHER}/certificates-count`).expect(200);
    expect(res.body).toEqual({ total: 0 });
  });

  // ---- POST /:wallet/share ----

  test("POST /:wallet/share: 404 for an unknown wallet", async () => {
    const res = await request(app).post(`/api/issuers/${OTHER}/share`).expect(404);
    expect(res.body).toEqual({ error: "Issuer not found" });
  });

  test("POST /:wallet/share: 200 increments the share counter", async () => {
    const res = await request(app).post(`/api/issuers/${ISSUER}/share`).expect(200);
    expect(res.body).toEqual({ success: true, share_count: 2 });
  });
});
