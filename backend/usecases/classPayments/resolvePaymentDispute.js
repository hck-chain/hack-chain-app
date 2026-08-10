const STAGES = {
  deposit: {
    paidPaymentStatus: "deposit_confirmed",
    unpaidPaymentStatus: "unpaid",
    confirmedAtField: "deposit_confirmed_at",
  },
  final: {
    paidPaymentStatus: "paid",
    unpaidPaymentStatus: "deposit_confirmed",
    confirmedAtField: "final_confirmed_at",
  },
};

/**
 * HackChain admin arbitrates a payment dispute. `wasPaid: true` confirms the
 * payment happened (talent's proof stands); `false` reverts the class request
 * so the talent must resubmit proof.
 */
async function resolvePaymentDispute({ models, disputeId, adminWallet, wasPaid, resolutionNote }) {
  if (!models || !adminWallet || typeof wasPaid !== "boolean") {
    throw new TypeError("resolvePaymentDispute requires { models, adminWallet, wasPaid }");
  }

  const dispute = await models.ClassPaymentDispute.findByPk(disputeId);
  if (!dispute) {
    return { ok: false, code: "DISPUTE_NOT_FOUND", httpStatus: 404 };
  }

  if (dispute.status !== "open") {
    return { ok: false, code: "DISPUTE_ALREADY_RESOLVED", httpStatus: 422 };
  }

  const stageConfig = STAGES[dispute.dispute_type];
  if (!stageConfig) {
    return { ok: false, code: "INVALID_STAGE", httpStatus: 400 };
  }

  const record = await models.ClassRequest.findByPk(dispute.class_request_id);
  if (!record) {
    return { ok: false, code: "REQUEST_NOT_FOUND", httpStatus: 404 };
  }

  const classUpdate = wasPaid
    ? { payment_status: stageConfig.paidPaymentStatus, [stageConfig.confirmedAtField]: new Date() }
    : { payment_status: stageConfig.unpaidPaymentStatus };
  await record.update(classUpdate);

  await dispute.update({
    status: wasPaid ? "resolved_paid" : "resolved_unpaid",
    resolution_note: resolutionNote ? String(resolutionNote).slice(0, 1000) : null,
    resolved_by_wallet: adminWallet.toLowerCase(),
    resolved_at: new Date(),
  });

  return {
    ok: true,
    data: {
      disputeId: dispute.id,
      status: dispute.status,
      classRequestId: record.id,
      payment_status: record.payment_status,
      student_wallet_address: record.student_wallet_address,
      issuer_wallet_address: record.issuer_wallet_address,
    },
  };
}

module.exports = { resolvePaymentDispute };
