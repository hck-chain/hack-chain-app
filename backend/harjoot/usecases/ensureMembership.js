// backend/harjoot/usecases/ensureMembership.js
//
// DS Section 3 — verify that the authenticated user has an active Harjoot
// membership and lazily refresh it via Harjoot when the local cache is stale.
//
// Strategy (cache-aside on the User row):
//
//   1. Read `users.harjoot_membership_expires_at`. If it is in the future,
//      we trust it and skip the network — that's the hot path.
//
//   2. Otherwise call `client.checkAccess()`:
//        - active=true  → Harjoot confirms membership, refresh the local
//                         expiry and return ok with source="check".
//        - active=false → Harjoot says it expired. Try to reactivate (free
//                         in pay-per-mint mode) via `client.activateAccess()`;
//                         persist the new expiry and return source="reactivated".
//
//   3. If anything goes wrong talking to Harjoot, "soft-fail": log a warning
//      and return ok=true with soft_failed=true. Per the DS, an expired or
//      uncheckable membership must NOT block users — issuance has its own
//      cost gate via $HACK payment, so allowing through here is safe.
//
// The use case throws ONLY on programmer errors (missing deps, invalid args).
// All upstream failures are mapped to a Result-style return.

const LOG_PREFIX = "[harjoot:access]";

const USER_ATTRIBUTES = ["id", "wallet_address", "role", "harjoot_membership_expires_at"];

async function loadProfile(models, role, walletAddress) {
  switch (role) {
    case "student":
      return await models.Student.findOne({ where: { wallet_address: walletAddress } });
    case "issuer":
      return await models.Issuer.findOne({ where: { wallet_address: walletAddress } });
    case "recruiter":
      return await models.Recruiter.findOne({ where: { wallet_address: walletAddress } });
    default:
      return null;
  }
}

function isFuture(value) {
  if (!value) return false;
  const t = new Date(value).getTime();
  return Number.isFinite(t) && t > Date.now();
}

/**
 * Ensure the user identified by `userId` has an active Harjoot membership,
 * refreshing it via Harjoot when the locally cached expiry is stale.
 *
 * @param {object} params
 * @param {object} params.client    A Harjoot client (from createHarjootClient).
 * @param {object} params.models    The Sequelize `db` object (User, Student,
 *                                  Issuer, Recruiter).
 * @param {number} params.userId    The HackChain user id (req.auth.sub).
 * @returns {Promise<{
 *   ok: boolean,
 *   source?: "cache" | "check" | "reactivated",
 *   soft_failed?: boolean,
 *   expiresAt: string | null,
 *   reason?: string,
 *   error?: Error,
 * }>}
 */
async function ensureMembership({ client, models, userId }) {
  if (!client || !models || !models.User) {
    throw new TypeError("ensureMembership requires { client, models.User, userId }");
  }
  if (userId === undefined || userId === null) {
    throw new TypeError("ensureMembership requires a userId");
  }

  const user = await models.User.findOne({
    where: { id: userId },
    attributes: USER_ATTRIBUTES,
  });

  if (!user) {
    // Programmer-ish: middleware called for a user that no longer exists.
    // Return a Result so the caller can decide (typically: log and pass).
    return { ok: false, reason: "USER_NOT_FOUND", expiresAt: null };
  }

  // ---- Hot path: local cache still fresh ----
  if (isFuture(user.harjoot_membership_expires_at)) {
    return {
      ok: true,
      source: "cache",
      expiresAt: user.harjoot_membership_expires_at,
    };
  }

  // ---- Cold path: ask Harjoot ----
  try {
    const access = await client.checkAccess(user.wallet_address, user.role);

    if (access && access.active) {
      const newExpiresAt = access.expires_at || null;
      if (newExpiresAt) {
        await models.User.update(
          { harjoot_membership_expires_at: newExpiresAt },
          { where: { id: userId } },
        );
      }
      return { ok: true, source: "check", expiresAt: newExpiresAt };
    }

    // Harjoot says inactive — try to reactivate.
    const profile = await loadProfile(models, user.role, user.wallet_address);
    const activation = await client.activateAccess(user.role, user, profile);
    const reactivatedAt =
      activation && activation.membership && activation.membership.expires_at
        ? activation.membership.expires_at
        : null;

    if (reactivatedAt) {
      await models.User.update(
        { harjoot_membership_expires_at: reactivatedAt },
        { where: { id: userId } },
      );
    }

    return { ok: true, source: "reactivated", expiresAt: reactivatedAt };
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} soft-fail userId=${userId}: ${error.name || "Error"}: ${error.message}`,
    );
    return {
      ok: true,
      soft_failed: true,
      error,
      expiresAt: user.harjoot_membership_expires_at || null,
    };
  }
}

module.exports = { ensureMembership };
