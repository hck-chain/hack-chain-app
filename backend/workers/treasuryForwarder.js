// backend/workers/treasuryForwarder.js
//
// SKELETON — async Treasury -> Harjoot settlement worker.
// Implementation pending. See documents/harjoot-integration-handoff.md.
//
// DS Section 13. Drains the `treasury_transfers_queue` table, converts the
// collected $HACK to USDT, sends USDT to Harjoot, and notifies Harjoot.
// Runs as a background job (cron / queue consumer), NOT in any HTTP request.
//
// OPEN DECISIONS:
//   - DS TODO 3: the HACK -> USDT conversion mechanism (manual / DEX swap /
//     burn-redeem) is a blockchain-developer decision. Treat the conversion
//     as a pluggable step so only that step changes once decided.
//   - DS TODO 6: the Harjoot payment-notification endpoint is not finalized.

const NOT_IMPLEMENTED =
  "Treasury forwarder not implemented yet — see documents/harjoot-integration-handoff.md";

/**
 * DS Section 13 — process one batch of pending treasury transfers.
 *
 * @returns {Promise<{processed: number, usdtTxHash: string|null}>}
 * @throws {Error} not implemented
 */
async function processTreasuryQueue() {
  // TODO(impl): DS Section 13.
  //  1. SELECT pending rows FROM treasury_transfers_queue (LIMIT batch_size).
  //  2. Stage 1 — convert HACK to USDT (pluggable step; DS TODO 3).
  //  3. Stage 2 — transfer USDT to the Harjoot wallet.
  //  4. On success: mark rows "sent" and call harjootService.notifyPayment().
  //  5. On failure: mark rows "failed" and alert ops.
  throw new Error(NOT_IMPLEMENTED);
}

/**
 * Register the worker on a cron schedule. Call once from index.js after the
 * server starts (mirrors the existing session-purge cron).
 *
 * @param {object} [options]
 * @param {string} [options.cronExpression]  Cron expression; defaults to every 10 minutes.
 * @throws {Error} not implemented
 */
function scheduleTreasuryForwarder(options = {}) {
  // TODO(impl): schedule processTreasuryQueue() with node-cron.
  // Example: cron.schedule(options.cronExpression || "*/10 * * * *", processTreasuryQueue)
  throw new Error(NOT_IMPLEMENTED);
}

module.exports = { processTreasuryQueue, scheduleTreasuryForwarder };
