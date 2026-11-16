// backend/usecases/presale/exportAllocationBatch.js
//
// Genera el lote comprador -> cantidad que el multisig escribe en
// PresaleAllocation.allocateBatch, y el hash que se graba con
// setAllocationListHash().
//
// Por que esto importa: setAllocationListHash() es de escritura unica. Ese
// hash es lo que permite que cualquiera tome la lista publicada y demuestre
// contra la cadena que fue la que realmente se uso. Si el archivo se arma a
// mano desde la base, el unico paso donde un error cuesta tokens reales e
// irreversibles queda sin red.
//
// Segunda revision (decision del encargado): antes de generar nada, CADA
// aporte validado se vuelve a verificar en Polygon. No contra la base, contra
// la cadena: una fila maliciosa metida por un admin comprometido pasaria
// cualquier "reconstruir la lista desde la base", pero no esta comprobacion.
// Si una sola fila falla, no se exporta.
//
// Formato: el que valida contracts/script/cargar-lote.sh, al byte.
//   - sin encabezado
//   - una fila por direccion: "0x<40 hex en minuscula>,<cantidad en wei>"
//   - sin duplicados (los aportes de una misma wallet se suman)
//   - ordenado por direccion, terminado en un salto de linea
//
// El orden es parte del contrato: sin un orden fijo, dos exportaciones de los
// mismos datos darian archivos distintos y por lo tanto hashes distintos.
//
// Hash: keccak256 de los bytes exactos del archivo. Se reproduce con
//   cast keccak "0x$(xxd -p lote.csv | tr -d '\n')"
//
// Pendientes: si queda un solo aporte 'pending', no se exporta. Despues de
// finalizePresale() el contrato rechaza toda asignacion nueva, asi que un
// aporte que quedo pendiente al generar el lote final se queda sin tokens
// para siempre. Primero se vacia la cola, despues se genera el lote.
//
// Tandas: el archivo completo es el que se compromete con el hash. Para
// cargarlo se parte en tandas de BATCH_SIZE filas, una transaccion de
// allocateBatch cada una (medido: ~25.300 de gas por wallet, ~5M por tanda
// de 200; un tamaño que el multisig puede revisar antes de firmar). Las
// tandas concatenadas reproducen el archivo completo byte a byte.

const { keccak256, toUtf8Bytes } = require("ethers");
const { verifyContribution } = require("./verifyContribution");

const HACK_DECIMALS = 18n;
const WEI_PER_HACK = 10n ** HACK_DECIMALS;
// Verificaciones en paralelo contra el RPC. Bajo a proposito: los RPC
// publicos limitan por IP y una rafaga larga termina en errores 429.
const CONCURRENCY = 4;
const BATCH_SIZE = 200;

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

/**
 * hack_amount se guarda como HACK enteros (DECIMAL(38,0)). Se pasa a wei con
 * BigInt desde el string: Number pierde precision por encima de 2^53, y un
 * redondeo aca es literalmente asignar tokens de mas o de menos.
 */
function hackToWei(hackAmount) {
  const entero = String(hackAmount).split(".")[0];
  if (!/^\d+$/.test(entero)) throw new Error(`hack_amount invalido: ${hackAmount}`);
  return BigInt(entero) * WEI_PER_HACK;
}

/**
 * @returns {Promise<
 *   | { ok: true, csv: string, hash: string, rows: Array<{address, wei, hack, contributions}>,
 *       totals: { wallets: number, contributions: number, hack: string, wei: string } }
 *   | { ok: false, reason: "PENDING_CONTRIBUTIONS", pending: number }
 *   | { ok: false, reason: "EMPTY" }
 *   | { ok: false, reason: "VERIFICATION_FAILED", problems: Array<{ id, wallet_address, tx_hash, reason }> }
 *   | { ok: false, reason: "CHAIN_UNAVAILABLE", problems: Array<...> }
 * >}
 */
