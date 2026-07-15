/**
 * Reads the authenticated user's educator approval status.
 * Returns a result object — never throws on business errors.
 */
async function getIssuerApprovalStatus({ models, userId }) {
  if (!models || !userId) {
    throw new TypeError("getIssuerApprovalStatus requires { models, userId }");
  }

  const user = await models.User.findByPk(userId, {
    attributes: ["educator_approval_status", "rejection_reason", "approved_at"],
  });

  if (!user) {
    return { ok: false, code: "USER_NOT_FOUND", httpStatus: 404, message: "User not found" };
  }

  const status = user.educator_approval_status || "pending_approval";
  const data = { status };
  if (status === "rejected" && user.rejection_reason) {
    data.reason = user.rejection_reason;
  }
  if (status === "approved" && user.approved_at) {
    data.approved_at = user.approved_at;
  }

  return { ok: true, data };
}

module.exports = { getIssuerApprovalStatus };
