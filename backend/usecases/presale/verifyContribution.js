// backend/usecases/presale/verifyContribution.js
//
// Verifica en la red de pagos (Ethereum) que un aporte corresponde a un pago
// real, y calcula lo que se acredita.
//
// Lo que se acredita sale de la cadena, NUNCA de lo que declara el
// comprador en el formulario:
//   - la FASE, de la fecha del bloque en que llego el pago (regla: los pagos
//     se atienden por orden de llegada). Antes la elegia el cliente: alguien
//     que pagaba en la fase 3 podia declarar la fase 1 y llevarse 2,67 veces
//     mas tokens, y la verificacion no lo notaba.
//   - los HACK, del monto TRANSFERIDO al precio de esa fase, redondeando
//     hacia abajo (regla de conversion), con aritmetica entera.
//
// Remitente: el Transfer tiene que salir de la wallet que firmo el login.
// Las transferencias a la tesoreria son publicas; sin esta regla, cualquiera
// podria registrar el hash de un pago ajeno y quedarse con esos HACK. Si el
// pago llego a la tesoreria pero desde otra direccion (tipicamente un
// exchange), la regla acordada es REVISION MANUAL: se informa
// WRONG_SENDER con manualReviewPossible, y el admin puede validarlo dejando
// una nota (allowAnySender).
//
// Repeticion: la impide el UNIQUE de presale_contributions.tx_hash.

const { checkUsdtTransfer } = require("../../services/usdtPaymentService");
const {
  PresaleConfigError,
  USDT_DECIMALS,
  MIN_PURCHASE_BASE,
  loadPhases,
  phaseAt,
  hackFor,
  networkFor,
} = require("../../config/presale");

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const MIN_PURCHASE_USDT = Number(MIN_PURCHASE_BASE) / 10 ** USDT_DECIMALS;

function defaultConfig() {
  // Tesoreria y token salen del array de config/presale.js (red "payment").
  const pago = networkFor("payment");
  return {
    treasuryAddress: pago.treasury,
    usdtTokenAddress: pago.token.address,
    usdtDecimals: pago.token.decimals ?? USDT_DECIMALS,
    // ~2,5 minutos en Ethereum: un pago recien minado todavia puede
    // desaparecer en una reorganizacion de la cadena.
    minConfirmations: process.env.PRESALE_MIN_CONFIRMATIONS ? Number(process.env.PRESALE_MIN_CONFIRMATIONS) : 12,
    phases: loadPhases(),
  };
}

/**
 * @param {object} params
 * @param {object} params.contribution   fila de presale_contributions
 * @param {object} params.provider       { getTransactionReceipt, getBlock, getBlockNumber }
 * @param {object} [params.config]
 * @param {boolean} [params.allowAnySender]  revision manual: acepta un pago a la
 *   tesoreria aunque no salga de la wallet del comprador.
 *
 * @returns {Promise<
 *   | { ok: true, txHash, amountUsdt, amountBase, blockTime, phaseId, phaseLabel,
 *       hackAmount, senders, manualReview: boolean }
 *   | { ok: false, reason: "WRONG_SENDER", manualReviewPossible: true,
 *       senders, amountUsdt, phaseId, phaseLabel, hackAmount, blockTime }
 *   | { ok: false, reason: "NO_TX_HASH" | "TX_NOT_FOUND" | "TX_REVERTED"
 *       | "NO_USDT_TRANSFER" | "WRONG_RECIPIENT" | "WRONG_SENDER"
 *       | "BELOW_MINIMUM" | "OUTSIDE_PHASE", blockTime? }
 *   | { ok: false, reason: "RPC_ERROR" | "NOT_ENOUGH_CONFIRMATIONS", soft_failed: true, ... }
 * >}
 * @throws {PresaleConfigError} sin tesoreria o sin token: falla cerrado.
 */
