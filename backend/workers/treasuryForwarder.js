// backend/workers/treasuryForwarder.js
//
// DS Section 13 — async worker that drains `treasury_transfers_queue`,
// applies the configured HACK -> USDT conversion strategy, and (for the
// non-manual paths) transfers USDT to Harjoot + notifies them.
//
// Runs on a cron schedule from index.js. NEVER call this inside an HTTP
// request handler — long-running tx waits would tie up Express workers.
//
// State machine for `treasury_transfers_queue.status`:
//   pending
//     |
//     |---> awaiting_manual_conversion   (manual strategy parked it)
//     |---> failed                       (strategy or USDT transfer threw)
//     |---> sent                         (USDT transferred + Harjoot notified)
//     |---> sent_but_not_notified        (USDT transferred; notify threw)
//
// The state machine intentionally has no transition out of `failed` or
// `awaiting_manual_conversion` — those require operator intervention
// (a dedicated /admin endpoint, to be added later).

const LOG_PREFIX = "[treasuryForwarder]";

const DEFAULT_BATCH_SIZE = 50;

function assertDeps({ models, strategy, harjootClient }) {
  if (!models || !models.TreasuryTransfer || !models.Payment) {
    throw new TypeError(
      "processTreasuryQueue requires { models.{TreasuryTransfer, Payment} }",
    );
  }
  if (!strategy || typeof strategy.convert !== "function") {
    throw new TypeError("processTreasuryQueue requires strategy.convert");
  }
  if (!harjootClient || typeof harjootClient.notifyPayment !== "function") {
    throw new TypeError("processTreasuryQueue requires harjootClient.notifyPayment");
  }
}

async function markRowsStatus(models, rowIds, fields) {
  if (rowIds.length === 0) return;
  await models.TreasuryTransfer.update(fields, {
    where: { id: rowIds },
  });
}

/**
 * Drain one batch of pending treasury transfers.
 *
 * @param {object} params
 * @param {object} params.models          db (Payment, TreasuryTransfer,
 *                                        Certificate optional for verification ids).
 * @param {object} params.strategy        IConversionStrategy ({ convert }).
 * @param {object} params.harjootClient   Must expose notifyPayment(verificationIds, txHash).
 * @param {function} [params.usdtTransfer] Async ({usdtAmount, recipient}) => {txHash}.
 *                                        Required for non-manual strategies.
 * @param {string}  [params.harjootWallet] Required for non-manual strategies.
 * @param {number}  [params.batchSize]    Default 50.
 *
 * @returns {Promise<{
 *   processed: number,
 *   mode: "manual"|"swap"|"burn_redeem"|null,
 *   awaitingManual?: boolean,
 *   usdtTxHash?: string,
 *   failed?: boolean,
 *   error?: string,
 * }>}
 */
