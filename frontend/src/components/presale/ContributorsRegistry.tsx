import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, X } from "lucide-react";
import { PHASES, shortenAddress } from "@/utils/presale";
import { usePresaleContributors } from "@/hooks/usePresaleContributors";

const PER_PAGE = 10;
// Suficiente para no disparar una consulta por tecla, corto como para que la
// tabla no se sienta retrasada respecto del input.
const SEARCH_DEBOUNCE_MS = 300;

export default function ContributorsRegistry() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [phaseId, setPhaseId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Un filtro nuevo sobre la pagina 7 casi siempre cae fuera de rango y
  // devolveria una tabla vacia que parece "sin resultados".
  useEffect(() => {
    setPage(1);
  }, [search, phaseId]);

  const { data, isLoading, isError, isFetching } = usePresaleContributors({
    page,
    perPage: PER_PAGE,
    search,
    phaseId,
  });

  const contributors = data?.contributors ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;
  const filtering = search.trim() !== "" || phaseId !== undefined;

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

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por dirección…"
              aria-label="Buscar contribuidor por dirección"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-9 font-mono text-sm text-white placeholder:text-white/20 focus:border-purple-500/60 focus:outline-none transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <select
            value={phaseId ?? ""}
            onChange={(e) => setPhaseId(e.target.value ? Number(e.target.value) : undefined)}
            aria-label="Filtrar por fase"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-body text-sm text-white/70 focus:border-purple-500/60 focus:outline-none transition-colors"
          >
            <option value="">Todas las fases</option>
            {PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                Fase {p.label}
              </option>
            ))}
          </select>
        </div>

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
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body text-white/30">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body text-red-400">
                    No pudimos cargar la lista. Probá de nuevo en un momento.
                  </td>
                </tr>
              ) : contributors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-body text-white/30">
                    {filtering
                      ? "Ningún contribuidor coincide con esa búsqueda."
                      : "Todavía no hay contribuciones registradas."}
                  </td>
                </tr>
              ) : (
                contributors.map((c) => (
                  <tr
                    key={`${c.address}-${c.created_at}`}
                    className="border-b border-white/10 text-white/70 last:border-b-0"
                  >
                    <td className="px-4 py-3" title={c.address}>{shortenAddress(c.address)}</td>
                    <td className="px-4 py-3 font-title text-white/40">{c.phase}</td>
                    <td className="px-4 py-3">${c.usdt} USD</td>
                    <td className="px-4 py-3">{c.hack.toLocaleString("es-ES")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && !isError && total > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-body text-xs text-white/40">
            <span>
              {total} {total === 1 ? "contribuidor" : "contribuidores"}
              {filtering && " con este filtro"}
              {isFetching && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-3">
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-white/10 hover:border-white/25 px-3 py-1.5 font-semibold transition-colors disabled:opacity-20 disabled:hover:border-white/10"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </section>
  );
}