async function exportAllocationBatch({ models, provider, config, batchSize = BATCH_SIZE }) {
  // Antes que nada, y sin tocar la cadena: con pendientes no hay lote.
  const pending = await models.PresaleContribution.count({ where: { status: "pending" } });
  if (pending > 0) return { ok: false, reason: "PENDING_CONTRIBUTIONS", pending };

  const validados = await models.PresaleContribution.findAll({
    where: { status: "validated" },
    order: [["id", "ASC"]],
  });

  if (validados.length === 0) return { ok: false, reason: "EMPTY" };

  // ---- segunda revision: todo contra la cadena -------------------------------
  // Los validados por revision manual (pago desde un exchange) se
  // re-verifican aceptando otro remitente, igual que cuando se validaron.
  const resultados = await mapLimit(validados, CONCURRENCY, (c) =>
    verifyContribution({ contribution: c, provider, config, allowAnySender: Boolean(c.manual_review_note) })
  );

  const problems = [];
  resultados.forEach((r, i) => {
    const c = validados[i];
    const fila = { id: c.id, wallet_address: c.wallet_address, tx_hash: c.tx_hash };
    if (!r.ok) {
      problems.push({ ...fila, reason: r.reason });
      return;
    }
    // Lo acreditado se vuelve a derivar de la cadena y se compara con lo
    // guardado: si alguien edito la fase o los HACK de una fila en la base,
    // el pago real no lo respalda y no se exporta.
    if (Number(c.phase_id) !== r.phaseId) {
      problems.push({ ...fila, reason: "PHASE_MISMATCH" });
    } else if (String(c.hack_amount).split(".")[0] !== r.hackAmount) {
      problems.push({ ...fila, reason: "AMOUNT_MISMATCH" });
    }
  });

  if (problems.length) {
    // Si lo unico que fallo es el RPC, no hay evidencia contra ningun aporte:
    // se reintenta, no se investiga.
    const soloRpc = problems.every((p) => p.reason === "RPC_ERROR" || p.reason === "NOT_ENOUGH_CONFIRMATIONS");
    return { ok: false, reason: soloRpc ? "CHAIN_UNAVAILABLE" : "VERIFICATION_FAILED", problems };
  }

  return { ok: true, ...buildBatch(validados, batchSize) };
}

/**
 * Arma el lote a partir de los aportes validados: suma por wallet, orden fijo
 * por direccion, CSV, hash y tandas. Funcion pura, sin cadena ni base.
 *
 * La usan la exportacion y el estado del contrato: los dos tienen que hablar
 * exactamente del mismo lote (mismas filas, mismo orden, mismas tandas, mismo
 * hash), o el estado compararia la cadena contra otra cosa.
 */
function buildBatch(validados, batchSize = BATCH_SIZE) {
  const porWallet = new Map();
  for (const c of validados) {
    const addr = c.wallet_address.toLowerCase();
    const prev = porWallet.get(addr) || { wei: 0n, contributions: 0 };
    porWallet.set(addr, { wei: prev.wei + hackToWei(c.hack_amount), contributions: prev.contributions + 1 });
  }

  const rows = [...porWallet.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([address, v]) => ({
      address,
      wei: v.wei.toString(),
      hack: (v.wei / WEI_PER_HACK).toString(),
      contributions: v.contributions,
    }));

  const toCsv = (rs) => rs.map((r) => `${r.address},${r.wei}`).join("\n") + "\n";
  const csv = toCsv(rows);
  const hash = keccak256(toUtf8Bytes(csv));

  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    batches.push({ index: batches.length + 1, wallets: slice.length, csv: toCsv(slice), rows: slice });
  }
  const totalWei = rows.reduce((acc, r) => acc + BigInt(r.wei), 0n);

  return {
    csv,
    hash,
    rows,
    batches,
    batchSize,
    totals: {
      wallets: rows.length,
      contributions: validados.length,
      hack: (totalWei / WEI_PER_HACK).toString(),
      wei: totalWei.toString(),
    },
  };
}

module.exports = { exportAllocationBatch, buildBatch, hackToWei, BATCH_SIZE, WEI_PER_HACK };
