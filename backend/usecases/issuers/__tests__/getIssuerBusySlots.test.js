const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getIssuerBusySlots } = require("../getIssuerBusySlots");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const STUDENT = "0x" + "aa".repeat(20);

describe("getIssuerBusySlots", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

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
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await models.User.create({ wallet_address: STUDENT, role: "student", name: "Ana", nonce: nonce() });

    await models.ClassRequest.create({
      student_wallet_address: STUDENT, issuer_wallet_address: ISSUER,
      requested_date: "2030-06-01", start_time: "10:00", duration_minutes: 60, status: "pending",
    });
    await models.ClassRequest.create({
      student_wallet_address: STUDENT, issuer_wallet_address: ISSUER,
      requested_date: "2030-06-02", start_time: "11:00", duration_minutes: 30, status: "cancelled",
    });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or walletAddress is missing", async () => {
    await expect(getIssuerBusySlots({ walletAddress: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns INVALID_WALLET_ADDRESS for a malformed wallet", async () => {
    const result = await getIssuerBusySlots({ models, walletAddress: "bad" });
    expect(result.code).toBe("INVALID_WALLET_ADDRESS");
  });

  test("only returns pending/confirmed slots, never student data", async () => {
    const result = await getIssuerBusySlots({ models, walletAddress: ISSUER });
    expect(result.ok).toBe(true);
    expect(result.data.slots).toEqual([
      { date: "2030-06-01", startTime: "10:00", durationMinutes: 60 },
    ]);
  });
});
