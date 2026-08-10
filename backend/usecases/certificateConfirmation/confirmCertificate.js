/**
 * Talent confirms the class was completed correctly. Final step (12) of the
 * class-payment workflow.
 */
async function confirmCertificate({ models, certificateId, studentWallet }) {
  if (!models || !studentWallet) {
    throw new TypeError("confirmCertificate requires { models, studentWallet }");
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
    return { ok: false, code: "CANNOT_CONFIRM", httpStatus: 422 };
  }

  await certificate.update({ status: "confirmed", confirmation_deadline: null });

  return { ok: true, data: { id: certificate.id, status: certificate.status } };
}

module.exports = { confirmCertificate };
