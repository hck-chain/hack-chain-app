// backend/harjoot/strategies/__tests__/strategies.test.js
//
// Covers (a) the manual strategy (the only real one for launch),
// (b) the two stubs (must throw NOT_IMPLEMENTED to prevent silent
// settlements), (c) the IConversionStrategy shape assertion, and
// (d) the factory's env-driven selection.

const ORIGINAL_ENV = { ...process.env };

function loadFreshFactory(envOverrides = {}) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...envOverrides };
  return require("../factory");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// manualConversion
// ---------------------------------------------------------------------------

describe("manualConversion", () => {
  const { convert } = require("../manualConversion");

  test("returns { mode: 'manual', awaitingManual: true } for any positive hackAmount", async () => {
    const result = await convert({ hackAmount: 6900n });
    expect(result).toEqual({ mode: "manual", awaitingManual: true });
  });

  test("throws TypeError when hackAmount is not a positive bigint", async () => {
    await expect(convert({ hackAmount: 0n })).rejects.toThrow(TypeError);
    await expect(convert({ hackAmount: -1n })).rejects.toThrow(TypeError);
    await expect(convert({ hackAmount: 6900 })).rejects.toThrow(TypeError); // number, not bigint
    await expect(convert({})).rejects.toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// Stubs — MUST throw, never silently succeed
// ---------------------------------------------------------------------------

describe("conversion stubs", () => {
  test("dexSwapConversion throws NOT_IMPLEMENTED", async () => {
    const { convert } = require("../dexSwapConversion");
    await expect(convert({ hackAmount: 6900n })).rejects.toThrow(/not implemented/i);
  });

  test("burnRedeemConversion throws NOT_IMPLEMENTED", async () => {
    const { convert } = require("../burnRedeemConversion");
    await expect(convert({ hackAmount: 6900n })).rejects.toThrow(/not implemented/i);
  });
});

// ---------------------------------------------------------------------------
// IConversionStrategy shape check
// ---------------------------------------------------------------------------

describe("assertIsConversionStrategy", () => {
  const { assertIsConversionStrategy } = require("../IConversionStrategy");

  test("accepts a strategy with a convert function", () => {
    expect(() => assertIsConversionStrategy("ok", { convert: () => {} })).not.toThrow();
  });

  test("throws when convert is missing", () => {
    expect(() => assertIsConversionStrategy("broken", {})).toThrow(TypeError);
    expect(() => assertIsConversionStrategy("nope", null)).toThrow(TypeError);
    expect(() => assertIsConversionStrategy("notFunc", { convert: 42 })).toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe("factory.selectStrategy", () => {
  test("defaults to manual when TREASURY_CONVERSION_MODE is unset", () => {
    const factory = loadFreshFactory({ TREASURY_CONVERSION_MODE: "" });
    const { mode, strategy } = factory.selectStrategy();
    expect(mode).toBe("manual");
    expect(typeof strategy.convert).toBe("function");
  });

  test("explicit 'manual' selects manualConversion", () => {
    const factory = loadFreshFactory();
    const { mode, strategy } = factory.selectStrategy("manual");
    expect(mode).toBe("manual");
    // It's the same module as ../manualConversion exports.
    expect(strategy).toBe(require("../manualConversion"));
  });

  test("'swap' selects dexSwapConversion", () => {
    const factory = loadFreshFactory();
    const { mode, strategy } = factory.selectStrategy("swap");
    expect(mode).toBe("swap");
    expect(strategy).toBe(require("../dexSwapConversion"));
  });

  test("'burn_redeem' selects burnRedeemConversion", () => {
    const factory = loadFreshFactory();
    const { mode, strategy } = factory.selectStrategy("burn_redeem");
    expect(mode).toBe("burn_redeem");
    expect(strategy).toBe(require("../burnRedeemConversion"));
  });

  test("env-driven selection picks up TREASURY_CONVERSION_MODE", () => {
    const factory = loadFreshFactory({ TREASURY_CONVERSION_MODE: "swap" });
    expect(factory.selectStrategy().mode).toBe("swap");
  });

  test("throws on an unknown mode (typo defense)", () => {
    const factory = loadFreshFactory();
    expect(() => factory.selectStrategy("manaul")).toThrow(/Unknown TREASURY_CONVERSION_MODE/i);
  });

  test("MODES export is a frozen lookup", () => {
    const factory = loadFreshFactory();
    expect(factory.MODES).toEqual({ MANUAL: "manual", SWAP: "swap", BURN_REDEEM: "burn_redeem" });
    expect(Object.isFrozen(factory.MODES)).toBe(true);
  });

  test("__REGISTRY contains every advertised mode", () => {
    const factory = loadFreshFactory();
    expect(Object.keys(factory.__REGISTRY).sort()).toEqual(
      ["burn_redeem", "manual", "swap"].sort(),
    );
    // Each entry is shape-conformant.
    for (const strategy of Object.values(factory.__REGISTRY)) {
      expect(typeof strategy.convert).toBe("function");
    }
  });
});
