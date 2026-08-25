// backend/services/usdtPaymentService.js
//
// On-chain USDT payment verification for the class-payment workflow
// (deposit + final, 50/50 split). Mirrors paymentService.verifyHackPayment's
// receipt-decoding + replay-protection approach, with two differences:
//   - the recipient is per-request (the educator's wallet on that
//     class_requests row), not a fixed treasury
//   - replay protection is against class_requests.deposit_tx_hash /
//     final_tx_hash instead of a dedicated payments table, since this isn't
//     a platform-fee payment — it's talent-to-educator money that HackChain
//     never touches.

const { Interface } = require("ethers");

const LOG_PREFIX = "[verifyUsdtPayment]";
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

const transferIface = new Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
const TRANSFER_TOPIC0 = transferIface.getEvent("Transfer").topicHash;

function defaultConfig() {
  return {
    usdtTokenAddress: process.env.USDT_CONTRACT_ADDRESS,
    // USDT is 6 decimals on every chain it's deployed to today, but kept
    // configurable rather than hardcoded — same reasoning as
    // HACK_TOKEN_DECIMALS in harjoot/config.
    usdtDecimals: process.env.USDT_DECIMALS ? Number(process.env.USDT_DECIMALS) : 6,
  };
}

/**
 * Verify a USDT payment on-chain for one stage (deposit or final) of a
 * class_requests row, and check it hasn't already been used elsewhere.
 *
 * @param {object} params
 * @param {object} params.models              db (must expose ClassRequest).
 * @param {object} params.provider            polygonProvider instance —
 *                                            getTransactionReceipt(txHash).
 * @param {string} params.txHash              0x-prefixed 32-byte tx hash.
 * @param {string} params.expectedFrom        Talent wallet (any casing).
 * @param {string} params.expectedTo          Educator wallet (any casing).
 * @param {number} params.expectedMinAmountUsdt  Minimum USDT (whole units,
 *                                            e.g. 12.5) that must have moved.
 * @param {object} [params.config]            Override token address/decimals (tests).
 *
 * @returns {Promise<
 *   | { ok: true, amountUsdt: number, txHash: string }
 *   | { ok: false, reason: "TX_NOT_FOUND" | "TX_REVERTED" | "NO_USDT_TRANSFER"
 *                       | "WRONG_RECIPIENT" | "WRONG_SENDER" | "INSUFFICIENT_AMOUNT" }
 *   | { ok: false, reason: "REPLAY", existingRequestId: number }
 *   | { ok: false, reason: "RPC_ERROR", soft_failed: true, error: string }
 * >}
 */
