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

const { Interface } = require("ethers");
const harjootConfig = require("../harjoot/config");

const LOG_PREFIX = "[verifyHackPayment]";
const CENTS_PER_DOLLAR = 100;
const MICROS_PER_CENT = 10_000;
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Cached at module scope — the Interface is stateless and constructing
// it on every call would be wasted work.
const transferIface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
const TRANSFER_TOPIC0 = transferIface.getEvent("Transfer").topicHash;

/**
 * DS Section 4 — verify a $HACK token payment on-chain and record it.
 *
 * Pulls the receipt for `txHash` via `provider`, validates that the
 * educator transferred at least `expectedAmountHack` whole HACK to the
 * configured treasury wallet, then persists a row in `payments`. The
 * tx_hash unique constraint is the DB-level guarantee against replay.
 *
 * @param {object} params
 * @param {object} params.models               db (db.Payment required).
 * @param {object} params.provider             polygonProvider instance with
 *                                             getTransactionReceipt(txHash).
 * @param {string} params.txHash               0x-prefixed 32-byte tx hash.
 * @param {string} params.expectedFrom         Educator wallet (any casing).
 * @param {bigint} params.expectedAmountHack   Whole HACK units required.
 * @param {string} params.purpose              e.g. "certificate_issuance".
 * @param {{ harjootCostUsdCents: number, userPriceUsdCents: number }}
 *         params.pricing                       Snapshot stored on the row.
 * @param {object} [params.config]             Override harjoot/config (tests).
 *
 * @returns {Promise<
 *   | { ok: true, payment: { id: number, txHash: string, fromWallet: string, amountHack: bigint } }
 *   | { ok: false, reason: "TX_NOT_FOUND" | "TX_REVERTED" | "NO_HACK_TRANSFER"
 *                       | "WRONG_RECIPIENT" | "WRONG_SENDER" | "INSUFFICIENT_AMOUNT" }
 *   | { ok: false, reason: "REPLAY", existingPaymentId: number }
 *   | { ok: false, reason: "RPC_ERROR", soft_failed: true, error: string }
 * >}
 */
