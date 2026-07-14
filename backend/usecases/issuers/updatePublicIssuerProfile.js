const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Updates an issuer's public profile fields. Only the issuer themselves may do this.
 * Returns a result object — never throws on business errors.
 */
async function updatePublicIssuerProfile({ models, walletAddress, requesterWallet, organizationName, bio, knowledgeAreas }) {
  if (!models || !walletAddress || !requesterWallet) {
    throw new TypeError("updatePublicIssuerProfile requires { models, walletAddress, requesterWallet }");
  }

  const wallet = walletAddress.toLowerCase();
  if (!WALLET_RE.test(wallet)) {
    return { ok: false, code: "INVALID_WALLET_ADDRESS", httpStatus: 400, message: "Invalid wallet address" };
  }

  if (requesterWallet.toLowerCase() !== wallet) {
    return { ok: false, code: "FORBIDDEN", httpStatus: 403, message: "Forbidden: cannot modify another issuer's profile" };
  }

  if (
    knowledgeAreas !== undefined &&
    (!Array.isArray(knowledgeAreas) || knowledgeAreas.some((a) => typeof a !== "string" || a.length > 100))
  ) {
    return {
      ok: false, code: "INVALID_KNOWLEDGE_AREAS", httpStatus: 400,
      message: "knowledge_areas must be an array of strings (max 100 chars each)",
    };
  }

  const issuer = await models.Issuer.findOne({ where: { wallet_address: wallet } });
  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  const updates = {};
  if (organizationName !== undefined) updates.organization_name = organizationName;
  if (bio !== undefined) updates.bio = bio;
  if (knowledgeAreas !== undefined) updates.knowledge_areas = knowledgeAreas;

  await issuer.update(updates);

  return { ok: true, data: { message: "Issuer updated successfully" } };
}

module.exports = { updatePublicIssuerProfile };
