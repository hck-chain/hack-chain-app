const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getOwnIssuerProfile } = require("../getOwnIssuerProfile");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);

describe("getOwnIssuerProfile", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;

    const User         = require("../../../models/users")(sequelize, DataTypes);
    const Issuer       = require("../../../models/issuers")(sequelize, DataTypes);
    const IssuerClass  = require("../../../models/issuerClasses")(sequelize, DataTypes);
    const ClassRequest = require("../../../models/classRequests")(sequelize, DataTypes);
    const Student      = require("../../../models/students")(sequelize, DataTypes);
    const Recruiter    = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate  = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession  = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, IssuerClass, ClassRequest, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", lastname: "Ok", email: "prof@x.com", email_verified: true, nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", bio: "bio", knowledge_areas: ["pentest"] });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or wallet is missing", async () => {
    await expect(getOwnIssuerProfile({ wallet: ISSUER })).rejects.toThrow(TypeError);
    await expect(getOwnIssuerProfile({ models })).rejects.toThrow(TypeError);
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await getOwnIssuerProfile({ models, wallet: "0x" + "ff".repeat(20) });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("ISSUER_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("returns the full merged profile", async () => {
    const result = await getOwnIssuerProfile({ models, wallet: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      organization_name: "HackAcademy",
      bio: "bio",
      photo_url: null,
      certificate_logo_url: null,
      knowledge_areas: ["pentest"],
      wallet_address: ISSUER,
      email: "prof@x.com",
      name: "Prof",
      lastname: "Ok",
      email_verified: true,
    });
  });
});
