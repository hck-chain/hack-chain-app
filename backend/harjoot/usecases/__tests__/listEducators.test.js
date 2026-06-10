// backend/harjoot/usecases/__tests__/listEducators.test.js

const SequelizePkg = require("sequelize");
const crypto = require("crypto");

const { listEducators } = require("../listEducators");

describe("listEducators", () => {
  let sequelize;
  let User, Student, Issuer, Recruiter, UserSession, Certificate, TalentInvitation;
  let models;

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

    const all = { User, Student, Issuer, Recruiter, UserSession, Certificate, TalentInvitation };
    Object.values(all).forEach((m) => m.associate && m.associate(all));
    await sequelize.sync({ force: true });
    models = all;
  });

  afterAll(async () => { if (sequelize) await sequelize.close(); });

  beforeEach(async () => { await sequelize.sync({ force: true }); });

  async function seedIssuer({ id, status, name, lastname, email, org, wallet }) {
    await User.create({
      id, wallet_address: wallet, role: "issuer", name, lastname, email,
      nonce: crypto.randomBytes(8).toString("hex"),
      educator_approval_status: status,
    });
    await Issuer.create({ wallet_address: wallet, organization_name: org });
  }

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  test("status='all' returns all issuers regardless of approval state", async () => {
    await seedIssuer({ id: 1, status: "pending_approval", name: "Ana", lastname: "P", email: "a@x.com", org: "Acme",  wallet: "0x" + "1".repeat(40) });
    await seedIssuer({ id: 2, status: "approved",         name: "Bea", lastname: "L", email: "b@x.com", org: "Beta",  wallet: "0x" + "2".repeat(40) });
    await seedIssuer({ id: 3, status: "rejected",         name: "Cor", lastname: "M", email: "c@x.com", org: "Cyber", wallet: "0x" + "3".repeat(40) });
    // A non-issuer must NOT leak.
    await User.create({
      id: 4, wallet_address: "0x" + "9".repeat(40), role: "student", name: "Sty",
      email: "s@x.com", nonce: "n",
    });

    const result = await listEducators({ models });
    expect(result.total).toBe(3);
    expect(result.items.map((i) => i.id).sort()).toEqual([1, 2, 3]);
    expect(result.items.find((i) => i.id === 2).organizationName).toBe("Beta");
  });

  test("status='pending_approval' returns only pending", async () => {
    await seedIssuer({ id: 1, status: "pending_approval", name: "A", lastname: "", email: "a@x.com", org: "AcA", wallet: "0x" + "1".repeat(40) });
    await seedIssuer({ id: 2, status: "approved",         name: "B", lastname: "", email: "b@x.com", org: "AcB", wallet: "0x" + "2".repeat(40) });

    const result = await listEducators({ models, status: "pending_approval" });
    expect(result.items.map((i) => i.id)).toEqual([1]);
    expect(result.total).toBe(1);
  });

  test("status='approved' returns only approved", async () => {
    await seedIssuer({ id: 1, status: "approved", name: "A", lastname: "", email: "a@x.com", org: "A", wallet: "0x" + "1".repeat(40) });
    await seedIssuer({ id: 2, status: "rejected", name: "B", lastname: "", email: "b@x.com", org: "B", wallet: "0x" + "2".repeat(40) });
    const result = await listEducators({ models, status: "approved" });
    expect(result.items.map((i) => i.id)).toEqual([1]);
  });

  test("throws TypeError on invalid status", async () => {
    await expect(listEducators({ models, status: "bogus" })).rejects.toThrow(TypeError);
  });

  // -------------------------------------------------------------------------
  // Search (note: SQLite's iLike degrades to LIKE — case insensitive enough
  // for these tests since we lowercase the pattern AND the seeded data uses
  // exact-case substrings)
  // -------------------------------------------------------------------------

  test("search matches user.name substring", async () => {
    await seedIssuer({ id: 1, status: "approved", name: "Alejandro", lastname: "", email: "a@x.com", org: "Acme",  wallet: "0x" + "1".repeat(40) });
    await seedIssuer({ id: 2, status: "approved", name: "Beatriz",   lastname: "", email: "b@x.com", org: "Beta",  wallet: "0x" + "2".repeat(40) });

    const result = await listEducators({ models, search: "alejandr" });
    expect(result.items.map((i) => i.id)).toEqual([1]);
  });

  test("search matches issuer.organization_name substring", async () => {
    await seedIssuer({ id: 1, status: "approved", name: "X", lastname: "", email: "x@x.com", org: "Cyber Academy", wallet: "0x" + "1".repeat(40) });
    await seedIssuer({ id: 2, status: "approved", name: "Y", lastname: "", email: "y@x.com", org: "DataWorks",    wallet: "0x" + "2".repeat(40) });

    const result = await listEducators({ models, search: "cyber" });
    expect(result.items.map((i) => i.id)).toEqual([1]);
  });

  test("search returns empty page when nothing matches", async () => {
    await seedIssuer({ id: 1, status: "approved", name: "A", lastname: "", email: "a@x.com", org: "Acme", wallet: "0x" + "1".repeat(40) });
    const result = await listEducators({ models, search: "no-such-thing-xyz" });
    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 25, totalPages: 0 });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  test("pagination respects page + limit and reports totalPages", async () => {
    for (let i = 1; i <= 12; i++) {
      await seedIssuer({
        id: i, status: "approved",
        name: `N${i}`, lastname: "", email: `e${i}@x.com`,
        org: `Org${i}`,
        wallet: "0x" + i.toString(16).padStart(40, "0"),
      });
    }
    const page1 = await listEducators({ models, page: 1, limit: 5 });
    expect(page1.items.length).toBe(5);
    expect(page1.total).toBe(12);
    expect(page1.totalPages).toBe(3);
    expect(page1.page).toBe(1);

    const page3 = await listEducators({ models, page: 3, limit: 5 });
    expect(page3.items.length).toBe(2);
  });

  test("clamps invalid limit to default + caps at 100", async () => {
    await seedIssuer({ id: 1, status: "approved", name: "A", lastname: "", email: "a@x.com", org: "A", wallet: "0x" + "1".repeat(40) });
    const r1 = await listEducators({ models, limit: "not-a-number" });
    expect(r1.limit).toBe(25);
    const r2 = await listEducators({ models, limit: 9999 });
    expect(r2.limit).toBe(100);
  });

  test("clamps page <1 to 1", async () => {
    await seedIssuer({ id: 1, status: "approved", name: "A", lastname: "", email: "a@x.com", org: "A", wallet: "0x" + "1".repeat(40) });
    const r = await listEducators({ models, page: 0 });
    expect(r.page).toBe(1);
  });

  test("throws TypeError on missing models", async () => {
    await expect(listEducators({})).rejects.toThrow(TypeError);
  });
});
