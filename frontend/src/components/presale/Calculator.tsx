import { useState } from "react";
import type { Phase } from "@/types/presale";
import { formatNumber } from "@/utils/presale";

interface CalculatorProps {
  activePhase: Phase | null;
}

type Mode = "usdtToHack" | "hackToUsdt";

export default function Calculator({ activePhase }: CalculatorProps) {
  const [mode, setMode] = useState<Mode>("usdtToHack");
  const [usdtInput, setUsdtInput] = useState("");
  const [hackInput, setHackInput] = useState("");

  if (!activePhase) {
    return (
      <section className="border-b border-zinc-800 py-10">
        <p className="text-sm text-zinc-500">La calculadora vuelve a estar disponible en la próxima fase.</p>
      </section>
    );
  }

  const min = 1; // mínimo de compra en USDT
  const max = activePhase.maxPerPurchase;

  const usdtValue = parseFloat(usdtInput);
  const hackValue = parseFloat(hackInput);

  const derivedHack =
    mode === "usdtToHack" && !Number.isNaN(usdtValue) ? usdtValue / activePhase.price : null;
  const derivedUsdt =
    mode === "hackToUsdt" && !Number.isNaN(hackValue) ? hackValue * activePhase.price : null;

  let error: string | null = null;
  if (mode === "usdtToHack" && !Number.isNaN(usdtValue)) {
    if (usdtValue < min) error = `El mínimo de compra es ${min} USDT.`;
    else if (derivedHack !== null && derivedHack > max)
      error = `Superás el máximo de ${formatNumber(max)} HACK por compra en esta fase.`;
  }
  if (mode === "hackToUsdt" && !Number.isNaN(hackValue)) {
    if (hackValue > max) error = `El máximo por compra en esta fase es ${formatNumber(max)} HACK.`;
    else if (derivedUsdt !== null && derivedUsdt < min)
      error = `Eso equivale a menos del mínimo de ${min} USDT.`;
  }

  return (
    <section className="border-b border-zinc-800 py-10">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Paso 1</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">
        Calculá cuánto vas a recibir — Fase {activePhase.label}
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Tengo esta cantidad de USDT
          </span>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={usdtInput}
            onChange={(e) => {
              setMode("usdtToHack");
              setUsdtInput(e.target.value);
            }}
            placeholder="0.00"
            className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quiero comprar esta cantidad de HACK
          </span>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={hackInput}
            onChange={(e) => {
              setMode("hackToUsdt");
              setHackInput(e.target.value);
            }}
            placeholder="0"
            className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : mode === "usdtToHack" && derivedHack ? (
          <p className="font-mono text-sm text-zinc-200">
            Recibirías <span className="text-amber-300">{formatNumber(Math.floor(derivedHack))} HACK</span>
          </p>
        ) : mode === "hackToUsdt" && derivedUsdt ? (
          <p className="font-mono text-sm text-zinc-200">
            Necesitás <span className="text-amber-300">${derivedUsdt.toFixed(2)} USDT</span>
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Ingresá un monto para calcular.</p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          Mínimo {min} USDT por compra · máximo {formatNumber(max)} HACK en esta fase.
        </p>
      </div>
    </section>
  );
}
