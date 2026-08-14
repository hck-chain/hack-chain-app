const { verifyUsdtPayment } = require("../../services/usdtPaymentService");

// Rendered as a raw <a href> in the educator and admin dashboards — a
// javascript: or data: URI here would execute in whoever clicks it, riding
// their session cookie. Only allow schemes that can never carry executable
// content.
const ALLOWED_PROOF_URL_SCHEMES = ["http:", "https:", "ipfs:"];
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

function isSafeProofUrl(url) {
  try {
    return ALLOWED_PROOF_URL_SCHEMES.includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

const STAGES = {
  deposit: {
    requiredClassStatus: "confirmed",
    requiredPaymentStatus: "unpaid",
    nextPaymentStatus: "deposit_submitted",
    confirmedPaymentStatus: "deposit_confirmed",
    confirmedAtField: "deposit_confirmed_at",
    proofUrlField: "deposit_proof_url",
    proofCidField: "deposit_proof_cid",
    txHashField: "deposit_tx_hash",
  },
  final: {
    requiredClassStatus: "confirmed",
    requiredPaymentStatus: "deposit_confirmed",
    nextPaymentStatus: "final_submitted",
    confirmedPaymentStatus: "paid",
    confirmedAtField: "final_confirmed_at",
    proofUrlField: "final_proof_url",
    proofCidField: "final_proof_cid",
    txHashField: "final_tx_hash",
  },
};

// A verified on-chain USDT payment maps to a 4xx/409/503 code the route can
// forward as-is — the frontend already has to render *some* specific error,
// this just gives it the real reason instead of a generic failure.
const VERIFY_FAILURE_STATUS = {
  TX_NOT_FOUND: 422,
  TX_REVERTED: 422,
  NO_USDT_TRANSFER: 422,
  WRONG_RECIPIENT: 422,
  WRONG_SENDER: 422,
  INSUFFICIENT_AMOUNT: 422,
  REPLAY: 409,
  RPC_ERROR: 503,
};

/**
 * Talent submits proof for the deposit or final 50% payment of a confirmed
 * class request — either a manual proof (screenshot CID / external link,
 * trust-based, an educator confirms it later) or a `txHash` from a direct
 * USDT wallet transfer, which is verified on-chain here and — if it checks
 * out — auto-confirms the stage. The chain is the confirmation; there's
 * nothing left for the educator to attest to.
 */
async function submitPaymentProof({
  models,
  requestId,
  studentWallet,
  stage,
  proofUrl,
  proofCid,
  txHash,
  amount,
  currency,
  paymentNetwork,
  provider,
}) {
  if (!models || !studentWallet || !stage) {
    throw new TypeError("submitPaymentProof requires { models, studentWallet, stage }");
  }

  const stageConfig = STAGES[stage];
  if (!stageConfig) {
    return { ok: false, code: "INVALID_STAGE", httpStatus: 400 };
  }

  if (txHash && !TX_HASH_REGEX.test(txHash)) {
    return { ok: false, code: "INVALID_TX_HASH", httpStatus: 400 };
  }

  if (!txHash) {
    if (!proofUrl && !proofCid) {
      return { ok: false, code: "PROOF_REQUIRED", httpStatus: 400 };
    }
    if (proofUrl && !isSafeProofUrl(proofUrl)) {
      return { ok: false, code: "INVALID_PROOF_URL", httpStatus: 400 };
    }
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

  if (record.status !== stageConfig.requiredClassStatus) {
    return { ok: false, code: "CLASS_NOT_CONFIRMED", httpStatus: 422 };
  }

  if (record.payment_status !== stageConfig.requiredPaymentStatus) {
    return { ok: false, code: "UNEXPECTED_PAYMENT_STATUS", httpStatus: 422 };
  }

  // ---- wallet-pay path: verify on-chain, then auto-confirm --------------------
  if (txHash) {
    if (record.hourly_rate_usd == null) {
      return { ok: false, code: "MISSING_PRICE", httpStatus: 422 };
    }
    if (!provider) {
      throw new TypeError("submitPaymentProof requires { provider } when txHash is given");
    }

    const stageAmountUsdt = (parseFloat(record.hourly_rate_usd) * record.duration_minutes) / 120;

    const result = await verifyUsdtPayment({
      models,
      provider,
      txHash,
      expectedFrom: studentWallet,
      expectedTo: record.issuer_wallet_address,
      expectedMinAmountUsdt: stageAmountUsdt,
    });

    if (!result.ok) {
      if (result.reason === "REPLAY") {
        return { ok: false, code: "TX_ALREADY_USED", httpStatus: 409 };
      }
      return {
        ok: false,
        code: result.reason,
        httpStatus: VERIFY_FAILURE_STATUS[result.reason] || 422,
      };
    }

    await record.update({
      payment_status: stageConfig.confirmedPaymentStatus,
      [stageConfig.txHashField]: result.txHash,
      [stageConfig.confirmedAtField]: new Date(),
      amount: result.amountUsdt,
      currency: "USDT",
      payment_network: "polygon",
    });

    return {
      ok: true,
      data: {
        id: record.id,
        payment_status: record.payment_status,
        issuer_wallet_address: record.issuer_wallet_address,
      },
    };
  }

  // ---- manual proof path — unchanged ------------------------------------------
  const updateData = {
    payment_status: stageConfig.nextPaymentStatus,
    [stageConfig.proofUrlField]: proofUrl || null,
    [stageConfig.proofCidField]: proofCid || null,
  };
  if (amount != null) updateData.amount = amount;
  if (currency) updateData.currency = currency;
  if (paymentNetwork) updateData.payment_network = paymentNetwork;

  await record.update(updateData);

  return {
    ok: true,
    data: {
      id: record.id,
      payment_status: record.payment_status,
      issuer_wallet_address: record.issuer_wallet_address,
    },
  };
}

module.exports = { submitPaymentProof };
