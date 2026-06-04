// backend/harjoot/usecases/__tests__/talentInvitation.test.js
//
// Unit tests for the Section 5 invitation flow. SQLite in-memory exercises
// the real Sequelize persistence path; emailService is mocked so we can
// inspect the side effects without actually sending mail.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { inviteTalent } = require("../inviteTalent");
const { claimInvitation } = require("../claimInvitation");

jest.setTimeout(10000);

describe("Section 5 talent invitation use cases", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, UserSession, Certificate, TalentInvitation;
  let models;
  let emailService;

  const ISSUER_WALLET = "0x1111111111111111111111111111111111111111";
  const ISSUER_WALLET_2 = "0x3333333333333333333333333333333333333333";
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
    TalentInvitation = require("../../../models/talentInvitations")(sequelize, DataTypes);

    const allModels = { User, Student, Issuer, Recruiter, UserSession, Certificate, TalentInvitation };
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
      sendInvite: jest.fn().mockResolvedValue(undefined),
      notifyEducatorClaimed: jest.fn().mockResolvedValue(undefined),
    };
  });

  async function makeApprovedIssuer({ id, wallet = ISSUER_WALLET, email = "edu@example.com", name = "Edu" }) {
    const user = await User.create({
      id,
      wallet_address: wallet,
      role: "issuer",
      name,
      email,
      nonce: crypto.randomBytes(16).toString("hex"),
      educator_approval_status: "approved",
    });
    await Issuer.create({ wallet_address: wallet, organization_name: "Acme Academy" });
    return user;
  }

  // ===========================================================================
  // inviteTalent
  // ===========================================================================

  describe("inviteTalent", () => {
    test("creates a pending talent_invitations row (lowercased wallet + email)", async () => {
      const educator = await makeApprovedIssuer({ id: 1 });

      const result = await inviteTalent({
        models,
        emailService,
        educator,
        studentWallet: "0xABCDEF1111111111111111111111111111111111",
        email: "Talent@Example.com",
      });

      expect(result.ok).toBe(true);
      expect(result.invitation.educator_user_id).toBe(1);
      expect(result.invitation.student_wallet_address).toBe("0xabcdef1111111111111111111111111111111111");
      expect(result.invitation.email).toBe("talent@example.com");
      expect(result.invitation.status).toBe("pending");
    });

    test("triggers emailService.sendInvite with to + wallet + educator name + message", async () => {
      const educator = await makeApprovedIssuer({ id: 2, name: "Sofia" });

      await inviteTalent({
        models,
        emailService,
        educator,
        studentWallet: STUDENT_WALLET,
        email: "t@example.com",
        message: "  Curso de fundamentos  ",
      });

      expect(emailService.sendInvite).toHaveBeenCalledTimes(1);
      expect(emailService.sendInvite).toHaveBeenCalledWith({
        to: "t@example.com",
        walletAddress: STUDENT_WALLET,
        educatorName: "Sofia",
        message: "Curso de fundamentos", // trimmed
      });
    });

    test("dedupes: a second call for the same educator+wallet does NOT create a duplicate row", async () => {
      const educator = await makeApprovedIssuer({ id: 3 });

      const first = await inviteTalent({
        models,
        emailService,
        educator,
        studentWallet: STUDENT_WALLET,
        email: "t@example.com",
      });
      const second = await inviteTalent({
        models,
        emailService,
        educator,
        studentWallet: STUDENT_WALLET,
        email: "t@example.com",
      });

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(false);
      expect(second.reason).toBe("INVITE_ALREADY_PENDING");
      expect(emailService.sendInvite).toHaveBeenCalledTimes(1); // no second email

      const count = await TalentInvitation.count({
        where: { educator_user_id: 3, student_wallet_address: STUDENT_WALLET },
      });
      expect(count).toBe(1);
    });

    test("DOES NOT undo the invitation row when the email throws", async () => {
      const educator = await makeApprovedIssuer({ id: 4 });
      emailService.sendInvite.mockRejectedValue(new Error("Resend down"));

      const result = await inviteTalent({
        models,
        emailService,
        educator,
        studentWallet: STUDENT_WALLET,
        email: "t@example.com",
      });

      expect(result.ok).toBe(true);
      const persisted = await TalentInvitation.findByPk(result.invitation.id);
      expect(persisted).not.toBeNull();
      expect(persisted.status).toBe("pending");
    });

    test("throws TypeError on missing dependencies", async () => {
      const educator = await makeApprovedIssuer({ id: 5 });
      await expect(
        inviteTalent({ emailService, educator, studentWallet: STUDENT_WALLET, email: "t@x.com" }),
      ).rejects.toThrow(TypeError);
      await expect(
        inviteTalent({ models, educator, studentWallet: STUDENT_WALLET, email: "t@x.com" }),
      ).rejects.toThrow(TypeError);
      await expect(
        inviteTalent({ models, emailService, studentWallet: STUDENT_WALLET, email: "t@x.com" }),
      ).rejects.toThrow(TypeError);
    });

    test("throws TypeError on blank wallet or email", async () => {
      const educator = await makeApprovedIssuer({ id: 6 });
      await expect(
        inviteTalent({ models, emailService, educator, studentWallet: "   ", email: "t@x.com" }),
      ).rejects.toThrow(TypeError);
      await expect(
        inviteTalent({ models, emailService, educator, studentWallet: STUDENT_WALLET, email: "  " }),
      ).rejects.toThrow(TypeError);
    });
  });

  // ===========================================================================
  // claimInvitation
  // ===========================================================================

  describe("claimInvitation", () => {
    test("no pending invitation → fast no-op, returns counts=0", async () => {
      const result = await claimInvitation({
        models,
        emailService,
        studentWallet: STUDENT_WALLET,
      });

      expect(result).toEqual({ ok: true, claimedCount: 0, notifiedCount: 0 });
      expect(emailService.notifyEducatorClaimed).not.toHaveBeenCalled();
    });

    test("a single pending invitation is marked claimed and the educator is notified", async () => {
      const educator = await makeApprovedIssuer({ id: 10, email: "edu@x.com", name: "Sofia" });
      await TalentInvitation.create({
        educator_user_id: 10,
        student_wallet_address: STUDENT_WALLET,
        email: "t@x.com",
        status: "pending",
      });

      const result = await claimInvitation({
        models,
        emailService,
        studentWallet: STUDENT_WALLET,
        studentUser: { name: "Sty" },
      });

      expect(result.ok).toBe(true);
      expect(result.claimedCount).toBe(1);
      expect(result.notifiedCount).toBe(1);

      const reloaded = await TalentInvitation.findOne({ where: { educator_user_id: 10 } });
      expect(reloaded.status).toBe("claimed");
      expect(reloaded.claimed_at).toBeInstanceOf(Date);

      expect(emailService.notifyEducatorClaimed).toHaveBeenCalledWith({
        to: "edu@x.com",
        educatorName: "Sofia",
        studentWallet: STUDENT_WALLET,
        studentName: "Sty",
      });
    });

    test("multiple pending invitations from different educators are ALL claimed and notified", async () => {
      const eduA = await makeApprovedIssuer({ id: 20, wallet: ISSUER_WALLET, email: "a@x.com", name: "A" });
      const eduB = await makeApprovedIssuer({ id: 21, wallet: ISSUER_WALLET_2, email: "b@x.com", name: "B" });
      await TalentInvitation.create({
        educator_user_id: eduA.id,
        student_wallet_address: STUDENT_WALLET,
        email: "t@x.com",
        status: "pending",
      });
      await TalentInvitation.create({
        educator_user_id: eduB.id,
        student_wallet_address: STUDENT_WALLET,
        email: "t@x.com",
        status: "pending",
      });

      const result = await claimInvitation({
        models,
        emailService,
        studentWallet: STUDENT_WALLET,
      });

      expect(result.claimedCount).toBe(2);
      expect(result.notifiedCount).toBe(2);
      const stillPending = await TalentInvitation.count({
        where: { student_wallet_address: STUDENT_WALLET, status: "pending" },
      });
      expect(stillPending).toBe(0);
    });

    test("invitation is claimed even when the educator notification email throws", async () => {
      await makeApprovedIssuer({ id: 30 });
      await TalentInvitation.create({
        educator_user_id: 30,
        student_wallet_address: STUDENT_WALLET,
        email: "t@x.com",
        status: "pending",
      });
      emailService.notifyEducatorClaimed.mockRejectedValue(new Error("Resend down"));

      const result = await claimInvitation({
        models,
        emailService,
        studentWallet: STUDENT_WALLET,
      });

      expect(result.claimedCount).toBe(1);
      expect(result.notifiedCount).toBe(0); // email failed but claim succeeded

      const reloaded = await TalentInvitation.findOne({ where: { educator_user_id: 30 } });
      expect(reloaded.status).toBe("claimed");
    });

    test("educator without an email on file: invitation claimed, notification skipped", async () => {
      // Create educator WITHOUT an email
      const educator = await User.create({
        id: 40,
        wallet_address: ISSUER_WALLET,
        role: "issuer",
        name: "Anon",
        nonce: crypto.randomBytes(16).toString("hex"),
        educator_approval_status: "approved",
        // email omitted (nullable)
      });
      await Issuer.create({ wallet_address: ISSUER_WALLET, organization_name: "Acme" });
      await TalentInvitation.create({
        educator_user_id: educator.id,
        student_wallet_address: STUDENT_WALLET,
        email: "t@x.com",
        status: "pending",
      });

      const result = await claimInvitation({
        models,
        emailService,
        studentWallet: STUDENT_WALLET,
      });

      expect(result.claimedCount).toBe(1);
      expect(result.notifiedCount).toBe(0);
      expect(emailService.notifyEducatorClaimed).not.toHaveBeenCalled();
    });

    test("throws TypeError on missing dependencies", async () => {
      await expect(
        claimInvitation({ emailService, studentWallet: STUDENT_WALLET }),
      ).rejects.toThrow(TypeError);
      await expect(
        claimInvitation({ models, studentWallet: STUDENT_WALLET }),
      ).rejects.toThrow(TypeError);
      await expect(
        claimInvitation({ models, emailService, studentWallet: "  " }),
      ).rejects.toThrow(TypeError);
    });
  });
});
