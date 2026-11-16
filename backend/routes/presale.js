// backend/routes/presale.js
//
// Registro de aportes de la preventa publica de HACK.
//
// Modelo: la venta ocurre fuera de la cadena. El comprador transfiere USDT
// (en Ethereum) a la tesoreria, sube el comprobante a /api/upload/payment-proof (que
// lo manda a Pinata sin tocar disco) y registra el aporte aca con el CID que
// ese endpoint devolvio. Al cerrar la venta, las filas validadas se exportan
// como el lote que el multisig escribe en PresaleAllocation.allocateBatch.
const express = require("express");
const rateLimit = require("express-rate-limit");
const { body, query, validationResult } = require("express-validator");
const { PresaleContribution, Sequelize } = require("../models");
const { authenticate } = require("../middleware/auth");
const { phaseById, hackFor, MIN_PURCHASE_BASE, USDT_DECIMALS, getNetworks, loadPhases } = require("../config/presale");

const { Op } = Sequelize;
const router = express.Router();

const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

// Fases, precios y minimo salen de config/presale.js (la autoridad).
//
// Lo que el comprador manda al registrar (fase, USDT, HACK) es solo lo que
// DECLARA. Lo que se acredita lo decide la validacion con la cadena: la fase
// por la fecha del bloque del pago y los HACK por lo transferido. Aca solo
// se controla que la declaracion sea coherente, para atajar errores de
// tipeo antes de que lleguen al admin.
const MIN_PURCHASE_USDT = Number(MIN_PURCHASE_BASE) / 10 ** USDT_DECIMALS;
// Tolerancia al comparar el hack_amount declarado contra el recalculado: el
// cliente hace la division en coma flotante y puede diferir en el ultimo bit.
const HACK_TOLERANCE = 1;
const phaseLabel = (id) => phaseById(id)?.label ?? String(id);

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;

const contributionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many contributions submitted. Try again in an hour." },
  keyGenerator: (req) => req.auth.wallet,
});

function rejectInvalid(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

/** Vista publica de un aporte: direccion y montos, nada mas. */
function toPublicRow(row) {
  return {
    address: row.wallet_address,
    phase: phaseLabel(row.phase_id),
    phase_id: row.phase_id,
    usdt: Number(row.usdt_amount),
    hack: Number(row.hack_amount),
    created_at: row.created_at,
  };
}

/** Vista para el propio comprador: incluye estado y comprobante. */
function toOwnRow(row) {
  return {
    ...toPublicRow(row),
    id: row.id,
    status: row.status,
    tx_hash: row.tx_hash,
    proof_uri: row.proof_uri,
    rejection_reason: row.rejection_reason,
    validated_at: row.validated_at,
  };
}

// POST /api/presale/contributions — registra un aporte propio, en 'pending'.
// Exige sesion: la wallet sale del token, nunca del body, asi nadie puede
// anotar un aporte a nombre de otra direccion.
router.post(
  "/contributions",
  authenticate,
  contributionLimiter,
  [
    body("phase_id").isInt({ min: 1, max: 3 }).toInt(),
    body("usdt_amount").isFloat({ gt: 0 }).toFloat(),
    body("hack_amount").isFloat({ gt: 0 }).toFloat(),
    // Obligatorio: la fuente de verdad son las transferencias en cadena, y una
    // captura sola no se puede verificar.
    body("tx_hash").exists({ checkFalsy: true }).withMessage("tx_hash is required")
      .bail()
      .matches(TX_HASH_REGEX).withMessage("tx_hash must be a 0x-prefixed 64-hex hash"),
    body("proof_cid").optional({ nullable: true, checkFalsy: true })
      .isString().isLength({ max: 100 }),
    body("proof_uri").optional({ nullable: true, checkFalsy: true })
      .isString().isLength({ max: 255 }),
  ],
  async (req, res) => {
    if (rejectInvalid(req, res)) return;

    const { phase_id, usdt_amount, hack_amount, tx_hash, proof_cid, proof_uri } = req.body;
    const phase = phaseById(phase_id);

    if (usdt_amount < MIN_PURCHASE_USDT) {
      return res.status(400).json({ error: `Minimum purchase is ${MIN_PURCHASE_USDT} USDT` });
    }

    // El precio es el del servidor, no el que diga el cliente. Sin tope por
    // compra: las reglas acordadas dicen "sin tope de compra por direccion";
    // lo que limita es el cupo de cada fase, que se controla al validar.
    const usdtBase = BigInt(Math.round(usdt_amount * 10 ** USDT_DECIMALS));
    const expectedHack = Number(hackFor(usdtBase, phase));
    if (Math.abs(expectedHack - hack_amount) > HACK_TOLERANCE) {
      return res.status(400).json({
        error: "hack_amount does not match usdt_amount at this phase's price",
      });
    }

    try {
      const contribution = await PresaleContribution.create({
        wallet_address: req.auth.wallet.toLowerCase(),
        // phase_id y hack_amount se reemplazan por lo acreditado al validar;
        // lo declarado queda en declared_* para auditoria.
        phase_id,
        usdt_amount,
        hack_amount: Math.floor(hack_amount),
        declared_phase_id: phase_id,
        declared_hack_amount: Math.floor(hack_amount),
        // Minusculas siempre. Postgres compara VARCHAR respetando mayusculas,
        // asi que sin esto el mismo pago entraba dos veces cambiando el casing
        // del hash, y las dos filas pasaban la verificacion en cadena porque
        // la transferencia es real y del mismo comprador.
        tx_hash: tx_hash.toLowerCase(),
        proof_cid: proof_cid || null,
        proof_uri: proof_uri || null,
        status: 'pending',
      });

      return res.status(201).json(toOwnRow(contribution));
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return res.status(409).json({ error: "That transaction hash was already registered" });
      }
      console.error("Create presale contribution error:", err);
      return res.status(500).json({ error: "Failed to register the contribution" });
    }
  }
);

