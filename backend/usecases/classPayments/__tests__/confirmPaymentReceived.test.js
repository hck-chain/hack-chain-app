const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { confirmPaymentReceived } = require("../confirmPaymentReceived");

jest.setTimeout(15000);

const STUDENT = "0x" + "aa".repeat(20);
const ISSUER  = "0x" + "bb".repeat(20);
const ISSUER2 = "0x" + "dd".repeat(20);
const FUTURE  = "2030-12-31";

describe("confirmPaymentReceived", () => {
  let sequelize, models;

  const nonce = () => crypto.randomBytes(16).toString("hex");

  async function createRequest(overrides = {}) {
    return models.ClassRequest.create({
      student_wallet_address: STUDENT,
      issuer_wallet_address:  ISSUER,
      requested_date:         FUTURE,
      start_time:             "10:00",
      duration_minutes:       60,
      status:                 "confirmed",
      payment_status:         "deposit_submitted",
      ...overrides,
    });
  }

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;

    const User               = require("../../../models/users")(sequelize, DataTypes);
    const Issuer              = require("../../../models/issuers")(sequelize, DataTypes);
    const IssuerClass         = require("../../../models/issuerClasses")(sequelize, DataTypes);
    const ClassRequest        = require("../../../models/classRequests")(sequelize, DataTypes);
    const ClassPaymentDispute = require("../../../models/classPaymentDisputes")(sequelize, DataTypes);
    const Student             = require("../../../models/students")(sequelize, DataTypes);
    const Recruiter           = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate         = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession         = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, IssuerClass, ClassRequest, ClassPaymentDispute, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    await User.create({ wallet_address: STUDENT, role: "student", name: "Ana",   nonce: nonce() });
    await User.create({ wallet_address: ISSUER,  role: "issuer",  name: "Prof",  nonce: nonce() });
    await User.create({ wallet_address: ISSUER2, role: "issuer",  name: "Other", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER,  organization_name: "HackAcademy", class_settings: {} });
    await Issuer.create({ wallet_address: ISSUER2, organization_name: "OtherAcademy", class_settings: {} });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when required args are missing", async () => {
    await expect(confirmPaymentReceived({ issuerWallet: ISSUER, stage: "deposit" })).rejects.toThrow(TypeError);
  });

  test("returns INVALID_STAGE for an unknown stage", async () => {
    const req = await createRequest();
    const result = await confirmPaymentReceived({ models, requestId: req.id, issuerWallet: ISSUER, stage: "bogus" });
    expect(result.code).toBe("INVALID_STAGE");
  });

  test("returns REQUEST_NOT_FOUND when request belongs to a different educator", async () => {
    const req = await createRequest();
    const result = await confirmPaymentReceived({ models, requestId: req.id, issuerWallet: ISSUER2, stage: "deposit" });
    expect(result.code).toBe("REQUEST_NOT_FOUND");
  });

  test("returns UNEXPECTED_PAYMENT_STATUS when payment_status doesn't match the stage", async () => {
    const req = await createRequest({ payment_status: "unpaid" });
    const result = await confirmPaymentReceived({ models, requestId: req.id, issuerWallet: ISSUER, stage: "deposit" });
    expect(result.code).toBe("UNEXPECTED_PAYMENT_STATUS");
  });

  test("confirms deposit and sets deposit_confirmed_at", async () => {
    const req = await createRequest();
    const result = await confirmPaymentReceived({ models, requestId: req.id, issuerWallet: ISSUER, stage: "deposit" });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("deposit_confirmed");

    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.deposit_confirmed_at).not.toBeNull();
  });

  test("confirms final payment and transitions to paid", async () => {
    const req = await createRequest({ payment_status: "final_submitted" });
    const result = await confirmPaymentReceived({ models, requestId: req.id, issuerWallet: ISSUER, stage: "final" });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("paid");

    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.final_confirmed_at).not.toBeNull();
  });
});
