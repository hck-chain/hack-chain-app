// Verificacion de un aporte contra la red de pagos (Ethereum), con recibos y
// bloques simulados pero eventos Transfer codificados de verdad.
//
// Lo central: lo ACREDITADO sale de la cadena. La fase, de la fecha del
// bloque; los HACK, de lo transferido. Nunca de lo que declara el comprador.
const { Interface } = require("ethers");
const { verifyContribution, PresaleConfigError } = require("../verifyContribution");

const USDT = "0x000000000000000000000000000000000000005d";
const TREASURY = "0x7777777777777777777777777777777777777777";
const BUYER = "0x1111111111111111111111111111111111111111";
const EXCHANGE = "0x2222222222222222222222222222222222222222";
const THIEF = "0x3333333333333333333333333333333333333333";
const OTHER_TOKEN = "0x9999999999999999999999999999999999999999";
const TX = "0x" + "ab".repeat(32);

// Fases de prueba: precios en unidades base de USDT por HACK.
const PHASES = [
  { id: 1, label: "Primera", priceBase: 30n, capHack: 20_000_000n, start: new Date("2026-12-08T00:00:00Z"), end: new Date("2026-12-14T23:59:59Z") },
  { id: 2, label: "Segunda", priceBase: 50n, capHack: 30_000_000n, start: new Date("2026-12-15T00:00:00Z"), end: new Date("2026-12-21T23:59:59Z") },
  { id: 3, label: "Tercera", priceBase: 80n, capHack: 50_000_000n, start: new Date("2026-12-22T00:00:00Z"), end: new Date("2026-12-28T23:59:59Z") },
];
const CONFIG = { treasuryAddress: TREASURY, usdtTokenAddress: USDT, usdtDecimals: 6, minConfirmations: 12, phases: PHASES };

const EN_FASE_1 = "2026-12-10T12:00:00Z";
const EN_FASE_3 = "2026-12-23T12:00:00Z";
const ENTRE_FASES = "2026-12-01T12:00:00Z";

const usdt = (n) => BigInt(Math.round(n * 1e6));
const iface = new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
const transferLog = ({ token = USDT, from = BUYER, to = TREASURY, value = usdt(30) } = {}) => {
  const e = iface.encodeEventLog("Transfer", [from, to, value]);
  return { address: token, topics: e.topics, data: e.data };
};

/** Cadena simulada: un recibo en el bloque 1000, con la fecha y la altura que se pidan. */
function chain({ logs = [transferLog()], status = 1, when = EN_FASE_1, head = 1100, receipt, error } = {}) {
  return {
    getTransactionReceipt: jest.fn(async () => {
      if (error) throw error;
      return receipt === undefined ? { status, blockNumber: 1000, logs } : receipt;
    }),
    getBlockNumber: jest.fn(async () => head),
    getBlock: jest.fn(async () => ({ timestamp: Math.floor(new Date(when).getTime() / 1000) })),
  };
}
const aporte = (over = {}) => ({ wallet_address: BUYER, tx_hash: TX, usdt_amount: "30.000000", phase_id: 1, ...over });

