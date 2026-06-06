// backend/harjoot/strategies/burnRedeemConversion.js
//
// STUB. DS TODO 3: HACK is burned and redeemed for USDT against a
// treasury contract. Blockchain dev owns the implementation; the
// factory selects this when TREASURY_CONVERSION_MODE is "burn_redeem".

const NOT_IMPLEMENTED =
  "burnRedeemConversion is not implemented yet — DS TODO 3 (blockchain dev). " +
  "Keep TREASURY_CONVERSION_MODE=manual until this lands.";

async function convert(_params) {
  throw new Error(NOT_IMPLEMENTED);
}

module.exports = { convert };
