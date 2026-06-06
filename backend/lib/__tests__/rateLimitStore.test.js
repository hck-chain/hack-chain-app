// backend/lib/__tests__/rateLimitStore.test.js

const buildRateLimitStore = require("../rateLimitStore");

const ORIGINAL_ENV = { ...process.env };

let warnSpy;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.REDIS_URL;
  jest.resetModules();
  buildRateLimitStore.__resetWarnings();
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  process.env = { ...ORIGINAL_ENV };
});

describe("buildRateLimitStore", () => {
  test("returns undefined when REDIS_URL is unset (MemoryStore fallback)", () => {
    const store = buildRateLimitStore("limiter-a");
    expect(store).toBeUndefined();
  });

  test("warns ONCE per limiter name when falling back to memory", () => {
    buildRateLimitStore("limiter-a");
    buildRateLimitStore("limiter-a"); // second call same name
    buildRateLimitStore("limiter-b"); // different name -> separate warn
    expect(warnSpy).toHaveBeenCalledTimes(2);
    const messages = warnSpy.mock.calls.map(([m]) => m);
    expect(messages.some((m) => m.includes("limiter-a"))).toBe(true);
    expect(messages.some((m) => m.includes("limiter-b"))).toBe(true);
  });

  test("__resetWarnings restores the warn channel", () => {
    buildRateLimitStore("limiter-x");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    buildRateLimitStore.__resetWarnings();
    buildRateLimitStore("limiter-x");
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  test("returns a RedisStore-shaped object when REDIS_URL is set", () => {
    // Mock the redis service so the lazy require doesn't try to connect.
    jest.doMock("../../services/redis", () => ({
      getRedis: () => ({
        call: jest.fn().mockResolvedValue("OK"),
      }),
    }));
    process.env.REDIS_URL = "redis://localhost:6379";

    // Re-require to pick up the mock + the env override.
    jest.resetModules();
    const freshBuild = require("../rateLimitStore");

    const store = freshBuild("limiter-real");
    expect(store).toBeDefined();
    // express-rate-limit stores expose increment / decrement / resetKey /
    // resetAll. We just sanity-check that one of these exists rather than
    // trying to assert on instanceof (RedisStore is an ESM class in v4+).
    expect(typeof store.increment).toBe("function");
    expect(typeof store.resetKey).toBe("function");
    expect(warnSpy).not.toHaveBeenCalled(); // Redis path warns nothing
  });
});
