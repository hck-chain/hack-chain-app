// backend/config/referrals.js

function parseIntWithDefault(value, fallback, name) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer (got "${value}")`);
  }
  return parsed;
}

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === "true" || value === "1";
}

function validateAddress(name, value) {
  if (!value) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} must be a 0x-prefixed 40-hex-char address (got "${value}")`);
  }
  return value.toLowerCase();
}

const config = Object.freeze({
  poolAddress: validateAddress("INCENTIVES_POOL_ADDRESS", process.env.INCENTIVES_POOL_ADDRESS),
  poolPrivateKey: process.env.INCENTIVES_POOL_PRIVATE_KEY,
  rewardHackWei: process.env.REFERRAL_REWARD_HACK_WEI || "1000000000000000000000",
  monthlyCap: parseIntWithDefault(process.env.REFERRAL_MONTHLY_CAP, 5, "REFERRAL_MONTHLY_CAP"),
  dailyPayoutCap: parseIntWithDefault(process.env.REFERRAL_DAILY_PAYOUT_CAP, 50, "REFERRAL_DAILY_PAYOUT_CAP"),
  ipSaltPepper: process.env.REFERRAL_IP_SALT_PEPPER || "default_pepper_change_in_prod",
  payoutCron: process.env.REFERRAL_PAYOUT_CRON || "*/10 * * * *",
  queueFlushCron: process.env.REFERRAL_QUEUE_FLUSH_CRON || "0 0 1 * *",
  stakingEnabled: parseBool(process.env.REFERRAL_STAKING_ENABLED, false),
  hackTokenAddress: validateAddress("HACK_TOKEN_ADDRESS", process.env.HACK_TOKEN_ADDRESS),
});

module.exports = config;
