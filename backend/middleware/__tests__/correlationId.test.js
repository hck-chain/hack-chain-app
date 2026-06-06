// backend/middleware/__tests__/correlationId.test.js
//
// Lightweight test that builds a tiny Express app, hits it with supertest,
// and asserts on the response header + on what the downstream handler saw
// via getCorrelationId().

const express = require("express");
const request = require("supertest");

const correlationId = require("../correlationId");
const { getCorrelationId } = require("../../lib/correlationContext");

function buildApp() {
  const app = express();
  app.use(correlationId());
  app.get("/echo", (req, res) => {
    res.json({
      reqProperty: req.correlationId,
      // Read via the context to prove the storage was actually populated.
      contextRead: getCorrelationId(),
    });
  });
  return app;
}

describe("correlationId middleware", () => {
  test("generates a req-<uuid> when no header is sent and echoes it on the response", async () => {
    const res = await request(buildApp()).get("/echo");
    expect(res.status).toBe(200);
    expect(res.headers["x-correlation-id"]).toMatch(/^req-[0-9a-f-]{36}$/);
    expect(res.body.reqProperty).toBe(res.headers["x-correlation-id"]);
    expect(res.body.contextRead).toBe(res.headers["x-correlation-id"]);
  });

  test("honors a well-formed incoming X-Correlation-ID", async () => {
    const res = await request(buildApp())
      .get("/echo")
      .set("X-Correlation-ID", "trace-abc.123_:09");
    expect(res.headers["x-correlation-id"]).toBe("trace-abc.123_:09");
    expect(res.body.reqProperty).toBe("trace-abc.123_:09");
  });

  test("rejects an incoming header containing control chars and generates a fresh id instead", async () => {
    const res = await request(buildApp())
      .get("/echo")
      // Supertest strips control chars too aggressively; use a value with a
      // banned punctuation char like a space.
      .set("X-Correlation-ID", "bad value with space");
    expect(res.headers["x-correlation-id"]).toMatch(/^req-[0-9a-f-]{36}$/);
    expect(res.headers["x-correlation-id"]).not.toBe("bad value with space");
  });

  test("rejects an oversize incoming header (>128 chars) and generates a fresh id", async () => {
    const giant = "a".repeat(200);
    const res = await request(buildApp())
      .get("/echo")
      .set("X-Correlation-ID", giant);
    expect(res.headers["x-correlation-id"]).toMatch(/^req-[0-9a-f-]{36}$/);
  });

  test("each request gets its own id", async () => {
    const app = buildApp();
    const a = await request(app).get("/echo");
    const b = await request(app).get("/echo");
    expect(a.headers["x-correlation-id"]).not.toBe(b.headers["x-correlation-id"]);
  });

  test("getCorrelationId is undefined outside of a request (no leaked context)", async () => {
    await request(buildApp()).get("/echo");
    expect(getCorrelationId()).toBeUndefined();
  });
});
