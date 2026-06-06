// backend/workers/__tests__/treasuryForwarder.test.js
//
// SQLite-in-memory exercises the real Sequelize Payment + TreasuryTransfer
// + Certificate models. Strategy + harjootClient + usdtTransfer are mocked.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { processTreasuryQueue } = require("../treasuryForwarder");

const EDUCATOR = "0x1111111111111111111111111111111111111111";
const STUDENT  = "0x2222222222222222222222222222222222222222";
const HARJOOT_WALLET = "0x3333333333333333333333333333333333333333";

describe("treasuryForwarder.processTreasuryQueue", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, UserSession;
  let Certificate, Payment, TreasuryTransfer, TalentInvitation;
  let models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    const { DataTypes } = SequelizePkg;

    User = require("../../models/users")(sequelize, DataTypes);
    Student = require("../../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    Issuer = require("../../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../../models/recruiters")(sequelize, DataTypes);
    UserSession = require("../../models/userSessions")(sequelize, DataTypes);
    Certificate = require("../../models/certificates")(sequelize, DataTypes);
    Payment = require("../../models/payments")(sequelize, DataTypes);
    TreasuryTransfer = require("../../models/treasuryTransfers")(sequelize, DataTypes);
    TalentInvitation = require("../../models/talentInvitations")(sequelize, DataTypes);

    const all = { User, Student, Issuer, Recruiter, UserSession, Certificate, Payment, TreasuryTransfer, TalentInvitation };
    Object.values(all).forEach((m) => m.associate && m.associate(all));

    await sequelize.sync({ force: true });
    models = { ...all, sequelize };

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (sequelize) await sequelize.close();
  });

  // -------------------------------------------------------------------------
  // Seed helpers
  // -------------------------------------------------------------------------

  async function seedBaseUsers() {
    await sequelize.sync({ force: true });
    await User.create({
      id: 1, wallet_address: EDUCATOR, role: "issuer", name: "Edu",
      email: "edu@x.com", nonce: crypto.randomBytes(8).toString("hex"),
      educator_approval_status: "approved",
    });
    await Issuer.create({ wallet_address: EDUCATOR, organization_name: "Acme" });
    await User.create({
      id: 2, wallet_address: STUDENT, role: "student", name: "Sty",
      email: "sty@x.com", nonce: crypto.randomBytes(8).toString("hex"),
    });
    await Student.create({ wallet_address: STUDENT });
  }

  async function seedQueueRow({
    txHashSuffix,
    amountHack = 6900n,
    verificationId = null,
    status = "pending",
  } = {}) {
    const payment = await Payment.create({
      tx_hash: "0x" + (txHashSuffix || crypto.randomBytes(32).toString("hex")),
      from_wallet: EDUCATOR,
      amount_hack: amountHack.toString(),
      harjoot_price_usd: "0.2000",
      user_price_usd: "0.6900",
      status: "confirmed",
      purpose: "certificate_issuance",
    });
    if (verificationId !== null) {
      await Certificate.create({
        issuer_wallet_address: EDUCATOR,
        student_wallet_address: STUDENT,
        title: "Cert",
        certificate_hash: crypto.randomBytes(32).toString("hex"),
        token_id: String(payment.id * 100),
        issue_date: "2026-06-05",
        payment_id: payment.id,
        harjoot_verification_id: verificationId,
        status: "issued",
      });
    }
    const transfer = await TreasuryTransfer.create({
      payment_id: payment.id,
      amount_usdt_owed: "0.2000",
      destination: "harjoot",
      status,
    });
    return { payment, transfer };
  }

  function makeStrategy(behavior) {
    return { convert: jest.fn().mockImplementation(behavior) };
  }

  function makeHarjootClient(notifyImpl) {
    return {
      notifyPayment: jest.fn().mockImplementation(notifyImpl || (async () => ({ ok: true }))),
    };
  }

  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  test("returns processed=0 when the queue is empty", async () => {
    await seedBaseUsers();
    const strategy = makeStrategy(async () => ({ mode: "manual", awaitingManual: true }));
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(),
    });
    expect(result).toEqual({ processed: 0, mode: null });
    expect(strategy.convert).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Manual happy path
  // -------------------------------------------------------------------------

  test("manual mode parks the batch as awaiting_manual_conversion", async () => {
    await seedBaseUsers();
    const r1 = await seedQueueRow({ txHashSuffix: "a".repeat(64), amountHack: 6900n });
    const r2 = await seedQueueRow({ txHashSuffix: "b".repeat(64), amountHack: 6900n });

    const strategy = makeStrategy(async ({ hackAmount }) => {
      expect(hackAmount).toBe(13800n); // 6900 + 6900
      return { mode: "manual", awaitingManual: true };
    });
    const harjootClient = makeHarjootClient();

    const result = await processTreasuryQueue({ models, strategy, harjootClient });

    expect(result).toEqual({ processed: 2, mode: "manual", awaitingManual: true });
    const reloaded = await TreasuryTransfer.findAll({ order: [["id", "ASC"]] });
    expect(reloaded.map((t) => t.status)).toEqual([
      "awaiting_manual_conversion", "awaiting_manual_conversion",
    ]);
    // No USDT transfer or notify in manual mode.
    expect(harjootClient.notifyPayment).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Strategy failures
  // -------------------------------------------------------------------------

  test("strategy throws -> rows marked failed; conversion error captured", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "c".repeat(64) });

    const strategy = makeStrategy(async () => { throw new Error("DEX router down"); });
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(),
    });

    expect(result.failed).toBe(true);
    expect(result.error).toMatch(/STRATEGY_FAILED.*DEX router down/);
    const row = await TreasuryTransfer.findOne();
    expect(row.status).toBe("failed");
    expect(row.error).toMatch(/STRATEGY_FAILED.*DEX router down/);
  });

  // -------------------------------------------------------------------------
  // Non-manual happy path
  // -------------------------------------------------------------------------

  test("non-manual mode transfers USDT, marks sent, calls notifyPayment with verificationIds", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "d".repeat(64), verificationId: "ver_A" });
    await seedQueueRow({ txHashSuffix: "e".repeat(64), verificationId: "ver_B" });

    const strategy = makeStrategy(async () => ({
      mode: "swap",
      usdtAmount: 400000n, // 0.40 USDT in 6-decimals base units
      txHash: "0xSWAP",
      costs: { gasUsd: 0.05 },
    }));
    const usdtTransfer = jest.fn().mockResolvedValue({ txHash: "0xUSDTtx" });
    const harjootClient = makeHarjootClient();

    const result = await processTreasuryQueue({
      models, strategy, harjootClient, usdtTransfer, harjootWallet: HARJOOT_WALLET,
    });

    expect(result.processed).toBe(2);
    expect(result.mode).toBe("swap");
    expect(result.usdtTxHash).toBe("0xUSDTtx");
    expect(result.notifiedCount).toBe(2);

    expect(usdtTransfer).toHaveBeenCalledWith({
      usdtAmount: 400000n,
      recipient: HARJOOT_WALLET,
    });
    expect(harjootClient.notifyPayment).toHaveBeenCalledWith(
      ["ver_A", "ver_B"],
      "0xUSDTtx",
    );

    const reloaded = await TreasuryTransfer.findAll({ order: [["id", "ASC"]] });
    for (const r of reloaded) {
      expect(r.status).toBe("sent");
      expect(r.usdt_tx_hash).toBe("0xUSDTtx");
      expect(r.sent_at).toBeInstanceOf(Date);
    }
  });

  test("non-manual without usdtTransfer dep -> rows failed, no transfer attempted", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "f".repeat(64) });

    const strategy = makeStrategy(async () => ({
      mode: "swap", usdtAmount: 200000n, txHash: "0xSWAP",
    }));
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(),
      // usdtTransfer + harjootWallet missing on purpose
    });
    expect(result.failed).toBe(true);
    expect(result.error).toMatch(/STRATEGY_NEEDS_USDT_TRANSFER/);
    const row = await TreasuryTransfer.findOne();
    expect(row.status).toBe("failed");
  });

  test("non-manual without harjootWallet -> rows failed", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "0".repeat(64) });

    const strategy = makeStrategy(async () => ({
      mode: "swap", usdtAmount: 200000n, txHash: "0xSWAP",
    }));
    const usdtTransfer = jest.fn();
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(), usdtTransfer,
    });
    expect(result.error).toMatch(/STRATEGY_NEEDS_HARJOOT_WALLET/);
    expect(usdtTransfer).not.toHaveBeenCalled();
  });

  test("USDT transfer throws -> rows failed with USDT_TRANSFER_FAILED", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "1".repeat(64) });

    const strategy = makeStrategy(async () => ({
      mode: "swap", usdtAmount: 200000n, txHash: "0xSWAP",
    }));
    const usdtTransfer = jest.fn().mockRejectedValue(new Error("RPC timeout"));
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(),
      usdtTransfer, harjootWallet: HARJOOT_WALLET,
    });

    expect(result.failed).toBe(true);
    expect(result.error).toMatch(/USDT_TRANSFER_FAILED.*RPC timeout/);
    const row = await TreasuryTransfer.findOne();
    expect(row.status).toBe("failed");
  });

  test("USDT transfer returns no txHash -> rows failed with USDT_TRANSFER_NO_HASH", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "2".repeat(64) });

    const strategy = makeStrategy(async () => ({
      mode: "swap", usdtAmount: 200000n, txHash: "0xSWAP",
    }));
    const usdtTransfer = jest.fn().mockResolvedValue({ /* no txHash */ });
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(),
      usdtTransfer, harjootWallet: HARJOOT_WALLET,
    });

    expect(result.failed).toBe(true);
    expect(result.error).toMatch(/USDT_TRANSFER_NO_HASH/);
  });

  // -------------------------------------------------------------------------
  // Notify failure DOES NOT undo USDT
  // -------------------------------------------------------------------------

  test("notifyPayment throws -> rows transition to sent_but_not_notified; USDT not reverted", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "3".repeat(64), verificationId: "ver_X" });

    const strategy = makeStrategy(async () => ({
      mode: "swap", usdtAmount: 200000n, txHash: "0xSWAP",
    }));
    const usdtTransfer = jest.fn().mockResolvedValue({ txHash: "0xUSDT-good" });
    const harjootClient = makeHarjootClient(async () => { throw new Error("Harjoot down"); });

    const result = await processTreasuryQueue({
      models, strategy, harjootClient, usdtTransfer, harjootWallet: HARJOOT_WALLET,
    });

    expect(result.notifyFailed).toBe(true);
    expect(result.usdtTxHash).toBe("0xUSDT-good");
    expect(result.error).toMatch(/Harjoot down/);

    const row = await TreasuryTransfer.findOne();
    expect(row.status).toBe("sent_but_not_notified");
    expect(row.usdt_tx_hash).toBe("0xUSDT-good");
    expect(row.error).toMatch(/NOTIFY_FAILED.*Harjoot down/);
  });

  // -------------------------------------------------------------------------
  // batchSize
  // -------------------------------------------------------------------------

  test("respects batchSize so large queues are drained in chunks", async () => {
    await seedBaseUsers();
    // Seed 3 rows; batchSize=2 should only touch 2 this run.
    await seedQueueRow({ txHashSuffix: "4".repeat(64) });
    await seedQueueRow({ txHashSuffix: "5".repeat(64) });
    await seedQueueRow({ txHashSuffix: "6".repeat(64) });

    const strategy = makeStrategy(async () => ({ mode: "manual", awaitingManual: true }));
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(), batchSize: 2,
    });
    expect(result.processed).toBe(2);
    const stillPending = await TreasuryTransfer.count({ where: { status: "pending" } });
    expect(stillPending).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Skips rows that aren't pending
  // -------------------------------------------------------------------------

  test("does not touch rows whose status is already sent / failed / awaiting_manual_conversion", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "7".repeat(64), status: "sent" });
    await seedQueueRow({ txHashSuffix: "8".repeat(64), status: "failed" });
    await seedQueueRow({ txHashSuffix: "9".repeat(64), status: "awaiting_manual_conversion" });

    const strategy = makeStrategy(async () => ({ mode: "manual", awaitingManual: true }));
    const result = await processTreasuryQueue({
      models, strategy, harjootClient: makeHarjootClient(),
    });
    expect(result.processed).toBe(0);
    expect(strategy.convert).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Verification id collection — tolerates rows without a certificate
  // -------------------------------------------------------------------------

  test("filters out missing/empty verificationIds before calling notifyPayment", async () => {
    await seedBaseUsers();
    await seedQueueRow({ txHashSuffix: "aa".repeat(32), verificationId: "ver_OK" });
    await seedQueueRow({ txHashSuffix: "bb".repeat(32), verificationId: null }); // no cert
    await seedQueueRow({ txHashSuffix: "cc".repeat(32), verificationId: "" });   // empty

    const strategy = makeStrategy(async () => ({
      mode: "swap", usdtAmount: 600000n, txHash: "0xSWAP",
    }));
    const usdtTransfer = jest.fn().mockResolvedValue({ txHash: "0xUSDT" });
    const harjootClient = makeHarjootClient();

    await processTreasuryQueue({
      models, strategy, harjootClient, usdtTransfer, harjootWallet: HARJOOT_WALLET,
    });

    expect(harjootClient.notifyPayment).toHaveBeenCalledWith(["ver_OK"], "0xUSDT");
  });

  // -------------------------------------------------------------------------
  // Programmer-error guards
  // -------------------------------------------------------------------------

  test("throws TypeError when strategy is missing", async () => {
    await expect(
      processTreasuryQueue({ models, harjootClient: makeHarjootClient() }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError when harjootClient.notifyPayment is missing", async () => {
    const strategy = makeStrategy(async () => ({ mode: "manual", awaitingManual: true }));
    await expect(
      processTreasuryQueue({ models, strategy, harjootClient: {} }),
    ).rejects.toThrow(TypeError);
  });
});
