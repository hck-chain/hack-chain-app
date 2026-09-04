import { motion } from "framer-motion";
import type { Phase } from "@/types/presale";
import { PHASES, formatNumber } from "@/utils/presale";

interface PhaseTableProps {
  activePhase: Phase | null;
}

export default function PhaseTable({ activePhase }: PhaseTableProps) {
  return (
    <section className="border-b border-white/10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
          Detalle
        </span>
        <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-6">
          Fases de la <span className="gradient-text">preventa</span>
        </h2>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Fase</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Precio</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Disponible</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Bloqueo / liberación</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Máx. por compra</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {PHASES.map((phase) => {
                const isActive = activePhase?.id === phase.id;
                const isPast = !!activePhase && phase.id < activePhase.id;
                return (
                  <tr
                    key={phase.id}
                    className={`border-b border-white/10 last:border-b-0 transition-colors ${
                      isActive ? "bg-amber-400/[0.06]" : isPast ? "opacity-30" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className={`font-title ${isActive ? "font-bold text-amber-300" : "font-semibold text-white/70"}`}>
                        {String(phase.id).padStart(2, "0")} · {phase.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40">
                      {phase.start.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} –{" "}
                      {phase.end.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-white/70">${phase.price.toFixed(5)} USD</td>
                    <td className="px-4 py-3 text-white/70">{formatNumber(phase.tokensAvailable)}</td>
                    <td className="px-4 py-3 text-white/40">
                      {phase.lockup} · {phase.release}
                    </td>
                    <td className="px-4 py-3 text-white/70">{formatNumber(phase.maxPerPurchase)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </section>
  );
}