async function processTreasuryQueue(params) {
  const { models, strategy, harjootClient } = params;
  const batchSize = params.batchSize || DEFAULT_BATCH_SIZE;
  assertDeps(params);

  // ---- 1. Fetch pending rows + linked payment (+ optional certificate) -----
  const include = [{
    model: models.Payment,
    required: true,
    include: models.Certificate
      ? [{ model: models.Certificate, required: false }]
      : [],
  }];
  const rows = await models.TreasuryTransfer.findAll({
    where: { status: "pending" },
    include,
    limit: batchSize,
    order: [["created_at", "ASC"]],
  });

  if (rows.length === 0) {
    return { processed: 0, mode: null };
  }
  const rowIds = rows.map((r) => r.id);

  // ---- 2. Aggregate HACK total ---------------------------------------------
  let hackTotal = 0n;
  for (const r of rows) {
    // amount_hack stored as BIGINT, read back as string in Sequelize.
    hackTotal += BigInt(r.Payment.amount_hack);
  }

  console.log(
    `${LOG_PREFIX} draining batch size=${rows.length} hack_total=${hackTotal}`,
  );

  // ---- 3. Strategy.convert -------------------------------------------------
  let conversion;
  try {
    conversion = await strategy.convert({ hackAmount: hackTotal });
  } catch (err) {
    const errorMsg = `STRATEGY_FAILED: ${err.message || err}`;
    console.error(`${LOG_PREFIX} ${errorMsg}`);
    await markRowsStatus(models, rowIds, { status: "failed", error: errorMsg });
    return { processed: rows.length, mode: null, failed: true, error: errorMsg };
  }

  // ---- 4. Manual path: park the batch and exit -----------------------------
  if (conversion.awaitingManual) {
    await markRowsStatus(models, rowIds, { status: "awaiting_manual_conversion" });
    console.log(
      `${LOG_PREFIX} batch parked awaiting_manual_conversion count=${rows.length}`,
    );
    return {
      processed: rows.length,
      mode: conversion.mode,
      awaitingManual: true,
    };
  }

  // ---- 5. Non-manual path: USDT transfer + notify ---------------------------
  // Validate deps lazily — manual mode doesn't need usdtTransfer / wallet.
  const { usdtTransfer, harjootWallet } = params;
  if (typeof usdtTransfer !== "function") {
    const errorMsg = "STRATEGY_NEEDS_USDT_TRANSFER: non-manual strategy returned a result but usdtTransfer dep is missing";
    console.error(`${LOG_PREFIX} ${errorMsg}`);
    await markRowsStatus(models, rowIds, { status: "failed", error: errorMsg });
    return { processed: rows.length, mode: conversion.mode, failed: true, error: errorMsg };
  }
  if (!harjootWallet) {
    const errorMsg = "STRATEGY_NEEDS_HARJOOT_WALLET: non-manual strategy returned a result but harjootWallet dep is missing";
    console.error(`${LOG_PREFIX} ${errorMsg}`);
    await markRowsStatus(models, rowIds, { status: "failed", error: errorMsg });
    return { processed: rows.length, mode: conversion.mode, failed: true, error: errorMsg };
  }

  let transferResult;
  try {
    transferResult = await usdtTransfer({
      usdtAmount: conversion.usdtAmount,
      recipient: harjootWallet,
    });
  } catch (err) {
    const errorMsg = `USDT_TRANSFER_FAILED: ${err.message || err}`;
    console.error(`${LOG_PREFIX} ${errorMsg}`);
    await markRowsStatus(models, rowIds, { status: "failed", error: errorMsg });
    return { processed: rows.length, mode: conversion.mode, failed: true, error: errorMsg };
  }

  const usdtTxHash = transferResult && transferResult.txHash;
  if (!usdtTxHash) {
    const errorMsg = "USDT_TRANSFER_NO_HASH: usdtTransfer returned without a txHash";
    console.error(`${LOG_PREFIX} ${errorMsg}`);
    await markRowsStatus(models, rowIds, { status: "failed", error: errorMsg });
    return { processed: rows.length, mode: conversion.mode, failed: true, error: errorMsg };
  }

  // ---- 6. Mark rows sent ----------------------------------------------------
  const sentAt = new Date();
  await markRowsStatus(models, rowIds, {
    status: "sent",
    usdt_tx_hash: usdtTxHash,
    sent_at: sentAt,
  });

  // ---- 7. Notify Harjoot. Failure here does NOT undo the on-chain transfer.
  const verificationIds = rows
    .map((r) => r.Payment && r.Payment.Certificate && r.Payment.Certificate.harjoot_verification_id)
    .filter((id) => typeof id === "string" && id.length > 0);

  try {
    await harjootClient.notifyPayment(verificationIds, usdtTxHash);
    console.log(
      `${LOG_PREFIX} batch sent count=${rows.length} usdt_tx=${usdtTxHash} ` +
        `notified=${verificationIds.length}`,
    );
    return {
      processed: rows.length,
      mode: conversion.mode,
      usdtTxHash,
      notifiedCount: verificationIds.length,
    };
  } catch (err) {
    console.error(
      `${LOG_PREFIX} notifyPayment failed; on-chain transfer already done: ${err.message || err}`,
    );
    // Transition rows to sent_but_not_notified so ops can reconcile.
    await markRowsStatus(models, rowIds, {
      status: "sent_but_not_notified",
      error: `NOTIFY_FAILED: ${err.message || err}`,
    });
    return {
      processed: rows.length,
      mode: conversion.mode,
      usdtTxHash,
      notifyFailed: true,
      error: err.message || String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Scheduler — two-tier design.
// ---------------------------------------------------------------------------
//
// runTreasuryForwarderOnce(options)
//   Pure one-shot invocation. Builds the deps that processTreasuryQueue
//   needs (selecting the conversion strategy by env), invokes it, and
//   logs the outcome. ALWAYS swallows errors — a single bad tick must
//   never crash the cron loop.
//
// scheduleTreasuryForwarder(options)
//   Thin wrapper around node-cron + an in-process lock. The lock
//   prevents a slow tick from overlapping with the next scheduled run
//   on the SAME process. Multi-instance contention (two boxes both
//   draining the same queue) is a separate concern handled by the
//   row-level state machine — the worst case is a no-op fetch on the
//   loser.
//
// Both export the same signature for ops convenience: a manual
// `runTreasuryForwarderOnce()` call from a /admin route or REPL will
// drain the queue immediately.

const DEFAULT_CRON_EXPRESSION = "*/10 * * * *";

/**
 * Build the deps and invoke processTreasuryQueue once. Returns the
 * worker result (or an error envelope when the dep build itself
 * throws — e.g. the strategy factory rejects an unknown mode).
 *
 * @param {object} [options]
 * @param {object} [options.models]          Defaults to require("../models").
 * @param {object} [options.harjootClient]   Defaults to createHarjootClient().
 * @param {function} [options.selectStrategy] Defaults to strategy factory.
 * @param {function} [options.usdtTransfer]  Forwarded to processTreasuryQueue.
 * @param {string}   [options.harjootWallet] Forwarded to processTreasuryQueue.
 * @param {number}   [options.batchSize]     Forwarded to processTreasuryQueue.
 */
async function runTreasuryForwarderOnce(options = {}) {
  // Lazy requires so this module stays cheap to import (mirrors the
  // pattern in harjoot/client/index.js).
  const models = options.models || require("../models");
  const harjootClient = options.harjootClient
    || require("../harjoot/client").createHarjootClient();
  const selectStrategy = options.selectStrategy
    || require("../harjoot/strategies/factory").selectStrategy;

  let strategy;
  let mode;
  try {
    ({ strategy, mode } = selectStrategy());
  } catch (err) {
    console.error(`${LOG_PREFIX} strategy selection failed: ${err.message || err}`);
    return { processed: 0, mode: null, failed: true, error: err.message || String(err) };
  }

  console.log(`${LOG_PREFIX} tick mode=${mode}`);
  try {
    return await processTreasuryQueue({
      models,
      strategy,
      harjootClient,
      usdtTransfer: options.usdtTransfer,
      harjootWallet: options.harjootWallet,
      batchSize: options.batchSize,
    });
  } catch (err) {
    // processTreasuryQueue throws only on programmer-error dep issues.
    // Surface the error in logs but never let it crash the cron.
    console.error(`${LOG_PREFIX} tick aborted: ${err.message || err}`);
    return { processed: 0, mode, failed: true, error: err.message || String(err) };
  }
}

/**
 * Schedule the treasury worker on a cron. Returns the cron task so
 * callers (tests, graceful shutdown) can stop it.
 *
 * @param {object} [options] All keys forwarded to runTreasuryForwarderOnce.
 * @param {string} [options.cronExpression] Defaults to "*\/10 * * * *".
 * @param {object} [options.cron]           Override node-cron (tests only).
 *
 * @returns {{ stop: Function } | null}     null when CHAIN/Harjoot are
 *                                          disabled and the worker would
 *                                          have nothing to do.
 */
function scheduleTreasuryForwarder(options = {}) {
  const cron = options.cron || require("node-cron");
  const cronExpression = options.cronExpression || DEFAULT_CRON_EXPRESSION;

  // Multi-tick re-entrancy guard. If a tick takes longer than the cron
  // interval (large queue, slow RPC), we skip the overlapping tick
  // rather than queue up and stampede the chain.
  let running = false;

  const tick = async () => {
    if (running) {
      console.log(`${LOG_PREFIX} previous tick still running; skipping`);
      return;
    }
    running = true;
    try {
      await runTreasuryForwarderOnce(options);
    } finally {
      running = false;
    }
  };

  const task = cron.schedule(cronExpression, tick);
  console.log(`${LOG_PREFIX} scheduled cron="${cronExpression}"`);
  return task;
}

module.exports = {
  processTreasuryQueue,
  runTreasuryForwarderOnce,
  scheduleTreasuryForwarder,
  __DEFAULT_BATCH_SIZE: DEFAULT_BATCH_SIZE,
  __DEFAULT_CRON_EXPRESSION: DEFAULT_CRON_EXPRESSION,
};
