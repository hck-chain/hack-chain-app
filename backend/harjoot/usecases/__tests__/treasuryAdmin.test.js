// backend/harjoot/usecases/__tests__/treasuryAdmin.test.js
// Tests for both listTreasuryQueue + markTreasurySent (admin treasury ops).

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { listTreasuryQueue } = require("../listTreasuryQueue");
const { markTreasurySent } = require("../markTreasurySent");

describe("listTreasuryQueue + markTreasurySent", () => {
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
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(async () => { jest.restoreAllMocks(); if (sequelize) await sequelize.close(); });
  beforeEach(async () => { await sequelize.sync({ force: true }); });

  async function seedTransfer({ id, status = "awaiting_manual_conversion", paymentId = null }) {
    let pid = paymentId;
    if (pid === null) {
      const p = await models.Payment.create({
        id,
        tx_hash: "0x" + id.toString(16).padStart(64, "0"),
        from_wallet: "0x" + "1".repeat(40),
        amount_hack: "6900",
        harjoot_price_usd: "0.2000",
        user_price_usd: "0.6900",
        status: "confirmed",
        purpose: "certificate_issuance",
      });
      pid = p.id;
    }
    return models.TreasuryTransfer.create({
      id, payment_id: pid, amount_usdt_owed: "0.2000", destination: "harjoot", status,
    });
  }

  // -------------------------------------------------------------------------
  // listTreasuryQueue
  // -------------------------------------------------------------------------

  describe("listTreasuryQueue", () => {
    test("defaults to awaiting_manual_conversion sorted by created_at ASC", async () => {
      await seedTransfer({ id: 1, status: "sent" });
      await seedTransfer({ id: 2, status: "awaiting_manual_conversion" });
      await seedTransfer({ id: 3, status: "awaiting_manual_conversion" });

      const r = await listTreasuryQueue({ models });
      expect(r.items.map((i) => i.id)).toEqual([2, 3]);
      expect(r.total).toBe(2);
      expect(r.items[0].payment).not.toBeNull();
    });

    test("status='all' returns rows across all statuses", async () => {
      await seedTransfer({ id: 1, status: "pending" });
      await seedTransfer({ id: 2, status: "sent" });
      const r = await listTreasuryQueue({ models, status: "all" });
      expect(r.total).toBe(2);
    });

    test("invalid status throws TypeError", async () => {
      await expect(listTreasuryQueue({ models, status: "lol" })).rejects.toThrow(TypeError);
    });

    test("pagination math", async () => {
      for (let i = 1; i <= 8; i++) {
        await seedTransfer({ id: i, status: "awaiting_manual_conversion" });
      }
      const r = await listTreasuryQueue({ models, page: 2, limit: 3 });
      expect(r.items.length).toBe(3);
      expect(r.totalPages).toBe(3);
    });

    test("throws TypeError on missing models", async () => {
      await expect(listTreasuryQueue({})).rejects.toThrow(TypeError);
    });
  });

  // -------------------------------------------------------------------------
  // markTreasurySent
  // -------------------------------------------------------------------------

  describe("markTreasurySent", () => {
    const VALID_HASH = "0x" + "ab".repeat(32);

    test("transitions awaiting_manual_conversion -> sent + records hash + sent_at", async () => {
      await seedTransfer({ id: 1, status: "awaiting_manual_conversion" });
      const r = await markTreasurySent({
        models, transferId: 1, usdtTxHash: VALID_HASH, adminId: 7,
      });
      expect(r.ok).toBe(true);
      expect(r.transfer.status).toBe("sent");
      expect(r.transfer.usdtTxHash).toBe(VALID_HASH);
      expect(r.transfer.sentAt).toBeInstanceOf(Date);

      const reloaded = await models.TreasuryTransfer.findByPk(1);
      expect(reloaded.status).toBe("sent");
      expect(reloaded.usdt_tx_hash).toBe(VALID_HASH);
      expect(reloaded.error).toMatch(/admin_id=7/);
    });

    test("normalizes usdt_tx_hash to lowercase (same vector as Payment.tx_hash)", async () => {
      await seedTransfer({ id: 1, status: "awaiting_manual_conversion" });
      const mixed = "0xABcd" + "11".repeat(30);
      const r = await markTreasurySent({ models, transferId: 1, usdtTxHash: mixed });
      expect(r.transfer.usdtTxHash).toBe(mixed.toLowerCase());
    });

    test("accepts pending + sent_but_not_notified as valid 'from' states", async () => {
      await seedTransfer({ id: 1, status: "pending" });
      await seedTransfer({ id: 2, status: "sent_but_not_notified" });

      const a = await markTreasurySent({ models, transferId: 1, usdtTxHash: VALID_HASH });
      const b = await markTreasurySent({ models, transferId: 2, usdtTxHash: VALID_HASH.replace(/a/g, "b") });
      expect(a.ok).toBe(true);
      expect(b.ok).toBe(true);
    });

    test("NOT_FOUND on unknown id", async () => {
      const r = await markTreasurySent({ models, transferId: 999, usdtTxHash: VALID_HASH });
      expect(r).toEqual({ ok: false, reason: "NOT_FOUND" });
    });

    test("ALREADY_SENT and does not overwrite the existing hash", async () => {
      await seedTransfer({ id: 1, status: "awaiting_manual_conversion" });
      await markTreasurySent({ models, transferId: 1, usdtTxHash: VALID_HASH });

      const second = await markTreasurySent({
        models, transferId: 1, usdtTxHash: VALID_HASH.replace(/a/g, "c"),
      });
      expect(second.ok).toBe(false);
      expect(second.reason).toBe("ALREADY_SENT");
      expect(second.existingUsdtTxHash).toBe(VALID_HASH);
    });

    test("WRONG_STATE for failed rows (operator must triage)", async () => {
      await seedTransfer({ id: 1, status: "failed" });
      const r = await markTreasurySent({ models, transferId: 1, usdtTxHash: VALID_HASH });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe("WRONG_STATE");
      expect(r.currentStatus).toBe("failed");
    });

    test("TypeError guards: missing models / bad id / bad hash", async () => {
      await expect(markTreasurySent({ transferId: 1, usdtTxHash: VALID_HASH })).rejects.toThrow(TypeError);
      await expect(markTreasurySent({ models, transferId: 0, usdtTxHash: VALID_HASH })).rejects.toThrow(TypeError);
      await expect(markTreasurySent({ models, transferId: 1, usdtTxHash: "0xshort" })).rejects.toThrow(TypeError);
    });
  });
});
