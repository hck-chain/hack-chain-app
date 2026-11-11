// backend/usecases/presale/verifyContribution.js
//
// Verifica en Polygon que un aporte de preventa corresponde a un pago real.
//
// Por decision del encargado, la fuente de verdad son las transferencias de
// USDT en cadena, no la captura ni lo que diga la base. Un aporte se da por
// pagado solo si su tx_hash muestra un Transfer de USDT:
//   - DESDE la wallet del comprador (la que firmo el login), y
//   - HACIA la tesoreria oficial de la preventa, y
//   - por al menos el monto declarado.
//
// Lo del remitente no es un detalle: las transferencias a la tesoreria son
// publicas. Sin esa regla, cualquiera que vigile la direccion en Polygonscan
// podria copiar el hash de un pago ajeno, registrarlo antes que el dueño y
// quedarse con sus HACK. El UNIQUE de tx_hash impide registrarlo dos veces,
// no que lo registre la persona equivocada.
//
// No hay chequeo de repeticion aca: lo garantiza el UNIQUE de
// presale_contributions.tx_hash.

const { checkUsdtTransfer } = require("../../services/usdtPaymentService");

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

class PresaleConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "PresaleConfigError";
  }
}

function defaultConfig() {
  return {
    treasuryAddress: process.env.PRESALE_TREASURY_ADDRESS,
    usdtTokenAddress: process.env.USDT_CONTRACT_ADDRESS,
    usdtDecimals: process.env.USDT_DECIMALS ? Number(process.env.USDT_DECIMALS) : 6,
  };
}

/**
 * @param {object} params
 * @param {object} params.contribution  fila de presale_contributions
 *                                      (wallet_address, tx_hash, usdt_amount)
 * @param {object} params.provider      getTransactionReceipt(txHash)
 * @param {object} [params.config]      { treasuryAddress, usdtTokenAddress, usdtDecimals }
 *
 * @returns {Promise<
 *   | { ok: true, amountUsdt: number, txHash: string }
 *   | { ok: false, reason: "NO_TX_HASH" | "TX_NOT_FOUND" | "TX_REVERTED"
 *                       | "NO_USDT_TRANSFER" | "WRONG_RECIPIENT" | "WRONG_SENDER"
 *                       | "INSUFFICIENT_AMOUNT" }
 *   | { ok: false, reason: "RPC_ERROR", soft_failed: true, error: string }
 * >}
 * @throws {PresaleConfigError} si falta la tesoreria o el token. Falla
 *   cerrado: sin saber a donde tenia que llegar el pago, nada se valida.
 */
async function verifyContribution({ contribution, provider, config }) {
  const cfg = config || defaultConfig();

  if (!cfg.treasuryAddress || !WALLET_REGEX.test(cfg.treasuryAddress)) {
    throw new PresaleConfigError(
      "PRESALE_TREASURY_ADDRESS no esta configurada: no se puede verificar ningun pago"
    );
  }
  if (!cfg.usdtTokenAddress || !WALLET_REGEX.test(cfg.usdtTokenAddress)) {
    throw new PresaleConfigError(
      "USDT_CONTRACT_ADDRESS no esta configurada: no se puede verificar ningun pago"
    );
  }

  if (!contribution.tx_hash) {
    return { ok: false, reason: "NO_TX_HASH" };
  }

  return checkUsdtTransfer({
    provider,
    txHash: contribution.tx_hash,
    expectedFrom: contribution.wallet_address,
    expectedTo: cfg.treasuryAddress,
    expectedMinAmountUsdt: Number(contribution.usdt_amount),
    config: { usdtTokenAddress: cfg.usdtTokenAddress, usdtDecimals: cfg.usdtDecimals },
  });
}

module.exports = { verifyContribution, PresaleConfigError };
