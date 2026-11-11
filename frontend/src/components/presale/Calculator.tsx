import { useState } from "react";
import { motion } from "framer-motion";
import type { Phase } from "@/types/presale";
import { formatNumber, MIN_PURCHASE_USDT } from "@/utils/presale";

interface CalculatorProps {
  activePhase: Phase | null;
}

type Side = "usdt" | "hack";

/** Hasta 6 decimales y sin notacion cientifica: 1e-7 USDT en un input numerico
 *  es ilegible, y el backend recibe el string tal cual lo ve el comprador. */
function trim(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return "";
  return String(Number(n.toFixed(decimals)));
}

export default function Calculator({ activePhase }: CalculatorProps) {
  // Un solo lado es la fuente de verdad: el que el comprador toco ultimo. El
  // otro campo se deriva de este en cada render, asi no pueden quedar
  // desincronizados mostrando una conversion que no se corresponde.
  const [side, setSide] = useState<Side>("usdt");
  const [raw, setRaw] = useState("");

  if (!activePhase) {
    return (
      <section className="border-b border-white/10 py-12">
        <p className="font-body text-sm text-white/40">
          La calculadora vuelve a estar disponible en la próxima fase.
        </p>
      </section>
    );
  }

  const max = activePhase.maxPerPurchase;
  const entered = raw.trim() === "" ? NaN : Number(raw);
  const hasValue = Number.isFinite(entered) && entered > 0;

  const usdt = side === "usdt" ? entered : entered * activePhase.price;
  const hack = side === "hack" ? entered : entered / activePhase.price;

  const usdtField = side === "usdt" ? raw : hasValue ? trim(usdt, 6) : "";
  const hackField = side === "hack" ? raw : hasValue ? trim(hack, 0) : "";

  let error: string | null = null;
  if (hasValue) {
    if (usdt < MIN_PURCHASE_USDT) {
      error =
        side === "usdt"
          ? `El mínimo de compra es ${MIN_PURCHASE_USDT} USDT.`
          : `Eso equivale a menos del mínimo de ${MIN_PURCHASE_USDT} USDT.`;
    } else if (hack > max) {
      error = `El máximo por compra en esta fase es ${formatNumber(max)} HACK.`;
    }
  }

  const edit = (nextSide: Side) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSide(nextSide);
    setRaw(e.target.value);
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-purple-500/60 focus:outline-none transition-colors";

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
              value={usdtField}
              onChange={edit("usdt")}
              placeholder="0.00"
              className={inputClass}
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
              value={hackField}
              onChange={edit("hack")}
              placeholder="0"
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4">
          {error ? (
            <p className="font-body text-sm text-red-400 font-medium">{error}</p>
          ) : hasValue ? (
            <p className="font-mono text-sm text-white/70">
              <span className="text-amber-300 font-bold">${trim(usdt, 2)} USDT</span> por{" "}
              <span className="text-amber-300 font-bold">{formatNumber(Math.floor(hack))} HACK</span>
            </p>
          ) : (
            <p className="font-body text-sm text-white/30">Ingresá un monto para calcular.</p>
          )}
          <p className="mt-2 font-body text-xs text-white/25">
            Mínimo {MIN_PURCHASE_USDT} USDT por compra · máximo {formatNumber(max)} HACK en esta fase.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
