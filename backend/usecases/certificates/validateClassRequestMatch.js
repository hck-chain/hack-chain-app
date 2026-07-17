const CERT_LOCK_MESSAGE = "Los datos del certificado no coinciden con la solicitud de clase";

/**
 * When a class_request_id is provided, the certificate being reserved must
 * actually belong to that class. Otherwise an issuer could tag any
 * certificate as "from a completed class" by sending an arbitrary id.
 * Every mismatch reason answers the same 409 (uniform message) so a caller
 * can't use the status code to probe which ids exist in the system — but the
 * server log keeps the real reason for abuse detection.
 * Returns a result object — never throws on business errors.
 */
async function validateClassRequestMatch({ models, classRequestId, issuerWallet, studentWallet, title }) {
  if (!models || !classRequestId || !issuerWallet || !studentWallet) {
    throw new TypeError("validateClassRequestMatch requires { models, classRequestId, issuerWallet, studentWallet }");
  }

  const classRequest = await models.ClassRequest.findByPk(classRequestId);

  if (!classRequest) {
    console.warn(`[cert-lock] class_request_id ${classRequestId} not found, attempted by ${issuerWallet}`);
    return { ok: false, code: "CLASS_REQUEST_MISMATCH", httpStatus: 409, message: CERT_LOCK_MESSAGE };
  }

  if (classRequest.issuer_wallet_address.toLowerCase() !== issuerWallet.toLowerCase()) {
    console.warn(`[cert-lock] class_request_id ${classRequestId} belongs to another issuer, attempted by ${issuerWallet}`);
    return { ok: false, code: "CLASS_REQUEST_MISMATCH", httpStatus: 409, message: CERT_LOCK_MESSAGE };
  }

  if (classRequest.student_wallet_address.toLowerCase() !== studentWallet.toLowerCase()) {
    console.warn(`[cert-lock] class_request_id ${classRequestId} student wallet mismatch, attempted by ${issuerWallet}`);
    return { ok: false, code: "CLASS_REQUEST_MISMATCH", httpStatus: 409, message: CERT_LOCK_MESSAGE };
  }

  // class_name is nullable (classes without a name) — nothing real to
  // compare the title against, so any title is accepted in that case.
  if (classRequest.class_name != null && String(title).trim() !== String(classRequest.class_name).trim()) {
    console.warn(`[cert-lock] class_request_id ${classRequestId} title mismatch, attempted by ${issuerWallet}`);
    return { ok: false, code: "CLASS_REQUEST_MISMATCH", httpStatus: 409, message: CERT_LOCK_MESSAGE };
  }

  return { ok: true };
}

module.exports = { validateClassRequestMatch };
