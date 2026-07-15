const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { updatePublicIssuerProfile } = require("../updatePublicIssuerProfile");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const OTHER = "0x" + "cc".repeat(20);

describe("updatePublicIssuerProfile", () => {
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

  test("returns INVALID_WALLET_ADDRESS for a malformed wallet", async () => {
    const result = await updatePublicIssuerProfile({ models, walletAddress: "bad", requesterWallet: ISSUER });
    expect(result.code).toBe("INVALID_WALLET_ADDRESS");
  });

  test("returns FORBIDDEN when the requester isn't the profile owner", async () => {
    const result = await updatePublicIssuerProfile({ models, walletAddress: ISSUER, requesterWallet: OTHER });
    expect(result.code).toBe("FORBIDDEN");
    expect(result.httpStatus).toBe(403);
  });

  test("rejects invalid knowledge_areas", async () => {
    const result = await updatePublicIssuerProfile({ models, walletAddress: ISSUER, requesterWallet: ISSUER, knowledgeAreas: "nope" });
    expect(result.code).toBe("INVALID_KNOWLEDGE_AREAS");
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet owned by the requester", async () => {
    const unknown = "0x" + "dd".repeat(20);
    const result = await updatePublicIssuerProfile({ models, walletAddress: unknown, requesterWallet: unknown });
    expect(result.code).toBe("ISSUER_NOT_FOUND");
  });

  test("updates the profile when the requester is the owner", async () => {
    const result = await updatePublicIssuerProfile({
      models, walletAddress: ISSUER, requesterWallet: ISSUER,
      organizationName: "New Org", bio: "new bio",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ message: "Issuer updated successfully" });

    const issuer = await models.Issuer.findOne({ where: { wallet_address: ISSUER } });
    expect(issuer.organization_name).toBe("New Org");
    expect(issuer.bio).toBe("new bio");
  });
});
