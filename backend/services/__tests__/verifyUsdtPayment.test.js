// backend/services/__tests__/verifyUsdtPayment.test.js
//
// Same shape as verifyHackPayment.test.js: SQLite in-memory for the real
// ClassRequest model + replay constraint, a stubbed provider for canned
// receipts. The recipient here is per-request (the educator), not a fixed
// treasury, and replay protection lives on class_requests.deposit_tx_hash /
// final_tx_hash instead of a payments table.

const SequelizePkg = require("sequelize");
const { Interface } = require("ethers");

const { verifyUsdtPayment, __TRANSFER_TOPIC0 } = require("../usdtPaymentService");

const USDT_TOKEN   = "0x000000000000000000000000000000000000005d";
const TALENT       = "0x1111111111111111111111111111111111111111";
const EDUCATOR     = "0x2222222222222222222222222222222222222222";
const OTHER_USER   = "0x3333333333333333333333333333333333333333";
const OTHER_TOKEN  = "0x9999999999999999999999999999999999999999";

const DECIMALS = 6;
const SCALE = 10n ** BigInt(DECIMALS);
const EXPECTED_USDT = 12.5;
const EXPECTED_BASE = BigInt(Math.round(EXPECTED_USDT * Number(SCALE)));

const DEFAULT_TX = "0x" + "ab".repeat(32);

const STUB_CONFIG = {
  usdtTokenAddress: USDT_TOKEN,
  usdtDecimals: DECIMALS,
};

const transferIface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