async function verifyUsdtPayment(params) {
  const { models, provider, txHash, expectedFrom, expectedTo, expectedMinAmountUsdt } = params;
  const cfg = params.config || defaultConfig();

  if (!models || !models.ClassRequest) {
    throw new TypeError("verifyUsdtPayment requires { models.ClassRequest }");
  }
  if (!provider || typeof provider.getTransactionReceipt !== "function") {
    throw new TypeError("verifyUsdtPayment requires { provider.getTransactionReceipt }");
  }
  if (typeof txHash !== "string" || !TX_HASH_REGEX.test(txHash)) {
    throw new TypeError("verifyUsdtPayment requires a 0x-prefixed 32-byte txHash");
  }
  if (typeof expectedFrom !== "string" || !WALLET_REGEX.test(expectedFrom)) {
    throw new TypeError("verifyUsdtPayment requires a valid expectedFrom wallet");
  }
  if (typeof expectedTo !== "string" || !WALLET_REGEX.test(expectedTo)) {
    throw new TypeError("verifyUsdtPayment requires a valid expectedTo wallet");
  }
  if (typeof expectedMinAmountUsdt !== "number" || expectedMinAmountUsdt <= 0) {
    throw new TypeError("verifyUsdtPayment requires expectedMinAmountUsdt as a positive number");
  }
  if (!cfg.usdtTokenAddress) {
    throw new TypeError("verifyUsdtPayment requires config.usdtTokenAddress (USDT_CONTRACT_ADDRESS)");
  }

  const normalizedFrom = expectedFrom.toLowerCase();
  const normalizedTo = expectedTo.toLowerCase();
  const usdtToken = cfg.usdtTokenAddress.toLowerCase();
  // Same case-normalization rationale as verifyHackPayment: Postgres VARCHAR
  // comparison is case-sensitive, so an unnormalized hash could slip past
  // the replay pre-check under different ASCII casing.
  const normalizedTxHash = txHash.toLowerCase();

  // ---- (1) replay pre-check — same tx can't fund two stages/requests ---------
  const { Op } = models.Sequelize;
  const existing = await models.ClassRequest.findOne({
    where: {
      [Op.or]: [
        { deposit_tx_hash: normalizedTxHash },
        { final_tx_hash: normalizedTxHash },
      ],
    },
  });
  if (existing) {
    return { ok: false, reason: "REPLAY", existingRequestId: existing.id };
  }

  // ---- (2) fetch receipt -------------------------------------------------------
  let receipt;
  try {
    receipt = await provider.getTransactionReceipt(normalizedTxHash);
  } catch (err) {
    console.error(`${LOG_PREFIX} provider failure for ${normalizedTxHash}: ${err.message || err}`);
    return { ok: false, reason: "RPC_ERROR", soft_failed: true, error: err.message || String(err) };
  }
  if (!receipt) {
    return { ok: false, reason: "TX_NOT_FOUND" };
  }
  if (Number(receipt.status) !== 1) {
    return { ok: false, reason: "TX_REVERTED" };
  }

  // ---- (3) scan Transfer logs for USDT movements ------------------------------
  let usdtTransfers = 0;
  let toEducator = 0;
  let summedFromExpected = 0n;

  for (const log of receipt.logs || []) {
    if (!log || !log.address || !Array.isArray(log.topics)) continue;
    if (log.address.toLowerCase() !== usdtToken) continue;
    if (log.topics[0] !== TRANSFER_TOPIC0) continue;

    let parsed;
    try {
      parsed = transferIface.parseLog({ topics: log.topics, data: log.data });
    } catch {
      continue;
    }
    usdtTransfers += 1;

    const to = parsed.args.to.toLowerCase();
    const from = parsed.args.from.toLowerCase();
    const value = BigInt(parsed.args.value);

    if (to !== normalizedTo) continue;
    toEducator += 1;

    if (from !== normalizedFrom) continue;
    summedFromExpected += value;
  }

  if (usdtTransfers === 0) {
    return { ok: false, reason: "NO_USDT_TRANSFER" };
  }
  if (toEducator === 0) {
    return { ok: false, reason: "WRONG_RECIPIENT" };
  }
  if (summedFromExpected === 0n) {
    return { ok: false, reason: "WRONG_SENDER" };
  }

  // ---- (4) amount check ---------------------------------------------------------
  const scale = 10n ** BigInt(cfg.usdtDecimals);
  // expectedMinAmountUsdt is a JS number (e.g. 12.5) — round to the token's
  // base unit rather than truncating, so a rate-conversion rounding error of
  // a fraction of a cent doesn't reject a correct payment.
  const expectedBase = BigInt(Math.round(expectedMinAmountUsdt * Number(scale)));
  if (summedFromExpected < expectedBase) {
    return { ok: false, reason: "INSUFFICIENT_AMOUNT" };
  }

  const amountUsdt = Number(summedFromExpected) / Number(scale);

  console.log(
    `${LOG_PREFIX} confirmed tx=${normalizedTxHash} from=${normalizedFrom} to=${normalizedTo} amount=${amountUsdt}`
  );

  return { ok: true, amountUsdt, txHash: normalizedTxHash };
}

module.exports = {
  verifyUsdtPayment,
  __TRANSFER_TOPIC0: TRANSFER_TOPIC0,
};
