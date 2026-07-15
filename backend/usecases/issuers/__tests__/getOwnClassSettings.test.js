// Unit tests for getOwnClassSettings use case.
// Uses SQLite in-memory — no HTTP layer involved.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getOwnClassSettings } = require("../getOwnClassSettings");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);

describe("getOwnClassSettings", () => {
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
    await User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await Issuer.create({
      wallet_address: ISSUER,
      organization_name: "HackAcademy",
      class_settings: { hourly_rate_usd: 50, durations: [30, 60] },
    });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models is missing", async () => {
    await expect(getOwnClassSettings({ wallet: ISSUER })).rejects.toThrow(TypeError);
  });

  test("throws TypeError when wallet is missing", async () => {
    await expect(getOwnClassSettings({ models })).rejects.toThrow(TypeError);
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await getOwnClassSettings({ models, wallet: "0x" + "ff".repeat(20) });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("ISSUER_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("returns the issuer's class_settings", async () => {
    const result = await getOwnClassSettings({ models, wallet: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data.class_settings).toEqual({ hourly_rate_usd: 50, durations: [30, 60] });
  });

  test("is case-insensitive on wallet address", async () => {
    const result = await getOwnClassSettings({ models, wallet: ISSUER.toUpperCase() });
    expect(result.ok).toBe(true);
  });

  test("returns null class_settings when the issuer has none set", async () => {
    const bareIssuer = "0x" + "cc".repeat(20);
    await models.User.create({ wallet_address: bareIssuer, role: "issuer", name: "New", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Issuer.create({ wallet_address: bareIssuer, organization_name: "NewOrg" });

    const result = await getOwnClassSettings({ models, wallet: bareIssuer });
    expect(result.ok).toBe(true);
    expect(result.data.class_settings).toBeNull();
  });
});
