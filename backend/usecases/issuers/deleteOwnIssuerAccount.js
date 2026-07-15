/**
 * Deletes the authenticated issuer's own account after verifying a signed deletion message.
 * validateDeletionMessage and deleteIssuerAccount are injected — this use case only orchestrates them.
 * Returns a result object — never throws on business errors.
 */
async function deleteOwnIssuerAccount({ wallet, signature, message, validateDeletionMessage, deleteIssuerAccount }) {
  if (!wallet || !validateDeletionMessage || !deleteIssuerAccount) {
    throw new TypeError("deleteOwnIssuerAccount requires { wallet, validateDeletionMessage, deleteIssuerAccount }");
  }

  if (!signature || !message) {
    return { ok: false, code: "MISSING_SIGNATURE", httpStatus: 400, message: "signature and message are required" };
  }

  const validation = validateDeletionMessage(message, signature, wallet);
  if (!validation.ok) {
    return { ok: false, code: "INVALID_SIGNATURE", httpStatus: 401, message: validation.error };
  }

  await deleteIssuerAccount(wallet);

  return { ok: true };
}

module.exports = { deleteOwnIssuerAccount };
