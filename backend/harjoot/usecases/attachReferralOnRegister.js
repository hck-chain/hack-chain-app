// backend/harjoot/usecases/attachReferralOnRegister.js

/**
 * Attaches a referral to a newly registered user if they provided a valid code.
 * This is meant to be called inside the registration transaction.
 * Does not throw on business errors, returns a Result object instead so the
 * caller can decide whether to abort or proceed.
 */
async function attachReferralOnRegister({
  models,
  transaction,
  referrerCode,
  referredUser,
  ipHash,
  userAgentHash,
  now = new Date()
}) {
  if (!models || !referredUser) {
    throw new TypeError("attachReferralOnRegister requires { models, referredUser }");
  }

  if (!referrerCode) {
    return { attached: false, reason: "no_code" };
  }

  // 1. Find referrer
  const cleanCode = referrerCode.toString().trim().toUpperCase();
  const referrer = await models.User.findOne({
    where: { referral_code: cleanCode },
    transaction
  });

  if (!referrer) {
    return { attached: false, reason: "code_not_found" };
  }

  // 2. Prevent self-referral
  if (referrer.id === referredUser.id) {
    return { attached: false, reason: "self_referral_id" };
  }
  
  if (referrer.wallet_address && referredUser.wallet_address && 
      referrer.wallet_address.toLowerCase() === referredUser.wallet_address.toLowerCase()) {
    return { attached: false, reason: "self_referral_wallet" };
  }
  
  if (referrer.email && referredUser.email && 
      referrer.email.toLowerCase() === referredUser.email.toLowerCase()) {
    return { attached: false, reason: "self_referral_email" };
  }

  // 3. Check if referredUser is already referred by someone else
  const existingReferral = await models.Referral.findOne({
    where: { referred_user_id: referredUser.id },
    transaction
  });

  if (existingReferral) {
    return { attached: false, reason: "already_referred" };
  }

  // 4. Sybil check: did this IP/UA combination refer too many people today?
  let requiresReview = false;
  let reviewReason = null;

  if (ipHash) {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const sameIpCount = await models.Referral.count({
      where: { 
        referral_ip_hash: ipHash,
        created_at: { [models.Sequelize.Op.gte]: startOfDay }
      },
      transaction
    });

    if (sameIpCount >= 2) {
      requiresReview = true;
      reviewReason = "multiple_referrals_from_ip_24h";
    }
  }

  // 5. Create referral record
  const newReferral = await models.Referral.create({
    referrer_user_id: referrer.id,
    referred_user_id: referredUser.id,
    referral_code_used: cleanCode,
    status: "pending_stake",
    referral_ip_hash: ipHash || null,
    referral_user_agent_hash: userAgentHash || null,
    requires_review: requiresReview,
    review_reason: reviewReason,
    created_at: now,
    updated_at: now
  }, { transaction });

  return { attached: true, referralId: newReferral.id, requiresReview };
}

module.exports = { attachReferralOnRegister };
