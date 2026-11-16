// La configuracion de la preventa: un solo lugar (el array PRESALE_NETWORKS)
// que dice donde queda cada cosa, con sobrescrituras de entorno solo para
// pruebas, y fases con aritmetica entera.
const cfg = require("../presale");

const ENV = ["PRESALE_TREASURY_ADDRESS", "PRESALE_USDT_ADDRESS", "PRESALE_CONTRACT_ADDRESS", "PRESALE_PHASES"];
let guardado;
beforeEach(() => { guardado = Object.fromEntries(ENV.map((k) => [k, process.env[k]])); ENV.forEach((k) => delete process.env[k]); });
afterEach(() => ENV.forEach((k) => (guardado[k] === undefined ? delete process.env[k] : (process.env[k] = guardado[k]))));

test("el array dice donde paga el comprador (Ethereum) y donde vive el token (Polygon)", () => {
  const { networks } = cfg.getNetworks();
  expect(networks.map((n) => [n.role, n.network, n.chainId])).toEqual([["payment", "Ethereum", 1], ["token", "Polygon", 137]]);
  expect(cfg.networkFor("payment").token).toEqual({
    symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6,
  });
});

test("sin decision tomada, la tesoreria y el contrato quedan en null (no se inventan)", () => {
  expect(cfg.networkFor("payment").treasury).toBeNull();
  expect(cfg.networkFor("token").presaleContract).toBeNull();
});

test("las variables de entorno sobrescriben y queda registrado que se sobrescribio", () => {
  process.env.PRESALE_TREASURY_ADDRESS = "0x" + "77".repeat(20);
  const { networks, overrides } = cfg.getNetworks();
  expect(networks[0].treasury).toBe("0x" + "77".repeat(20));
  expect(overrides).toEqual([
    { role: "payment", field: "treasury", env: "PRESALE_TREASURY_ADDRESS", fileValue: null, value: "0x" + "77".repeat(20) },
  ]);
});

test("sobrescribir no modifica el array original", () => {
  process.env.PRESALE_USDT_ADDRESS = "0x" + "5d".repeat(20);
  cfg.getNetworks();
  expect(cfg.PRESALE_NETWORKS[0].token.address).toBe("0xdAC17F958D2ee523a2206206994597C13D831ec7");
});

test("fase por fecha y HACK por monto, hacia abajo", () => {
  const f3 = cfg.phaseAt(new Date("2026-12-24T00:00:00Z"));
  expect(f3.id).toBe(3);
  expect(cfg.hackFor(100_000_000n, f3)).toBe(1_250_000n); // 100 USDT a 0,00008
  expect(cfg.phaseAt(new Date("2026-12-01T00:00:00Z"))).toBeNull();
});

test("las fases se pueden sobrescribir con PRESALE_PHASES", () => {
  process.env.PRESALE_PHASES = JSON.stringify([{ id: 1, label: "X", priceBase: "10", capHack: "5", start: "2026-01-01T00:00:00Z", end: "2026-01-02T00:00:00Z" }]);
  expect(cfg.loadPhases().map((p) => p.label)).toEqual(["X"]);
});
