/**
 * Public, paginated educator discovery — optionally filtered by knowledge area.
 * Returns a result object — never throws on business errors.
 */
async function listIssuers({ models, page, limit, area }) {
  if (!models) {
    throw new TypeError("listIssuers requires { models }");
  }

  const resolvedPage = Math.max(1, parseInt(page) || 1);
  const resolvedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const trimmedArea = typeof area === "string" ? area.trim() : null;

  const { Op, where: seqWhere, fn, cast, col } = models.Sequelize;

  const userWhere = { educator_approval_status: "approved" };
  const issuerWhere = {};
  if (trimmedArea) {
    const term = trimmedArea.toLowerCase();
    // OR across name, lastname, org name, and knowledge_areas (case-insensitive partial match).
    // subQuery: false is required so that User columns are accessible in the main WHERE clause.
    issuerWhere[Op.or] = [
      seqWhere(fn("LOWER", cast(col("Issuer.knowledge_areas"), "text")), { [Op.like]: `%${term}%` }),
      seqWhere(fn("LOWER", col("Issuer.organization_name")), { [Op.like]: `%${term}%` }),
      seqWhere(fn("LOWER", col("User.name")), { [Op.like]: `%${term}%` }),
      seqWhere(fn("LOWER", col("User.lastname")), { [Op.like]: `%${term}%` }),
    ];
  }

  const { count, rows } = await models.Issuer.findAndCountAll({
    where: issuerWhere,
    include: [{
      model: models.User,
      attributes: ["name", "lastname", "created_at"],
      where: userWhere,
      required: true,
    }],
    order: [["certificates_issued", "DESC"]],
    limit: resolvedLimit,
    offset: (resolvedPage - 1) * resolvedLimit,
    subQuery: false,
  });

  return {
    ok: true,
    data: {
      educators: rows.map((issuer) => ({
        wallet_address: issuer.wallet_address,
        organization_name: issuer.organization_name,
        name: issuer.User?.name || null,
        lastname: issuer.User?.lastname || null,
        photo_url: issuer.photo_url || null,
        bio: issuer.bio || null,
        knowledge_areas: issuer.knowledge_areas || [],
        certificates_issued: issuer.certificates_issued,
        has_classes: issuer.class_settings !== null && issuer.class_settings !== undefined,
        joined_at: issuer.User?.created_at || issuer.created_at,
      })),
      pagination: {
        total: count,
        page: resolvedPage,
        limit: resolvedLimit,
        pages: Math.ceil(count / resolvedLimit),
      },
    },
  };
}

module.exports = { listIssuers };
