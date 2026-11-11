// Verifica el seed de preventa contra una base real (sqlite en memoria):
// que cree las dos filas que el login necesita, que deje los cuatro estados
// sobre la wallet pedida, y que correrlo dos veces no duplique nada.
const SequelizePkg = require("sequelize");
const { seedPresale, SEED_TX_PREFIX, hackFor } = require("../scripts/seed-presale");

jest.setTimeout(20000);

describe("seed-presale", () => {
  let sequelize, db;
  const WALLET = "0x" + "aa".repeat(20);

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    db = {
      User: require("../models/users")(sequelize, DataTypes),
      Student: require("../models/students")(sequelize, DataTypes),
      PresaleContribution: require("../models/presaleContributions")(sequelize, DataTypes),
      Sequelize: SequelizePkg,
    };
    await sequelize.sync({ force: true });
  });

  afterAll(async () => { if (sequelize) await sequelize.close(); });

  beforeEach(async () => { await sequelize.sync({ force: true }); });

  test("crea las filas de users Y de students que el login necesita", async () => {
    const r = await seedPresale(db, WALLET);

    expect(r.createdUser).toBe(true);
    expect(r.createdStudent).toBe(true);

    const user = await db.User.findOne({ where: { wallet_address: WALLET } });
    expect(user.role).toBe("student");
    // Sin nonce no se puede pedir el desafío de firma.
    expect(user.nonce).toMatch(/^[a-f0-9]{32}$/);

    const student = await db.Student.findOne({ where: { wallet_address: WALLET } });
    expect(student).not.toBeNull();
  });

  test("deja los cuatro estados sobre la wallet pedida", async () => {
    await seedPresale(db, WALLET);

    const own = await db.PresaleContribution.findAll({ where: { wallet_address: WALLET } });
    const porEstado = own.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

    expect(porEstado).toEqual({ validated: 2, pending: 1, rejected: 1 });
    expect(own.find((r) => r.status === "rejected").rejection_reason).toBeTruthy();
    expect(own.every((r) => r.proof_uri.startsWith("ipfs://"))).toBe(true);
  });

  test("siembra contribuidores suficientes para paginar y buscar", async () => {
    await seedPresale(db, WALLET);

    const validados = await db.PresaleContribution.findAll({ where: { status: "validated" } });
    const direcciones = new Set(validados.map((r) => r.wallet_address));

    // 24 de relleno + la propia wallet
    expect(direcciones.size).toBe(25);
    expect(validados.length).toBeGreaterThan(10); // hay mas de una pagina
  });

  test("los montos de HACK corresponden al precio de cada fase", async () => {
    await seedPresale(db, WALLET);

    const rows = await db.PresaleContribution.findAll();
    for (const r of rows) {
      expect(Number(r.hack_amount)).toBe(hackFor(Number(r.usdt_amount), r.phase_id));
    }
  });

  test("correrlo dos veces no duplica nada", async () => {
    await seedPresale(db, WALLET);
    const primera = await db.PresaleContribution.count();

    const r2 = await seedPresale(db, WALLET);

    expect(r2.createdUser).toBe(false);
    expect(r2.removed).toBe(primera);
    expect(await db.PresaleContribution.count()).toBe(primera);
  });

  test("no borra aportes reales, solo los sembrados", async () => {
    await db.PresaleContribution.create({
      wallet_address: "0x" + "cc".repeat(20),
      phase_id: 1, usdt_amount: 99, hack_amount: 3_300_000,
      status: "validated", tx_hash: "0x" + "dd".repeat(32),
    });

    await seedPresale(db, WALLET);

    const real = await db.PresaleContribution.findOne({
      where: { wallet_address: "0x" + "cc".repeat(20) },
    });
    expect(real).not.toBeNull();

    const sembrados = await db.PresaleContribution.findAll();
    expect(sembrados.filter((r) => !r.tx_hash.startsWith(SEED_TX_PREFIX))).toHaveLength(1);
  });
});
