// Resolves a Privy access token to an existing HackChain user.
// Returns a result object — never throws on business errors.

/**
 * @param {object} deps
 * @param {object} deps.models              { User }
 * @param {object} deps.privyService        verifyAccessToken(token)
 * @param {function} deps.signRegistrationToken  (did) => string
 * @param {string} deps.accessToken
 */
async function authenticateWithPrivy({ models, privyService, signRegistrationToken, accessToken }) {
  if (!models || !privyService || !signRegistrationToken) {
    throw new TypeError(
      "authenticateWithPrivy requires { models, privyService, signRegistrationToken }"
    );
  }

  if (!accessToken) {
    return {
      ok: false,
      code: "ACCESS_TOKEN_REQUIRED",
      httpStatus: 400,
      message: "access_token is required",
    };
  }

  const verified = await privyService.verifyAccessToken(accessToken);
  if (!verified) {
    return {
      ok: false,
      code: "INVALID_PRIVY_TOKEN",
      httpStatus: 401,
      message: "Invalid or expired Privy session",
    };
  }

  const user = await models.User.findOne({ where: { privy_did: verified.did } });

  if (!user) {
    // Not an error: the caller proved control of the DID, they just have no profile yet.
    // A short-lived token carries the already-verified DID into complete-registration so
    // that endpoint never has to trust a DID sent in the body.
    return {
      ok: true,
      data: {
        status: "registration_required",
        registration_token: signRegistrationToken(verified.did),
      },
    };
  }

  if (!user.is_active) {
    return {
      ok: false,
      code: "ACCOUNT_DISABLED",
      httpStatus: 403,
      message: "This account is disabled",
    };
  }

  return { ok: true, data: { status: "authenticated", user } };
}

module.exports = { authenticateWithPrivy };
