// HTTP wiring for the Privy endpoints. The usecases are covered by their own unit
// tests; what matters here is route order, auth and status mapping — in particular that
// /me/... is matched before /:wallet_address, which Express would otherwise swallow.
const express = require("express");
const bodyParser = require("body-parser");
const request = require("supertest");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(20000);

jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
  getRedis: () => ({ set: jest.fn().mockResolvedValue("OK"), call: jest.fn() }),
}));
jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("../services/privyService", () => ({
  verifyAccessToken: jest.fn(),
  verifyIdentityToken: jest.fn(),
}));

const SESSION_WALLET = "0x" + "11".repeat(20);
const OWN_WALLET = "0x" + "22".repeat(20);
const DID = "did:privy:abc123";

describe("Privy routes", () => {
  let app, sequelize, models, privyService;

  beforeAll(async () => {
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

    jest.isolateModules(() => {
      jest.doMock("../models", () => models);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          if (req.headers["x-test-noauth"]) return res.status(401).json({ error: "unauth" });
          req.auth = { wallet: req.headers["x-test-wallet"] || SESSION_WALLET, role: "student", sub: 1 };
          next();
        },
        signToken: () => "access",
        signRefreshToken: () => "refresh",
        setAuthCookies: () => {},
        setAccessCookie: () => {},
        clearAuthCookies: () => {},
        verifyRefreshToken: () => ({}),
        getUserFromToken: async () => null,
      }));
      jest.doMock("../services/issuerService", () => ({
        validateDeletionMessage: jest.fn().mockReturnValue({ ok: true }),
      }));

      const usersRoute = require("../routes/users");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/users", usersRoute);
    });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    jest.clearAllMocks();
    await models.User.create({
      wallet_address: SESSION_WALLET,
      role: "student",
      email: "talento@hackchain.test",
      nonce: crypto.randomBytes(16).toString("hex"),
      is_active: true,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("matches /me/wallet as its own route, not as a wallet address", async () => {
    const res = await request(app)
      .post("/api/users/me/wallet")
      .send({ own_wallet_address: OWN_WALLET, message: "Nonce: n1", signature: "0xsig" });

    expect(res.status).toBe(200);
    expect(res.body.own_wallet_address).toBe(OWN_WALLET);
  });

  it("requires a session on POST /me/wallet", async () => {
    const res = await request(app)
      .post("/api/users/me/wallet")
      .set("x-test-noauth", "1")
      .send({ own_wallet_address: OWN_WALLET, message: "Nonce: n1", signature: "0xsig" });

    expect(res.status).toBe(401);
  });

  it("maps a bad address to 400", async () => {
    const res = await request(app)
      .post("/api/users/me/wallet")
      .send({ own_wallet_address: "0xnope", message: "Nonce: n1", signature: "0xsig" });

    expect(res.status).toBe(400);
  });

  it("unlinks through DELETE /me/wallet", async () => {
    await models.User.update({ own_wallet_address: OWN_WALLET }, { where: { wallet_address: SESSION_WALLET } });
    const res = await request(app).delete("/api/users/me/wallet");

    expect(res.status).toBe(200);
    expect(res.body.own_wallet_address).toBeNull();
  });

  it("returns 409 from DELETE /me/wallet when nothing is linked", async () => {
    const res = await request(app).delete("/api/users/me/wallet");
    expect(res.status).toBe(409);
  });

  it("binds a Privy identity through POST /me/link-privy", async () => {
    privyService.verifyIdentityToken.mockResolvedValue({
      did: DID,
      email: "migrado@hackchain.test",
      embeddedWallet: "0x" + "44".repeat(20),
    });

    const res = await request(app)
      .post("/api/users/me/link-privy")
      .send({ identity_token: "id-token" });

    expect(res.status).toBe(200);
    expect(res.body.privy_did).toBe(DID);

    const user = await models.User.findOne({ where: { wallet_address: SESSION_WALLET } });
    expect(user.wallet_address).toBe(SESSION_WALLET);
    expect(user.privy_did).toBe(DID);
  });

  it("maps an invalid identity token to 401", async () => {
    privyService.verifyIdentityToken.mockResolvedValue(null);
    const res = await request(app)
      .post("/api/users/me/link-privy")
      .send({ identity_token: "bad" });

    expect(res.status).toBe(401);
  });
});
