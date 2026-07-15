const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Reads an issuer's public profile (no email exposed).
 * Returns a result object — never throws on business errors.
 */
async function getPublicIssuerProfile({ models, walletAddress }) {
  if (!models || !walletAddress) {
    throw new TypeError("getPublicIssuerProfile requires { models, walletAddress }");
  }

  const wallet = walletAddress.toLowerCase();
  if (!WALLET_RE.test(wallet)) {
    return { ok: false, code: "INVALID_WALLET_ADDRESS", httpStatus: 400, message: "Invalid wallet address" };
  }

  const issuer = await models.Issuer.findOne({
    where: { wallet_address: wallet },
    include: [
      { model: models.User, attributes: ["name", "lastname", "created_at", "educator_approval_status"] },
      { model: models.Certificate, attributes: ["student_wallet_address"] },
    ],
  });

  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  const talentsFormed = new Set(
    (issuer.Certificates || []).map((c) => c.student_wallet_address)
  ).size;

  return {
    ok: true,
    data: {
      issuer: {
        wallet_address: issuer.wallet_address,
        organization_name: issuer.organization_name,
        name: issuer.User?.name || null,
        lastname: issuer.User?.lastname || null,
        photo_url: issuer.photo_url || null,
        bio: issuer.bio || null,
        knowledge_areas: issuer.knowledge_areas || [],
        certificates_issued: issuer.certificates_issued,
        share_count: issuer.share_count,
        talents_formed: talentsFormed,
        joined_at: issuer.User?.created_at || issuer.created_at,
        is_approved: issuer.User?.educator_approval_status === "approved",
        class_settings: issuer.class_settings ?? null,
      },
    },
  };
}

module.exports = { getPublicIssuerProfile };
