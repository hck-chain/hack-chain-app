const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { updateIssuerPhoto } = require("../updateIssuerPhoto");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);

describe("updateIssuerPhoto", () => {
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

  test("returns PHOTO_URL_REQUIRED when missing", async () => {
    const result = await updateIssuerPhoto({ models, wallet: ISSUER });
    expect(result.code).toBe("PHOTO_URL_REQUIRED");
  });

  test("rejects a non-ipfs URL", async () => {
    const result = await updateIssuerPhoto({ models, wallet: ISSUER, photoUrl: "https://evil.com/x.png" });
    expect(result.code).toBe("INVALID_PHOTO_URL");
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await updateIssuerPhoto({ models, wallet: "0x" + "ff".repeat(20), photoUrl: "ipfs://abc123" });
    expect(result.code).toBe("ISSUER_NOT_FOUND");
  });

  test("accepts a valid ipfs:// URI", async () => {
    const result = await updateIssuerPhoto({ models, wallet: ISSUER, photoUrl: "ipfs://abc123" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ photo_url: "ipfs://abc123" });
  });
});
