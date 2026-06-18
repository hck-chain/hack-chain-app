// backend/tests/class-settings.test.js
//
// Validation and security tests for GET/PATCH /api/issuers/me/classes.
// Uses SQLite in-memory. Auth middleware is mocked to inject req.auth
// without needing real JWT signing or an active session.

const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(20000);

jest.mock("express-rate-limit", () => () => (req, res, next) => next());
jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
}));
jest.mock("../services/authorizeIssuer", () => ({
  authorizeIssuer: jest.fn().mockResolvedValue(undefined),
}));

const ISSUER_WALLET = "0x" + "aa".repeat(20);
const STUDENT_WALLET = "0x" + "bb".repeat(20);

// Helpers to build an app with a specific req.auth injected
function buildApp(models, authPayload) {
  let app;
  jest.isolateModules(() => {
    jest.doMock("../models", () => models);
    jest.doMock("../middleware/auth", () => ({
      authenticate: (req, res, next) => {
        if (!authPayload) return res.status(401).json({ error: "Unauthorized" });
        req.auth = authPayload;
        next();
      },
      signToken: () => "tok",
      signRefreshToken: () => "ref",
      setAuthCookies: jest.fn(),
    }));
    jest.doMock("../services/emailService", () => ({
      notifyClassRequestStatusChange: jest.fn().mockResolvedValue(undefined),
      notifyNewClassRequest: jest.fn().mockResolvedValue(undefined),
      notifyAdminEducatorRegistered: jest.fn().mockResolvedValue(undefined),
      notifyAdminEducatorReapply: jest.fn().mockResolvedValue(undefined),
    }));
    const issuersRoute = require("../routes/issuers");
    app = express();
    app.use(bodyParser.json());
    app.use("/api/issuers", issuersRoute);
  });
  return app;
}

