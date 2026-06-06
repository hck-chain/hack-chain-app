// backend/harjoot/strategies/manualConversion.js
//
// Launch-time strategy. Does NOT touch the chain — it parks the batch
// so a human operator can perform the HACK -> USDT swap and the USDT
// transfer to Harjoot out of band, then mark the rows as `sent`.
//
// Selected when TREASURY_CONVERSION_MODE is "manual" (the default).

const LOG_PREFIX = "[manualConversion]";

/**
 * @param {{ hackAmount: bigint }} params
 * @returns {Promise<{ mode: "manual", awaitingManual: true }>}
 */
async function convert({ hackAmount }) {
  if (typeof hackAmount !== "bigint" || hackAmount <= 0n) {
    throw new TypeError("manualConversion.convert requires a positive bigint hackAmount");
  }
  console.log(
    `${LOG_PREFIX} batch parked for manual conversion hack_total=${hackAmount}`,
  );
  // Worker uses awaitingManual=true to short-circuit the on-chain steps
  // and transition the queued rows to status="awaiting_manual_conversion".
  return { mode: "manual", awaitingManual: true };
}

module.exports = { convert };
