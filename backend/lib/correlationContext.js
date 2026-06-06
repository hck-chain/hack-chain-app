// backend/lib/correlationContext.js
//
// AsyncLocalStorage-backed correlation context. Lets any code in the
// async chain (use cases, services, the Harjoot http client, the cron
// worker) read the current correlation ID WITHOUT threading it through
// every function signature.
//
// Usage:
//   In a request middleware:
//     runWithCorrelationId(req.correlationId, () => next());
//   Or in the worker tick:
//     await runWithCorrelationId(`cron-${uuid()}`, async () => { ... });
//
// Anywhere downstream:
//     const id = getCorrelationId();   // string or undefined
//
// This is intentionally vanilla Node — no external dep — because
// AsyncLocalStorage is the right primitive for exactly this problem.

const { AsyncLocalStorage } = require("async_hooks");

const storage = new AsyncLocalStorage();

/**
 * Run `fn` with the given correlation ID active in the async context.
 *
 * @template T
 * @param {string} correlationId
 * @param {() => T} fn
 * @returns {T}
 */
function runWithCorrelationId(correlationId, fn) {
  if (typeof correlationId !== "string" || !correlationId) {
    throw new TypeError("runWithCorrelationId requires a non-empty correlationId");
  }
  if (typeof fn !== "function") {
    throw new TypeError("runWithCorrelationId requires a function");
  }
  return storage.run({ correlationId }, fn);
}

/**
 * @returns {string | undefined}
 */
function getCorrelationId() {
  const store = storage.getStore();
  return store && store.correlationId;
}

module.exports = {
  runWithCorrelationId,
  getCorrelationId,
  // Exposed for tests asserting on the underlying storage.
  __storage: storage,
};