describe("Class settings endpoints", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, Certificate, UserSession;
  let models;
  let issuerApp;
  let studentApp;
  let unauthApp;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const DataTypes = SequelizePkg.DataTypes;

    User = require("../models/users")(sequelize, DataTypes);
    Student = require("../models/students")(sequelize, DataTypes);
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);

    models = { User, Student, Issuer, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));

    await sequelize.sync({ force: true });

    await User.create({ wallet_address: ISSUER_WALLET, role: "issuer", name: "Prof", nonce: crypto.randomBytes(16).toString("hex") });
    await Issuer.create({ wallet_address: ISSUER_WALLET, organization_name: "HackAcademy" });

    await User.create({ wallet_address: STUDENT_WALLET, role: "student", name: "Stu", nonce: crypto.randomBytes(16).toString("hex") });
    await Student.create({ wallet_address: STUDENT_WALLET });

    issuerApp = buildApp(models, { role: "issuer", wallet: ISSUER_WALLET, sub: 1 });
    studentApp = buildApp(models, { role: "student", wallet: STUDENT_WALLET, sub: 2 });
    unauthApp = buildApp(models, null);
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  // ---------------------------------------------------------------------------
  // GET /api/issuers/me/classes
  // ---------------------------------------------------------------------------

  describe("GET /me/classes", () => {
    test("issuer — returns class_settings (initially null)", async () => {
      const res = await request(issuerApp).get("/api/issuers/me/classes").expect(200);
      expect(res.body).toHaveProperty("class_settings");
    });

    test("non-issuer role — 403", async () => {
      const res = await request(studentApp).get("/api/issuers/me/classes").expect(403);
      expect(res.body.error).toMatch(/educator/i);
    });

    test("unauthenticated — 401", async () => {
      await request(unauthApp).get("/api/issuers/me/classes").expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/issuers/me/classes — happy paths
  // ---------------------------------------------------------------------------

  describe("PATCH /me/classes — valid payloads", () => {
    test("saves hourly_rate_usd, accept_usdc, and durations", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ hourly_rate_usd: 80, accept_usdc: true, durations: [30, 60] })
        .expect(200);

      expect(res.body.class_settings).toMatchObject({ hourly_rate_usd: 80, accept_usdc: true });
      expect(res.body.class_settings.durations).toEqual(expect.arrayContaining([30, 60]));
    });

    test("saves valid weekly availability", async () => {
      const availability = {
        mon: { enabled: true, start: "09:00", end: "17:00" },
        tue: { enabled: false, start: "09:00", end: "10:00" },
      };
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability })
        .expect(200);

      expect(res.body.class_settings.availability.mon.enabled).toBe(true);
    });

    test("saves google_calendar_url with valid Google Calendar URL", async () => {
      const url = "https://calendar.google.com/calendar/embed?src=test%40gmail.com&ctz=America%2FMexico_City";
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ google_calendar_url: url })
        .expect(200);

      expect(res.body.class_settings.google_calendar_url).toBe(url);
    });

    test("clears google_calendar_url when null is sent", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ google_calendar_url: null })
        .expect(200);

      expect(res.body.class_settings.google_calendar_url).toBeNull();
    });

    test("partial update merges with existing settings", async () => {
      await request(issuerApp).patch("/api/issuers/me/classes").send({ hourly_rate_usd: 50 });
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ accept_usdc: false })
        .expect(200);

      expect(res.body.class_settings.hourly_rate_usd).toBe(50);
      expect(res.body.class_settings.accept_usdc).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /me/classes — auth & role
  // ---------------------------------------------------------------------------

  describe("PATCH /me/classes — auth guards", () => {
    test("non-issuer role — 403", async () => {
      const res = await request(studentApp)
        .patch("/api/issuers/me/classes")
        .send({ hourly_rate_usd: 100 })
        .expect(403);
      expect(res.body.error).toMatch(/educator/i);
    });

    test("unauthenticated — 401", async () => {
      await request(unauthApp).patch("/api/issuers/me/classes").send({ hourly_rate_usd: 100 }).expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /me/classes — hourly_rate_usd validation
  // ---------------------------------------------------------------------------

  describe("PATCH /me/classes — hourly_rate_usd validation", () => {
    test("negative value — 400", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ hourly_rate_usd: -1 })
        .expect(400);
      expect(res.body.error).toMatch(/hourly_rate_usd/i);
    });

    test("above 9999 — 400", async () => {
      await request(issuerApp).patch("/api/issuers/me/classes").send({ hourly_rate_usd: 10000 }).expect(400);
    });

    test("string value — 400", async () => {
      await request(issuerApp).patch("/api/issuers/me/classes").send({ hourly_rate_usd: "free" }).expect(400);
    });

    test("zero is a valid rate (free class)", async () => {
      await request(issuerApp).patch("/api/issuers/me/classes").send({ hourly_rate_usd: 0 }).expect(200);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /me/classes — durations validation
  // ---------------------------------------------------------------------------

  describe("PATCH /me/classes — durations validation", () => {
    test("invalid duration value — 400", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ durations: [15] })
        .expect(400);
      expect(res.body.error).toMatch(/durations/i);
    });

    test("not an array — 400", async () => {
      await request(issuerApp).patch("/api/issuers/me/classes").send({ durations: 30 }).expect(400);
    });

    test("empty array — 400", async () => {
      await request(issuerApp).patch("/api/issuers/me/classes").send({ durations: [] }).expect(400);
    });

    test("duplicate values — 400 (security: no repeated durations)", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ durations: [30, 30] })
        .expect(400);
      expect(res.body.error).toMatch(/durations/i);
    });

    test("array exceeding max length (more than 3) — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ durations: [30, 45, 60, 30] })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /me/classes — availability validation
  // ---------------------------------------------------------------------------

  describe("PATCH /me/classes — availability validation", () => {
    test("invalid time format — 400", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { mon: { enabled: true, start: "9:00", end: "17:00" } } })
        .expect(400);
      expect(res.body.error).toMatch(/mon/i);
    });

    test("start equal to end — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { mon: { enabled: true, start: "09:00", end: "09:00" } } })
        .expect(400);
    });

    test("start after end — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { mon: { enabled: true, start: "18:00", end: "09:00" } } })
        .expect(400);
    });

    test("enabled=true with no times — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { mon: { enabled: true } } })
        .expect(400);
    });

    test("non-boolean enabled — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { mon: { enabled: "yes", start: "09:00", end: "17:00" } } })
        .expect(400);
    });

    test("not an object — 400", async () => {
      await request(issuerApp).patch("/api/issuers/me/classes").send({ availability: "all day" }).expect(400);
    });

    test("array as availability — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: [{ mon: true }] })
        .expect(400);
    });

    // Security: extra keys beyond VALID_DAYS must be rejected.
    // __proto__ as a JSON key is sanitized by the Node.js runtime before reaching
    // application code. This test verifies the route rejects any other unknown keys.
    test("unknown non-day key in availability rejected — 400", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { mon: { enabled: true, start: "09:00", end: "17:00" }, extra_field: { enabled: true } } })
        .expect(400);
      expect(res.body.error).toMatch(/invalid keys/i);
    });

    test("unknown day key injected — 400", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { mon: { enabled: true, start: "09:00", end: "17:00" }, evilday: { enabled: true } } })
        .expect(400);
      expect(res.body.error).toMatch(/invalid keys/i);
    });

    test("disabled day with times passes (times ignored when disabled)", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ availability: { wed: { enabled: false, start: "09:00", end: "17:00" } } })
        .expect(200);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /me/classes — google_calendar_url validation
  // ---------------------------------------------------------------------------

  describe("PATCH /me/classes — google_calendar_url validation", () => {
    test("non-Google URL rejected — 400", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ google_calendar_url: "https://evil.com/steal" })
        .expect(400);
      expect(res.body.error).toMatch(/google calendar/i);
    });

    test("URL exceeding 1000 chars — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ google_calendar_url: "https://calendar.google.com/" + "x".repeat(980) })
        .expect(400);
    });

    test("URL spoofing google.com subdomain rejected — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ google_calendar_url: "https://calendar.google.com.evil.com/embed" })
        .expect(400);
    });

    test("http (non-HTTPS) Google Calendar URL rejected — 400", async () => {
      await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ google_calendar_url: "http://calendar.google.com/calendar/embed?src=test" })
        .expect(400);
    });

    test("empty string clears the URL", async () => {
      const res = await request(issuerApp)
        .patch("/api/issuers/me/classes")
        .send({ google_calendar_url: "" })
        .expect(200);
      expect(res.body.class_settings.google_calendar_url).toBeNull();
    });
  });
});
