const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { findExistingCertificate } = require("../findExistingCertificate");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const STUDENT = "0x" + "aa".repeat(20);

describe("findExistingCertificate", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    const User = require("../../../models/users")(sequelize, DataTypes);
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await models.User.create({ wallet_address: STUDENT, role: "student", name: "Luis", nonce: nonce() });
    await models.Student.create({ wallet_address: STUDENT });

    await models.Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: STUDENT,
      title: "Introduccion a Linux",
      certificate_hash: "ipfs://abc",
      token_id: "32",
      issue_date: "2026-07-16",
      status: "issued",
    });
    // A pending (unfinished) attempt for a different course must never count as a duplicate.
    await models.Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: STUDENT,
      title: "Redes",
      status: "pending",
    });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when required params are missing", async () => {
    await expect(findExistingCertificate({ issuerWallet: ISSUER })).rejects.toThrow(TypeError);
  });

  test("finds an issued certificate matching issuer + student + title", async () => {
    const result = await findExistingCertificate({
      models, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Introduccion a Linux",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ token_id: "32" });
  });

  test("returns null when no issued certificate matches", async () => {
    const result = await findExistingCertificate({
      models, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Python Avanzado",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toBeNull();
  });

  test("does not count a pending (unfinished) certificate as a duplicate", async () => {
    const result = await findExistingCertificate({
      models, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Redes",
    });
    expect(result.data).toBeNull();
  });
});
