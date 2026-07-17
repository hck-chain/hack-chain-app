// backend/tests/certificates-reserve-finalize.test.js
//
// Route-level regression test for POST /api/certificates/reserve and
// POST /api/certificates/:id/finalize — the flow that replaced the old
// single-shot POST /api/certificates/database (see
// usecases/certificates/reserveCertificate.js for why: a certificate is now
// always reserved as a DB row *before* any blockchain mint is attempted, so
// a crash mid-flow can never leave an orphaned on-chain NFT with no matching
// record). Kept in its own file — this suite creates its own Sequelize
// instance, and running it in the same file as other certificates.test.js
// describe blocks (each with their own Sequelize instance) caused an
// unrelated, hard-to-diagnose Sequelize order-clause error; isolating it
// here sidesteps that entirely.
//
// Covers: the class_request_id lock (moved verbatim from the old route),
// and the duplicate-certificate guard that prevents the exact incident this
// flow was built to fix — an educator retrying the same certificate and
// minting a second on-chain NFT before finding out the first one saved fine.

const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

jest.setTimeout(20000);

jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
}));

jest.mock("express-rate-limit", () => ({
  rateLimit: () => (req, res, next) => next(),
  ipKeyGenerator: (req) => req.ip,
}));

describe("POST /api/certificates/reserve + /:id/finalize", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession, ClassRequest, IssuerClass;
  let app;

  const makeWallet = () => "0x" + crypto.randomBytes(20).toString("hex");

  const seedIssuerAndStudent = async () => {
    const issuerWallet = makeWallet();
    const studentWallet = makeWallet();

    await User.create({
      wallet_address: issuerWallet,
      role: "issuer",
      name: "Edu",
      nonce: crypto.randomBytes(16).toString("hex"),
      educator_approval_status: "approved",
    });
    await Issuer.create({
      wallet_address: issuerWallet,
      organization_name: "Org",
      certificates_issued: 0,
    });
    await User.create({
      wallet_address: studentWallet,
      role: "student",
      name: "Stu",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await Student.create({ wallet_address: studentWallet });

    return { issuerWallet, studentWallet };
  };

  const seedClassRequest = async ({ issuerWallet, studentWallet, className, status = "confirmed" }) =>
    ClassRequest.create({
      student_wallet_address: studentWallet,
      issuer_wallet_address: issuerWallet,
      requested_date: "2026-07-20",
      start_time: "10:00",
      duration_minutes: 60,
      class_name: className ?? null,
      status,
    });

  const issueSession = async (wallet, role) => {
    const existing = await User.findOne({ where: { wallet_address: wallet } });
    if (!existing) {
      await User.create({
        wallet_address: wallet,
        role,
        name: "Bystander",
        nonce: crypto.randomBytes(16).toString("hex"),
      });
    }
    await UserSession.create({
      id: crypto.randomBytes(16).toString("hex"),
      wallet_address: wallet,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });
    return jwt.sign({ wallet, role }, process.env.JWT_SECRET, { expiresIn: "15m" });
  };

  const reserveCertificate = (token, body) =>
    request(app)
      .post("/api/certificates/reserve")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

  const finalizeCertificate = (token, id, body) =>
    request(app)
      .post(`/api/certificates/${id}/finalize`)
      .set("Authorization", `Bearer ${token}`)
      .send(body);

  beforeAll(async () => {
    // Single-connection pool so this in-memory SQLite database is
    // consistent across every query in the suite — matches the pattern
    // used everywhere else FK/order queries touch Student in this repo.
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    Student = sequelize.define("Student", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      wallet_address: { type: DataTypes.STRING(42), allowNull: false, unique: true },
    }, {
      tableName: "students",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);
    ClassRequest = require("../models/classRequests")(sequelize, DataTypes);
    IssuerClass = require("../models/issuerClasses")(sequelize, DataTypes);

    const modelsMock = {
      User, Student, Issuer, Recruiter, Certificate, UserSession, ClassRequest, IssuerClass,
      sequelize,
      Sequelize: SequelizePkg,
    };

    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../services/emailService", () => ({
        notifyTalentCertificateIssued: jest.fn().mockResolvedValue(undefined),
      }));
      const certificatesRoute = require("../routes/certificates");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/certificates", certificatesRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  test("reserve: 409 when class_request_id does not exist", async () => {
    const { issuerWallet, studentWallet } = await seedIssuerAndStudent();
    const token = await issueSession(issuerWallet, "issuer");

    const res = await reserveCertificate(token, {
      student_wallet_address: studentWallet,
      title: "Clase Personalizada",
      class_request_id: 999999,
    }).expect(409);

    expect(res.body).toHaveProperty("error");
  });

  test("reserve: 409 when the class_request_id belongs to another issuer", async () => {
    const { issuerWallet, studentWallet } = await seedIssuerAndStudent();
    const { issuerWallet: otherIssuerWallet } = await seedIssuerAndStudent();
    const classRequest = await seedClassRequest({
      issuerWallet: otherIssuerWallet,
      studentWallet,
      className: "Clase Personalizada",
    });
    const token = await issueSession(issuerWallet, "issuer");

    const res = await reserveCertificate(token, {
      student_wallet_address: studentWallet,
      title: "Clase Personalizada",
      class_request_id: classRequest.id,
    }).expect(409);

    expect(res.body).toHaveProperty("error");
  });

  test("reserve: 409 when student_wallet_address does not match the ClassRequest", async () => {
    const { issuerWallet, studentWallet } = await seedIssuerAndStudent();
    const otherStudentWallet = makeWallet();
    const classRequest = await seedClassRequest({
      issuerWallet,
      studentWallet,
      className: "Clase Personalizada",
    });
    const token = await issueSession(issuerWallet, "issuer");

    const res = await reserveCertificate(token, {
      student_wallet_address: otherStudentWallet,
      title: "Clase Personalizada",
      class_request_id: classRequest.id,
    }).expect(409);

    expect(res.body).toHaveProperty("error");
  });

  test("reserve: 409 when title does not match a non-null class_name", async () => {
    const { issuerWallet, studentWallet } = await seedIssuerAndStudent();
    const classRequest = await seedClassRequest({
      issuerWallet,
      studentWallet,
      className: "Clase Personalizada",
    });
    const token = await issueSession(issuerWallet, "issuer");

    const res = await reserveCertificate(token, {
      student_wallet_address: studentWallet,
      title: "Un título distinto",
      class_request_id: classRequest.id,
    }).expect(409);

    expect(res.body).toHaveProperty("error");
  });

  test("reserve then finalize: 201 + 200 when student_wallet_address and title match the ClassRequest", async () => {
    const { issuerWallet, studentWallet } = await seedIssuerAndStudent();
    const classRequest = await seedClassRequest({
      issuerWallet,
      studentWallet,
      className: "Clase Personalizada",
    });
    const token = await issueSession(issuerWallet, "issuer");

    const reserveRes = await reserveCertificate(token, {
      student_wallet_address: studentWallet,
      title: "Clase Personalizada",
      class_request_id: classRequest.id,
    }).expect(201);

    expect(reserveRes.body).toHaveProperty("id");

    const pending = await Certificate.findByPk(reserveRes.body.id);
    expect(pending.status).toBe("pending");

    const finalizeRes = await finalizeCertificate(token, reserveRes.body.id, {
      certificate_hash: `ipfs://${crypto.randomBytes(16).toString("hex")}`,
      token_id: "1",
      blockchain_tx_hash: `0x${crypto.randomBytes(32).toString("hex")}`,
      issue_date: "2026-07-20",
    }).expect(200);

    expect(finalizeRes.body).toHaveProperty("id", reserveRes.body.id);

    await pending.reload();
    expect(pending.status).toBe("issued");

    await classRequest.reload();
    expect(classRequest.status).toBe("completed");
  });

  test("reserve then finalize: 201 + 200 with any title when the ClassRequest has no class_name", async () => {
    const { issuerWallet, studentWallet } = await seedIssuerAndStudent();
    const classRequest = await seedClassRequest({
      issuerWallet,
      studentWallet,
      className: null,
    });
    const token = await issueSession(issuerWallet, "issuer");

    const reserveRes = await reserveCertificate(token, {
      student_wallet_address: studentWallet,
      title: "Cualquier título elegido por el educador",
      class_request_id: classRequest.id,
    }).expect(201);

    await finalizeCertificate(token, reserveRes.body.id, {
      certificate_hash: `ipfs://${crypto.randomBytes(16).toString("hex")}`,
      token_id: "1",
      blockchain_tx_hash: `0x${crypto.randomBytes(32).toString("hex")}`,
      issue_date: "2026-07-20",
    }).expect(200);
  });

  test("reserve: 409 DUPLICATE_CERTIFICATE when an issued certificate already matches, and force bypasses it", async () => {
    const { issuerWallet, studentWallet } = await seedIssuerAndStudent();
    const token = await issueSession(issuerWallet, "issuer");
    const body = { student_wallet_address: studentWallet, title: "Introduccion a Linux" };

    const first = await reserveCertificate(token, body).expect(201);
    await finalizeCertificate(token, first.body.id, {
      certificate_hash: "ipfs://first-attempt",
      token_id: "31",
      blockchain_tx_hash: `0x${crypto.randomBytes(32).toString("hex")}`,
      issue_date: "2026-07-16",
    }).expect(200);

    // Reproduces the real incident: retrying the same certificate must be
    // blocked before anything else happens, not left to a unique-constraint
    // crash after a second on-chain mint.
    const retry = await reserveCertificate(token, body).expect(409);
    expect(retry.body.error).toMatch(/ya existe/i);

    // Confirming "issue anyway" must succeed and produce a genuinely separate
    // certificate — this is what the metadata "Certificate ID" attribute
    // (added at reservation id time) makes possible: a distinct hash per row.
    const forced = await reserveCertificate(token, { ...body, force: true }).expect(201);
    expect(forced.body.id).not.toBe(first.body.id);

    await finalizeCertificate(token, forced.body.id, {
      certificate_hash: "ipfs://second-attempt-forced",
      token_id: "32",
      blockchain_tx_hash: `0x${crypto.randomBytes(32).toString("hex")}`,
      issue_date: "2026-07-17",
    }).expect(200);
  });
});
