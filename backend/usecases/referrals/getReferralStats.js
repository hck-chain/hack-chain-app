// backend/harjoot/usecases/getReferralStats.js

/**
 * Aggregates statistics about a user's referrals for the dashboard.
 */
async function getReferralStats({ models, userId, now = new Date(), config }) {
  if (!models || !userId) {
    throw new TypeError("getReferralStats requires { models, userId }");
  }

  const referrals = await models.Referral.findAll({
    where: { referrer_user_id: userId },
    attributes: ['status', 'payout_amount_wei']
  });

  const stats = {
    totalEarnedWei: "0",
    pendingCount: 0,
    eligibleCount: 0,
    queuedCount: 0,
    claimedCount: 0,
    cancelledCount: 0
  };

  let totalEarned = 0n;

  for (const ref of referrals) {
    switch (ref.status) {
      case 'pending_stake':
      case 'staking':
        stats.pendingCount++;
        break;
      case 'eligible':
        stats.eligibleCount++;
        break;
      case 'queued_next_month':
        stats.queuedCount++;
        break;
      case 'claimed':
        stats.claimedCount++;
        if (ref.payout_amount_wei) {
          totalEarned += BigInt(ref.payout_amount_wei);
        }
        break;
      case 'cancelled':
      case 'expired':
        stats.cancelledCount++;
        break;
    }
  }

  stats.totalEarnedWei = totalEarned.toString();

  // Add cap info
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyClaimedCount = await models.Referral.count({
    where: {
      referrer_user_id: userId,
      status: 'claimed',
      claimed_at: { [models.Sequelize.Op.gte]: startOfMonth }
    }
  });

  const monthlyCap = config && config.monthlyCap ? config.monthlyCap : 5;
  stats.monthlyCapRemaining = Math.max(0, monthlyCap - monthlyClaimedCount);

  return stats;
}

module.exports = { getReferralStats };
