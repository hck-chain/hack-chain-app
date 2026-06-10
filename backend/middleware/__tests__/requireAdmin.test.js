// backend/middleware/__tests__/requireAdmin.test.js

const express = require("express");
const request = require("supertest");

const requireAdminModule = require("../requireAdmin");

const ORIGINAL_ENV = { ...process.env };

function buildApp({ wallet }) {
  const app = express();
  // Fake authenticate that simulates whatever the test wants.
  app.use((req, res, next) => {
    req.auth = wallet ? { wallet } : undefined;
    next();
  });
  app.get("/admin-only", requireAdminModule.requireAdmin, (req, res) => {
    res.json({ ok: true });
  });
  return app;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ADMIN_WALLET;
  delete process.env.ADMIN_WALLETS;
  requireAdminModule.__resetCache();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

const ADMIN_A = "0x1111111111111111111111111111111111111111";
const ADMIN_B = "0x2222222222222222222222222222222222222222";
const RANDOM  = "0x3333333333333333333333333333333333333333";

describe("requireAdmin middleware", () => {
  test("rejects when no admin env is configured (fail closed)", async () => {
    const res = await request(buildApp({ wallet: ADMIN_A })).get("/admin-only");
    expect(res.status).toBe(403);
  });

  test("accepts the legacy ADMIN_WALLET single value", async () => {
    process.env.ADMIN_WALLET = ADMIN_A;
    const res = await request(buildApp({ wallet: ADMIN_A })).get("/admin-only");
    expect(res.status).toBe(200);
  });

  test("ADMIN_WALLETS comma list allows multiple admins", async () => {
    process.env.ADMIN_WALLETS = `${ADMIN_A}, ${ADMIN_B}`;
    expect((await request(buildApp({ wallet: ADMIN_A })).get("/admin-only")).status).toBe(200);
    expect((await request(buildApp({ wallet: ADMIN_B })).get("/admin-only")).status).toBe(200);
    expect((await request(buildApp({ wallet: RANDOM  })).get("/admin-only")).status).toBe(403);
  });

  test("combines ADMIN_WALLETS + legacy ADMIN_WALLET into one set", async () => {
    process.env.ADMIN_WALLETS = ADMIN_A;
    process.env.ADMIN_WALLET = ADMIN_B;
    expect((await request(buildApp({ wallet: ADMIN_A })).get("/admin-only")).status).toBe(200);
    expect((await request(buildApp({ wallet: ADMIN_B })).get("/admin-only")).status).toBe(200);
  });

  test("comparison is case-insensitive on both sides", async () => {
    process.env.ADMIN_WALLETS = ADMIN_A.toUpperCase().replace(/X/g, "x");
    const mixedCase = ADMIN_A.slice(0, 4) + ADMIN_A.slice(4).toUpperCase();
    const res = await request(buildApp({ wallet: mixedCase })).get("/admin-only");
    expect(res.status).toBe(200);
  });

  test("rejects unauthenticated requests even if admin env is set", async () => {
    process.env.ADMIN_WALLETS = ADMIN_A;
    const res = await request(buildApp({ wallet: null })).get("/admin-only");
    expect(res.status).toBe(403);
  });

  test("rejects empty string callerWallet", async () => {
    process.env.ADMIN_WALLETS = ADMIN_A;
    const res = await request(buildApp({ wallet: "" })).get("/admin-only");
    expect(res.status).toBe(403);
  });

  test("isAdmin() helper agrees with the middleware decision", () => {
    process.env.ADMIN_WALLETS = `${ADMIN_A},${ADMIN_B}`;
    expect(requireAdminModule.isAdmin(ADMIN_A)).toBe(true);
    expect(requireAdminModule.isAdmin(ADMIN_B.toUpperCase())).toBe(true);
    expect(requireAdminModule.isAdmin(RANDOM)).toBe(false);
    expect(requireAdminModule.isAdmin("")).toBe(false);
    expect(requireAdminModule.isAdmin(null)).toBe(false);
  });

  test("listAdmins() returns lowercased + sorted admins", () => {
    process.env.ADMIN_WALLETS = `${ADMIN_B}, ${ADMIN_A.toUpperCase().replace(/X/g, "x")}`;
    expect(requireAdminModule.listAdmins()).toEqual([ADMIN_A, ADMIN_B]);
  });
});
