// backend/tests/issuers-profile.test.js
//
// Regression test for the issuer profile routes refactor
// (routes/issuers.js -> usecases/issuers/{getOwnIssuerProfile,getIssuerApprovalStatus,
// reapplyForApproval,updateOwnIssuerProfile,updateIssuerPhoto,getPublicIssuerProfile,
// updatePublicIssuerProfile,deleteOwnIssuerAccount}).
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
jest.mock("../services/emailService", () => ({
  notifyAdminEducatorReapply: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../services/adminService", () => ({
  getAdminEmails: jest.fn().mockResolvedValue([]),
}));
jest.mock("../services/authorizeIssuer.js", () => ({
  authorizeIssuer: jest.fn(),
}));
jest.mock("../services/issuerDiscoveryService", () => ({
  getFeaturedIssuers: jest.fn().mockResolvedValue([]),
}));
jest.mock("../services/issuerService", () => ({
  validateDeletionMessage: jest.fn(),
  deleteIssuerAccount: jest.fn(),
}));

describe("Issuer profile routes", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession;
  let app;
  let validateDeletionMessage, deleteIssuerAccount;

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

    ({ validateDeletionMessage, deleteIssuerAccount } = require("../services/issuerService"));

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = {
            wallet: req.headers["x-test-wallet"] || ISSUER,
            role: req.headers["x-test-role"] || "issuer",
            sub: req.headers["x-test-sub"] ? Number(req.headers["x-test-sub"]) : undefined,
          };
          next();
        },
      }));
      jest.doMock("../middleware/requireAdmin", () => ({
        requireAdmin: (req, res, next) => next(),
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

  let issuerUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    await sequelize.sync({ force: true });
    issuerUser = await User.create({
      wallet_address: ISSUER, role: "issuer", name: "Prof", lastname: "Ok",
      email: "prof@x.com", email_verified: true, nonce: crypto.randomBytes(16).toString("hex"),
    });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
  });

  // ---- GET /me ----

  test("GET /me: 200 with the full profile", async () => {
    const res = await request(app).get("/api/issuers/me").expect(200);
    expect(res.body).toEqual({
      organization_name: "HackAcademy",
      bio: null,
      photo_url: null,
      certificate_logo_url: null,
      knowledge_areas: [],
      wallet_address: ISSUER,
      email: "prof@x.com",
      name: "Prof",
      lastname: "Ok",
      email_verified: true,
    });
  });

  test("GET /me: 403 for a non-issuer role", async () => {
    const res = await request(app).get("/api/issuers/me").set("x-test-role", "student").expect(403);
    expect(res.body).toEqual({ error: "Only educator accounts can access this endpoint" });
  });

  // ---- GET /me/status ----

  test("GET /me/status: 200 defaults to pending_approval", async () => {
    const res = await request(app).get("/api/issuers/me/status").set("x-test-sub", String(issuerUser.id)).expect(200);
    expect(res.body).toEqual({ status: "pending_approval" });
  });

  // ---- POST /me/reapply ----

  test("POST /me/reapply: 409 when not rejected", async () => {
    const res = await request(app)
      .post("/api/issuers/me/reapply")
      .set("x-test-sub", String(issuerUser.id))
      .expect(409);
    expect(res.body).toEqual({ error: "Only rejected accounts can re-apply" });
  });

  test("POST /me/reapply: 200 moves a rejected account to pending_approval", async () => {
    await issuerUser.update({ educator_approval_status: "rejected", rejection_reason: "x" });
    const res = await request(app)
      .post("/api/issuers/me/reapply")
      .set("x-test-sub", String(issuerUser.id))
      .expect(200);
    expect(res.body).toEqual({ status: "pending_approval" });
  });

  // ---- PATCH /me ----

  test("PATCH /me: 400 with the exact original message for an invalid bio", async () => {
    const res = await request(app).patch("/api/issuers/me").send({ bio: 123 }).expect(400);
    expect(res.body).toEqual({ error: "bio must be a string" });
  });

  test("PATCH /me: 200 updates the profile", async () => {
    const res = await request(app).patch("/api/issuers/me").send({ bio: "hello" }).expect(200);
    expect(res.body).toEqual({
      message: "Profile updated",
      issuer: { organization_name: "HackAcademy", bio: "hello", knowledge_areas: [], photo_url: null },
    });
  });

  // ---- PATCH /me/photo ----

  test("PATCH /me/photo: 400 for a non-ipfs URL", async () => {
    const res = await request(app).patch("/api/issuers/me/photo").send({ photo_url: "https://x.com/a.png" }).expect(400);
    expect(res.body).toEqual({ error: "photo_url must be a valid ipfs:// URI" });
  });

  test("PATCH /me/photo: 200 updates the photo", async () => {
    const res = await request(app).patch("/api/issuers/me/photo").send({ photo_url: "ipfs://abc" }).expect(200);
    expect(res.body).toEqual({ photo_url: "ipfs://abc" });
  });

  // ---- DELETE /me ----

  test("DELETE /me: 400 when signature/message are missing", async () => {
    const res = await request(app).delete("/api/issuers/me").send({}).expect(400);
    expect(res.body).toEqual({ error: "signature and message are required" });
  });

  test("DELETE /me: 401 when the signature is invalid", async () => {
    validateDeletionMessage.mockReturnValue({ ok: false, error: "Signature mismatch" });
    const res = await request(app).delete("/api/issuers/me").send({ signature: "s", message: "m" }).expect(401);
    expect(res.body).toEqual({ error: "Signature mismatch" });
  });

  test("DELETE /me: 204 when the signature is valid", async () => {
    validateDeletionMessage.mockReturnValue({ ok: true });
    deleteIssuerAccount.mockResolvedValue(undefined);
    await request(app).delete("/api/issuers/me").send({ signature: "s", message: "m" }).expect(204);
    expect(deleteIssuerAccount).toHaveBeenCalledWith(ISSUER);
  });

  // ---- GET /:wallet_address ----

  test("GET /:wallet_address: 400 for a malformed wallet", async () => {
    const res = await request(app).get("/api/issuers/not-a-wallet").expect(400);
    expect(res.body).toEqual({ error: "Invalid wallet address" });
  });

  test("GET /:wallet_address: 200 with the public profile (no email)", async () => {
    const res = await request(app).get(`/api/issuers/${ISSUER}`).expect(200);
    expect(res.body.issuer).not.toHaveProperty("email");
    expect(res.body.issuer.organization_name).toBe("HackAcademy");
    expect(res.body.issuer.wallet_address).toBe(ISSUER);
  });

  // ---- PUT /:wallet_address ----

  test("PUT /:wallet_address: 403 when updating another issuer's profile", async () => {
    const other = "0x" + "cc".repeat(20);
    const res = await request(app).put(`/api/issuers/${other}`).send({ bio: "x" }).expect(403);
    expect(res.body).toEqual({ error: "Forbidden: cannot modify another issuer's profile" });
  });

  test("PUT /:wallet_address: 200 updates own profile", async () => {
    const res = await request(app).put(`/api/issuers/${ISSUER}`).send({ bio: "updated" }).expect(200);
    expect(res.body).toEqual({ message: "Issuer updated successfully" });
  });
});
