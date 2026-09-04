import { useState } from "react";
import { motion } from "framer-motion";
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
      <section className="border-b border-white/10 py-12">
        <p className="font-body text-sm text-white/40">
          La calculadora vuelve a estar disponible en la próxima fase.
        </p>
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
    <section className="border-b border-white/10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
          Paso 1
        </span>
        <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-6">
          Calculá cuánto vas a recibir — <span className="gradient-text">Fase {activePhase.label}</span>
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">
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
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-purple-500/60 focus:outline-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">
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
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-purple-500/60 focus:outline-none transition-colors"
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
          {error ? (
            <p className="font-body text-sm text-red-400 font-medium">{error}</p>
          ) : mode === "usdtToHack" && derivedHack ? (
            <p className="font-mono text-sm text-white/70">
              Recibirías <span className="text-amber-300 font-bold">{formatNumber(Math.floor(derivedHack))} HACK</span>
            </p>
          ) : mode === "hackToUsdt" && derivedUsdt ? (
            <p className="font-mono text-sm text-white/70">
              Necesitás <span className="text-amber-300 font-bold">${derivedUsdt.toFixed(2)} USDT</span>
            </p>
          ) : (
            <p className="font-body text-sm text-white/30">Ingresá un monto para calcular.</p>
          )}
          <p className="mt-2 font-body text-xs text-white/25">
            Mínimo {min} USDT por compra · máximo {formatNumber(max)} HACK en esta fase.
          </p>
        </div>
      </motion.div>
    </section>
  );
}