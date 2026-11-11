import type { Phase } from "@/types/presale";
// Bandera manual: mientras sea `true`, la preventa se muestra como
// "Próximamente" sin revelar fechas, sin importar lo que digan PHASES.
// Cambiar a `false` el día que se quiera activar realmente al público.
export const PRESALE_PAUSED = true;

/* ============================================================
   Reemplazar por el servicio de consulta de Julian (M-09).
   Contrato de datos a acordar en la primera semana.
   ============================================================ */

export const OFFICIAL_ADDRESS = "0x1F3a9C6b2E7d4F81A0c5B6e9D2f4A7c8E1b3D6f0";
export const OFFICIAL_DOMAIN = "www.hackchain.app";
export const NETWORK_NAME = "Polygon (ERC-20)";
// Habilitacion del reclamo: cierre de la preventa + los 30 dias de cliff que
// impone PresaleAllocation.CLIFF_DURATION. Se mueve junto con PHASES.
export const CLAIM_ENABLED_DATE = new Date("2027-01-27T00:00:00Z");

/** Compra minima, en USDT. Vive aca y no dentro de la calculadora para que el
 *  backend y la UI validen contra el mismo numero. */
export const MIN_PURCHASE_USDT = 1;

/* ============================================================
   FECHAS PROVISIONALES — CAMBIAR POR LAS REALES ANTES DE PUBLICAR.
   Puestas a 30 dias vista (una semana por fase) para poder probar la pagina:
   con todas las fases vencidas, getActivePhase() devuelve null y ni la
   calculadora ni el formulario de comprobante se renderizan.
   Al cambiarlas, mover tambien CLAIM_ENABLED_DATE: es el cierre + 30 dias.
   ============================================================ */
export const PHASES: Phase[] = [
  {
    id: 1,
    label: "Primera",
    start: new Date("2026-12-08T00:00:00Z"),
    end: new Date("2026-12-14T23:59:59Z"),
    price: 0.00003,
    tokensAvailable: 20_000_000,
    maxPerPurchase: 5_000_000,
    lockup: "1 mes",
    release: "33.3% mensual (3 meses)",
  },
  {
    id: 2,
    label: "Segunda",
    start: new Date("2026-12-15T00:00:00Z"),
    end: new Date("2026-12-21T23:59:59Z"),
    price: 0.00005,
    tokensAvailable: 30_000_000,
    maxPerPurchase: 7_500_000,
    lockup: "1 mes",
    release: "33.3% mensual (3 meses)",
  },
  {
    id: 3,
    label: "Tercera",
    start: new Date("2026-12-22T00:00:00Z"),
    end: new Date("2026-12-28T23:59:59Z"),
    price: 0.00008,
    tokensAvailable: 50_000_000,
    maxPerPurchase: 12_500_000,
    lockup: "1 mes",
    release: "33.3% mensual (3 meses)",
  },
];

export function getActivePhase(now: Date): Phase | null {
  for (const phase of PHASES) {
    if (now < phase.end) return phase;
  }
  return null; // preventa finalizada
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}
