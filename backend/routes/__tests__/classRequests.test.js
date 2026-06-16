// backend/routes/__tests__/classRequests.test.js
//
// Validation and security tests for all /api/class-requests endpoints.
// Uses SQLite in-memory. Auth middleware is mocked to inject req.auth.

const request    = require("supertest");
const express    = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const crypto     = require("crypto");

jest.setTimeout(20000);
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const STUDENT_WALLET = "0x" + "aa".repeat(20);
const ISSUER_WALLET  = "0x" + "bb".repeat(20);
const ISSUER2_WALLET = "0x" + "cc".repeat(20);
const FUTURE_DATE    = "2030-12-31";

function buildApp(models, authPayload) {
  let app;
  jest.isolateModules(() => {
    jest.doMock("../../models", () => models);
    jest.doMock("../../middleware/auth", () => ({
      authenticate: (req, res, next) => {
        if (!authPayload) return res.status(401).json({ error: "Unauthorized" });
        req.auth = authPayload;
        next();
      },
    }));
    const route = require("../classRequests");
    app = express();
    app.use(bodyParser.json());
    app.use("/api/class-requests", route);
  });
  return app;
}

const BASE_BODY = {
  issuer_wallet_address: ISSUER_WALLET,
  requested_date: FUTURE_DATE,
  start_time: "10:00",
  duration_minutes: 60,
  hourly_rate_usd: 50,
};

