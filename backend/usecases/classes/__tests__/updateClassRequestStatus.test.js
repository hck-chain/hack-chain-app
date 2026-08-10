// Unit tests for updateClassRequestStatus use case.
// Uses SQLite in-memory — no HTTP layer involved.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { updateClassRequestStatus } = require("../updateClassRequestStatus");

jest.setTimeout(15000);

const STUDENT  = "0x" + "aa".repeat(20);
const ISSUER   = "0x" + "bb".repeat(20);
const ISSUER2  = "0x" + "dd".repeat(20);
const FUTURE   = "2030-12-31";

describe("updateClassRequestStatus", () => {
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

    await User.create({ wallet_address: STUDENT, role: "student", name: "Ana",  nonce: nonce() });
    await User.create({ wallet_address: ISSUER,  role: "issuer",  name: "Prof", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy", class_settings: {} });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when required args are missing", async () => {
    await expect(updateClassRequestStatus({ status: "confirmed" })).rejects.toThrow(TypeError);
  });

  test("returns INVALID_STATUS for an unknown status", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({ models, requestId: req.id, issuerWallet: ISSUER, status: "bogus" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_STATUS");
  });

  test("returns REQUEST_NOT_FOUND when the request belongs to a different issuer", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({ models, requestId: req.id, issuerWallet: ISSUER2, status: "confirmed" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("REQUEST_NOT_FOUND");
  });

  test("confirms a class without a meeting link", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({ models, requestId: req.id, issuerWallet: ISSUER, status: "confirmed" });
    expect(result.ok).toBe(true);
    expect(result.data.status).toBe("confirmed");
    expect(result.data.meeting_url).toBeNull();
  });

  test("confirms a class and stores the meeting link", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "confirmed",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(result.ok).toBe(true);
    expect(result.data.meeting_url).toBe("https://meet.google.com/abc-defg-hij");

    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.meeting_url).toBe("https://meet.google.com/abc-defg-hij");
  });

  test("a fresh pending->confirmed transition reports previous_status: pending", async () => {
    const req = await createRequest({ status: "pending" });
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "confirmed",
    });
    expect(result.data.previous_status).toBe("pending");
    expect(result.data.meeting_url_changed).toBe(false);
  });

  test("re-confirming with no meetingUrl change reports meeting_url_changed: false", async () => {
    const req = await createRequest({ status: "confirmed" });
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "confirmed",
    });
    expect(result.data.previous_status).toBe("confirmed");
    expect(result.data.meeting_url_changed).toBe(false);
  });

  test("re-confirming updates the meeting link (edit after the fact)", async () => {
    const req = await createRequest({ status: "confirmed", meeting_url: "https://zoom.us/j/111" });
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "confirmed",
      meetingUrl: "https://zoom.us/j/222",
    });
    expect(result.ok).toBe(true);
    expect(result.data.meeting_url).toBe("https://zoom.us/j/222");
    // The caller (route) uses these two fields to tell a real confirmation
    // apart from a meeting-link edit and pick the right email to send.
    expect(result.data.previous_status).toBe("confirmed");
    expect(result.data.meeting_url_changed).toBe(true);
  });

  test("rejects a meeting link when the target status isn't confirmed", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "cancelled",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("MEETING_URL_REQUIRES_CONFIRMED");
  });

  test("rejects a javascript: meeting URL", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "confirmed",
      meetingUrl: "javascript:alert(1)",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_MEETING_URL");
  });

  test("rejects a malformed meeting URL", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "confirmed",
      meetingUrl: "not a url",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_MEETING_URL");
  });

  test("cancels a class with a reason", async () => {
    const req = await createRequest();
    const result = await updateClassRequestStatus({
      models, requestId: req.id, issuerWallet: ISSUER, status: "cancelled",
      cancellationReason: "El educador tuvo un imprevisto",
    });
    expect(result.ok).toBe(true);
    const updated = await models.ClassRequest.findByPk(req.id);
    expect(updated.cancellation_reason).toBe("El educador tuvo un imprevisto");
  });
});
