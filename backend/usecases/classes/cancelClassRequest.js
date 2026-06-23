/**
 * Student withdraws their own pending class request.
 * Only allowed while status is still 'pending' — once confirmed,
 * the student must contact the educator directly.
 */
async function cancelClassRequest({ models, requestId, studentWallet, cancellationReason }) {
  if (!models || !studentWallet) {
    throw new TypeError("cancelClassRequest requires { models, studentWallet }");
  }

  const record = await models.ClassRequest.findOne({
    where: {
      id: requestId,
      student_wallet_address: studentWallet.toLowerCase(),
    },
  });

  if (!record) {
    return { ok: false, code: "REQUEST_NOT_FOUND", httpStatus: 404 };
  }

  if (record.status !== "pending") {
    return { ok: false, code: "CANNOT_CANCEL_NON_PENDING", httpStatus: 422 };
  }

  const updateData = { status: "cancelled" };
  if (cancellationReason) {
    updateData.cancellation_reason = String(cancellationReason).slice(0, 500);
  }
  await record.update(updateData);

  return {
    ok: true,
    data: {
      id: record.id,
      status: "cancelled",
      issuer_wallet_address: record.issuer_wallet_address,
      class_name: record.class_name,
      requested_date: record.requested_date,
      start_time: record.start_time,
      duration_minutes: record.duration_minutes,
    },
  };
}

module.exports = { cancelClassRequest };
