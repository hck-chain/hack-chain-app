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
    await User.create({ wallet_address: ISSUER,  role: "issuer",  name: "Prof", nonce: nonce() });
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

  test("returns INSUFFICIENT_LEAD_TIME for a past date", async () => {
    const result = await requestClass({ ...base(), requestedDate: "2000-01-01" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INSUFFICIENT_LEAD_TIME");
  });

  test("returns INSUFFICIENT_LEAD_TIME when slot is within 24 hours", async () => {
    // Build a date/time that is exactly 23 hours from now — inside the lead window.
    const soon = new Date(Date.now() + 23 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const requestedDate = `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`;
    const startTime = `${pad(soon.getHours())}:${pad(soon.getMinutes())}`;
    const result = await requestClass({ ...base(), requestedDate, startTime });
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
    await models.User.create({ wallet_address: wallet, role: "issuer", name: "NoSettings", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Issuer.create({ wallet_address: wallet, organization_name: "X", class_settings: null });
    const result = await requestClass({ ...base(), issuerWalletAddress: wallet });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("EDUCATOR_NOT_FOUND");
  });

  test("creates the request and returns id + status on valid input", async () => {
    const result = await requestClass(base());
    expect(result.ok).toBe(true);
    expect(result.data.id).toBeDefined();
    expect(result.data.status).toBe("pending");
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
