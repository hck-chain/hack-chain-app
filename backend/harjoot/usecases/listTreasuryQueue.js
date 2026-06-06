// backend/harjoot/usecases/listTreasuryQueue.js
//
// Admin treasury page. Lists rows from treasury_transfers_queue with
// status filter + pagination. Default sort: oldest first, because the
// dashboard is a "things to settle" worklist.

const { Op } = require("sequelize");

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const ALLOWED_STATUSES = new Set([
  "pending",
  "awaiting_manual_conversion",
  "sent",
  "sent_but_not_notified",
  "failed",
  "all",
]);

function clampPage(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}
function clampLimit(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  if (n > MAX_LIMIT) return MAX_LIMIT;
  return n;
}

/**
 * @param {object} params
 * @param {object} params.models
 * @param {string} [params.status]  one of ALLOWED_STATUSES; default
 *                                  "awaiting_manual_conversion" (the
 *                                  dashboard's primary worklist).
 * @param {number|string} [params.page]
 * @param {number|string} [params.limit]
 */
async function listTreasuryQueue({
  models,
  status = "awaiting_manual_conversion",
  page = 1,
  limit = DEFAULT_LIMIT,
} = {}) {
  if (!models || !models.TreasuryTransfer || !models.Payment) {
    throw new TypeError("listTreasuryQueue requires { models.{TreasuryTransfer, Payment} }");
  }
  if (typeof status === "string" && !ALLOWED_STATUSES.has(status)) {
    throw new TypeError(`listTreasuryQueue: status must be one of ${[...ALLOWED_STATUSES].join(", ")}`);
  }

  const safePage = clampPage(page);
  const safeLimit = clampLimit(limit);

  const where = {};
  if (status && status !== "all") where.status = status;

  const total = await models.TreasuryTransfer.count({ where });
  const rows = await models.TreasuryTransfer.findAll({
    where,
    include: [{
      model: models.Payment,
      required: false,
      attributes: ["id", "tx_hash", "from_wallet", "amount_hack", "user_price_usd", "harjoot_price_usd"],
    }],
    order: [["created_at", "ASC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  });

  const items = rows.map((t) => ({
    id: t.id,
    paymentId: t.payment_id,
    amountUsdtOwed: String(t.amount_usdt_owed),
    destination: t.destination,
    status: t.status,
    usdtTxHash: t.usdt_tx_hash,
    error: t.error,
    createdAt: t.created_at,
    sentAt: t.sent_at,
    payment: t.Payment
      ? {
          id: t.Payment.id,
          txHash: t.Payment.tx_hash,
          fromWallet: t.Payment.from_wallet,
          amountHack: t.Payment.amount_hack,
          userPriceUsd: String(t.Payment.user_price_usd),
          harjootPriceUsd: String(t.Payment.harjoot_price_usd),
        }
      : null,
  }));

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
}

module.exports = {
  listTreasuryQueue,
  __ALLOWED_STATUSES: ALLOWED_STATUSES,
  __DEFAULT_LIMIT: DEFAULT_LIMIT,
  __MAX_LIMIT: MAX_LIMIT,
};
