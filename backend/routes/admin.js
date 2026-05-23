// backend/routes/admin.js
//
// SKELETON — HackChain admin routes.
// Implementation pending. See documents/harjoot-integration-handoff.md.
//
// DS Section 2.5 — educator approval workflow (manual whitelist).
// After registering, an issuer is "pending_approval" and cannot issue
// certificates until a HackChain admin approves them.
//
// ADMIN AUTH: this skeleton reuses the existing ADMIN_WALLET env-var pattern
// (see routes/issuers.js POST /authorize). Whether HackChain needs a proper
// admin role instead is an OPEN DECISION — see the handoff doc.

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const NOT_IMPLEMENTED = {
  error: "Not implemented — see documents/harjoot-integration-handoff.md",
};

// Guard — restrict a route to the configured admin wallet.
// Mirrors the pattern used by routes/issuers.js POST /authorize.
function requireAdmin(req, res, next) {
  const callerWallet = (req.auth && req.auth.wallet ? req.auth.wallet : "").toLowerCase();
  const adminWallet = (process.env.ADMIN_WALLET || "").toLowerCase();
  if (!adminWallet || callerWallet !== adminWallet) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}

/**
 * POST /api/admin/educators/:userId/approve
 * DS Section 2.5 — approve a pending educator.
 * Sets users.educator_approval_status = "approved" and emails the educator.
 */
router.post("/educators/:userId/approve", authenticate, requireAdmin, (req, res) => {
  // TODO(impl): DS Section 2.5.
  //  - UPDATE users SET educator_approval_status='approved', approved_at=now(),
  //    approved_by=<adminId> WHERE id=:userId AND role='issuer'.
  //  - emailService: notify the educator that the account was approved.
  return res.status(501).json(NOT_IMPLEMENTED);
});

/**
 * POST /api/admin/educators/:userId/reject
 * DS Section 2.5 — reject a pending educator. Body: { reason }.
 * Sets users.educator_approval_status = "rejected" and emails the educator.
 */
router.post("/educators/:userId/reject", authenticate, requireAdmin, (req, res) => {
  // TODO(impl): DS Section 2.5.
  //  - validate body.reason (non-empty string).
  //  - UPDATE users SET educator_approval_status='rejected',
  //    rejection_reason=:reason WHERE id=:userId AND role='issuer'.
  //  - emailService: notify the educator of the rejection and the reason.
  return res.status(501).json(NOT_IMPLEMENTED);
});

module.exports = router;
