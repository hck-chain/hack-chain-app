const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { resolvePaymentDispute } = require("../resolvePaymentDispute");

jest.setTimeout(15000);

const STUDENT = "0x" + "aa".repeat(20);
const ISSUER  = "0x" + "bb".repeat(20);
const ADMIN   = "0x" + "ee".repeat(20);
const FUTURE  = "2030-12-31";

describe("resolvePaymentDispute", () => {
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
      payment_status:         "deposit_disputed",
      ...overrides,
    });
  }

  async function createDispute(classRequest, overrides = {}) {
    return models.ClassPaymentDispute.create({
      class_request_id: classRequest.id,
      dispute_type: "deposit",
      status: "open",
      opened_by_wallet: STUDENT,
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

    await User.create({ wallet_address: STUDENT, role: "student", name: "Ana",  nonce: nonce() });
    await User.create({ wallet_address: ISSUER,  role: "issuer",  name: "Prof", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", class_settings: {} });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when wasPaid isn't a boolean", async () => {
    await expect(resolvePaymentDispute({ models, adminWallet: ADMIN })).rejects.toThrow(TypeError);
  });

  test("returns DISPUTE_NOT_FOUND for an unknown id", async () => {
    const result = await resolvePaymentDispute({ models, disputeId: 999999, adminWallet: ADMIN, wasPaid: true });
    expect(result.code).toBe("DISPUTE_NOT_FOUND");
  });

  test("returns DISPUTE_ALREADY_RESOLVED when status isn't open", async () => {
    const req = await createRequest();
    const dispute = await createDispute(req, { status: "resolved_paid" });
    const result = await resolvePaymentDispute({ models, disputeId: dispute.id, adminWallet: ADMIN, wasPaid: true });
    expect(result.code).toBe("DISPUTE_ALREADY_RESOLVED");
  });

  test("resolves a deposit dispute as paid: confirms deposit and closes the dispute", async () => {
    const req = await createRequest();
    const dispute = await createDispute(req);

    const result = await resolvePaymentDispute({ models, disputeId: dispute.id, adminWallet: ADMIN, wasPaid: true, resolutionNote: "Verified on explorer" });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("deposit_confirmed");

    const updatedReq = await models.ClassRequest.findByPk(req.id);
    expect(updatedReq.payment_status).toBe("deposit_confirmed");
    expect(updatedReq.deposit_confirmed_at).not.toBeNull();

    const updatedDispute = await models.ClassPaymentDispute.findByPk(dispute.id);
    expect(updatedDispute.status).toBe("resolved_paid");
    expect(updatedDispute.resolved_by_wallet).toBe(ADMIN.toLowerCase());
  });

  test("resolves a deposit dispute as unpaid: reverts to unpaid so the talent can resubmit", async () => {
    const req = await createRequest();
    const dispute = await createDispute(req);

    const result = await resolvePaymentDispute({ models, disputeId: dispute.id, adminWallet: ADMIN, wasPaid: false });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("unpaid");

    const updatedDispute = await models.ClassPaymentDispute.findByPk(dispute.id);
    expect(updatedDispute.status).toBe("resolved_unpaid");
  });

  test("resolves a final-payment dispute as paid: transitions to paid", async () => {
    const req = await createRequest({ payment_status: "final_disputed" });
    const dispute = await createDispute(req, { dispute_type: "final" });

    const result = await resolvePaymentDispute({ models, disputeId: dispute.id, adminWallet: ADMIN, wasPaid: true });
    expect(result.data.payment_status).toBe("paid");
  });

  test("resolves a final-payment dispute as unpaid: reverts to deposit_confirmed", async () => {
    const req = await createRequest({ payment_status: "final_disputed" });
    const dispute = await createDispute(req, { dispute_type: "final" });

    const result = await resolvePaymentDispute({ models, disputeId: dispute.id, adminWallet: ADMIN, wasPaid: false });
    expect(result.data.payment_status).toBe("deposit_confirmed");
  });
});
