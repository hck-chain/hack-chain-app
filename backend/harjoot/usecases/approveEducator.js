// backend/harjoot/usecases/approveEducator.js
//
// DS Section 2.5 — approve an educator that registered with status
// 'pending_approval'. Sets the row to approved, captures who approved and
// when, and triggers the notification email. Email failures are logged but
// do NOT undo the approval (the user is still approved in DB).
//
// Returns a Result-style object; throws ONLY on programmer errors (missing
// deps, invalid args).

const LOG_PREFIX = "[approveEducator]";

/**
 * Approve a pending educator account.
 *
 * @param {object} params
 * @param {object} params.models        The Sequelize `db` object (db.User).
 * @param {object} params.emailService  Must expose notifyEducatorApproved.
 * @param {number} params.userId        Target educator's user id.
 * @param {number} params.adminId       Admin user id (recorded as approved_by).
 * @returns {Promise<{
 *   ok: boolean,
 *   reason?: "USER_NOT_FOUND" | "NOT_AN_ISSUER" | "ALREADY_APPROVED",
 *   user?: { id: number, status: "approved", approved_at: Date },
 * }>}
 */
async function approveEducator({ models, emailService, userId, adminId }) {
  if (!models || !models.User || !emailService) {
    throw new TypeError(
      "approveEducator requires { models.User, emailService, userId, adminId }",
    );
  }
  if (userId === undefined || userId === null) {
    throw new TypeError("approveEducator requires a userId");
  }

  const user = await models.User.findByPk(userId);
  if (!user) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }
  if (user.role !== "issuer") {
    return { ok: false, reason: "NOT_AN_ISSUER" };
  }
  if (user.educator_approval_status === "approved") {
    return { ok: false, reason: "ALREADY_APPROVED" };
  }

  const approvedAt = new Date();
  await user.update({
    educator_approval_status: "approved",
    approved_at: approvedAt,
    approved_by: adminId,
    rejection_reason: null, // wipe any prior rejection
  });

  // Email is a side effect — failures must not invalidate the approval.
  try {
    if (user.email) {
      await emailService.notifyEducatorApproved({ to: user.email, name: user.name });
    } else {
      console.warn(`${LOG_PREFIX} no email on file for user_id=${userId}; skipped notification`);
    }
  } catch (err) {
    console.error(
      `${LOG_PREFIX} email notification failed user_id=${userId}: ${err.name || "Error"}: ${err.message}`,
    );
  }

  console.log(`${LOG_PREFIX} approved user_id=${userId} by admin_id=${adminId}`);
  return {
    ok: true,
    user: { id: user.id, status: "approved", approved_at: approvedAt },
  };
}

module.exports = { approveEducator };
