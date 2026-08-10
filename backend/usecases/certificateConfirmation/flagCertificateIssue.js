/**
 * Talent reports a problem with the issued certificate. HackChain gets
 * involved and can force-confirm via resolveCertificateFlag.
 */
async function flagCertificateIssue({ models, certificateId, studentWallet, reason }) {
  if (!models || !studentWallet) {
    throw new TypeError("flagCertificateIssue requires { models, studentWallet }");
  }

  const certificate = await models.Certificate.findOne({
    where: {
      id: certificateId,
      student_wallet_address: studentWallet.toLowerCase(),
    },
  });

  if (!certificate) {
    return { ok: false, code: "CERTIFICATE_NOT_FOUND", httpStatus: 404 };
  }

  if (certificate.status !== "issued") {
    return { ok: false, code: "CANNOT_FLAG", httpStatus: 422 };
  }

  await certificate.update({
    status: "flagged",
    flag_reason: reason ? String(reason).slice(0, 500) : null,
  });

  return {
    ok: true,
    data: {
      id: certificate.id,
      status: certificate.status,
      issuer_wallet_address: certificate.issuer_wallet_address,
    },
  };
}

module.exports = { flagCertificateIssue };
