const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { reapplyForApproval } = require("../reapplyForApproval");

jest.setTimeout(15000);

describe("reapplyForApproval", () => {
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
    await expect(reapplyForApproval({ userId: 1 })).rejects.toThrow(TypeError);
  });

  test("returns USER_NOT_FOUND for an unknown user id", async () => {
    const result = await reapplyForApproval({ models, userId: 999999 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("USER_NOT_FOUND");
  });

  test("returns NOT_REJECTED when the account isn't rejected", async () => {
    const user = await User.create({ wallet_address: "0x" + "11".repeat(20), role: "issuer", name: "A", nonce: nonce(), educator_approval_status: "pending_approval" });
    const result = await reapplyForApproval({ models, userId: user.id });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("NOT_REJECTED");
    expect(result.httpStatus).toBe(409);
  });

  test("moves a rejected account back to pending_approval and clears the reason", async () => {
    const user = await User.create({
      wallet_address: "0x" + "22".repeat(20), role: "issuer", name: "B", nonce: nonce(),
      educator_approval_status: "rejected", rejection_reason: "Missing docs",
    });
    const result = await reapplyForApproval({ models, userId: user.id });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ status: "pending_approval" });

    await user.reload();
    expect(user.educator_approval_status).toBe("pending_approval");
    expect(user.rejection_reason).toBeNull();
  });
});
