// backend/harjoot/usecases/listPayments.js
//
// Admin payments table. Filters by date range and educator wallet.
// Pagination identical to listEducators (page 1-based, limit 1..100).

const { Op } = require("sequelize");

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

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

function parseDate(value, fieldName) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new TypeError(`${fieldName} is not a valid ISO date`);
  }
  return d;
}

/**
 * @param {object} params
 * @param {object} params.models  db (Payment + Certificate optional)
 * @param {string} [params.from]   ISO date — inclusive lower bound on created_at
 * @param {string} [params.to]     ISO date — exclusive upper bound on created_at
 * @param {string} [params.fromWallet]  filter by educator wallet
 * @param {string} [params.status]      filter by Payment.status (default "confirmed")
 * @param {number|string} [params.page]
 * @param {number|string} [params.limit]
 */
async function listPayments({
  models,
  from = null,
  to = null,
  fromWallet = null,
  status = "confirmed",
  page = 1,
  limit = DEFAULT_LIMIT,
} = {}) {
  if (!models || !models.Payment) {
    throw new TypeError("listPayments requires { models.Payment }");
  }
  if (fromWallet && (typeof fromWallet !== "string" || !WALLET_REGEX.test(fromWallet))) {
    throw new TypeError("listPayments fromWallet must be a 0x-prefixed 40-hex address");
  }

  const fromDate = parseDate(from, "from");
  const toDate   = parseDate(to, "to");

  const safePage = clampPage(page);
  const safeLimit = clampLimit(limit);

  const where = {};
  if (status && status !== "all") where.status = status;
  if (fromWallet) where.from_wallet = fromWallet.toLowerCase();
  if (fromDate || toDate) {
    where.created_at = {};
    if (fromDate) where.created_at[Op.gte] = fromDate;
    if (toDate)   where.created_at[Op.lt]  = toDate;
  }

  const include = models.Certificate
    ? [{
        model: models.Certificate,
        required: false,
        attributes: ["id", "title", "token_id", "harjoot_verification_id", "status"],
      }]
    : [];

  const total = await models.Payment.count({ where });
  const rows = await models.Payment.findAll({
    where,
    include,
    order: [["created_at", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  });

  const items = rows.map((p) => ({
    id: p.id,
    txHash: p.tx_hash,
    fromWallet: p.from_wallet,
    amountHack: p.amount_hack,                    // already BIGINT-as-string from DB
    harjootPriceUsd: String(p.harjoot_price_usd),
    userPriceUsd: String(p.user_price_usd),
    status: p.status,
    purpose: p.purpose,
    createdAt: p.created_at,
    certificate: p.Certificate
      ? {
          id: p.Certificate.id,
          title: p.Certificate.title,
          tokenId: p.Certificate.token_id,
          harjootVerificationId: p.Certificate.harjoot_verification_id,
          status: p.Certificate.status,
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

module.exports = { listPayments, __DEFAULT_LIMIT: DEFAULT_LIMIT, __MAX_LIMIT: MAX_LIMIT };
