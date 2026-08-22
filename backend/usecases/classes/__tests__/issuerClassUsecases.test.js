// Unit tests for createIssuerClass, updateIssuerClass, deleteIssuerClass,
// and updateClassRequestStatus use cases. No HTTP layer.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createIssuerClass } = require("../createIssuerClass");
const { updateIssuerClass } = require("../updateIssuerClass");
const { deleteIssuerClass } = require("../deleteIssuerClass");
const { updateClassRequestStatus } = require("../updateClassRequestStatus");

jest.setTimeout(15000);

const ISSUER  = "0x" + "aa".repeat(20);
const ISSUER2 = "0x" + "bb".repeat(20);
const STUDENT = "0x" + "cc".repeat(20);
const FUTURE  = "2030-12-31";

describe("IssuerClass use cases", () => {
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

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await User.create({ wallet_address: ISSUER,  role: "issuer",  nonce: nonce(), educator_approval_status: "approved" });
    await User.create({ wallet_address: ISSUER2, role: "issuer",  nonce: nonce(), educator_approval_status: "approved" });
    await User.create({ wallet_address: STUDENT, role: "student", nonce: nonce() });
    await Issuer.create({ wallet_address: ISSUER,  organization_name: "A" });
    await Issuer.create({ wallet_address: ISSUER2, organization_name: "B" });
  });

  afterAll(() => sequelize.close());

  // ── createIssuerClass ─────────────────────────────────────────────────────

  describe("createIssuerClass", () => {
    test("throws when models is missing", async () => {
      await expect(createIssuerClass({ issuerWallet: ISSUER })).rejects.toThrow(TypeError);
    });

    test("returns NAME_REQUIRED when name is empty", async () => {
      const r = await createIssuerClass({ models, issuerWallet: ISSUER, name: "   " });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("NAME_REQUIRED");
    });

    test("creates a class and returns data with id", async () => {
      const r = await createIssuerClass({ models, issuerWallet: ISSUER, name: "Web Hacking", topics: ["xss"] });
      expect(r.ok).toBe(true);
      expect(r.data.id).toBeDefined();
      expect(r.data.name).toBe("Web Hacking");
      expect(r.data.is_active).toBe(true);
    });

    test("caps topics at 10", async () => {
      const topics = Array.from({ length: 15 }, (_, i) => `t${i}`);
      const r = await createIssuerClass({ models, issuerWallet: ISSUER, name: "Many Topics", topics });
      expect(r.ok).toBe(true);
      expect(r.data.topics.length).toBe(10);
    });

    test("returns MAX_CLASSES_REACHED when issuer already has 20", async () => {
      const wallet = "0x" + "ff".repeat(20);
      await models.User.create({ wallet_address: wallet, role: "issuer", nonce: crypto.randomBytes(16).toString("hex"), educator_approval_status: "approved" });
      await models.Issuer.create({ wallet_address: wallet, organization_name: "Full" });
      for (let i = 0; i < 20; i++) {
        await models.IssuerClass.create({ issuer_wallet_address: wallet, name: `C${i}`, topics: [] });
      }
      const r = await createIssuerClass({ models, issuerWallet: wallet, name: "One Too Many" });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("MAX_CLASSES_REACHED");
    });

    // SECURITY: an educator pending/rejected by admin review must not be able
    // to build out a class catalog — same gate as requestClass.js.
    describe("educator approval gate", () => {
      const makeIssuer = async (wallet, status) => {
        await models.User.create({ wallet_address: wallet, role: "issuer", nonce: crypto.randomBytes(16).toString("hex"), educator_approval_status: status });
        await models.Issuer.create({ wallet_address: wallet, organization_name: "PendingAcademy" });
      };

      test("returns EDUCATOR_NOT_APPROVED when status is pending_approval", async () => {
        const wallet = "0x" + "11".repeat(20);
        await makeIssuer(wallet, "pending_approval");
        const r = await createIssuerClass({ models, issuerWallet: wallet, name: "Sneaky Class" });
        expect(r.ok).toBe(false);
        expect(r.code).toBe("EDUCATOR_NOT_APPROVED");
        expect(r.httpStatus).toBe(403);
      });

      test("returns EDUCATOR_NOT_APPROVED when status is rejected", async () => {
        const wallet = "0x" + "22".repeat(20);
        await makeIssuer(wallet, "rejected");
        const r = await createIssuerClass({ models, issuerWallet: wallet, name: "Sneaky Class" });
        expect(r.ok).toBe(false);
        expect(r.code).toBe("EDUCATOR_NOT_APPROVED");
      });

      test("returns EDUCATOR_NOT_APPROVED when status is null", async () => {
        const wallet = "0x" + "33".repeat(20);
        await makeIssuer(wallet, null);
        const r = await createIssuerClass({ models, issuerWallet: wallet, name: "Sneaky Class" });
        expect(r.ok).toBe(false);
        expect(r.code).toBe("EDUCATOR_NOT_APPROVED");
      });

      test("does not create a row when the educator is not approved", async () => {
        const wallet = "0x" + "44".repeat(20);
        await makeIssuer(wallet, "pending_approval");
        await createIssuerClass({ models, issuerWallet: wallet, name: "Sneaky Class" });
        const count = await models.IssuerClass.count({ where: { issuer_wallet_address: wallet } });
        expect(count).toBe(0);
      });
    });
  });

  // ── updateIssuerClass ─────────────────────────────────────────────────────

  describe("updateIssuerClass", () => {
    let classId;

    beforeAll(async () => {
      const cls = await models.IssuerClass.create({ issuer_wallet_address: ISSUER, name: "Original", topics: ["t1"], is_active: true });
      classId = cls.id;
    });

    test("returns CLASS_NOT_FOUND when class belongs to another educator", async () => {
      const r = await updateIssuerClass({ models, classId, issuerWallet: ISSUER2, updates: { name: "Stolen" } });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("CLASS_NOT_FOUND");
    });

    test("returns NAME_CANNOT_BE_EMPTY when name is set to empty string", async () => {
      const r = await updateIssuerClass({ models, classId, issuerWallet: ISSUER, updates: { name: "" } });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("NAME_CANNOT_BE_EMPTY");
    });

    test("updates name successfully", async () => {
      const r = await updateIssuerClass({ models, classId, issuerWallet: ISSUER, updates: { name: "Updated" } });
      expect(r.ok).toBe(true);
      expect(r.data.name).toBe("Updated");
    });

    test("toggles is_active to false", async () => {
      const r = await updateIssuerClass({ models, classId, issuerWallet: ISSUER, updates: { is_active: false } });
      expect(r.ok).toBe(true);
      expect(r.data.is_active).toBe(false);
    });

    test("partial update does not overwrite unspecified fields", async () => {
      const r = await updateIssuerClass({ models, classId, issuerWallet: ISSUER, updates: { description: "New desc" } });
      expect(r.ok).toBe(true);
      expect(r.data.name).toBe("Updated");
    });

    // SECURITY: an educator pending/rejected by admin review must not be able
    // to edit their class catalog — same gate as createIssuerClass.
    describe("educator approval gate", () => {
      let pendingClassId;
      const PENDING = "0x" + "55".repeat(20);

      beforeAll(async () => {
        await models.User.create({ wallet_address: PENDING, role: "issuer", nonce: crypto.randomBytes(16).toString("hex"), educator_approval_status: "pending_approval" });
        await models.Issuer.create({ wallet_address: PENDING, organization_name: "PendingAcademy" });
        const cls = await models.IssuerClass.create({ issuer_wallet_address: PENDING, name: "Pending Class", topics: [] });
        pendingClassId = cls.id;
      });

      test("returns EDUCATOR_NOT_APPROVED when the owner is not approved", async () => {
        const r = await updateIssuerClass({ models, classId: pendingClassId, issuerWallet: PENDING, updates: { name: "Changed" } });
        expect(r.ok).toBe(false);
        expect(r.code).toBe("EDUCATOR_NOT_APPROVED");
        expect(r.httpStatus).toBe(403);
      });

      test("does not persist the change when the owner is not approved", async () => {
        await updateIssuerClass({ models, classId: pendingClassId, issuerWallet: PENDING, updates: { name: "Changed" } });
        const record = await models.IssuerClass.findByPk(pendingClassId);
        expect(record.name).toBe("Pending Class");
      });

      test("allows the update once the educator is approved", async () => {
        await models.User.update({ educator_approval_status: "approved" }, { where: { wallet_address: PENDING } });
        const r = await updateIssuerClass({ models, classId: pendingClassId, issuerWallet: PENDING, updates: { name: "Changed" } });
        expect(r.ok).toBe(true);
        expect(r.data.name).toBe("Changed");
      });
    });
  });

  // ── deleteIssuerClass ─────────────────────────────────────────────────────

  describe("deleteIssuerClass", () => {
    let classId;

    beforeAll(async () => {
      const cls = await models.IssuerClass.create({ issuer_wallet_address: ISSUER, name: "To Delete", topics: [] });
      classId = cls.id;
    });

    test("returns CLASS_NOT_FOUND when class belongs to another educator", async () => {
      const r = await deleteIssuerClass({ models, classId, issuerWallet: ISSUER2 });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("CLASS_NOT_FOUND");
    });

    test("deletes the class and confirms it no longer exists", async () => {
      const r = await deleteIssuerClass({ models, classId, issuerWallet: ISSUER });
      expect(r.ok).toBe(true);
      const gone = await models.IssuerClass.findByPk(classId);
      expect(gone).toBeNull();
    });

    test("returns CLASS_NOT_FOUND for already deleted class", async () => {
      const r = await deleteIssuerClass({ models, classId, issuerWallet: ISSUER });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("CLASS_NOT_FOUND");
    });
  });

  // ── updateClassRequestStatus ──────────────────────────────────────────────

  describe("updateClassRequestStatus", () => {
    let requestId;

    beforeAll(async () => {
      const cr = await models.ClassRequest.create({
        student_wallet_address: STUDENT,
        issuer_wallet_address: ISSUER,
        requested_date: FUTURE,
        start_time: "10:00",
        duration_minutes: 60,
        status: "pending",
      });
      requestId = cr.id;
    });

    test("returns INVALID_STATUS for unknown statuses", async () => {
      for (const s of ["pending", "approved", ""]) {
        const r = await updateClassRequestStatus({ models, requestId, issuerWallet: ISSUER, status: s });
        expect(r.ok).toBe(false);
        expect(r.code).toBe("INVALID_STATUS");
      }
    });

    test("returns REQUEST_NOT_FOUND when request belongs to another educator", async () => {
      const r = await updateClassRequestStatus({ models, requestId, issuerWallet: ISSUER2, status: "confirmed" });
      expect(r.ok).toBe(false);
      expect(r.code).toBe("REQUEST_NOT_FOUND");
    });

    test.each(["confirmed", "cancelled", "completed"])("updates status to %s", async (status) => {
      const cr = await models.ClassRequest.create({
        student_wallet_address: STUDENT,
        issuer_wallet_address: ISSUER,
        requested_date: FUTURE,
        start_time: "11:00",
        duration_minutes: 30,
        status: "pending",
      });
      const r = await updateClassRequestStatus({ models, requestId: cr.id, issuerWallet: ISSUER, status });
      expect(r.ok).toBe(true);
      expect(r.data.status).toBe(status);
    });
  });
});
