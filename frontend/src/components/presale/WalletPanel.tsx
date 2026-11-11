import { motion } from "framer-motion";
import { Lock, Clock, Check, X, Loader2, ExternalLink } from "lucide-react";
import { CLAIM_ENABLED_DATE, formatNumber } from "@/utils/presale";
import type { PresaleWallet } from "@/hooks/usePresaleWallet";
import { useMyPresaleContributions } from "@/hooks/useMyPresaleContributions";
import type { OwnContribution } from "@/services/presale";
import WalletGate from "@/components/presale/WalletGate";

interface WalletPanelProps {
  wallet: PresaleWallet;
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div>
      <p className="font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold text-white/80">{value}</p>
    </div>
  );
}

const STATUS_LABEL: Record<OwnContribution["status"], string> = {
  pending: "En validación",
  validated: "Validado",
  rejected: "Rechazado",
};

function StatusBadge({ status }: { status: OwnContribution["status"] }) {
  const tone =
    status === "validated"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
      : status === "rejected"
        ? "border-red-500/25 bg-red-500/10 text-red-400"
        : "border-amber-500/25 bg-amber-500/10 text-amber-400";

  const Icon = status === "validated" ? Check : status === "rejected" ? X : Clock;

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-body text-[11px] font-semibold ${tone}`}>
      <Icon className="h-3 w-3" /> {STATUS_LABEL[status]}
    </span>
  );
}

function Header() {
  return (
    <>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
        Tu aporte
      </span>
      <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-6">
        Panel <span className="gradient-text">individual</span>
      </h2>
    </>
  );
}

export default function WalletPanel({ wallet }: WalletPanelProps) {
  const now = new Date();
  const claimEnabled = now >= CLAIM_ENABLED_DATE;

  const { data, isLoading, isError } = useMyPresaleContributions(wallet.isAuthenticated);

  const contributions = data?.contributions ?? [];
  const totals = data?.totals;

  return (
    <section className="border-b border-white/10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <Header />

        <WalletGate
          wallet={wallet}
          message="Conectá tu cartera digital para ver tu aporte, la fase en la que compraste y tus tokens liberados y pendientes."
        >
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/10 px-6 py-8 font-body text-sm text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando tus aportes…
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-6 py-8 font-body text-sm text-red-400">
              No pudimos cargar tus aportes. Probá recargar la página en un momento.
            </div>
          ) : contributions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 px-6 py-8 font-body text-sm text-white/40">
              Todavía no registraste ningún aporte con esta cartera. Cuando envíes tu comprobante
              en el paso 3, va a aparecer acá.
            </div>
          ) : (
            <>
              {/* Los totales cuentan solo lo validado: un aporte en revision
                  todavia no es un derecho sobre ningun token. */}
              <div className="grid gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/[0.04] via-transparent to-blue-500/[0.04] p-6 sm:grid-cols-3">
                <Metric label="Aportado (validado)" value={`$${totals?.usdt ?? 0} USDT`} />
                <Metric label="HACK asignados" value={formatNumber(totals?.hack ?? 0)} />
                <Metric label="En validación" value={String(totals?.pending_count ?? 0)} />
              </div>

              <ul className="mt-4 space-y-3">
                {contributions.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-white/80">
                        {formatNumber(c.hack)} HACK · ${c.usdt} USDT
                      </p>
                      <p className="mt-0.5 font-body text-xs text-white/30">
                        Fase {c.phase} ·{" "}
                        {new Date(c.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {c.status === "rejected" && c.rejection_reason && (
                        <p className="mt-1 font-body text-xs text-red-400">{c.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {c.proof_uri && (
                        <a
                          href={c.proof_uri.replace("ipfs://", "https://ipfs.io/ipfs/")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-body text-xs text-white/40 underline underline-offset-2 transition-colors hover:text-white/70"
                        >
                          Comprobante <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <StatusBadge status={c.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 font-body text-xs text-white/40 font-medium">
              <Lock className="h-3.5 w-3.5" />
              {claimEnabled
                ? "El reclamo ya está habilitado."
                : `El reclamo se habilita el ${CLAIM_ENABLED_DATE.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}.`}
            </p>
            <button
              disabled={!claimEnabled}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-5 py-2.5 font-title text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
            >
              Reclamar HACK
            </button>
          </div>
        </WalletGate>
      </motion.div>
    </section>
  );
}
