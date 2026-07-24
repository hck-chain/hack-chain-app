const IPFS_URI_RE = /^ipfs:\/\/[a-zA-Z0-9]+$/;

/**
 * Updates the authenticated issuer's profile photo (ipfs:// URI only).
 * Returns a result object — never throws on business errors.
 */
async function updateIssuerPhoto({ models, wallet, photoUrl }) {
  if (!models || !wallet) {
    throw new TypeError("updateIssuerPhoto requires { models, wallet }");
  }

  if (photoUrl === undefined) {
    return { ok: false, code: "PHOTO_URL_REQUIRED", httpStatus: 400, message: "photo_url is required" };
  }

  if (photoUrl !== null &&
    (typeof photoUrl !== "string" || !IPFS_URI_RE.test(photoUrl))) {
    return { ok: false, code: "INVALID_PHOTO_URL", httpStatus: 400, message: "photo_url must be a valid ipfs:// URI" };
  }

  const issuer = await models.Issuer.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  await issuer.update({ photo_url: photoUrl });

  return { ok: true, data: { photo_url: issuer.photo_url } };
}

module.exports = { updateIssuerPhoto };
