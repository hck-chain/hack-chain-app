// backend/usecases/presale/reviewContribution.js
//
// Revision de aportes de preventa desde el panel de admin.
//
// Decisiones del encargado que este archivo implementa:
//   - Valida UN solo admin; no hay doble aprobacion por codigo. Si mas
//     adelante hace falta, es por proceso.
//   - La fuente de verdad es la transferencia de USDT en cadena. Validar
//     vuelve a verificar en Polygon en el momento, aunque el panel ya lo haya
//     mostrado: entre que el admin mira y aprieta pueden pasar minutos, y lo
//     que se graba tiene que ser lo que se comprobo en ese instante.
//   - Solo se revisa lo que esta 'pending'. Un aporte validado ya puede estar
//     en un lote exportado al contrato; cambiarlo despues romperia la
//     correspondencia con el hash publicado.

const { verifyContribution } = require("./verifyContribution");

/**
 * Pasa un aporte de 'pending' a otro estado SOLO si sigue en 'pending'.
 *
 * Es un UPDATE condicionado y no un "leer, comprobar, escribir": si dos
 * admins (o dos pestañas del mismo) revisan el mismo aporte a la vez, el
 * segundo encuentra 0 filas afectadas y recibe WRONG_STATE en lugar de
 * pisar la decision del primero.
 */
async function transitionFromPending(models, id, values) {
  const [affected] = await models.PresaleContribution.update(values, {
    where: { id, status: "pending" },
  });
  return affected === 1;
}

/**
 * @returns {Promise<
 *   | { ok: true, contribution: object, verification: object }
 *   | { ok: false, reason: "NOT_FOUND" | "WRONG_STATE", currentStatus?: string }
 *   | { ok: false, reason: "VERIFICATION_FAILED", verification: object }
 *   | { ok: false, reason: "CHAIN_UNAVAILABLE", verification: object }
 * >}
 */
async function validateContribution({ models, provider, id, adminWallet, config }) {
  const contribution = await models.PresaleContribution.findByPk(id);
  if (!contribution) return { ok: false, reason: "NOT_FOUND" };
  if (contribution.status !== "pending") {
    return { ok: false, reason: "WRONG_STATE", currentStatus: contribution.status };
  }

  const verification = await verifyContribution({ contribution, provider, config });

  if (!verification.ok) {
    // Un RPC caido no dice nada sobre el pago: se informa distinto para que
    // el panel ofrezca reintentar en vez de sugerir rechazar.
    if (verification.reason === "RPC_ERROR") {
      return { ok: false, reason: "CHAIN_UNAVAILABLE", verification };
    }
    return { ok: false, reason: "VERIFICATION_FAILED", verification };
  }

  const now = new Date();
  const changed = await transitionFromPending(models, id, {
    status: "validated",
    validated_at: now,
    reviewed_by: adminWallet.toLowerCase(),
    reviewed_at: now,
    onchain_amount_usdt: verification.amountUsdt,
    rejection_reason: null,
  });
  if (!changed) {
    const fresh = await models.PresaleContribution.findByPk(id);
    return { ok: false, reason: "WRONG_STATE", currentStatus: fresh?.status };
  }

  return { ok: true, contribution: await models.PresaleContribution.findByPk(id), verification };
}

/**
 * Rechazar no exige verificacion en cadena: el admin puede rechazar por
 * motivos que la cadena no ve (fase equivocada, comprobante de otra persona).
 * El motivo es obligatorio porque se le muestra al comprador.
 */
async function rejectContribution({ models, id, adminWallet, reason }) {
  const contribution = await models.PresaleContribution.findByPk(id);
  if (!contribution) return { ok: false, reason: "NOT_FOUND" };
  if (contribution.status !== "pending") {
    return { ok: false, reason: "WRONG_STATE", currentStatus: contribution.status };
  }

  const changed = await transitionFromPending(models, id, {
    status: "rejected",
    rejection_reason: reason,
    reviewed_by: adminWallet.toLowerCase(),
    reviewed_at: new Date(),
  });
  if (!changed) {
    const fresh = await models.PresaleContribution.findByPk(id);
    return { ok: false, reason: "WRONG_STATE", currentStatus: fresh?.status };
  }

  return { ok: true, contribution: await models.PresaleContribution.findByPk(id) };
}

/**
 * Cola para el panel. Devuelve todos los campos (incluido quien reviso) y
 * los contadores por estado para las pestañas, en una sola llamada.
 */
async function listContributionsForAdmin({ models, status, page = 1, perPage = 20, search }) {
  const { Op } = models.Sequelize;
  const where = {};
  if (status) where.status = status;

  // Busca por wallet o por hash. Se escapa el comodin de LIKE para que un
  // '%' no devuelva la tabla entera.
  const q = (search || "").trim().toLowerCase();
  if (q) {
    const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
    where[Op.or] = [
      { wallet_address: { [Op.like]: `%${escaped}%` } },
      { tx_hash: { [Op.like]: `%${escaped}%` } },
    ];
  }

  const { rows, count } = await models.PresaleContribution.findAndCountAll({
    where,
    // Lo mas viejo primero: en una cola, el que espera desde hace mas tiempo
    // es el que hay que atender antes.
    order: [["created_at", status === "pending" ? "ASC" : "DESC"]],
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  const porEstado = await models.PresaleContribution.findAll({
    attributes: ["status", [models.Sequelize.fn("COUNT", models.Sequelize.col("id")), "n"]],
    group: ["status"],
    raw: true,
  });
  const counts = { pending: 0, validated: 0, rejected: 0 };
  for (const r of porEstado) counts[r.status] = Number(r.n);

  return {
    contributions: rows.map((r) => r.toJSON()),
    page,
    per_page: perPage,
    total: count,
    total_pages: Math.max(1, Math.ceil(count / perPage)),
    counts,
  };
}

module.exports = { validateContribution, rejectContribution, listContributionsForAdmin };
