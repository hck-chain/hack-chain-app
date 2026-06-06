// backend/harjoot/strategies/dexSwapConversion.js
//
// STUB. DS TODO 3: HACK -> USDT via an on-chain DEX (Uniswap V3 router
// or QuickSwap on Polygon). Blockchain dev owns the implementation;
// this file exists so the factory can select the strategy at startup
// and the worker fails loudly when somebody flips the mode without
// implementing the swap.
//
// Selected when TREASURY_CONVERSION_MODE is "swap".

const NOT_IMPLEMENTED =
  "dexSwapConversion is not implemented yet — DS TODO 3 (blockchain dev). " +
  "Keep TREASURY_CONVERSION_MODE=manual until this lands.";

async function convert(_params) {
  // Intentional throw — silently returning anything here would let the
  // worker think the batch was settled and mark rows as sent.
  throw new Error(NOT_IMPLEMENTED);
}

module.exports = { convert };
