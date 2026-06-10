// backend/harjoot/usecases/approveReferralReview.js
async function approveReferralReview({ models, referralId }) {
  const ref = await models.Referral.findByPk(referralId);
  if (!ref) return { ok: false, reason: "NOT_FOUND" };
  
  await ref.update({
    requires_review: false
  });
  return { ok: true, referral: ref };
}

module.exports = { approveReferralReview };
