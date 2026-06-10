// backend/harjoot/usecases/validateReferralCode.js

/**
 * Validates a referral code and returns the referrer's first name only.
 * Designed for public access without auth.
 */
async function validateReferralCode({ models, code }) {
  if (!models || !code) {
    return { valid: false };
  }

  // Sanitize the code: uppercase, trim, length check
  const cleanCode = code.toString().trim().toUpperCase();
  if (!/^[0-9A-HJ-NP-TV-Z]{8}$/.test(cleanCode)) {
    return { valid: false };
  }

  const user = await models.User.findOne({
    where: { referral_code: cleanCode },
    attributes: ['name']
  });

  if (!user) {
    return { valid: false };
  }

  return {
    valid: true,
    referrerName: user.name || "Usuario"
  };
}

module.exports = { validateReferralCode };
