// Verificacion en cadena de un aporte de preventa, con recibos simulados
// pero con eventos Transfer codificados de verdad (mismo enfoque que
// services/__tests__/verifyUsdtPayment.test.js).
const { Interface } = require("ethers");
const { verifyContribution, PresaleConfigError } = require("../verifyContribution");

const USDT = "0x000000000000000000000000000000000000005d";
const TREASURY = "0x7777777777777777777777777777777777777777";
const BUYER = "0x1111111111111111111111111111111111111111";
const THIEF = "0x3333333333333333333333333333333333333333";
const OTHER_TOKEN = "0x9999999999999999999999999999999999999999";
const TX = "0x" + "ab".repeat(32);

const CONFIG = { treasuryAddress: TREASURY, usdtTokenAddress: USDT, usdtDecimals: 6 };
const usdt = (n) => BigInt(Math.round(n * 1e6));

const iface = new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
const transferLog = ({ token = USDT, from = BUYER, to = TREASURY, value = usdt(30) } = {}) => {
  const e = iface.encodeEventLog("Transfer", [from, to, value]);
  return { address: token, topics: e.topics, data: e.data };
};
const provider = (receipt, error) => ({
  getTransactionReceipt: jest.fn(async () => { if (error) throw error; return receipt; }),
});
const aporte = (over = {}) => ({ wallet_address: BUYER, tx_hash: TX, usdt_amount: "30.000000", ...over });

describe("verifyContribution", () => {
  test("ok: USDT del comprador a la tesoreria por el monto declarado", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: provider({ status: 1, logs: [transferLog()] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: true, amountUsdt: 30, txHash: TX });
  });

  test("ok si pago de mas: el comprador declaro menos de lo que transfirio", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: provider({ status: 1, logs: [transferLog({ value: usdt(50) })] }),
      config: CONFIG,
    });
    expect(r.ok).toBe(true);
    expect(r.amountUsdt).toBe(50);
  });

  test("WRONG_SENDER: el pago existe pero salio de otra wallet (robo de hash ajeno)", async () => {
    // Un tercero ve en Polygonscan un pago a la tesoreria y registra ese hash
    // como propio. El Transfer es real y va a la tesoreria, pero no es suyo.
    const r = await verifyContribution({
      contribution: aporte({ wallet_address: THIEF }),
      provider: provider({ status: 1, logs: [transferLog({ from: BUYER })] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "WRONG_SENDER" });
  });

  test("WRONG_RECIPIENT: pago a otra direccion", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: provider({ status: 1, logs: [transferLog({ to: THIEF })] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "WRONG_RECIPIENT" });
  });

  test("INSUFFICIENT_AMOUNT: transfirio menos de lo declarado", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: provider({ status: 1, logs: [transferLog({ value: usdt(29.99) })] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "INSUFFICIENT_AMOUNT" });
  });

  test("NO_USDT_TRANSFER: el Transfer es de otro token", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: provider({ status: 1, logs: [transferLog({ token: OTHER_TOKEN })] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "NO_USDT_TRANSFER" });
  });

  test("TX_REVERTED", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: provider({ status: 0, logs: [] }),
      config: CONFIG,
    });
    expect(r).toEqual({ ok: false, reason: "TX_REVERTED" });
  });

  test("TX_NOT_FOUND", async () => {
    const r = await verifyContribution({ contribution: aporte(), provider: provider(null), config: CONFIG });
    expect(r).toEqual({ ok: false, reason: "TX_NOT_FOUND" });
  });

  test("RPC_ERROR se informa como fallo blando, no como pago invalido", async () => {
    const r = await verifyContribution({
      contribution: aporte(),
      provider: provider(null, new Error("timeout")),
      config: CONFIG,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("RPC_ERROR");
    expect(r.soft_failed).toBe(true);
  });

  test("NO_TX_HASH: un aporte sin hash no se puede verificar", async () => {
    const p = provider({ status: 1, logs: [transferLog()] });
    const r = await verifyContribution({ contribution: aporte({ tx_hash: null }), provider: p, config: CONFIG });
    expect(r).toEqual({ ok: false, reason: "NO_TX_HASH" });
    expect(p.getTransactionReceipt).not.toHaveBeenCalled();
  });

  test("falla cerrado sin tesoreria configurada", async () => {
    await expect(
      verifyContribution({ contribution: aporte(), provider: provider(null), config: { ...CONFIG, treasuryAddress: undefined } })
    ).rejects.toBeInstanceOf(PresaleConfigError);
  });

  test("falla cerrado sin token USDT configurado", async () => {
    await expect(
      verifyContribution({ contribution: aporte(), provider: provider(null), config: { ...CONFIG, usdtTokenAddress: "" } })
    ).rejects.toBeInstanceOf(PresaleConfigError);
  });
});
