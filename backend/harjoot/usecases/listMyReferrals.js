// backend/harjoot/usecases/listMyReferrals.js

/**
 * Lists the referrals made by a user, paginated.
 * Hides PII (Personal Identifiable Information) by only projecting the referred user's first name.
 */
async function listMyReferrals({ models, userId, page = 1, pageSize = 10, config }) {
  if (!models || !userId) {
    throw new TypeError("listMyReferrals requires { models, userId }");
  }

  const offset = (page - 1) * pageSize;

  const { rows, count } = await models.Referral.findAndCountAll({
    where: { referrer_user_id: userId },
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset,
    include: [{
      model: models.User,
      as: 'referred',
      attributes: ['name']
    }]
  });

  // Calculate monthly stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyClaimedCount = await models.Referral.count({
    where: {
      referrer_user_id: userId,
      status: 'claimed',
      claimed_at: { [models.Sequelize.Op.gte]: startOfMonth }
    }
  });

  const monthlyCap = config && config.referrals ? config.referrals.monthlyCap : 5;
  const monthlyCapRemaining = Math.max(0, monthlyCap - monthlyClaimedCount);

  return {
    referrals: rows.map(r => ({
      id: r.id,
      referredName: r.referred ? (r.referred.name || 'Usuario') : 'Usuario',
      status: r.status,
      staking_started_at: r.staking_started_at,
      payout_tx_hash: r.payout_tx_hash
    })),
    totalCount: count,
    page,
    pageSize,
    monthlyClaimedCount,
    monthlyCapRemaining
  };
}

module.exports = { listMyReferrals };
