const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { finalizeCertificate } = require("../finalizeCertificate");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const OTHER_ISSUER = "0x" + "cc".repeat(20);
const STUDENT = "0x" + "aa".repeat(20);

describe("finalizeCertificate", () => {
  let sequelize, models, emailService;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    const User         = require("../../../models/users")(sequelize, DataTypes);
    const Issuer       = require("../../../models/issuers")(sequelize, DataTypes);
    const IssuerClass  = require("../../../models/issuerClasses")(sequelize, DataTypes);
    const ClassRequest = require("../../../models/classRequests")(sequelize, DataTypes);
    const Student      = require("../../../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    const Recruiter    = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate  = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession  = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, IssuerClass, ClassRequest, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });
  });

  afterAll(() => sequelize.close());

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    emailService = { notifyTalentCertificateIssued: jest.fn().mockResolvedValue(undefined) };
    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await models.User.create({ wallet_address: STUDENT, role: "student", name: "Luis", email: "luis@example.com", nonce: nonce() });
    await models.Student.create({ wallet_address: STUDENT });
  });

  const reservePending = async (overrides = {}) =>
    models.Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: STUDENT,
      title: "Introduccion a Linux",
      status: "pending",
      ...overrides,
    });

  test("throws TypeError when required params are missing", async () => {
    await expect(finalizeCertificate({ issuerWallet: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns CERTIFICATE_NOT_FOUND for an unknown id", async () => {
    const result = await finalizeCertificate({ models, emailService, id: 999999, issuerWallet: ISSUER });
    expect(result.code).toBe("CERTIFICATE_NOT_FOUND");
  });

  test("returns FORBIDDEN when the caller isn't the reserving issuer", async () => {
    const pending = await reservePending();
    const result = await finalizeCertificate({ models, emailService, id: pending.id, issuerWallet: OTHER_ISSUER });
    expect(result.code).toBe("FORBIDDEN");
    expect(result.httpStatus).toBe(403);
  });

  test("returns MISSING_CHAIN_DATA when required fields are absent", async () => {
    const pending = await reservePending();
    const result = await finalizeCertificate({ models, emailService, id: pending.id, issuerWallet: ISSUER });
    expect(result.code).toBe("MISSING_CHAIN_DATA");
  });

  test("finalizes a pending certificate with the real chain data", async () => {
    const pending = await reservePending();
    const result = await finalizeCertificate({
      models, emailService, id: pending.id, issuerWallet: ISSUER,
      certificateHash: "ipfs://abc", blockchainTxHash: "0xdeadbeef", tokenId: "32", issueDate: "2026-07-16",
    });
    expect(result.ok).toBe(true);

    await pending.reload();
    expect(pending.status).toBe("issued");
    expect(pending.token_id).toBe("32");
    expect(pending.certificate_hash).toBe("ipfs://abc");
  });

  test("is idempotent when the certificate is already issued", async () => {
    const pending = await reservePending({ status: "issued", certificate_hash: "ipfs://x", token_id: "1", issue_date: "2026-07-01" });
    const result = await finalizeCertificate({ models, emailService, id: pending.id, issuerWallet: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data.id).toBe(pending.id);
  });

  test("auto-completes a confirmed class request linked to the certificate", async () => {
    const cr = await models.ClassRequest.create({
      student_wallet_address: STUDENT, issuer_wallet_address: ISSUER,
      requested_date: "2026-07-16", start_time: "10:00", duration_minutes: 60,
      class_name: "Introduccion a Linux", status: "confirmed",
    });
    const pending = await reservePending({ class_request_id: cr.id });

    await finalizeCertificate({
      models, emailService, id: pending.id, issuerWallet: ISSUER,
      certificateHash: "ipfs://abc", blockchainTxHash: "0xdeadbeef", tokenId: "32", issueDate: "2026-07-16",
    });

    await cr.reload();
    expect(cr.status).toBe("completed");
  });

  test("notifies the talent by email, fire-and-forget", async () => {
    const pending = await reservePending();
    await finalizeCertificate({
      models, emailService, id: pending.id, issuerWallet: ISSUER,
      certificateHash: "ipfs://abc", blockchainTxHash: "0xdeadbeef", tokenId: "32", issueDate: "2026-07-16",
    });

    // The notification chain does two sequential async DB lookups before
    // calling the email service — give it real time to actually settle.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(emailService.notifyTalentCertificateIssued).toHaveBeenCalledWith(
      expect.objectContaining({ to: "luis@example.com", certificateTitle: "Introduccion a Linux" })
    );
  });
});
