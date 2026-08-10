const STAGES = {
  deposit: {
    requiredPaymentStatus: "deposit_submitted",
    nextPaymentStatus: "deposit_confirmed",
    confirmedAtField: "deposit_confirmed_at",
  },
  final: {
    requiredPaymentStatus: "final_submitted",
    nextPaymentStatus: "paid",
    confirmedAtField: "final_confirmed_at",
  },
};

/**
 * Educator confirms they received the deposit or final 50% payment.
 */
async function confirmPaymentReceived({ models, requestId, issuerWallet, stage }) {
  if (!models || !issuerWallet || !stage) {
    throw new TypeError("confirmPaymentReceived requires { models, issuerWallet, stage }");
  }

  const stageConfig = STAGES[stage];
  if (!stageConfig) {
    return { ok: false, code: "INVALID_STAGE", httpStatus: 400 };
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

  if (record.payment_status !== stageConfig.requiredPaymentStatus) {
    return { ok: false, code: "UNEXPECTED_PAYMENT_STATUS", httpStatus: 422 };
  }

  await record.update({
    payment_status: stageConfig.nextPaymentStatus,
    [stageConfig.confirmedAtField]: new Date(),
  });

  return {
    ok: true,
    data: {
      id: record.id,
      payment_status: record.payment_status,
      student_wallet_address: record.student_wallet_address,
    },
  };
}

module.exports = { confirmPaymentReceived };
