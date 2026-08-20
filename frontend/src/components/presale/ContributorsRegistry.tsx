import { useState } from "react";
import { MOCK_CONTRIBUTORS } from "@/data/presaleMocks";
import { shortenAddress } from "@/utils/presale";

export default function ContributorsRegistry() {
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(MOCK_CONTRIBUTORS.length / perPage));
  const visible = MOCK_CONTRIBUTORS.slice((page - 1) * perPage, page * perPage);

  return (
    <section className="border-b border-zinc-800 py-10">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Transparencia</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">Lista de contribuidores</h2>

      <div className="mt-5 overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Dirección</th>
              <th className="px-4 py-3 font-medium">Fase</th>
              <th className="px-4 py-3 font-medium">USDT</th>
              <th className="px-4 py-3 font-medium">HACK</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {visible.map((c) => (
              <tr key={c.address} className="border-b border-zinc-800 text-zinc-300 last:border-b-0">
                <td className="px-4 py-3">{shortenAddress(c.address)}</td>
                <td className="px-4 py-3 font-sans text-zinc-400">{c.phase}</td>
                <td className="px-4 py-3">${c.usdt} USD</td>
                <td className="px-4 py-3">{c.hack.toLocaleString("es-ES")}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Todavía no hay contribuciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-zinc-500">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-zinc-700 px-2 py-1 disabled:opacity-30"
          >
            Anterior
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-zinc-700 px-2 py-1 disabled:opacity-30"
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
