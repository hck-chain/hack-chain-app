/**
 * Re-submits a rejected educator account for approval.
 * Notification side effects (emailing admins) are the route's responsibility,
 * fired after this use case succeeds — same pattern as usecases/classes/requestClass.
 * Returns a result object — never throws on business errors.
 */
async function reapplyForApproval({ models, userId }) {
  if (!models || !userId) {
    throw new TypeError("reapplyForApproval requires { models, userId }");
  }

  const user = await models.User.findByPk(userId, {
    attributes: ["id", "educator_approval_status"],
  });

  if (!user) {
    return { ok: false, code: "USER_NOT_FOUND", httpStatus: 404, message: "User not found" };
  }

  if (user.educator_approval_status !== "rejected") {
    return { ok: false, code: "NOT_REJECTED", httpStatus: 409, message: "Only rejected accounts can re-apply" };
  }

  await user.update({
    educator_approval_status: "pending_approval",
    rejection_reason: null,
  });

  return { ok: true, data: { status: "pending_approval" } };
}

module.exports = { reapplyForApproval };
