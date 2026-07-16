/**
 * Reads the authenticated issuer's own full profile.
 * Returns a result object — never throws on business errors.
 */
async function getOwnIssuerProfile({ models, wallet }) {
  if (!models || !wallet) {
    throw new TypeError("getOwnIssuerProfile requires { models, wallet }");
  }

  const issuer = await models.Issuer.findOne({
    where: { wallet_address: wallet.toLowerCase() },
    include: [{ model: models.User, attributes: ["name", "lastname", "email", "email_verified"] }],
  });

  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  return {
    ok: true,
    data: {
      organization_name: issuer.organization_name,
      bio: issuer.bio,
      photo_url: issuer.photo_url,
      certificate_logo_url: issuer.certificate_logo_url,
      knowledge_areas: issuer.knowledge_areas ?? [],
      wallet_address: issuer.wallet_address,
      email: issuer.User?.email ?? null,
      name: issuer.User?.name ?? null,
      lastname: issuer.User?.lastname ?? null,
      email_verified: issuer.User?.email_verified ?? false,
    },
  };
}

module.exports = { getOwnIssuerProfile };
