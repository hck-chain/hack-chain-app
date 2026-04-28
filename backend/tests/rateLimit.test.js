// backend/tests/rateLimit.test.js
// Verifies that the global rate limiter blocks excess requests with 429.
// Uses max:3 so the test runs in milliseconds without firing 100 requests.
const request = require("supertest");
const express = require("express");
const rateLimit = require("express-rate-limit");

jest.setTimeout(10000);

function buildApp(max) {
  const app = express();
  app.set("trust proxy", 1);

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  });

  app.use("/api/", limiter);
  app.get("/api/ping", (_req, res) => res.json({ ok: true }));
  app.get("/health", (_req, res) => res.json({ ok: true })); // outside /api/ — not limited

  return app;
}

describe("Global rate limiter", () => {
  test("allows requests up to the limit", async () => {
    const app = buildApp(3);
    for (let i = 0; i < 3; i++) {
      await request(app).get("/api/ping").expect(200);
    }
  });

  test("returns 429 when the limit is exceeded", async () => {
    const app = buildApp(3);
    for (let i = 0; i < 3; i++) {
      await request(app).get("/api/ping").expect(200);
    }
    const res = await request(app).get("/api/ping").expect(429);
    expect(res.body).toHaveProperty("error");
  });

  test("sets RateLimit-* standard headers on responses", async () => {
    const app = buildApp(3);
    const res = await request(app).get("/api/ping").expect(200);
    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers).toHaveProperty("ratelimit-remaining");
  });

  test("routes outside /api/ are NOT rate-limited", async () => {
    const app = buildApp(2);
    // exhaust the limit on /api/
    await request(app).get("/api/ping").expect(200);
    await request(app).get("/api/ping").expect(200);
    await request(app).get("/api/ping").expect(429);

    // /health should still respond normally
    await request(app).get("/health").expect(200);
  });
});
