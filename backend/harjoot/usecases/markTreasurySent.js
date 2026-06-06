// backend/harjoot/usecases/markTreasurySent.js
//
// Admin ops: after settling a batch out-of-band (manual conversion +
// USDT transfer to Harjoot), record the result so the queue reflects
// reality. Idempotent: a second call on an already-sent row returns
// ALREADY_SENT and does not overwrite the previous tx hash.
//
// Auth: route gates with requireAdmin. The use case ALSO records the
// admin's user id (for auditing) on the row's `error` column when the
// transition is not idempotent.
//
// Returns Result:
//   { ok: true, transfer }
//   | { ok: false, reason: "NOT_FOUND" }
//   | { ok: false, reason: "ALREADY_SENT", existingUsdtTxHash }
//   | { ok: false, reason: "WRONG_STATE", currentStatus }

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const ALLOWED_FROM = new Set(["pending", "awaiting_manual_conversion", "sent_but_not_notified"]);

/**
 * @param {object} params
 * @param {object} params.models       db with TreasuryTransfer
 * @param {number} params.transferId
 * @param {string} params.usdtTxHash   0x-prefixed 32-byte hash
 * @param {number} [params.adminId]    For audit logging; optional.
 */
async function markTreasurySent({ models, transferId, usdtTxHash, adminId } = {}) {
  if (!models || !models.TreasuryTransfer) {
    throw new TypeError("markTreasurySent requires { models.TreasuryTransfer }");
  }
  const idNum = parseInt(transferId, 10);
  if (!Number.isFinite(idNum) || idNum < 1) {
    throw new TypeError("markTreasurySent requires a positive transferId");
  }
  if (typeof usdtTxHash !== "string" || !TX_HASH_REGEX.test(usdtTxHash)) {
    throw new TypeError("markTreasurySent requires a 0x-prefixed 32-byte usdtTxHash");
  }

  const normalizedHash = usdtTxHash.toLowerCase();

  const row = await models.TreasuryTransfer.findByPk(idNum);
  if (!row) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (row.status === "sent") {
    return {
      ok: false,
      reason: "ALREADY_SENT",
      existingUsdtTxHash: row.usdt_tx_hash || null,
    };
  }
  if (!ALLOWED_FROM.has(row.status)) {
    return { ok: false, reason: "WRONG_STATE", currentStatus: row.status };
  }

  const sentAt = new Date();
  await row.update({
    status: "sent",
    usdt_tx_hash: normalizedHash,
    sent_at: sentAt,
    // Stash a small audit trail on `error` — column is free-form text and
    // reusing it avoids a migration just for "who closed this?".
    error: adminId ? `manual_close:admin_id=${adminId}` : null,
  });

  console.log(
    `[markTreasurySent] id=${row.id} admin_id=${adminId} usdt=${normalizedHash}`,
  );

  return {
    ok: true,
    transfer: {
      id: row.id,
      paymentId: row.payment_id,
      status: row.status,
      usdtTxHash: row.usdt_tx_hash,
      sentAt: row.sent_at,
    },
  };
}

module.exports = { markTreasurySent };
