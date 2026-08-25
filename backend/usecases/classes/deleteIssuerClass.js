/**
 * Educator deletes one of their classes.
 * Existing ClassRequests retain the class_name snapshot via SET NULL on issuer_class_id.
 */
async function deleteIssuerClass({ models, classId, issuerWallet }) {
  if (!models || !issuerWallet) {
    throw new TypeError("deleteIssuerClass requires { models, issuerWallet }");
  }

  const record = await models.IssuerClass.findOne({
    where: { id: classId, issuer_wallet_address: issuerWallet.toLowerCase() },
  });

  if (!record) {
    return { ok: false, code: "CLASS_NOT_FOUND", httpStatus: 404 };
  }

  // SECURITY: nothing about the class catalog operates until an educator is
  // approved — same gate as createIssuerClass.js / updateIssuerClass.js, kept
  // consistent across all write actions rather than exempting delete.
  const user = await models.User.findOne({
    where: { wallet_address: issuerWallet.toLowerCase() },
    attributes: ["educator_approval_status"],
  });
  if (user?.educator_approval_status !== "approved") {
    return { ok: false, code: "EDUCATOR_NOT_APPROVED", httpStatus: 403 };
  }

  await record.destroy();

  return { ok: true, data: null };
}

module.exports = { deleteIssuerClass };
