// backend/harjoot/usecases/adminStats.js
//
// Cards for the /admin landing page. One query per metric so the worst
// case (small DB) is a handful of fast index scans; for a launch-stage
// product this is fine and the code stays readable.
//
// All shapes are JSON-safe (no bigints leak into the response). All
// monetary amounts are returned as `usd` (string with 2 decimals) so
// the frontend doesn't have to make formatting decisions.

const { Op, fn, col, literal } = require("sequelize");

function toUsd(cents) {
  if (cents === null || cents === undefined) return "0.00";
  const n = typeof cents === "string" ? parseInt(cents, 10) : cents;
  if (!Number.isFinite(n)) return "0.00";
  return (n / 100).toFixed(2);
}

function toUsdFromDecimal(decimalValue) {
  if (decimalValue === null || decimalValue === undefined) return "0.00";
  const n = typeof decimalValue === "string" ? parseFloat(decimalValue) : decimalValue;
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

/**
 * @param {object} params
 * @param {object} params.models   db (User + Payment + Certificate + TreasuryTransfer)
 * @param {Date}   [params.now]    Inject "current time" for tests.
 */
async function adminStats({ models, now = new Date() } = {}) {
  if (!models || !models.User || !models.Payment || !models.Certificate || !models.TreasuryTransfer) {
    throw new TypeError(
      "adminStats requires { models.{User, Payment, Certificate, TreasuryTransfer} }",
    );
  }

  const dayMs = 24 * 60 * 60 * 1000;
  // UTC explicitly — server local TZ would make "today" mean different
  // things depending on where the server runs. Postgres TIMESTAMPTZ stores
  // UTC; aligning the window boundary in UTC keeps the comparison correct.
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);

  // ---- Educator counters ----------------------------------------------------
  const [pending, approved, rejected] = await Promise.all([
    models.User.count({ where: { role: "issuer", educator_approval_status: "pending_approval" } }),
    models.User.count({ where: { role: "issuer", educator_approval_status: "approved" } }),
    models.User.count({ where: { role: "issuer", educator_approval_status: "rejected" } }),
  ]);

  // ---- Certificate counters -------------------------------------------------
  const [certsToday, certsWeek, certsTotal] = await Promise.all([
    models.Certificate.count({ where: { created_at: { [Op.gte]: startOfDay } } }),
    models.Certificate.count({ where: { created_at: { [Op.gte]: sevenDaysAgo } } }),
    models.Certificate.count(),
  ]);

  // ---- Revenue + cost (in USD cents-equivalent via DECIMAL sums) ------------
  // user_price_usd captures what HackChain charged the educator.
  // harjoot_price_usd captures what HackChain owes Harjoot per cert.
  const [revenueRow, costRow] = await Promise.all([
    models.Payment.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("user_price_usd")), 0), "total"]],
      where: { status: "confirmed" },
      raw: true,
    }),
    models.Payment.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("harjoot_price_usd")), 0), "total"]],
      where: { status: "confirmed" },
      raw: true,
    }),
  ]);

  // ---- Treasury queue snapshot ---------------------------------------------
  const [tqPending, tqAwaiting, tqSent, tqFailed, debtOwedRow] = await Promise.all([
    models.TreasuryTransfer.count({ where: { status: "pending" } }),
    models.TreasuryTransfer.count({ where: { status: "awaiting_manual_conversion" } }),
    models.TreasuryTransfer.count({ where: { status: "sent" } }),
    models.TreasuryTransfer.count({ where: { status: "failed" } }),
    models.TreasuryTransfer.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("amount_usdt_owed")), 0), "total"]],
      where: { status: { [Op.in]: ["pending", "awaiting_manual_conversion"] } },
      raw: true,
    }),
  ]);

  const revenueUsd = toUsdFromDecimal(revenueRow && revenueRow.total);
  const costUsd    = toUsdFromDecimal(costRow && costRow.total);
  const debtUsd    = toUsdFromDecimal(debtOwedRow && debtOwedRow.total);
  const marginUsd  = (parseFloat(revenueUsd) - parseFloat(costUsd)).toFixed(2);

  return {
    educators: { pending, approved, rejected, total: pending + approved + rejected },
    certificates: { today: certsToday, last_7_days: certsWeek, total: certsTotal },
    revenue: { gross_usd: revenueUsd, harjoot_cost_usd: costUsd, margin_usd: marginUsd },
    treasury: {
      pending: tqPending,
      awaiting_manual_conversion: tqAwaiting,
      sent: tqSent,
      failed: tqFailed,
      outstanding_debt_usd: debtUsd,
    },
    generated_at: now.toISOString(),
  };
}

module.exports = { adminStats, __toUsd: toUsd };
