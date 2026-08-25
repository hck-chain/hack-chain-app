// Unit tests for requestClass use case.
// Uses SQLite in-memory — no HTTP layer involved.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { requestClass } = require("../requestClass");

jest.setTimeout(15000);

const STUDENT = "0x" + "aa".repeat(20);
const ISSUER  = "0x" + "bb".repeat(20);
const FUTURE  = "2030-12-31";

describe("requestClass", () => {
  let sequelize, models, classId;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;

    const User         = require("../../../models/users")(sequelize, DataTypes);
    const Issuer       = require("../../../models/issuers")(sequelize, DataTypes);
    const IssuerClass  = require("../../../models/issuerClasses")(sequelize, DataTypes);
    const ClassRequest = require("../../../models/classRequests")(sequelize, DataTypes);
    const Student      = require("../../../models/students")(sequelize, DataTypes);
    const Recruiter    = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate  = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession  = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, IssuerClass, ClassRequest, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await User.create({ wallet_address: STUDENT, role: "student", name: "Ana", nonce: nonce() });
    await User.create({ wallet_address: ISSUER,  role: "issuer",  name: "Prof", nonce: nonce(), educator_approval_status: "approved" });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", class_settings: { hourly_rate_usd: 50 } });

    const cls = await IssuerClass.create({ issuer_wallet_address: ISSUER, name: "Pentest 101", topics: [], is_active: true });
    classId = cls.id;
  });

  afterAll(() => sequelize.close());

  const base = () => ({
    models,
    studentWallet: STUDENT,
    issuerWalletAddress: ISSUER,
    requestedDate: FUTURE,
    startTime: "10:00",
    durationMinutes: 60,
  });

  test("throws TypeError when models is missing", async () => {
    await expect(requestClass({ studentWallet: STUDENT })).rejects.toThrow(TypeError);
  });

  test("returns MISSING_FIELDS when required fields are absent", async () => {
    const result = await requestClass({ ...base(), requestedDate: undefined });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_FIELDS");
    expect(result.httpStatus).toBe(400);
  });

  test("returns INVALID_DURATION for a non-allowed duration", async () => {
    const result = await requestClass({ ...base(), durationMinutes: 99 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_DURATION");
  });

  test("accepts all valid durations", async () => {
    for (const dur of [30, 45, 60, 90, 120]) {
      const result = await requestClass({ ...base(), durationMinutes: dur });
      expect(result.ok).toBe(true);
    }
  });

  test("returns INVALID_TIME_FORMAT for malformed time", async () => {
    const result = await requestClass({ ...base(), startTime: "9:00" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_TIME_FORMAT");
  });

  test("returns INVALID_OR_PAST_DATE for a past date", async () => {
    const result = await requestClass({ ...base(), requestedDate: "2000-01-01" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_OR_PAST_DATE");
  });

  test("returns INSUFFICIENT_LEAD_TIME when slot is within 24 hours", async () => {
    // Use requestedTimestampUtc (timezone-safe path) to avoid date string reconstruction bugs.
    const soon = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const result = await requestClass({ ...base(), requestedTimestampUtc: soon.toISOString() });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INSUFFICIENT_LEAD_TIME");
  });

  test("returns INSUFFICIENT_LEAD_TIME when slot is within 24 hours", async () => {
    // Use requestedTimestampUtc (timezone-safe path) to avoid date string reconstruction bugs.
    const soon = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const result = await requestClass({ ...base(), requestedTimestampUtc: soon.toISOString() });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INSUFFICIENT_LEAD_TIME");
  });

  test("returns INSUFFICIENT_LEAD_TIME when slot is within 24 hours", async () => {
    // Use requestedTimestampUtc (timezone-safe path) to avoid date string reconstruction bugs.
    const soon = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const result = await requestClass({ ...base(), requestedTimestampUtc: soon.toISOString() });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INSUFFICIENT_LEAD_TIME");
  });

  test("returns EDUCATOR_NOT_FOUND when educator has no class_settings", async () => {
    const wallet = "0x" + "dd".repeat(20);
    await models.User.create({ wallet_address: wallet, role: "issuer", name: "NoSettings", nonce: crypto.randomBytes(16).toString("hex"), educator_approval_status: "approved" });
    await models.Issuer.create({ wallet_address: wallet, organization_name: "X", class_settings: null });
    const result = await requestClass({ ...base(), issuerWalletAddress: wallet });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("EDUCATOR_NOT_FOUND");
  });

  // SECURITY: only certificate minting (precheckCertificate.js) checked admin
  // approval before this fix — a pending/rejected educator could still receive
  // paid class requests. These three cases lock in the fix.
  describe("educator approval gate", () => {
    const makeUnapprovedIssuer = async (wallet, status) => {
      await models.User.create({
        wallet_address: wallet,
        role: "issuer",
        name: "Unapproved",
        nonce: crypto.randomBytes(16).toString("hex"),
        educator_approval_status: status,
      });
      await models.Issuer.create({
        wallet_address: wallet,
        organization_name: "PendingAcademy",
        class_settings: { hourly_rate_usd: 50 },
      });
    };

    test("returns EDUCATOR_NOT_APPROVED when status is pending_approval", async () => {
      const wallet = "0x" + "11".repeat(20);
      await makeUnapprovedIssuer(wallet, "pending_approval");
      const result = await requestClass({ ...base(), issuerWalletAddress: wallet });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EDUCATOR_NOT_APPROVED");
      expect(result.httpStatus).toBe(403);
    });

    test("returns EDUCATOR_NOT_APPROVED when status is rejected", async () => {
      const wallet = "0x" + "22".repeat(20);
      await makeUnapprovedIssuer(wallet, "rejected");
      const result = await requestClass({ ...base(), issuerWalletAddress: wallet });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EDUCATOR_NOT_APPROVED");
    });

    test("returns EDUCATOR_NOT_APPROVED when status is null (never reviewed)", async () => {
      const wallet = "0x" + "33".repeat(20);
      await makeUnapprovedIssuer(wallet, null);
      const result = await requestClass({ ...base(), issuerWalletAddress: wallet });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EDUCATOR_NOT_APPROVED");
    });

    test("does not create a ClassRequest row when the educator is not approved", async () => {
      const wallet = "0x" + "44".repeat(20);
      await makeUnapprovedIssuer(wallet, "pending_approval");
      const before = await models.ClassRequest.count();
      await requestClass({ ...base(), issuerWalletAddress: wallet });
      const after = await models.ClassRequest.count();
      expect(after).toBe(before);
    });
  });

  test("creates the request and returns id + status on valid input", async () => {
    const result = await requestClass(base());
    expect(result.ok).toBe(true);
    expect(result.data.id).toBeDefined();
    expect(result.data.status).toBe("pending");
  });

  test("stores hourly_rate_usd from the educator's own class_settings, not the caller", async () => {
    const result = await requestClass(base());
    expect(result.ok).toBe(true);
    const saved = await models.ClassRequest.findByPk(result.data.id);
    expect(Number(saved.hourly_rate_usd)).toBe(50);
  });

  // SECURITY: hourly_rate_usd is the basis for the on-chain USDT amount the
  // student is later required to pay (submitPaymentProof.js) — it must never
  // be settable by the client, or a student could pay a fraction of the
  // real price. requestClass no longer even accepts a hourlyRateUsd param;
  // this asserts that even if a caller (or a future regression) passes one
  // through, it's silently ignored in favor of the trusted server value.
  test("ignores a client-supplied hourlyRateUsd entirely", async () => {
    const result = await requestClass({ ...base(), hourlyRateUsd: 0.01 });
    expect(result.ok).toBe(true);
    const saved = await models.ClassRequest.findByPk(result.data.id);
    expect(Number(saved.hourly_rate_usd)).toBe(50);
  });

  test("stores class_name snapshot when issuer_class_id is valid", async () => {
    const result = await requestClass({ ...base(), issuerClassId: classId });
    expect(result.ok).toBe(true);
    const saved = await models.ClassRequest.findByPk(result.data.id);
    expect(saved.class_name).toBe("Pentest 101");
    expect(saved.issuer_class_id).toBe(classId);
  });

  test("returns CLASS_NOT_FOUND when class belongs to different educator", async () => {
    const result = await requestClass({ ...base(), issuerClassId: classId, issuerWalletAddress: "0x" + "ee".repeat(20) });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("EDUCATOR_NOT_FOUND");
  });

  test("truncates student_message to 500 chars", async () => {
    const result = await requestClass({ ...base(), studentMessage: "x".repeat(600) });
    expect(result.ok).toBe(true);
    const saved = await models.ClassRequest.findByPk(result.data.id);
    expect(saved.student_message.length).toBe(500);
  });
});
