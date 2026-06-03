// backend/tests/harjootModels.test.js
//
// Unit tests for the Phase 1 models (Payment, TalentInvitation, TreasuryTransfer)
// and the new columns added to the existing User and Certificate models.
//
// Uses an in-memory SQLite database — same pattern as auth.test.js — so the
// schema is materialized via sequelize.sync without touching Postgres.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(15000);

describe("Harjoot Phase 1 models", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, Certificate, UserSession;
  let Payment, TalentInvitation, TreasuryTransfer;

  // Reusable test fixtures
  const ISSUER_WALLET = "0x1111111111111111111111111111111111111111";
  const STUDENT_WALLET = "0x2222222222222222222222222222222222222222";

  beforeAll(async () => {
    // Single-connection pool so PRAGMA foreign_keys = OFF (set below) survives
    // across every query. The existing Student model does not mark
    // wallet_address as unique, which SQLite (unlike Postgres) requires for any
    // FK pointing at it — Certificate.belongsTo(Student) fails with
    // "foreign key mismatch" otherwise. Test-only; Postgres in production
    // enforces FKs normally.
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;

    User = require("../models/users")(sequelize, DataTypes);
    Student = require("../models/students")(sequelize, DataTypes);
    // SQLite requires UNIQUE on any column referenced by a FK. The production
    // Student model does not declare it (Postgres is more permissive).
    // Patching the in-memory attribute keeps the file untouched.
    Student.rawAttributes.wallet_address.unique = true;
    Issuer = require("../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    Certificate = require("../models/certificates")(sequelize, DataTypes);
    UserSession = require("../models/userSessions")(sequelize, DataTypes);
    Payment = require("../models/payments")(sequelize, DataTypes);
    TalentInvitation = require("../models/talentInvitations")(sequelize, DataTypes);
    TreasuryTransfer = require("../models/treasuryTransfers")(sequelize, DataTypes);

    const models = {
      User, Student, Issuer, Recruiter, Certificate, UserSession,
      Payment, TalentInvitation, TreasuryTransfer,
    };
    Object.values(models).forEach((model) => {
      if (model.associate) model.associate(models);
    });

    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    // Re-create every table from scratch between tests for total isolation.
    // SQLite is fast enough that this is cheaper than chasing FK/truncate
    // quirks across dialect differences.
    await sequelize.sync({ force: true });
  });

  // ---------------------------------------------------------------------------
  // Payment
  // ---------------------------------------------------------------------------

  describe("Payment", () => {
    test("create with required fields persists a row", async () => {
      const payment = await Payment.create({
        tx_hash: "0x" + "a".repeat(64),
        from_wallet: ISSUER_WALLET,
        amount_hack: 6900,
        harjoot_price_usd: 0.20,
        user_price_usd: 0.69,
        status: "confirmed",
        purpose: "tokenize",
      });

      expect(payment.id).toBeTruthy();
      expect(payment.tx_hash).toBe("0x" + "a".repeat(64));
      expect(payment.purpose).toBe("tokenize");
    });

    test("status defaults to 'confirmed' when omitted", async () => {
      const payment = await Payment.create({
        tx_hash: "0x" + "b".repeat(64),
        from_wallet: ISSUER_WALLET,
        amount_hack: 6900,
        harjoot_price_usd: 0.20,
        user_price_usd: 0.69,
        purpose: "tokenize",
      });

      expect(payment.status).toBe("confirmed");
    });

    test("tx_hash is unique — duplicate insert rejected at the DB layer", async () => {
      const tx = "0x" + "c".repeat(64);
      await Payment.create({
        tx_hash: tx,
        from_wallet: ISSUER_WALLET,
        amount_hack: 6900,
        harjoot_price_usd: 0.20,
        user_price_usd: 0.69,
        purpose: "tokenize",
      });

      await expect(
        Payment.create({
          tx_hash: tx,
          from_wallet: ISSUER_WALLET,
          amount_hack: 6900,
          harjoot_price_usd: 0.20,
          user_price_usd: 0.69,
          purpose: "tokenize",
        }),
      ).rejects.toThrow();
    });

    test("tx_hash, from_wallet, amount_hack, harjoot_price_usd, user_price_usd, purpose are all NOT NULL", async () => {
      // Omitting any required field must reject.
      const base = {
        tx_hash: "0x" + "d".repeat(64),
        from_wallet: ISSUER_WALLET,
        amount_hack: 6900,
        harjoot_price_usd: 0.20,
        user_price_usd: 0.69,
        purpose: "tokenize",
      };
      for (const field of Object.keys(base)) {
        const broken = { ...base, tx_hash: base.tx_hash + field };
        delete broken[field];
        await expect(Payment.create(broken)).rejects.toThrow();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // TalentInvitation
  // ---------------------------------------------------------------------------

  describe("TalentInvitation", () => {
    let educator;

    beforeEach(async () => {
      educator = await User.create({
        wallet_address: ISSUER_WALLET,
        role: "issuer",
        name: "Edu",
        nonce: crypto.randomBytes(16).toString("hex"),
      });
    });

    test("create with required fields persists a row defaulting to status='pending'", async () => {
      const created = await TalentInvitation.create({
        educator_user_id: educator.id,
        student_wallet_address: STUDENT_WALLET,
        email: "future-talent@example.com",
      });
      // Reload to verify the DB-side defaults (Sequelize leaves omitted columns
      // as undefined on the returned instance until reloaded).
      const invite = await TalentInvitation.findByPk(created.id);

      expect(invite.id).toBeTruthy();
      expect(invite.status).toBe("pending");
      expect(invite.claimed_at).toBeNull();
    });

    test("belongsTo User (educator) — can be eager loaded as 'educator'", async () => {
      await TalentInvitation.create({
        educator_user_id: educator.id,
        student_wallet_address: STUDENT_WALLET,
        email: "future-talent@example.com",
      });

      const loaded = await TalentInvitation.findOne({
        where: { student_wallet_address: STUDENT_WALLET },
        include: [{ model: User, as: "educator" }],
      });

      expect(loaded.educator).toBeTruthy();
      expect(loaded.educator.wallet_address).toBe(ISSUER_WALLET);
      expect(loaded.educator.role).toBe("issuer");
    });

    test("claimed_at can be set when transitioning to 'claimed'", async () => {
      const invite = await TalentInvitation.create({
        educator_user_id: educator.id,
        student_wallet_address: STUDENT_WALLET,
        email: "t@example.com",
      });

      const claimedAt = new Date();
      await invite.update({ status: "claimed", claimed_at: claimedAt });

      const fresh = await TalentInvitation.findByPk(invite.id);
      expect(fresh.status).toBe("claimed");
      expect(fresh.claimed_at).toBeInstanceOf(Date);
    });
  });

  // ---------------------------------------------------------------------------
  // TreasuryTransfer
  // ---------------------------------------------------------------------------

  describe("TreasuryTransfer", () => {
    let payment;

    beforeEach(async () => {
      payment = await Payment.create({
        tx_hash: "0x" + "e".repeat(64),
        from_wallet: ISSUER_WALLET,
        amount_hack: 6900,
        harjoot_price_usd: 0.20,
        user_price_usd: 0.69,
        purpose: "tokenize",
      });
    });

    test("create with required fields defaults to destination='harjoot' and status='pending'", async () => {
      const created = await TreasuryTransfer.create({
        payment_id: payment.id,
        amount_usdt_owed: 0.20,
      });
      const transfer = await TreasuryTransfer.findByPk(created.id);

      expect(transfer.id).toBeTruthy();
      expect(transfer.destination).toBe("harjoot");
      expect(transfer.status).toBe("pending");
      expect(transfer.usdt_tx_hash).toBeNull();
      expect(transfer.sent_at).toBeNull();
      expect(transfer.error).toBeNull();
    });

    test("belongsTo Payment — eager loads the linked payment", async () => {
      await TreasuryTransfer.create({
        payment_id: payment.id,
        amount_usdt_owed: 0.20,
      });

      const transfer = await TreasuryTransfer.findOne({
        where: { payment_id: payment.id },
        include: [Payment],
      });

      expect(transfer.Payment).toBeTruthy();
      expect(transfer.Payment.id).toBe(payment.id);
      expect(transfer.Payment.tx_hash).toBe(payment.tx_hash);
    });

    test("Payment.hasOne TreasuryTransfer — eager loads from the other side", async () => {
      await TreasuryTransfer.create({
        payment_id: payment.id,
        amount_usdt_owed: 0.20,
        status: "sent",
        usdt_tx_hash: "0xUSDT",
        sent_at: new Date(),
      });

      const reloaded = await Payment.findByPk(payment.id, { include: [TreasuryTransfer] });
      expect(reloaded.TreasuryTransfer).toBeTruthy();
      expect(reloaded.TreasuryTransfer.status).toBe("sent");
      expect(reloaded.TreasuryTransfer.usdt_tx_hash).toBe("0xUSDT");
    });
  });

  // ---------------------------------------------------------------------------
  // New columns on existing User model
  // ---------------------------------------------------------------------------

  describe("User — Harjoot columns", () => {
    test("new columns default to null for a freshly created user", async () => {
      const created = await User.create({
        wallet_address: ISSUER_WALLET,
        role: "issuer",
        name: "Edu",
        nonce: crypto.randomBytes(16).toString("hex"),
      });
      const user = await User.findByPk(created.id);

      expect(user.harjoot_membership_expires_at).toBeNull();
      expect(user.educator_approval_status).toBeNull();
      expect(user.approved_at).toBeNull();
      expect(user.approved_by).toBeNull();
      expect(user.rejection_reason).toBeNull();
    });

    test("educator_approval_status can be set to pending_approval | approved | rejected", async () => {
      const user = await User.create({
        wallet_address: ISSUER_WALLET,
        role: "issuer",
        name: "Edu",
        nonce: crypto.randomBytes(16).toString("hex"),
      });

      await user.update({ educator_approval_status: "pending_approval" });
      expect((await User.findByPk(user.id)).educator_approval_status).toBe("pending_approval");

      await user.update({
        educator_approval_status: "approved",
        approved_at: new Date(),
        approved_by: user.id,
      });
      const approved = await User.findByPk(user.id);
      expect(approved.educator_approval_status).toBe("approved");
      expect(approved.approved_at).toBeInstanceOf(Date);
      expect(approved.approved_by).toBe(user.id);

      await user.update({
        educator_approval_status: "rejected",
        rejection_reason: "KYC failed",
      });
      const rejected = await User.findByPk(user.id);
      expect(rejected.educator_approval_status).toBe("rejected");
      expect(rejected.rejection_reason).toBe("KYC failed");
    });

    test("harjoot_membership_expires_at can be set to a future date", async () => {
      const user = await User.create({
        wallet_address: ISSUER_WALLET,
        role: "student",
        name: "Sty",
        nonce: crypto.randomBytes(16).toString("hex"),
      });

      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.update({ harjoot_membership_expires_at: future });

      const fresh = await User.findByPk(user.id);
      expect(fresh.harjoot_membership_expires_at).toBeInstanceOf(Date);
      expect(fresh.harjoot_membership_expires_at.getTime()).toBe(future.getTime());
    });
  });

  // ---------------------------------------------------------------------------
  // New columns on existing Certificate model + Payment association
  // ---------------------------------------------------------------------------

  describe("Certificate — Harjoot columns + Payment association", () => {
    let issuer, student, payment;

    beforeEach(async () => {
      const issuerUser = await User.create({
        wallet_address: ISSUER_WALLET,
        role: "issuer",
        name: "Edu",
        nonce: crypto.randomBytes(16).toString("hex"),
      });
      issuer = await Issuer.create({
        wallet_address: ISSUER_WALLET,
        organization_name: "Cyber Academy",
      });

      const studentUser = await User.create({
        wallet_address: STUDENT_WALLET,
        role: "student",
        name: "Sty",
        nonce: crypto.randomBytes(16).toString("hex"),
      });
      student = await Student.create({ wallet_address: STUDENT_WALLET });

      payment = await Payment.create({
        tx_hash: "0x" + "f".repeat(64),
        from_wallet: ISSUER_WALLET,
        amount_hack: 6900,
        harjoot_price_usd: 0.20,
        user_price_usd: 0.69,
        purpose: "tokenize",
      });
    });

    test("status defaults to 'issued' when omitted", async () => {
      const cert = await Certificate.create({
        issuer_wallet_address: ISSUER_WALLET,
        student_wallet_address: STUDENT_WALLET,
        title: "Intro to Sec",
        certificate_hash: "a".repeat(64),
        token_id: "1",
        issue_date: "2026-01-01",
      });

      expect(cert.status).toBe("issued");
    });

    test("can persist all new Harjoot columns and the payment reference", async () => {
      const cert = await Certificate.create({
        issuer_wallet_address: ISSUER_WALLET,
        student_wallet_address: STUDENT_WALLET,
        title: "Advanced Sec",
        certificate_hash: "b".repeat(64),
        token_id: "2",
        issue_date: "2026-01-01",
        harjoot_verification_id: "HJ-P-2026-XYZ",
        harjoot_verification_url: "https://harjoot.test/verify/HJ-P-2026-XYZ",
        harjoot_qr_url: "https://harjoot.test/verify/HJ-P-2026-XYZ/qr",
        payment_id: payment.id,
        status: "issued",
      });

      expect(cert.harjoot_verification_id).toBe("HJ-P-2026-XYZ");
      expect(cert.payment_id).toBe(payment.id);
    });

    test("belongsTo Payment — Certificate eager loads its payment", async () => {
      await Certificate.create({
        issuer_wallet_address: ISSUER_WALLET,
        student_wallet_address: STUDENT_WALLET,
        title: "Sec",
        certificate_hash: "c".repeat(64),
        token_id: "3",
        issue_date: "2026-01-01",
        payment_id: payment.id,
      });

      const reloaded = await Certificate.findOne({
        where: { token_id: "3" },
        include: [Payment],
      });

      expect(reloaded.Payment).toBeTruthy();
      expect(reloaded.Payment.id).toBe(payment.id);
    });

    test("Payment.hasOne Certificate — eager loads from the payment side", async () => {
      await Certificate.create({
        issuer_wallet_address: ISSUER_WALLET,
        student_wallet_address: STUDENT_WALLET,
        title: "Sec",
        certificate_hash: "d".repeat(64),
        token_id: "4",
        issue_date: "2026-01-01",
        payment_id: payment.id,
      });

      const reloaded = await Payment.findByPk(payment.id, { include: [Certificate] });
      expect(reloaded.Certificate).toBeTruthy();
      expect(reloaded.Certificate.token_id).toBe("4");
    });
  });
});