describe("verifyContribution", () => {
  test("pago correcto: acredita la fase de la fecha del bloque y los HACK de lo transferido", async () => {
    const r = await verifyContribution({ contribution: aporte(), provider: chain(), config: CONFIG });
    expect(r).toMatchObject({
      ok: true, amountUsdt: 30, phaseId: 1, phaseLabel: "Primera",
      hackAmount: "1000000", blockTime: "2026-12-10T12:00:00.000Z", manualReview: false, senders: [BUYER],
    });
  });

  test("REGRESION: declarar la fase 1 pagando en la fase 3 no sirve; se acredita la fase 3", async () => {
    // Antes la fase la elegia el cliente: con 100 USDT se llevaba 3.333.333
    // HACK al precio de la fase 1 en vez de 1.250.000 al de la fase 3.
    const r = await verifyContribution({
      contribution: aporte({ phase_id: 1, usdt_amount: "100" }),
      provider: chain({ logs: [transferLog({ value: usdt(100) })], when: EN_FASE_3 }),
      config: CONFIG,
    });
    expect(r.ok).toBe(true);
    expect(r.phaseId).toBe(3);
    expect(r.hackAmount).toBe("1250000");
  });

  test("acredita lo TRANSFERIDO, no lo declarado (pago de mas)", async () => {
    const r = await verifyContribution({
      contribution: aporte({ usdt_amount: "30" }),
      provider: chain({ logs: [transferLog({ value: usdt(45) })] }),
      config: CONFIG,
    });
    expect(r.amountUsdt).toBe(45);
    expect(r.hackAmount).toBe("1500000");
  });

  test("redondea hacia abajo con aritmetica entera", async () => {
    // 10,000001 USDT a 0,00003 = 333.333,3667 HACK -> 333.333
    const r = await verifyContribution({
      contribution: aporte(),
      provider: chain({ logs: [transferLog({ value: 10_000_001n })] }),
      config: CONFIG,
    });
    expect(r.hackAmount).toBe("333333");
  });

  test("OUTSIDE_PHASE: el pago llego cuando ninguna fase estaba abierta", async () => {
    const r = await verifyContribution({ contribution: aporte(), provider: chain({ when: ENTRE_FASES }), config: CONFIG });
    expect(r).toEqual({ ok: false, reason: "OUTSIDE_PHASE", blockTime: "2026-12-01T12:00:00.000Z" });
  });

  test("NOT_ENOUGH_CONFIRMATIONS: pago recien minado, se reintenta despues", async () => {
    const r = await verifyContribution({ contribution: aporte(), provider: chain({ head: 1005 }), config: CONFIG });
    expect(r).toMatchObject({ ok: false, reason: "NOT_ENOUGH_CONFIRMATIONS", soft_failed: true, confirmations: 6, required: 12 });
  });

  test("BELOW_MINIMUM: menos de 1 USDT no se acredita", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: chain({ logs: [transferLog({ value: usdt(0.99) })] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "BELOW_MINIMUM" });
  });

  describe("remitente", () => {
    test("WRONG_SENDER desde un exchange: no valida, pero ofrece revision manual con los datos del pago", async () => {
      const r = await verifyContribution({
        contribution: aporte(),
        provider: chain({ logs: [transferLog({ from: EXCHANGE, value: usdt(30) })] }),
        config: CONFIG,
      });
      expect(r).toMatchObject({
        ok: false, reason: "WRONG_SENDER", manualReviewPossible: true,
        senders: [EXCHANGE], amountUsdt: 30, phaseId: 1, hackAmount: "1000000",
      });
    });

    test("con allowAnySender (revision manual) se acredita y queda marcado", async () => {
      const r = await verifyContribution({
        contribution: aporte(),
        provider: chain({ logs: [transferLog({ from: EXCHANGE })] }),
        config: CONFIG,
        allowAnySender: true,
      });
      expect(r).toMatchObject({ ok: true, manualReview: true, senders: [EXCHANGE], hackAmount: "1000000" });
    });

    test("el robo de hash ajeno se ve como WRONG_SENDER: el admin ve quien pago de verdad", async () => {
      const r = await verifyContribution({
        contribution: aporte({ wallet_address: THIEF }),
        provider: chain({ logs: [transferLog({ from: BUYER })] }),
        config: CONFIG,
      });
      expect(r.reason).toBe("WRONG_SENDER");
      expect(r.senders).toEqual([BUYER]);
    });
  });

  test("WRONG_RECIPIENT: pago a otra direccion", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: chain({ logs: [transferLog({ to: THIEF })] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "WRONG_RECIPIENT" });
  });

  test("NO_USDT_TRANSFER: otro token (moneda falsa)", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: chain({ logs: [transferLog({ token: OTHER_TOKEN })] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "NO_USDT_TRANSFER" });
  });

  test("TX_REVERTED y TX_NOT_FOUND", async () => {
    expect((await verifyContribution({ contribution: aporte(), provider: chain({ status: 0 }), config: CONFIG })).reason).toBe("TX_REVERTED");
    expect((await verifyContribution({ contribution: aporte(), provider: chain({ receipt: null }), config: CONFIG })).reason).toBe("TX_NOT_FOUND");
  });

  test("RPC caido: fallo blando, no acusa al pago", async () => {
    const r = await verifyContribution({ contribution: aporte(), provider: chain({ error: new Error("timeout") }), config: CONFIG });
    expect(r).toMatchObject({ ok: false, reason: "RPC_ERROR", soft_failed: true });
  });

  test("NO_TX_HASH sin consultar la cadena", async () => {
    const p = chain();
    const r = await verifyContribution({ contribution: aporte({ tx_hash: null }), provider: p, config: CONFIG });
    expect(r).toEqual({ ok: false, reason: "NO_TX_HASH" });
    expect(p.getTransactionReceipt).not.toHaveBeenCalled();
  });

  test("falla cerrado sin tesoreria o sin token configurados", async () => {
    await expect(verifyContribution({ contribution: aporte(), provider: chain(), config: { ...CONFIG, treasuryAddress: undefined } }))
      .rejects.toBeInstanceOf(PresaleConfigError);
    await expect(verifyContribution({ contribution: aporte(), provider: chain(), config: { ...CONFIG, usdtTokenAddress: "" } }))
      .rejects.toBeInstanceOf(PresaleConfigError);
  });
});
