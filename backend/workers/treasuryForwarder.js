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
// Scheduler — wired in Phase 8c
// ---------------------------------------------------------------------------

const NOT_IMPLEMENTED =
  "scheduleTreasuryForwarder is wired in Phase 8c; not available yet";

function scheduleTreasuryForwarder(_options = {}) {
  // TODO(Phase 8c): cron.schedule("*/10 * * * *", processTreasuryQueue) with
  // injected deps. Single-instance lock so multiple boxes don't race.
  throw new Error(NOT_IMPLEMENTED);
}

module.exports = {
  processTreasuryQueue,
  scheduleTreasuryForwarder,
  __DEFAULT_BATCH_SIZE: DEFAULT_BATCH_SIZE,
};
