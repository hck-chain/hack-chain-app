// backend/services/__tests__/paymentService.test.js
//
// Unit tests for the pure pricing helper. Configuration is read at module
// load time, so each test that needs a different env config must reset the
// module cache and re-require both paymentService and harjoot/config.

const ORIGINAL_ENV = { ...process.env };

function loadFresh(envOverrides = {}) {
  jest.resetModules();
  // Restore env to baseline, then apply overrides.
  process.env = { ...ORIGINAL_ENV, ...envOverrides };
  // Order matters: paymentService requires harjoot/config which validates env.
  return require("../paymentService");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe("paymentService.calculateMintPrice", () => {
  test("default launch pricing yields 6900 HACK ($0.69 / $0.0001)", () => {
    const { calculateMintPrice } = loadFresh();
    const result = calculateMintPrice();
    expect(result.amountHack).toBe(6900n);
    expect(result.userPriceUsdCents).toBe(69);
    expect(result.harjootCostUsdCents).toBe(20);
    expect(result.grossMarginUsdCents).toBe(49);
  });

  test("returns the configured treasury + HACK token addresses, lowercased", () => {
    const { calculateMintPrice } = loadFresh({
      TREASURY_ADDRESS: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
      HACK_TOKEN_ADDRESS: "0x1234567890ABCDEF1234567890ABCDEF12345678",
    });
    const result = calculateMintPrice();
    expect(result.treasuryAddress).toBe("0xabcdef1234567890abcdef1234567890abcdef12");
    expect(result.hackTokenAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
  });

  test("respects a custom USER_PRICE_USD_CENTS", () => {
    const { calculateMintPrice } = loadFresh({ USER_PRICE_USD_CENTS: "100" });
    // 100 cents * 10_000 micros/cent / 100 micros/HACK = 10000 HACK
    expect(calculateMintPrice().amountHack).toBe(10000n);
  });

  test("respects a custom HACK_PRICE_USD_MICROS", () => {
    // 1 HACK = $0.001 (1000 micros). 69 cents / $0.001 = 690 HACK.
    const { calculateMintPrice } = loadFresh({ HACK_PRICE_USD_MICROS: "1000" });
    expect(calculateMintPrice().amountHack).toBe(690n);
  });

  test("grossMarginUsdCents reflects USER_PRICE - HARJOOT_PRICE", () => {
    const { calculateMintPrice } = loadFresh({
      USER_PRICE_USD_CENTS: "200",
      HARJOOT_PRICE_USD_CENTS: "50",
    });
    expect(calculateMintPrice().grossMarginUsdCents).toBe(150);
  });

  test("throws when pricing does not divide evenly (precision guard)", () => {
    // 69 cents * 10_000 = 690_000 micros. 690_000 % 7 != 0.
    const { calculateMintPrice } = loadFresh({ HACK_PRICE_USD_MICROS: "7" });
    expect(() => calculateMintPrice()).toThrow(/does not divide evenly/i);
  });

  test("throws when HACK_PRICE_USD_MICROS is configured as zero", () => {
    const { calculateMintPrice } = loadFresh({ HACK_PRICE_USD_MICROS: "0" });
    expect(() => calculateMintPrice()).toThrow(/cannot be zero/i);
  });
});

describe("harjoot/config address validation", () => {
  test("rejects a malformed TREASURY_ADDRESS at module load", () => {
    expect(() => loadFresh({ TREASURY_ADDRESS: "not-an-address" })).toThrow(
      /TREASURY_ADDRESS must be a 0x-prefixed 40-hex-char address/i,
    );
  });

  test("rejects a malformed HACK_TOKEN_ADDRESS at module load", () => {
    expect(() => loadFresh({ HACK_TOKEN_ADDRESS: "0xdeadbeef" })).toThrow(
      /HACK_TOKEN_ADDRESS must be a 0x-prefixed 40-hex-char address/i,
    );
  });
});

// Note: paymentService.verifyHackPayment has its own dedicated suite
// at services/__tests__/verifyHackPayment.test.js — receipt decoding,
// replay protection, and persistence are exercised there with SQLite.
