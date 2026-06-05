// backend/harjoot/strategies/factory.js
//
// Selects the conversion strategy at startup based on
// TREASURY_CONVERSION_MODE. Validates that the chosen module honors
// the IConversionStrategy contract.
//
// Modes:
//   "manual"      -> manualConversion       (default, launch)
//   "swap"        -> dexSwapConversion      (stub, DS TODO 3)
//   "burn_redeem" -> burnRedeemConversion   (stub, DS TODO 3)

const { assertIsConversionStrategy } = require("./IConversionStrategy");
const manualConversion      = require("./manualConversion");
const dexSwapConversion     = require("./dexSwapConversion");
const burnRedeemConversion  = require("./burnRedeemConversion");

const MODE_MANUAL       = "manual";
const MODE_SWAP         = "swap";
const MODE_BURN_REDEEM  = "burn_redeem";

const REGISTRY = Object.freeze({
  [MODE_MANUAL]:      manualConversion,
  [MODE_SWAP]:        dexSwapConversion,
  [MODE_BURN_REDEEM]: burnRedeemConversion,
});

// Shape-check every registered strategy at module load so a missing
// `convert` function is caught at boot, not at the first treasury cron tick.
for (const [name, strategy] of Object.entries(REGISTRY)) {
  assertIsConversionStrategy(name, strategy);
}

/**
 * @param {string} [mode] Override env (mostly for tests).
 * @returns {{ mode: string, strategy: { convert: Function } }}
 */
function selectStrategy(mode) {
  const chosen = mode || process.env.TREASURY_CONVERSION_MODE || MODE_MANUAL;
  if (!Object.prototype.hasOwnProperty.call(REGISTRY, chosen)) {
    throw new Error(
      `Unknown TREASURY_CONVERSION_MODE=${chosen}. ` +
        `Allowed: ${Object.keys(REGISTRY).join(", ")}`,
    );
  }
  return { mode: chosen, strategy: REGISTRY[chosen] };
}

module.exports = {
  selectStrategy,
  // Exposed for tests asserting on the registry.
  __REGISTRY: REGISTRY,
  MODES: Object.freeze({ MANUAL: MODE_MANUAL, SWAP: MODE_SWAP, BURN_REDEEM: MODE_BURN_REDEEM }),
};
