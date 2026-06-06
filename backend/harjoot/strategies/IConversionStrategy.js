// backend/harjoot/strategies/IConversionStrategy.js
//
// Documentation-only "interface" for the HACK -> USDT conversion step
// of the treasury worker. JavaScript has no enforced interfaces; this
// file exists so every concrete strategy points back at the same
// contract and reviewers can spot drift quickly.
//
// All concrete strategies (manualConversion, dexSwapConversion,
// burnRedeemConversion) MUST export a function named `convert` that
// honors the shape below. The factory in ./factory.js performs a shape
// check at startup so a misconfigured deploy fails loudly instead of
// silently swallowing a treasury batch.
//
// ---------------------------------------------------------------------------
// Conceptual contract
// ---------------------------------------------------------------------------
//
//   convert({ hackAmount, models?, sequelize? }) -> Promise<ConversionResult>
//
//   ConversionResult is a discriminated object:
//
//     | { mode: "manual",      awaitingManual: true }                 // no on-chain action
//     | { mode: "swap",        usdtAmount: bigint, txHash: string,
//                              costs: { gasUsd?: number, slippageUsd?: number } }
//     | { mode: "burn_redeem", usdtAmount: bigint, txHash: string,
//                              costs: { gasUsd?: number } }
//
// `hackAmount` is a positive bigint in WHOLE HACK units (NOT base units —
// the worker aggregates the queue's amount_hack column, which already
// stores whole tokens). Strategies that touch the chain are responsible
// for scaling to base units before signing transactions.
//
// `usdtAmount` is a bigint in USDT base units (6 decimals on Polygon —
// Tether's standard). Caller can format for human display by dividing
// by 10n**6n.
//
// Failure semantics: strategies throw to indicate a hard failure. The
// worker catches and marks the affected rows as `failed` with the
// error message. They MUST NOT silently return a malformed result.

// Re-exported as a typedef so other modules can import it for JSDoc.
/**
 * @typedef {Object} ConversionResult
 * @property {"manual"|"swap"|"burn_redeem"} mode
 * @property {boolean}  [awaitingManual]  Only set for `mode: "manual"`.
 * @property {bigint}   [usdtAmount]      USDT base units (6 decimals).
 * @property {string}   [txHash]          On-chain settlement hash.
 * @property {Object}   [costs]
 * @property {number}   [costs.gasUsd]
 * @property {number}   [costs.slippageUsd]
 */

/**
 * Shape-check a strategy at registration time. Throws if the strategy is
 * missing a `convert(...)` function. Kept in this file so the contract
 * lives alongside its enforcement.
 *
 * @param {string} name
 * @param {object} strategy
 */
function assertIsConversionStrategy(name, strategy) {
  if (!strategy || typeof strategy.convert !== "function") {
    throw new TypeError(
      `${name} does not implement IConversionStrategy: missing convert(...) function`,
    );
  }
}

module.exports = { assertIsConversionStrategy };
