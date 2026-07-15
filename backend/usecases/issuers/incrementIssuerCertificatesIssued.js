/**
 * Increments the authenticated issuer's certificates_issued counter.
 * Only the issuer themselves may increment their own counter.
 * Returns a result object — never throws on business errors.
 */
async function incrementIssuerCertificatesIssued({ models, requesterWallet, issuerWallet }) {
  if (!models || !requesterWallet) {
    throw new TypeError("incrementIssuerCertificatesIssued requires { models, requesterWallet }");
  }

  if (!issuerWallet) {
    return { ok: false, code: "ISSUER_WALLET_REQUIRED", httpStatus: 400, message: "issuerWallet required" };
  }

  if (requesterWallet.toLowerCase() !== issuerWallet.toLowerCase()) {
    return {
      ok: false, code: "FORBIDDEN", httpStatus: 403,
      message: "Cannot increment certificates for another issuer",
    };
  }

  await models.Issuer.increment(
    { certificates_issued: 1 },
    { where: { wallet_address: issuerWallet.toLowerCase() } }
  );

  return { ok: true, data: { success: true } };
}

module.exports = { incrementIssuerCertificatesIssued };
