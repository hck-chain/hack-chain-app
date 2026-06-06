// backend/harjoot/client/__tests__/httpClient.correlation.test.js
//
// Focused tests for Phase 9a structured logging + correlation propagation.
// Reuses the fake-axios harness shape from httpClient.test.js but kept
// separate so the original suite stays focused on the wire contract.

jest.mock("axios");
const axios = require("axios");

const { createHttpClient } = require("../httpClient");
const { runWithCorrelationId } = require("../../../lib/correlationContext");

const testConfig = Object.freeze({
  api: Object.freeze({
    baseUrl: "https://harjoot.test/api/partner/hackchain/v1",
    apiKey: "test-key-xyz",
    timeoutMs: 1000,
    maxRetries: 1,
    retryBaseDelayMs: 1,
  }),
});

// Same fake axios shim as httpClient.test.js but trimmed to what we need.
function buildFakeAxiosInstance() {
  const requestHandlers = [];
  const responseHandlers = [];
  const seenConfigs = [];
  let impl = null;

  async function callable(config) {
    let cfg = config;
    for (const handler of requestHandlers) cfg = handler(cfg);
    seenConfigs.push(cfg);
    let result;
    try {
      result = await impl(cfg);
    } catch (err) {
      for (const { err: errHandler } of responseHandlers) {
        if (errHandler) {
          try { return await errHandler(err); } catch (e) { err = e; }
        }
      }
      throw err;
    }
    for (const { ok } of responseHandlers) if (ok) result = ok(result);
    return result;
  }
  callable.get = (url, opts = {}) =>
    callable({ method: "get", url, ...opts, headers: { ...(callable._headers || {}) } });
  callable.post = (url, data, opts = {}) =>
    callable({ method: "post", url, data, ...opts, headers: { ...(callable._headers || {}) } });
  callable.interceptors = {
    request: { use(fn) { requestHandlers.push(fn); } },
    response: { use(ok, err) { responseHandlers.push({ ok, err }); } },
  };
  callable._setImpl = (fn) => { impl = fn; };
  callable._setHeaders = (h) => { callable._headers = h; };
  callable._seenConfigs = seenConfigs;
  return callable;
}

let fakeAxios;
let logSpy;
let warnSpy;
let errorSpy;

beforeEach(() => {
  fakeAxios = buildFakeAxiosInstance();
  axios.create.mockImplementation((createOpts) => {
    fakeAxios._setHeaders(createOpts.headers);
    return fakeAxios;
  });
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers — parse the JSON payload from a `[harjoot] {...}` log line.
// ---------------------------------------------------------------------------

function parseLogLines(spy) {
  return spy.mock.calls.map((args) => args[0]).filter((line) => {
    return typeof line === "string" && line.startsWith("[harjoot] {");
  }).map((line) => JSON.parse(line.slice("[harjoot] ".length)));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("httpClient — correlation propagation", () => {
  test("adds X-Correlation-ID to outgoing axios config when a context is active", async () => {
    fakeAxios._setImpl(async (cfg) => ({ status: 200, config: cfg, data: { ok: true } }));
    const client = createHttpClient(testConfig);

    await runWithCorrelationId("req-test-abc", async () => {
      await client.getPartnerInfo();
    });

    const cfg = fakeAxios._seenConfigs[0];
    expect(cfg.headers["X-Correlation-ID"]).toBe("req-test-abc");
  });

  test("omits X-Correlation-ID when no context is active", async () => {
    fakeAxios._setImpl(async (cfg) => ({ status: 200, config: cfg, data: { ok: true } }));
    const client = createHttpClient(testConfig);

    await client.getPartnerInfo();

    const cfg = fakeAxios._seenConfigs[0];
    expect(cfg.headers["X-Correlation-ID"]).toBeUndefined();
  });
});

describe("httpClient — structured logging", () => {
  test("emits a request log with method, url, correlation_id and retry_count=0", async () => {
    fakeAxios._setImpl(async (cfg) => ({ status: 200, config: cfg, data: { ok: true } }));
    const client = createHttpClient(testConfig);

    await runWithCorrelationId("req-log-1", async () => {
      await client.getPartnerInfo();
    });

    const events = parseLogLines(logSpy);
    const req = events.find((e) => e.event === "harjoot_request");
    expect(req).toBeDefined();
    expect(req.method).toBe("GET");
    expect(req.url).toBe("/partners/me");
    expect(req.correlation_id).toBe("req-log-1");
    expect(req.retry_count).toBe(0);
    // x-api-key MUST NOT appear in logged headers.
    const headerKeys = Object.keys(req.headers || {}).map((k) => k.toLowerCase());
    expect(headerKeys).not.toContain("x-api-key");
  });

  test("emits a response log with status and latency_ms", async () => {
    fakeAxios._setImpl(async (cfg) => ({ status: 200, config: cfg, data: { ok: true } }));
    const client = createHttpClient(testConfig);

    await runWithCorrelationId("req-log-2", async () => {
      await client.getPartnerInfo();
    });

    const events = parseLogLines(logSpy);
    const resp = events.find((e) => e.event === "harjoot_response");
    expect(resp).toBeDefined();
    expect(resp.status).toBe(200);
    expect(resp.correlation_id).toBe("req-log-2");
    expect(typeof resp.latency_ms).toBe("number");
    expect(resp.latency_ms).toBeGreaterThanOrEqual(0);
  });

  test("emits a retry log with retry_count incremented on a 500", async () => {
    let callIdx = 0;
    fakeAxios._setImpl(async (cfg) => {
      callIdx += 1;
      if (callIdx === 1) {
        const err = new Error("server boom");
        err.response = { status: 503, data: { error: "down" } };
        err.config = cfg;
        throw err;
      }
      return { status: 200, config: cfg, data: { ok: true } };
    });
    const client = createHttpClient(testConfig);

    await runWithCorrelationId("req-retry", async () => {
      await client.getPartnerInfo();
    });

    const warnEvents = parseLogLines(warnSpy);
    const retry = warnEvents.find((e) => e.event === "harjoot_retry");
    expect(retry).toBeDefined();
    expect(retry.status).toBe(503);
    expect(retry.retry_count).toBe(1);
    expect(retry.correlation_id).toBe("req-retry");
    expect(typeof retry.delay_ms).toBe("number");
  });

  test("emits a structured error log on a non-retryable failure", async () => {
    fakeAxios._setImpl(async (cfg) => {
      const err = new Error("bad request");
      err.response = { status: 400, data: { error: "validation" } };
      err.config = cfg;
      throw err;
    });
    const client = createHttpClient(testConfig);

    await runWithCorrelationId("req-400", async () => {
      await expect(client.getPartnerInfo()).rejects.toBeDefined();
    });

    const errEvents = parseLogLines(errorSpy);
    const errEvent = errEvents.find((e) => e.event === "harjoot_error");
    expect(errEvent).toBeDefined();
    expect(errEvent.status).toBe(400);
    expect(errEvent.correlation_id).toBe("req-400");
    expect(errEvent.error_name).toBeTruthy();
  });
});
