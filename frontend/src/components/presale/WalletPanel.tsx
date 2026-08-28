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
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-zinc-100">{value}</p>
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
      <section className="border-b border-zinc-800 py-10">
        <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Tu aporte</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-50">Panel individual</h2>
        <div className="mt-4 flex flex-col items-start gap-3 rounded-lg border border-dashed border-zinc-700 px-5 py-6">
          <p className="text-sm text-zinc-400">
            Conectá tu cartera digital para ver tu aporte, la fase en la que compraste y tus
            tokens liberados y pendientes.
          </p>
          <button
            onClick={onConnect}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500"
          >
            <Wallet className="h-4 w-4" /> Conectar cartera digital
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-zinc-800 py-10">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Tu aporte</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">Panel individual</h2>

      <div className="mt-5 grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 sm:grid-cols-2">
        <Metric label="Fase" value={mockOwnContribution.phase} />
        <Metric label="Aportado" value={`$${mockOwnContribution.usdt} USDT`} />
        <Metric label="HACK asignados" value={formatNumber(mockOwnContribution.hack)} />
        <Metric label="Liberados" value={formatNumber(mockOwnContribution.released)} />
        <Metric label="Pendientes" value={formatNumber(mockOwnContribution.pending)} />
      </div>

      <div className="mt-4 flex flex-col items-start gap-2 rounded-md border border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-zinc-500">
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
          className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          Reclamar HACK
        </button>
      </div>
    </section>
  );
}
