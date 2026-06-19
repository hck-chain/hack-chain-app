// Unit tests for cancelClassRequest use case.
// Uses SQLite in-memory — no HTTP layer involved.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { cancelClassRequest } = require("../cancelClassRequest");

jest.setTimeout(15000);

const STUDENT  = "0x" + "aa".repeat(20);
const STUDENT2 = "0x" + "cc".repeat(20);
const ISSUER   = "0x" + "bb".repeat(20);
const FUTURE   = "2030-12-31";

describe("cancelClassRequest", () => {
  let sequelize, models;

  const nonce = () => crypto.randomBytes(16).toString("hex");

  async function createRequest(overrides = {}) {
    return models.ClassRequest.create({
      student_wallet_address: STUDENT,
      issuer_wallet_address:  ISSUER,
      requested_date:         FUTURE,
      start_time:             "10:00",
      duration_minutes:       60,
      status:                 "pending",
      ...overrides,
    });
  }

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

    await User.create({ wallet_address: STUDENT,  role: "student", name: "Ana",   nonce: nonce() });
    await User.create({ wallet_address: STUDENT2, role: "student", name: "Bob",   nonce: nonce() });
    await User.create({ wallet_address: ISSUER,   role: "issuer",  name: "Prof",  nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", class_settings: {} });
  });

  afterAll(() => sequelize.close());

  // ── Guard clauses ─────────────────────────────────────────────────────────

  test("throws TypeError when models is missing", async () => {
    await expect(cancelClassRequest({ studentWallet: STUDENT })).rejects.toThrow(TypeError);
  });

  test("throws TypeError when studentWallet is missing", async () => {
    await expect(cancelClassRequest({ models })).rejects.toThrow(TypeError);
  });

  // ── Not found ─────────────────────────────────────────────────────────────

  test("returns REQUEST_NOT_FOUND when id does not exist", async () => {
    const result = await cancelClassRequest({ models, requestId: 999999, studentWallet: STUDENT });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("REQUEST_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("returns REQUEST_NOT_FOUND when request belongs to a different student", async () => {
    const req = await createRequest();
    const result = await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT2 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("REQUEST_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  // ── Status guard ──────────────────────────────────────────────────────────

  test("returns CANNOT_CANCEL_NON_PENDING when status is confirmed", async () => {
    const req = await createRequest({ status: "confirmed" });
    const result = await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("CANNOT_CANCEL_NON_PENDING");
    expect(result.httpStatus).toBe(422);
  });

  test("returns CANNOT_CANCEL_NON_PENDING when status is completed", async () => {
    const req = await createRequest({ status: "completed" });
    const result = await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("CANNOT_CANCEL_NON_PENDING");
    expect(result.httpStatus).toBe(422);
  });

  test("returns CANNOT_CANCEL_NON_PENDING when status is already cancelled", async () => {
    const req = await createRequest({ status: "cancelled" });
    const result = await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("CANNOT_CANCEL_NON_PENDING");
    expect(result.httpStatus).toBe(422);
  });

  // ── Happy path ────────────────────────────────────────────────────────────

  test("cancels a pending request and returns ok: true with cancelled status", async () => {
    const req = await createRequest({ status: "pending" });
    const result = await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT });
    expect(result.ok).toBe(true);
    expect(result.data.id).toBe(req.id);
    expect(result.data.status).toBe("cancelled");
  });

  test("returns issuer_wallet_address and scheduling fields in the response for email notification", async () => {
    const req = await createRequest({ status: "pending" });
    const result = await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT });
    expect(result.ok).toBe(true);
    expect(result.data.issuer_wallet_address).toBe(ISSUER);
    expect(result.data.requested_date).toBeDefined();
    expect(result.data.start_time).toBeDefined();
    expect(result.data.duration_minutes).toBeDefined();
  });

  test("persists cancelled status in the database", async () => {
    const req = await createRequest({ status: "pending" });
    await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT });
    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.status).toBe("cancelled");
  });

  test("stores cancellation_reason when provided", async () => {
    const req = await createRequest({ status: "pending" });
    await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT, cancellationReason: "Scheduling conflict" });
    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.cancellation_reason).toBe("Scheduling conflict");
  });

  test("truncates cancellation_reason to 500 characters", async () => {
    const req = await createRequest({ status: "pending" });
    const longReason = "x".repeat(600);
    await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT, cancellationReason: longReason });
    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.cancellation_reason).toHaveLength(500);
  });

  test("leaves cancellation_reason null when not provided", async () => {
    const req = await createRequest({ status: "pending" });
    await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT });
    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.cancellation_reason).toBeNull();
  });

  test("wallet comparison is case-insensitive", async () => {
    const req = await createRequest({ student_wallet_address: STUDENT.toLowerCase() });
    const result = await cancelClassRequest({ models, requestId: req.id, studentWallet: STUDENT.toUpperCase() });
    expect(result.ok).toBe(true);
  });

  // ── Idempotency / isolation ───────────────────────────────────────────────

  test("does not affect other students' requests", async () => {
    const reqA = await createRequest({ student_wallet_address: STUDENT,  status: "pending" });
    const reqB = await createRequest({ student_wallet_address: STUDENT2, status: "pending" });

    await cancelClassRequest({ models, requestId: reqA.id, studentWallet: STUDENT });

    const unchanged = await models.ClassRequest.findByPk(reqB.id);
    expect(unchanged.status).toBe("pending");
  });
});
