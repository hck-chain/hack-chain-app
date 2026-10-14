// Migration endpoint. Binds a Privy identity to the account the caller is already
// authenticated with (via the pre-Privy wallet login), so that logging in later with
// Google or email lands on the same profile, history and certificates.
//
// Note this does NOT link an email in Privy: that happens in Privy's client SDK. What the
// backend does is record the resulting DID and fill in whatever the profile is still
// missing from the verified identity token. A retry is not a no-op: it exists precisely to
// complete what a previous call could not (Privy provisions the embedded wallet
// asynchronously, so the first call may arrive before it exists).
// Returns a result object — never throws on business errors.

const { Op } = require("sequelize");

function fail(code, message, httpStatus) {
  return { ok: false, code, httpStatus, message };
}

const normalizeEmail = (email) => String(email).toLowerCase().trim();

// Thrown inside the transaction, so that everything done so far is rolled back.
class EmailHolderChanged extends Error {}

async function bindPrivyIdentity({ models, privyService, wallet, identityToken }) {
  if (!models || !privyService || !wallet) {
    throw new TypeError("bindPrivyIdentity requires { models, privyService, wallet }");
  }

  const { User, sequelize } = models;
  if (!sequelize) {
    throw new TypeError("bindPrivyIdentity requires models.sequelize to run its transaction");
  }

  if (!identityToken) {
    return fail("IDENTITY_TOKEN_REQUIRED", "identity_token is required", 400);
  }

  const identity = await privyService.verifyIdentityToken(identityToken);
  if (!identity) {
    return fail("INVALID_PRIVY_TOKEN", "Invalid or expired Privy session", 401);
  }

  const user = await User.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!user) {
    return fail("USER_NOT_FOUND", "User not found", 404);
  }

  const alreadyBound = Boolean(user.privy_did);
  const updates = {};

  if (alreadyBound) {
    if (user.privy_did !== identity.did) {
      return fail("ALREADY_BOUND", "This account is already bound to a different Privy identity", 409);
    }
  } else {
    // Without this check a second account could bind the same DID and both would resolve
    // through POST /api/auth/privy, handing one person's session to another's profile.
    const didTaken = await User.findOne({ where: { privy_did: identity.did } });
    if (didTaken) {
      return fail("DID_ALREADY_LINKED", "This Privy identity is already linked to another account", 409);
    }
    updates.privy_did = identity.did;
  }

  // integrated_wallet_address carries a partial unique index, so without this check a
  // collision surfaces as a 500 from Postgres instead of a usable error.
  if (!user.integrated_wallet_address && identity.embeddedWallet) {
    const embeddedTaken = await User.findOne({
      where: { id: { [Op.ne]: user.id }, integrated_wallet_address: identity.embeddedWallet },
    });
    if (embeddedTaken) {
      return fail("EMBEDDED_WALLET_ALREADY_LINKED", "This embedded wallet is already linked to another account", 409);
    }
    updates.integrated_wallet_address = identity.embeddedWallet;
  }

  // The profile email is only filled when empty: an existing one is kept as it is.
  let emailHolder = null;
  if (!user.email) {
    if (!identity.email) {
      return fail("EMAIL_REQUIRED", "The Privy account must have a verified email address", 400);
    }

    const email = normalizeEmail(identity.email);
    emailHolder = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } });

    // A verified email prevails over an unverified one: Privy proved the caller controls
    // it, while the pre-Privy registration accepted any address without checking it. The
    // other holder is only displaced when it is unverified AND has no Privy identity of
    // its own — one that is verified, or that logs in through Privy, keeps its email.
    // That second case is what two different Privy identities sharing an email look like.
    if (emailHolder && (emailHolder.email_verified || emailHolder.privy_did)) {
      return fail("EMAIL_ALREADY_IN_USE", "This email already belongs to another verified account", 409);
    }

    updates.email = email;
    updates.email_verified = true;
  }

  if (Object.keys(updates).length > 0) {
    try {
      // wallet_address is deliberately left untouched: this user's certificates are minted
      // on-chain at that address and must stay reachable.
      await sequelize.transaction(async (t) => {
        if (emailHolder) {
          // The email has a partial unique index, so it has to be released before this
          // account takes it. The update repeats the conditions that were checked above:
          // if the other account got verified, or bound a Privy identity, in between, it
          // matches no row and nothing is taken from it.
          const [released] = await User.update(
            { email: null, verification_token: null, verification_token_expires_at: null },
            {
              where: { id: emailHolder.id, email: emailHolder.email, email_verified: false, privy_did: null },
              transaction: t,
            }
          );
          if (released !== 1) throw new EmailHolderChanged();
        }
        await user.update(updates, { transaction: t });
      });
    } catch (err) {
      if (err instanceof EmailHolderChanged) {
        return fail("EMAIL_ALREADY_IN_USE", "This email already belongs to another verified account", 409);
      }
      // Two retries racing, or a collision created after the checks above.
      if (err && err.name === "SequelizeUniqueConstraintError") {
        return fail("IDENTITY_CONFLICT", "This identity conflicts with another account, try again", 409);
      }
      throw err;
    }

    if (emailHolder) {
      console.warn(
        `[privy] email taken from unverified account id=${emailHolder.id} wallet=${emailHolder.wallet_address} ` +
          `and given to id=${user.id} wallet=${user.wallet_address}`
      );
    }
  }

  return {
    ok: true,
    data: {
      privy_did: user.privy_did,
      integrated_wallet_address: user.integrated_wallet_address || null,
      email: user.email || null,
      // True when the DID was already bound before this call, even if this call completed
      // something that was still pending.
      alreadyBound,
    },
  };
}

module.exports = { bindPrivyIdentity };
