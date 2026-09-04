import { motion } from "framer-motion";
import { Wallet, Lock } from "lucide-react";
import { CLAIM_ENABLED_DATE, formatNumber } from "@/utils/presale";

interface WalletPanelProps {
  walletConnected: boolean;
  onConnect: () => void;
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

export default function WalletPanel({ walletConnected, onConnect }: WalletPanelProps) {
  const now = new Date();
  const claimEnabled = now >= CLAIM_ENABLED_DATE;

  // Mock: en integración real esto viene de M-09 filtrado por dirección conectada
  const mockOwnContribution = {
    usdt: 50,
    hack: 1_666_666,
    phase: "Primera",
    released: 0,
    pending: 1_666_666,
  };

  if (!walletConnected) {
    return (
      <section className="border-b border-white/10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
            Tu aporte
          </span>
          <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-6">
            Panel <span className="gradient-text">individual</span>
          </h2>
          <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-white/15 px-6 py-8">
            <p className="font-body text-sm text-white/50 leading-relaxed font-medium">
              Conectá tu cartera digital para ver tu aporte, la fase en la que compraste y tus
              tokens liberados y pendientes.
            </p>
            <button
              onClick={onConnect}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 hover:border-white/30 px-5 py-2.5 font-title text-sm font-bold text-white/80 hover:text-white transition-all"
            >
              <Wallet className="h-4 w-4" /> Conectar cartera digital
            </button>
          </div>
        </motion.div>
      </section>
    );
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
          Tu aporte
        </span>
        <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-6">
          Panel <span className="gradient-text">individual</span>
        </h2>

        <div className="grid gap-4 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/[0.04] via-transparent to-blue-500/[0.04] p-6 sm:grid-cols-2">
          <Metric label="Fase" value={mockOwnContribution.phase} />
          <Metric label="Aportado" value={`$${mockOwnContribution.usdt} USDT`} />
          <Metric label="HACK asignados" value={formatNumber(mockOwnContribution.hack)} />
          <Metric label="Liberados" value={formatNumber(mockOwnContribution.released)} />
          <Metric label="Pendientes" value={formatNumber(mockOwnContribution.pending)} />
        </div>

        <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-body text-xs text-white/40 font-medium">
            <Lock className="h-3.5 w-3.5" />
            {claimEnabled
              ? "El reclamo ya está habilitado."
              : `El reclamo se habilita el ${CLAIM_ENABLED_DATE.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}.`}
          </p>
          <button
            disabled={!claimEnabled}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-5 py-2.5 font-title text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
          >
            Reclamar HACK
          </button>
        </div>
      </motion.div>
    </section>
  );
}