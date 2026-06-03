// backend/harjoot/client/index.js
//
// Public barrel for the Harjoot client. Consumers should import from here
// rather than reaching into the individual files.

const { createHarjootClient } = require("./factory");
const { createHttpClient, ROLE_TO_SEGMENT } = require("./httpClient");
const { createMockClient } = require("./mockClient");
const errors = require("./errors");

module.exports = {
  createHarjootClient,
  createHttpClient,
  createMockClient,
  ROLE_TO_SEGMENT,
  ...errors,
};
