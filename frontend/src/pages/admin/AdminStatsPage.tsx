// frontend/src/pages/admin/AdminStatsPage.tsx
//
// Admin landing — the "is everything ok?" view. Renders the cards
// returned by GET /api/admin/stats: educator counts, certificate
// volume, revenue + margin, treasury queue snapshot.
//
// Visual style reuses the project's `clay-*` shadows so the cards
// feel part of the same product as the other dashboards.

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, FileCheck2, Wallet, AlertTriangle, TrendingUp, Calendar, Receipt,
} from 'lucide-react';
import { adminApi } from '@/services/admin';

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone: 'purple' | 'pink' | 'cyan' | 'emerald' | 'amber' | 'indigo';
  to?: string;
};

const TONE_TO_SHADOW: Record<StatCardProps['tone'], string> = {
  purple:  'shadow-clay-purple',
  pink:    'shadow-clay-pink',
  cyan:    'shadow-clay-cyan',
  emerald: 'shadow-clay-emerald',
  amber:   'shadow-clay-amber',
  indigo:  'shadow-clay-indigo',
};

function StatCard({ label, value, hint, icon, tone, to }: StatCardProps) {
  const inner = (
    <div className={`rounded-squircle p-6 bg-background/70 backdrop-blur-sm border border-border/40 ${TONE_TO_SHADOW[tone]} transition-transform hover:scale-[1.01]`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-body">{label}</span>
        <span className="text-foreground/70">{icon}</span>
      </div>
      <p className="font-title text-3xl leading-none">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}

export default function AdminStatsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.stats(),
    refetchInterval: 30_000, // keep the dashboard fresh
  });

  if (error) {
    return (
      <section className="space-y-4">
        <h1 className="font-title text-3xl">Resumen</h1>
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          No se pudieron cargar las métricas.
        </div>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="font-title text-3xl">Resumen</h1>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-squircle" />
          ))}
        </div>
      </section>
    );
  }

  const { educators, certificates, revenue, treasury, generated_at } = data;
  const generatedAtLocal = new Date(generated_at).toLocaleString('es-AR');

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-title text-3xl">Resumen</h1>
          <p className="text-sm text-muted-foreground">
            Estado del sistema al {generatedAtLocal}.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          tone="purple"
          icon={<Users className="h-5 w-5" />}
          label="Educators pendientes"
          value={educators.pending}
          hint={`${educators.approved} aprobados · ${educators.rejected} rechazados`}
          to="/admin/educators"
        />
        <StatCard
          tone="cyan"
          icon={<FileCheck2 className="h-5 w-5" />}
          label="Certificados hoy"
          value={certificates.today}
          hint={`${certificates.last_7_days} en los últimos 7 días · ${certificates.total} totales`}
        />
        <StatCard
          tone="emerald"
          icon={<TrendingUp className="h-5 w-5" />}
          label="Margen neto"
          value={`$${revenue.margin_usd}`}
          hint={`Ingresos $${revenue.gross_usd} · Costo Harjoot $${revenue.harjoot_cost_usd}`}
        />
        <StatCard
          tone="amber"
          icon={<AlertTriangle className="h-5 w-5" />}
          label="USDT pendiente de envío"
          value={`$${treasury.outstanding_debt_usd}`}
          hint={`${treasury.awaiting_manual_conversion} esperando conversión manual`}
          to="/admin/treasury"
        />
        <StatCard
          tone="indigo"
          icon={<Wallet className="h-5 w-5" />}
          label="Treasury cobrado"
          value={treasury.sent}
          hint={`${treasury.failed} fallados · ${treasury.pending} en cola`}
          to="/admin/treasury"
        />
        <StatCard
          tone="pink"
          icon={<Receipt className="h-5 w-5" />}
          label="Pagos totales"
          value={`$${revenue.gross_usd}`}
          hint="Bruto histórico (status=confirmed)"
          to="/admin/payments"
        />
      </div>

      {/* Quick links / nudges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {educators.pending > 0 && (
          <Link
            to="/admin/educators"
            className="rounded-lg border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors flex items-center gap-3"
          >
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Tenés {educators.pending} educator{educators.pending === 1 ? '' : 's'} pendiente{educators.pending === 1 ? '' : 's'} de revisión.</p>
              <p className="text-xs text-muted-foreground">Andá a la pestaña Educators para resolverlas.</p>
            </div>
          </Link>
        )}
        {treasury.awaiting_manual_conversion > 0 && (
          <Link
            to="/admin/treasury"
            className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors flex items-center gap-3"
          >
            <Calendar className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-semibold text-sm">{treasury.awaiting_manual_conversion} batch{treasury.awaiting_manual_conversion === 1 ? '' : 'es'} esperan settlement manual.</p>
              <p className="text-xs text-muted-foreground">Convertí HACK→USDT y registralo en Treasury.</p>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
