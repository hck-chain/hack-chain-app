// Contrato HTTP del panel de admin de la preventa: quien puede entrar, que
// validar exija la transferencia real en cadena, que lo revisado quede
// auditado, y que la exportacion produzca exactamente lo que espera
// contracts/script/cargar-lote.sh, con un hash reproducible.
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");
const { Interface, keccak256, toUtf8Bytes } = require("ethers");

jest.setTimeout(20000);

jest.mock("express-rate-limit", () => {
  const passthrough = () => (req, res, next) => next();
  passthrough.rateLimit = passthrough;
  passthrough.ipKeyGenerator = () => "ip";
  return passthrough;
});
jest.mock("../lib/rateLimitStore", () => () => undefined);
jest.mock("../services/emailService", () => ({}));

const ADMIN = "0x" + "ad".repeat(20);
const NOT_ADMIN = "0x" + "99".repeat(20);
const TREASURY = "0x" + "77".repeat(20);
const USDT = "0x" + "5d".repeat(20);
const BUYER_A = "0x" + "aa".repeat(20);
const BUYER_B = "0x" + "bb".repeat(20);
const THIEF = "0x" + "cc".repeat(20);

// Polygon simulado: tx_hash -> recibo. Lo que no esta, no existe en cadena.
const mockChain = new Map();
let mockChainDown = false;
jest.mock("../harjoot/adapters/polygonProvider", () => ({
  createPolygonProvider: () => ({
    getTransactionReceipt: async (tx) => {
      if (mockChainDown) throw new Error("RPC timeout");
      return mockChain.get(tx.toLowerCase()) || null;
    },
  }),
}));

const iface = new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
function pagar(tx, { from, to = TREASURY, usdt }) {
  const e = iface.encodeEventLog("Transfer", [from, to, BigInt(Math.round(usdt * 1e6))]);
  mockChain.set(tx, { status: 1, logs: [{ address: USDT, topics: e.topics, data: e.data }] });
}
const tx = (n) => "0x" + n.toString(16).padStart(64, "0");

