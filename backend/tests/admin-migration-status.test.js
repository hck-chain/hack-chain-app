// GET /api/admin/migration-status. A user only counts as migrated with both the Privy
// identity and the embedded wallet: the DID alone leaves an account half done.
const express = require("express");
const request = require("supertest");
const SequelizePkg = require("sequelize");
const crypto = require("crypto");

jest.setTimeout(20000);

jest.mock("../services/redis", () => ({
  cacheSession: jest.fn().mockResolvedValue(undefined),
  deleteSession: jest.fn().mockResolvedValue(undefined),
  sessionExists: jest.fn().mockResolvedValue(false),
}));
// routes/admin.js imports the named exports, unlike the default function other routes use.
jest.mock("express-rate-limit", () => ({
  rateLimit: () => (req, res, next) => next(),
  ipKeyGenerator: (req) => req.ip,
}));
jest.mock("../services/emailService", () => ({}));

const ADMIN = "0x" + "aa".repeat(20);
const MEMBER = "0x" + "bb".repeat(20);

describe("GET /api/admin/migration-status", () => {
  let app, sequelize, User;

  beforeAll(async () => {
    process.env.ADMIN_WALLETS = ADMIN;

    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    User = require("../models/users")(sequelize, DataTypes);
    const Student = require("../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    const Issuer = require("../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../models/recruiters")(sequelize, DataTypes);
    const UserSession = require("../models/userSessions")(sequelize, DataTypes);
    const Certificate = require("../models/certificates")(sequelize, DataTypes);

    const models = {
      User, Student, Issuer, Recruiter, UserSession, Certificate,
      sequelize, Sequelize: SequelizePkg,
    };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));

    jest.isolateModules(() => {
      jest.doMock("../models", () => models);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = { wallet: req.headers["x-test-wallet"] || ADMIN, role: "student", sub: 1 };
          next();
        },
      }));

      const adminRoute = require("../routes/admin");
      app = express();
      app.use(express.json());
      app.use("/api/admin", adminRoute);
    });
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    delete process.env.ADMIN_WALLETS;
    await sequelize.close();
  });

  let counter = 0;
  function seed(attrs = {}) {
    counter += 1;
    return User.create({
      wallet_address: "0x" + String(counter).padStart(2, "0").repeat(20),
      role: "student",
      nonce: crypto.randomBytes(16).toString("hex"),
      is_active: true,
      ...attrs,
    });
  }

  const get = (query = "") => request(app).get(`/api/admin/migration-status${query}`);

  async function seedFour() {
    await seed({ email: "legacy@hackchain.test" });                                  // nothing linked
    await seed({ privy_did: "did:privy:half" });                                     // DID without wallet
    await seed({ integrated_wallet_address: "0x" + "ee".repeat(20) });               // wallet without DID
    await seed({ privy_did: "did:privy:done", integrated_wallet_address: "0x" + "dd".repeat(20) });
  }

  it("does not count a user with a DID but no wallet as migrated", async () => {
    await seed({ privy_did: "did:privy:half" });

    const res = await get();
    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual({ total: 1, migrated: 0, pending: 1 });
    expect(res.body.users[0].migrated).toBe(false);
  });

  it("counts a user with both the DID and the wallet as migrated", async () => {
    await seed({ privy_did: "did:privy:done", integrated_wallet_address: "0x" + "dd".repeat(20) });

    const res = await get();
    expect(res.body.summary).toEqual({ total: 1, migrated: 1, pending: 0 });
    expect(res.body.users[0].migrated).toBe(true);
  });

  it("keeps the summary, the per-row flag and the filter consistent", async () => {
    await seedFour();

    const all = await get();
    expect(all.body.summary).toEqual({ total: 4, migrated: 1, pending: 3 });
    expect(all.body.users.filter((u) => u.migrated)).toHaveLength(1);

    const done = await get("?migrated=true");
    expect(done.body.users).toHaveLength(1);
    expect(done.body.users.every((u) => u.migrated)).toBe(true);

    const pending = await get("?migrated=false");
    expect(pending.body.users).toHaveLength(3);
    expect(pending.body.users.every((u) => !u.migrated)).toBe(true);
  });

  it("returns the same response shape and never exposes the DID", async () => {
    await seed({ privy_did: "did:privy:done", integrated_wallet_address: "0x" + "dd".repeat(20) });

    const res = await get();
    expect(Object.keys(res.body).sort()).toEqual(["limit", "page", "summary", "users"]);
    expect(Object.keys(res.body.users[0]).sort()).toEqual([
      "created_at", "email", "id", "integrated_wallet_address", "migrated",
      "own_wallet_address", "role", "wallet_address",
    ]);
    expect(JSON.stringify(res.body)).not.toContain("did:privy");
  });

  it("returns page and limit as numbers", async () => {
    await seedFour();
    const res = await get("?page=2&limit=2");
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(2);
    expect(res.body.users).toHaveLength(2);
  });

  it("is only available to admins", async () => {
    const res = await request(app).get("/api/admin/migration-status").set("x-test-wallet", MEMBER);
    expect(res.status).toBe(403);
  });
});
