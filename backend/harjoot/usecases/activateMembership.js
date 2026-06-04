// backend/harjoot/usecases/activateMembership.js
//
// DS Section 2 — register a freshly-created HackChain user inside Harjoot
// as a partner_external_user and persist the resulting membership expiry
// on the user row.
//
// This use case is the post-commit hook for POST /api/users/register. It
// MUST NEVER throw — a Harjoot outage cannot prevent a user from finishing
// their registration locally. On failure we log, return a Result indicating
// what went wrong, and let middleware/harjootAccess.js re-activate lazily on
// the first protected request (DS decision documented in Section 2 v5).

const LOG_PREFIX = "[harjoot:membership]";

/**
 * Activate the Harjoot membership for a newly registered user.
 *
 * @param {object} params
 * @param {object} params.client    A Harjoot client (from createHarjootClient).
 * @param {object} params.models    The Sequelize `db` object (needs db.User).
 * @param {"student"|"issuer"|"recruiter"} params.role
 * @param {object} params.user      Full User row from the registration tx.
 * @param {object} params.profile   Role-specific profile (student/issuer/recruiter row).
 * @returns {Promise<{ ok: boolean, expiresAt: string|null, error: Error|null }>}
 */
async function activateMembership({ client, models, role, user, profile }) {
  if (!client || !models || !models.User) {
    // Caller bug — surface it loudly. This is NOT an upstream failure.
    throw new TypeError("activateMembership requires { client, models.User, role, user, profile }");
  }

  try {
    const response = await client.activateAccess(role, user, profile);
    const expiresAt = response && response.membership && response.membership.expires_at
      ? response.membership.expires_at
      : null;

    if (expiresAt) {
      await models.User.update(
        { harjoot_membership_expires_at: expiresAt },
        { where: { id: user.id } },
      );
    }

    console.log(
      `${LOG_PREFIX} activated user_id=${user.id} role=${role}` +
        ` expires_at=${expiresAt || "(none)"}`,
    );
    return { ok: true, expiresAt, error: null };
  } catch (error) {
    // Never throw — registration must succeed even if Harjoot is unreachable.
    console.error(
      `${LOG_PREFIX} FAILED user_id=${user && user.id}: ${error.name || "Error"}: ${error.message}`,
    );
    return { ok: false, expiresAt: null, error };
  }
}

module.exports = { activateMembership };
