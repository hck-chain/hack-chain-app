const IPFS_URI_RE = /^ipfs:\/\/[a-zA-Z0-9]+$/;

/**
 * Updates the authenticated issuer's certificate logo (ipfs:// URI only).
 * Separate from the profile photo (updateIssuerPhoto) — this logo is stamped
 * on issued certificates, not shown on the public profile card.
 * Returns a result object — never throws on business errors.
 */
async function updateIssuerCertificateLogo({ models, wallet, certificateLogoUrl }) {
  if (!models || !wallet) {
    throw new TypeError("updateIssuerCertificateLogo requires { models, wallet }");
  }

  if (!certificateLogoUrl || typeof certificateLogoUrl !== "string") {
    return {
      ok: false,
      code: "CERTIFICATE_LOGO_URL_REQUIRED",
      httpStatus: 400,
      message: "certificate_logo_url is required",
    };
  }

  if (!IPFS_URI_RE.test(certificateLogoUrl)) {
    return {
      ok: false,
      code: "INVALID_CERTIFICATE_LOGO_URL",
      httpStatus: 400,
      message: "certificate_logo_url must be a valid ipfs:// URI",
    };
  }

  const issuer = await models.Issuer.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  await issuer.update({ certificate_logo_url: certificateLogoUrl });

  return { ok: true, data: { certificate_logo_url: issuer.certificate_logo_url } };
}

module.exports = { updateIssuerCertificateLogo };
