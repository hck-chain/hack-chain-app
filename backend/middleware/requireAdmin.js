// backend/middleware/requireAdmin.js
//
// Shared admin-gate middleware. Replaces the inline `requireAdmin` copies
// that were sprinkled across routes/admin.js, routes/issuers.js, and
// routes/sessions.js, each implementing the same single-wallet check.
//
// The dashboard work needs MULTIPLE admins (CTO + founder). We support
// both the new comma-separated ADMIN_WALLETS and the legacy ADMIN_WALLET
// for backward compatibility — production can flip the env without a
// re-deploy of the routes that depended on the old name.
//
// Auth:
//   - Caller must be authenticated (req.auth.wallet present).
//   - Caller wallet must match an entry in ADMIN_WALLETS (preferred) or
//     ADMIN_WALLET (legacy single).
//   - Comparison is lowercased on both sides.
//
// Safety:
//   - If no admin wallet is configured at all, the middleware returns 403.
//     We refuse to default-allow any wallet — fail closed.
//
// The parsed list is cached for the process lifetime to avoid splitting
// the env on every request. Tests can clear it with __resetCache().

const LOG_PREFIX = "[requireAdmin]";

let cachedAdmins = null;

function parseAdminList() {
  const list = process.env.ADMIN_WALLETS || "";
  const single = process.env.ADMIN_WALLET || "";
  const set = new Set();
  for (const raw of [...list.split(","), single]) {
    const w = (raw || "").trim().toLowerCase();
    if (w) set.add(w);
  }
  return set;
}

function getAdmins() {
  if (cachedAdmins === null) {
    cachedAdmins = parseAdminList();
  }
  return cachedAdmins;
}

/**
 * Express middleware. Allows the request only when the authenticated
 * wallet matches one of the configured admin wallets.
 */
function requireAdmin(req, res, next) {
  const callerWallet = (req.auth && req.auth.wallet ? req.auth.wallet : "").toLowerCase();
  const admins = getAdmins();
  if (admins.size === 0) {
    // Fail closed: no admin configured -> reject everyone, including
    // authenticated users. The alternative (allow-all) is a disaster.
    console.warn(`${LOG_PREFIX} request rejected — no ADMIN_WALLET(S) configured`);
    return res.status(403).json({ error: "Admin access required" });
  }
  if (!callerWallet || !admins.has(callerWallet)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}

/**
 * @returns {boolean} true when the wallet is an admin. Useful for routes
 *   that want to mix admin + non-admin behavior in a single handler.
 */
function isAdmin(walletAddress) {
  if (!walletAddress || typeof walletAddress !== "string") return false;
  return getAdmins().has(walletAddress.toLowerCase());
}

/**
 * @returns {string[]} sorted admin wallets, lowercased. For /admin/stats
 *   "configured admins" disclosure or similar non-secret reports.
 */
function listAdmins() {
  return [...getAdmins()].sort();
}

/**
 * Test-only — clear the parsed cache so a test toggling env can take effect.
 */
function __resetCache() {
  cachedAdmins = null;
}

module.exports = {
  requireAdmin,
  isAdmin,
  listAdmins,
  __resetCache,
};
