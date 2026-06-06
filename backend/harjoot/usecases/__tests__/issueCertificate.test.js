// backend/harjoot/usecases/__tests__/issueCertificate.test.js
//
// All external deps (paymentService, harjootClient, mintAdapter,
// ipfsUpload, provider) are mocked. SQLite in-memory backs the real
// Sequelize models so we exercise the transaction boundary AND verify
// the Certificate + TreasuryTransfer rows actually persisted.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { issueCertificate } = require("../issueCertificate");

const EDUCATOR_WALLET = "0x1111111111111111111111111111111111111111";
const STUDENT_WALLET  = "0x2222222222222222222222222222222222222222";
const PAYMENT_TX      = "0x" + "ab".repeat(32);
const PDF_BUFFER      = Buffer.from("fake-pdf-bytes");

// Pre-computed SHA-256 of PDF_BUFFER so we can assert on it without
// re-running the hash in the test body.
const EXPECTED_HASH = crypto.createHash("sha256").update(PDF_BUFFER).digest("hex");

const DEFAULT_PRICING = {
  amountHack: 6900n,
  userPriceUsdCents: 69,
  harjootCostUsdCents: 20,
  grossMarginUsdCents: 49,
  treasuryAddress: "0x0000000000000000000000000000000000000bee",
  hackTokenAddress: "0x0000000000000000000000000000000000000ace",
};

const HARJOOT_OK_RESPONSE = {
  success: true,
  certificate: {
    verificationId: "ver_mock_xyz",
    partnerCertificateId: "PC-001",
    status: "verified",
    document: { hash: EXPECTED_HASH },
    verification: {
      url: "https://harjoot.mock/verify/ver_mock_xyz",
      qrCodeUrl: "https://harjoot.mock/verify/ver_mock_xyz/qr",
    },
    blockchain: { partnerTxHash: null, harjootTxHash: null, explorerUrl: null },
  },
};

const MINT_OK_RESULT = { tokenId: 42n, txHash: "0x" + "cd".repeat(32) };

