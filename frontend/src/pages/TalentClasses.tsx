import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CalendarDays, Clock, BookOpen, ChevronRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { useMyClassRequests, type MyClassRequest } from '@/hooks/useMyClassRequests';

type StatusKey = 'pending' | 'confirmed' | 'cancelled' | 'completed';

const CARD_STYLES: Record<StatusKey, { wrapper: string; badge: string }> = {
  pending:   { wrapper: 'bg-amber-500/[0.06] border-amber-500/20',    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  confirmed: { wrapper: 'bg-emerald-500/[0.06] border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  cancelled: { wrapper: 'bg-white/[0.02] border-white/8',              badge: 'bg-white/5 text-slate-500 border-white/10' },
  completed: { wrapper: 'bg-purple-500/[0.05] border-purple-500/15',   badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-4 w-36 bg-white/8 rounded-full" />
        <div className="h-6 w-20 bg-white/8 rounded-lg shrink-0" />
      </div>
      <div className="h-3 w-28 bg-white/5 rounded-full mb-4" />
      <div className="h-px bg-white/5 mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="h-3 w-24 bg-white/5 rounded-full" />
          <div className="h-3 w-12 bg-white/5 rounded-full" />
        </div>
        <div className="h-3 w-16 bg-white/5 rounded-full" />
      </div>
    </div>
  );
}

function ClassCard({ req }: { req: MyClassRequest }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = req.status as StatusKey;
  const styles = CARD_STYLES[status] ?? CARD_STYLES.cancelled;
  const statusLabel = t(`classInbox.status.${req.status}`, req.status);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl border p-5 ${styles.wrapper}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-title text-[15px] font-semibold text-white leading-snug">
          {req.issuer_organization || `${req.issuer_wallet.slice(0, 6)}…${req.issuer_wallet.slice(-4)}`}
        </p>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border tracking-wide ${styles.badge}`}>
          {statusLabel}
        </span>
      </div>

      {req.class_name && (
        <div className="flex items-center gap-1.5 text-xs text-purple-400/80 mb-4">
          <BookOpen className="h-3 w-3 shrink-0" />
          <span className="truncate italic">{req.class_name}</span>
        </div>
      )}

      <div className="h-px bg-white/[0.06] mb-4" />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0 text-slate-500" />
            {formatDate(req.requested_date)} · {req.start_time}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0 text-slate-500" />
            {t('talentClasses.duration', { minutes: req.duration_minutes })}
          </span>
          {req.hourly_rate_usd && (
            <span className="text-slate-500 tabular-nums">
              {t('talentClasses.price', { amount: parseFloat(req.hourly_rate_usd).toFixed(0) })}
            </span>
          )}
        </div>

        <button
          onClick={() => navigate(`/educator/${req.issuer_wallet}`)}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-purple-400 transition-colors min-h-[44px] px-2 rounded-lg hover:bg-white/5 active:bg-white/8 -mr-2"
          aria-label={`Ver perfil de ${req.issuer_organization || req.issuer_wallet}`}
        >
          {t('talentClasses.viewProfile')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.article>
  );
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-white/8 text-[9px] font-bold text-slate-500 tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

export default function TalentClasses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: requests, isPending } = useMyClassRequests();

  const active  = requests?.filter((r) => r.status === 'pending' || r.status === 'confirmed') ?? [];
  const history = requests?.filter((r) => r.status === 'completed' || r.status === 'cancelled') ?? [];

  const pendingCount   = requests?.filter((r) => r.status === 'pending').length ?? 0;
  const confirmedCount = requests?.filter((r) => r.status === 'confirmed').length ?? 0;
  const totalCount     = requests?.length ?? 0;

  const hasAny = totalCount > 0;

  return (
    <Layout>
      <div className="min-h-screen font-body text-slate-200">
        {/* Top bar */}
        <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/8" style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.85)' }}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate('/dashboard/talent')}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors rounded-xl px-3 py-2.5 -ml-2 min-h-[44px]"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-sm">{t('talentClasses.backToDashboard')}</span>
            </button>

            <div className="flex items-center gap-2">
              <img src="/icons/libroNeon.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]" alt="" />
              <span className="font-title text-sm font-semibold text-white">{t('talentClasses.title')}</span>
              {confirmedCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tabular-nums">
                  {confirmedCount}
                </span>
              )}
            </div>

            <div className="w-[72px]" aria-hidden="true" />
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-28"
        >
          {/* Skeleton */}
          {isPending && (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty state */}
          {!isPending && !hasAny && (
            <div className="mt-16 flex flex-col items-center text-center px-4 space-y-5">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/8">
                <CalendarDays className="h-7 w-7 text-slate-600" />
              </div>
              <div className="space-y-1.5 max-w-[260px]">
                <p className="text-sm font-medium text-slate-400">{t('talentClasses.empty')}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{t('talentClasses.emptyHint')}</p>
              </div>
              <button
                onClick={() => navigate('/educators')}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-400 hover:bg-purple-500/15 hover:text-purple-300 transition-colors active:bg-purple-500/20"
              >
                {t('talentClasses.discover')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Active section */}
          {!isPending && active.length > 0 && (
            <section className="mb-8">
              <SectionLabel label={t('talentClasses.sectionActive')} count={pendingCount || undefined} />
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {active.map((req) => (
                    <ClassCard key={req.id} req={req} />
                  ))}
                </div>
              </AnimatePresence>
            </section>
          )}

          {/* History section */}
          {!isPending && history.length > 0 && (
            <section>
              <SectionLabel label={t('talentClasses.sectionHistory')} />
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {history.map((req) => (
                    <ClassCard key={req.id} req={req} />
                  ))}
                </div>
              </AnimatePresence>
            </section>
          )}
        </motion.main>
      </div>
    </Layout>
  );
}
