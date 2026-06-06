// backend/lib/rateLimitStore.js
//
// Shared helper for express-rate-limit stores.
//
// In production (REDIS_URL set) every per-route limiter should share state
// with every other instance of the process — otherwise the limit is
// effectively N × max for N instances behind a load balancer, which is
// what a security review caught.
//
// In tests / local dev (no REDIS_URL) we fall back to the default
// in-memory store; the suite must not require Redis to boot.
//
// Usage:
//   const buildRateLimitStore = require("../lib/rateLimitStore");
//   const limiter = rateLimit({
//     windowMs: ...,
//     max: ...,
//     store: buildRateLimitStore("/issue"),
//   });
//
// `name` is a human label that ends up in the warn log when Redis is
// unavailable, so ops can tell WHICH limiter is degraded.

const LOG_PREFIX = "[rateLimitStore]";

// Cache the warn so we don't spam the log once per limiter at boot.
const warnedFor = new Set();

/**
 * @param {string} name  Human label for warn logs.
 * @returns {import("rate-limit-redis").RedisStore | undefined}
 *          When undefined, express-rate-limit uses its default MemoryStore.
 */
function buildRateLimitStore(name = "anonymous") {
  if (!process.env.REDIS_URL) {
    if (!warnedFor.has(name)) {
      warnedFor.add(name);
      console.warn(
        `${LOG_PREFIX} REDIS_URL not set — limiter "${name}" falls back to ` +
          "in-memory store (per-process). Multi-instance deployments will see " +
          "effective_max = max × instance_count. Set REDIS_URL to share state.",
      );
    }
    return undefined;
  }

  // Require lazily — `rate-limit-redis` and `ioredis` are heavy imports we
  // shouldn't pay for unless someone actually wires a limiter.
  const { RedisStore } = require("rate-limit-redis");
  const { getRedis } = require("../services/redis");

  return new RedisStore({
    sendCommand: (...args) => getRedis().call(...args),
  });
}

/**
 * Test-only — clear the warned-for set so a test toggling REDIS_URL can
 * observe the warn fresh.
 */
function __resetWarnings() {
  warnedFor.clear();
}

module.exports = buildRateLimitStore;
module.exports.__resetWarnings = __resetWarnings;
