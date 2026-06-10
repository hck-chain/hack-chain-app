// backend/harjoot/usecases/listEducators.js
//
// Admin dashboard — list issuers ("educators") with filters and
// pagination. Returns the columns the admin UI needs to render the
// row + the action menu (approve / reject). Sensitive fields
// (passwordHash, nonce, verification_token) are NEVER returned.
//
// Filters:
//   status:   "pending_approval" | "approved" | "rejected" | "all"
//             (default "all"). Maps to users.educator_approval_status.
//   search:   case-insensitive substring match against name, lastname,
//             email, or organization_name. Empty = no search.
//   page:     1-based page number. Default 1.
//   limit:    rows per page. Clamped 1..100. Default 25.
//
// Returns:
//   { items, total, page, limit, totalPages }
//
// Items are flat objects, NOT Sequelize instances, so the route can
// hand them to res.json() without leaking class metadata.

const { Op, fn, col, where: seqWhere } = require("sequelize");

// Case-insensitive substring match that works on both Postgres (prod)
// and SQLite (tests) without depending on the iLike operator.
function ciLike(column, pattern) {
  return seqWhere(fn("LOWER", col(column)), { [Op.like]: pattern });
}

const ALLOWED_STATUSES = new Set(["pending_approval", "approved", "rejected", "all"]);
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function clampPage(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  return n;
}

function clampLimit(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  if (n > MAX_LIMIT) return MAX_LIMIT;
  return n;
}

/**
 * @param {object} params
 * @param {object} params.models       db (User + Issuer required).
 * @param {string} [params.status]
 * @param {string} [params.search]
 * @param {number|string} [params.page]
 * @param {number|string} [params.limit]
 */
async function listEducators({ models, status = "all", search = "", page = 1, limit = DEFAULT_LIMIT } = {}) {
  if (!models || !models.User || !models.Issuer) {
    throw new TypeError("listEducators requires { models.User, models.Issuer }");
  }
  if (typeof status === "string" && !ALLOWED_STATUSES.has(status)) {
    throw new TypeError(
      `listEducators: status must be one of ${[...ALLOWED_STATUSES].join(", ")}`,
    );
  }

  const safePage = clampPage(page);
  const safeLimit = clampLimit(limit);

  // ---- WHERE clauses --------------------------------------------------------
  const where = { role: "issuer" };
  if (status && status !== "all") {
    where.educator_approval_status = status;
  }

  // Optional fuzzy search across name / lastname / email + the linked
  // Issuer.organization_name. Substring match, lowercased, length-capped to
  // keep the LIKE pattern bounded (avoids accidental ReDoS-like blowups).
  const trimmedSearch = (search || "").trim().slice(0, 80);
  const userOrClauses = [];
  if (trimmedSearch) {
    const pattern = `%${trimmedSearch.toLowerCase()}%`;
    userOrClauses.push(
      ciLike("name",     pattern),
      ciLike("lastname", pattern),
      ciLike("email",    pattern),
    );
  }
  if (userOrClauses.length > 0) {
    where[Op.or] = userOrClauses;
  }

  // Issuer.organization_name search hits BOTH the user fields AND the org
  // name. We run a separate Issuer query (LOWER + LIKE) to avoid combining
  // a top-level WHERE with an include WHERE under OR (Sequelize doesn't
  // express that cleanly in either dialect).
  const issuerWhere = trimmedSearch
    ? ciLike("organization_name", `%${trimmedSearch.toLowerCase()}%`)
    : undefined;

  // When we have a search, we want issuers whose user fields match OR whose
  // organization_name matches. Sequelize doesn't combine WHERE + include
  // WHERE with OR cleanly, so we run two queries and union by id. For the
  // typical small admin dataset this is fine; if it ever becomes a hot path
  // we move to a raw query.
  let userIds = null;
  if (trimmedSearch) {
    const [byUserFields, byOrgName] = await Promise.all([
      models.User.findAll({
        where,
        attributes: ["id"],
      }),
      models.Issuer.findAll({
        where: issuerWhere,
        attributes: ["wallet_address"],
      }),
    ]);
    const idsFromUsers = byUserFields.map((u) => u.id);
    const wallets = byOrgName.map((i) => i.wallet_address);
    let idsFromOrg = [];
    if (wallets.length > 0) {
      const orgMatchedUsers = await models.User.findAll({
        where: { role: "issuer", wallet_address: { [Op.in]: wallets } },
        attributes: ["id"],
      });
      idsFromOrg = orgMatchedUsers.map((u) => u.id);
    }
    userIds = [...new Set([...idsFromUsers, ...idsFromOrg])];
    // When the search matched nothing, short-circuit with an empty page.
    if (userIds.length === 0) {
      return { items: [], total: 0, page: safePage, limit: safeLimit, totalPages: 0 };
    }
  }

  // ---- final WHERE + count + page ------------------------------------------
  const finalWhere = userIds ? { ...where, id: { [Op.in]: userIds } } : where;
  // The search OR was applied inside the userIds intersection; the final
  // WHERE keeps only role + status (already enforced).
  if (userIds) delete finalWhere[Op.or];

  const total = await models.User.count({ where: finalWhere });
  const totalPages = Math.ceil(total / safeLimit);
  const rows = await models.User.findAll({
    where: finalWhere,
    include: [{
      model: models.Issuer,
      required: false,
      attributes: ["organization_name"],
    }],
    attributes: [
      "id", "wallet_address", "name", "lastname", "email",
      "educator_approval_status", "approved_at", "approved_by",
      "rejection_reason", "created_at",
    ],
    order: [["created_at", "DESC"]],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
  });

  const items = rows.map((u) => ({
    id: u.id,
    walletAddress: u.wallet_address,
    name: u.name,
    lastname: u.lastname,
    email: u.email,
    organizationName: u.Issuer ? u.Issuer.organization_name : null,
    status: u.educator_approval_status || "pending_approval",
    approvedAt: u.approved_at,
    approvedBy: u.approved_by,
    rejectionReason: u.rejection_reason,
    createdAt: u.created_at,
  }));

  return { items, total, page: safePage, limit: safeLimit, totalPages };
}

module.exports = {
  listEducators,
  __ALLOWED_STATUSES: ALLOWED_STATUSES,
  __DEFAULT_LIMIT: DEFAULT_LIMIT,
  __MAX_LIMIT: MAX_LIMIT,
};
