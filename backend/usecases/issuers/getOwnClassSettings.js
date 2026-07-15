/**
 * Reads the authenticated issuer's own class_settings.
 * Returns a result object — never throws on business errors.
 */
async function getOwnClassSettings({ models, wallet }) {
  if (!models || !wallet) {
    throw new TypeError("getOwnClassSettings requires { models, wallet }");
  }

  const issuer = await models.Issuer.findOne({
    where: { wallet_address: wallet.toLowerCase() },
    attributes: ["class_settings"],
  });

  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  return { ok: true, data: { class_settings: issuer.class_settings ?? null } };
}

module.exports = { getOwnClassSettings };
