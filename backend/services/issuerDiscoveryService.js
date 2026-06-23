// backend/services/issuerDiscoveryService.js
const { Issuer, User, sequelize } = require("../models");

/**
 * Returns `count` randomly selected approved educators.
 * ORDER BY RANDOM() is evaluated per-query in Postgres, so each call
 * produces a different ordering — giving the "refresh = new results" UX.
 */
async function getFeaturedIssuers(count = 3) {
  const rows = await Issuer.findAll({
    include: [
      {
        model: User,
        attributes: ["name", "lastname", "educator_approval_status"],
        where: { educator_approval_status: "approved" },
        required: true,
      },
    ],
    order: sequelize.random(),
    limit: count,
  });

  return rows.map((issuer) => ({
    wallet_address: issuer.wallet_address,
    organization_name: issuer.organization_name || null,
    name: issuer.User?.name || null,
    lastname: issuer.User?.lastname || null,
    photo_url: issuer.photo_url || null,
    bio: issuer.bio || null,
    knowledge_areas: issuer.knowledge_areas || [],
    certificates_issued: issuer.certificates_issued ?? 0,
    has_classes: issuer.class_settings !== null && issuer.class_settings !== undefined,
  }));
}

module.exports = { getFeaturedIssuers };
