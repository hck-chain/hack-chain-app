const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getPublicIssuerProfile } = require("../getPublicIssuerProfile");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const STUDENT_A = "0x" + "aa".repeat(20);
const STUDENT_B = "0x" + "cc".repeat(20);

describe("getPublicIssuerProfile", () => {
  let sequelize, models;

  beforeAll(async () => {
    // Single-connection pool so PRAGMA foreign_keys = OFF survives across every
    // query — Student.wallet_address isn't unique, which SQLite (unlike Postgres)
    // requires for any FK pointing at it. Test-only; Postgres enforces FKs normally.
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
    // SQLite requires UNIQUE on any column referenced by a FK; the production
    // Student model doesn't declare it (Postgres is more permissive).
    Student.rawAttributes.wallet_address.unique = true;
    const Recruiter    = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate  = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession  = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, IssuerClass, ClassRequest, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", lastname: "Ok", nonce: nonce(), educator_approval_status: "approved" });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", certificates_issued: 2, share_count: 3 });

    await models.User.create({ wallet_address: STUDENT_A, role: "student", name: "Ana", nonce: nonce() });
    await models.User.create({ wallet_address: STUDENT_B, role: "student", name: "Bob", nonce: nonce() });
    await models.Student.create({ wallet_address: STUDENT_A });
    await models.Student.create({ wallet_address: STUDENT_B });

    const issueDate = "2026-01-01";
    await models.Certificate.create({ issuer_wallet_address: ISSUER, student_wallet_address: STUDENT_A, title: "A", certificate_hash: "h1", token_id: "1", issue_date: issueDate });
    await models.Certificate.create({ issuer_wallet_address: ISSUER, student_wallet_address: STUDENT_A, title: "A2", certificate_hash: "h2", token_id: "2", issue_date: issueDate });
    await models.Certificate.create({ issuer_wallet_address: ISSUER, student_wallet_address: STUDENT_B, title: "B", certificate_hash: "h3", token_id: "3", issue_date: issueDate });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or walletAddress is missing", async () => {
    await expect(getPublicIssuerProfile({ walletAddress: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns INVALID_WALLET_ADDRESS for a malformed wallet", async () => {
    const result = await getPublicIssuerProfile({ models, walletAddress: "not-a-wallet" });
    expect(result.code).toBe("INVALID_WALLET_ADDRESS");
    expect(result.httpStatus).toBe(400);
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await getPublicIssuerProfile({ models, walletAddress: "0x" + "ff".repeat(20) });
    expect(result.code).toBe("ISSUER_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("counts distinct students as talents_formed and never exposes email", async () => {
    const result = await getPublicIssuerProfile({ models, walletAddress: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data.issuer.talents_formed).toBe(2);
    expect(result.data.issuer.is_approved).toBe(true);
    expect(result.data.issuer).not.toHaveProperty("email");
  });
});
