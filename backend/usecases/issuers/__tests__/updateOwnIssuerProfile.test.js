const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { updateOwnIssuerProfile } = require("../updateOwnIssuerProfile");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);

describe("updateOwnIssuerProfile", () => {
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
  });

  afterAll(() => sequelize.close());

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
  });

  const base = () => ({ models, wallet: ISSUER });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await updateOwnIssuerProfile({ models, wallet: "0x" + "ff".repeat(20) });
    expect(result.code).toBe("ISSUER_NOT_FOUND");
  });

  test("rejects a non-string bio", async () => {
    const result = await updateOwnIssuerProfile({ ...base(), bio: 123 });
    expect(result.code).toBe("INVALID_BIO");
  });

  test("rejects a bio longer than 500 chars", async () => {
    const result = await updateOwnIssuerProfile({ ...base(), bio: "a".repeat(501) });
    expect(result.code).toBe("BIO_TOO_LONG");
  });

  test("rejects knowledge_areas that isn't an array", async () => {
    const result = await updateOwnIssuerProfile({ ...base(), knowledgeAreas: "pentest" });
    expect(result.code).toBe("INVALID_KNOWLEDGE_AREAS");
  });

  test("rejects more than 5 knowledge_areas", async () => {
    const result = await updateOwnIssuerProfile({ ...base(), knowledgeAreas: ["a", "b", "c", "d", "e", "f"] });
    expect(result.code).toBe("TOO_MANY_KNOWLEDGE_AREAS");
  });

  test("rejects a knowledge area over 100 chars", async () => {
    const result = await updateOwnIssuerProfile({ ...base(), knowledgeAreas: ["a".repeat(101)] });
    expect(result.code).toBe("INVALID_KNOWLEDGE_AREA");
  });

  test("rejects an empty organization_name", async () => {
    const result = await updateOwnIssuerProfile({ ...base(), organizationName: "   " });
    expect(result.code).toBe("INVALID_ORGANIZATION_NAME");
  });

  test("trims bio and organization_name, applies a partial update", async () => {
    const result = await updateOwnIssuerProfile({ ...base(), bio: "  hello  ", organizationName: "  HackAcademy 2  " });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      message: "Profile updated",
      issuer: {
        organization_name: "HackAcademy 2",
        bio: "hello",
        knowledge_areas: [],
        photo_url: null,
      },
    });
  });
});
