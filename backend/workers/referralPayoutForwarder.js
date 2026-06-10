// backend/workers/referralPayoutForwarder.js
const cron = require("node-cron");
const { withPgAdvisoryLock, LOCK_KEYS } = require("../lib/dbLock");
const config = require("../harjoot/config");

const LOG_PREFIX = "[referralPayoutForwarder]";

async function runPayoutOnce(options = {}) {
  const models = options.models || require("../models");
  const { createIncentivesPayoutAdapter } = require("../harjoot/adapters/incentivesPayoutAdapter");
  const { payoutReferralRewards } = require("../harjoot/usecases/payoutReferralRewards");
  
  let adapter;
  try {
    adapter = createIncentivesPayoutAdapter();
  } catch (err) {
    console.error(`${LOG_PREFIX} Adapter initialization failed: ${err.message}`);
    return { processed: 0, skipped: 0, failed: true };
  }

  try {
    const result = await payoutReferralRewards({
      models,
      adapter,
      config: options.config || config
    });
    if (result.processed > 0 || result.skipped > 0) {
      console.log(`${LOG_PREFIX} tick result: processed=${result.processed} skipped=${result.skipped}`);
    }
    return result;
  } catch (err) {
    console.error(`${LOG_PREFIX} tick aborted: ${err.message || err}`);
    return { processed: 0, skipped: 0, failed: true };
  }
}

function schedulePayoutForwarder(options = {}) {
  const cronLib = options.cron || cron;
  const cronExpression = options.cronExpression || config.referrals.payoutCron || "*/10 * * * *";

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
      await withPgAdvisoryLock(
        sequelize,
        LOCK_KEYS.REFERRAL_PAYOUT_FORWARDER,
        () => runPayoutOnce(options),
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
  runPayoutOnce,
  schedulePayoutForwarder
};
