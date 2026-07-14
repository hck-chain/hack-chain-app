/**
 * Public — total certificates issued by a given wallet. Returns 0 for unknown wallets
 * (matches the original endpoint's lenient behavior, not a 404).
 */
async function getIssuerCertificatesCount({ models, walletAddress }) {
  if (!models || !walletAddress) {
    throw new TypeError("getIssuerCertificatesCount requires { models, walletAddress }");
  }

  const issuer = await models.Issuer.findOne({
    where: { wallet_address: walletAddress.toLowerCase() },
    attributes: ["certificates_issued"],
  });

  return { ok: true, data: { total: issuer?.certificates_issued || 0 } };
}

module.exports = { getIssuerCertificatesCount };