async function verifyHackPayment(params) {
  const { models, provider, txHash, expectedFrom, expectedAmountHack, purpose, pricing } = params;
  const cfg = params.config || harjootConfig;

  // ---- programmer-error guards ------------------------------------------------
  if (!models || !models.Payment) {
    throw new TypeError("verifyHackPayment requires { models.Payment }");
  }
  if (!provider || typeof provider.getTransactionReceipt !== "function") {
    throw new TypeError("verifyHackPayment requires { provider.getTransactionReceipt }");
  }
  if (typeof txHash !== "string" || !TX_HASH_REGEX.test(txHash)) {
    throw new TypeError("verifyHackPayment requires a 0x-prefixed 32-byte txHash");
  }
  if (typeof expectedFrom !== "string" || !WALLET_REGEX.test(expectedFrom)) {
    throw new TypeError("verifyHackPayment requires a valid expectedFrom wallet");
  }
  if (typeof expectedAmountHack !== "bigint" || expectedAmountHack <= 0n) {
    throw new TypeError("verifyHackPayment requires expectedAmountHack as a positive bigint");
  }
  if (!purpose || typeof purpose !== "string") {
    throw new TypeError("verifyHackPayment requires a non-empty purpose");
  }
  if (!pricing || typeof pricing.harjootCostUsdCents !== "number" ||
      typeof pricing.userPriceUsdCents !== "number") {
    throw new TypeError(
      "verifyHackPayment requires pricing { harjootCostUsdCents, userPriceUsdCents }",
    );
  }

  const normalizedFrom = expectedFrom.toLowerCase();
  const treasury = cfg.chain.treasuryAddress;
  const hackToken = cfg.chain.hackTokenAddress;
  const decimals = cfg.chain.hackTokenDecimals;

  // ---- (1) replay pre-check ---------------------------------------------------
  // Race window between this check and INSERT is closed by the unique
  // constraint on tx_hash — caught further down.
  const existing = await models.Payment.findOne({ where: { tx_hash: txHash } });
  if (existing) {
    return { ok: false, reason: "REPLAY", existingPaymentId: existing.id };
  }

  // ---- (2) fetch receipt ------------------------------------------------------
  let receipt;
  try {
    receipt = await provider.getTransactionReceipt(txHash);
  } catch (err) {
    console.error(`${LOG_PREFIX} provider failure for ${txHash}: ${err.message || err}`);
    return { ok: false, reason: "RPC_ERROR", soft_failed: true, error: err.message || String(err) };
  }
  if (!receipt) {
    return { ok: false, reason: "TX_NOT_FOUND" };
  }
  // ethers v6: status is 1 (success) | 0 (revert). Anything else = treat as failed.
  if (Number(receipt.status) !== 1) {
    return { ok: false, reason: "TX_REVERTED" };
  }

  // ---- (3) scan Transfer logs for HACK movements ------------------------------
  // Three buckets so we can pick the right error reason:
  //   hackTransfers       — any Transfer event from the HACK token contract
  //   hackToTreasury      — those whose `to` equals our treasury
  //   matchedFromExpected — those whose `to` is treasury AND `from` is expected
  let hackTransfers = 0;
  let hackToTreasury = 0;
  let summedFromExpected = 0n;

  for (const log of receipt.logs || []) {
    if (!log || !log.address || !Array.isArray(log.topics)) continue;
    if (log.address.toLowerCase() !== hackToken) continue;
    if (log.topics[0] !== TRANSFER_TOPIC0) continue;

    let parsed;
    try {
      parsed = transferIface.parseLog({ topics: log.topics, data: log.data });
    } catch {
      // Malformed log — skip, do not crash the whole verification.
      continue;
    }
    hackTransfers += 1;

    const to = parsed.args.to.toLowerCase();
    const from = parsed.args.from.toLowerCase();
    const value = BigInt(parsed.args.value);

    if (to !== treasury) continue;
    hackToTreasury += 1;

    if (from !== normalizedFrom) continue;
    summedFromExpected += value;
  }

  if (hackTransfers === 0) {
    return { ok: false, reason: "NO_HACK_TRANSFER" };
  }
  if (hackToTreasury === 0) {
    return { ok: false, reason: "WRONG_RECIPIENT" };
  }
  if (summedFromExpected === 0n) {
    return { ok: false, reason: "WRONG_SENDER" };
  }

  // ---- (4) amount check -------------------------------------------------------
  // Compare in base units; convert expected (whole HACK) to base.
  const scale = 10n ** BigInt(decimals);
  const expectedBase = expectedAmountHack * scale;
  if (summedFromExpected < expectedBase) {
    return { ok: false, reason: "INSUFFICIENT_AMOUNT" };
  }

  // Actual whole HACK paid (truncating sub-token dust — `amount_hack` is BIGINT
  // whole units per the model contract; precision below 1 HACK is irrelevant
  // for accounting at $0.0001/HACK).
  const actualAmountHack = summedFromExpected / scale;

  // ---- (5) persist; race-safe via unique constraint on tx_hash ----------------
  try {
    const payment = await models.Payment.create({
      tx_hash: txHash,
      from_wallet: normalizedFrom,
      amount_hack: actualAmountHack.toString(),
      harjoot_price_usd: (pricing.harjootCostUsdCents / 100).toFixed(4),
      user_price_usd: (pricing.userPriceUsdCents / 100).toFixed(4),
      status: "confirmed",
      purpose,
    });

    console.log(
      `${LOG_PREFIX} confirmed payment_id=${payment.id} tx=${txHash} ` +
        `from=${normalizedFrom} amount=${actualAmountHack} purpose=${purpose}`,
    );
    return {
      ok: true,
      payment: {
        id: payment.id,
        txHash,
        fromWallet: normalizedFrom,
        amountHack: actualAmountHack,
      },
    };
  } catch (err) {
    // SequelizeUniqueConstraintError — somebody else inserted the same
    // tx_hash between our pre-check and INSERT. Treat as replay.
    if (err && (err.name === "SequelizeUniqueConstraintError" || err.original?.code === "SQLITE_CONSTRAINT")) {
      const conflict = await models.Payment.findOne({ where: { tx_hash: txHash } });
      return {
        ok: false,
        reason: "REPLAY",
        existingPaymentId: conflict ? conflict.id : null,
      };
    }
    throw err; // unknown DB error — surface as 500
  }
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
  __TRANSFER_TOPIC0: TRANSFER_TOPIC0,
};
