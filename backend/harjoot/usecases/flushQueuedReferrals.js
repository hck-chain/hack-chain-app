// backend/harjoot/usecases/flushQueuedReferrals.js

/**
 * Sweeps all referrals in 'queued_next_month' state and promotes them
 * back to 'eligible' so the payout worker can process them in the new month.
 */
async function flushQueuedReferrals({ models }) {
  if (!models || !models.Referral) {
    throw new TypeError("flushQueuedReferrals requires { models }");
  }

  const [updatedCount] = await models.Referral.update(
    { status: 'eligible' },
    { where: { status: 'queued_next_month' } }
  );

  return { processed: updatedCount };
}

module.exports = { flushQueuedReferrals };
