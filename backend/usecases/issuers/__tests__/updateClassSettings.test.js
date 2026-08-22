// Unit tests for updateClassSettings use case.
// Uses SQLite in-memory — no HTTP layer involved.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { updateClassSettings } = require("../updateClassSettings");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);

describe("updateClassSettings", () => {
  let sequelize, models;

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
  });

  afterAll(() => sequelize.close());

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce(), educator_approval_status: "approved" });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
  });

  const base = () => ({ models, wallet: ISSUER });

  test("throws TypeError when models is missing", async () => {
    await expect(updateClassSettings({ wallet: ISSUER })).rejects.toThrow(TypeError);
  });

  test("throws TypeError when wallet is missing", async () => {
    await expect(updateClassSettings({ models })).rejects.toThrow(TypeError);
  });

  test("returns ISSUER_NOT_FOUND for an unknown wallet", async () => {
    const result = await updateClassSettings({ models, wallet: "0x" + "ff".repeat(20), hourlyRateUsd: 10 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("ISSUER_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  // ---- hourly_rate_usd ----

  test("rejects a non-numeric hourly_rate_usd", async () => {
    const result = await updateClassSettings({ ...base(), hourlyRateUsd: "50" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_HOURLY_RATE");
  });

  test("rejects hourly_rate_usd out of range", async () => {
    const result = await updateClassSettings({ ...base(), hourlyRateUsd: 10000 });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_HOURLY_RATE");
  });

  test("accepts a valid hourly_rate_usd", async () => {
    const result = await updateClassSettings({ ...base(), hourlyRateUsd: 75 });
    expect(result.ok).toBe(true);
    expect(result.data.class_settings.hourly_rate_usd).toBe(75);
  });

  // ---- accept_usdt ----

  test("rejects a non-boolean accept_usdt", async () => {
    const result = await updateClassSettings({ ...base(), acceptUsdt: "yes" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_ACCEPT_USDT");
  });

  // ---- durations ----

  test("rejects an empty durations array", async () => {
    const result = await updateClassSettings({ ...base(), durations: [] });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_DURATIONS");
  });

  test("rejects durations with an invalid value", async () => {
    const result = await updateClassSettings({ ...base(), durations: [30, 999] });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_DURATIONS");
  });

  test("rejects duplicate durations", async () => {
    const result = await updateClassSettings({ ...base(), durations: [30, 30] });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_DURATIONS");
  });

  test("accepts a valid durations array", async () => {
    const result = await updateClassSettings({ ...base(), durations: [30, 60] });
    expect(result.ok).toBe(true);
    expect(result.data.class_settings.durations).toEqual([30, 60]);
  });

  // ---- availability ----

  test("rejects availability that is not an object", async () => {
    const result = await updateClassSettings({ ...base(), availability: "monday" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_AVAILABILITY");
  });

  test("rejects availability with keys outside the whitelist (JSONB injection guard)", async () => {
    const availability = { mon: { enabled: false } };
    availability["monday"] = { enabled: true }; // not a valid day key
    const result = await updateClassSettings({ ...base(), availability });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_AVAILABILITY");
  });

  test("rejects a day slot missing the enabled flag", async () => {
    const result = await updateClassSettings({
      ...base(),
      availability: { mon: { start: "09:00", end: "10:00" } },
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_AVAILABILITY");
  });

  test("rejects invalid HH:MM times", async () => {
    const result = await updateClassSettings({
      ...base(),
      availability: { mon: { enabled: true, start: "9am", end: "10am" } },
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_AVAILABILITY");
  });

  test("rejects a slot where start is not before end", async () => {
    const result = await updateClassSettings({
      ...base(),
      availability: { mon: { enabled: true, start: "10:00", end: "09:00" } },
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_AVAILABILITY");
  });

  test("accepts a valid availability object", async () => {
    const result = await updateClassSettings({
      ...base(),
      availability: { mon: { enabled: true, start: "09:00", end: "17:00" }, tue: { enabled: false } },
    });
    expect(result.ok).toBe(true);
    expect(result.data.class_settings.availability.mon.start).toBe("09:00");
  });

  // ---- google_calendar_url ----

  test("rejects a google_calendar_url that is not a Google Calendar URL", async () => {
    const result = await updateClassSettings({ ...base(), googleCalendarUrl: "https://evil.com/calendar" });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_GOOGLE_CALENDAR_URL");
  });

  test("accepts a valid google_calendar_url", async () => {
    const url = "https://calendar.google.com/calendar/embed?src=abc";
    const result = await updateClassSettings({ ...base(), googleCalendarUrl: url });
    expect(result.ok).toBe(true);
    expect(result.data.class_settings.google_calendar_url).toBe(url);
  });

  test("clears google_calendar_url when given an empty string", async () => {
    const result = await updateClassSettings({ ...base(), googleCalendarUrl: "   " });
    expect(result.ok).toBe(true);
    expect(result.data.class_settings.google_calendar_url).toBeNull();
  });

  // ---- partial merge behavior ----

  test("merges partial updates without wiping previously set fields", async () => {
    await updateClassSettings({ ...base(), hourlyRateUsd: 50, durations: [30, 60] });
    const result = await updateClassSettings({ ...base(), acceptUsdt: true });

    expect(result.ok).toBe(true);
    expect(result.data.class_settings).toEqual({
      hourly_rate_usd: 50,
      durations: [30, 60],
      accept_usdt: true,
    });
  });

  // SECURITY: an educator pending/rejected by admin review must not be able
  // to configure class_settings — otherwise requestClass.js's own approval
  // gate is moot, since a pending educator would already look bookable.
  describe("educator approval gate", () => {
    const PENDING = "0x" + "55".repeat(20);

    const setStatus = async (status) => {
      await models.User.update({ educator_approval_status: status }, { where: { wallet_address: PENDING } });
    };

    beforeEach(async () => {
      const nonce = () => crypto.randomBytes(16).toString("hex");
      await models.User.create({ wallet_address: PENDING, role: "issuer", name: "Pending", nonce: nonce(), educator_approval_status: "pending_approval" });
      await models.Issuer.create({ wallet_address: PENDING, organization_name: "PendingAcademy" });
    });

    test("returns EDUCATOR_NOT_APPROVED for pending_approval", async () => {
      const result = await updateClassSettings({ models, wallet: PENDING, hourlyRateUsd: 50 });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EDUCATOR_NOT_APPROVED");
      expect(result.httpStatus).toBe(403);
    });

    test("returns EDUCATOR_NOT_APPROVED for rejected", async () => {
      await setStatus("rejected");
      const result = await updateClassSettings({ models, wallet: PENDING, hourlyRateUsd: 50 });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EDUCATOR_NOT_APPROVED");
    });

    test("returns EDUCATOR_NOT_APPROVED for null status", async () => {
      await setStatus(null);
      const result = await updateClassSettings({ models, wallet: PENDING, hourlyRateUsd: 50 });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("EDUCATOR_NOT_APPROVED");
    });

    test("does not persist class_settings when the educator is not approved", async () => {
      await updateClassSettings({ models, wallet: PENDING, hourlyRateUsd: 50, durations: [30] });
      const issuer = await models.Issuer.findOne({ where: { wallet_address: PENDING } });
      expect(issuer.class_settings).toBeNull();
    });

    test("allows the update once the educator is approved", async () => {
      await setStatus("approved");
      const result = await updateClassSettings({ models, wallet: PENDING, hourlyRateUsd: 50 });
      expect(result.ok).toBe(true);
      expect(result.data.class_settings.hourly_rate_usd).toBe(50);
    });
  });
});
