// backend/harjoot/client/__tests__/httpClient.test.js
//
// Unit tests for the real Harjoot HTTP client.
// Axios is mocked so the tests verify request shape, error mapping, and retry
// behaviour without hitting any network.

jest.mock("axios");
const axios = require("axios");

// Silence the client's console output during tests. Individual tests that
// want to assert log content can re-enable a single channel via jest.spyOn.
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

const { createHttpClient, ROLE_TO_SEGMENT } = require("../httpClient");
const {
  HarjootAuthError,
  HarjootRateLimitError,
  HarjootValidationError,
  HarjootNotFoundError,
  HarjootServerError,
  HarjootUnavailableError,
  HarjootError,
} = require("../errors");

const testConfig = Object.freeze({
  api: Object.freeze({
    baseUrl: "https://harjoot.test/api/partner/hackchain/v1",
    apiKey: "test-key-xyz",
    timeoutMs: 1000,
    maxRetries: 2,
    retryBaseDelayMs: 1, // keep tests fast
  }),
});

// Build a fake axios instance whose interceptors run the same way as the
// real one. We expose a request shim per test so we can control responses.
function buildFakeAxiosInstance() {
  const instance = {
    interceptors: {
      request: { handlers: [], use(fn) { this.handlers.push(fn); } },
      response: { handlers: [], use(ok, err) { this.handlers.push({ ok, err }); } },
    },
    // The actual implementation injected per test:
    _impl: null,
  };

  async function callable(config) {
    // Run request interceptors
    let cfg = config;
    for (const handler of instance.interceptors.request.handlers) {
      cfg = handler(cfg);
    }
    // Run the impl
    let result;
    try {
      result = await instance._impl(cfg);
    } catch (err) {
      // Run response error interceptors
      for (const { err: errHandler } of instance.interceptors.response.handlers) {
        if (errHandler) {
          try {
            return await errHandler(err);
          } catch (mapped) {
            err = mapped;
          }
        }
      }
      throw err;
    }
    // Run response success interceptors
    for (const { ok } of instance.interceptors.response.handlers) {
      if (ok) result = ok(result);
    }
    return result;
  }

  // Method helpers
  callable.get = (url, opts = {}) => callable({ method: "get", url, ...opts, headers: instance._headers });
  callable.post = (url, data, opts = {}) => callable({ method: "post", url, data, ...opts, headers: instance._headers });

  // Attach interceptors property
  callable.interceptors = instance.interceptors;
  callable._setImpl = (fn) => { instance._impl = fn; };
  callable._setHeaders = (h) => { instance._headers = h; };

  return callable;
}

