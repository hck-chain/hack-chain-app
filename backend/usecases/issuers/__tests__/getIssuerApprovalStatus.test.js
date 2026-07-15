const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getIssuerApprovalStatus } = require("../getIssuerApprovalStatus");

jest.setTimeout(15000);

describe("getIssuerApprovalStatus", () => {
  let sequelize, models, User;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;
    User = require("../../../models/users")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Student, Issuer, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });
  });

  afterAll(() => sequelize.close());

  const nonce = () => crypto.randomBytes(16).toString("hex");

  test("throws TypeError when models or userId is missing", async () => {
    await expect(getIssuerApprovalStatus({ userId: 1 })).rejects.toThrow(TypeError);
    await expect(getIssuerApprovalStatus({ models })).rejects.toThrow(TypeError);
  });

  test("returns USER_NOT_FOUND for an unknown user id", async () => {
    const result = await getIssuerApprovalStatus({ models, userId: 999999 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("USER_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("defaults to pending_approval when status is unset", async () => {
    const user = await User.create({ wallet_address: "0x" + "11".repeat(20), role: "issuer", name: "A", nonce: nonce() });
    const result = await getIssuerApprovalStatus({ models, userId: user.id });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ status: "pending_approval" });
  });

  test("includes reason when rejected", async () => {
    const user = await User.create({
      wallet_address: "0x" + "22".repeat(20), role: "issuer", name: "B", nonce: nonce(),
      educator_approval_status: "rejected", rejection_reason: "Incomplete info",
    });
    const result = await getIssuerApprovalStatus({ models, userId: user.id });
    expect(result.data).toEqual({ status: "rejected", reason: "Incomplete info" });
  });

  test("includes approved_at when approved", async () => {
    const approvedAt = new Date("2026-01-01T00:00:00Z");
    const user = await User.create({
      wallet_address: "0x" + "33".repeat(20), role: "issuer", name: "C", nonce: nonce(),
      educator_approval_status: "approved", approved_at: approvedAt,
    });
    const result = await getIssuerApprovalStatus({ models, userId: user.id });
    expect(result.data.status).toBe("approved");
    expect(new Date(result.data.approved_at).toISOString()).toBe(approvedAt.toISOString());
  });
});