async function verifyContribution({ contribution, provider, config, allowAnySender = false }) {
  const cfg = config || defaultConfig();

  if (!cfg.treasuryAddress || !WALLET_REGEX.test(cfg.treasuryAddress)) {
    throw new PresaleConfigError(
      "La tesoreria de pagos no esta definida (config/presale.js -> payment.treasury): no se puede verificar ningun pago"
    );
  }
  if (!cfg.usdtTokenAddress || !WALLET_REGEX.test(cfg.usdtTokenAddress)) {
    throw new PresaleConfigError(
      "El token de pago no esta definido (config/presale.js -> payment.token.address): no se puede verificar ningun pago"
    );
  }

  if (!contribution.tx_hash) return { ok: false, reason: "NO_TX_HASH" };

  const base = {
    provider,
    txHash: contribution.tx_hash,
    expectedFrom: contribution.wallet_address,
    expectedTo: cfg.treasuryAddress,
    expectedMinAmountUsdt: MIN_PURCHASE_USDT,
    config: { usdtTokenAddress: cfg.usdtTokenAddress, usdtDecimals: cfg.usdtDecimals },
  };

  let result = await checkUsdtTransfer(base);
  let manualReview = false;

  if (!result.ok && result.reason === "WRONG_SENDER") {
    // El pago llego a la tesoreria, pero desde otra direccion. Se mira igual
    // para que el admin vea de donde vino y cuanto fue.
    const fromAnyone = await checkUsdtTransfer({ ...base, anySender: true });
    if (!fromAnyone.ok) return mapReason(fromAnyone);
    if (!allowAnySender) {
      const detail = await creditFor(fromAnyone, provider, cfg);
      if (!detail.ok) return detail;
      return {
        ok: false,
        reason: "WRONG_SENDER",
        manualReviewPossible: true,
        senders: fromAnyone.senders,
        amountUsdt: fromAnyone.amountUsdt,
        phaseId: detail.phaseId,
        phaseLabel: detail.phaseLabel,
        hackAmount: detail.hackAmount,
        blockTime: detail.blockTime,
      };
    }
    result = fromAnyone;
    manualReview = true;
  }

  if (!result.ok) return mapReason(result);

  const credit = await creditFor(result, provider, cfg);
  if (!credit.ok) return credit;

  return {
    ok: true,
    txHash: result.txHash,
    amountUsdt: result.amountUsdt,
    amountBase: result.amountBase,
    senders: result.senders,
    manualReview,
    ...credit,
  };
}

/** En la preventa, "monto insuficiente" significa "por debajo del minimo de 1 USD". */
function mapReason(r) {
  if (r.reason === "INSUFFICIENT_AMOUNT") return { ok: false, reason: "BELOW_MINIMUM" };
  return r;
}

/**
 * Confirmaciones, fecha del bloque, fase y HACK acreditados.
 * @returns {{ ok: true, blockTime, phaseId, phaseLabel, hackAmount } | { ok: false, ... }}
 */
async function creditFor(result, provider, cfg) {
  let head, block;
  try {
    head = await provider.getBlockNumber();
    block = await provider.getBlock(result.blockNumber);
  } catch (err) {
    return { ok: false, reason: "RPC_ERROR", soft_failed: true, error: err.shortMessage || err.message };
  }

  const confirmations = Number(head) - Number(result.blockNumber) + 1;
  if (confirmations < cfg.minConfirmations) {
    return {
      ok: false,
      reason: "NOT_ENOUGH_CONFIRMATIONS",
      soft_failed: true,
      confirmations,
      required: cfg.minConfirmations,
    };
  }

  const blockTime = new Date(Number(block.timestamp) * 1000);
  const phase = phaseAt(blockTime, cfg.phases);
  if (!phase) {
    // Reglas: un pago que llega cuando ninguna fase esta abierta se devuelve.
    return { ok: false, reason: "OUTSIDE_PHASE", blockTime: blockTime.toISOString() };
  }

  return {
    ok: true,
    blockTime: blockTime.toISOString(),
    phaseId: phase.id,
    phaseLabel: phase.label,
    hackAmount: hackFor(result.amountBase, phase).toString(),
  };
}

module.exports = { verifyContribution, PresaleConfigError };
