/**
 * Looks up an already-issued certificate matching the same issuer + student
 * + title. Used by reserveCertificate to block accidental duplicate
 * issuance before any blockchain interaction happens.
 * Pure read — always returns { ok: true }, data is null when nothing matches.
 */
async function findExistingCertificate({ models, issuerWallet, studentWallet, title }) {
  if (!models || !issuerWallet || !studentWallet || !title) {
    throw new TypeError("findExistingCertificate requires { models, issuerWallet, studentWallet, title }");
  }

  const existing = await models.Certificate.findOne({
    where: {
      issuer_wallet_address: issuerWallet.toLowerCase(),
      student_wallet_address: studentWallet.toLowerCase(),
      title: title.trim(),
      status: "issued",
    },
    order: [["id", "DESC"]],
  });

  if (!existing) {
    return { ok: true, data: null };
  }

  return {
    ok: true,
    data: {
      id: existing.id,
      token_id: existing.token_id,
      issue_date: existing.issue_date,
    },
  };
}

module.exports = { findExistingCertificate };
