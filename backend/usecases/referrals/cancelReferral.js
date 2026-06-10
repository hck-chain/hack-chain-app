// backend/harjoot/usecases/cancelReferral.js
async function cancelReferral({ models, referralId, reason }) {
  const ref = await models.Referral.findByPk(referralId);
  if (!ref) return { ok: false, reason: "NOT_FOUND" };
  
  await ref.update({
    status: 'cancelled',
    review_reason: reason || ref.review_reason
  });
  return { ok: true, referral: ref };
}

module.exports = { cancelReferral };
