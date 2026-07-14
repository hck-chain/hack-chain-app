const MAX_BIO_LENGTH = 500;
const MAX_KNOWLEDGE_AREAS = 5;
const MAX_KNOWLEDGE_AREA_LENGTH = 100;

/**
 * Updates the authenticated issuer's own profile (bio, knowledge_areas, organization_name).
 * Returns a result object — never throws on business errors.
 */
async function updateOwnIssuerProfile({ models, wallet, bio, knowledgeAreas, organizationName }) {
  if (!models || !wallet) {
    throw new TypeError("updateOwnIssuerProfile requires { models, wallet }");
  }

  if (bio !== undefined && typeof bio !== "string") {
    return { ok: false, code: "INVALID_BIO", httpStatus: 400, message: "bio must be a string" };
  }
  if (bio !== undefined && bio.length > MAX_BIO_LENGTH) {
    return { ok: false, code: "BIO_TOO_LONG", httpStatus: 400, message: "bio must be 500 characters or less" };
  }

  if (knowledgeAreas !== undefined) {
    if (!Array.isArray(knowledgeAreas)) {
      return { ok: false, code: "INVALID_KNOWLEDGE_AREAS", httpStatus: 400, message: "knowledge_areas must be an array" };
    }
    if (knowledgeAreas.length > MAX_KNOWLEDGE_AREAS) {
      return { ok: false, code: "TOO_MANY_KNOWLEDGE_AREAS", httpStatus: 400, message: "Maximum 5 knowledge areas allowed" };
    }
    if (knowledgeAreas.some((a) => typeof a !== "string" || a.length > MAX_KNOWLEDGE_AREA_LENGTH)) {
      return {
        ok: false, code: "INVALID_KNOWLEDGE_AREA", httpStatus: 400,
        message: "Each knowledge area must be a string of max 100 characters",
      };
    }
  }

  if (organizationName !== undefined && (typeof organizationName !== "string" || organizationName.trim().length === 0)) {
    return { ok: false, code: "INVALID_ORGANIZATION_NAME", httpStatus: 400, message: "organization_name must be a non-empty string" };
  }

  const issuer = await models.Issuer.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  const updates = {};
  if (bio !== undefined) updates.bio = bio.trim();
  if (knowledgeAreas !== undefined) updates.knowledge_areas = knowledgeAreas;
  if (organizationName !== undefined) updates.organization_name = organizationName.trim();

  await issuer.update(updates);

  return {
    ok: true,
    data: {
      message: "Profile updated",
      issuer: {
        organization_name: issuer.organization_name,
        bio: issuer.bio,
        knowledge_areas: issuer.knowledge_areas,
        photo_url: issuer.photo_url,
      },
    },
  };
}

module.exports = { updateOwnIssuerProfile };
