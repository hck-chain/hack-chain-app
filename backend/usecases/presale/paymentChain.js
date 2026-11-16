// backend/usecases/presale/paymentChain.js
//
// Proveedor de lectura de la red donde PAGAN los compradores (Ethereum).
//
// Es aparte del de Polygon (harjoot/adapters/polygonProvider) a proposito:
// ese lo usan los pagos de clases, que si viven en Polygon. Mezclarlos haria
// que cambiar uno rompa el otro.

const { PresaleConfigError } = require("../../config/presale");

/**
 * @returns {{ getTransactionReceipt, getBlock, getBlockNumber, destroy }}
 * @throws {PresaleConfigError} sin PRESALE_PAYMENT_RPC_URL. Falla cerrado:
 *   sin poder leer la red de pagos, no se valida nada.
 */
function createPaymentProvider() {
  const rpcUrl = process.env.PRESALE_PAYMENT_RPC_URL;
  if (!rpcUrl) {
    throw new PresaleConfigError(
      "PRESALE_PAYMENT_RPC_URL no esta configurada: no se puede leer la red de pagos (Ethereum)"
    );
  }
  const { JsonRpcProvider } = require("ethers");
  // staticNetwork: detecta la red una sola vez. Sin esto, con el RPC caido
  // ethers deja un bucle de reintentos de fondo por cada proveedor creado.
  const provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
  return {
    getTransactionReceipt: (hash) => provider.getTransactionReceipt(hash),
    getBlock: (n) => provider.getBlock(n),
    getBlockNumber: () => provider.getBlockNumber(),
    destroy: () => provider.destroy(),
  };
}

module.exports = { createPaymentProvider };
