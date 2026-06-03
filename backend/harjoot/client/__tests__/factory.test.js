// backend/harjoot/client/__tests__/factory.test.js
//
// Verifies the factory picks the right client based on useMock and that
// callers always receive an object exposing the canonical 5-method surface.

jest.mock("axios");
const axios = require("axios");

// Suppress client logs during construction.
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

const { createHarjootClient } = require("../factory");

const baseConfig = Object.freeze({
  api: Object.freeze({
    baseUrl: "https://harjoot.test/api/partner/hackchain/v1",
    apiKey: "test-key",
    timeoutMs: 1000,
    maxRetries: 1,
    retryBaseDelayMs: 1,
  }),
});

describe("factory.createHarjootClient", () => {
  beforeEach(() => {
    axios.create.mockReturnValue({
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    });
  });

  test("returns the mock client when useMock=true", () => {
    const client = createHarjootClient({ ...baseConfig, useMock: true });
    expect(client.__calls).toBeDefined();
    expect(typeof client.__setNextResponse).toBe("function");
    expect(typeof client.__setNextError).toBe("function");
    expect(typeof client.__reset).toBe("function");
  });

  test("returns the HTTP client when useMock=false", () => {
    const client = createHarjootClient({ ...baseConfig, useMock: false });
    expect(client.__calls).toBeUndefined();
    expect(client.__setNextResponse).toBeUndefined();
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: baseConfig.api.baseUrl,
      timeout: baseConfig.api.timeoutMs,
      headers: { "x-api-key": baseConfig.api.apiKey },
    });
  });

  test("treats absent useMock as false (HTTP client)", () => {
    const client = createHarjootClient(baseConfig);
    expect(client.__calls).toBeUndefined();
  });

  test.each(["getPartnerInfo", "activateAccess", "checkAccess", "uploadCertificate", "notifyPayment"])(
    "both clients expose method %s",
    (methodName) => {
      const http = createHarjootClient({ ...baseConfig, useMock: false });
      const mock = createHarjootClient({ ...baseConfig, useMock: true });
      expect(typeof http[methodName]).toBe("function");
      expect(typeof mock[methodName]).toBe("function");
    },
  );
});
