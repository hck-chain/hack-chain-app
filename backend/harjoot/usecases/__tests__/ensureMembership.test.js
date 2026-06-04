// backend/harjoot/usecases/__tests__/ensureMembership.test.js
//
// Unit tests for the Section 3 membership guard. Uses an in-memory SQLite to
// exercise real Sequelize queries (User + role profiles) and the mock client
// to drive every Harjoot response/error scenario.

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { ensureMembership } = require("../ensureMembership");
const { createMockClient } = require("../../client/mockClient");
const { HarjootUnavailableError } = require("../../client/errors");

jest.setTimeout(10000);

describe("ensureMembership", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, UserSession, Certificate;
  let models;

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
    // SQLite FK requires UNIQUE on referenced column — Student.wallet_address
    // is not unique in the production model. Patching the in-memory attribute
    // keeps the file untouched. Same workaround as harjootModels.test.js.
    Student.rawAttributes.wallet_address.unique = true;
    Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    UserSession = require("../../../models/userSessions")(sequelize, DataTypes);
    Certificate = require("../../../models/certificates")(sequelize, DataTypes);

    const allModels = { User, Student, Issuer, Recruiter, UserSession, Certificate };
    Object.values(allModels).forEach((m) => m.associate && m.associate(allModels));

    await sequelize.sync({ force: true });
    models = allModels;

    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  async function makeStudent({ id, expiresAt }) {
    const user = await User.create({
      id,
      wallet_address: STUDENT_WALLET,
      role: "student",
      name: "Sty",
      nonce: crypto.randomBytes(16).toString("hex"),
      harjoot_membership_expires_at: expiresAt || null,
    });
    await Student.create({ wallet_address: STUDENT_WALLET, field_of_study: "Cybersecurity" });
    return user;
  }

  async function makeIssuer({ id, expiresAt }) {
    const user = await User.create({
      id,
      wallet_address: ISSUER_WALLET,
      role: "issuer",
      name: "Edu",
      nonce: crypto.randomBytes(16).toString("hex"),
      harjoot_membership_expires_at: expiresAt || null,
      educator_approval_status: "pending_approval",
    });
    await Issuer.create({ wallet_address: ISSUER_WALLET, organization_name: "Cyber Academy" });
    return user;
  }

  // ---------------------------------------------------------------------------
  // Hot path — cached locally
  // ---------------------------------------------------------------------------

  describe("local cache (expires_at in the future)", () => {
    test("returns ok with source='cache' and does NOT call Harjoot", async () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const user = await makeStudent({ id: 101, expiresAt: future });

      const client = createMockClient();
      const result = await ensureMembership({ client, models, userId: user.id });

      expect(result.ok).toBe(true);
      expect(result.source).toBe("cache");
      expect(new Date(result.expiresAt).getTime()).toBe(future.getTime());
      expect(client.__calls).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Cold path — checkAccess returns active
  // ---------------------------------------------------------------------------

  describe("expired cache + Harjoot reports active", () => {
    test("calls checkAccess only, persists the new expiry, returns source='check'", async () => {
      const past = new Date(Date.now() - 60_000);
      const user = await makeStudent({ id: 201, expiresAt: past });

      const client = createMockClient();
      const result = await ensureMembership({ client, models, userId: user.id });

      expect(result.ok).toBe(true);
      expect(result.source).toBe("check");
      expect(client.__calls.map((c) => c.method)).toEqual(["checkAccess"]);

      const reloaded = await User.findByPk(user.id);
      expect(new Date(reloaded.harjoot_membership_expires_at).getTime()).toBeGreaterThan(Date.now());
    });

    test("works when the user has no prior expiry at all (null)", async () => {
      const user = await makeStudent({ id: 202, expiresAt: null });

      const client = createMockClient();
      const result = await ensureMembership({ client, models, userId: user.id });

      expect(result.ok).toBe(true);
      expect(result.source).toBe("check");
      expect(client.__calls.map((c) => c.method)).toEqual(["checkAccess"]);
    });
  });

  // ---------------------------------------------------------------------------
  // Cold path — checkAccess inactive → reactivate
  // ---------------------------------------------------------------------------

  describe("expired cache + Harjoot reports inactive", () => {
    test("calls checkAccess THEN activateAccess and returns source='reactivated'", async () => {
      const user = await makeIssuer({ id: 301, expiresAt: null });
      const client = createMockClient();
      client.__setNextResponse("checkAccess", { active: false, expires_at: null });

      const result = await ensureMembership({ client, models, userId: user.id });

      expect(result.ok).toBe(true);
      expect(result.source).toBe("reactivated");
      expect(client.__calls.map((c) => c.method)).toEqual(["checkAccess", "activateAccess"]);

      const reloaded = await User.findByPk(user.id);
      expect(new Date(reloaded.harjoot_membership_expires_at).getTime()).toBeGreaterThan(Date.now());
    });

    test("passes the role and the role-specific profile to activateAccess", async () => {
      const user = await makeIssuer({ id: 302, expiresAt: null });
      const client = createMockClient();
      client.__setNextResponse("checkAccess", { active: false, expires_at: null });

      await ensureMembership({ client, models, userId: user.id });

      const activateCall = client.__calls.find((c) => c.method === "activateAccess");
      expect(activateCall).toBeDefined();
      const [role, calledUser, profile] = activateCall.args;
      expect(role).toBe("issuer");
      expect(calledUser.id).toBe(user.id);
      expect(profile.organization_name).toBe("Cyber Academy");
    });
  });

  // ---------------------------------------------------------------------------
  // Soft-fail when Harjoot is unreachable
  // ---------------------------------------------------------------------------

  describe("Harjoot is unreachable", () => {
    test("returns ok=true with soft_failed=true and DOES NOT throw", async () => {
      const user = await makeStudent({ id: 401, expiresAt: null });
      const client = createMockClient();
      client.__setNextError("checkAccess", new HarjootUnavailableError());

      // The whole point: membership errors must never block a logged-in user.
      const result = await ensureMembership({ client, models, userId: user.id });

      expect(result.ok).toBe(true);
      expect(result.soft_failed).toBe(true);
      expect(result.error).toBeInstanceOf(HarjootUnavailableError);
    });

    test("preserves the previous expires_at on the user row (no destructive update)", async () => {
      const oldExpiry = new Date(Date.now() - 60_000); // a known stale value
      const user = await makeStudent({ id: 402, expiresAt: oldExpiry });
      const client = createMockClient();
      client.__setNextError("checkAccess", new HarjootUnavailableError());

      await ensureMembership({ client, models, userId: user.id });

      const reloaded = await User.findByPk(user.id);
      // We did not write anything new; the column is whatever it was before.
      expect(new Date(reloaded.harjoot_membership_expires_at).getTime()).toBe(oldExpiry.getTime());
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe("edge cases", () => {
    test("returns ok=false with reason USER_NOT_FOUND when the user id does not exist", async () => {
      const client = createMockClient();
      const result = await ensureMembership({ client, models, userId: 99999 });

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("USER_NOT_FOUND");
      expect(client.__calls).toHaveLength(0);
    });

    test("throws TypeError on missing dependencies (caller bug)", async () => {
      await expect(ensureMembership({ models, userId: 1 })).rejects.toThrow(TypeError);
      await expect(ensureMembership({ client: createMockClient(), userId: 1 })).rejects.toThrow(TypeError);
      await expect(ensureMembership({ client: createMockClient(), models })).rejects.toThrow(TypeError);
    });
  });
});
