/**
 * Finalizes a reserved certificate (status: 'pending' -> 'issued') with the
 * real chain data once the on-chain mint has succeeded. Never inserts a new
 * row — always updates the one reserveCertificate already created, which is
 * the property that makes an orphaned duplicate NFT impossible.
 *
 * Idempotent on id + already-'issued': a network retry of the finalize call
 * itself (not a new mint) returns the existing data instead of erroring.
 *
 * Returns a result object — never throws on business errors.
 */
async function finalizeCertificate({
  models, emailService, id, issuerWallet, certificateHash, blockchainTxHash, tokenId, issueDate,
}) {
  if (!models || !emailService || !id || !issuerWallet) {
    throw new TypeError("finalizeCertificate requires { models, emailService, id, issuerWallet }");
  }

  const certificate = await models.Certificate.findByPk(id);
  if (!certificate) {
    return { ok: false, code: "CERTIFICATE_NOT_FOUND", httpStatus: 404, message: "Certificate not found" };
  }

  if (certificate.issuer_wallet_address.toLowerCase() !== issuerWallet.toLowerCase()) {
    return { ok: false, code: "FORBIDDEN", httpStatus: 403, message: "Cannot finalize another issuer's certificate" };
  }

  if (certificate.status === "issued") {
    // Already finalized — likely a retried request, not a new mint. Return
    // what's there instead of erroring.
    return { ok: true, data: { id: certificate.id } };
  }

  if (!certificateHash || !tokenId || !issueDate) {
    return {
      ok: false, code: "MISSING_CHAIN_DATA", httpStatus: 400,
      message: "certificate_hash, token_id and issue_date are required to finalize",
    };
  }

  const updateData = {
    certificate_hash: certificateHash,
    blockchain_tx_hash: blockchainTxHash,
    token_id: tokenId,
    issue_date: issueDate,
    status: "issued",
  };
  // Talent has 24h to confirm the class was completed correctly (or flag an
  // issue) before certificateConfirmationWorker auto-confirms it.
  if (certificate.class_request_id) {
    updateData.confirmation_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  await certificate.update(updateData);

  // Auto-complete the class request this certificate was issued for.
  if (certificate.class_request_id) {
    await models.ClassRequest.update(
      { status: "completed" },
      {
        where: {
          id: certificate.class_request_id,
          issuer_wallet_address: issuerWallet.toLowerCase(),
          status: "confirmed",
        },
      }
    );
  }

  // Notify talent — fire-and-forget, must not block the response.
  models.Issuer.findOne({ where: { wallet_address: issuerWallet.toLowerCase() } })
    .then((issuer) =>
      models.User.findOne({
        where: { wallet_address: certificate.student_wallet_address },
        attributes: ["email", "name", "lastname"],
      }).then((studentUser) => {
        if (!studentUser?.email) return;
        const studentName = [studentUser.name, studentUser.lastname].filter(Boolean).join(" ") || null;
        return emailService.notifyTalentCertificateIssued({
          to: studentUser.email,
          studentName,
          educatorName: issuer?.organization_name || null,
          certificateTitle: certificate.title || null,
          dashboardUrl: `${process.env.FRONTEND_URL || "https://www.hackchain.app"}/dashboard/talent`,
        });
      })
    )
    .catch((err) => console.error("[email] notifyTalentCertificateIssued failed:", err.message));

  return { ok: true, data: { id: certificate.id } };
}

module.exports = { finalizeCertificate };
