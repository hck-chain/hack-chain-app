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
const { requireAdmin } = require("../middleware/requireAdmin");
const db = require("../models");
const emailService = require("../services/emailService");
const { approveEducator } = require("../harjoot/usecases/approveEducator");
const { rejectEducator } = require("../harjoot/usecases/rejectEducator");
const { listEducators, __ALLOWED_STATUSES } = require("../harjoot/usecases/listEducators");

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

module.exports = router;
