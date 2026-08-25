const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { submitPaymentProof } = require("../submitPaymentProof");

jest.setTimeout(15000);

const STUDENT  = "0x" + "aa".repeat(20);
const STUDENT2 = "0x" + "cc".repeat(20);
const ISSUER   = "0x" + "bb".repeat(20);
const FUTURE   = "2030-12-31";

describe("submitPaymentProof", () => {
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
      payment_status:         "unpaid",
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
    await expect(submitPaymentProof({ studentWallet: STUDENT, stage: "deposit" })).rejects.toThrow(TypeError);
  });

  test("returns INVALID_STAGE for an unknown stage", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "bogus", proofUrl: "https://x" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_STAGE");
  });

  test("returns PROOF_REQUIRED when neither proofUrl nor proofCid is given", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("PROOF_REQUIRED");
  });

  test("rejects a javascript: proof URL", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({
      models, requestId: req.id, studentWallet: STUDENT, stage: "deposit",
      proofUrl: "javascript:fetch('/api/class-requests/1/payments/deposit/confirm',{method:'PATCH',credentials:'include'})",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_PROOF_URL");
  });

  test("rejects a data: proof URL", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({
      models, requestId: req.id, studentWallet: STUDENT, stage: "deposit",
      proofUrl: "data:text/html,<script>alert(1)</script>",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_PROOF_URL");
  });

  test("rejects a malformed proof URL", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit", proofUrl: "not a url" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_PROOF_URL");
  });

  test("accepts an ipfs: proof URL", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit", proofUrl: "ipfs://bafy123" });
    expect(result.ok).toBe(true);
  });

  test("returns REQUEST_NOT_FOUND when request belongs to a different student", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT2, stage: "deposit", proofUrl: "https://x" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("REQUEST_NOT_FOUND");
  });

  test("returns CLASS_NOT_CONFIRMED when class status is pending", async () => {
    const req = await createRequest({ status: "pending" });
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit", proofUrl: "https://x" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("CLASS_NOT_CONFIRMED");
  });

  test("returns UNEXPECTED_PAYMENT_STATUS for deposit when payment_status isn't unpaid", async () => {
    const req = await createRequest({ payment_status: "deposit_confirmed" });
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit", proofUrl: "https://x" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNEXPECTED_PAYMENT_STATUS");
  });

  test("submits deposit proof and transitions to deposit_submitted", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({
      models, requestId: req.id, studentWallet: STUDENT, stage: "deposit",
      proofUrl: "https://etherscan.io/tx/0xabc", currency: "USDT", paymentNetwork: "Polygon", amount: "50.00",
    });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("deposit_submitted");

    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.deposit_proof_url).toBe("https://etherscan.io/tx/0xabc");
    expect(updated.currency).toBe("USDT");
    expect(updated.payment_network).toBe("Polygon");
  });

  test("submits final proof only when payment_status is deposit_confirmed", async () => {
    const req = await createRequest({ payment_status: "deposit_confirmed" });
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "final", proofCid: "bafy123" });
    expect(result.ok).toBe(true);
    expect(result.data.payment_status).toBe("final_submitted");
  });

  test("accepts a CID-only proof", async () => {
    const req = await createRequest();
    const result = await submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit", proofCid: "bafy456" });
    expect(result.ok).toBe(true);
    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.deposit_proof_cid).toBe("bafy456");
  });

  describe("wallet-pay (txHash)", () => {
    const USDT_TOKEN = "0x000000000000000000000000000000000000005d";
    // Replay protection spans the whole table, so each test needs its own
    // hash — reusing one across tests would false-positive as a replay.
    const randomTxHash = () => "0x" + crypto.randomBytes(32).toString("hex");
    // $60/hr * 60min / 120 = $30 per stage.
    const STAGE_AMOUNT_BASE = 30_000_000n; // 6 decimals

    function makeTransferLog({ from, to, value, token = USDT_TOKEN }) {
      const { Interface } = require("ethers");
      const transferIface = new Interface([
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ]);
      const encoded = transferIface.encodeEventLog("Transfer", [from, to, value]);
      return { address: token, topics: encoded.topics, data: encoded.data };
    }

    function makeProvider({ receipt = null, error = null } = {}) {
      return {
        async getTransactionReceipt() {
          if (error) throw error;
          return receipt;
        },
      };
    }

    beforeAll(() => {
      process.env.USDT_CONTRACT_ADDRESS = USDT_TOKEN;
      process.env.USDT_DECIMALS = "6";
    });

    test("verifies on-chain and auto-confirms deposit — skips deposit_submitted", async () => {
      const req = await createRequest({ hourly_rate_usd: 60, duration_minutes: 60 });
      const tx = randomTxHash();
      const receipt = {
        status: 1,
        logs: [makeTransferLog({ from: STUDENT, to: ISSUER, value: STAGE_AMOUNT_BASE })],
      };

      const result = await submitPaymentProof({
        models, requestId: req.id, studentWallet: STUDENT, stage: "deposit",
        txHash: tx, provider: makeProvider({ receipt }),
      });

      expect(result.ok).toBe(true);
      expect(result.data.payment_status).toBe("deposit_confirmed");

      const updated = await models.ClassRequest.findByPk(req.id);
      expect(updated.deposit_tx_hash).toBe(tx);
      expect(updated.deposit_confirmed_at).not.toBeNull();
      expect(updated.currency).toBe("USDT");
      expect(updated.payment_network).toBe("polygon");
    });

    test("verifies on-chain and auto-confirms final — jumps straight to paid", async () => {
      const req = await createRequest({
        hourly_rate_usd: 60, duration_minutes: 60, payment_status: "deposit_confirmed",
      });
      const tx = randomTxHash();
      const receipt = {
        status: 1,
        logs: [makeTransferLog({ from: STUDENT, to: ISSUER, value: STAGE_AMOUNT_BASE })],
      };

      const result = await submitPaymentProof({
        models, requestId: req.id, studentWallet: STUDENT, stage: "final",
        txHash: tx, provider: makeProvider({ receipt }),
      });

      expect(result.ok).toBe(true);
      expect(result.data.payment_status).toBe("paid");

      const updated = await models.ClassRequest.findByPk(req.id);
      expect(updated.final_tx_hash).toBe(tx);
    });

    test("returns INVALID_TX_HASH for a malformed hash", async () => {
      const req = await createRequest({ hourly_rate_usd: 60, duration_minutes: 60 });
      const result = await submitPaymentProof({
        models, requestId: req.id, studentWallet: STUDENT, stage: "deposit", txHash: "not-a-hash",
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_TX_HASH");
    });

    test("returns MISSING_PRICE when the class request has no hourly_rate_usd", async () => {
      const req = await createRequest({ hourly_rate_usd: null });
      const result = await submitPaymentProof({
        models, requestId: req.id, studentWallet: STUDENT, stage: "deposit",
        txHash: randomTxHash(), provider: makeProvider({ receipt: null }),
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("MISSING_PRICE");
    });

    test("propagates INSUFFICIENT_AMOUNT from the verification service", async () => {
      const req = await createRequest({ hourly_rate_usd: 60, duration_minutes: 60 });
      const receipt = {
        status: 1,
        logs: [makeTransferLog({ from: STUDENT, to: ISSUER, value: STAGE_AMOUNT_BASE - 1n })],
      };
      const result = await submitPaymentProof({
        models, requestId: req.id, studentWallet: STUDENT, stage: "deposit",
        txHash: randomTxHash(), provider: makeProvider({ receipt }),
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INSUFFICIENT_AMOUNT");
      expect(result.httpStatus).toBe(422);
    });

    test("maps REPLAY to TX_ALREADY_USED with 409", async () => {
      const tx = randomTxHash();
      const other = await createRequest({ hourly_rate_usd: 60, duration_minutes: 60, deposit_tx_hash: tx });
      const req = await createRequest({ hourly_rate_usd: 60, duration_minutes: 60 });

      const result = await submitPaymentProof({
        models, requestId: req.id, studentWallet: STUDENT, stage: "deposit",
        txHash: tx, provider: makeProvider({ receipt: null }),
      });

      expect(result.ok).toBe(false);
      expect(result.code).toBe("TX_ALREADY_USED");
      expect(result.httpStatus).toBe(409);
      expect(other.id).not.toBe(req.id); // sanity: two distinct rows involved
    });

    test("throws TypeError when txHash is given without a provider", async () => {
      const req = await createRequest({ hourly_rate_usd: 60, duration_minutes: 60 });
      await expect(
        submitPaymentProof({ models, requestId: req.id, studentWallet: STUDENT, stage: "deposit", txHash: randomTxHash() })
      ).rejects.toThrow(TypeError);
    });
  });
});
