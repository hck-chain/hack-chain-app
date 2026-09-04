import type { Phase } from "@/types/presale";

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
export const NETWORK_NAME = "Ethereum (ERC-20)";
export const CLAIM_ENABLED_DATE = new Date("2026-10-19T00:00:00Z");

export const PHASES: Phase[] = [
  {
    id: 1,
    label: "Primera",
    start: new Date("2026-08-30T00:00:00Z"),
    end: new Date("2026-09-05T23:59:59Z"),
    price: 0.00003,
    tokensAvailable: 20_000_000,
    maxPerPurchase: 5_000_000,
    lockup: "1 mes",
    release: "33.3% mensual (3 meses)",
  },
  {
    id: 2,
    label: "Segunda",
    start: new Date("2026-09-06T00:00:00Z"),
    end: new Date("2026-09-12T23:59:59Z"),
    price: 0.00005,
    tokensAvailable: 30_000_000,
    maxPerPurchase: 7_500_000,
    lockup: "1 mes",
    release: "33.3% mensual (3 meses)",
  },
  {
    id: 3,
    label: "Tercera",
    start: new Date("2026-09-13T00:00:00Z"),
    end: new Date("2026-09-19T23:59:59Z"),
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
