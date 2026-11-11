// Estado del contrato contra el lote, con un PresaleAllocation simulado que
// se comporta como el real: allocate SUMA, por eso la doble carga se nota.
const SequelizePkg = require("sequelize");
const { keccak256, toUtf8Bytes } = require("ethers");
const { getContractStatus, walletState, batchState } = require("../contractStatus");
const { buildBatch } = require("../exportAllocationBatch");

const E18 = 10n ** 18n;
const ADDR = (n) => "0x" + n.toString(16).padStart(40, "0");
const CONTRACT = ADDR(0xc0);
const ZERO = "0x" + "0".repeat(64);

/** Contrato falso con la misma interfaz que el lector real. */
function fakeContract({ cap = 100_000_000n * E18, balance = 100_000_000n * E18 } = {}) {
  const st = {
    allocations: new Map(),
    totalAllocated: 0n, totalClaimed: 0n, beneficiaryCount: 0n,
    listHash: ZERO, finalized: false, vestingStart: 0n, balance,
  };
  const presale = {
    allocations: async (a) => st.allocations.get(a.toLowerCase()) || 0n,
    totalAllocated: async () => st.totalAllocated,
    totalClaimed: async () => st.totalClaimed,
    beneficiaryCount: async () => st.beneficiaryCount,
    allocationListHash: async () => st.listHash,
    finalized: async () => st.finalized,
    vestingStart: async () => st.vestingStart,
    presaleCap: async () => cap,
    paused: async () => false,
  };
  const reader = {
    address: CONTRACT,
    presale,
    token: async () => ({ balanceOf: async () => st.balance }),
  };
  // Igual que allocateBatch: suma, y cuenta beneficiarios nuevos.
  const load = (rows) => {
    for (const r of rows) {
      const prev = st.allocations.get(r.address) || 0n;
      if (prev === 0n) st.beneficiaryCount += 1n;
      st.allocations.set(r.address, prev + BigInt(r.wei));
      st.totalAllocated += BigInt(r.wei);
    }
  };
  return { reader, st, load };
}

