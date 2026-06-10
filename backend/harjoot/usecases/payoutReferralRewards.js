// backend/harjoot/usecases/payoutReferralRewards.js

/**
 * Sweeps 'eligible' referrals, applies daily and monthly limits,
 * executes token transfers via the adapter, and records the payouts.
 */
async function payoutReferralRewards({ models, adapter, config, now = new Date() }) {
  if (!models || !adapter || !config) {
    throw new TypeError("payoutReferralRewards requires { models, adapter, config }");
  }

  const rewardAmountWei = config.referrals.rewardHackWei || "1000000000000000000000";
  const monthlyCap = config.referrals.monthlyCap || 5;
  const dailyPayoutCap = config.referrals.dailyPayoutCap || 50;

  // 1. Enforce global daily payout cap to mitigate draining attacks
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  let todayPayoutsCount = await models.Referral.count({
    where: {
      status: 'claimed',
      claimed_at: { [models.Sequelize.Op.gte]: startOfDay }
    }
  });

  if (todayPayoutsCount >= dailyPayoutCap) {
    return { processed: 0, skipped: 0, reason: "daily_cap_reached" };
  }

  // 2. Fetch eligible referrals (in FIFO order)
  const eligibleReferrals = await models.Referral.findAll({
    where: { status: 'eligible' },
    include: [
      { model: models.User, as: 'referrer', attributes: ['id', 'wallet_address'] }
    ],
    order: [['created_at', 'ASC']],
    limit: dailyPayoutCap // no need to fetch more than the max we could possibly pay
  });

  let processed = 0;
  let skipped = 0;

  for (const ref of eligibleReferrals) {
    if (todayPayoutsCount >= dailyPayoutCap) {
      break; // Cap reached mid-loop
    }

    const referrer = ref.referrer;
    if (!referrer || !referrer.wallet_address) {
      await ref.update({ status: 'cancelled', review_reason: 'referrer_missing_wallet' });
      skipped++;
      continue;
    }

    // 3. Enforce user's individual monthly cap
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const userMonthlyClaims = await models.Referral.count({
      where: {
        referrer_user_id: referrer.id,
        status: 'claimed',
        claimed_at: { [models.Sequelize.Op.gte]: startOfMonth }
      }
    });

    if (userMonthlyClaims >= monthlyCap) {
      await ref.update({ status: 'queued_next_month' });
      skipped++;
      continue;
    }

    // 4. Fire the transaction
    let txHash;
    try {
      const result = await adapter.transferHack(referrer.wallet_address, rewardAmountWei);
      txHash = result.txHash;
    } catch (err) {
      // Transfer failed (e.g. pool ran out of gas/tokens, RPC error).
      // We log and break the loop so we don't spam failing txs.
      // The referrals remain 'eligible' for the next cron run.
      console.error(`[payoutReferralRewards] Transfer failed for referral ${ref.id}:`, err);
      break; 
    }

    // 5. Transactional DB update
    await models.sequelize.transaction(async (t) => {
      await ref.update({
        status: 'claimed',
        payout_amount_wei: rewardAmountWei,
        payout_tx_hash: txHash,
        claimed_at: now
      }, { transaction: t });

      await models.IncentivesPoolLedger.create({
        referral_id: ref.id,
        user_id: referrer.id,
        amount_wei: rewardAmountWei,
        tx_hash: txHash,
        category: 'referral_reward'
      }, { transaction: t });
    });

    processed++;
    todayPayoutsCount++;
  }

  return { processed, skipped };
}

module.exports = { payoutReferralRewards };
