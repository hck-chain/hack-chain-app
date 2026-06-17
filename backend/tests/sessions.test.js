// backend/tests/sessions.test.js
//
// Session management route tests. SQLite in-memory for DB, Redis mocked.
// The critical invariant tested here: deleting a session via the sessions API
// must invalidate the Redis cache — otherwise the user stays authenticated
// for up to the Redis TTL even though the DB session is gone.

const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(15000);

const WALLET = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
}));

// Stub authenticate so tests don't need real tokens or a live Redis.
jest.mock("../middleware/auth", () => ({
  authenticate: (req, _res, next) => {
    req.auth = { wallet: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", role: "student" };
    next();
  },
}));

jest.mock("express-rate-limit", () => () => (req, res, next) => next());

describe("Sessions routes", () => {
  let sequelize;
  let User, UserSession;
  let app;
  let redisService;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    const Student = require("../models/students")(sequelize, DataTypes);
    const Issuer = require("../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);

    const modelsMock = {
      User, Student, Issuer, Recruiter, Certificate, UserSession,
      sequelize,
      Sequelize: SequelizePkg,
    };
    Object.values(modelsMock).forEach((m) => m?.associate && m.associate(modelsMock));

    redisService = require("../services/redis");

    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || "test_refresh_secret";

    await sequelize.sync({ force: true });
    await User.create({
      wallet_address: WALLET,
      role: "student",
      name: "Test User",
      nonce: crypto.randomBytes(16).toString("hex"),
      is_active: true,
    });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      const sessionsRoute = require("../routes/sessions");

      app = express();
      app.use(bodyParser.json());
      app.use(cookieParser());
      app.use("/api/sessions", sessionsRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  beforeEach(() => {
    redisService.deleteSession.mockClear();
  });

  async function createSession(walletAddress = WALLET, hoursFromNow = 8) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hoursFromNow);
    return UserSession.create({
      id: crypto.randomUUID(),
      wallet_address: walletAddress,
      expires_at: expiresAt,
    });
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/sessions/:session_id
  // ---------------------------------------------------------------------------

  test("DELETE /:id — removes session from DB", async () => {
    const session = await createSession();

    await request(app)
      .delete(`/api/sessions/${session.id}`)
      .expect(200);

    const found = await UserSession.findByPk(session.id);
    expect(found).toBeNull();
  });

  test("DELETE /:id — calls deleteSession to invalidate Redis cache", async () => {
    const session = await createSession();

    await request(app)
      .delete(`/api/sessions/${session.id}`)
      .expect(200);

    expect(redisService.deleteSession).toHaveBeenCalledTimes(1);
    expect(redisService.deleteSession).toHaveBeenCalledWith(WALLET);
  });

  test("DELETE /:id — returns 404 for non-existent session", async () => {
    await request(app)
      .delete(`/api/sessions/${crypto.randomUUID()}`)
      .expect(404);

    expect(redisService.deleteSession).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/sessions/user/:wallet_address
  // ---------------------------------------------------------------------------

  test("DELETE /user/:wallet — removes all user sessions from DB", async () => {
    await createSession();
    await createSession();

    await request(app)
      .delete(`/api/sessions/user/${WALLET}`)
      .expect(200);

    const remaining = await UserSession.findAll({ where: { wallet_address: WALLET } });
    expect(remaining).toHaveLength(0);
  });

  test("DELETE /user/:wallet — calls deleteSession to invalidate Redis cache", async () => {
    await createSession();

    await request(app)
      .delete(`/api/sessions/user/${WALLET}`)
      .expect(200);

    expect(redisService.deleteSession).toHaveBeenCalledTimes(1);
    expect(redisService.deleteSession).toHaveBeenCalledWith(WALLET);
  });

  test("DELETE /user/:wallet — works even when user has zero sessions", async () => {
    const res = await request(app)
      .delete(`/api/sessions/user/${WALLET}`)
      .expect(200);

    expect(res.body.message).toMatch(/0 sessions deleted/);
    expect(redisService.deleteSession).toHaveBeenCalledWith(WALLET);
  });
});
