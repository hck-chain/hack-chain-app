// backend/services/paymentService.js
//
// SKELETON — on-chain $HACK payment verification.
// Implementation pending. See documents/harjoot-integration-handoff.md.
//
// DS Section 4. Verifies that an educator paid the required amount of $HACK
// (ERC-20 on Polygon) to the Treasury wallet before a certificate is issued.
//
// PRICING (DS decision 8, RESOLVED 2026-05-22). See the handoff doc for details.
// HackChain pays Harjoot $0.20/cert (config: HARJOOT_PRICE_USD_CENTS=20).
// HackChain charges the educator $0.69/cert (config: USER_PRICE_USD_CENTS=69).
// HackChain gross margin per cert = $0.49 (no commission; just the difference).

const NOT_IMPLEMENTED =
  "Payment verification not implemented yet — see documents/harjoot-integration-handoff.md";

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
  // TODO(impl): DS Section 4.
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
 * Pure pricing helper. Use integer math to avoid floating-point errors.
 *
 * @returns {{amountHack: bigint, harjootPriceUsdCents: number, commissionUsdCents: number}}
 * @throws {Error} not implemented
 */
function calculateMintPrice() {
  // TODO(impl): DS decision 8 — pricing (RESOLVED 2026-05-22).
  //  Config keys (see handoff doc): HARJOOT_PRICE_USD_CENTS (launch: 20),
  //  USER_PRICE_USD_CENTS (launch: 69), HACK_PRICE_USD_MICROS (= 100).
  //  Integer-math formula:
  //    amountHack = USER_PRICE_USD_CENTS * 10000 / HACK_PRICE_USD_MICROS.
  //  HackChain gross margin = USER_PRICE_USD_CENTS - HARJOOT_PRICE_USD_CENTS.
  //  No commission — margin is the difference between user price and Harjoot cost.
  throw new Error(NOT_IMPLEMENTED);
}

module.exports = { verifyHackPayment, calculateMintPrice };
