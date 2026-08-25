const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { openPaymentDispute } = require("../openPaymentDispute");

jest.setTimeout(15000);

const STUDENT  = "0x" + "aa".repeat(20);
const STUDENT2 = "0x" + "cc".repeat(20);
const ISSUER   = "0x" + "bb".repeat(20);
const FUTURE   = "2030-12-31";

describe("openPaymentDispute", () => {
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

    await User.create({ wallet_address: STUDENT,  role: "student", name: "Ana",  nonce: nonce() });
    await User.create({ wallet_address: STUDENT2, role: "student", name: "Bob",  nonce: nonce() });
    await User.create({ wallet_address: ISSUER,   role: "issuer",  name: "Prof", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", class_settings: {} });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when required args are missing", async () => {
    await expect(openPaymentDispute({ studentWallet: STUDENT, stage: "deposit" })).rejects.toThrow(TypeError);
  });

  test("returns REQUEST_NOT_FOUND when request belongs to a different student", async () => {
    const req = await createRequest();
    const result = await openPaymentDispute({ models, requestId: req.id, studentWallet: STUDENT2, stage: "deposit" });
    expect(result.code).toBe("REQUEST_NOT_FOUND");
  });

  test("returns UNEXPECTED_PAYMENT_STATUS when nothing was submitted yet", async () => {
    const req = await createRequest({ payment_status: "unpaid" });
    const result = await openPaymentDispute({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit" });
    expect(result.code).toBe("UNEXPECTED_PAYMENT_STATUS");
  });

  test("opens a deposit dispute and transitions payment_status", async () => {
    const req = await createRequest();
    const result = await openPaymentDispute({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit" });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("deposit_disputed");
    expect(result.data.disputeId).toBeDefined();

    const dispute = await models.ClassPaymentDispute.findByPk(result.data.disputeId);
    expect(dispute.dispute_type).toBe("deposit");
    expect(dispute.status).toBe("open");
    expect(dispute.opened_by_wallet).toBe(STUDENT.toLowerCase());
  });

  test("opens a final-payment dispute", async () => {
    const req = await createRequest({ payment_status: "final_submitted" });
    const result = await openPaymentDispute({ models, requestId: req.id, studentWallet: STUDENT, stage: "final" });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("final_disputed");
  });
});
