// backend/harjoot/usecases/ensureReferralCode.js
const crypto = require('crypto');

const BASE32_CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function generateCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, BASE32_CROCKFORD.length);
    code += BASE32_CROCKFORD[randomIndex];
  }
  return code;
}

/**
 * Ensures the user has a referral code. If not, generates one and saves it.
 * Retries up to 3 times on unique constraint collisions.
 */
async function ensureReferralCode({ models, user }) {
  if (!models || !user || !user.id) {
    throw new TypeError("ensureReferralCode requires { models, user } with user.id");
  }

  // Idempotent: return existing code if present
  if (user.referral_code) {
    return { ok: true, code: user.referral_code };
  }

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const newCode = generateCode(8);
    try {
      await models.User.update(
        { referral_code: newCode },
        { where: { id: user.id } }
      );
      // Update the instance too so caller has the new state
      user.referral_code = newCode;
      return { ok: true, code: newCode };
    } catch (err) {
      // If it's a unique constraint error (colision), retry
      if (err.name === 'SequelizeUniqueConstraintError') {
        if (attempt === maxRetries) {
          return { ok: false, reason: "max_retries_exceeded" };
        }
        continue;
      }
      throw err; // Other DB error, throw
    }
  }
}

module.exports = { ensureReferralCode, generateCode };
