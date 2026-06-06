// backend/services/__tests__/verifyHackPayment.test.js
//
// Exercises the receipt-decoding logic + replay protection + persistence
// path of paymentService.verifyHackPayment. SQLite in-memory provides
// the real Payment model + the tx_hash unique constraint; the chain is
// stubbed through a minimal provider double that returns canned receipts.

const SequelizePkg = require("sequelize");
const { Interface } = require("ethers");

const { verifyHackPayment, __TRANSFER_TOPIC0 } = require("../paymentService");

// Addresses are 0x + 40 hex chars (20 bytes). ethers parses these so they
// must be syntactically valid even when they don't point at a real contract.
const HACK_TOKEN  = "0x0000000000000000000000000000000000000ace";
const TREASURY    = "0x0000000000000000000000000000000000000bee";
const EDUCATOR    = "0x1111111111111111111111111111111111111111";
const OTHER_USER  = "0x2222222222222222222222222222222222222222";
const OTHER_TOKEN = "0x9999999999999999999999999999999999999999";

// 6900 whole HACK at 18 decimals = 6900 * 10^18.
const DECIMALS = 18;
const SCALE = 10n ** BigInt(DECIMALS);
const EXPECTED_HACK = 6900n;
const EXPECTED_BASE = EXPECTED_HACK * SCALE;

const DEFAULT_TX = "0x" + "ab".repeat(32);
const DEFAULT_PRICING = { harjootCostUsdCents: 20, userPriceUsdCents: 69 };

// Override the harjoot config for these tests so we don't depend on env.
const STUB_CONFIG = {
  chain: {
    treasuryAddress: TREASURY,
    hackTokenAddress: HACK_TOKEN,
    hackTokenDecimals: DECIMALS,
  },
};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const transferIface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

function makeTransferLog({ tokenAddress, from, to, value }) {
  const encoded = transferIface.encodeEventLog("Transfer", [from, to, value]);
  return {
    address: tokenAddress,
    topics: encoded.topics,
    data: encoded.data,
  };
}

function makeReceipt({ status = 1, logs = [] } = {}) {
  return { status, logs };
}