describe("httpClient — createHttpClient", () => {
  let fakeAxios;

  beforeEach(() => {
    fakeAxios = buildFakeAxiosInstance();
    axios.create.mockImplementation((createOpts) => {
      fakeAxios._setHeaders(createOpts.headers);
      return fakeAxios;
    });
  });

  // -------------------------------------------------------------------------
  // axios.create configuration
  // -------------------------------------------------------------------------

  test("creates axios with baseURL, timeout, and x-api-key header", () => {
    createHttpClient(testConfig);
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: testConfig.api.baseUrl,
      timeout: testConfig.api.timeoutMs,
      headers: { "x-api-key": testConfig.api.apiKey },
    });
  });

  // -------------------------------------------------------------------------
  // getPartnerInfo — Section 0
  // -------------------------------------------------------------------------

  test("getPartnerInfo calls GET /partners/me and returns response data", async () => {
    const payload = { partner: { slug: "hackchain", active: true }, modes: ["hash_only"] };
    fakeAxios._setImpl(async (cfg) => {
      expect(cfg.method).toBe("get");
      expect(cfg.url).toBe("/partners/me");
      return { status: 200, data: payload, config: cfg };
    });

    const client = createHttpClient(testConfig);
    const result = await client.getPartnerInfo();
    expect(result).toEqual(payload);
  });

  // -------------------------------------------------------------------------
  // activateAccess — Section 2 — role to segment mapping + body shape
  // -------------------------------------------------------------------------

  test("activateAccess maps issuer role to educator segment and includes issuer profile", async () => {
    const user = { id: 42, wallet_address: "0xabc", role: "issuer", name: "Edu", lastname: "Cator", email: "e@x.com" };
    const profile = { organization_name: "Cyber Academy" };

    let receivedBody;
    fakeAxios._setImpl(async (cfg) => {
      expect(cfg.method).toBe("post");
      expect(cfg.url).toBe("/access/activate");
      receivedBody = cfg.data;
      return { status: 200, data: { success: true }, config: cfg };
    });

    const client = createHttpClient(testConfig);
    await client.activateAccess("issuer", user, profile);

    expect(receivedBody.segment).toBe("educator");
    expect(receivedBody.external_user_id).toBe("42");
    expect(receivedBody.user).toEqual({
      id: 42,
      wallet_address: "0xabc",
      role: "issuer",
      name: "Edu",
      lastname: "Cator",
      email: "e@x.com",
    });
    expect(receivedBody.issuer).toEqual({ organization_name: "Cyber Academy" });
    expect(receivedBody.student).toBeUndefined();
    expect(receivedBody.recruiter).toBeUndefined();
  });

  test.each([
    ["student", "talent", "student"],
    ["issuer", "educator", "issuer"],
    ["recruiter", "recruiter", "recruiter"],
  ])("activateAccess(%s) sends segment=%s and includes the %s profile key", async (role, segment, profileKey) => {
    fakeAxios._setImpl(async (cfg) => ({ status: 200, data: {}, config: cfg }));
    const client = createHttpClient(testConfig);
    let body;
    fakeAxios._setImpl(async (cfg) => { body = cfg.data; return { status: 200, data: {}, config: cfg }; });

    await client.activateAccess(role, { id: 1, wallet_address: "0x", role }, { foo: "bar" });
    expect(body.segment).toBe(segment);
    expect(body[profileKey]).toEqual({ foo: "bar" });
  });

  test("activateAccess strips sensitive fields from user payload", async () => {
    const user = {
      id: 7,
      wallet_address: "0x",
      role: "student",
      name: "S",
      lastname: "T",
      email: "s@t.com",
      passwordHash: "DO_NOT_LEAK",
      privateKey: "DO_NOT_LEAK_EITHER",
    };

    let body;
    fakeAxios._setImpl(async (cfg) => { body = cfg.data; return { status: 200, data: {}, config: cfg }; });

    const client = createHttpClient(testConfig);
    await client.activateAccess("student", user, {});
    expect(body.user.passwordHash).toBeUndefined();
    expect(body.user.privateKey).toBeUndefined();
  });

  test("activateAccess throws TypeError on unknown role (before any HTTP)", async () => {
    fakeAxios._setImpl(async () => { throw new Error("HTTP must not be called"); });
    const client = createHttpClient(testConfig);
    await expect(
      client.activateAccess("admin", { id: 1, wallet_address: "0x" }, {}),
    ).rejects.toThrow(TypeError);
  });

  // -------------------------------------------------------------------------
  // checkAccess — Section 3
  // -------------------------------------------------------------------------

  test("checkAccess sends wallet_address and segment as query params", async () => {
    let receivedConfig;
    fakeAxios._setImpl(async (cfg) => {
      receivedConfig = cfg;
      return { status: 200, data: { active: true, expires_at: "2026-12-31" }, config: cfg };
    });

    const client = createHttpClient(testConfig);
    const result = await client.checkAccess("0xWALLET", "student");

    expect(receivedConfig.method).toBe("get");
    expect(receivedConfig.url).toBe("/access/status");
    expect(receivedConfig.params).toEqual({ wallet_address: "0xWALLET", segment: "talent" });
    expect(result).toEqual({ active: true, expires_at: "2026-12-31" });
  });

  // -------------------------------------------------------------------------
  // uploadCertificate — Section 4
  // -------------------------------------------------------------------------

  test("uploadCertificate POSTs the payload as-is and returns response data", async () => {
    const payload = {
      idempotency_key: "cert-uuid-v1",
      processing: { mode: "hash_only" },
      issuer: { wallet_address: "0xi" },
      student: { wallet_address: "0xs" },
      certificate: { id: "CERT-1", title: "T", certificate_hash: "a".repeat(64), issue_date: "2026-01-01" },
      document: { filename: "c.pdf", content_type: "application/pdf", hash: "a".repeat(64) },
    };
    const upstreamData = { success: true, certificate: { verificationId: "HJ-P-2026-X" } };

    let received;
    fakeAxios._setImpl(async (cfg) => {
      received = cfg;
      return { status: 200, data: upstreamData, config: cfg };
    });

    const client = createHttpClient(testConfig);
    const result = await client.uploadCertificate(payload);

    expect(received.method).toBe("post");
    expect(received.url).toBe("/certificates/upload");
    expect(received.data).toBe(payload);
    expect(result).toEqual(upstreamData);
  });

  // -------------------------------------------------------------------------
  // notifyPayment — Section 13 (stub)
  // -------------------------------------------------------------------------

  test("notifyPayment throws a typed not-configured error (TODO 6)", async () => {
    const client = createHttpClient(testConfig);
    await expect(client.notifyPayment(["HJ-1"], "0xTX")).rejects.toMatchObject({
      name: "HarjootError",
      code: "HARJOOT_PAYMENT_NOTIFY_NOT_CONFIGURED",
      status: 501,
    });
  });

  // -------------------------------------------------------------------------
  // Error mapping (response interceptor)
  // -------------------------------------------------------------------------

  test.each([
    [401, HarjootAuthError],
    [403, HarjootAuthError],
    [404, HarjootNotFoundError],
    [422, HarjootValidationError],
    [400, HarjootValidationError],
    [429, HarjootRateLimitError],
  ])("maps upstream %i to %p", async (status, ErrorClass) => {
    fakeAxios._setImpl(async () => {
      const err = new Error("upstream");
      err.response = { status, data: { error: "upstream" } };
      err.config = { method: "get", url: "/partners/me", _retryCount: 0 };
      throw err;
    });

    const client = createHttpClient(testConfig);
    await expect(client.getPartnerInfo()).rejects.toBeInstanceOf(ErrorClass);
  });

  test("maps network errors (no response) to HarjootUnavailableError", async () => {
    fakeAxios._setImpl(async () => {
      const err = new Error("ECONNRESET");
      err.code = "ECONNRESET";
      err.config = { method: "get", url: "/partners/me", _retryCount: 999 }; // skip retries
      throw err;
    });

    const client = createHttpClient(testConfig);
    await expect(client.getPartnerInfo()).rejects.toBeInstanceOf(HarjootUnavailableError);
  });

  // -------------------------------------------------------------------------
  // Retry behaviour
  // -------------------------------------------------------------------------

  test("retries on 5xx up to maxRetries then maps to HarjootServerError", async () => {
    let attempts = 0;
    fakeAxios._setImpl(async (cfg) => {
      attempts += 1;
      const err = new Error("upstream 500");
      err.response = { status: 500, data: { error: "boom" } };
      err.config = cfg;
      throw err;
    });

    const client = createHttpClient(testConfig);
    await expect(client.getPartnerInfo()).rejects.toBeInstanceOf(HarjootServerError);
    // First attempt + maxRetries retries = 1 + 2 = 3
    expect(attempts).toBe(testConfig.api.maxRetries + 1);
  });

  test("retries on network error then maps to HarjootUnavailableError when exhausted", async () => {
    let attempts = 0;
    fakeAxios._setImpl(async (cfg) => {
      attempts += 1;
      const err = new Error("ETIMEDOUT");
      err.code = "ETIMEDOUT";
      // No err.response — network error.
      err.config = cfg;
      throw err;
    });

    const client = createHttpClient(testConfig);
    await expect(client.getPartnerInfo()).rejects.toBeInstanceOf(HarjootUnavailableError);
    expect(attempts).toBe(testConfig.api.maxRetries + 1);
  });

  test("does NOT retry on 4xx (client errors are deterministic)", async () => {
    let attempts = 0;
    fakeAxios._setImpl(async (cfg) => {
      attempts += 1;
      const err = new Error("bad request");
      err.response = { status: 422, data: { error: "validation" } };
      err.config = cfg;
      throw err;
    });

    const client = createHttpClient(testConfig);
    await expect(client.getPartnerInfo()).rejects.toBeInstanceOf(HarjootValidationError);
    expect(attempts).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Header sanitization
  // -------------------------------------------------------------------------

  test("request interceptor does NOT log the x-api-key", async () => {
    const logSpy = jest.spyOn(console, "log");
    logSpy.mockClear();

    fakeAxios._setImpl(async (cfg) => ({ status: 200, data: {}, config: cfg }));
    const client = createHttpClient(testConfig);
    await client.getPartnerInfo();

    const allLoggedArgs = logSpy.mock.calls.flat();
    const allLoggedJson = JSON.stringify(allLoggedArgs);
    expect(allLoggedJson).not.toContain(testConfig.api.apiKey);
  });
});

// -----------------------------------------------------------------------------
// ROLE_TO_SEGMENT constant
// -----------------------------------------------------------------------------

describe("ROLE_TO_SEGMENT", () => {
  test("maps the three HackChain roles to Harjoot segments", () => {
    expect(ROLE_TO_SEGMENT.student).toBe("talent");
    expect(ROLE_TO_SEGMENT.issuer).toBe("educator");
    expect(ROLE_TO_SEGMENT.recruiter).toBe("recruiter");
  });

  test("is frozen — mutations are silently rejected and the value is preserved", () => {
    ROLE_TO_SEGMENT.student = "hacked";
    expect(ROLE_TO_SEGMENT.student).toBe("talent");
    expect(Object.isFrozen(ROLE_TO_SEGMENT)).toBe(true);
  });
});
