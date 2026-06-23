const {
  MAX_TOPICS_PER_CLASS,
  MAX_CLASS_NAME_LENGTH,
  MAX_CLASS_DESC_LENGTH,
} = require("./constants");

/**
 * Educator updates one of their existing classes.
 * Only the fields present in `updates` are modified.
 */
async function updateIssuerClass({ models, classId, issuerWallet, updates }) {
  if (!models || !issuerWallet) {
    throw new TypeError("updateIssuerClass requires { models, issuerWallet }");
  }

  const record = await models.IssuerClass.findOne({
    where: { id: classId, issuer_wallet_address: issuerWallet.toLowerCase() },
  });

  if (!record) {
    return { ok: false, code: "CLASS_NOT_FOUND", httpStatus: 404 };
  }

  const patch = {};

  if (updates.name !== undefined) {
    if (!String(updates.name).trim()) {
      return { ok: false, code: "NAME_CANNOT_BE_EMPTY", httpStatus: 400 };
    }
    patch.name = String(updates.name).trim().slice(0, MAX_CLASS_NAME_LENGTH);
  }

  if (updates.description !== undefined) {
    patch.description = updates.description
      ? String(updates.description).trim().slice(0, MAX_CLASS_DESC_LENGTH)
      : null;
  }

  if (updates.topics !== undefined) {
    patch.topics = Array.isArray(updates.topics)
      ? updates.topics.map((t) => String(t).trim()).filter(Boolean).slice(0, MAX_TOPICS_PER_CLASS)
      : [];
  }

  if (updates.is_active !== undefined) {
    patch.is_active = Boolean(updates.is_active);
  }

  await record.update(patch);

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

module.exports = { updateIssuerClass };
