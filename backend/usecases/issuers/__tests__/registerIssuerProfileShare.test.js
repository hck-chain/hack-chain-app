const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { registerIssuerProfileShare } = require("../registerIssuerProfileShare");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);

describe("registerIssuerProfileShare", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;
    const User = require("../../../models/users")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Student, Issuer, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", share_count: 0 });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or walletAddress is missing", async () => {
    await expect(registerIssuerProfileShare({ walletAddress: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns INVALID_WALLET_ADDRESS for a malformed wallet", async () => {
    const result = await registerIssuerProfileShare({ models, walletAddress: "bad" });
    expect(result.code).toBe("INVALID_WALLET_ADDRESS");
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await registerIssuerProfileShare({ models, walletAddress: "0x" + "ff".repeat(20) });
    expect(result.code).toBe("ISSUER_NOT_FOUND");
  });

  test("increments share_count from 0 to 1", async () => {
    const result = await registerIssuerProfileShare({ models, walletAddress: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ success: true, share_count: 1 });
  });
});
