// Migration endpoint. Binds a Privy identity to the account the caller is already
// authenticated with (via the pre-Privy wallet login), so that logging in later with
// Google or email lands on the same profile, history and certificates.
//
// Note this does NOT link an email: linking accounts happens in Privy's client SDK.
// All the backend can do — and all it needs to do — is record the resulting DID.
// Returns a result object — never throws on business errors.

const { Op } = require("sequelize");

async function bindPrivyIdentity({ models, privyService, wallet, identityToken }) {
  if (!models || !privyService || !wallet) {
    throw new TypeError("bindPrivyIdentity requires { models, privyService, wallet }");
  }

  if (!identityToken) {
    return {
      ok: false,
      code: "IDENTITY_TOKEN_REQUIRED",
      httpStatus: 400,
      message: "identity_token is required",
    };
  }

  const identity = await privyService.verifyIdentityToken(identityToken);
  if (!identity) {
    return {
      ok: false,
      code: "INVALID_PRIVY_TOKEN",
      httpStatus: 401,
      message: "Invalid or expired Privy session",
    };
  }

  const user = await models.User.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!user) {
    return { ok: false, code: "USER_NOT_FOUND", httpStatus: 404, message: "User not found" };
  }

  if (user.privy_did) {
    if (user.privy_did === identity.did) {
      // Same identity bound again — treat as success so a retry is harmless.
      return {
        ok: true,
        data: {
          privy_did: user.privy_did,
          integrated_wallet_address: user.integrated_wallet_address,
          alreadyBound: true,
        },
      };
    }
    return {
      ok: false,
      code: "ALREADY_BOUND",
      httpStatus: 409,
      message: "This account is already bound to a different Privy identity",
    };
  }

  // Without this check a second account could bind the same DID and both would resolve
  // through POST /api/auth/privy, handing one person's session to another's profile.
  const didTaken = await models.User.findOne({ where: { privy_did: identity.did } });
  if (didTaken) {
    return {
      ok: false,
      code: "DID_ALREADY_LINKED",
      httpStatus: 409,
      message: "This Privy identity is already linked to another account",
    };
  }

  // integrated_wallet_address carries a partial unique index, so without this check a
  // collision surfaces as a 500 from Postgres instead of a usable error.
  if (identity.embeddedWallet) {
    const embeddedTaken = await models.User.findOne({
      where: {
        id: { [Op.ne]: user.id },
        integrated_wallet_address: identity.embeddedWallet,
      },
    });
    if (embeddedTaken) {
      return {
        ok: false,
        code: "EMBEDDED_WALLET_ALREADY_LINKED",
        httpStatus: 409,
        message: "This embedded wallet is already linked to another account",
      };
    }
  }

  // wallet_address is deliberately left untouched: this user's certificates are minted
  // on-chain at that address and must stay reachable. The embedded wallet is recorded
  // alongside it instead of replacing it.
  await user.update({
    privy_did: identity.did,
    integrated_wallet_address: identity.embeddedWallet || null,
  });

  return {
    ok: true,
    data: {
      privy_did: identity.did,
      integrated_wallet_address: identity.embeddedWallet || null,
      alreadyBound: false,
    },
  };
}

module.exports = { bindPrivyIdentity };
