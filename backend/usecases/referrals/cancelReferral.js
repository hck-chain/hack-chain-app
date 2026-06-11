// backend/harjoot/usecases/cancelReferral.js
const TERMINAL_STATES = ['claimed', 'cancelled'];

async function cancelReferral({ models, referralId, reason }) {
  const ref = await models.Referral.findByPk(referralId);
  if (!ref) return { ok: false, reason: "NOT_FOUND" };
  if (TERMINAL_STATES.includes(ref.status)) {
    return { ok: false, reason: "ALREADY_TERMINAL" };
  }

  await ref.update({
    status: 'cancelled',
    review_reason: reason || ref.review_reason
  });
  return { ok: true, referral: ref };
}

module.exports = { cancelReferral };
