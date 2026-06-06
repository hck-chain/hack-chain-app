// backend/lib/dbLock.js
//
// Cross-instance locking via Postgres advisory locks. Used by the treasury
// worker so two boxes running the same cron don't both fetch the same
// pending rows and (in non-manual conversion modes) double-spend USDT.
//
// SQLite (used by the test suite) does NOT support advisory locks. When
// the dialect isn't Postgres we no-op and execute `fn` directly — tests
// are single-instance so the lock is unnecessary, and skipping it keeps
// the helper portable.
//
// Lock-key contract:
//   Use a stable bigint per logical "section" (e.g. one for the treasury
//   worker, another for some hypothetical reconciliation job). Define
//   them as named constants below so collisions are detected at code
//   review time, not at runtime.
//
// Usage:
//   const { withPgAdvisoryLock, LOCK_KEYS } = require("../lib/dbLock");
//   const result = await withPgAdvisoryLock(
//     sequelize,
//     LOCK_KEYS.TREASURY_FORWARDER,
//     async () => { ...do work... },
//     { onSkip: () => console.log("another instance has the lock") },
//   );
//   // result is either fn()'s return value, or { skipped: true } if the
//   // lock was held by another instance.

const LOG_PREFIX = "[dbLock]";

// Postgres advisory-lock keys must fit in a signed 8-byte int. Picking
// values from a fixed namespace (HKCN-... in ASCII codepoints) so collisions
// with other apps sharing the same DB are extremely unlikely.
const LOCK_KEYS = Object.freeze({
  TREASURY_FORWARDER: 0x48414b43_5452_5357n, // "HACKTRSW" — TReasury SWorker
});

function getDialect(sequelize) {
  if (!sequelize) return null;
  if (typeof sequelize.getDialect === "function") return sequelize.getDialect();
  // Older Sequelize used `options.dialect`.
  return sequelize.options && sequelize.options.dialect;
}

/**
 * Try to acquire `key` via pg_try_advisory_lock. Returns true if acquired.
 * Non-blocking: if another session holds the lock, returns false immediately.
 *
 * @param {import("sequelize").Sequelize} sequelize
 * @param {bigint} key
 */
async function tryAdvisoryLock(sequelize, key) {
  const [rows] = await sequelize.query(
    "SELECT pg_try_advisory_lock(CAST(:key AS bigint)) AS acquired",
    { replacements: { key: String(key) } },
  );
  return rows && rows[0] && rows[0].acquired === true;
}

async function releaseAdvisoryLock(sequelize, key) {
  try {
    await sequelize.query(
      "SELECT pg_advisory_unlock(CAST(:key AS bigint))",
      { replacements: { key: String(key) } },
    );
  } catch (err) {
    // Releasing a lock we don't hold is harmless in Postgres (returns
    // false) but the query itself might fail under connection loss.
    // Log and continue — the connection will release its locks on close.
    console.warn(`${LOG_PREFIX} release failed for key=${key}: ${err.message || err}`);
  }
}

/**
 * Run `fn` while holding a Postgres advisory lock. On non-Postgres dialects
 * (SQLite in tests) the lock is skipped and `fn` runs unconditionally.
 *
 * @template T
 * @param {import("sequelize").Sequelize} sequelize
 * @param {bigint} key
 * @param {() => Promise<T>} fn
 * @param {{ onSkip?: () => void }} [opts]
 * @returns {Promise<T | { skipped: true }>}
 */
async function withPgAdvisoryLock(sequelize, key, fn, opts = {}) {
  if (!sequelize) throw new TypeError("withPgAdvisoryLock requires a sequelize instance");
  if (typeof fn !== "function") throw new TypeError("withPgAdvisoryLock requires an async fn");
  if (typeof key !== "bigint") throw new TypeError("withPgAdvisoryLock requires a bigint key");

  const dialect = getDialect(sequelize);
  if (dialect !== "postgres") {
    // SQLite / mariadb / etc — no advisory locks, just run.
    return fn();
  }

  let acquired = false;
  try {
    acquired = await tryAdvisoryLock(sequelize, key);
  } catch (err) {
    // If we can't even attempt the lock, fail closed — better to skip a
    // tick than to run unsafely.
    console.error(`${LOG_PREFIX} tryAdvisoryLock failed: ${err.message || err}`);
    if (opts.onSkip) opts.onSkip();
    return { skipped: true };
  }

  if (!acquired) {
    if (opts.onSkip) opts.onSkip();
    return { skipped: true };
  }

  try {
    return await fn();
  } finally {
    await releaseAdvisoryLock(sequelize, key);
  }
}

module.exports = {
  withPgAdvisoryLock,
  LOCK_KEYS,
  // Exposed for tests so they can verify the contract directly.
  __tryAdvisoryLock: tryAdvisoryLock,
  __releaseAdvisoryLock: releaseAdvisoryLock,
  __getDialect: getDialect,
};
