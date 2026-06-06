// backend/routes/admin.js
//
// HackChain admin routes — DS Section 2.5 educator approval workflow.
//
// Auth model: reuses the ADMIN_WALLET env-var pattern from
// routes/issuers.js POST /authorize. Whether HackChain needs a proper admin
// role instead is an OPEN DECISION (see documents/harjoot-integration-handoff.md).

const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const { authenticate } = require("../middleware/auth");
const db = require("../models");
const emailService = require("../services/emailService");
const { approveEducator } = require("../harjoot/usecases/approveEducator");
const { rejectEducator } = require("../harjoot/usecases/rejectEducator");

// Per Phase 9 plan: 100/hour per admin wallet. Even with only one admin
// today, a runaway script that loops over a list of educator IDs should be
// throttled rather than smash the DB + email provider. Keyed by the
// authenticated wallet; ipKeyGenerator is the IPv6-safe fallback.
const adminEducatorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin actions. Try again in an hour." },
  keyGenerator: (req) => (req.auth && req.auth.wallet) || ipKeyGenerator(req),
});

// Guard — restrict a route to the configured admin wallet. Mirrors the
// pattern used by routes/issuers.js POST /authorize.
function requireAdmin(req, res, next) {
  const callerWallet = (req.auth && req.auth.wallet ? req.auth.wallet : "").toLowerCase();
  const adminWallet = (process.env.ADMIN_WALLET || "").toLowerCase();
  if (!adminWallet || callerWallet !== adminWallet) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}

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

module.exports = router;
