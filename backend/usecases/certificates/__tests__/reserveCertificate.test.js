const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { reserveCertificate } = require("../reserveCertificate");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const STUDENT = "0x" + "aa".repeat(20);

describe("reserveCertificate", () => {
  let sequelize, models;

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
    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await models.User.create({ wallet_address: STUDENT, role: "student", name: "Luis", nonce: nonce() });
    await models.Student.create({ wallet_address: STUDENT });
  });

  const base = () => ({ models, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Introduccion a Linux" });

  test("throws TypeError when required params are missing", async () => {
    await expect(reserveCertificate({ issuerWallet: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns ISSUER_NOT_AUTHORIZED for a wallet with no Issuer row", async () => {
    const result = await reserveCertificate({ ...base(), issuerWallet: "0x" + "ff".repeat(20) });
    expect(result.code).toBe("ISSUER_NOT_AUTHORIZED");
    expect(result.httpStatus).toBe(404);
  });

  test("creates a pending certificate row on first reservation", async () => {
    const result = await reserveCertificate(base());
    expect(result.ok).toBe(true);
    expect(result.data.id).toBeDefined();

    const row = await models.Certificate.findByPk(result.data.id);
    expect(row.status).toBe("pending");
    expect(row.certificate_hash).toBeNull();
    expect(row.token_id).toBeNull();
  });

  test("blocks a duplicate reservation when a matching certificate is already issued", async () => {
    const first = await reserveCertificate(base());
    await models.Certificate.update({ status: "issued", certificate_hash: "ipfs://x", token_id: "1", issue_date: "2026-07-16" }, { where: { id: first.data.id } });

    const second = await reserveCertificate(base());
    expect(second.ok).toBe(false);
    expect(second.code).toBe("DUPLICATE_CERTIFICATE");
    expect(second.httpStatus).toBe(409);
    expect(second.data.existing.id).toBe(first.data.id);
  });

  test("allows a duplicate reservation when force is true", async () => {
    const first = await reserveCertificate(base());
    await models.Certificate.update({ status: "issued", certificate_hash: "ipfs://x", token_id: "1", issue_date: "2026-07-16" }, { where: { id: first.data.id } });

    const second = await reserveCertificate({ ...base(), force: true });
    expect(second.ok).toBe(true);
    expect(second.data.id).not.toBe(first.data.id);
  });

  test("rejects a class_request_id that does not belong to the issuer", async () => {
    const otherIssuer = "0x" + "ee".repeat(20);
    await models.User.create({ wallet_address: otherIssuer, role: "issuer", name: "Other", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Issuer.create({ wallet_address: otherIssuer, organization_name: "OtherOrg" });
    const cr = await models.ClassRequest.create({
      student_wallet_address: STUDENT, issuer_wallet_address: otherIssuer,
      requested_date: "2026-07-20", start_time: "10:00", duration_minutes: 60,
      class_name: "Introduccion a Linux", status: "confirmed",
    });

    const result = await reserveCertificate({ ...base(), classRequestId: cr.id });
    expect(result.code).toBe("CLASS_REQUEST_MISMATCH");
  });
});
