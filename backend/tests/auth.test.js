// backend/tests/auth.test.js
//
// Wallet-login auth tests. Uses real ethers signatures against an in-memory
// SQLite so the production code path (signature recovery, nonce rotation,
// session lifecycle) is exercised end-to-end. Redis is mocked because the
// test runner has no Redis instance available.

const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { ethers } = require("ethers");

jest.setTimeout(20000);

// Redis is mocked: cache no-ops, sessionExists returns false so the auth
// middleware always falls back to the DB session check (which is what the
// suite actually wants to exercise).
jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
}));

// Disable the production rate limiter inside tests. The security suite issues
// many login attempts in a single second to exercise replay/impersonation
// rejection paths; the real 8-per-minute cap would falsely fail those.
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const buildSignMessage = (address, nonce) =>
  `HackChain wants you to sign in with your Ethereum account:\n${address}\n\nSign in to HackChain\n\nNonce: ${nonce}`;

/**
 * Sign the current login challenge for a wallet.
 * Reads the live nonce from DB so it always matches what the route expects.
 */
const signChallenge = async (User, wallet) => {
  const dbUser = await User.findOne({ where: { wallet_address: wallet.address.toLowerCase() } });
  const message = buildSignMessage(dbUser.wallet_address, dbUser.nonce);
  return wallet.signMessage(message);
};

const extractCookie = (res, name) => {
  const raw = res.headers["set-cookie"] || [];
  const hit = raw.find((c) => c.startsWith(`${name}=`));
  if (!hit) return null;
  return hit.split(";")[0].split("=")[1];
};

describe("Auth endpoints", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, Certificate, UserSession;
  let app;

  // Three real wallets — addresses are deterministic from the private keys.
  const studentWallet = new ethers.Wallet("0x" + "11".repeat(32));
  const issuerWallet = new ethers.Wallet("0x" + "22".repeat(32));
  const recruiterWallet = new ethers.Wallet("0x" + "33".repeat(32));

  const STUDENT_WALLET = studentWallet.address.toLowerCase();
  const ISSUER_WALLET = issuerWallet.address.toLowerCase();
  const RECRUITER_WALLET = recruiterWallet.address.toLowerCase();

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

    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || "test_refresh_secret";
    process.env.JWT_EXPIRES_IN = "1h";

    await sequelize.sync({ force: true });

    await User.create({ wallet_address: STUDENT_WALLET, role: "student", name: "Alice", nonce: crypto.randomBytes(16).toString("hex") });
    await Student.create({ wallet_address: STUDENT_WALLET });

    await User.create({ wallet_address: ISSUER_WALLET, role: "issuer", name: "Bob", nonce: crypto.randomBytes(16).toString("hex") });
    await Issuer.create({ wallet_address: ISSUER_WALLET, organization_name: "HackAcademy" });

    await User.create({ wallet_address: RECRUITER_WALLET, role: "recruiter", name: "Carol", nonce: crypto.randomBytes(16).toString("hex") });
    await Recruiter.create({ wallet_address: RECRUITER_WALLET, company_name: "TechCorp" });

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

  // ---------------------------------------------------------------------------
  // Login — happy paths (one per role)
  // ---------------------------------------------------------------------------

  test("login — valid student signature returns role + sets access cookie", async () => {
    const signature = await signChallenge(User, studentWallet);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: STUDENT_WALLET, signature })
      .expect(200);

    expect(res.body.user).toMatchObject({ role: "student", wallet_address: STUDENT_WALLET });
    expect(extractCookie(res, "access_token")).toBeTruthy();
    expect(extractCookie(res, "refresh_token")).toBeTruthy();
  });

  test("login — valid issuer signature returns issuer role", async () => {
    const signature = await signChallenge(User, issuerWallet);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ISSUER_WALLET, signature })
      .expect(200);

    expect(res.body.user).toMatchObject({ role: "issuer", wallet_address: ISSUER_WALLET });
  });

  test("login — valid recruiter signature returns recruiter role", async () => {
    const signature = await signChallenge(User, recruiterWallet);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: RECRUITER_WALLET, signature })
      .expect(200);

    expect(res.body.user).toMatchObject({ role: "recruiter", wallet_address: RECRUITER_WALLET });
  });

  // ---------------------------------------------------------------------------
  // /me — role dispatch
  // ---------------------------------------------------------------------------

  test("GET /me — student token returns sanitized student data", async () => {
    const signature = await signChallenge(User, studentWallet);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: STUDENT_WALLET, signature })
      .expect(200);

    const token = extractCookie(loginRes, "access_token");

    const { body } = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `access_token=${token}`)
      .expect(200);

    expect(body.modelName).toBe("student");
    expect(body.user).toHaveProperty("wallet_address", STUDENT_WALLET);
    expect(body.user).not.toHaveProperty("passwordHash");
    expect(body.user).not.toHaveProperty("privateKey");
  });

  test("GET /me — issuer token returns organization_name", async () => {
    const signature = await signChallenge(User, issuerWallet);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ISSUER_WALLET, signature })
      .expect(200);
    const token = extractCookie(loginRes, "access_token");

    const { body } = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `access_token=${token}`)
      .expect(200);

    expect(body.modelName).toBe("issuer");
    expect(body.user).toHaveProperty("organization_name", "HackAcademy");
  });

  test("GET /me — recruiter token returns company_name", async () => {
    const signature = await signChallenge(User, recruiterWallet);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: RECRUITER_WALLET, signature })
      .expect(200);
    const token = extractCookie(loginRes, "access_token");

    const { body } = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `access_token=${token}`)
      .expect(200);

    expect(body.modelName).toBe("recruiter");
    expect(body.user).toHaveProperty("company_name", "TechCorp");
  });

  test("GET /me — no token returns 401", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  test("logout — destroys session, follow-up requests return 401", async () => {
    const signature = await signChallenge(User, studentWallet);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: STUDENT_WALLET, signature })
      .expect(200);
    const token = extractCookie(loginRes, "access_token");

    await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `access_token=${token}`)
      .expect(200);

    // The JWT remains cryptographically valid until expiry, but the DB session
    // is gone, so authenticate() must reject it.
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", `access_token=${token}`)
      .expect(401);
  });

  test("logout — without token returns 401", async () => {
    await request(app).post("/api/auth/logout").expect(401);
  });
});

