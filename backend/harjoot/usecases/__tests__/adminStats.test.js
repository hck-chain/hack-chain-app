// backend/harjoot/usecases/__tests__/adminStats.test.js

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { adminStats } = require("../adminStats");

describe("adminStats", () => {
  let sequelize;
  let models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    const { DataTypes } = SequelizePkg;

    const User = require("../../../models/users")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const Payment = require("../../../models/payments")(sequelize, DataTypes);
    const TreasuryTransfer = require("../../../models/treasuryTransfers")(sequelize, DataTypes);
    const TalentInvitation = require("../../../models/talentInvitations")(sequelize, DataTypes);
    const all = { User, Student, Issuer, Recruiter, UserSession, Certificate, Payment, TreasuryTransfer, TalentInvitation };
    Object.values(all).forEach((m) => m.associate && m.associate(all));
    await sequelize.sync({ force: true });
    models = all;
  });

  afterAll(async () => { if (sequelize) await sequelize.close(); });

  beforeEach(async () => { await sequelize.sync({ force: true }); });

  const NOW = new Date("2026-06-06T12:00:00Z");

  async function makeIssuer({ id, status }) {
    return models.User.create({
      id, wallet_address: "0x" + id.toString(16).padStart(40, "0"),
      role: "issuer", name: `I${id}`, email: `i${id}@x.com`,
      nonce: crypto.randomBytes(8).toString("hex"),
      educator_approval_status: status,
    });
  }

  async function seedIssuerStudentForCerts() {
    const issuerWallet = "0x" + "1".repeat(40);
    const studentWallet = "0x" + "2".repeat(40);
    // User rows must exist first because issuers + students reference them.
    await models.User.create({
      wallet_address: issuerWallet, role: "issuer", name: "Iss", email: "iss@x.com",
      nonce: crypto.randomBytes(8).toString("hex"),
    });
    await models.User.create({
      wallet_address: studentWallet, role: "student", name: "Sty", email: "sty@x.com",
      nonce: crypto.randomBytes(8).toString("hex"),
    });
    await models.Issuer.create({ wallet_address: issuerWallet, organization_name: "TestOrg" });
    await models.Student.create({ wallet_address: studentWallet });
  }

  async function makeCert({ id, daysAgo }) {
    const createdAt = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    await models.Certificate.create({
      id,
      issuer_wallet_address: "0x" + "1".repeat(40),
      student_wallet_address: "0x" + "2".repeat(40),
      title: `Cert ${id}`,
      certificate_hash: crypto.randomBytes(32).toString("hex"),
      token_id: String(id),
      issue_date: "2026-06-05",
      status: "issued",
      created_at: createdAt,
      updated_at: createdAt,
    }, { silent: true });
  }

  async function makePayment({ id, userPrice = "0.6900", harjootPrice = "0.2000", status = "confirmed" }) {
    await models.Payment.create({
      id,
      tx_hash: "0x" + id.toString(16).padStart(64, "0"),
      from_wallet: "0x" + "1".repeat(40),
      amount_hack: "6900",
      harjoot_price_usd: harjootPrice,
      user_price_usd: userPrice,
      status,
      purpose: "certificate_issuance",
    });
  }

  async function makeTreasury({ id, paymentId, status, amount = "0.2000" }) {
    await models.TreasuryTransfer.create({
      id, payment_id: paymentId, amount_usdt_owed: amount, destination: "harjoot", status,
    });
  }

  // -------------------------------------------------------------------------

  test("counters at zero on empty DB", async () => {
    const r = await adminStats({ models, now: NOW });
    expect(r.educators).toEqual({ pending: 0, approved: 0, rejected: 0, total: 0 });
    expect(r.certificates).toEqual({ today: 0, last_7_days: 0, total: 0 });
    expect(r.revenue).toEqual({ gross_usd: "0.00", harjoot_cost_usd: "0.00", margin_usd: "0.00" });
    expect(r.treasury).toMatchObject({
      pending: 0, awaiting_manual_conversion: 0, sent: 0, failed: 0,
      outstanding_debt_usd: "0.00",
    });
  });

  test("educator counters split by approval status", async () => {
    await makeIssuer({ id: 1, status: "pending_approval" });
    await makeIssuer({ id: 2, status: "pending_approval" });
    await makeIssuer({ id: 3, status: "approved" });
    await makeIssuer({ id: 4, status: "rejected" });

    const r = await adminStats({ models, now: NOW });
    expect(r.educators).toEqual({ pending: 2, approved: 1, rejected: 1, total: 4 });
  });

  test("certificate counters split by today / last 7 days / total", async () => {
    await seedIssuerStudentForCerts();
    await makeCert({ id: 1, daysAgo: 0 });   // today
    await makeCert({ id: 2, daysAgo: 0.3 }); // earlier today
    await makeCert({ id: 3, daysAgo: 3 });   // within 7d but not today
    await makeCert({ id: 4, daysAgo: 30 });  // old

    const r = await adminStats({ models, now: NOW });
    expect(r.certificates.today).toBe(2);
    expect(r.certificates.last_7_days).toBe(3);
    expect(r.certificates.total).toBe(4);
  });

  test("revenue + harjoot cost + margin from confirmed payments", async () => {
    await makePayment({ id: 1, userPrice: "0.6900", harjootPrice: "0.2000" });
    await makePayment({ id: 2, userPrice: "0.6900", harjootPrice: "0.2000" });
    await makePayment({ id: 3, userPrice: "1.0000", harjootPrice: "0.2500" });
    // non-confirmed should NOT count
    await makePayment({ id: 4, userPrice: "10.0000", harjootPrice: "10.0000", status: "pending" });

    const r = await adminStats({ models, now: NOW });
    expect(parseFloat(r.revenue.gross_usd)).toBeCloseTo(2.38, 2); // 0.69+0.69+1.00
    expect(parseFloat(r.revenue.harjoot_cost_usd)).toBeCloseTo(0.65, 2); // 0.20+0.20+0.25
    expect(parseFloat(r.revenue.margin_usd)).toBeCloseTo(1.73, 2);
  });

  test("treasury counters + outstanding debt sums pending + awaiting", async () => {
    await makePayment({ id: 1 });
    await makePayment({ id: 2 });
    await makePayment({ id: 3 });
    await makePayment({ id: 4 });
    await makeTreasury({ id: 1, paymentId: 1, status: "pending",                     amount: "0.2000" });
    await makeTreasury({ id: 2, paymentId: 2, status: "awaiting_manual_conversion",  amount: "0.2000" });
    await makeTreasury({ id: 3, paymentId: 3, status: "sent",                        amount: "0.2000" });
    await makeTreasury({ id: 4, paymentId: 4, status: "failed",                      amount: "0.2000" });

    const r = await adminStats({ models, now: NOW });
    expect(r.treasury.pending).toBe(1);
    expect(r.treasury.awaiting_manual_conversion).toBe(1);
    expect(r.treasury.sent).toBe(1);
    expect(r.treasury.failed).toBe(1);
    expect(parseFloat(r.treasury.outstanding_debt_usd)).toBeCloseTo(0.40, 2);
  });

  test("generated_at echoes the injected `now`", async () => {
    const r = await adminStats({ models, now: NOW });
    expect(r.generated_at).toBe(NOW.toISOString());
  });

  test("throws TypeError on missing models", async () => {
    await expect(adminStats({})).rejects.toThrow(TypeError);
  });
});
