// Contrato HTTP del modulo de preventa: que el precio no se pueda falsear
// desde el cliente, que un aporte sin comprobante no entre, que el registro
// publico solo muestre lo validado, y que el buscador y el paginado hagan lo
// que dicen.
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const SequelizePkg = require("sequelize");

jest.setTimeout(20000);

jest.mock("express-rate-limit", () => () => (req, res, next) => next());

describe("Presale routes", () => {
  let sequelize;
  let PresaleContribution;
  let app;

  const BUYER = "0x" + "aa".repeat(20);
  const OTHER = "0x" + "bb".repeat(20);
  const txHash = (n) => "0x" + String(n).padStart(2, "0").repeat(32);

  // Fase 1: $0.00003 por HACK. 30 USDT -> 1.000.000 HACK.
  const VALID = { phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000, tx_hash: txHash(1) };

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });

    const { DataTypes } = SequelizePkg;
    PresaleContribution = require("../models/presaleContributions")(sequelize, DataTypes);

    const modelsMock = { PresaleContribution, sequelize, Sequelize: SequelizePkg };
    await sequelize.sync({ force: true });

    jest.isolateModules(() => {
      jest.doMock("../models", () => modelsMock);
      jest.doMock("../middleware/auth", () => ({
        authenticate: (req, res, next) => {
          req.auth = { wallet: req.headers["x-test-wallet"] || BUYER };
          next();
        },
      }));

      const presaleRoute = require("../routes/presale");
      app = express();
      app.use(bodyParser.json());
      app.use("/api/presale", presaleRoute);
    });
  });

  afterAll(async () => {
    jest.resetModules();
    if (sequelize) await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe("POST /api/presale/contributions", () => {
    test("201 y queda en 'pending'", async () => {
      const res = await request(app).post("/api/presale/contributions").send(VALID);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("pending");
      expect(res.body.hack).toBe(1_000_000);
      expect(res.body.phase).toBe("Primera");
    });

    test("la wallet sale del token, no del body", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .set("x-test-wallet", OTHER)
        .send({ ...VALID, wallet_address: BUYER });

      expect(res.status).toBe(201);
      const row = await PresaleContribution.findByPk(res.body.id);
      expect(row.wallet_address).toBe(OTHER.toLowerCase());
    });

    test("400 si el hack_amount no corresponde al precio de la fase", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ ...VALID, hack_amount: 50_000_000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/does not match/i);
    });

    test("400 sin hash de transaccion", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000 });

      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.path === "tx_hash")).toBe(true);
    });

    test("400 con solo la captura: sin hash no hay forma de verificar en cadena", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000, proof_cid: "bafy123" });

      expect(res.status).toBe(400);
    });

    test("la captura es opcional cuando hay hash", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ ...VALID });

      expect(res.status).toBe(201);
      expect(res.body.proof_uri).toBeNull();
    });

    test("guarda el hash en minusculas", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ ...VALID, tx_hash: "0x" + "AB".repeat(32) });

      expect(res.status).toBe(201);
      expect(res.body.tx_hash).toBe("0x" + "ab".repeat(32));
    });

    test("409 si el mismo pago se registra con otro casing del hash", async () => {
      // Sin normalizar, UNIQUE dejaba pasar las dos variantes y el mismo pago
      // real terminaba asignando HACK dos veces.
      await request(app).post("/api/presale/contributions").send({ ...VALID, tx_hash: "0x" + "ab".repeat(32) });
      const res = await request(app).post("/api/presale/contributions").send({ ...VALID, tx_hash: "0x" + "AB".repeat(32) });

      expect(res.status).toBe(409);
    });

    test("400 por debajo del minimo de 1 USDT", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ ...VALID, usdt_amount: 0.5, hack_amount: 16_666 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/minimum/i);
    });

    test("sin tope por compra: las reglas dicen 'sin tope de compra por direccion'", async () => {
      // Antes se rechazaba por encima de 5.000.000 HACK en la fase 1. Lo que
      // limita es el cupo de la fase, y eso se controla al validar.
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ phase_id: 1, usdt_amount: 180, hack_amount: 6_000_000, tx_hash: txHash(2) });

      expect(res.status).toBe(201);
    });

    test("guarda lo declarado aparte: lo acreditado se decide al validar", async () => {
      const res = await request(app).post("/api/presale/contributions").send(VALID);
      const row = await PresaleContribution.findByPk(res.body.id);
      expect(row.declared_phase_id).toBe(1);
      expect(String(row.declared_hack_amount)).toBe("1000000");
    });

    test("409 si el mismo hash se registra dos veces", async () => {
      await request(app).post("/api/presale/contributions").send(VALID);
      const res = await request(app).post("/api/presale/contributions").send(VALID);

      expect(res.status).toBe(409);
    });

    test("400 con fase inexistente", async () => {
      const res = await request(app)
        .post("/api/presale/contributions")
        .send({ ...VALID, phase_id: 9 });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/presale/contributions/me", () => {
    test("devuelve solo los aportes propios y suma unicamente los validados", async () => {
      await PresaleContribution.create({ wallet_address: BUYER.toLowerCase(), phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000, status: "validated", tx_hash: txHash(1) });
      await PresaleContribution.create({ wallet_address: BUYER.toLowerCase(), phase_id: 2, usdt_amount: 50, hack_amount: 1_000_000, status: "pending", tx_hash: txHash(2) });
      await PresaleContribution.create({ wallet_address: OTHER.toLowerCase(), phase_id: 1, usdt_amount: 90, hack_amount: 3_000_000, status: "validated", tx_hash: txHash(3) });

      const res = await request(app).get("/api/presale/contributions/me");

      expect(res.status).toBe(200);
      expect(res.body.contributions).toHaveLength(2);
      expect(res.body.totals.usdt).toBe(30);
      expect(res.body.totals.hack).toBe(1_000_000);
      expect(res.body.totals.pending_count).toBe(1);
    });
  });

  describe("GET /api/presale/contributors", () => {
    beforeEach(async () => {
      for (let i = 0; i < 12; i++) {
        await PresaleContribution.create({
          wallet_address: "0x" + String(i).padStart(2, "0").repeat(20),
          phase_id: (i % 3) + 1,
          usdt_amount: 30,
          hack_amount: 1_000_000,
          status: "validated",
          tx_hash: txHash(i),
        });
      }
      await PresaleContribution.create({
        wallet_address: OTHER.toLowerCase(), phase_id: 1, usdt_amount: 30,
        hack_amount: 1_000_000, status: "pending", tx_hash: txHash(90),
      });
    });

    test("oculta los aportes que todavia no fueron validados", async () => {
      const res = await request(app).get("/api/presale/contributors?per_page=50");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(12);
      expect(res.body.contributors.some((c) => c.address === OTHER.toLowerCase())).toBe(false);
    });

    test("pagina", async () => {
      const first = await request(app).get("/api/presale/contributors?page=1&per_page=10");
      const second = await request(app).get("/api/presale/contributors?page=2&per_page=10");

      expect(first.body.contributors).toHaveLength(10);
      expect(first.body.total_pages).toBe(2);
      expect(second.body.contributors).toHaveLength(2);
      expect(first.body.contributors[0].address).not.toBe(second.body.contributors[0].address);
    });

    test("busca por fragmento de direccion", async () => {
      const res = await request(app).get("/api/presale/contributors?search=050505");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.contributors[0].address).toContain("0505");
    });

    test("un comodin de LIKE en el buscador no devuelve la tabla entera", async () => {
      const res = await request(app).get("/api/presale/contributors?search=%25");

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });

    test("filtra por fase", async () => {
      const res = await request(app).get("/api/presale/contributors?phase_id=1&per_page=50");

      expect(res.status).toBe(200);
      expect(res.body.contributors.every((c) => c.phase_id === 1)).toBe(true);
      expect(res.body.total).toBe(4);
    });

    test("devuelve page y per_page como números, no como strings", async () => {
      // En Express 5 `req.query` es de solo lectura y el sanitizador .toInt()
      // de express-validator no llega a aplicarse: la respuesta salia con
      // page:"2". El paginado seguia funcionando por coercion de JS, pero el
      // contrato de la API mentia sobre los tipos.
      const res = await request(app).get("/api/presale/contributors?page=2&per_page=5");

      expect(typeof res.body.page).toBe("number");
      expect(typeof res.body.per_page).toBe("number");
      expect(res.body.page).toBe(2);
      expect(res.body.per_page).toBe(5);
    });

    test("el filtro por fase funciona aunque llegue como string en la query", async () => {
      const res = await request(app).get("/api/presale/contributors?phase_id=2&per_page=50");

      expect(res.status).toBe(200);
      expect(res.body.contributors.length).toBeGreaterThan(0);
      expect(res.body.contributors.every((c) => c.phase_id === 2)).toBe(true);
    });

    test("no filtra con un per_page fuera de rango", async () => {
      const res = await request(app).get("/api/presale/contributors?per_page=5000");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/presale/config", () => {
    test("publica red de pago, token, tesoreria, minimo y fases (regla 14)", async () => {
      process.env.PRESALE_TREASURY_ADDRESS = "0x" + "77".repeat(20);
      const res = await request(app).get("/api/presale/config");
      delete process.env.PRESALE_TREASURY_ADDRESS;

      expect(res.status).toBe(200);
      expect(res.body.payment).toMatchObject({ network: "Ethereum", chainId: 1, treasury: "0x" + "77".repeat(20) });
      expect(res.body.payment.token.symbol).toBe("USDT");
      expect(res.body.token).toMatchObject({ network: "Polygon", chainId: 137 });
      expect(res.body.minPurchaseUsdt).toBe(1);
      expect(res.body.phases.map((p) => p.priceUsdt)).toEqual(["0.00003", "0.00005", "0.00008"]);
    });

    test("sin tesoreria definida publica null: mejor ninguna direccion que una equivocada", async () => {
      const res = await request(app).get("/api/presale/config");
      expect(res.body.payment.treasury).toBeNull();
    });
  });

  describe("GET /api/presale/stats", () => {
    test("cuenta direcciones distintas y suma solo lo validado", async () => {
      await PresaleContribution.create({ wallet_address: BUYER.toLowerCase(), phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000, status: "validated", tx_hash: txHash(1) });
      await PresaleContribution.create({ wallet_address: BUYER.toLowerCase(), phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000, status: "validated", tx_hash: txHash(2) });
      await PresaleContribution.create({ wallet_address: OTHER.toLowerCase(), phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000, status: "pending", tx_hash: txHash(3) });

      const res = await request(app).get("/api/presale/stats");

      expect(res.status).toBe(200);
      expect(res.body.contributors).toBe(1);
      expect(res.body.usdt).toBe(60);
      expect(res.body.hack).toBe(2_000_000);
    });
  });
});
