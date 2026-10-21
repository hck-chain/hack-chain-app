// HTTP behaviour of the Privy parts of routes/auth.js that the usecase tests cannot see:
// the admin notice on educator registration and the extra fields of GET /api/auth/me.
// The real router and the real authenticate middleware run against an in-memory SQLite.
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

jest.setTimeout(20000);

jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
  getRedis: () => ({ call: jest.fn(), set: jest.fn() }),
}));
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("../services/privyService", () => ({
  verifyAccessToken: jest.fn(),
  verifyIdentityToken: jest.fn(),
}));
jest.mock("../services/authorizeIssuer", () => ({ authorizeIssuer: jest.fn() }));
jest.mock("../services/emailService", () => ({
  sendVerificationEmail: jest.fn(),
  notifyAdminNewEducator: jest.fn(),
}));
jest.mock("../services/adminService", () => ({ getAdminEmails: jest.fn() }));

const DID = "did:privy:abc123";
const EMBEDDED = "0x" + "ab".repeat(20);
const LEGACY_WALLET = "0x" + "11".repeat(20);

// Lets the detached notification settle before asserting on it.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("Privy routes in routes/auth.js", () => {
  let app, sequelize, models, privyService, emailService, adminService;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || "test_refresh_secret";

    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    const User = require("../models/users")(sequelize, DataTypes);
    const Student = require("../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    const Issuer = require("../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    const UserSession = require("../models/userSessions")(sequelize, DataTypes);
    const Certificate = require("../models/certificates")(sequelize, DataTypes);

    models = {
      User, Student, Issuer, Recruiter, UserSession, Certificate,
      sequelize, Sequelize: SequelizePkg,
    };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));

    privyService = require("../services/privyService");
    emailService = require("../services/emailService");
    adminService = require("../services/adminService");

    jest.isolateModules(() => {
      jest.doMock("../models", () => models);
      const authRoute = require("../routes/auth");
      app = express();
      app.use(bodyParser.json());
      app.use(cookieParser());
      app.use("/api/auth", authRoute);
    });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    jest.clearAllMocks();
    privyService.verifyIdentityToken.mockResolvedValue({
      did: DID,
      email: "nuevo@hackchain.test",
      embeddedWallet: EMBEDDED,
    });
    adminService.getAdminEmails.mockResolvedValue(["admin@hackchain.test"]);
    emailService.notifyAdminNewEducator.mockResolvedValue(undefined);
    require("../services/authorizeIssuer").authorizeIssuer.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await sequelize.close();
  });

  const registrationToken = (did = DID) =>
    jwt.sign({ did, purpose: "privy_registration" }, process.env.JWT_SECRET, { expiresIn: "10m" });

  function register(body = {}) {
    return request(app)
      .post("/api/auth/complete-registration")
      .send({
        registration_token: registrationToken(),
        identity_token: "id-token",
        role: "issuer",
        name: "Ana",
        lastname: "Perez",
        organization_name: "Academia Cripto",
        ...body,
      });
  }

  describe("POST /complete-registration: notice to admins", () => {
    it("notifies the admins once when an educator registers", async () => {
      const res = await register();
      expect(res.status).toBe(201);

      await flush();
      expect(emailService.notifyAdminNewEducator).toHaveBeenCalledTimes(1);
      expect(emailService.notifyAdminNewEducator).toHaveBeenCalledWith({
        to: ["admin@hackchain.test"],
        name: "Ana",
        email: "nuevo@hackchain.test",
        wallet: EMBEDDED,
        organization: "Academia Cripto",
      });
    });

    it("still answers 201 when sending the notice fails", async () => {
      emailService.notifyAdminNewEducator.mockRejectedValue(new Error("resend down"));
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await register();
      expect(res.status).toBe(201);
      await flush();

      expect(emailService.notifyAdminNewEducator).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("notifyAdminNewEducator failed"), "resend down");
      spy.mockRestore();
    });

    it("still answers 201 when the admin lookup fails", async () => {
      adminService.getAdminEmails.mockRejectedValue(new Error("db hiccup"));
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await register();
      expect(res.status).toBe(201);
      await flush();

      expect(emailService.notifyAdminNewEducator).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("does not answer 201 before the educator is actually created", async () => {
      const res = await register();
      expect(res.status).toBe(201);
      expect(await models.User.count({ where: { privy_did: DID, role: "issuer" } })).toBe(1);
    });

    it("does not notify for a student", async () => {
      const res = await register({ role: "student", organization_name: undefined });
      expect(res.status).toBe(201);
      await flush();
      expect(emailService.notifyAdminNewEducator).not.toHaveBeenCalled();
    });

    it("does not notify again when the registration is retried", async () => {
      expect((await register()).status).toBe(201);
      await flush();
      emailService.notifyAdminNewEducator.mockClear();

      const retry = await register();
      expect(retry.status).toBe(200);
      await flush();
      expect(emailService.notifyAdminNewEducator).not.toHaveBeenCalled();
    });

    it("does not notify when the registration is refused", async () => {
      const res = await register({ organization_name: undefined });
      expect(res.status).toBe(400);
      await flush();
      expect(emailService.notifyAdminNewEducator).not.toHaveBeenCalled();
    });
  });

  describe("GET /me: Privy fields", () => {
    async function login(role, attrs = {}) {
      const wallet = attrs.wallet_address || LEGACY_WALLET;
      const user = await models.User.create({
        wallet_address: wallet,
        role,
        name: "Ana",
        email: "ana@hackchain.test",
        nonce: crypto.randomBytes(16).toString("hex"),
        is_active: true,
        ...attrs,
      });
      if (role === "student") await models.Student.create({ wallet_address: wallet });
      if (role === "issuer") await models.Issuer.create({ wallet_address: wallet, organization_name: "Academia" });
      if (role === "recruiter") await models.Recruiter.create({ wallet_address: wallet, company_name: "TechCorp" });

      await models.UserSession.create({
        id: crypto.randomUUID(),
        wallet_address: wallet,
        expires_at: new Date(Date.now() + 3600 * 1000),
      });
      const token = jwt.sign({ sub: user.id, role, wallet }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    }

    it.each(["student", "issuer", "recruiter"])("exposes the Privy fields for a %s", async (role) => {
      const res = await login(role, {
        privy_did: DID,
        integrated_wallet_address: EMBEDDED,
        own_wallet_address: "0x" + "22".repeat(20),
      });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({
        wallet_address: LEGACY_WALLET,
        email: "ana@hackchain.test",
        integrated_wallet_address: EMBEDDED,
        own_wallet_address: "0x" + "22".repeat(20),
        has_privy: true,
      });
      expect(res.body.user.created_at).toBeTruthy();
    });

    it("reports has_privy false and null wallets for a user who has not migrated", async () => {
      const res = await login("student");
      expect(res.status).toBe(200);
      expect(res.body.user.has_privy).toBe(false);
      expect(res.body.user.integrated_wallet_address).toBeNull();
      expect(res.body.user.own_wallet_address).toBeNull();
    });

    it("never returns the Privy DID", async () => {
      const res = await login("student", { privy_did: DID });
      expect(res.body.user.has_privy).toBe(true);
      expect(JSON.stringify(res.body)).not.toContain("did:privy");
      expect(res.body.user).not.toHaveProperty("privy_did");
    });

    it("keeps the fields that were already part of the response", async () => {
      const res = await login("issuer");
      expect(res.body.modelName).toBe("issuer");
      expect(res.body.user).toMatchObject({
        name: "Ana",
        organization_name: "Academia",
        email_verified: false,
      });
    });
  });
});
