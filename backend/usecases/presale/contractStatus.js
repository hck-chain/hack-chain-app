// backend/usecases/presale/contractStatus.js
//
// Estado del contrato PresaleAllocation comparado contra el lote.
//
// El panel genera el lote y despues se queda ciego: no sabe si se cargo, si
// se cargo entero, si una tanda entro dos veces o si el hash grabado es el
// correcto. Esto lo responde leyendo el contrato en cadena (solo lectura,
// nunca firma nada). Ningun estado sale de lo que alguien anoto: todo sale
// del contrato.
//
// El error caro que tiene que detectar es la DOBLE CARGA: el contrato SUMA
// las asignaciones (allocate acumula), asi que una tanda cargada dos veces
// entrega el doble de tokens y nada en cadena lo impide.

const { buildBatch, BATCH_SIZE, WEI_PER_HACK } = require("./exportAllocationBatch");

const ZERO_HASH = "0x" + "0".repeat(64);
const CLIFF_SECONDS = 30n * 24n * 60n * 60n; // PresaleAllocation.CLIFF_DURATION
const CONCURRENCY = 4;

const PRESALE_ABI = [
  "function allocations(address) view returns (uint256)",
  "function totalAllocated() view returns (uint256)",
  "function totalClaimed() view returns (uint256)",
  "function beneficiaryCount() view returns (uint256)",
  "function allocationListHash() view returns (bytes32)",
  "function finalized() view returns (bool)",
  "function vestingStart() view returns (uint256)",
  "function presaleCap() view returns (uint256)",
  "function paused() view returns (bool)",
  "function hackToken() view returns (address)",
];
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];

/**
 * Lector real: ethers v6 contra el RPC. Se construye aparte para que el caso
 * de uso reciba cualquier objeto con la misma forma (tests, Anvil, Polygon).
 */