function makeTransferLog({ tokenAddress, from, to, value }) {
  const encoded = transferIface.encodeEventLog("Transfer", [from, to, value]);
  return { address: tokenAddress, topics: encoded.topics, data: encoded.data };
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

async function makeClassRequest(ClassRequest, overrides = {}) {
  return ClassRequest.create({
    student_wallet_address: TALENT,
    issuer_wallet_address: EDUCATOR,
    requested_date: "2026-09-01",
    start_time: "10:00",
    duration_minutes: 60,
    ...overrides,
  });
}

describe("usdtPaymentService.verifyUsdtPayment", () => {
  let sequelize;
  let ClassRequest;
  let models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    const { DataTypes } = SequelizePkg;

    const User = require("../../models/users")(sequelize, DataTypes);
    const Issuer = require("../../models/issuers")(sequelize, DataTypes);
    const IssuerClass = require("../../models/issuerClasses")(sequelize, DataTypes);
    const ClassPaymentDispute = require("../../models/classPaymentDisputes")(sequelize, DataTypes);
    const Student = require("../../models/students")(sequelize, DataTypes);
    const Recruiter = require("../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../models/userSessions")(sequelize, DataTypes);
    ClassRequest = require("../../models/classRequests")(sequelize, DataTypes);

    models = {
      User, Issuer, IssuerClass, ClassRequest, ClassPaymentDispute,
      Student, Recruiter, Certificate, UserSession, Sequelize: SequelizePkg,
    };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    const nonce = () => require("crypto").randomBytes(16).toString("hex");
    await User.create({ wallet_address: TALENT, role: "student", name: "Talent", nonce: nonce() });
    await User.create({ wallet_address: EDUCATOR, role: "issuer", name: "Educator", nonce: nonce() });
    await Issuer.create({ wallet_address: EDUCATOR, organization_name: "HackAcademy", class_settings: {} });

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    // Reset only ClassRequest rows between tests — User/Issuer are seeded
    // once in beforeAll and referenced via FK, so they must survive.
    await ClassRequest.destroy({ where: {}, truncate: true });
  });

  test("confirms an exact-amount payment", async () => {
    const receipt = makeReceipt({
      logs: [makeTransferLog({ tokenAddress: USDT_TOKEN, from: TALENT, to: EDUCATOR, value: EXPECTED_BASE })],
    });

    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(true);
    expect(result.txHash).toBe(DEFAULT_TX);
    expect(result.amountUsdt).toBeCloseTo(EXPECTED_USDT, 6);
  });

  test("accepts an overpayment", async () => {
    const receipt = makeReceipt({
      logs: [makeTransferLog({ tokenAddress: USDT_TOKEN, from: TALENT, to: EDUCATOR, value: EXPECTED_BASE * 2n })],
    });

    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(true);
    expect(result.amountUsdt).toBeCloseTo(EXPECTED_USDT * 2, 6);
  });

  test("TX_NOT_FOUND when provider returns null", async () => {
    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt: null }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });
    expect(result).toEqual({ ok: false, reason: "TX_NOT_FOUND" });
  });

  test("TX_REVERTED when receipt.status === 0", async () => {
    const receipt = makeReceipt({
      status: 0,
      logs: [makeTransferLog({ tokenAddress: USDT_TOKEN, from: TALENT, to: EDUCATOR, value: EXPECTED_BASE })],
    });
    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("TX_REVERTED");
  });

  test("RPC_ERROR is soft-failed", async () => {
    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ error: new Error("RPC blew up") }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("RPC_ERROR");
    expect(result.soft_failed).toBe(true);
  });

  test("NO_USDT_TRANSFER when no log is from the USDT token contract", async () => {
    const receipt = makeReceipt({
      logs: [makeTransferLog({ tokenAddress: OTHER_TOKEN, from: TALENT, to: EDUCATOR, value: EXPECTED_BASE })],
    });
    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("NO_USDT_TRANSFER");
  });

  test("WRONG_RECIPIENT when USDT goes to someone other than the educator", async () => {
    const receipt = makeReceipt({
      logs: [makeTransferLog({ tokenAddress: USDT_TOKEN, from: TALENT, to: OTHER_USER, value: EXPECTED_BASE })],
    });
    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("WRONG_RECIPIENT");
  });

  test("WRONG_SENDER when USDT arrives at the educator but from someone else", async () => {
    const receipt = makeReceipt({
      logs: [makeTransferLog({ tokenAddress: USDT_TOKEN, from: OTHER_USER, to: EDUCATOR, value: EXPECTED_BASE })],
    });
    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("WRONG_SENDER");
  });

  test("INSUFFICIENT_AMOUNT when the talent paid less than expected", async () => {
    const receipt = makeReceipt({
      logs: [makeTransferLog({ tokenAddress: USDT_TOKEN, from: TALENT, to: EDUCATOR, value: EXPECTED_BASE - 1n })],
    });
    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });
    expect(result.reason).toBe("INSUFFICIENT_AMOUNT");
  });

  test("REPLAY when the tx hash is already used as another request's deposit_tx_hash", async () => {
    const existing = await makeClassRequest(ClassRequest, { deposit_tx_hash: DEFAULT_TX });

    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt: null }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("REPLAY");
    expect(result.existingRequestId).toBe(existing.id);
  });

  test("REPLAY when the tx hash is already used as another request's final_tx_hash", async () => {
    const existing = await makeClassRequest(ClassRequest, { final_tx_hash: DEFAULT_TX });

    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt: null }),
      txHash: DEFAULT_TX,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("REPLAY");
    expect(result.existingRequestId).toBe(existing.id);
  });

  test("persists tx_hash comparisons in lowercase regardless of input casing", async () => {
    const mixedCaseTx = "0x" + "AbCdEf1234567890".repeat(4);
    await makeClassRequest(ClassRequest, { deposit_tx_hash: mixedCaseTx.toLowerCase() });

    const result = await verifyUsdtPayment({
      models,
      provider: makeProvider({ receipt: null }),
      txHash: mixedCaseTx,
      expectedFrom: TALENT,
      expectedTo: EDUCATOR,
      expectedMinAmountUsdt: EXPECTED_USDT,
      config: STUB_CONFIG,
    });

    expect(result.reason).toBe("REPLAY");
  });

  test("throws TypeError on missing models", async () => {
    await expect(
      verifyUsdtPayment({
        provider: makeProvider({ receipt: null }),
        txHash: DEFAULT_TX,
        expectedFrom: TALENT,
        expectedTo: EDUCATOR,
        expectedMinAmountUsdt: EXPECTED_USDT,
        config: STUB_CONFIG,
      })
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on malformed txHash", async () => {
    await expect(
      verifyUsdtPayment({
        models,
        provider: makeProvider({ receipt: null }),
        txHash: "not-a-hash",
        expectedFrom: TALENT,
        expectedTo: EDUCATOR,
        expectedMinAmountUsdt: EXPECTED_USDT,
        config: STUB_CONFIG,
      })
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on zero or negative expectedMinAmountUsdt", async () => {
    await expect(
      verifyUsdtPayment({
        models,
        provider: makeProvider({ receipt: null }),
        txHash: DEFAULT_TX,
        expectedFrom: TALENT,
        expectedTo: EDUCATOR,
        expectedMinAmountUsdt: 0,
        config: STUB_CONFIG,
      })
    ).rejects.toThrow(TypeError);
  });

  test("TRANSFER_TOPIC0 equals keccak256(Transfer(address,address,uint256))", () => {
    expect(__TRANSFER_TOPIC0).toBe(
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    );
  });
});
