/**
 * HackChain admin resolves a flagged certificate after contacting both
 * parties. Only a forced confirmation is supported here — revocation of a
 * genuinely bad certificate goes through the existing revoke flow.
 */
async function resolveCertificateFlag({ models, certificateId, adminWallet, resolutionNote }) {
  if (!models || !adminWallet) {
    throw new TypeError("resolveCertificateFlag requires { models, adminWallet }");
  }

  const certificate = await models.Certificate.findByPk(certificateId);
  if (!certificate) {
    return { ok: false, code: "CERTIFICATE_NOT_FOUND", httpStatus: 404 };
  }

  if (certificate.status !== "flagged") {
    return { ok: false, code: "NOT_FLAGGED", httpStatus: 422 };
  }

  await certificate.update({
    status: "confirmed",
    confirmation_deadline: null,
    flag_reason: resolutionNote
      ? `${certificate.flag_reason || ""}\n[Resuelto por HackChain]: ${String(resolutionNote).slice(0, 500)}`.trim()
      : certificate.flag_reason,
  });

  return {
    ok: true,
    data: {
      id: certificate.id,
      status: certificate.status,
      student_wallet_address: certificate.student_wallet_address,
    },
  };
}

module.exports = { resolveCertificateFlag };