describe("Panel de admin de preventa", () => {
  let sequelize, PresaleContribution, app;

  beforeAll(async () => {
    process.env.ADMIN_WALLETS = ADMIN;
    process.env.PRESALE_TREASURY_ADDRESS = TREASURY;
    process.env.USDT_CONTRACT_ADDRESS = USDT;

    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    PresaleContribution = require("../models/presaleContributions")(sequelize, SequelizePkg.DataTypes);
    const modelsMock = { PresaleContribution, sequelize, Sequelize: SequelizePkg };
    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = { wallet: req.headers["x-test-wallet"] || ADMIN, sub: 1 };
          next();
        },
      }));
      require("../middleware/requireAdmin").__resetCache();
      const adminRoute = require("../routes/admin");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/admin", adminRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    mockChain.clear();
    mockChainDown = false;
    process.env.PRESALE_TREASURY_ADDRESS = TREASURY;
  });

  const aporte = (over = {}) =>
    PresaleContribution.create({
      wallet_address: BUYER_A, phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000,
      tx_hash: tx(1), status: "pending", ...over,
    });

  describe("acceso", () => {
    test.each([
      ["get", "/api/admin/presale/contributions"],
      ["get", "/api/admin/presale/contributions/1/verification"],
      ["post", "/api/admin/presale/contributions/1/validate"],
      ["post", "/api/admin/presale/contributions/1/reject"],
      ["get", "/api/admin/presale/export"],
      ["get", "/api/admin/presale/contract-status"],
    ])("%s %s: 403 para quien no esta en ADMIN_WALLETS", async (method, url) => {
      const res = await request(app)[method](url).set("x-test-wallet", NOT_ADMIN).send({ reason: "xxx" });
      expect(res.status).toBe(403);
    });
  });

  describe("cola", () => {
    test("lista con contadores por estado y los pendientes del mas viejo al mas nuevo", async () => {
      await aporte({ tx_hash: tx(1), created_at: new Date("2026-12-09") });
      await aporte({ tx_hash: tx(2), created_at: new Date("2026-12-08") });
      await aporte({ tx_hash: tx(3), status: "validated" });

      const res = await request(app).get("/api/admin/presale/contributions?status=pending");

      expect(res.status).toBe(200);
      expect(res.body.counts).toEqual({ pending: 2, validated: 1, rejected: 0 });
      expect(res.body.contributions.map((c) => c.tx_hash)).toEqual([tx(2), tx(1)]);
      expect(typeof res.body.page).toBe("number");
    });

    test("busca por hash", async () => {
      await aporte({ tx_hash: tx(1) });
      await aporte({ tx_hash: tx(0xbeef) });
      const res = await request(app).get("/api/admin/presale/contributions?search=beef");
      expect(res.body.total).toBe(1);
    });
  });

  describe("verificacion de solo lectura", () => {
    test("muestra el resultado sin cambiar el estado", async () => {
      const c = await aporte();
      pagar(tx(1), { from: BUYER_A, usdt: 30 });

      const res = await request(app).get(`/api/admin/presale/contributions/${c.id}/verification`);

      expect(res.status).toBe(200);
      expect(res.body.verification.ok).toBe(true);
      expect((await c.reload()).status).toBe("pending");
    });
  });

  describe("validar", () => {
    test("con pago real: valida y deja auditado quien, cuando y cuanto se movio", async () => {
      const c = await aporte();
      pagar(tx(1), { from: BUYER_A, usdt: 35 });

      const res = await request(app).post(`/api/admin/presale/contributions/${c.id}/validate`);

      expect(res.status).toBe(200);
      await c.reload();
      expect(c.status).toBe("validated");
      expect(c.reviewed_by).toBe(ADMIN);
      expect(c.reviewed_at).toBeTruthy();
      expect(c.validated_at).toBeTruthy();
      expect(Number(c.onchain_amount_usdt)).toBe(35);
    });

    test("hash ajeno (el pago salio de otra wallet): 422 y sigue pendiente", async () => {
      const c = await aporte({ wallet_address: THIEF });
      pagar(tx(1), { from: BUYER_A, usdt: 30 });

      const res = await request(app).post(`/api/admin/presale/contributions/${c.id}/validate`);

      expect(res.status).toBe(422);
      expect(res.body.error).toBe("VERIFICATION_FAILED");
      expect(res.body.verification.reason).toBe("WRONG_SENDER");
      expect((await c.reload()).status).toBe("pending");
    });

    test("tx inexistente: 422", async () => {
      const c = await aporte();
      const res = await request(app).post(`/api/admin/presale/contributions/${c.id}/validate`);
      expect(res.status).toBe(422);
      expect(res.body.verification.reason).toBe("TX_NOT_FOUND");
    });

    test("RPC caido: 503 para reintentar, no 422, y sigue pendiente", async () => {
      const c = await aporte();
      mockChainDown = true;
      const res = await request(app).post(`/api/admin/presale/contributions/${c.id}/validate`);
      expect(res.status).toBe(503);
      expect(res.body.error).toBe("CHAIN_UNAVAILABLE");
      expect((await c.reload()).status).toBe("pending");
    });

    test("sin tesoreria configurada: 503 y no valida nada (falla cerrado)", async () => {
      const c = await aporte();
      pagar(tx(1), { from: BUYER_A, usdt: 30 });
      delete process.env.PRESALE_TREASURY_ADDRESS;

      const res = await request(app).post(`/api/admin/presale/contributions/${c.id}/validate`);

      expect(res.status).toBe(503);
      expect(res.body.error).toBe("PRESALE_NOT_CONFIGURED");
      expect((await c.reload()).status).toBe("pending");
    });

    test("ya validado: 409", async () => {
      const c = await aporte({ status: "validated" });
      const res = await request(app).post(`/api/admin/presale/contributions/${c.id}/validate`);
      expect(res.status).toBe(409);
      expect(res.body.currentStatus).toBe("validated");
    });

    test("dos validaciones simultaneas: una gana, la otra recibe 409", async () => {
      const c = await aporte();
      pagar(tx(1), { from: BUYER_A, usdt: 30 });

      const [r1, r2] = await Promise.all([
        request(app).post(`/api/admin/presale/contributions/${c.id}/validate`),
        request(app).post(`/api/admin/presale/contributions/${c.id}/validate`),
      ]);

      expect([r1.status, r2.status].sort()).toEqual([200, 409]);
    });

    test("404 si no existe", async () => {
      const res = await request(app).post("/api/admin/presale/contributions/999/validate");
      expect(res.status).toBe(404);
    });
  });

  describe("rechazar", () => {
    test("exige motivo", async () => {
      const c = await aporte();
      const res = await request(app).post(`/api/admin/presale/contributions/${c.id}/reject`).send({});
      expect(res.status).toBe(422);
      expect((await c.reload()).status).toBe("pending");
    });

    test("rechaza con motivo y deja auditado quien", async () => {
      const c = await aporte();
      const res = await request(app)
        .post(`/api/admin/presale/contributions/${c.id}/reject`)
        .send({ reason: "  La transferencia es de otra fase.  " });

      expect(res.status).toBe(200);
      await c.reload();
      expect(c.status).toBe("rejected");
      expect(c.rejection_reason).toBe("La transferencia es de otra fase.");
      expect(c.reviewed_by).toBe(ADMIN);
    });

    test("no se puede rechazar algo ya validado (puede estar en un lote exportado)", async () => {
      const c = await aporte({ status: "validated" });
      const res = await request(app)
        .post(`/api/admin/presale/contributions/${c.id}/reject`)
        .send({ reason: "cambio de opinion" });
      expect(res.status).toBe(409);
      expect((await c.reload()).status).toBe("validated");
    });
  });

  describe("estado del contrato", () => {
    test("sin PRESALE_CONTRACT_ADDRESS: configured false, no es un error", async () => {
      delete process.env.PRESALE_CONTRACT_ADDRESS;
      const res = await request(app).get("/api/admin/presale/contract-status");
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(false);
      expect(res.body.detail).toMatch(/no se desplego/);
    });

    test("RPC inalcanzable: 503", async () => {
      process.env.PRESALE_CONTRACT_ADDRESS = "0x" + "c0".repeat(20);
      process.env.PRESALE_RPC_URL = "http://127.0.0.1:1"; // nada escucha ahi
      const res = await request(app).get("/api/admin/presale/contract-status");
      expect(res.status).toBe(503);
      expect(res.body.error).toBe("CHAIN_UNAVAILABLE");
      delete process.env.PRESALE_CONTRACT_ADDRESS;
      delete process.env.PRESALE_RPC_URL;
    });
  });

  describe("exportacion del lote", () => {
    const FORMATO_CARGAR_LOTE = /^0x[0-9a-f]{40},[0-9]+$/;

    test("suma por wallet, ordena, pasa a wei y firma con keccak256 del archivo", async () => {
      // BUYER_B antes que BUYER_A en la base, para probar que el orden es por direccion.
      await aporte({ wallet_address: BUYER_B, tx_hash: tx(1), hack_amount: 500_000, status: "validated" });
      await aporte({ wallet_address: BUYER_A, tx_hash: tx(2), hack_amount: 1_000_000, status: "validated" });
      await aporte({ wallet_address: BUYER_A, tx_hash: tx(3), hack_amount: 250_000, status: "validated" });
      await aporte({ wallet_address: THIEF, tx_hash: tx(4), status: "rejected" }); // no entra
      pagar(tx(1), { from: BUYER_B, usdt: 30 });
      pagar(tx(2), { from: BUYER_A, usdt: 30 });
      pagar(tx(3), { from: BUYER_A, usdt: 30 });

      const res = await request(app).get("/api/admin/presale/export");

      expect(res.status).toBe(200);
      const lineas = res.body.csv.trimEnd().split("\n");
      expect(lineas).toEqual([
        `${BUYER_A},${1_250_000n * 10n ** 18n}`,
        `${BUYER_B},${500_000n * 10n ** 18n}`,
      ]);
      // Exactamente el formato que valida cargar-lote.sh
      expect(lineas.every((l) => FORMATO_CARGAR_LOTE.test(l))).toBe(true);
      expect(res.body.csv.endsWith("\n")).toBe(true);
      expect(res.body.hash).toBe(keccak256(toUtf8Bytes(res.body.csv)));
      expect(res.body.totals).toMatchObject({ wallets: 2, contributions: 3, hack: "1750000" });
    });

    test("exportar dos veces los mismos datos da el mismo hash", async () => {
      await aporte({ wallet_address: BUYER_B, tx_hash: tx(1), status: "validated" });
      await aporte({ wallet_address: BUYER_A, tx_hash: tx(2), status: "validated" });
      pagar(tx(1), { from: BUYER_B, usdt: 30 });
      pagar(tx(2), { from: BUYER_A, usdt: 30 });

      const a = await request(app).get("/api/admin/presale/export");
      const b = await request(app).get("/api/admin/presale/export");
      expect(a.body.hash).toBe(b.body.hash);
    });

    test("si una fila validada ya no se sostiene en cadena, no exporta nada", async () => {
      // Simula una fila metida en la base sin pago real detras (admin
      // comprometido o error): la segunda revision la tiene que atrapar.
      await aporte({ wallet_address: BUYER_A, tx_hash: tx(1), status: "validated" });
      await aporte({ wallet_address: THIEF, tx_hash: tx(2), status: "validated" });
      pagar(tx(1), { from: BUYER_A, usdt: 30 });

      const res = await request(app).get("/api/admin/presale/export");

      expect(res.status).toBe(422);
      expect(res.body.csv).toBeUndefined();
      expect(res.body.problems).toEqual([
        expect.objectContaining({ wallet_address: THIEF, reason: "TX_NOT_FOUND" }),
      ]);
    });

    test("RPC caido: 503, no acusa a ningun aporte", async () => {
      await aporte({ status: "validated" });
      mockChainDown = true;
      const res = await request(app).get("/api/admin/presale/export");
      expect(res.status).toBe(503);
      expect(res.body.error).toBe("CHAIN_UNAVAILABLE");
    });

    test("con un solo pendiente no exporta, y ni siquiera consulta la cadena", async () => {
      // Despues de finalizePresale el contrato rechaza asignaciones nuevas: un
      // pendiente que quedo afuera del lote final se queda sin tokens.
      await aporte({ wallet_address: BUYER_A, tx_hash: tx(1), status: "validated" });
      await aporte({ wallet_address: BUYER_B, tx_hash: tx(2), status: "pending" });
      pagar(tx(1), { from: BUYER_A, usdt: 30 });
      mockChainDown = true; // si consultara la cadena, daria 503 y no 409

      const res = await request(app).get("/api/admin/presale/export");

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("PENDING_CONTRIBUTIONS");
      expect(res.body.pending).toBe(1);
      expect(res.body.csv).toBeUndefined();
    });

    test("parte en tandas que concatenadas dan el archivo completo", async () => {
      const { exportAllocationBatch } = require("../usecases/presale/exportAllocationBatch");
      const provider = require("../harjoot/adapters/polygonProvider").createPolygonProvider();
      const wallets = [BUYER_B, BUYER_A, THIEF, "0x" + "dd".repeat(20), "0x" + "ee".repeat(20)];
      for (const [i, w] of wallets.entries()) {
        await aporte({ wallet_address: w, tx_hash: tx(i + 1), status: "validated" });
        pagar(tx(i + 1), { from: w, usdt: 30 });
      }

      const r = await exportAllocationBatch({ models: { PresaleContribution, Sequelize: SequelizePkg }, provider, batchSize: 2 });

      expect(r.ok).toBe(true);
      expect(r.batches.map((b) => b.wallets)).toEqual([2, 2, 1]);
      expect(r.batches.map((b) => b.index)).toEqual([1, 2, 3]);
      expect(r.batches.map((b) => b.csv).join("")).toBe(r.csv);
      for (const b of r.batches) {
        expect(b.csv.trimEnd().split("\n").every((l) => /^0x[0-9a-f]{40},[0-9]+$/.test(l))).toBe(true);
      }
    });

    test("por defecto las tandas son de 200 filas", async () => {
      await aporte({ wallet_address: BUYER_A, tx_hash: tx(1), status: "validated" });
      pagar(tx(1), { from: BUYER_A, usdt: 30 });
      const res = await request(app).get("/api/admin/presale/export");
      expect(res.body.batchSize).toBe(200);
      expect(res.body.batches).toHaveLength(1);
      expect(res.body.batches[0].csv).toBe(res.body.csv);
    });

    test("sin validados: 404", async () => {
      await aporte({ status: "rejected" });
      const res = await request(app).get("/api/admin/presale/export");
      expect(res.status).toBe(404);
    });
  });
});
