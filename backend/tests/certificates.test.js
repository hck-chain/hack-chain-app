// backend/tests/certificates.test.js
//
// Tests for GET /api/certificates/database/:id — public certificate lookup.
// Covers: the educator's email must never appear in the response (security fix),
// while name/lastname and the rest of the certificate payload remain intact.

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

describe("GET /api/certificates/database/:id", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession;
  let app;

  const makeWallet = () => "0x" + crypto.randomBytes(20).toString("hex");

  const seedCertificate = async () => {
    const issuerWallet = makeWallet();
    const studentWallet = makeWallet();

    await User.create({
      wallet_address: issuerWallet,
      role: "issuer",
      name: "Edu",
      lastname: "Cator",
      email: "educator@example.com",
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
      lastname: "Dent",
      email: "student@example.com",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await Student.create({ wallet_address: studentWallet });

    const certificate = await Certificate.create({
      issuer_wallet_address: issuerWallet,
      student_wallet_address: studentWallet,
      title: "Test Certificate",
      certificate_hash: crypto.randomBytes(16).toString("hex"),
      token_id: "1",
      issue_date: "2026-01-01",
    });

    return { certificateId: certificate.id, issuerWallet, studentWallet };
  };

  const issueSession = async (wallet, role) => {
    // UserSession.wallet_address is a real FK to users — the caller's wallet
    // must have a User row, even when it's an unrelated bystander for a 403 case.
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

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    // sqlite (unlike Postgres) requires the FK target column to carry a
    // UNIQUE constraint at DDL time — the real students.wallet_address
    // column isn't declared unique in the model (only enforced via a raw
    // migration in prod), so we define a minimal unique-wallet stand-in
    // here purely to satisfy Certificate's FK during local sync.
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

    const modelsMock = {
      User, Student, Issuer, Recruiter, Certificate, UserSession,
      sequelize,
      Sequelize: SequelizePkg,
    };

    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    sequelize.random = () => SequelizePkg.literal("RANDOM()");

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
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

  test("does not include the educator's email anywhere in the response", async () => {
    const { certificateId } = await seedCertificate();

    const res = await request(app)
      .get(`/api/certificates/database/${certificateId}`)
      .expect(200);

    expect(JSON.stringify(res.body)).not.toContain("educator@example.com");
    expect(JSON.stringify(res.body)).not.toContain("\"email\"");
    expect(res.body.certificate.issuer.User).toEqual(
      expect.objectContaining({ name: "Edu", lastname: "Cator" })
    );
  });

  test("returns 404 for a non-existent certificate", async () => {
    const res = await request(app)
      .get("/api/certificates/database/999999")
      .expect(404);

    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /api/certificates/:id/share", () => {
  let sequelize;
  let User, Issuer, Student, Recruiter, Certificate, UserSession;
  let app;

  const makeWallet = () => "0x" + crypto.randomBytes(20).toString("hex");

  const seedCertificate = async () => {
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

    const certificate = await Certificate.create({
      issuer_wallet_address: issuerWallet,
      student_wallet_address: studentWallet,
      title: "Test Certificate",
      certificate_hash: crypto.randomBytes(16).toString("hex"),
      token_id: "1",
      issue_date: "2026-01-01",
    });

    return { certificateId: certificate.id, issuerWallet, studentWallet };
  };

  const issueSession = async (wallet, role) => {
    // UserSession.wallet_address is a real FK to users — the caller's wallet
    // must have a User row, even when it's an unrelated bystander for a 403 case.
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

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
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

    const modelsMock = {
      User, Student, Issuer, Recruiter, Certificate, UserSession,
      sequelize,
      Sequelize: SequelizePkg,
    };

    Object.values(modelsMock).forEach((m) => m?.associate?.(modelsMock));

    sequelize.random = () => SequelizePkg.literal("RANDOM()");

    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
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

  test("403 when the authenticated wallet does not own the certificate", async () => {
    const { certificateId } = await seedCertificate();
    const token = await issueSession(makeWallet(), "student");

    const res = await request(app)
      .post(`/api/certificates/${certificateId}/share`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(res.body).toHaveProperty("error");
  });

  test("401 without a session", async () => {
    const { certificateId } = await seedCertificate();

    const res = await request(app)
      .post(`/api/certificates/${certificateId}/share`)
      .expect(401);

    expect(res.body).toHaveProperty("error");
  });

  test("200 when the certificate's own student shares it, incrementing share_count", async () => {
    const { certificateId, studentWallet } = await seedCertificate();
    const token = await issueSession(studentWallet, "student");

    const res = await request(app)
      .post(`/api/certificates/${certificateId}/share`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({ success: true, share_count: 1 });
  });

  test("404 when the certificate does not exist", async () => {
    const token = await issueSession(makeWallet(), "student");

    const res = await request(app)
      .post("/api/certificates/999999/share")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body).toHaveProperty("error");
  });
});
