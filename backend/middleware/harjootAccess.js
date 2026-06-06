// backend/middleware/harjootAccess.js
//
// DS Section 3 — Express middleware that guards protected routes by ensuring
// the authenticated user still has an active Harjoot membership.
//
// Strategy:
//   - Module-scope in-memory cache (5 minute TTL per userId) avoids hitting
//     the DB on every request once we have confirmed an active membership.
//   - On a cache miss, defers to the ensureMembership use case which reads
//     the User row, talks to Harjoot only when the local expiry is stale,
//     and persists any refreshed expiry. The use case never throws — Harjoot
//     outages are soft-failed and the request is allowed through (DS decision:
//     issuance has its own $HACK cost gate, so the membership middleware does
//     not need to be a hard wall).
//
// Place this AFTER `authenticate` in the middleware chain so req.auth is set.

const db = require("../models");
const { createHarjootClient } = require("../harjoot/client");
const { ensureMembership } = require("../harjoot/usecases/ensureMembership");

const LOG_PREFIX = "[harjootAccess]";
const CACHE_TTL_MS = 5 * 60 * 1000;

// Map<userId, { expiresAt: string|null, cachedAt: number }>
const cache = new Map();

// Lazy singleton — the client is cheap to build but config validation runs at
// require time. Deferring until first request keeps the module load light and
// matches how `index.js` instantiates the client for Section 0.
let sharedClient = null;
function getClient() {
  if (!sharedClient) {
    sharedClient = createHarjootClient();
  }
  return sharedClient;
}

function isCacheValid(entry, now) {
  if (!entry) return false;
  if (now - entry.cachedAt >= CACHE_TTL_MS) return false;
  if (entry.expiresAt) {
    const expiryMs = new Date(entry.expiresAt).getTime();
    if (Number.isFinite(expiryMs) && expiryMs <= now) return false;
  }
  return true;
}

/**
 * Express middleware — ensures the authenticated user has an active Harjoot
 * membership. ALWAYS calls next() — failures are non-blocking.
 *
 * @param {import('express').Request}      req
 * @param {import('express').Response}     res
 * @param {import('express').NextFunction} next
 */
async function requireHarjootAccess(req, res, next) {
  const userId = req.auth && req.auth.sub;
  if (!userId) {
    // The auth middleware should have already rejected this request. Defensive
    // pass-through if it slipped through (downstream will re-check auth).
    return next();
  }

  const now = Date.now();
  const cached = cache.get(userId);
  if (isCacheValid(cached, now)) {
    return next();
  }

  try {
    const result = await ensureMembership({
      client: getClient(),
      models: db,
      userId,
    });
    if (result && result.ok) {
      cache.set(userId, { expiresAt: result.expiresAt || null, cachedAt: now });
    }
  } catch (err) {
    // Use case only throws on programmer errors (missing deps). Log loud — the
    // request continues regardless so users are not locked out by a bug.
    console.error(`${LOG_PREFIX} unexpected error: ${err && err.message}`);
  }

  return next();
}

/**
 * Test-only — clear the in-memory cache and force a new client on next use.
 */
function __resetForTests() {
  cache.clear();
  sharedClient = null;
}

module.exports = {
  requireHarjootAccess,
  __resetForTests,
  // Exported so the middleware test can observe cache behaviour.
  __cache: cache,
  __CACHE_TTL_MS: CACHE_TTL_MS,
};
