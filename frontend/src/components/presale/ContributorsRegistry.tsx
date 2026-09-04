import { useState } from "react";
import { motion } from "framer-motion";
import { MOCK_CONTRIBUTORS } from "@/data/presaleMocks";
import { shortenAddress } from "@/utils/presale";

export default function ContributorsRegistry() {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(MOCK_CONTRIBUTORS.length / perPage));
  const visible = MOCK_CONTRIBUTORS.slice((page - 1) * perPage, page * perPage);

  return (
    <section className="border-b border-white/10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
          Transparencia
        </span>
        <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-6">
          Lista de <span className="gradient-text">contribuidores</span>
        </h2>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Dirección</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">Fase</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">USDT</th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">HACK</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {visible.map((c) => (
                <tr key={c.address} className="border-b border-white/10 text-white/70 last:border-b-0">
                  <td className="px-4 py-3">{shortenAddress(c.address)}</td>
                  <td className="px-4 py-3 font-title text-white/40">{c.phase}</td>
                  <td className="px-4 py-3">${c.usdt} USD</td>
                  <td className="px-4 py-3">{c.hack.toLocaleString("es-ES")}</td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body text-white/30">
                    Todavía no hay contribuciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3 font-body text-xs text-white/40">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-white/10 hover:border-white/25 px-3 py-1.5 font-semibold transition-colors disabled:opacity-20 disabled:hover:border-white/10"
            >
              Anterior
            </button>
            <span className="font-mono">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 hover:border-white/25 px-3 py-1.5 font-semibold transition-colors disabled:opacity-20 disabled:hover:border-white/10"
            >
              Siguiente
            </button>
          </div>
        )}
      </motion.div>
    </section>
  );
}