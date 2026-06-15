// backend/tests/jwt-sub-user-id.test.js
//
// Regression tests for the bug where login set JWT sub = role-model PK (Issuer.id)
// instead of User.id. This caused User.findByPk(sub) calls (referral code,
// approval status, reapply) to hit the wrong DB row after re-login.
//
// The fix: login endpoint now uses baseUser.id (User.id) as sub, matching
// what the refresh endpoint already did correctly.

const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

jest.setTimeout(20000);

jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
}));

jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const buildSignMessage = (address, nonce) =>
  `HackChain wants you to sign in with your Ethereum account:\n${address}\n\nSign in to HackChain\n\nNonce: ${nonce}`;

const extractCookie = (res, name) => {
  const raw = res.headers["set-cookie"] || [];
  const hit = raw.find((c) => c.startsWith(`${name}=`));
  if (!hit) return null;
  return hit.split(";")[0].split("=")[1];
};

const signChallenge = async (User, wallet) => {
  const dbUser = await User.findOne({ where: { wallet_address: wallet.address.toLowerCase() } });
  const message = buildSignMessage(dbUser.wallet_address, dbUser.nonce);
  return wallet.signMessage(message);
};

describe("JWT sub must be User.id, not role-model PK", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, Certificate, UserSession;
  let app;

  // Deterministic wallets
  const issuerWallet = new ethers.Wallet("0x" + "aa".repeat(32));
  const studentWallet = new ethers.Wallet("0x" + "bb".repeat(32));

  const ISSUER_WALLET = issuerWallet.address.toLowerCase();
  const STUDENT_WALLET = studentWallet.address.toLowerCase();

  let userIssuer, userStudent, issuer, student;

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

    Object.values(modelsMock).forEach((model) => {
      if (model?.associate) model.associate(modelsMock);
    });

    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_sub";
    process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || "test_refresh_secret_sub";
    process.env.JWT_EXPIRES_IN = "1h";

    await sequelize.sync({ force: true });

    // Create a student user FIRST so User.id = 1, Student.id = 1
    userStudent = await User.create({
      wallet_address: STUDENT_WALLET,
      role: "student",
      name: "Student One",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    student = await Student.create({ wallet_address: STUDENT_WALLET });

    // Create the issuer as the SECOND user: User.id = 2, but Issuer.id = 1.
    // This guarantees User.id !== Issuer.id, which exposes the bug.
    userIssuer = await User.create({
      wallet_address: ISSUER_WALLET,
      role: "issuer",
      name: "Issuer Two",
      nonce: crypto.randomBytes(16).toString("hex"),
      educator_approval_status: "approved",
      referral_code: "ISSREF01",
    });
    issuer = await Issuer.create({
      wallet_address: ISSUER_WALLET,
      organization_name: "Hack Academy",
    });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      const authRoute = require("../routes/auth");
      app = express();
      app.use(bodyParser.json());
      app.use(cookieParser());
      app.use("/api/auth", authRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  test("User.id and Issuer.id are different (precondition for this regression)", () => {
    // This is the condition that triggers the bug — if IDs are always equal
    // the bug is masked. We assert they diverge here to lock in the scenario.
    expect(userIssuer.id).not.toBe(issuer.id);
  });

  test("login: access_token sub equals User.id, not Issuer.id", async () => {
    const signature = await signChallenge(User, issuerWallet);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ISSUER_WALLET, signature })
      .expect(200);

    const token = extractCookie(res, "access_token");
    expect(token).toBeTruthy();

    const decoded = jwt.decode(token);
    // sub must equal the User.id (2), not the Issuer.id (1)
    expect(decoded.sub).toBe(userIssuer.id);
    expect(decoded.sub).not.toBe(issuer.id);
  });

  test("login: student access_token sub equals User.id, not Student.id", async () => {
    const signature = await signChallenge(User, studentWallet);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: STUDENT_WALLET, signature })
      .expect(200);

    const token = extractCookie(res, "access_token");
    const decoded = jwt.decode(token);

    // Student.id = 1, User.id = 1 in this case — they happen to be equal,
    // so we assert the sub equals User.id by identity.
    expect(decoded.sub).toBe(userStudent.id);
  });

  test("login twice: sub is consistent across re-logins", async () => {
    const sig1 = await signChallenge(User, issuerWallet);
    const res1 = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ISSUER_WALLET, signature: sig1 })
      .expect(200);

    const token1 = extractCookie(res1, "access_token");
    const sub1 = jwt.decode(token1).sub;

    // Second login (nonce was rotated)
    const sig2 = await signChallenge(User, issuerWallet);
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ISSUER_WALLET, signature: sig2 })
      .expect(200);

    const token2 = extractCookie(res2, "access_token");
    const sub2 = jwt.decode(token2).sub;

    // Both logins must produce the same sub (User.id is stable)
    expect(sub1).toBe(sub2);
    expect(sub1).toBe(userIssuer.id);
  });

  test("login sub matches what the refresh endpoint produces", async () => {
    const signature = await signChallenge(User, issuerWallet);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ISSUER_WALLET, signature })
      .expect(200);

    const loginToken = extractCookie(loginRes, "access_token");
    const loginRefresh = extractCookie(loginRes, "refresh_token");
    const loginSub = jwt.decode(loginToken).sub;

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${loginRefresh}`)
      .expect(200);

    const refreshToken = extractCookie(refreshRes, "access_token");
    const refreshSub = jwt.decode(refreshToken).sub;

    // Both paths must stamp the same sub (User.id)
    expect(loginSub).toBe(refreshSub);
    expect(loginSub).toBe(userIssuer.id);
  });
});
