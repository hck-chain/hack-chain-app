// backend/harjoot/usecases/__tests__/listPayments.test.js

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { listPayments } = require("../listPayments");

const EDU_A = "0x" + "1".repeat(40);
const EDU_B = "0x" + "2".repeat(40);

describe("listPayments", () => {
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

  async function makePayment({ id, fromWallet = EDU_A, status = "confirmed", createdAt = null }) {
    const row = await models.Payment.create({
      id,
      tx_hash: "0x" + id.toString(16).padStart(64, "0"),
      from_wallet: fromWallet,
      amount_hack: "6900",
      harjoot_price_usd: "0.2000",
      user_price_usd: "0.6900",
      status,
      purpose: "certificate_issuance",
    });
    if (createdAt) {
      // updateAttributes with silent:true to skip the timestamp auto-update.
      await models.Payment.update(
        { created_at: createdAt },
        { where: { id: row.id }, silent: true },
      );
    }
  }

  test("returns confirmed payments by default, newest first", async () => {
    await makePayment({ id: 1, createdAt: new Date("2026-01-01T00:00:00Z") });
    await makePayment({ id: 2, createdAt: new Date("2026-02-01T00:00:00Z") });
    await makePayment({ id: 3, status: "pending" });

    const r = await listPayments({ models });
    expect(r.total).toBe(2);
    expect(r.items.map((i) => i.id)).toEqual([2, 1]);
  });

  test("status='all' returns rows across statuses", async () => {
    await makePayment({ id: 1, status: "confirmed" });
    await makePayment({ id: 2, status: "pending" });
    const r = await listPayments({ models, status: "all" });
    expect(r.total).toBe(2);
  });

  test("fromWallet filters by educator (lowercased internally)", async () => {
    await makePayment({ id: 1, fromWallet: EDU_A });
    await makePayment({ id: 2, fromWallet: EDU_B });
    const r = await listPayments({ models, fromWallet: EDU_A.toUpperCase().replace(/X/g, "x") });
    expect(r.items.map((i) => i.id)).toEqual([1]);
  });

  test("fromWallet TypeError on malformed address", async () => {
    await expect(listPayments({ models, fromWallet: "nope" })).rejects.toThrow(TypeError);
  });

  test("from + to date range filtering", async () => {
    await makePayment({ id: 1, createdAt: new Date("2026-01-01T00:00:00Z") });
    await makePayment({ id: 2, createdAt: new Date("2026-02-15T00:00:00Z") });
    await makePayment({ id: 3, createdAt: new Date("2026-03-01T00:00:00Z") });

    const r = await listPayments({
      models,
      from: "2026-02-01T00:00:00Z",
      to:   "2026-03-01T00:00:00Z",
    });
    expect(r.items.map((i) => i.id)).toEqual([2]);
  });

  test("invalid date throws TypeError", async () => {
    await expect(listPayments({ models, from: "not-a-date" })).rejects.toThrow(TypeError);
  });

  test("pagination math", async () => {
    for (let i = 1; i <= 7; i++) {
      await makePayment({ id: i, createdAt: new Date(`2026-01-0${i}T00:00:00Z`) });
    }
    const p1 = await listPayments({ models, page: 1, limit: 3 });
    expect(p1.items.length).toBe(3);
    expect(p1.totalPages).toBe(3);
    const p3 = await listPayments({ models, page: 3, limit: 3 });
    expect(p3.items.length).toBe(1);
  });

  test("throws TypeError on missing models", async () => {
    await expect(listPayments({})).rejects.toThrow(TypeError);
  });
});
