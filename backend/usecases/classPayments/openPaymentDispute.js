const STAGES = {
  deposit: {
    requiredPaymentStatus: "deposit_submitted",
    disputedPaymentStatus: "deposit_disputed",
  },
  final: {
    requiredPaymentStatus: "final_submitted",
    disputedPaymentStatus: "final_disputed",
  },
};

/**
 * Talent opens a dispute when the educator hasn't confirmed a submitted
 * payment proof. HackChain (admin) arbitrates via resolvePaymentDispute.
 */
async function openPaymentDispute({ models, requestId, studentWallet, stage }) {
  if (!models || !studentWallet || !stage) {
    throw new TypeError("openPaymentDispute requires { models, studentWallet, stage }");
  }

  const stageConfig = STAGES[stage];
  if (!stageConfig) {
    return { ok: false, code: "INVALID_STAGE", httpStatus: 400 };
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

  if (record.payment_status !== stageConfig.requiredPaymentStatus) {
    return { ok: false, code: "UNEXPECTED_PAYMENT_STATUS", httpStatus: 422 };
  }

  const dispute = await models.ClassPaymentDispute.create({
    class_request_id: record.id,
    dispute_type: stage,
    status: "open",
    opened_by_wallet: studentWallet.toLowerCase(),
  });

  await record.update({ payment_status: stageConfig.disputedPaymentStatus });

  return {
    ok: true,
    data: {
      disputeId: dispute.id,
      id: record.id,
      payment_status: record.payment_status,
      issuer_wallet_address: record.issuer_wallet_address,
    },
  };
}

module.exports = { openPaymentDispute };
