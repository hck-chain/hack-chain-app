const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getPublicStudentProfile } = require("../getPublicStudentProfile");

jest.setTimeout(15000);

const STUDENT = "0x" + "aa".repeat(20);
const ISSUER = "0x" + "bb".repeat(20);

describe("getPublicStudentProfile", () => {
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
    await models.User.create({
      wallet_address: STUDENT,
      role: "student",
      name: "Ana",
      lastname: "Perez",
      email: "ana@example.com",
      nonce: nonce(),
    });
    await models.Student.create({
      wallet_address: STUDENT,
      field_of_study: "Ciberseguridad",
      photo_url: "ipfs://QmStudent",
    });

    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });

    const issueDate = "2026-01-01";
    await models.Certificate.create({ issuer_wallet_address: ISSUER, student_wallet_address: STUDENT, title: "A", certificate_hash: "h1", token_id: "1", issue_date: issueDate });
    await models.Certificate.create({ issuer_wallet_address: ISSUER, student_wallet_address: STUDENT, title: "B", certificate_hash: "h2", token_id: "2", issue_date: issueDate });
    await models.Certificate.create({ issuer_wallet_address: ISSUER, student_wallet_address: STUDENT, title: "Revocado", certificate_hash: "h3", token_id: "3", issue_date: issueDate, is_revoked: true });
    await models.Certificate.create({ issuer_wallet_address: ISSUER, student_wallet_address: STUDENT, title: "Reservado", status: "pending" });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or walletAddress is missing", async () => {
    await expect(getPublicStudentProfile({ walletAddress: STUDENT })).rejects.toThrow(TypeError);
  });

  test("returns 400 for a malformed wallet address", async () => {
    const result = await getPublicStudentProfile({ models, walletAddress: "not-a-wallet" });
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(400);
  });

  test("returns 404 for an unknown wallet", async () => {
    const result = await getPublicStudentProfile({ models, walletAddress: "0x" + "ff".repeat(20) });
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(404);
  });

  test("returns only the privacy-first public fields", async () => {
    const result = await getPublicStudentProfile({ models, walletAddress: STUDENT });
    expect(result.ok).toBe(true);
    expect(result.data.student).toEqual({
      field_of_study: "Ciberseguridad",
      photo_url: "ipfs://QmStudent",
      total_certificates: 2,
    });
  });

  test("total_certificates skips revoked and still-pending certificates", async () => {
    const result = await getPublicStudentProfile({ models, walletAddress: STUDENT });
    expect(await models.Certificate.count({ where: { student_wallet_address: STUDENT } })).toBe(4);
    expect(result.data.student.total_certificates).toBe(2);
  });

  test("never exposes name, wallet address or email", async () => {
    const result = await getPublicStudentProfile({ models, walletAddress: STUDENT });
    const serialized = JSON.stringify(result.data);
    expect(serialized).not.toContain("ana@example.com");
    expect(serialized).not.toContain("Ana");
    expect(serialized).not.toContain(STUDENT);
  });

  test("never exposes the educators list — that requires auth (see routes/students.js)", async () => {
    const result = await getPublicStudentProfile({ models, walletAddress: STUDENT });
    expect(result.data).not.toHaveProperty("educators");
  });

  test("accepts an uppercase wallet and normalizes it", async () => {
    const result = await getPublicStudentProfile({ models, walletAddress: STUDENT.toUpperCase().replace("0X", "0x") });
    expect(result.ok).toBe(true);
    expect(result.data.student.field_of_study).toBe("Ciberseguridad");
  });
});