describe("estado del contrato", () => {
  let sequelize, PresaleContribution, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    PresaleContribution = require("../../../models/presaleContributions")(sequelize, SequelizePkg.DataTypes);
    models = { PresaleContribution, Sequelize: SequelizePkg };
  });
  afterAll(() => sequelize.close());

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    // 5 wallets validadas; con tandas de 2 son 3 tandas (2, 2, 1).
    for (let i = 1; i <= 5; i++) {
      await PresaleContribution.create({
        wallet_address: ADDR(i), phase_id: 1, usdt_amount: 30, hack_amount: 1_000_000 * i,
        tx_hash: "0x" + i.toString(16).padStart(64, "0"), status: "validated",
      });
    }
  });

  const lote = async () => buildBatch(await PresaleContribution.findAll({ where: { status: "validated" }, order: [["id", "ASC"]] }), 2);

  test("antes de cargar: todo sin cargar, hash sin grabar, totales por debajo", async () => {
    const { reader } = fakeContract();
    const s = await getContractStatus({ models, reader, batchSize: 2 });

    expect(s.batch.batches.map((b) => b.state)).toEqual(["not_loaded", "not_loaded", "not_loaded"]);
    expect(s.checks).toEqual({ totals: "below", unknownBeneficiaries: 0, hash: "unset" });
    expect(s.batch.problems).toEqual([]);
  });

  test("cargando de a una tanda: refleja el avance", async () => {
    const { reader, load } = fakeContract();
    const l = await lote();
    load(l.batches[0].rows);

    const s = await getContractStatus({ models, reader, batchSize: 2 });

    expect(s.batch.batches.map((b) => b.state)).toEqual(["loaded", "not_loaded", "not_loaded"]);
    expect(s.batch.batches[0].loadedWallets).toBe(2);
    expect(s.checks.totals).toBe("below");
  });

  test("todo cargado y hash grabado: coincide todo", async () => {
    const { reader, st, load } = fakeContract();
    const l = await lote();
    l.batches.forEach((b) => load(b.rows));
    st.listHash = l.hash;

    const s = await getContractStatus({ models, reader, batchSize: 2 });

    expect(s.batch.batches.every((b) => b.state === "loaded")).toBe(true);
    expect(s.checks).toEqual({ totals: "match", unknownBeneficiaries: 0, hash: "match" });
    expect(s.batch.hash).toBe(keccak256(toUtf8Bytes(l.csv)));
  });

  test("DOBLE CARGA: una tanda cargada dos veces se detecta y se nombra cada wallet", async () => {
    const { reader, load } = fakeContract();
    const l = await lote();
    load(l.batches[0].rows);
    load(l.batches[1].rows);
    load(l.batches[1].rows); // por error, otra vez
    load(l.batches[2].rows);

    const s = await getContractStatus({ models, reader, batchSize: 2 });

    expect(s.batch.batches.map((b) => b.state)).toEqual(["loaded", "over", "loaded"]);
    expect(s.checks.totals).toBe("above");
    expect(s.batch.problems).toEqual([
      { address: ADDR(3), state: "over", expectedHack: "3000000", onchainHack: "6000000" },
      { address: ADDR(4), state: "over", expectedHack: "4000000", onchainHack: "8000000" },
    ]);
  });

  test("hash grabado distinto del lote: mismatch", async () => {
    const { reader, st } = fakeContract();
    st.listHash = "0x" + "ab".repeat(32);
    const s = await getContractStatus({ models, reader, batchSize: 2 });
    expect(s.checks.hash).toBe("mismatch");
  });

  test("beneficiarios en cadena que no estan en el lote", async () => {
    const { reader, load } = fakeContract();
    load([{ address: ADDR(0xbad), wei: (1n * E18).toString() }]);
    const s = await getContractStatus({ models, reader, batchSize: 2 });
    expect(s.checks.unknownBeneficiaries).toBe(0); // 1 en cadena, 5 en el lote
    load((await lote()).rows);
    const s2 = await getContractStatus({ models, reader, batchSize: 2 });
    expect(s2.checks.unknownBeneficiaries).toBe(1); // 6 en cadena, 5 en el lote
  });

  test("fondeo: avisa cuantos HACK faltan para pagar lo asignado", async () => {
    const { reader, load } = fakeContract({ balance: 2_000_000n * E18 });
    load((await lote()).rows); // 15.000.000 HACK asignados
    const s = await getContractStatus({ models, reader, batchSize: 2 });
    expect(s.funding).toEqual({ state: "short", missingHack: "13000000" });
  });

  test("finalizada: la fecha de reclamo sale del contrato (inicio + 30 dias)", async () => {
    const { reader, st } = fakeContract();
    st.finalized = true;
    st.vestingStart = BigInt(Date.UTC(2026, 11, 29) / 1000);
    const s = await getContractStatus({ models, reader, batchSize: 2 });
    expect(s.onchain.claimFrom).toBe("2027-01-28T00:00:00.000Z");
  });

  test("reporta los pendientes de revision", async () => {
    await PresaleContribution.create({
      wallet_address: ADDR(9), phase_id: 1, usdt_amount: 30, hack_amount: 1, tx_hash: "0x" + "99".repeat(32), status: "pending",
    });
    const { reader } = fakeContract();
    const s = await getContractStatus({ models, reader, batchSize: 2 });
    expect(s.review.pending).toBe(1);
  });

  test("sin aportes validados: estado del contrato sin lote", async () => {
    await PresaleContribution.destroy({ where: {} });
    const { reader } = fakeContract();
    const s = await getContractStatus({ models, reader, batchSize: 2 });
    expect(s.batch).toBeNull();
    expect(s.onchain.finalized).toBe(false);
  });

  test("clasificacion de wallets y tandas", () => {
    expect(walletState(10n, 10n)).toBe("loaded");
    expect(walletState(10n, 0n)).toBe("not_loaded");
    expect(walletState(10n, 20n)).toBe("over");
    expect(walletState(10n, 5n)).toBe("partial");
    expect(batchState(["loaded", "over"])).toBe("over");
    expect(batchState(["loaded", "not_loaded"])).toBe("partial");
  });
});
