import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock, BookOpen, Building2 } from 'lucide-react';
import { useMyClassRequests } from '@/hooks/useMyClassRequests';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MyClassRequestsSection() {
  const { t } = useTranslation();
  const { data: requests, isPending } = useMyClassRequests();
  const navigate = useNavigate();

  const sorted = requests
    ? [...requests].sort((a, b) => {
        const order = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      })
    : [];

  return (
    <section className="relative mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-title text-sm font-bold uppercase tracking-[0.18em] text-white/40">
          {t('myClassRequests.title', 'Mis solicitudes de clase')}
        </h2>
        {requests && requests.filter((r) => r.status === 'confirmed').length > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
            {requests.filter((r) => r.status === 'confirmed').length}
          </span>
        )}
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
          <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-t-purple-400 animate-spin" />
          {t('myClassRequests.loading', 'Cargando solicitudes...')}
        </div>
      )}

      {!isPending && sorted.length === 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/6 px-6 py-8 text-center space-y-3">
          <CalendarDays className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-500">{t('myClassRequests.empty', 'Todavía no solicitaste ninguna clase.')}</p>
          <button
            onClick={() => navigate('/educators')}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            {t('myClassRequests.discover', 'Explorar educadores →')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((req) => (
          <div
            key={req.id}
            className="relative rounded-2xl bg-white/[0.03] border border-white/8 p-4 sm:p-5 hover:border-white/15 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 font-title text-sm font-bold text-white truncate">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {req.issuer_organization || `${req.issuer_wallet.slice(0, 6)}…${req.issuer_wallet.slice(-4)}`}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[req.status] ?? ''}`}>
                    {t(`classInbox.status.${req.status}`, req.status)}
                  </span>
                </div>

                {req.class_name && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-400">
                    <BookOpen className="h-3 w-3 shrink-0" />
                    <span className="truncate">{req.class_name}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {formatDate(req.requested_date)} · {req.start_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {req.duration_minutes} {t('classInbox.min', 'min')}
                  </span>
                  {req.hourly_rate_usd && (
                    <span className="text-slate-500">${parseFloat(req.hourly_rate_usd).toFixed(0)}/h</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate(`/educator/${req.issuer_wallet}`)}
                className="shrink-0 text-xs text-slate-500 hover:text-purple-400 transition-colors self-start sm:self-center min-h-[44px] px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                {t('myClassRequests.viewProfile', 'Ver perfil →')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