// GET /api/presale/contributions/me — los aportes de la wallet de la sesion,
// en cualquier estado, para que el comprador vea si el suyo sigue pendiente.
router.get("/contributions/me", authenticate, async (req, res) => {
  try {
    const rows = await PresaleContribution.findAll({
      where: { wallet_address: req.auth.wallet.toLowerCase() },
      order: [['created_at', 'DESC']],
    });

    const validated = rows.filter((r) => r.status === 'validated');

    return res.json({
      contributions: rows.map(toOwnRow),
      totals: {
        usdt: validated.reduce((acc, r) => acc + Number(r.usdt_amount), 0),
        hack: validated.reduce((acc, r) => acc + Number(r.hack_amount), 0),
        pending_count: rows.filter((r) => r.status === 'pending').length,
      },
    });
  } catch (err) {
    console.error("Fetch own presale contributions error:", err);
    return res.status(500).json({ error: "Failed to fetch your contributions" });
  }
});

// GET /api/presale/contributors — registro publico, paginado y con buscador.
// Solo aportes validados: un 'pending' es una afirmacion sin verificar y no
// tiene por que figurar en una tabla que se presenta como transparencia.
router.get(
  "/contributors",
  [
    // Solo validan: en Express 5 el sanitizador no puede escribir en req.query
    // (ver la conversion explicita en el handler).
    query("page").optional().isInt({ min: 1 }),
    query("per_page").optional().isInt({ min: 1, max: MAX_PAGE_SIZE }),
    query("phase_id").optional().isInt({ min: 1, max: 3 }),
    query("search").optional().isString().trim().isLength({ max: 42 }),
  ],
  async (req, res) => {
    if (rejectInvalid(req, res)) return;

    // Conversion explicita, no `.toInt()` de express-validator: en Express 5
    // `req.query` es un getter de solo lectura, asi que los sanitizadores no
    // llegan a escribir nada y los valores siguen siendo strings. La
    // validacion de arriba si corre; lo que no se aplica es la conversion.
    // Sin esto la respuesta devolvia page:"2" en vez de page:2.
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.per_page) || DEFAULT_PAGE_SIZE;
    const where = { status: 'validated' };

    if (req.query.phase_id) where.phase_id = Number(req.query.phase_id);

    // Busqueda por direccion. Se escapa el comodin de LIKE para que un '%'
    // escrito en el buscador no devuelva la tabla entera.
    const search = (req.query.search || "").trim().toLowerCase();
    if (search) {
      const escaped = search.replace(/[\\%_]/g, (c) => `\\${c}`);
      where.wallet_address = { [Op.like]: `%${escaped}%` };
    }

    try {
      const { rows, count } = await PresaleContribution.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: perPage,
        offset: (page - 1) * perPage,
      });

      return res.json({
        contributors: rows.map(toPublicRow),
        page,
        per_page: perPage,
        total: count,
        total_pages: Math.max(1, Math.ceil(count / perPage)),
      });
    } catch (err) {
      console.error("Fetch presale contributors error:", err);
      return res.status(500).json({ error: "Failed to fetch contributors" });
    }
  }
);

// GET /api/presale/stats — totales del registro publico, para la cabecera.
router.get("/stats", async (req, res) => {
  try {
    const [row] = await PresaleContribution.findAll({
      where: { status: 'validated' },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.literal('DISTINCT wallet_address')), 'contributors'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('usdt_amount')), 0), 'usdt'],
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('hack_amount')), 0), 'hack'],
      ],
      raw: true,
    });

    return res.json({
      contributors: Number(row?.contributors ?? 0),
      usdt: Number(row?.usdt ?? 0),
      hack: Number(row?.hack ?? 0),
    });
  } catch (err) {
    console.error("Fetch presale stats error:", err);
    return res.status(500).json({ error: "Failed to fetch presale stats" });
  }
});

/** Precio en USDT por HACK, para mostrar (la cuenta real se hace con enteros). */
function phasePublic(p) {
  return {
    id: p.id,
    label: p.label,
    priceUsdt: (Number(p.priceBase) / 10 ** USDT_DECIMALS).toString(),
    capHack: p.capHack.toString(),
    start: p.start.toISOString(),
    end: p.end.toISOString(),
  };
}

// GET /api/presale/config — publico. Regla 14: "publica la direccion donde se
// paga, la moneda aceptada, el minimo y los datos de las fases". La pagina
// muestra la direccion de pago DESDE ACA, no desde una constante del front:
// asi hay un solo lugar donde esta escrita. Si todavia no esta definida, sale
// null y la pagina no muestra ninguna (mejor nada que una equivocada).
router.get("/config", (req, res) => {
  const { networks } = getNetworks();
  const pago = networks.find((n) => n.role === "payment");
  const token = networks.find((n) => n.role === "token");
  return res.json({
    payment: {
      network: pago.network,
      chainId: pago.chainId,
      explorer: pago.explorer,
      treasury: pago.treasury,
      token: pago.token,
    },
    token: {
      network: token.network,
      chainId: token.chainId,
      explorer: token.explorer,
      presaleContract: token.presaleContract,
    },
    minPurchaseUsdt: MIN_PURCHASE_USDT,
    phases: loadPhases().map(phasePublic),
  });
});

module.exports = router;
