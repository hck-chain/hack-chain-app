// backend/tests/healthHarjoot.test.js
//
// Builds a mini Express app that mounts the same /health/harjoot handler
// shape as index.js, so we exercise the getter wiring + the sanitization
// of the cached partner payload without booting the full server.

const express = require("express");
const request = require("supertest");

const checkPartnerHealth = require("../harjoot/usecases/checkPartnerHealth");

function buildApp() {
  const app = express();
  app.get("/health/harjoot", (req, res) => {
    const { getHealthState, getCachedPartnerInfo } = checkPartnerHealth;
    const state = getHealthState();
    const cached = getCachedPartnerInfo();
    const partner = cached
      ? { name: cached.name || null, status: cached.status || null }
      : null;
    return res.json({
      ok: state.hasCache && !state.lastError,
      hasCache: state.hasCache,
      lastCheckedAt: state.lastCheckedAt,
      lastError: state.lastError,
      partner,
    });
  });
  return app;
}

describe("GET /health/harjoot", () => {
  beforeEach(() => {
    checkPartnerHealth.__resetForTests();
  });
  afterAll(() => {
    checkPartnerHealth.__resetForTests();
  });

  test("returns ok=false + hasCache=false when no check has run yet", async () => {
    const res = await request(buildApp()).get("/health/harjoot");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: false,
      hasCache: false,
      lastCheckedAt: null,
      lastError: null,
      partner: null,
    });
  });

  test("returns ok=true + sanitized partner payload after a successful check", async () => {
    // Drive the cache via the real use case so we exercise the same
    // getHealthState() / getCachedPartnerInfo() pair index.js calls.
    const fakeClient = {
      getPartnerInfo: jest.fn().mockResolvedValue({
        name: "HackChain Partner Sandbox",
        status: "active",
        // Sensitive-ish fields that must NOT be echoed by /health/harjoot.
        apiKey: "secret-do-not-leak",
        internalId: "p_int_42",
      }),
    };
    await checkPartnerHealth.checkPartnerHealth(fakeClient);

    const res = await request(buildApp()).get("/health/harjoot");
    expect(res.body.ok).toBe(true);
    expect(res.body.hasCache).toBe(true);
    expect(res.body.lastError).toBeNull();
    expect(res.body.partner).toEqual({
      name: "HackChain Partner Sandbox",
      status: "active",
    });
    // Explicit anti-regression check — no sensitive fields anywhere in the body.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toMatch(/secret-do-not-leak/);
    expect(serialized).not.toMatch(/p_int_42/);
  });

  test("returns ok=false + lastError when the cached state shows a failed check", async () => {
    const fakeClient = {
      getPartnerInfo: jest.fn().mockRejectedValue(
        Object.assign(new Error("Partner 401"), { name: "HarjootAuthError", code: "UNAUTHORIZED" }),
      ),
    };
    await checkPartnerHealth.checkPartnerHealth(fakeClient);

    const res = await request(buildApp()).get("/health/harjoot");
    expect(res.body.ok).toBe(false);
    expect(res.body.lastError).toEqual({
      name: "HarjootAuthError",
      message: "Partner 401",
      code: "UNAUTHORIZED",
    });
  });
});
