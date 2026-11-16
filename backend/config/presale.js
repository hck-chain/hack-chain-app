// backend/config/presale.js
//
// Configuracion de la preventa. UN SOLO LUGAR para saber donde esta cada
// cosa: donde paga el comprador (tesoreria), con que token, donde vive HACK
// y el contrato de la preventa, y las fases. Es la AUTORIDAD: con estos datos
// se decide en que fase cae un pago y cuantos HACK se acreditan, y el backend
// los publica para que la pagina muestre la direccion de pago desde aca
// (GET /api/presale/config).
//
// Por que en el codigo y no en variables de entorno: una direccion de cobro
// equivocada es dinero perdido. En el codigo, cada cambio pasa por un PR y lo
// revisa mas de una persona (regla 33: "con revision de mas de una persona").
// Las variables de entorno solo SOBRESCRIBEN para pruebas locales, y el panel
// de admin avisa cuando eso pasa.
//
// Arquitectura de redes (decision del equipo):
//   - el comprador paga USDT en ETHEREUM, a la tesoreria (multifirma)
//   - el token HACK y PresaleAllocation viven en POLYGON

class PresaleConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "PresaleConfigError";
  }
}

// ---------------------------------------------------------------------------
// Donde queda cada cosa. null = todavia no definido (decision pendiente).
// ---------------------------------------------------------------------------
const PRESALE_NETWORKS = [
  {
    role: "payment",
    description: "Donde el comprador manda el USDT",
    network: "Ethereum",
    chainId: 1,
    explorer: "https://etherscan.io",
    // Multifirma de HackChain en Ethereum que recibe los pagos.
    // PENDIENTE: la define el encargado (decision "Direcciones de las multifirmas").
    treasury: null,
    token: {
      symbol: "USDT",
      // USDT oficial de Tether en Ethereum (regla 33: verificarlo con mas de una persona).
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
    },
    rpcEnv: "PRESALE_PAYMENT_RPC_URL",
  },
  {
    role: "token",
    description: "Donde vive HACK y se reparten los tokens",
    network: "Polygon",
    chainId: 137,
    explorer: "https://polygonscan.com",
    // Safe que administra el contrato (ADMIN_ROLE). PENDIENTE.
    multisig: null,
    // PresaleAllocation desplegado. PENDIENTE hasta el despliegue.
    presaleContract: null,
    rpcEnv: "PRESALE_RPC_URL (o POLYGON_RPC_URL)",
  },
];

// Sobrescrituras para pruebas locales: campo -> variable de entorno.
const ENV_OVERRIDES = [
  { role: "payment", field: "treasury", env: "PRESALE_TREASURY_ADDRESS" },
  { role: "payment", field: "token.address", env: "PRESALE_USDT_ADDRESS" },
  { role: "token", field: "presaleContract", env: "PRESALE_CONTRACT_ADDRESS" },
];

function getField(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setField(obj, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

/**
 * Redes efectivas: las del archivo, con las sobrescrituras del entorno
 * aplicadas. `overrides` dice que se sobrescribio, para mostrarlo en el panel.
 */
function getNetworks() {
  const networks = JSON.parse(JSON.stringify(PRESALE_NETWORKS));
  const overrides = [];
  for (const o of ENV_OVERRIDES) {
    const value = process.env[o.env];
    if (!value) continue;
    const net = networks.find((n) => n.role === o.role);
    overrides.push({ role: o.role, field: o.field, env: o.env, fileValue: getField(net, o.field), value });
    setField(net, o.field, value);
  }
  return { networks, overrides };
}

const networkFor = (role) => getNetworks().networks.find((n) => n.role === role);

// USDT tiene 6 decimales en Ethereum. Los precios se guardan en unidades
// base de USDT por HACK para calcular con enteros, sin coma flotante:
// 0.00003 USDT = 30 unidades base.
const USDT_DECIMALS = 6;

// Reglas acordadas: precio y cupo por fase. Las fechas son PROVISIONALES
// (decision pendiente del encargado) y se pueden sobrescribir con
// PRESALE_PHASES (JSON) sin tocar codigo.
const DEFAULT_PHASES = [
  { id: 1, label: "Primera", priceBase: "30", capHack: "20000000", start: "2026-12-08T00:00:00Z", end: "2026-12-14T23:59:59Z" },
  { id: 2, label: "Segunda", priceBase: "50", capHack: "30000000", start: "2026-12-15T00:00:00Z", end: "2026-12-21T23:59:59Z" },
  { id: 3, label: "Tercera", priceBase: "80", capHack: "50000000", start: "2026-12-22T00:00:00Z", end: "2026-12-28T23:59:59Z" },
];

// Reglas: un pago menor a 1 USD no se acredita.
const MIN_PURCHASE_BASE = 1_000_000n; // 1 USDT

function normalizePhase(p) {
  return {
    id: Number(p.id),
    label: String(p.label),
    priceBase: BigInt(p.priceBase),
    capHack: BigInt(p.capHack),
    start: new Date(p.start),
    end: new Date(p.end),
  };
}

function loadPhases() {
  const raw = process.env.PRESALE_PHASES;
  const list = raw ? JSON.parse(raw) : DEFAULT_PHASES;
  return list.map(normalizePhase);
}

/** Fase abierta en el instante `when`, o null si ninguna lo estaba. */
function phaseAt(when, phases = loadPhases()) {
  const t = when.getTime();
  return phases.find((p) => t >= p.start.getTime() && t <= p.end.getTime()) || null;
}

function phaseById(id, phases = loadPhases()) {
  return phases.find((p) => p.id === Number(id)) || null;
}

/** HACK enteros que compra `amountBase` de USDT a la fase dada. Siempre hacia abajo. */
function hackFor(amountBase, phase) {
  return BigInt(amountBase) / phase.priceBase;
}

module.exports = {
  PRESALE_NETWORKS,
  getNetworks,
  networkFor,
  PresaleConfigError,
  USDT_DECIMALS,
  MIN_PURCHASE_BASE,
  DEFAULT_PHASES,
  loadPhases,
  phaseAt,
  phaseById,
  hackFor,
};