describe("ClassRequests endpoints", () => {
  let sequelize, User, Issuer, IssuerClass, ClassRequest;
  let models;
  let studentApp, issuerApp, issuer2App, publicApp;
  let classId;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;

    User         = require("../../models/users")(sequelize, DataTypes);
    Issuer       = require("../../models/issuers")(sequelize, DataTypes);
    IssuerClass  = require("../../models/issuerClasses")(sequelize, DataTypes);
    ClassRequest = require("../../models/classRequests")(sequelize, DataTypes);
    const Student     = require("../../models/students")(sequelize, DataTypes);
    const Recruiter   = require("../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../models/userSessions")(sequelize, DataTypes);

    models = {
      User, Issuer, IssuerClass, ClassRequest,
      Student, Recruiter, Certificate, UserSession,
      sequelize, Sequelize: SequelizePkg,
    };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));

    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await User.create({ wallet_address: STUDENT_WALLET, role: "student", name: "Ana",   nonce: nonce() });
    await User.create({ wallet_address: ISSUER_WALLET,  role: "issuer",  name: "Prof",  nonce: nonce() });
    await User.create({ wallet_address: ISSUER2_WALLET, role: "issuer",  name: "Prof2", nonce: nonce() });

    await Issuer.create({
      wallet_address: ISSUER_WALLET,
      organization_name: "HackAcademy",
      class_settings: { hourly_rate_usd: 50, durations: [60], availability: {} },
    });
    await Issuer.create({
      wallet_address: ISSUER2_WALLET,
      organization_name: "OtherAcademy",
      class_settings: null,
    });

    const cls = await IssuerClass.create({
      issuer_wallet_address: ISSUER_WALLET,
      name: "Pentest 101",
      topics: ["sql-injection"],
      is_active: true,
    });
    classId = cls.id;

    studentApp = buildApp(models, { role: "student", wallet: STUDENT_WALLET });
    issuerApp  = buildApp(models, { role: "issuer",  wallet: ISSUER_WALLET });
    issuer2App = buildApp(models, { role: "issuer",  wallet: ISSUER2_WALLET });
    publicApp  = buildApp(models, null);
  });

  afterAll(async () => { await sequelize.close(); });

  // -------------------------------------------------------------------------
  // POST / — student creates a class request
  // -------------------------------------------------------------------------

  describe("POST /", () => {
    test("returns 401 when not authenticated", async () => {
      const res = await request(publicApp).post("/api/class-requests").send(BASE_BODY);
      expect(res.status).toBe(401);
    });

    test("returns 403 when an educator tries to create a request", async () => {
      const res = await request(issuerApp).post("/api/class-requests").send(BASE_BODY);
      expect(res.status).toBe(403);
    });

    test("returns 400 when issuer_wallet_address is missing", async () => {
      const { issuer_wallet_address: _, ...body } = BASE_BODY;
      const res = await request(studentApp).post("/api/class-requests").send(body);
      expect(res.status).toBe(400);
    });

    test("returns 400 when requested_date is missing", async () => {
      const { requested_date: _, ...body } = BASE_BODY;
      const res = await request(studentApp).post("/api/class-requests").send(body);
      expect(res.status).toBe(400);
    });

    test("returns 400 when start_time is missing", async () => {
      const { start_time: _, ...body } = BASE_BODY;
      const res = await request(studentApp).post("/api/class-requests").send(body);
      expect(res.status).toBe(400);
    });

    test("returns 400 when duration_minutes is missing", async () => {
      const { duration_minutes: _, ...body } = BASE_BODY;
      const res = await request(studentApp).post("/api/class-requests").send(body);
      expect(res.status).toBe(400);
    });

    test.each([1, 15, 100, 61])("returns 400 for invalid duration %d", async (dur) => {
      const res = await request(studentApp).post("/api/class-requests").send({ ...BASE_BODY, duration_minutes: dur });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("INVALID_DURATION");
    });

    test.each(["30", "45", "60", "90", "120"])("accepts valid duration %s as string", async (dur) => {
      const res = await request(studentApp).post("/api/class-requests").send({ ...BASE_BODY, duration_minutes: dur });
      expect(res.status).toBe(201);
    });

    test("returns 400 for invalid time format (no colon)", async () => {
      const res = await request(studentApp).post("/api/class-requests").send({ ...BASE_BODY, start_time: "1000" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("INVALID_TIME_FORMAT");
    });

    test("returns 400 for invalid time format (single digit hour)", async () => {
      const res = await request(studentApp).post("/api/class-requests").send({ ...BASE_BODY, start_time: "9:00" });
      expect(res.status).toBe(400);
    });

    test("returns 400 for a past requested_date", async () => {
      const res = await request(studentApp).post("/api/class-requests").send({ ...BASE_BODY, requested_date: "2000-01-01" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("INVALID_OR_PAST_DATE");
    });

    test("returns 400 for an invalid date string", async () => {
      const res = await request(studentApp).post("/api/class-requests").send({ ...BASE_BODY, requested_date: "not-a-date" });
      expect(res.status).toBe(400);
    });

    test("returns 404 when the educator does not exist", async () => {
      const res = await request(studentApp).post("/api/class-requests").send({
        ...BASE_BODY,
        issuer_wallet_address: "0x" + "ee".repeat(20),
      });
      expect(res.status).toBe(404);
    });

    test("returns 404 when the educator exists but has no class_settings", async () => {
      const res = await request(studentApp).post("/api/class-requests").send({
        ...BASE_BODY,
        issuer_wallet_address: ISSUER2_WALLET,
      });
      expect(res.status).toBe(404);
    });

    test("creates a valid request and returns 201 with id and pending status", async () => {
      const res = await request(studentApp).post("/api/class-requests").send(BASE_BODY);
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe("pending");
    });

    test("stores a class_name snapshot when a valid issuer_class_id is provided", async () => {
      const res = await request(studentApp).post("/api/class-requests").send({
        ...BASE_BODY,
        issuer_class_id: classId,
      });
      expect(res.status).toBe(201);
      const saved = await ClassRequest.findByPk(res.body.id);
      expect(saved.class_name).toBe("Pentest 101");
      expect(saved.issuer_class_id).toBe(classId);
    });

    test("returns 400 when issuer_class_id belongs to a different educator", async () => {
      const otherClass = await IssuerClass.create({
        issuer_wallet_address: ISSUER2_WALLET,
        name: "Other Class",
        topics: [],
        is_active: true,
      });
      await Issuer.update(
        { class_settings: { hourly_rate_usd: 50, durations: [60] } },
        { where: { wallet_address: ISSUER2_WALLET } }
      );
      const res = await request(studentApp).post("/api/class-requests").send({
        ...BASE_BODY,
        issuer_wallet_address: ISSUER_WALLET,
        issuer_class_id: otherClass.id,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("CLASS_NOT_FOUND");
    });

    test("returns 400 when issuer_class_id refers to an inactive class", async () => {
      const inactive = await IssuerClass.create({
        issuer_wallet_address: ISSUER_WALLET,
        name: "Inactive Class",
        topics: [],
        is_active: false,
      });
      const res = await request(studentApp).post("/api/class-requests").send({
        ...BASE_BODY,
        issuer_class_id: inactive.id,
      });
      expect(res.status).toBe(400);
    });

    test("truncates student_message to 500 characters", async () => {
      const longMessage = "x".repeat(600);
      const res = await request(studentApp).post("/api/class-requests").send({
        ...BASE_BODY,
        student_message: longMessage,
      });
      expect(res.status).toBe(201);
      const saved = await ClassRequest.findByPk(res.body.id);
      expect(saved.student_message.length).toBe(500);
    });
  });

  // -------------------------------------------------------------------------
  // GET /mine — educator sees incoming requests
  // -------------------------------------------------------------------------

  describe("GET /mine", () => {
    beforeAll(async () => {
      await ClassRequest.create({
        student_wallet_address: STUDENT_WALLET,
        issuer_wallet_address: ISSUER_WALLET,
        requested_date: FUTURE_DATE,
        start_time: "14:00",
        duration_minutes: 60,
        status: "pending",
      });
    });

    test("returns 401 when not authenticated", async () => {
      const res = await request(publicApp).get("/api/class-requests/mine");
      expect(res.status).toBe(401);
    });

    test("returns 403 for a student", async () => {
      const res = await request(studentApp).get("/api/class-requests/mine");
      expect(res.status).toBe(403);
    });

    test("returns 200 with requests array for an educator", async () => {
      const res = await request(issuerApp).get("/api/class-requests/mine");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.requests)).toBe(true);
    });

    test("only returns requests addressed to the authenticated educator", async () => {
      const res = await request(issuer2App).get("/api/class-requests/mine");
      expect(res.status).toBe(200);
      res.body.requests.forEach((r) => {
        expect(r.issuer_wallet_address).not.toBeDefined();
      });
      expect(res.body.requests.every((r) => r.student_wallet !== ISSUER_WALLET)).toBe(true);
    });

    test("each request item has the expected shape", async () => {
      const res = await request(issuerApp).get("/api/class-requests/mine");
      expect(res.status).toBe(200);
      const r = res.body.requests[0];
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("requested_date");
      expect(r).toHaveProperty("start_time");
      expect(r).toHaveProperty("duration_minutes");
      expect(r).toHaveProperty("status");
    });
  });

  // -------------------------------------------------------------------------
  // PATCH /:id/status — educator confirms / cancels / completes
  // -------------------------------------------------------------------------

  describe("PATCH /:id/status", () => {
    let requestId;

    beforeAll(async () => {
      const cr = await ClassRequest.create({
        student_wallet_address: STUDENT_WALLET,
        issuer_wallet_address: ISSUER_WALLET,
        requested_date: FUTURE_DATE,
        start_time: "16:00",
        duration_minutes: 30,
        status: "pending",
      });
      requestId = cr.id;
    });

    test("returns 401 when not authenticated", async () => {
      const res = await request(publicApp).patch(`/api/class-requests/${requestId}/status`).send({ status: "confirmed" });
      expect(res.status).toBe(401);
    });

    test("returns 403 for a student", async () => {
      const res = await request(studentApp).patch(`/api/class-requests/${requestId}/status`).send({ status: "confirmed" });
      expect(res.status).toBe(403);
    });

    test.each(["pending", "approved", "denied", ""])("returns 400 for invalid status %s", async (s) => {
      const res = await request(issuerApp).patch(`/api/class-requests/${requestId}/status`).send({ status: s });
      expect(res.status).toBe(400);
    });

    test("returns 404 when trying to update another educator's request", async () => {
      const res = await request(issuer2App).patch(`/api/class-requests/${requestId}/status`).send({ status: "confirmed" });
      expect(res.status).toBe(404);
    });

    test("returns 404 for a non-existent request id", async () => {
      const res = await request(issuerApp).patch("/api/class-requests/999999/status").send({ status: "confirmed" });
      expect(res.status).toBe(404);
    });

    test.each(["confirmed", "cancelled", "completed"])("updates status to %s and returns 200", async (newStatus) => {
      const cr = await ClassRequest.create({
        student_wallet_address: STUDENT_WALLET,
        issuer_wallet_address: ISSUER_WALLET,
        requested_date: FUTURE_DATE,
        start_time: "09:00",
        duration_minutes: 45,
        status: "pending",
      });
      const res = await request(issuerApp)
        .patch(`/api/class-requests/${cr.id}/status`)
        .send({ status: newStatus });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(newStatus);
    });
  });
});
