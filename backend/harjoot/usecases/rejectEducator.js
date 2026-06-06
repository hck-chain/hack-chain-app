// backend/harjoot/usecases/rejectEducator.js
//
// DS Section 2.5 — reject a pending educator. Stores the reason on the user
// row and triggers the notification email. The educator can re-apply by
// having an admin call approveEducator later (which clears rejection_reason).
//
// Returns a Result-style object; throws ONLY on programmer errors (missing
// deps, invalid args including a blank reason).

const LOG_PREFIX = "[rejectEducator]";

/**
 * Reject a pending educator account with a reason.
 *
 * @param {object} params
 * @param {object} params.models        The Sequelize `db` object (db.User).
 * @param {object} params.emailService  Must expose notifyEducatorRejected.
 * @param {number} params.userId        Target educator's user id.
 * @param {number} params.adminId       Admin user id (recorded for the log).
 * @param {string} params.reason        Required non-empty reason.
 * @returns {Promise<{
 *   ok: boolean,
 *   reason?: "USER_NOT_FOUND" | "NOT_AN_ISSUER",
 *   user?: { id: number, status: "rejected", rejection_reason: string },
 * }>}
 */
async function rejectEducator({ models, emailService, userId, adminId, reason }) {
  if (!models || !models.User || !emailService) {
    throw new TypeError(
      "rejectEducator requires { models.User, emailService, userId, adminId, reason }",
    );
  }
  if (userId === undefined || userId === null) {
    throw new TypeError("rejectEducator requires a userId");
  }
  if (typeof reason !== "string" || !reason.trim()) {
    throw new TypeError("rejectEducator requires a non-empty reason string");
  }

  const trimmedReason = reason.trim();

  const user = await models.User.findByPk(userId);
  if (!user) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }
  if (user.role !== "issuer") {
    return { ok: false, reason: "NOT_AN_ISSUER" };
  }

  await user.update({
    educator_approval_status: "rejected",
    rejection_reason: trimmedReason,
    approved_at: null,
    approved_by: null,
  });

  // Email side effect — never undo the DB rejection on email failure.
  try {
    if (user.email) {
      await emailService.notifyEducatorRejected({
        to: user.email,
        name: user.name,
        reason: trimmedReason,
      });
    } else {
      console.warn(`${LOG_PREFIX} no email on file for user_id=${userId}; skipped notification`);
    }
  } catch (err) {
    console.error(
      `${LOG_PREFIX} email notification failed user_id=${userId}: ${err.name || "Error"}: ${err.message}`,
    );
  }

  console.log(`${LOG_PREFIX} rejected user_id=${userId} by admin_id=${adminId} reason="${trimmedReason}"`);
  return {
    ok: true,
    user: { id: user.id, status: "rejected", rejection_reason: trimmedReason },
  };
}

module.exports = { rejectEducator };
