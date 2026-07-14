const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Public, no auth — anyone sharing a public profile bumps its share_count.
 * No per-user tracking (MVP). Returns a result object — never throws on business errors.
 */
async function registerIssuerProfileShare({ models, walletAddress }) {
  if (!models || !walletAddress) {
    throw new TypeError("registerIssuerProfileShare requires { models, walletAddress }");
  }

  const wallet = walletAddress.toLowerCase();
  if (!WALLET_RE.test(wallet)) {
    return { ok: false, code: "INVALID_WALLET_ADDRESS", httpStatus: 400, message: "Invalid wallet address" };
  }

  const issuer = await models.Issuer.findOne({
    where: { wallet_address: wallet },
    attributes: ["id", "share_count"],
  });
  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  await issuer.increment("share_count");
  await issuer.reload();

  return { ok: true, data: { success: true, share_count: issuer.share_count } };
}

module.exports = { registerIssuerProfileShare };
