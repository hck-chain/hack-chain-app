// backend/routes/admin.js
//
// HackChain admin routes — DS Section 2.5 educator approval workflow.
//
// Auth model: requireAdmin middleware (backend/middleware/requireAdmin.js)
// accepts both the new comma-separated ADMIN_WALLETS env (preferred for
// CTO + founder multi-admin) and the legacy ADMIN_WALLET single value.

const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const buildRateLimitStore = require("../lib/rateLimitStore");

const { authenticate } = require("../middleware/auth");
const { requireAdmin, isAdmin } = require("../middleware/requireAdmin");
const db = require("../models");
const emailService = require("../services/emailService");
const { approveEducator } = require("../harjoot/usecases/approveEducator");
const { rejectEducator } = require("../harjoot/usecases/rejectEducator");
const { listEducators, __ALLOWED_STATUSES } = require("../harjoot/usecases/listEducators");
const { adminStats } = require("../harjoot/usecases/adminStats");
const { listPayments } = require("../harjoot/usecases/listPayments");
const { listTreasuryQueue, __ALLOWED_STATUSES: TQ_STATUSES } = require("../harjoot/usecases/listTreasuryQueue");
const { markTreasurySent } = require("../harjoot/usecases/markTreasurySent");
const { cancelReferral } = require("../usecases/referrals/cancelReferral");
const { approveReferralReview } = require("../usecases/referrals/approveReferralReview");

// Per Phase 9 plan: 100/hour per admin wallet. Even with only one admin
// today, a runaway script that loops over a list of educator IDs should be
// throttled rather than smash the DB + email provider. Keyed by the
// authenticated wallet; ipKeyGenerator is the IPv6-safe fallback. The
// store is shared via Redis when REDIS_URL is set so multi-instance
// deployments enforce a single effective limit.
const adminEducatorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin actions. Try again in an hour." },
  keyGenerator: (req) => (req.auth && req.auth.wallet) || ipKeyGenerator(req),
  store: buildRateLimitStore("/api/admin/educators"),
});

// Read-only limiter — separate from the write limiter so a busy listing
// page in the dashboard doesn't eat the approve/reject budget.
const adminReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Slow down." },
  keyGenerator: (req) => (req.auth && req.auth.wallet) || ipKeyGenerator(req),
  store: buildRateLimitStore("/api/admin/read"),
});

// Map a Result `reason` from the use cases to an HTTP status.
const STATUS_BY_REASON = {
  USER_NOT_FOUND: 404,
  NOT_AN_ISSUER: 400,
  ALREADY_APPROVED: 409,
  NOT_FOUND: 404,
  ALREADY_SENT: 409,
  WRONG_STATE: 409,
};

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

/**
 * POST /api/admin/educators/:userId/approve
 * DS Section 2.5 — approve a pending educator. Idempotent: a second call on
 * an already-approved account returns 409.
 */
router.post(
  "/educators/:userId/approve",
  authenticate,
  requireAdmin,
  adminEducatorLimiter,
  [param("userId").isInt({ min: 1 }).withMessage("userId must be a positive integer")],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const result = await approveEducator({
        models: db,
        emailService,
        userId: parseInt(req.params.userId, 10),
        adminId: req.auth.sub,
      });

      if (!result.ok) {
        return res
          .status(STATUS_BY_REASON[result.reason] || 400)
          .json({ error: result.reason });
      }

      return res.json({ message: "Educator approved", user: result.user });
    } catch (err) {
      console.error("POST /api/admin/educators/:userId/approve error:", err);
      return res.status(500).json({ error: "Failed to approve educator" });
    }
  },
);

/**
 * POST /api/admin/educators/:userId/reject
 * DS Section 2.5 — reject a pending educator. Requires a non-empty `reason`
 * in the request body which is stored on the user row.
 */
router.post(
  "/educators/:userId/reject",
  authenticate,
  requireAdmin,
  adminEducatorLimiter,
  [
    param("userId").isInt({ min: 1 }).withMessage("userId must be a positive integer"),
    body("reason")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("reason is required"),
    body("reason")
      .isLength({ max: 1000 })
      .withMessage("reason must be 1000 characters or less"),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const result = await rejectEducator({
        models: db,
        emailService,
        userId: parseInt(req.params.userId, 10),
        adminId: req.auth.sub,
        reason: req.body.reason,
      });

      if (!result.ok) {
        return res
          .status(STATUS_BY_REASON[result.reason] || 400)
          .json({ error: result.reason });
      }

      return res.json({ message: "Educator rejected", user: result.user });
    } catch (err) {
      console.error("POST /api/admin/educators/:userId/reject error:", err);
      return res.status(500).json({ error: "Failed to reject educator" });
    }
  },
);

/**
 * GET /api/admin/access
 * Lightweight self-check: tells the authenticated caller whether their
 * wallet is in ADMIN_WALLETS. ALWAYS 200 (no admin gate) so the SPA can
 * decide where to redirect after login + whether to show admin entry
 * points in the regular dashboards, WITHOUT exposing the admin list.
 */
router.get("/access", authenticate, (req, res) => {
  const wallet = req.auth && req.auth.wallet;
  return res.json({ isAdmin: isAdmin(wallet) });
});

/**
 * GET /api/admin/educators
 * Lists issuers with pagination + filters for the admin dashboard.
 *
 * Query:
 *   status: "pending_approval" | "approved" | "rejected" | "all" (default "all")
 *   search: free-text substring, <=80 chars
 *   page:   1-based, default 1
 *   limit:  default 25, max 100
 *
 * Returns: { items, total, page, limit, totalPages }
 */
