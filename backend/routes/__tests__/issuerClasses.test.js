// backend/routes/__tests__/issuerClasses.test.js
//
// Validation and security tests for all /api/issuer-classes endpoints.
// Uses SQLite in-memory. Auth middleware is mocked to inject req.auth.

const request    = require("supertest");
const express    = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const crypto     = require("crypto");

jest.setTimeout(20000);
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const ISSUER_WALLET  = "0x" + "aa".repeat(20);
const ISSUER2_WALLET = "0x" + "bb".repeat(20);
const STUDENT_WALLET = "0x" + "cc".repeat(20);

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
    const route = require("../issuerClasses");
    app = express();
    app.use(bodyParser.json());
    app.use("/api/issuer-classes", route);
  });
  return app;
}

describe("IssuerClasses endpoints", () => {
  let sequelize, IssuerClass, Issuer, User;
  let models;
  let issuerApp, issuer2App, studentApp, publicApp;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;

    User         = require("../../models/users")(sequelize, DataTypes);
    Issuer       = require("../../models/issuers")(sequelize, DataTypes);
    IssuerClass  = require("../../models/issuerClasses")(sequelize, DataTypes);
    const Student     = require("../../models/students")(sequelize, DataTypes);
    const Recruiter   = require("../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../models/userSessions")(sequelize, DataTypes);
    const ClassRequestModel = require("../../models/classRequests")(sequelize, DataTypes);

    models = {
      User, Issuer, IssuerClass,
      Student, Recruiter, Certificate, UserSession,
      ClassRequest: ClassRequestModel,
      sequelize, Sequelize: SequelizePkg,
    };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));

    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await User.create({ wallet_address: ISSUER_WALLET,  role: "issuer",   name: "Prof A", nonce: nonce() });
    await User.create({ wallet_address: ISSUER2_WALLET, role: "issuer",   name: "Prof B", nonce: nonce() });
    await User.create({ wallet_address: STUDENT_WALLET, role: "student",  name: "Stu",    nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER_WALLET,  organization_name: "Academy A" });
    await Issuer.create({ wallet_address: ISSUER2_WALLET, organization_name: "Academy B" });

    issuerApp  = buildApp(models, { role: "issuer",  wallet: ISSUER_WALLET });
    issuer2App = buildApp(models, { role: "issuer",  wallet: ISSUER2_WALLET });
    studentApp = buildApp(models, { role: "student", wallet: STUDENT_WALLET });
    publicApp  = buildApp(models, null);
  });

  afterAll(async () => { await sequelize.close(); });

  // -------------------------------------------------------------------------
  // GET /by-wallet/:wallet — public
  // -------------------------------------------------------------------------

  describe("GET /by-wallet/:wallet", () => {
    let activeId, inactiveId;

    beforeAll(async () => {
      const a = await IssuerClass.create({ issuer_wallet_address: ISSUER_WALLET, name: "Pentest 101", topics: ["sql-injection"], is_active: true });
      const b = await IssuerClass.create({ issuer_wallet_address: ISSUER_WALLET, name: "Hidden",      topics: [],              is_active: false });
      activeId   = a.id;
      inactiveId = b.id;
    });

    test("returns only active classes for a given wallet", async () => {
      const res = await request(publicApp).get(`/api/issuer-classes/by-wallet/${ISSUER_WALLET}`);
      expect(res.status).toBe(200);
      expect(res.body.classes).toBeDefined();
      const ids = res.body.classes.map((c) => c.id);
      expect(ids).toContain(activeId);
      expect(ids).not.toContain(inactiveId);
    });

    test("does not require authentication", async () => {
      const res = await request(publicApp).get(`/api/issuer-classes/by-wallet/${ISSUER_WALLET}`);
      expect(res.status).toBe(200);
    });

    test("returns empty array for a wallet with no classes", async () => {
      const res = await request(publicApp).get(`/api/issuer-classes/by-wallet/${ISSUER2_WALLET}`);
      expect(res.status).toBe(200);
      expect(res.body.classes).toEqual([]);
    });

    test("does not expose is_active field", async () => {
      const res = await request(publicApp).get(`/api/issuer-classes/by-wallet/${ISSUER_WALLET}`);
      res.body.classes.forEach((c) => {
        expect(c).not.toHaveProperty("is_active");
      });
    });
  });

  // -------------------------------------------------------------------------
  // GET /mine — authenticated educator
  // -------------------------------------------------------------------------

  describe("GET /mine", () => {
    test("returns 401 when not authenticated", async () => {
      const res = await request(publicApp).get("/api/issuer-classes/mine");
      expect(res.status).toBe(401);
    });

    test("returns 403 for a student", async () => {
      const res = await request(studentApp).get("/api/issuer-classes/mine");
      expect(res.status).toBe(403);
    });

    test("returns all classes including inactive for the authenticated issuer", async () => {
      const res = await request(issuerApp).get("/api/issuer-classes/mine");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.classes)).toBe(true);
      const hasInactive = res.body.classes.some((c) => c.is_active === false);
      expect(hasInactive).toBe(true);
    });

    test("does not return classes belonging to other educators", async () => {
      const res = await request(issuer2App).get("/api/issuer-classes/mine");
      expect(res.status).toBe(200);
      const wallets = new Set(res.body.classes.map((c) => c.issuer_wallet_address).filter(Boolean));
      wallets.forEach((w) => expect(w).toBe(ISSUER2_WALLET));
    });
  });

  // -------------------------------------------------------------------------
  // POST / — create class
  // -------------------------------------------------------------------------

  describe("POST /", () => {
    test("returns 403 for a student", async () => {
      const res = await request(studentApp).post("/api/issuer-classes").send({ name: "X" });
      expect(res.status).toBe(403);
    });

    test("returns 400 when name is missing", async () => {
      const res = await request(issuerApp).post("/api/issuer-classes").send({ description: "No name here" });
      expect(res.status).toBe(400);
    });

    test("returns 400 when name is an empty string", async () => {
      const res = await request(issuerApp).post("/api/issuer-classes").send({ name: "   " });
      expect(res.status).toBe(400);
    });

    test("creates a class and returns 201 with id and fields", async () => {
      const res = await request(issuer2App).post("/api/issuer-classes").send({
        name: "Web Hacking",
        description: "Learn XSS and more",
        topics: ["xss", "csrf"],
      });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("Web Hacking");
      expect(res.body.topics).toEqual(["xss", "csrf"]);
      expect(res.body.is_active).toBe(true);
    });

    test("caps topics at 10 entries and does not error", async () => {
      const topics = Array.from({ length: 15 }, (_, i) => `topic-${i}`);
      const res = await request(issuerApp).post("/api/issuer-classes").send({ name: "Many Topics", topics });
      expect(res.status).toBe(201);
      expect(res.body.topics.length).toBe(10);
    });

    test("returns 400 when the educator already has 20 classes", async () => {
      const wallet = "0x" + "ff".repeat(20);
      await User.create({ wallet_address: wallet, role: "issuer", name: "Full", nonce: crypto.randomBytes(16).toString("hex") });
      await Issuer.create({ wallet_address: wallet, organization_name: "Full Academy" });
      for (let i = 0; i < 20; i++) {
        await IssuerClass.create({ issuer_wallet_address: wallet, name: `Class ${i}`, topics: [] });
      }
      const fullApp = buildApp(models, { role: "issuer", wallet });
      const res = await request(fullApp).post("/api/issuer-classes").send({ name: "One Too Many" });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/20/);
    });
  });

  // -------------------------------------------------------------------------
  // PATCH /:id — update class
  // -------------------------------------------------------------------------

  describe("PATCH /:id", () => {
    let classId;

    beforeAll(async () => {
      const cls = await IssuerClass.create({
        issuer_wallet_address: ISSUER_WALLET,
        name: "Original Name",
        topics: ["original-topic"],
        is_active: true,
      });
      classId = cls.id;
    });

    test("returns 403 for a student", async () => {
      const res = await request(studentApp).patch(`/api/issuer-classes/${classId}`).send({ name: "X" });
      expect(res.status).toBe(403);
    });

    test("returns 404 when trying to update another educator's class", async () => {
      const res = await request(issuer2App).patch(`/api/issuer-classes/${classId}`).send({ name: "Stolen" });
      expect(res.status).toBe(404);
    });

    test("returns 400 when name is set to empty string", async () => {
      const res = await request(issuerApp).patch(`/api/issuer-classes/${classId}`).send({ name: "" });
      expect(res.status).toBe(400);
    });

    test("updates name and returns updated fields", async () => {
      const res = await request(issuerApp).patch(`/api/issuer-classes/${classId}`).send({ name: "Updated Name" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
    });

    test("toggles is_active to false (deactivate)", async () => {
      const res = await request(issuerApp).patch(`/api/issuer-classes/${classId}`).send({ is_active: false });
      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(false);
    });

    test("partial update does not overwrite unspecified fields", async () => {
      const res = await request(issuerApp).patch(`/api/issuer-classes/${classId}`).send({ description: "New desc" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
    });
  });

  // -------------------------------------------------------------------------
  // DELETE /:id — delete class
  // -------------------------------------------------------------------------

  describe("DELETE /:id", () => {
    let toDeleteId;

    beforeAll(async () => {
      const cls = await IssuerClass.create({
        issuer_wallet_address: ISSUER_WALLET,
        name: "To Be Deleted",
        topics: [],
      });
      toDeleteId = cls.id;
    });

    test("returns 403 for a student", async () => {
      const res = await request(studentApp).delete(`/api/issuer-classes/${toDeleteId}`);
      expect(res.status).toBe(403);
    });

    test("returns 404 when trying to delete another educator's class", async () => {
      const res = await request(issuer2App).delete(`/api/issuer-classes/${toDeleteId}`);
      expect(res.status).toBe(404);
    });

    test("returns 204 and removes the class when the owner deletes it", async () => {
      const res = await request(issuerApp).delete(`/api/issuer-classes/${toDeleteId}`);
      expect(res.status).toBe(204);
      const gone = await IssuerClass.findByPk(toDeleteId);
      expect(gone).toBeNull();
    });

    test("returns 404 for a class that does not exist", async () => {
      const res = await request(issuerApp).delete("/api/issuer-classes/999999");
      expect(res.status).toBe(404);
    });
  });
});
