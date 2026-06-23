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

  await record.destroy();

  return { ok: true, data: null };
}

module.exports = { deleteIssuerClass };