router.get(
  "/educators",
  authenticate,
  requireAdmin,
  adminReadLimiter,
  [
    query("status").optional().isIn([...__ALLOWED_STATUSES])
      .withMessage("invalid status"),
    query("search").optional().isString().isLength({ max: 80 }),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;

    try {
      const result = await listEducators({
        models: db,
        status: req.query.status,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
      });
      return res.json(result);
    } catch (err) {
      console.error("GET /api/admin/educators error:", err);
      return res.status(500).json({ error: "Failed to list educators" });
    }
  },
);

/**
 * GET /api/admin/stats
 * Dashboard cards: educator counts, certificate volume, revenue,
 * outstanding USDT debt, treasury queue snapshot.
 */
router.get(
  "/stats",
  authenticate,
  requireAdmin,
  adminReadLimiter,
  async (req, res) => {
    try {
      const result = await adminStats({ models: db });
      return res.json(result);
    } catch (err) {
      console.error("GET /api/admin/stats error:", err);
      return res.status(500).json({ error: "Failed to load stats" });
    }
  },
);

/**
 * GET /api/admin/payments
 * Lists payments with filters for the dashboard.
 *
 * Query:
 *   from:       ISO date — inclusive lower bound on created_at
 *   to:         ISO date — exclusive upper bound on created_at
 *   fromWallet: 0x-prefixed educator wallet
 *   status:     Payment.status or "all" (default "confirmed")
 *   page, limit (default 1, 25 — max 100)
 */
router.get(
  "/payments",
  authenticate,
  requireAdmin,
  adminReadLimiter,
  [
    query("from").optional().isISO8601().withMessage("from must be ISO 8601"),
    query("to").optional().isISO8601().withMessage("to must be ISO 8601"),
    query("fromWallet").optional().isString().matches(/^0x[a-fA-F0-9]{40}$/),
    query("status").optional().isString().isLength({ max: 32 }),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const result = await listPayments({
        models: db,
        from: req.query.from,
        to: req.query.to,
        fromWallet: req.query.fromWallet,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
      });
      return res.json(result);
    } catch (err) {
      if (err instanceof TypeError) {
        return res.status(422).json({ error: err.message });
      }
      console.error("GET /api/admin/payments error:", err);
      return res.status(500).json({ error: "Failed to list payments" });
    }
  },
);

/**
 * GET /api/admin/treasury-queue
 * Lists treasury queue rows for the admin manual-settlement page.
 * Defaults to status=awaiting_manual_conversion (the worklist).
 */
router.get(
  "/treasury-queue",
  authenticate,
  requireAdmin,
  adminReadLimiter,
  [
    query("status").optional().isIn([...TQ_STATUSES]).withMessage("invalid status"),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const result = await listTreasuryQueue({
        models: db,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
      });
      return res.json(result);
    } catch (err) {
      console.error("GET /api/admin/treasury-queue error:", err);
      return res.status(500).json({ error: "Failed to list treasury queue" });
    }
  },
);

/**
 * POST /api/admin/treasury-queue/:id/mark-sent
 * Operator records that a manual USDT settlement has gone out.
 * Body: { usdtTxHash }
 */
router.post(
  "/treasury-queue/:id/mark-sent",
  authenticate,
  requireAdmin,
  adminEducatorLimiter,
  [
    param("id").isInt({ min: 1 }).toInt(),
    body("usdtTxHash").matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage("usdtTxHash must be 0x-prefixed 32-byte hash"),
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const result = await markTreasurySent({
        models: db,
        transferId: req.params.id,
        usdtTxHash: req.body.usdtTxHash,
        adminId: req.auth.sub,
      });
      if (!result.ok) {
        return res
          .status(STATUS_BY_REASON[result.reason] || 400)
          .json({
            error: result.reason,
            ...(result.existingUsdtTxHash ? { existingUsdtTxHash: result.existingUsdtTxHash } : {}),
            ...(result.currentStatus ? { currentStatus: result.currentStatus } : {}),
          });
      }
      return res.json({ message: "Treasury transfer marked as sent", transfer: result.transfer });
    } catch (err) {
      console.error("POST /api/admin/treasury-queue/:id/mark-sent error:", err);
      return res.status(500).json({ error: "Failed to mark transfer as sent" });
    }
  },
);

/**
 * POST /api/admin/referrals/:id/cancel
 * Cancels a referral that was flagged for review or pending.
 */
router.post(
  "/referrals/:id/cancel",
  authenticate,
  requireAdmin,
  adminEducatorLimiter,
  [
    param("id").isInt({ min: 1 }).toInt(),
    body("reason").optional().isString()
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const result = await cancelReferral({ models: db, referralId: req.params.id, reason: req.body.reason });
      if (!result.ok) return res.status(404).json({ error: result.reason });
      return res.json({ message: "Referral cancelled", referral: result.referral });
    } catch (err) {
      console.error("POST /api/admin/referrals/:id/cancel error:", err);
      return res.status(500).json({ error: "Failed to cancel referral" });
    }
  }
);

/**
 * POST /api/admin/referrals/:id/approve-review
 * Approves a referral that was flagged for review, allowing it to proceed.
 */
router.post(
  "/referrals/:id/approve-review",
  authenticate,
  requireAdmin,
  adminEducatorLimiter,
  [
    param("id").isInt({ min: 1 }).toInt()
  ],
  async (req, res) => {
    if (handleValidation(req, res)) return;
    try {
      const result = await approveReferralReview({ models: db, referralId: req.params.id });
      if (!result.ok) return res.status(404).json({ error: result.reason });
      return res.json({ message: "Referral review approved", referral: result.referral });
    } catch (err) {
      console.error("POST /api/admin/referrals/:id/approve-review error:", err);
      return res.status(500).json({ error: "Failed to approve review" });
    }
  }
);

module.exports = router;
