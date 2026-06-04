// backend/harjoot/usecases/__tests__/educatorApproval.test.js
//
// Unit tests for the Section 2.5 approve/reject use cases. SQLite in-memory
// for the real Sequelize update path; a jest-mocked emailService captures the
// side-effect calls without sending anything.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { approveEducator } = require("../approveEducator");
const { rejectEducator } = require("../rejectEducator");

jest.setTimeout(10000);

describe("Educator approval use cases", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, UserSession, Certificate;
  let models;
  let emailService;

  const ISSUER_WALLET = "0x1111111111111111111111111111111111111111";
  const STUDENT_WALLET = "0x2222222222222222222222222222222222222222";

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

    const allModels = { User, Student, Issuer, Recruiter, UserSession, Certificate };
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
    emailService = {
      notifyEducatorApproved: jest.fn().mockResolvedValue(undefined),
      notifyEducatorRejected: jest.fn().mockResolvedValue(undefined),
    };
  });

  async function makeIssuer({ id, email = "edu@example.com", status = "pending_approval", rejection_reason = null }) {
    const user = await User.create({
      id,
      wallet_address: ISSUER_WALLET,
      role: "issuer",
      name: "Edu",
      lastname: "Cator",
      email,
      nonce: crypto.randomBytes(16).toString("hex"),
      educator_approval_status: status,
      rejection_reason,
    });
    await Issuer.create({ wallet_address: ISSUER_WALLET, organization_name: "Cyber Academy" });
    return user;
  }

  async function makeStudent({ id }) {
    const user = await User.create({
      id,
      wallet_address: STUDENT_WALLET,
      role: "student",
      name: "Sty",
      email: "s@example.com",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await Student.create({ wallet_address: STUDENT_WALLET });
    return user;
  }

  // ===========================================================================
  // approveEducator
  // ===========================================================================

  describe("approveEducator", () => {
    test("on success updates educator_approval_status='approved' + approved_at + approved_by", async () => {
      const user = await makeIssuer({ id: 100 });
      const result = await approveEducator({ models, emailService, userId: 100, adminId: 1 });

      expect(result.ok).toBe(true);
      expect(result.user).toMatchObject({ id: 100, status: "approved" });

      const reloaded = await User.findByPk(100);
      expect(reloaded.educator_approval_status).toBe("approved");
      expect(reloaded.approved_at).toBeInstanceOf(Date);
      expect(reloaded.approved_by).toBe(1);
    });

    test("on success clears any previous rejection_reason", async () => {
      await makeIssuer({ id: 101, status: "rejected", rejection_reason: "old reason" });

      await approveEducator({ models, emailService, userId: 101, adminId: 1 });

      const reloaded = await User.findByPk(101);
      expect(reloaded.rejection_reason).toBeNull();
    });

    test("triggers emailService.notifyEducatorApproved with the user's email and name", async () => {
      await makeIssuer({ id: 102, email: "to@example.com" });

      await approveEducator({ models, emailService, userId: 102, adminId: 1 });

      expect(emailService.notifyEducatorApproved).toHaveBeenCalledTimes(1);
      expect(emailService.notifyEducatorApproved).toHaveBeenCalledWith({
        to: "to@example.com",
        name: "Edu",
      });
    });

    test("DOES NOT undo the DB update when the email throws", async () => {
      await makeIssuer({ id: 103 });
      emailService.notifyEducatorApproved.mockRejectedValue(new Error("Resend down"));

      const result = await approveEducator({ models, emailService, userId: 103, adminId: 1 });

      expect(result.ok).toBe(true); // approval succeeded despite email failure
      const reloaded = await User.findByPk(103);
      expect(reloaded.educator_approval_status).toBe("approved");
    });

    test("rejects USER_NOT_FOUND when the id does not exist", async () => {
      const result = await approveEducator({ models, emailService, userId: 9999, adminId: 1 });
      expect(result).toEqual({ ok: false, reason: "USER_NOT_FOUND" });
      expect(emailService.notifyEducatorApproved).not.toHaveBeenCalled();
    });

    test("rejects NOT_AN_ISSUER when the user is a student", async () => {
      await makeStudent({ id: 104 });
      const result = await approveEducator({ models, emailService, userId: 104, adminId: 1 });
      expect(result).toEqual({ ok: false, reason: "NOT_AN_ISSUER" });
    });

    test("rejects ALREADY_APPROVED when status is already 'approved'", async () => {
      await makeIssuer({ id: 105, status: "approved" });
      const result = await approveEducator({ models, emailService, userId: 105, adminId: 1 });
      expect(result).toEqual({ ok: false, reason: "ALREADY_APPROVED" });
    });

    test("throws TypeError on missing dependencies (programmer bug)", async () => {
      await expect(approveEducator({ emailService, userId: 1, adminId: 1 })).rejects.toThrow(TypeError);
      await expect(approveEducator({ models, userId: 1, adminId: 1 })).rejects.toThrow(TypeError);
    });
  });

  // ===========================================================================
  // rejectEducator
  // ===========================================================================

  describe("rejectEducator", () => {
    test("on success sets status='rejected' + rejection_reason (trimmed)", async () => {
      await makeIssuer({ id: 200 });
      const result = await rejectEducator({
        models,
        emailService,
        userId: 200,
        adminId: 1,
        reason: "   KYC docs incomplete   ",
      });

      expect(result.ok).toBe(true);
      expect(result.user).toMatchObject({ id: 200, status: "rejected", rejection_reason: "KYC docs incomplete" });

      const reloaded = await User.findByPk(200);
      expect(reloaded.educator_approval_status).toBe("rejected");
      expect(reloaded.rejection_reason).toBe("KYC docs incomplete");
    });

    test("triggers emailService.notifyEducatorRejected with to + name + reason", async () => {
      await makeIssuer({ id: 201, email: "x@example.com" });

      await rejectEducator({ models, emailService, userId: 201, adminId: 1, reason: "Bad docs" });

      expect(emailService.notifyEducatorRejected).toHaveBeenCalledTimes(1);
      expect(emailService.notifyEducatorRejected).toHaveBeenCalledWith({
        to: "x@example.com",
        name: "Edu",
        reason: "Bad docs",
      });
    });

    test("clears any previous approved_at / approved_by so the row is consistent", async () => {
      await makeIssuer({ id: 202 });
      // Pretend they were previously approved
      await User.update(
        { educator_approval_status: "approved", approved_at: new Date(), approved_by: 999 },
        { where: { id: 202 } },
      );

      await rejectEducator({ models, emailService, userId: 202, adminId: 1, reason: "Misconduct" });

      const reloaded = await User.findByPk(202);
      expect(reloaded.educator_approval_status).toBe("rejected");
      expect(reloaded.approved_at).toBeNull();
      expect(reloaded.approved_by).toBeNull();
    });

    test("rejects USER_NOT_FOUND when the id does not exist", async () => {
      const result = await rejectEducator({
        models,
        emailService,
        userId: 9999,
        adminId: 1,
        reason: "Some reason",
      });
      expect(result).toEqual({ ok: false, reason: "USER_NOT_FOUND" });
      expect(emailService.notifyEducatorRejected).not.toHaveBeenCalled();
    });

    test("rejects NOT_AN_ISSUER when the user is not an issuer", async () => {
      await makeStudent({ id: 203 });
      const result = await rejectEducator({
        models,
        emailService,
        userId: 203,
        adminId: 1,
        reason: "Not eligible",
      });
      expect(result).toEqual({ ok: false, reason: "NOT_AN_ISSUER" });
    });

    test("throws TypeError when reason is missing or blank", async () => {
      await expect(
        rejectEducator({ models, emailService, userId: 1, adminId: 1 }),
      ).rejects.toThrow(TypeError);
      await expect(
        rejectEducator({ models, emailService, userId: 1, adminId: 1, reason: "   " }),
      ).rejects.toThrow(TypeError);
      await expect(
        rejectEducator({ models, emailService, userId: 1, adminId: 1, reason: 123 }),
      ).rejects.toThrow(TypeError);
    });
  });
});
