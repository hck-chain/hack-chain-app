// backend/tests/email-uniqueness.test.js
//
// Validation and security tests for the email-uniqueness fix in POST /api/users/register.
// Uses SQLite in-memory so it never touches the production DB.
// All external services (redis, email, harjoot, on-chain authorizeIssuer) are mocked.

const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const TEST_JWT_SECRET = "test_jwt_secret_email_suite";

jest.setTimeout(20000);

jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
  getRedis: jest.fn(),
}));
jest.mock("../services/authorizeIssuer", () => ({
  authorizeIssuer: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../services/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../harjoot/client", () => ({
  createHarjootClient: jest.fn().mockReturnValue({}),
}));
jest.mock("../harjoot/usecases/activateMembership", () => ({
  activateMembership: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../harjoot/usecases/claimInvitation", () => ({
  claimInvitation: jest.fn().mockResolvedValue(undefined),
}));

const WALLET_A = "0x" + "aa".repeat(20);
const WALLET_B = "0x" + "bb".repeat(20);
const WALLET_C = "0x" + "cc".repeat(20);
const WALLET_D = "0x" + "dd".repeat(20);
const WALLET_E = "0x" + "ee".repeat(20);

describe("Register — email uniqueness and validation", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, UserSession;
  let app;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    Student = require("../models/students")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);

    const modelsMock = {
      User, Student, Issuer, Recruiter, Certificate, UserSession,
      sequelize,
      Sequelize: SequelizePkg,
      Op: SequelizePkg.Op,
    };

    Object.values(modelsMock).forEach((m) => m?.associate && m.associate(modelsMock));

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => ({
        ...modelsMock,
        default: modelsMock,
      }));
      jest.doMock("../middleware/auth", () => ({
        signToken: (payload) => jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: "1h" }),
        signRefreshToken: (payload) => jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: "7d" }),
        setAuthCookies: jest.fn(),
        authenticate: (req, res, next) => next(),
      }));

      const usersRoute = require("../routes/users");
      app = express();
      app.use(bodyParser.json());
      app.use(cookieParser());
      app.use("/api/users", usersRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  // ---------------------------------------------------------------------------
  // Happy paths
  // ---------------------------------------------------------------------------

  test("registers a student with unique email — returns 201", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ wallet_address: WALLET_A, role: "student", name: "Ana", lastname: "Garcia", email: "ana@example.com" })
      .expect(201);

    expect(res.body.message).toMatch(/registered/i);
    expect(res.body.user).toHaveProperty("wallet_address", WALLET_A.toLowerCase());
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.body.user).not.toHaveProperty("nonce");
  });

  test("registers an issuer with unique email — returns 201", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ wallet_address: WALLET_B, role: "issuer", organization_name: "HackAcademy", email: "issuer@example.com" })
      .expect(201);

    expect(res.body.user.role).toBe("issuer");
  });

  test("stores email in lowercase regardless of input casing", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: WALLET_C, role: "student", name: "Bob", lastname: "Smith", email: "BOB@Example.COM" })
      .expect(201);

    const stored = await User.findOne({ where: { wallet_address: WALLET_C.toLowerCase() } });
    expect(stored.email).toBe("bob@example.com");
  });

  // ---------------------------------------------------------------------------
  // Email uniqueness — 409
  // ---------------------------------------------------------------------------

  test("rejects second registration with the same email (different wallet) — 409", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ wallet_address: WALLET_D, role: "student", name: "Dup", lastname: "User", email: "ana@example.com" })
      .expect(409);

    expect(res.body.error).toMatch(/email already in use/i);
  });

  test("email uniqueness check is case-insensitive — 409", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ wallet_address: WALLET_E, role: "student", name: "Dup", lastname: "Case", email: "ANA@EXAMPLE.COM" })
      .expect(409);

    expect(res.body.error).toMatch(/email already in use/i);
  });

  test("rejects duplicate wallet address — 409", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ wallet_address: WALLET_A, role: "student", name: "Again", lastname: "Again", email: "new@example.com" })
      .expect(409);

    expect(res.body.error).toMatch(/already registered/i);
  });

  // ---------------------------------------------------------------------------
  // Email format validation — 400
  // ---------------------------------------------------------------------------

  test("rejects registration with invalid email format — 400", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "11".repeat(20), role: "student", name: "X", lastname: "Y", email: "notanemail" })
      .expect(400);

    expect(res.body.error).toMatch(/email/i);
  });

  test("rejects email missing TLD — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "12".repeat(20), role: "student", name: "X", lastname: "Y", email: "user@nodomain" })
      .expect(400);
  });

  test("rejects email that is an empty string — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "13".repeat(20), role: "student", name: "X", lastname: "Y", email: "" })
      .expect(400);
  });

  test("rejects non-string email — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "14".repeat(20), role: "student", name: "X", lastname: "Y", email: 12345 })
      .expect(400);
  });

  // ---------------------------------------------------------------------------
  // Field validation — 400
  // ---------------------------------------------------------------------------

  test("rejects name longer than 50 characters — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({
        wallet_address: "0x" + "15".repeat(20),
        role: "student",
        name: "A".repeat(51),
        lastname: "Lopez",
        email: "toolong@example.com",
      })
      .expect(400);
  });

  test("rejects non-string name — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "16".repeat(20), role: "student", name: 99, lastname: "L", email: "num@example.com" })
      .expect(400);
  });

  test("rejects organization_name longer than 255 characters — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({
        wallet_address: "0x" + "17".repeat(20),
        role: "issuer",
        organization_name: "O".repeat(256),
        email: "bigorg@example.com",
      })
      .expect(400);
  });

  // ---------------------------------------------------------------------------
  // Missing required fields per role — 400
  // ---------------------------------------------------------------------------

  test("student missing lastname — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "18".repeat(20), role: "student", name: "X", email: "ok@example.com" })
      .expect(400);
  });

  test("issuer missing organization_name — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "19".repeat(20), role: "issuer", email: "ok2@example.com" })
      .expect(400);
  });

  test("invalid role — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "20".repeat(20), role: "admin", name: "X", lastname: "Y", email: "ok3@example.com" })
      .expect(400);
  });

  test("invalid wallet address — 400", async () => {
    await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0xinvalid", role: "student", name: "X", lastname: "Y", email: "ok4@example.com" })
      .expect(400);
  });

  // ---------------------------------------------------------------------------
  // Security — sensitive fields not exposed
  // ---------------------------------------------------------------------------

  test("response never exposes nonce, passwordHash, or verification_token", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ wallet_address: "0x" + "ff".repeat(20), role: "student", name: "Clean", lastname: "User", email: "clean@example.com" })
      .expect(201);

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/nonce/);
    expect(body).not.toMatch(/passwordHash/);
    expect(body).not.toMatch(/verification_token/);
  });
});
