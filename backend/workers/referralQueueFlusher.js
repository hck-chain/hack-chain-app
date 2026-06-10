// backend/workers/referralQueueFlusher.js
const cron = require("node-cron");
const { withPgAdvisoryLock, LOCK_KEYS } = require("../lib/dbLock");
const config = require("../harjoot/config");

const LOG_PREFIX = "[referralQueueFlusher]";

async function runFlushOnce(options = {}) {
  const models = options.models || require("../models");
  const { flushQueuedReferrals } = require("../harjoot/usecases/flushQueuedReferrals");

  try {
    const result = await flushQueuedReferrals({ models });
    if (result.processed > 0) {
      console.log(`${LOG_PREFIX} tick result: flushed=${result.processed}`);
    }
    return result;
  } catch (err) {
    console.error(`${LOG_PREFIX} tick aborted: ${err.message || err}`);
    return { processed: 0, failed: true };
  }
}

function scheduleQueueFlusher(options = {}) {
  const cronLib = options.cron || cron;
  // Default to 1st of every month at midnight
  const cronExpression = options.cronExpression || config.referrals.queueFlushCron || "0 0 1 * *";

  let running = false;

  const getSequelize = () => {
    if (options.sequelize) return options.sequelize;
    const models = options.models || require("../models");
    return models.sequelize;
  };

  const tick = async () => {
    if (running) {
      console.log(`${LOG_PREFIX} previous tick still running; skipping`);
      return;
    }
    running = true;
    try {
      const sequelize = getSequelize();
      const lockKey = (LOCK_KEYS && LOCK_KEYS.REFERRAL_QUEUE_FLUSHER) || 1003; 
      
      await withPgAdvisoryLock(
        sequelize,
        lockKey,
        () => runFlushOnce(options),
        {
          onSkip: () => console.log(`${LOG_PREFIX} another instance holds the lock; skipping this tick`),
        }
      );
    } finally {
      running = false;
    }
  };

  const task = cronLib.schedule(cronExpression, tick);
  console.log(`${LOG_PREFIX} scheduled cron="${cronExpression}"`);
  return task;
}

module.exports = {
  runFlushOnce,
  scheduleQueueFlusher
};
