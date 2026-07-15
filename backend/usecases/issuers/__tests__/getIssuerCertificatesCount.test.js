const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getIssuerCertificatesCount } = require("../getIssuerCertificatesCount");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);

describe("getIssuerCertificatesCount", () => {
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
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", certificates_issued: 7 });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or walletAddress is missing", async () => {
    await expect(getIssuerCertificatesCount({ walletAddress: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns the issuer's certificates_issued total", async () => {
    const result = await getIssuerCertificatesCount({ models, walletAddress: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ total: 7 });
  });

  test("returns 0 (not an error) for an unknown wallet", async () => {
    const result = await getIssuerCertificatesCount({ models, walletAddress: "0x" + "ff".repeat(20) });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ total: 0 });
  });
});
