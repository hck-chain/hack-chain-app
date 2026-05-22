// backend/middleware/harjootAccess.js
//
// SKELETON — Harjoot membership guard.
// Implementation pending. See documents/harjoot-integration-handoff.md.
//
// DS Section 3. Runs before protected routes (issuance, portfolio, search).
// Reads users.harjoot_membership_expires_at; if missing or expired it calls
// harjootService.checkAccess and, in the free-test phase, re-activates the
// membership for free via harjootService.activateAccess.
//
// SKELETON BEHAVIOUR: this middleware is currently a PASS-THROUGH. It does NOT
// enforce membership yet — it only logs a warning. Do not rely on it for
// access control until implemented.

// const harjootService = require("../services/harjootService");

/**
 * Express middleware — require an active Harjoot membership for the caller.
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
function requireHarjootAccess(req, res, next) {
  // TODO(impl): DS Section 3.
  //  1. Read users.harjoot_membership_expires_at for req.auth.wallet.
  //  2. If still valid -> next().
  //  3. If missing or expired -> harjootService.checkAccess(); if inactive,
  //     harjootService.activateAccess() (free re-activation in the test phase);
  //     persist the new expiry; then next().
  //  Suggested cache: 5 minutes per (wallet, segment).
  console.warn("[harjootAccess] SKELETON pass-through — membership not enforced.");
  return next();
}

module.exports = { requireHarjootAccess };
