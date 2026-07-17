const { validateClassRequestMatch } = require("./validateClassRequestMatch");
const { findExistingCertificate } = require("./findExistingCertificate");

/**
 * Reserves a certificate row (status: 'pending', no chain data yet) before
 * any image render or on-chain mint happens. This is the step that makes an
 * orphaned duplicate NFT impossible: by the time minting could succeed, the
 * DB row already exists — finalizeCertificate only ever updates it.
 *
 * If a matching 'issued' certificate already exists and force isn't set,
 * returns a DUPLICATE_CERTIFICATE result instead of reserving, so the
 * caller can show a confirmation prompt before spending any gas.
 *
 * Returns a result object — never throws on business errors.
 */
async function reserveCertificate({
  models, issuerWallet, studentWallet, title, description, classRequestId, force,
}) {
  if (!models || !issuerWallet || !studentWallet || !title) {
    throw new TypeError("reserveCertificate requires { models, issuerWallet, studentWallet, title }");
  }

  const issuer = await models.Issuer.findOne({ where: { wallet_address: issuerWallet.toLowerCase() } });
  if (!issuer) {
    return {
      ok: false,
      code: "ISSUER_NOT_AUTHORIZED",
      httpStatus: 404,
      message: `La wallet ${issuerWallet.toLowerCase()} no está registrada como emisor permitido.`,
    };
  }

  if (classRequestId) {
    const lockResult = await validateClassRequestMatch({
      models, classRequestId, issuerWallet, studentWallet, title,
    });
    if (!lockResult.ok) return lockResult;
  }

  if (!force) {
    const existingResult = await findExistingCertificate({ models, issuerWallet, studentWallet, title });
    if (existingResult.data) {
      return {
        ok: false,
        code: "DUPLICATE_CERTIFICATE",
        httpStatus: 409,
        message: "Ya existe un certificado igual para este estudiante y curso",
        data: { existing: existingResult.data },
      };
    }
  }

  const certificate = await models.Certificate.create({
    issuer_wallet_address: issuerWallet.toLowerCase(),
    student_wallet_address: studentWallet.toLowerCase(),
    title: title.trim(),
    description: description || "Certificado Tokenizado HackChain",
    status: "pending",
    class_request_id: classRequestId || null,
  });

  return { ok: true, data: { id: certificate.id } };
}

module.exports = { reserveCertificate };
