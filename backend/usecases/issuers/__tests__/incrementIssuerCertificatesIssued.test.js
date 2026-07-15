const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { incrementIssuerCertificatesIssued } = require("../incrementIssuerCertificatesIssued");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const OTHER = "0x" + "cc".repeat(20);

describe("incrementIssuerCertificatesIssued", () => {
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
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", certificates_issued: 5 });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or requesterWallet is missing", async () => {
    await expect(incrementIssuerCertificatesIssued({ requesterWallet: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns ISSUER_WALLET_REQUIRED when issuerWallet is absent", async () => {
    const result = await incrementIssuerCertificatesIssued({ models, requesterWallet: ISSUER });
    expect(result.code).toBe("ISSUER_WALLET_REQUIRED");
  });

  test("returns FORBIDDEN when incrementing another issuer's counter", async () => {
    const result = await incrementIssuerCertificatesIssued({ models, requesterWallet: ISSUER, issuerWallet: OTHER });
    expect(result.code).toBe("FORBIDDEN");
    expect(result.httpStatus).toBe(403);
  });

  test("increments the requester's own counter", async () => {
    const result = await incrementIssuerCertificatesIssued({ models, requesterWallet: ISSUER, issuerWallet: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ success: true });

    const issuer = await models.Issuer.findOne({ where: { wallet_address: ISSUER } });
    expect(issuer.certificates_issued).toBe(6);
  });
});
