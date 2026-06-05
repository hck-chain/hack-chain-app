// backend/services/paymentService.js
//
// DS Section 4 — on-chain $HACK payment verification + pricing.
//
// PRICING (DS decision 8, RESOLVED 2026-05-22).
// HackChain pays Harjoot $0.20/cert (config: HARJOOT_PRICE_USD_CENTS=20).
// HackChain charges the educator $0.69/cert (config: USER_PRICE_USD_CENTS=69).
// HackChain gross margin per cert = $0.49 (no commission; just the difference).
//
// Integer math is used end-to-end. Working unit is "HACK micro-dollars":
//   1 HACK costs HACK_PRICE_USD_MICROS micro-dollars
//   $1 = 100 cents = 100 * 10000 micros = 1_000_000 micros
//   So:  cents-to-micros multiplier = 10_000.
//
// The returned amountHack is in WHOLE HACK tokens (not wei / base units).
// The on-chain comparison in verifyHackPayment() multiplies this by the
// token's decimals scale before comparing to the ERC-20 transfer value.

const harjootConfig = require("../harjoot/config");

const NOT_IMPLEMENTED =
  "Payment verification not implemented yet — see documents/harjoot-integration-handoff.md";

const CENTS_PER_DOLLAR = 100;
const MICROS_PER_CENT = 10_000;

/**
 * DS Section 4 — verify a $HACK token payment on-chain.
 *
 * @param {string}        txHash               ERC-20 transfer transaction hash.
 * @param {string}        educatorWallet       Expected sender (lowercased).
 * @param {string|bigint} expectedAmountHack   Minimum HACK amount required.
 * @returns {Promise<{paymentId: string, confirmed: boolean}>}
 * @throws {Error} not implemented
 */
async function verifyHackPayment(txHash, educatorWallet, expectedAmountHack) {
  // TODO(impl): DS Section 4 (Phase 7c).
  //  - provider.getTransactionReceipt(txHash).
  //  - decode the ERC-20 Transfer event; validate: receipt status success,
  //    token address === HACK_TOKEN_ADDRESS, from === educatorWallet,
  //    to === TREASURY_ADDRESS, value >= expectedAmountHack.
  //  - reject a txHash already recorded in `payments` (replay protection).
  //  - on success, INSERT a row into the `payments` table and return its id.
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * DS Section 4 — compute how much $HACK an educator must pay per certificate.
 * Pure pricing helper. Integer math only.
 *
 * Formula:
 *   amountHack = USER_PRICE_USD_CENTS * MICROS_PER_CENT / HACK_PRICE_USD_MICROS
 *
 * With launch values (69 cents, 100 micros/HACK):
 *   amountHack = 69 * 10_000 / 100 = 6900 HACK
 *
 * @returns {{
 *   amountHack: bigint,
 *   userPriceUsdCents: number,
 *   harjootCostUsdCents: number,
 *   grossMarginUsdCents: number,
 *   treasuryAddress: string,
 *   hackTokenAddress: string,
 * }}
 * @throws {Error} when integer division would lose precision (i.e. the
 *   educator price is not an exact multiple of the HACK unit price).
 */
function calculateMintPrice() {
  const { userPriceUsdCents, harjootCostUsdCents, hackPriceUsdMicros } = harjootConfig.pricing;
  const { treasuryAddress, hackTokenAddress } = harjootConfig.chain;

  // BigInt to avoid any silent precision loss for future larger prices.
  const userPriceMicros = BigInt(userPriceUsdCents) * BigInt(MICROS_PER_CENT);
  const hackUnitMicros  = BigInt(hackPriceUsdMicros);

  if (hackUnitMicros === 0n) {
    throw new Error("HACK_PRICE_USD_MICROS cannot be zero");
  }
  if (userPriceMicros % hackUnitMicros !== 0n) {
    // Refuse to silently truncate; pricing must divide evenly. Catching this
    // early makes mispriced configs fail fast at the precheck endpoint.
    throw new Error(
      `Pricing is not exact: ${userPriceUsdCents} cents / ${hackPriceUsdMicros} micros ` +
        "does not divide evenly. Adjust USER_PRICE_USD_CENTS or HACK_PRICE_USD_MICROS.",
    );
  }

  const amountHack = userPriceMicros / hackUnitMicros;

  return {
    amountHack,
    userPriceUsdCents,
    harjootCostUsdCents,
    grossMarginUsdCents: userPriceUsdCents - harjootCostUsdCents,
    treasuryAddress,
    hackTokenAddress,
  };
}

module.exports = {
  verifyHackPayment,
  calculateMintPrice,
  // Exposed only for tests asserting against the conversion constants.
  __CENTS_PER_DOLLAR: CENTS_PER_DOLLAR,
  __MICROS_PER_CENT: MICROS_PER_CENT,
};
