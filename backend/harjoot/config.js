// backend/harjoot/config.js
//
// Centralized configuration for the Harjoot integration module.
//
// Reads environment variables once at module load and freezes the result.
// Required variables throw immediately if missing — server fails to start
// rather than failing later with an opaque error. Optional variables have
// safe defaults defined inline.
//
// Pattern reference: middleware/auth.js validates JWT_SECRET / REFRESH_SECRET
// at module load with the same approach.

require("dotenv").config();

// ---------------------------------------------------------------------------
// Mock mode — checked first because it gates the credential requirement.
// In production this should NEVER be true; in dev/test it lets the backend
// boot without real Harjoot credentials (uses the in-process mock client).
// ---------------------------------------------------------------------------

const USE_MOCK = (process.env.HARJOOT_USE_MOCK === "true" || process.env.HARJOOT_USE_MOCK === "1");

// ---------------------------------------------------------------------------
// Required variables — only when talking to the REAL Harjoot API.
// When HARJOOT_USE_MOCK=true the in-process mock client takes over and these
// values are never read, so we skip validation to keep dev frictionless.
// ---------------------------------------------------------------------------

if (!USE_MOCK) {
  if (!process.env.HARJOOT_API_BASE_URL) {
    throw new Error(
      "HARJOOT_API_BASE_URL environment variable is required " +
        "(or set HARJOOT_USE_MOCK=true to run the backend with the mock client)",
    );
  }

  if (!process.env.HARJOOT_PARTNER_API_KEY) {
    throw new Error(
      "HARJOOT_PARTNER_API_KEY environment variable is required " +
        "(or set HARJOOT_USE_MOCK=true to run the backend with the mock client)",
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseIntWithDefault(value, fallback, name) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer (got "${value}")`);
  }
  return parsed;
}

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === "true" || value === "1";
}

// ---------------------------------------------------------------------------
// Frozen configuration object
// ---------------------------------------------------------------------------

const config = Object.freeze({
  // Harjoot API connection
  api: Object.freeze({
    baseUrl:   process.env.HARJOOT_API_BASE_URL,
    apiKey:    process.env.HARJOOT_PARTNER_API_KEY,
    timeoutMs: parseIntWithDefault(process.env.HARJOOT_TIMEOUT_MS, 10000, "HARJOOT_TIMEOUT_MS"),
    maxRetries: parseIntWithDefault(process.env.HARJOOT_MAX_RETRIES, 2, "HARJOOT_MAX_RETRIES"),
    retryBaseDelayMs: parseIntWithDefault(process.env.HARJOOT_RETRY_BASE_DELAY_MS, 300, "HARJOOT_RETRY_BASE_DELAY_MS"),
  }),

  // Pricing — DS decision 8 RESOLVED 2026-05-22.
  // Integer math only; conversions are done in paymentService.
  pricing: Object.freeze({
    harjootCostUsdCents:  parseIntWithDefault(process.env.HARJOOT_PRICE_USD_CENTS, 20, "HARJOOT_PRICE_USD_CENTS"),
    userPriceUsdCents:    parseIntWithDefault(process.env.USER_PRICE_USD_CENTS, 69, "USER_PRICE_USD_CENTS"),
    hackPriceUsdMicros:   parseIntWithDefault(process.env.HACK_PRICE_USD_MICROS, 100, "HACK_PRICE_USD_MICROS"),
  }),

  // Runtime flags
  useMock: USE_MOCK,
});

module.exports = config;
