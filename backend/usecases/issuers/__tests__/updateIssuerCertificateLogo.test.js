const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { updateIssuerCertificateLogo } = require("../updateIssuerCertificateLogo");

jest.setTimeout(15000);

const ISSUER = "0x" + "cc".repeat(20);

describe("updateIssuerCertificateLogo", () => {
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
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
  });

  afterAll(() => sequelize.close());

  test("returns CERTIFICATE_LOGO_URL_REQUIRED when missing", async () => {
    const result = await updateIssuerCertificateLogo({ models, wallet: ISSUER });
    expect(result.code).toBe("CERTIFICATE_LOGO_URL_REQUIRED");
  });

  test("rejects a non-ipfs URL", async () => {
    const result = await updateIssuerCertificateLogo({ models, wallet: ISSUER, certificateLogoUrl: "https://evil.com/x.png" });
    expect(result.code).toBe("INVALID_CERTIFICATE_LOGO_URL");
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await updateIssuerCertificateLogo({ models, wallet: "0x" + "ff".repeat(20), certificateLogoUrl: "ipfs://abc123" });
    expect(result.code).toBe("ISSUER_NOT_FOUND");
  });

  test("accepts a valid ipfs:// URI", async () => {
    const result = await updateIssuerCertificateLogo({ models, wallet: ISSUER, certificateLogoUrl: "ipfs://abc123" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ certificate_logo_url: "ipfs://abc123" });
  });
});