describe("issueCertificate orchestrator", () => {
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

    const allModels = {
      User, Student, Issuer, Recruiter, UserSession, Certificate, Payment,
      TreasuryTransfer, TalentInvitation,
    };
    Object.values(allModels).forEach((m) => m.associate && m.associate(allModels));

    await sequelize.sync({ force: true });
    models = { ...allModels, sequelize };

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (sequelize) await sequelize.close();
  });

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  async function seedScenario({
    educatorApprovalStatus = "approved",
    seedStudent = true,
    seedIssuer = true,
  } = {}) {
    await sequelize.sync({ force: true });

    const educator = await models.User.create({
      id: 1,
      wallet_address: EDUCATOR_WALLET,
      role: "issuer",
      name: "Sofia",
      email: "edu@x.com",
      nonce: crypto.randomBytes(16).toString("hex"),
      educator_approval_status: educatorApprovalStatus,
    });
    if (seedIssuer) {
      await models.Issuer.create({
        wallet_address: EDUCATOR_WALLET,
        organization_name: "Acme Academy",
      });
    }
    if (seedStudent) {
      await models.User.create({
        id: 2,
        wallet_address: STUDENT_WALLET,
        role: "student",
        name: "Sty",
        email: "sty@x.com",
        nonce: crypto.randomBytes(16).toString("hex"),
      });
      await models.Student.create({
        wallet_address: STUDENT_WALLET,
        field_of_study: "cyber",
      });
    }
    return educator;
  }

  function makeDeps({
    verifyResult,
    uploadCertResult = HARJOOT_OK_RESPONSE,
    uploadCertThrows = null,
    mintResult = MINT_OK_RESULT,
    mintThrows = null,
    ipfsResult = { tokenUri: "ipfs://bafy.../meta.json", pdfCid: "bafy-pdf" },
    ipfsThrows = null,
  } = {}) {
    // verifyResult defaults to "this matches our seeded happy-path payment".
    // Each call simulates the use case creating a Payment row by hand —
    // we mirror that here since the test mocks paymentService.
    const defaultVerify = async () => {
      const row = await models.Payment.create({
        tx_hash: PAYMENT_TX,
        from_wallet: EDUCATOR_WALLET,
        amount_hack: "6900",
        harjoot_price_usd: "0.2000",
        user_price_usd: "0.6900",
        status: "confirmed",
        purpose: "certificate_issuance",
      });
      return {
        ok: true,
        payment: { id: row.id, txHash: PAYMENT_TX, fromWallet: EDUCATOR_WALLET, amountHack: 6900n },
      };
    };

    const paymentService = {
      calculateMintPrice: jest.fn().mockReturnValue(DEFAULT_PRICING),
      verifyHackPayment: jest.fn().mockImplementation(verifyResult || defaultVerify),
    };

    const harjootClient = {
      uploadCertificate: jest.fn().mockImplementation(async (payload) => {
        if (uploadCertThrows) throw uploadCertThrows;
        return uploadCertResult;
      }),
    };

    const mintAdapter = {
      mintCertificate: jest.fn().mockImplementation(async () => {
        if (mintThrows) throw mintThrows;
        return mintResult;
      }),
    };

    const ipfsUpload = jest.fn().mockImplementation(async () => {
      if (ipfsThrows) throw ipfsThrows;
      return ipfsResult;
    });

    const provider = { getTransactionReceipt: jest.fn().mockResolvedValue(null) };

    return { paymentService, harjootClient, mintAdapter, ipfsUpload, provider };
  }

  function buildParams(educator, overrides = {}) {
    return {
      models,
      educator,
      studentWallet: STUDENT_WALLET,
      title: "Solidity 101",
      description: "Smart contracts essentials",
      issueDate: "2026-06-05",
      paymentTxHash: PAYMENT_TX,
      pdfBuffer: PDF_BUFFER,
      pdfFileName: "cert.pdf",
      ...overrides,
    };
  }

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test("happy path: persists Certificate + TreasuryTransfer and returns ok envelope", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();

    const result = await issueCertificate({ ...buildParams(educator), ...deps });

    expect(result.ok).toBe(true);
    expect(result.certificate).toMatchObject({
      tokenId: "42",
      txHash: MINT_OK_RESULT.txHash,
      certificateHash: EXPECTED_HASH,
      tokenUri: "ipfs://bafy.../meta.json",
      verificationId: "ver_mock_xyz",
      verificationUrl: "https://harjoot.mock/verify/ver_mock_xyz",
      qrUrl: "https://harjoot.mock/verify/ver_mock_xyz/qr",
    });

    // Certificate row
    const cert = await models.Certificate.findByPk(result.certificate.id);
    expect(cert.certificate_hash).toBe(EXPECTED_HASH);
    expect(cert.token_id).toBe("42");
    expect(cert.blockchain_tx_hash).toBe(MINT_OK_RESULT.txHash);
    expect(cert.status).toBe("issued");
    expect(cert.payment_id).toBe(result.certificate.paymentId);
    expect(cert.harjoot_verification_id).toBe("ver_mock_xyz");
    expect(cert.issuer_wallet_address).toBe(EDUCATOR_WALLET);
    expect(cert.student_wallet_address).toBe(STUDENT_WALLET);

    // TreasuryTransfer row
    const tt = await models.TreasuryTransfer.findByPk(result.certificate.treasuryTransferId);
    expect(tt.payment_id).toBe(result.certificate.paymentId);
    expect(Number(tt.amount_usdt_owed)).toBeCloseTo(0.20, 4);
    expect(tt.status).toBe("pending");
    expect(tt.destination).toBe("harjoot");
  });

  test("calls Harjoot uploadCertificate with hash_only mode and a unique idempotency key per call", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();
    await issueCertificate({ ...buildParams(educator), ...deps });

    expect(deps.harjootClient.uploadCertificate).toHaveBeenCalledTimes(1);
    const payload = deps.harjootClient.uploadCertificate.mock.calls[0][0];
    expect(payload.processing).toEqual({ mode: "hash_only" });
    expect(payload.document.hash).toBe(EXPECTED_HASH);
    expect(payload.idempotency_key).toMatch(/^cert-[0-9a-f-]{36}-v1$/);
    expect(payload.issuer).toEqual({
      wallet_address: EDUCATOR_WALLET,
      organization_name: "Acme Academy",
      email: "edu@x.com",
    });
    expect(payload.student).toEqual({ wallet_address: STUDENT_WALLET, name: "Sty" });
    expect(payload.certificate.token_uri).toBe("ipfs://bafy.../meta.json");
  });

  test("forwards the computed certificateHash to ipfsUpload + mintAdapter", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();
    await issueCertificate({ ...buildParams(educator), ...deps });

    expect(deps.ipfsUpload).toHaveBeenCalledTimes(1);
    const ipfsArgs = deps.ipfsUpload.mock.calls[0][0];
    expect(ipfsArgs.certificateHash).toBe(EXPECTED_HASH);
    expect(ipfsArgs.studentWallet).toBe(STUDENT_WALLET);
    expect(ipfsArgs.title).toBe("Solidity 101");

    expect(deps.mintAdapter.mintCertificate).toHaveBeenCalledWith({
      studentWallet: STUDENT_WALLET,
      studentName: "Sty",
      courseName: "Solidity 101",
      tokenUri: "ipfs://bafy.../meta.json",
    });
  });

  // -------------------------------------------------------------------------
  // Pre-payment gates
  // -------------------------------------------------------------------------

  test("EDUCATOR_NOT_APPROVED short-circuits before payment is touched", async () => {
    const educator = await seedScenario({ educatorApprovalStatus: "pending_approval" });
    const deps = makeDeps();

    const result = await issueCertificate({ ...buildParams(educator), ...deps });

    expect(result).toEqual({ ok: false, reason: "EDUCATOR_NOT_APPROVED" });
    expect(deps.paymentService.verifyHackPayment).not.toHaveBeenCalled();
    expect(deps.ipfsUpload).not.toHaveBeenCalled();
    expect(await models.Payment.count()).toBe(0);
    expect(await models.Certificate.count()).toBe(0);
  });

  test("TALENT_NOT_FOUND short-circuits before payment is touched", async () => {
    const educator = await seedScenario({ seedStudent: false });
    const deps = makeDeps();

    const result = await issueCertificate({ ...buildParams(educator), ...deps });

    expect(result.reason).toBe("TALENT_NOT_FOUND");
    expect(deps.paymentService.verifyHackPayment).not.toHaveBeenCalled();
    expect(await models.Payment.count()).toBe(0);
  });

  test("TALENT_NOT_FOUND when wallet matches but role is recruiter", async () => {
    const educator = await seedScenario({ seedStudent: false });
    await models.User.create({
      id: 99,
      wallet_address: STUDENT_WALLET,
      role: "recruiter",
      name: "Rec",
      email: "rec@x.com",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    const deps = makeDeps();
    const result = await issueCertificate({ ...buildParams(educator), ...deps });
    expect(result.reason).toBe("TALENT_NOT_FOUND");
  });

  // -------------------------------------------------------------------------
  // Payment failures bubble up
  // -------------------------------------------------------------------------

  test("bubbles up TX_NOT_FOUND from verifyHackPayment with no side effects", async () => {
    const educator = await seedScenario();
    const deps = makeDeps({
      verifyResult: async () => ({ ok: false, reason: "TX_NOT_FOUND" }),
    });

    const result = await issueCertificate({ ...buildParams(educator), ...deps });
    expect(result).toEqual({ ok: false, reason: "TX_NOT_FOUND" });
    expect(deps.ipfsUpload).not.toHaveBeenCalled();
    expect(deps.mintAdapter.mintCertificate).not.toHaveBeenCalled();
  });

  test("bubbles up REPLAY with existingPaymentId attached", async () => {
    const educator = await seedScenario();
    const deps = makeDeps({
      verifyResult: async () => ({ ok: false, reason: "REPLAY", existingPaymentId: 77 }),
    });

    const result = await issueCertificate({ ...buildParams(educator), ...deps });
    expect(result.reason).toBe("REPLAY");
    expect(result.existingPaymentId).toBe(77);
  });

  test("bubbles up INSUFFICIENT_AMOUNT without minting", async () => {
    const educator = await seedScenario();
    const deps = makeDeps({
      verifyResult: async () => ({ ok: false, reason: "INSUFFICIENT_AMOUNT" }),
    });

    const result = await issueCertificate({ ...buildParams(educator), ...deps });
    expect(result.reason).toBe("INSUFFICIENT_AMOUNT");
    expect(deps.mintAdapter.mintCertificate).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Failures AFTER payment (paymentId carried in the Result)
  // -------------------------------------------------------------------------

  test("IPFS_FAILED when ipfsUpload throws; payment row already exists; no mint", async () => {
    const educator = await seedScenario();
    const deps = makeDeps({ ipfsThrows: new Error("pinata down") });

    const result = await issueCertificate({ ...buildParams(educator), ...deps });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("IPFS_FAILED");
    expect(result.paymentId).toEqual(expect.any(Number));
    expect(result.error).toMatch(/pinata down/);
    expect(await models.Payment.count()).toBe(1); // verifyHackPayment persisted it
    expect(deps.harjootClient.uploadCertificate).not.toHaveBeenCalled();
    expect(deps.mintAdapter.mintCertificate).not.toHaveBeenCalled();
    expect(await models.Certificate.count()).toBe(0);
    expect(await models.TreasuryTransfer.count()).toBe(0);
  });

  test("IPFS_FAILED when ipfsUpload returns no tokenUri", async () => {
    const educator = await seedScenario();
    const deps = makeDeps({ ipfsResult: { pdfCid: "bafy-pdf" } }); // no tokenUri

    const result = await issueCertificate({ ...buildParams(educator), ...deps });
    expect(result.reason).toBe("IPFS_FAILED");
    expect(result.error).toMatch(/tokenUri/);
  });

  test("HARJOOT_UPLOAD_FAILED when client throws; payment row exists; no mint", async () => {
    const educator = await seedScenario();
    const deps = makeDeps({ uploadCertThrows: new Error("harjoot 500") });

    const result = await issueCertificate({ ...buildParams(educator), ...deps });
    expect(result.reason).toBe("HARJOOT_UPLOAD_FAILED");
    expect(result.paymentId).toEqual(expect.any(Number));
    expect(result.error).toMatch(/harjoot 500/);
    expect(deps.mintAdapter.mintCertificate).not.toHaveBeenCalled();
    expect(await models.Certificate.count()).toBe(0);
  });

  test("MINT_FAILED when mintAdapter throws; verificationId is carried in the Result", async () => {
    const educator = await seedScenario();
    const deps = makeDeps({ mintThrows: new Error("revert") });

    const result = await issueCertificate({ ...buildParams(educator), ...deps });
    expect(result.reason).toBe("MINT_FAILED");
    expect(result.paymentId).toEqual(expect.any(Number));
    expect(result.verificationId).toBe("ver_mock_xyz");
    expect(result.error).toMatch(/revert/);
    expect(await models.Certificate.count()).toBe(0);
    expect(await models.TreasuryTransfer.count()).toBe(0);
  });

  test("PERSIST_FAILED carries tokenId + txHash for ops reconciliation", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();

    // Sabotage the Certificate.create so the persistence transaction explodes
    // after the mint succeeds.
    const createSpy = jest
      .spyOn(models.Certificate, "create")
      .mockRejectedValueOnce(new Error("disk full"));

    const result = await issueCertificate({ ...buildParams(educator), ...deps });

    createSpy.mockRestore();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("PERSIST_FAILED");
    expect(result.tokenId).toBe("42");
    expect(result.txHash).toBe(MINT_OK_RESULT.txHash);
    expect(result.certificateHash).toBe(EXPECTED_HASH);
    expect(result.tokenUri).toBe("ipfs://bafy.../meta.json");
    expect(result.verificationId).toBe("ver_mock_xyz");

    // No row on either side — transaction rolled back even though mint was off-chain.
    expect(await models.Certificate.count()).toBe(0);
    expect(await models.TreasuryTransfer.count()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Programmer-error guards
  // -------------------------------------------------------------------------

  test("throws TypeError when models is missing", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();
    await expect(
      issueCertificate({ ...buildParams(educator), ...deps, models: undefined }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError when paymentService is missing", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();
    delete deps.paymentService;
    await expect(
      issueCertificate({ ...buildParams(educator), ...deps }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on malformed studentWallet", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();
    await expect(
      issueCertificate({ ...buildParams(educator, { studentWallet: "nope" }), ...deps }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on malformed issueDate", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();
    await expect(
      issueCertificate({ ...buildParams(educator, { issueDate: "06/05/2026" }), ...deps }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError when pdfBuffer is empty", async () => {
    const educator = await seedScenario();
    const deps = makeDeps();
    await expect(
      issueCertificate({ ...buildParams(educator, { pdfBuffer: Buffer.alloc(0) }), ...deps }),
    ).rejects.toThrow(TypeError);
  });
});
