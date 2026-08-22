const {
  MAX_CLASSES_PER_ISSUER,
  MAX_TOPICS_PER_CLASS,
  MAX_CLASS_NAME_LENGTH,
  MAX_CLASS_DESC_LENGTH,
} = require("./constants");

/**
 * Educator creates a new class in their catalog.
 */
async function createIssuerClass({ models, issuerWallet, name, description, topics }) {
  if (!models || !issuerWallet) {
    throw new TypeError("createIssuerClass requires { models, issuerWallet }");
  }

  if (!name || !String(name).trim()) {
    return { ok: false, code: "NAME_REQUIRED", httpStatus: 400 };
  }

  // SECURITY: an educator pending or rejected by admin review must not be able
  // to build out a class catalog — same gate as requestClass.js / updateClassSettings.js.
  const user = await models.User.findOne({
    where: { wallet_address: issuerWallet.toLowerCase() },
    attributes: ["educator_approval_status"],
  });
  if (user?.educator_approval_status !== "approved") {
    return { ok: false, code: "EDUCATOR_NOT_APPROVED", httpStatus: 403 };
  }

  const count = await models.IssuerClass.count({
    where: { issuer_wallet_address: issuerWallet.toLowerCase() },
  });

  if (count >= MAX_CLASSES_PER_ISSUER) {
    return { ok: false, code: "MAX_CLASSES_REACHED", httpStatus: 400 };
  }

  const sanitizedTopics = Array.isArray(topics)
    ? topics.map((t) => String(t).trim()).filter(Boolean).slice(0, MAX_TOPICS_PER_CLASS)
    : [];

  const record = await models.IssuerClass.create({
    issuer_wallet_address: issuerWallet.toLowerCase(),
    name: String(name).trim().slice(0, MAX_CLASS_NAME_LENGTH),
    description: description ? String(description).trim().slice(0, MAX_CLASS_DESC_LENGTH) : null,
    topics: sanitizedTopics,
    is_active: true,
  });

  return {
    ok: true,
    data: {
      id: record.id,
      name: record.name,
      description: record.description,
      topics: record.topics,
      is_active: record.is_active,
    },
  };
}

module.exports = { createIssuerClass };
