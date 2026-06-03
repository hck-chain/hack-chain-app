// backend/harjoot/usecases/checkPartnerHealth.js
//
// DS Section 0 — verify the Harjoot partner API key is valid at server startup
// and cache the partner config in memory for the lifetime of the process.
//
// This use case NEVER throws. A failed health check is logged but does not
// abort the server — Harjoot being temporarily unreachable should not take
// HackChain down. Routes that need the cached info handle a null cache
// gracefully and fall back to making a fresh request through the client.
//
// On success the cache is updated with the latest response. On failure the
// previous successful cache is preserved (last-known-good) so a transient
// outage doesn't lose what we already learned about the partner.

const LOG_PREFIX = "[harjoot:health]";

// ---------------------------------------------------------------------------
// Module-scope cache. Survives the lifetime of the Node process.
// ---------------------------------------------------------------------------
let cachedPartnerInfo = null;
let lastCheckedAt = null;
let lastError = null;

/**
 * Run the partner health check against Harjoot and update the in-memory cache.
 * Returns a Result-style object; never throws.
 *
 * @param {object} client  A Harjoot client (from createHarjootClient).
 * @returns {Promise<{ ok: boolean, info: object|null, error: Error|null }>}
 */
async function checkPartnerHealth(client) {
  try {
    const info = await client.getPartnerInfo();
    cachedPartnerInfo = info;
    lastCheckedAt = new Date();
    lastError = null;

    const slug = info && info.partner && info.partner.slug ? info.partner.slug : "?";
    const active = info && info.partner && info.partner.active != null ? info.partner.active : "?";
    const modes = info && Array.isArray(info.modes) ? info.modes.join(",") : "";
    console.log(`${LOG_PREFIX} OK partner=${slug} active=${active} modes=${modes}`);

    return { ok: true, info, error: null };
  } catch (error) {
    lastCheckedAt = new Date();
    lastError = error;
    // Do NOT throw — startup must continue.
    console.error(`${LOG_PREFIX} FAILED — ${error.name || "Error"}: ${error.message}`);
    return { ok: false, info: cachedPartnerInfo, error };
  }
}

/**
 * Get the most recent successful partner info, or null if no successful check
 * has ever run.
 */
function getCachedPartnerInfo() {
  return cachedPartnerInfo;
}

/**
 * Snapshot of the cache state — useful for /health endpoints and debugging.
 */
function getHealthState() {
  return {
    hasCache: cachedPartnerInfo !== null,
    lastCheckedAt,
    lastError: lastError
      ? { name: lastError.name, message: lastError.message, code: lastError.code }
      : null,
  };
}

/**
 * Reset all module-scope state. Test-only — do not call from production code.
 */
function __resetForTests() {
  cachedPartnerInfo = null;
  lastCheckedAt = null;
  lastError = null;
}

module.exports = {
  checkPartnerHealth,
  getCachedPartnerInfo,
  getHealthState,
  __resetForTests,
};
