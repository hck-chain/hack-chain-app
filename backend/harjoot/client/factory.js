// backend/harjoot/client/factory.js
//
// Single entry point for obtaining a Harjoot client. The choice between the
// real HTTP-backed client and the in-process mock is driven by `config.useMock`
// (env var HARJOOT_USE_MOCK), so callers don't have to know or care which one
// they got — only the public surface matters.

const defaultConfig = require("../config");
const { createHttpClient } = require("./httpClient");
const { createMockClient } = require("./mockClient");

/**
 * Create a Harjoot client. When `config.useMock` is true the in-process mock
 * is returned; otherwise the real HTTP client is created bound to `config`.
 *
 * @param {typeof defaultConfig} [config]
 * @returns {ReturnType<typeof createHttpClient> | ReturnType<typeof createMockClient>}
 */
function createHarjootClient(config = defaultConfig) {
  if (config && config.useMock) {
    return createMockClient();
  }
  return createHttpClient(config);
}

module.exports = { createHarjootClient };
