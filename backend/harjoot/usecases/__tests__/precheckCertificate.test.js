// backend/harjoot/usecases/__tests__/precheckCertificate.test.js
//
// SQLite-in-memory exercises the real Sequelize query. paymentService is
// mocked so we can verify the pure DI seam, not the pricing math (that has
// its own tests in services/__tests__/paymentService.test.js).

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { precheckCertificate } = require("../precheckCertificate");

describe("Section 4 precheck use case", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, UserSession, Certificate, TalentInvitation;
  let models;
  let paymentService;

  const ISSUER_WALLET = "0x1111111111111111111111111111111111111111";
  const STUDENT_WALLET = "0x2222222222222222222222222222222222222222";
  const RECRUITER_WALLET = "0x3333333333333333333333333333333333333333";

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    const { DataTypes } = SequelizePkg;

    User = require("../../../models/users")(sequelize, DataTypes);
    Student = require("../../../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    UserSession = require("../../../models/userSessions")(sequelize, DataTypes);
    Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    TalentInvitation = require("../../../models/talentInvitations")(sequelize, DataTypes);

    const allModels = { User, Student, Issuer, Recruiter, UserSession, Certificate, TalentInvitation };
    Object.values(allModels).forEach((m) => m.associate && m.associate(allModels));

    await sequelize.sync({ force: true });
    models = allModels;

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
    paymentService = {
      calculateMintPrice: jest.fn().mockReturnValue({
        amountHack: 6900n,
        userPriceUsdCents: 69,
        harjootCostUsdCents: 20,
        grossMarginUsdCents: 49,
        treasuryAddress: "0x000000000000000000000000000000000000bee",
        hackTokenAddress: "0x000000000000000000000000000000000000ace",
      }),
    };
  });

  async function makeIssuer({ id, status = "approved", wallet = ISSUER_WALLET }) {
    return User.create({
      id,
      wallet_address: wallet,
      role: "issuer",
      name: "Edu",
      email: "edu@x.com",
      nonce: crypto.randomBytes(16).toString("hex"),
      educator_approval_status: status,
    });
  }

  async function makeStudent({ id, wallet = STUDENT_WALLET }) {
    return User.create({
      id,
      wallet_address: wallet,
      role: "student",
      name: "Sty",
      email: "sty@x.com",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
  }

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  test("returns ok with price + talent when educator is approved and student exists", async () => {
    const educator = await makeIssuer({ id: 1 });
    await makeStudent({ id: 2 });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: STUDENT_WALLET,
    });

    expect(result.ok).toBe(true);
    expect(result.price).toEqual({
      amountHack: 6900n,
      amountHackString: "6900",
      userPriceUsdCents: 69,
      treasuryAddress: "0x000000000000000000000000000000000000bee",
      hackTokenAddress: "0x000000000000000000000000000000000000ace",
    });
    expect(result.talent).toEqual({ id: 2, walletAddress: STUDENT_WALLET });
    expect(paymentService.calculateMintPrice).toHaveBeenCalledTimes(1);
  });

  test("lowercases the studentWallet before lookup", async () => {
    const educator = await makeIssuer({ id: 1 });
    await makeStudent({ id: 2 });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: STUDENT_WALLET.toUpperCase().replace(/X/g, "x"), // mixed case
    });

    expect(result.ok).toBe(true);
    expect(result.talent.walletAddress).toBe(STUDENT_WALLET);
  });

  // ---------------------------------------------------------------------------
  // Educator gates
  // ---------------------------------------------------------------------------

  test("returns EDUCATOR_NOT_APPROVED when status is pending_approval", async () => {
    const educator = await makeIssuer({ id: 1, status: "pending_approval" });
    await makeStudent({ id: 2 });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: STUDENT_WALLET,
    });

    expect(result).toEqual({ ok: false, reason: "EDUCATOR_NOT_APPROVED" });
    expect(paymentService.calculateMintPrice).not.toHaveBeenCalled();
  });

  test("returns EDUCATOR_NOT_APPROVED when status is rejected", async () => {
    const educator = await makeIssuer({ id: 1, status: "rejected" });
    await makeStudent({ id: 2 });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: STUDENT_WALLET,
    });

    expect(result.reason).toBe("EDUCATOR_NOT_APPROVED");
  });

  test("returns EDUCATOR_NOT_APPROVED when status is null", async () => {
    // A non-issuer (or legacy) row with NULL status must not slip through.
    const educator = await makeIssuer({ id: 1, status: null });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: STUDENT_WALLET,
    });

    expect(result.reason).toBe("EDUCATOR_NOT_APPROVED");
  });

  // ---------------------------------------------------------------------------
  // Talent gates
  // ---------------------------------------------------------------------------

  test("returns TALENT_NOT_FOUND when no user has that wallet", async () => {
    const educator = await makeIssuer({ id: 1 });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: STUDENT_WALLET,
    });

    expect(result).toEqual({ ok: false, reason: "TALENT_NOT_FOUND" });
  });

  test("returns TALENT_NOT_FOUND when the wallet belongs to a recruiter, not a student", async () => {
    const educator = await makeIssuer({ id: 1 });
    await User.create({
      id: 2,
      wallet_address: RECRUITER_WALLET,
      role: "recruiter",
      name: "Rec",
      email: "r@x.com",
      nonce: crypto.randomBytes(16).toString("hex"),
    });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: RECRUITER_WALLET,
    });

    expect(result.reason).toBe("TALENT_NOT_FOUND");
  });

  test("returns TALENT_NOT_FOUND when the wallet belongs to another issuer", async () => {
    const educator = await makeIssuer({ id: 1 });
    await makeIssuer({ id: 2, wallet: "0x4444444444444444444444444444444444444444" });

    const result = await precheckCertificate({
      models,
      paymentService,
      educator,
      studentWallet: "0x4444444444444444444444444444444444444444",
    });

    expect(result.reason).toBe("TALENT_NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // Programmer errors
  // ---------------------------------------------------------------------------

  test("throws TypeError when models is missing", async () => {
    const educator = await makeIssuer({ id: 1 });
    await expect(
      precheckCertificate({ paymentService, educator, studentWallet: STUDENT_WALLET }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError when paymentService is missing", async () => {
    const educator = await makeIssuer({ id: 1 });
    await expect(
      precheckCertificate({ models, educator, studentWallet: STUDENT_WALLET }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError when educator is missing", async () => {
    await expect(
      precheckCertificate({ models, paymentService, studentWallet: STUDENT_WALLET }),
    ).rejects.toThrow(TypeError);
  });

  test("throws TypeError on a malformed studentWallet", async () => {
    const educator = await makeIssuer({ id: 1 });
    await expect(
      precheckCertificate({ models, paymentService, educator, studentWallet: "not-a-wallet" }),
    ).rejects.toThrow(TypeError);
    await expect(
      precheckCertificate({ models, paymentService, educator, studentWallet: "0xshort" }),
    ).rejects.toThrow(TypeError);
  });
});
