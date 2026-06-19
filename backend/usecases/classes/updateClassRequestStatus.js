const VALID_STATUSES = ["confirmed", "cancelled", "completed"];

/**
 * Educator updates the status of a class request they own.
 */
async function updateClassRequestStatus({ models, requestId, issuerWallet, status, cancellationReason }) {
  if (!models || !issuerWallet) {
    throw new TypeError("updateClassRequestStatus requires { models, issuerWallet }");
  }

  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, code: "INVALID_STATUS", httpStatus: 400 };
  }

  const record = await models.ClassRequest.findOne({
    where: {
      id: requestId,
      issuer_wallet_address: issuerWallet.toLowerCase(),
    },
  });

  if (!record) {
    return { ok: false, code: "REQUEST_NOT_FOUND", httpStatus: 404 };
  }

  const updateData = { status };
  if (status === "cancelled" && cancellationReason) {
    updateData.cancellation_reason = String(cancellationReason).slice(0, 500);
  }
  await record.update(updateData);

  return { ok: true, data: { id: record.id, status: record.status } };
}

module.exports = { updateClassRequestStatus };