function makeProvider({ receipt = null, error = null } = {}) {
  return {
    async getTransactionReceipt(_txHash) {
      if (error) throw error;
      return receipt;
    },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("paymentService.verifyHackPayment", () => {
  let sequelize;
  let Payment;
  let models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    const { DataTypes } = SequelizePkg;
    Payment = require("../../models/payments")(sequelize, DataTypes);
    await sequelize.sync({ force: true });
    models = { Payment };

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test("confirms an exact-amount payment, persists payments row, returns ok", async () => {
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({
          tokenAddress: HACK_TOKEN,
          from: EDUCATOR,
          to: TREASURY,
          value: EXPECTED_BASE,
        }),
      ],
    });
    const provider = makeProvider({ receipt });

    const result = await verifyHackPayment({
      models,
      provider,
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(true);
    expect(result.payment.txHash).toBe(DEFAULT_TX);
    expect(result.payment.fromWallet).toBe(EDUCATOR);
    expect(result.payment.amountHack).toBe(EXPECTED_HACK);

    const row = await Payment.findOne({ where: { tx_hash: DEFAULT_TX } });
    expect(row).not.toBeNull();
    expect(row.from_wallet).toBe(EDUCATOR);
    expect(BigInt(row.amount_hack)).toBe(EXPECTED_HACK);
    expect(row.status).toBe("confirmed");
    expect(row.purpose).toBe("certificate_issuance");
    // DECIMAL columns come back as number in SQLite, "0.2000" in Postgres.
    // Compare as numbers so the assertion is portable across drivers.
    expect(Number(row.harjoot_price_usd)).toBeCloseTo(0.2, 4);
    expect(Number(row.user_price_usd)).toBeCloseTo(0.69, 4);
  });

  test("accepts an overpayment and stores the actual amount paid", async () => {
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({
          tokenAddress: HACK_TOKEN,
          from: EDUCATOR,
          to: TREASURY,
          value: EXPECTED_BASE * 2n,
        }),
      ],
    });

    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(true);
    expect(result.payment.amountHack).toBe(EXPECTED_HACK * 2n);
  });

  test("sums multiple HACK->treasury transfers from the same educator in one tx", async () => {
    // Router-style path: two internal hops both ending at treasury.
    const half = EXPECTED_BASE / 2n;
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({ tokenAddress: HACK_TOKEN, from: EDUCATOR, to: TREASURY, value: half }),
        makeTransferLog({ tokenAddress: HACK_TOKEN, from: EDUCATOR, to: TREASURY, value: half }),
      ],
    });

    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(true);
    expect(result.payment.amountHack).toBe(EXPECTED_HACK);
  });

  test("accepts mixed-case expectedFrom (lowercases internally)", async () => {
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({
          tokenAddress: HACK_TOKEN,
          from: EDUCATOR,
          to: TREASURY,
          value: EXPECTED_BASE,
        }),
      ],
    });

    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR.toUpperCase().replace(/X/g, "x"),
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Receipt-level failures
  // -------------------------------------------------------------------------

  test("returns TX_NOT_FOUND when provider returns null", async () => {
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt: null }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result).toEqual({ ok: false, reason: "TX_NOT_FOUND" });
    expect(await Payment.count()).toBe(0);
  });

  test("returns TX_REVERTED when receipt.status === 0", async () => {
    const receipt = makeReceipt({
      status: 0,
      logs: [
        makeTransferLog({ tokenAddress: HACK_TOKEN, from: EDUCATOR, to: TREASURY, value: EXPECTED_BASE }),
      ],
    });
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("TX_REVERTED");
    expect(await Payment.count()).toBe(0);
  });

  test("RPC_ERROR is soft-failed and does NOT persist a row", async () => {
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ error: new Error("RPC blew up") }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("RPC_ERROR");
    expect(result.soft_failed).toBe(true);
    expect(await Payment.count()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Transfer-event failures
  // -------------------------------------------------------------------------

  test("NO_HACK_TRANSFER when no log is from the HACK token contract", async () => {
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({ tokenAddress: OTHER_TOKEN, from: EDUCATOR, to: TREASURY, value: EXPECTED_BASE }),
      ],
    });
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("NO_HACK_TRANSFER");
  });

  test("NO_HACK_TRANSFER when receipt has empty logs array", async () => {
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt: makeReceipt({ logs: [] }) }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("NO_HACK_TRANSFER");
  });

  test("WRONG_RECIPIENT when HACK transfer goes to someone other than treasury", async () => {
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({ tokenAddress: HACK_TOKEN, from: EDUCATOR, to: OTHER_USER, value: EXPECTED_BASE }),
      ],
    });
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("WRONG_RECIPIENT");
  });

  test("WRONG_SENDER when HACK arrives at treasury but from someone else", async () => {
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({ tokenAddress: HACK_TOKEN, from: OTHER_USER, to: TREASURY, value: EXPECTED_BASE }),
      ],
    });
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("WRONG_SENDER");
  });

  test("INSUFFICIENT_AMOUNT when educator paid less than expected", async () => {
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({
          tokenAddress: HACK_TOKEN,
          from: EDUCATOR,
          to: TREASURY,
          value: EXPECTED_BASE - 1n,
        }),
      ],
    });
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("INSUFFICIENT_AMOUNT");
  });

  test("ignores non-Transfer events emitted by the HACK contract", async () => {
    // A log from the HACK contract whose topic[0] is NOT the Transfer hash —
    // e.g. an Approval or a custom Pause event — must be silently skipped,
    // not crash the verification.
    const receipt = makeReceipt({
      logs: [
        {
          address: HACK_TOKEN,
          topics: ["0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"],
          data: "0x",
        },
        makeTransferLog({ tokenAddress: HACK_TOKEN, from: EDUCATOR, to: TREASURY, value: EXPECTED_BASE }),
      ],
    });
    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });
    expect(result.ok).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Replay protection
  // -------------------------------------------------------------------------

  test("REPLAY (pre-check hit) when tx_hash already exists in payments", async () => {
    const existing = await Payment.create({
      tx_hash: DEFAULT_TX,
      from_wallet: EDUCATOR,
      amount_hack: EXPECTED_HACK.toString(),
      harjoot_price_usd: "0.2000",
      user_price_usd: "0.6900",
      status: "confirmed",
      purpose: "certificate_issuance",
    });

    const result = await verifyHackPayment({
      models,
      provider: makeProvider({ receipt: null }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("REPLAY");
    expect(result.existingPaymentId).toBe(existing.id);
  });

  test("REPLAY (race window) caught by unique constraint at INSERT time", async () => {
    // Simulate a race: the pre-check passes, but somebody inserts BEFORE
    // our INSERT runs. We patch findOne to return null on the first call
    // and let create() hit the real unique constraint.
    const receipt = makeReceipt({
      logs: [
        makeTransferLog({ tokenAddress: HACK_TOKEN, from: EDUCATOR, to: TREASURY, value: EXPECTED_BASE }),
      ],
    });

    // Race-winner inserts FIRST.
    const winner = await Payment.create({
      tx_hash: DEFAULT_TX,
      from_wallet: EDUCATOR,
      amount_hack: EXPECTED_HACK.toString(),
      harjoot_price_usd: "0.2000",
      user_price_usd: "0.6900",
      status: "confirmed",
      purpose: "certificate_issuance",
    });

    // Now pretend our pre-check missed it (force findOne to return null
    // exactly once, the rest of the run uses the real method).
    const realFindOne = Payment.findOne.bind(Payment);
    const spy = jest.spyOn(Payment, "findOne").mockImplementationOnce(async () => null);

    const result = await verifyHackPayment({
      models: { Payment },
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: EDUCATOR,
      expectedAmountHack: EXPECTED_HACK,
      purpose: "certificate_issuance",
      pricing: DEFAULT_PRICING,
      config: STUB_CONFIG,
    });

    spy.mockRestore();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("REPLAY");
    expect(result.existingPaymentId).toBe(winner.id);
    expect(await Payment.count()).toBe(1); // race-winner still alone
    // sanity: real findOne still works after restore
    expect(await realFindOne({ where: { tx_hash: DEFAULT_TX } })).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // SECURITY: tx_hash case-sensitivity replay protection
  // -------------------------------------------------------------------------

  describe("tx_hash case-sensitivity replay protection", () => {
    // Same hash bytes, different ASCII casing. Without normalization Postgres
    // treats these as two distinct rows -> double-spend vulnerability.
    const MIXED_CASE_TX = "0x" + "AbCdEf1234567890".repeat(4);
    const LOWER_CASE_TX = MIXED_CASE_TX.toLowerCase();

    function happyReceipt() {
      return makeReceipt({
        logs: [
          makeTransferLog({
            tokenAddress: HACK_TOKEN,
            from: EDUCATOR,
            to: TREASURY,
            value: EXPECTED_BASE,
          }),
        ],
      });
    }

    test("persists tx_hash in lowercase regardless of input casing", async () => {
      const result = await verifyHackPayment({
        models,
        provider: makeProvider({ receipt: happyReceipt() }),
        txHash: MIXED_CASE_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      });

      expect(result.ok).toBe(true);
      expect(result.payment.txHash).toBe(LOWER_CASE_TX);

      const stored = await Payment.findOne({ where: { tx_hash: LOWER_CASE_TX } });
      expect(stored).not.toBeNull();
      // Nothing slipped through with the mixed casing.
      const mixedStored = await Payment.findOne({ where: { tx_hash: MIXED_CASE_TX } });
      expect(mixedStored).toBeNull();
    });

    test("REPLAY when a payment with the lowercase hash already exists", async () => {
      // Insert the lowercase hash first, then try to verify with mixed case.
      await Payment.create({
        tx_hash: LOWER_CASE_TX,
        from_wallet: EDUCATOR,
        amount_hack: EXPECTED_HACK.toString(),
        harjoot_price_usd: "0.2000",
        user_price_usd: "0.6900",
        status: "confirmed",
        purpose: "certificate_issuance",
      });

      const result = await verifyHackPayment({
        models,
        provider: makeProvider({ receipt: null }),
        txHash: MIXED_CASE_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      });

      expect(result.reason).toBe("REPLAY");
      expect(await Payment.count()).toBe(1);
    });

    test("two verifications with different casings of the same hash hit REPLAY on the second", async () => {
      // First call wins.
      const first = await verifyHackPayment({
        models,
        provider: makeProvider({ receipt: happyReceipt() }),
        txHash: MIXED_CASE_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      });
      expect(first.ok).toBe(true);

      // Second call with the OPPOSITE casing must NOT mint a duplicate.
      const second = await verifyHackPayment({
        models,
        provider: makeProvider({ receipt: happyReceipt() }),
        txHash: LOWER_CASE_TX, // would have been a different string in DB without the fix
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      });
      expect(second.ok).toBe(false);
      expect(second.reason).toBe("REPLAY");
      expect(second.existingPaymentId).toBe(first.payment.id);

      // Exactly one row, never two.
      expect(await Payment.count()).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Programmer errors
  // -------------------------------------------------------------------------

  test("throws TypeError on missing models", async () => {
    await expect(
      verifyHackPayment({
        provider: makeProvider({ receipt: null }),
        txHash: DEFAULT_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on missing provider", async () => {
    await expect(
      verifyHackPayment({
        models,
        txHash: DEFAULT_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on malformed txHash", async () => {
    await expect(
      verifyHackPayment({
        models,
        provider: makeProvider({ receipt: null }),
        txHash: "not-a-hash",
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on non-bigint expectedAmountHack", async () => {
    await expect(
      verifyHackPayment({
        models,
        provider: makeProvider({ receipt: null }),
        txHash: DEFAULT_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: 6900, // number, not bigint
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on zero or negative expectedAmountHack", async () => {
    await expect(
      verifyHackPayment({
        models,
        provider: makeProvider({ receipt: null }),
        txHash: DEFAULT_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: 0n,
        purpose: "certificate_issuance",
        pricing: DEFAULT_PRICING,
        config: STUB_CONFIG,
      }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on missing pricing", async () => {
    await expect(
      verifyHackPayment({
        models,
        provider: makeProvider({ receipt: null }),
        txHash: DEFAULT_TX,
        expectedFrom: EDUCATOR,
        expectedAmountHack: EXPECTED_HACK,
        purpose: "certificate_issuance",
        config: STUB_CONFIG,
      }),
    ).rejects.toThrow(TypeError);
  });

  // -------------------------------------------------------------------------
  // Sanity: TRANSFER_TOPIC0 matches the canonical hash
  // -------------------------------------------------------------------------

  test("TRANSFER_TOPIC0 equals keccak256(Transfer(address,address,uint256))", () => {
    expect(__TRANSFER_TOPIC0).toBe(
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    );
  });
});
