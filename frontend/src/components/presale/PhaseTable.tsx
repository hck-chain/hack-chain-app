import type { Phase } from "@/types/presale";
import { PHASES, formatNumber } from "@/utils/presale";

interface PhaseTableProps {
  activePhase: Phase | null;
}

export default function PhaseTable({ activePhase }: PhaseTableProps) {
  return (
    <section className="border-b border-zinc-800 py-10">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Detalle</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">Fases de la preventa</h2>

      <div className="mt-5 overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Fase</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Disponible</th>
              <th className="px-4 py-3 font-medium">Bloqueo / liberación</th>
              <th className="px-4 py-3 font-medium">Máx. por compra</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {PHASES.map((phase) => {
              const isActive = activePhase?.id === phase.id;
              const isPast = !!activePhase && phase.id < activePhase.id;
              return (
                <tr
                  key={phase.id}
                  className={`border-b border-zinc-800 last:border-b-0 ${
                    isActive ? "bg-amber-400/5" : isPast ? "opacity-40" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className={`font-sans ${isActive ? "font-semibold text-amber-300" : "text-zinc-300"}`}>
                      {String(phase.id).padStart(2, "0")} · {phase.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {phase.start.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} –{" "}
                    {phase.end.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-zinc-200">${phase.price.toFixed(5)} USD</td>
                  <td className="px-4 py-3 text-zinc-200">{formatNumber(phase.tokensAvailable)}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {phase.lockup} · {phase.release}
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{formatNumber(phase.maxPerPurchase)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