// =============================================================================
// Wallet-login security tests
//
// These tests target the signature-verification surface of POST /api/auth/login.
// Skipping or weakening this flow lets anyone log in as any registered wallet
// just by knowing the public address — see the conversation context for why
// the iOS workaround was rejected.
// =============================================================================

describe("Wallet-login security", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, Certificate, UserSession;
  let app;

  const victim = new ethers.Wallet("0x" + "aa".repeat(32));
  const attacker = new ethers.Wallet("0x" + "bb".repeat(32));
  const VICTIM_WALLET = victim.address.toLowerCase();
  const ATTACKER_WALLET = attacker.address.toLowerCase();

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
    Object.values(modelsMock).forEach((m) => m?.associate && m.associate(modelsMock));

    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
    process.env.REFRESH_SECRET = process.env.REFRESH_SECRET || "test_refresh_secret";

    await sequelize.sync({ force: true });

    // Only the victim is a registered user. The attacker is unregistered.
    await User.create({
      wallet_address: VICTIM_WALLET,
      role: "student",
      name: "Victim",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await Student.create({ wallet_address: VICTIM_WALLET });

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

  test("rejects login with no signature (validation 422)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: VICTIM_WALLET })
      .expect(422);

    expect(res.body.errors).toBeDefined();
  });

  test("rejects login with empty signature", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: VICTIM_WALLET, signature: "" })
      .expect(422);
  });

  test("rejects login with malformed signature", async () => {
    // Long enough to pass length validation, but not valid hex/recoverable.
    const garbage = "0x" + "zz".repeat(66);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: VICTIM_WALLET, signature: garbage })
      .expect(401);

    expect(res.body.error).toMatch(/Invalid signature/i);
  });

  test("rejects login when signature was produced by a different wallet (impersonation attempt)", async () => {
    // Attacker tries to log in as victim by signing the victim's challenge
    // with the attacker's own private key.
    const dbUser = await User.findOne({ where: { wallet_address: VICTIM_WALLET } });
    const message = buildSignMessage(VICTIM_WALLET, dbUser.nonce);
    const attackerSignature = await attacker.signMessage(message);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: VICTIM_WALLET, signature: attackerSignature })
      .expect(401);

    expect(res.body.error).toMatch(/Signature does not match wallet address/i);
  });

  test("rejects login for an unregistered wallet (404), even with a valid signature for that wallet", async () => {
    // Even if attacker correctly signs with their own key for their own address,
    // they aren't a registered user → 404.
    const message = buildSignMessage(ATTACKER_WALLET, "any-nonce-the-attacker-picks");
    const sig = await attacker.signMessage(message);

    await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: ATTACKER_WALLET, signature: sig })
      .expect(404);
  });

  test("rejects malformed wallet address (validation)", async () => {
    const message = buildSignMessage("0x123", "nonce");
    const sig = await victim.signMessage(message);

    await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: "0x123", signature: sig })
      .expect(422);
  });

  test("nonce rotation prevents replay: same signature cannot be used twice", async () => {
    // 1) Login successfully, capturing the signature.
    const dbUserBefore = await User.findOne({ where: { wallet_address: VICTIM_WALLET } });
    const oldNonce = dbUserBefore.nonce;
    const message = buildSignMessage(VICTIM_WALLET, oldNonce);
    const signature = await victim.signMessage(message);

    await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: VICTIM_WALLET, signature })
      .expect(200);

    // 2) Server must rotate the nonce after a successful login.
    const dbUserAfter = await User.findOne({ where: { wallet_address: VICTIM_WALLET } });
    expect(dbUserAfter.nonce).not.toBe(oldNonce);

    // 3) Replaying the captured signature must now fail. The route rebuilds the
    //    challenge with the new nonce, so signature recovery yields a different
    //    address (or no recovery at all) → 401.
    const replay = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: VICTIM_WALLET, signature });

    expect([401, 422]).toContain(replay.status);
    expect(replay.body).not.toHaveProperty("user");
  });

  test("login succeeds when the wallet_address is sent in mixed case (normalizes to lowercase)", async () => {
    const dbUser = await User.findOne({ where: { wallet_address: VICTIM_WALLET } });
    const message = buildSignMessage(VICTIM_WALLET, dbUser.nonce);
    const signature = await victim.signMessage(message);

    // Re-send the address with the EIP-55 mixed-case form. Backend must
    // lowercase before lookup AND before message rebuild, otherwise this
    // request would either 404 the user or fail signature recovery.
    const checksummed = ethers.getAddress(VICTIM_WALLET);
    expect(checksummed).not.toBe(VICTIM_WALLET); // sanity: actually mixed-case

    const res = await request(app)
      .post("/api/auth/login")
      .send({ wallet_address: checksummed, signature })
      .expect(200);

    expect(res.body.user.wallet_address).toBe(VICTIM_WALLET);
  });
});