function createPresaleContractReader({ rpcUrl, contractAddress }) {
  const { JsonRpcProvider, Contract } = require("ethers");
  // staticNetwork: detecta la red una sola vez. Sin esto, con el RPC caido
  // ethers deja un bucle de reintentos de fondo por cada lector creado.
  const provider = new JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
  const presale = new Contract(contractAddress, PRESALE_ABI, provider);
  return {
    address: contractAddress,
    presale,
    async token() {
      return new Contract(await presale.hackToken(), ERC20_ABI, provider);
    },
    /** Libera el provider (timers y conexiones). Llamar siempre al terminar. */
    destroy() {
      provider.destroy();
    },
  };
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const toHack = (wei) => (BigInt(wei) / WEI_PER_HACK).toString();

/**
 * Estado de una wallet: lo que dice el contrato contra lo que dice el lote.
 *   loaded      exactamente lo esperado
 *   not_loaded  todavia nada
 *   over        MAS de lo esperado: tipicamente una tanda cargada dos veces
 *   partial     menos de lo esperado (cargada a medias o el lote cambio
 *               despues de cargarla)
 */
function walletState(expected, onchain) {
  if (onchain === expected) return "loaded";
  if (onchain === 0n) return "not_loaded";
  if (onchain > expected) return "over";
  return "partial";
}

/** Estado de una tanda a partir del de sus wallets. */
function batchState(states) {
  if (states.some((s) => s === "over")) return "over";
  if (states.every((s) => s === "loaded")) return "loaded";
  if (states.every((s) => s === "not_loaded")) return "not_loaded";
  return "partial";
}

/**
 * @param {object} params
 * @param {object} params.models     db (PresaleContribution)
 * @param {object} params.reader     { address, presale, token() } — ver createPresaleContractReader
 * @param {number} [params.batchSize]
 */
async function getContractStatus({ models, reader, batchSize = BATCH_SIZE }) {
  const { presale } = reader;

  const pending = await models.PresaleContribution.count({ where: { status: "pending" } });
  const validados = await models.PresaleContribution.findAll({
    where: { status: "validated" },
    order: [["id", "ASC"]],
  });

  // ---- estado general del contrato ------------------------------------------
  const token = await reader.token();
  const [totalAllocated, totalClaimed, beneficiaryCount, listHash, finalized, vestingStart, presaleCap, paused, balance] =
    await Promise.all([
      presale.totalAllocated(),
      presale.totalClaimed(),
      presale.beneficiaryCount(),
      presale.allocationListHash(),
      presale.finalized(),
      presale.vestingStart(),
      presale.presaleCap(),
      presale.paused(),
      token.balanceOf(reader.address),
    ]);

  // Fondeo: lo que el contrato todavia tiene que poder pagar.
  const owed = BigInt(totalAllocated) - BigInt(totalClaimed);

  const onchain = {
    totalAllocated: BigInt(totalAllocated).toString(),
    totalAllocatedHack: toHack(totalAllocated),
    totalClaimedHack: toHack(totalClaimed),
    beneficiaryCount: Number(beneficiaryCount),
    presaleCapHack: toHack(presaleCap),
    balanceHack: toHack(balance),
    allocationListHash: listHash === ZERO_HASH ? null : listHash,
    finalized: Boolean(finalized),
    paused: Boolean(paused),
    vestingStart: finalized ? new Date(Number(vestingStart) * 1000).toISOString() : null,
    // La fecha real de reclamo sale del contrato, no de una constante del front.
    claimFrom: finalized ? new Date(Number(BigInt(vestingStart) + CLIFF_SECONDS) * 1000).toISOString() : null,
  };

  const funding = BigInt(balance) >= owed
    ? { state: "ok" }
    : { state: "short", missingHack: toHack(owed - BigInt(balance)) };

  if (validados.length === 0) {
    return { contract: reader.address, review: { pending }, onchain, funding, batch: null, checks: null };
  }

  // ---- el lote, armado igual que en la exportacion ----------------------------
  const lote = buildBatch(validados, batchSize);

  const allocations = await mapLimit(lote.rows, CONCURRENCY, (r) => presale.allocations(r.address));
  const porWallet = new Map(
    lote.rows.map((r, i) => {
      const expected = BigInt(r.wei);
      const got = BigInt(allocations[i]);
      return [r.address, { expected, got, state: walletState(expected, got) }];
    })
  );

  const batches = lote.batches.map((b) => {
    const estados = b.rows.map((r) => porWallet.get(r.address));
    return {
      index: b.index,
      wallets: b.wallets,
      state: batchState(estados.map((e) => e.state)),
      loadedWallets: estados.filter((e) => e.state === "loaded").length,
    };
  });

  const problems = [...porWallet.entries()]
    .filter(([, v]) => v.state === "over" || v.state === "partial")
    .map(([address, v]) => ({
      address,
      state: v.state,
      expectedHack: toHack(v.expected),
      onchainHack: toHack(v.got),
    }));

  const loteWei = BigInt(lote.totals.wei);
  const allocated = BigInt(totalAllocated);

  return {
    contract: reader.address,
    review: { pending },
    onchain,
    funding,
    batch: {
      hash: lote.hash,
      wallets: lote.totals.wallets,
      hack: lote.totals.hack,
      batchSize: lote.batchSize,
      batches,
      problems,
    },
    checks: {
      // Totales: el contrato contra el lote.
      totals: allocated === loteWei ? "match" : allocated < loteWei ? "below" : "above",
      // Mas beneficiarios en cadena que wallets en el lote: alguien asigno a
      // direcciones que no estan en el lote.
      unknownBeneficiaries: Math.max(0, Number(beneficiaryCount) - lote.totals.wallets),
      hash: !onchain.allocationListHash
        ? "unset"
        : onchain.allocationListHash.toLowerCase() === lote.hash.toLowerCase() ? "match" : "mismatch",
    },
  };
}

module.exports = { getContractStatus, createPresaleContractReader, walletState, batchState };
