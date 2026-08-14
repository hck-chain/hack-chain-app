const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { confirmCertificate } = require("../confirmCertificate");
const { flagCertificateIssue } = require("../flagCertificateIssue");
const { resolveCertificateFlag } = require("../resolveCertificateFlag");

jest.setTimeout(15000);

const STUDENT  = "0x" + "aa".repeat(20);
const STUDENT2 = "0x" + "cc".repeat(20);
const ISSUER   = "0x" + "bb".repeat(20);
const ADMIN    = "0x" + "ee".repeat(20);

describe("certificate confirmation usecases", () => {
  let sequelize, models;

  const nonce = () => crypto.randomBytes(16).toString("hex");

  async function createCertificate(overrides = {}) {
    return models.Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: STUDENT,
      title: "Curso de Solidity",
      status: "issued",
      ...overrides,
    });
  }

  beforeAll(async () => {
    // Single-connection pool so PRAGMA and every query share one SQLite
    // connection — matches certificates-reserve-finalize.test.js.
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");
    const { DataTypes } = SequelizePkg;

    const User               = require("../../../models/users")(sequelize, DataTypes);
    const Issuer              = require("../../../models/issuers")(sequelize, DataTypes);
    const IssuerClass         = require("../../../models/issuerClasses")(sequelize, DataTypes);
    const ClassRequest        = require("../../../models/classRequests")(sequelize, DataTypes);
    const ClassPaymentDispute = require("../../../models/classPaymentDisputes")(sequelize, DataTypes);
    // The real Student model doesn't mark wallet_address unique — SQLite's FK
    // enforcement then rejects certificates.student_wallet_address's FK.
    // Same stub used in certificates-reserve-finalize.test.js.
    const Student = sequelize.define("Student", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      wallet_address: { type: DataTypes.STRING(42), allowNull: false, unique: true },
    }, {
      tableName: "students",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
    const Recruiter           = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate         = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession         = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, IssuerClass, ClassRequest, ClassPaymentDispute, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    await User.create({ wallet_address: STUDENT,  role: "student", name: "Ana", nonce: nonce() });
    await User.create({ wallet_address: STUDENT2, role: "student", name: "Bob", nonce: nonce() });
    await User.create({ wallet_address: ISSUER,   role: "issuer",  name: "Prof", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", class_settings: {} });
    await Student.create({ wallet_address: STUDENT });
    await Student.create({ wallet_address: STUDENT2 });
  });

  afterAll(() => sequelize.close());

  describe("confirmCertificate", () => {
    test("throws TypeError when studentWallet is missing", async () => {
      await expect(confirmCertificate({ models })).rejects.toThrow(TypeError);
    });

    test("returns CERTIFICATE_NOT_FOUND for another student's certificate", async () => {
      const cert = await createCertificate();
      const result = await confirmCertificate({ models, certificateId: cert.id, studentWallet: STUDENT2 });
      expect(result.code).toBe("CERTIFICATE_NOT_FOUND");
    });

    test("returns CANNOT_CONFIRM when status isn't issued", async () => {
      const cert = await createCertificate({ status: "pending" });
      const result = await confirmCertificate({ models, certificateId: cert.id, studentWallet: STUDENT });
      expect(result.code).toBe("CANNOT_CONFIRM");
    });

    test("confirms an issued certificate and clears the deadline", async () => {
      const cert = await createCertificate({ confirmation_deadline: new Date() });
      const result = await confirmCertificate({ models, certificateId: cert.id, studentWallet: STUDENT });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe("confirmed");

      const updated = await models.Certificate.findByPk(cert.id);
      expect(updated.confirmation_deadline).toBeNull();
    });
  });

  describe("flagCertificateIssue", () => {
    test("returns CANNOT_FLAG when status isn't issued", async () => {
      const cert = await createCertificate({ status: "confirmed" });
      const result = await flagCertificateIssue({ models, certificateId: cert.id, studentWallet: STUDENT, reason: "wrong name" });
      expect(result.code).toBe("CANNOT_FLAG");
    });

    test("flags an issued certificate and stores the reason", async () => {
      const cert = await createCertificate();
      const result = await flagCertificateIssue({ models, certificateId: cert.id, studentWallet: STUDENT, reason: "El nombre está mal escrito" });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe("flagged");

      const updated = await models.Certificate.findByPk(cert.id);
      expect(updated.flag_reason).toBe("El nombre está mal escrito");
    });
  });

  describe("resolveCertificateFlag", () => {
    test("returns NOT_FLAGGED when status isn't flagged", async () => {
      const cert = await createCertificate({ status: "issued" });
      const result = await resolveCertificateFlag({ models, certificateId: cert.id, adminWallet: ADMIN });
      expect(result.code).toBe("NOT_FLAGGED");
    });

    test("force-confirms a flagged certificate", async () => {
      const cert = await createCertificate({ status: "flagged", flag_reason: "Nombre incorrecto" });
      const result = await resolveCertificateFlag({ models, certificateId: cert.id, adminWallet: ADMIN, resolutionNote: "Se corrigió y ambas partes de acuerdo" });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe("confirmed");

      const updated = await models.Certificate.findByPk(cert.id);
      expect(updated.flag_reason).toContain("Nombre incorrecto");
      expect(updated.flag_reason).toContain("Resuelto por HackChain");
    });
  });
});
