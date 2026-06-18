import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Flag,
  Calendar, CalendarPlus, Download, User,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useEducatorClassRequests, useUpdateClassRequestStatus, type EducatorClassRequest } from '@/hooks/useEducatorClassRequests';
import { buildGoogleCalendarUrl, downloadICS } from '@/utils/calendarUtils';

type FilterTab = 'all' | 'pending' | 'confirmed' | 'history';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATUS_DOT: Record<EducatorClassRequest['status'], string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-emerald-400',
  cancelled: 'bg-slate-600',
  completed: 'bg-slate-500',
};

const STATUS_TEXT: Record<EducatorClassRequest['status'], string> = {
  pending:   'text-amber-500',
  confirmed: 'text-emerald-500',
  cancelled: 'text-slate-600',
  completed: 'text-slate-500',
};

function formatDate(dateStr: string, locale: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function StudentAvatar({ name, wallet }: { name: string | null; wallet: string }) {
  const label = name ?? wallet;
  const initial = label.trim()[0]?.toUpperCase() ?? '?';
  return (
    <div className="h-10 w-10 rounded-full bg-white/[0.08] border border-white/[0.07] flex items-center justify-center shrink-0 select-none">
      <span className="text-[13px] font-semibold text-slate-400 leading-none">{initial}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.05] animate-pulse last:border-b-0">
      <div className="h-10 w-10 rounded-full bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 bg-white/[0.07] rounded-full" />
        <div className="h-2.5 w-52 bg-white/[0.04] rounded-full" />
      </div>
      <div className="h-3 w-14 bg-white/[0.04] rounded-full shrink-0" />
    </div>
  );
}

function RequestRow({ request, index }: { request: EducatorClassRequest; index: number }) {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateClassRequestStatus();
  const locale = i18n.language.startsWith('es') ? 'es-MX' : 'en-US';
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const status = request.status;
  const displayName = request.student_name
    ? request.student_name
    : `${request.student_wallet.slice(0, 6)}…${request.student_wallet.slice(-4)}`;

  const canConfirm  = status === 'pending';
  const canCancel   = status === 'pending' || status === 'confirmed';
  const canComplete = status === 'confirmed';

  const calendarParams = {
    title: request.class_name
      ? `Clase: ${request.class_name}`
      : `Clase con ${request.student_name ?? 'estudiante'}`,
    requestedDate: request.requested_date,
    startTime: request.start_time,
    durationMinutes: request.duration_minutes,
    description: [
      request.student_name ? `Estudiante: ${request.student_name}` : null,
      request.class_name   ? `Clase: ${request.class_name}` : null,
      'Sesión privada reservada a través de HackChain.',
    ].filter(Boolean).join('\n'),
    uid: `hackchain-class-${request.id}@hackchain.app`,
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 5) * 0.038, ease: EASE }}
      className="border-b border-white/[0.05] last:border-b-0 group"
    >
      <div className="flex items-start gap-3 py-3.5">
        <StudentAvatar name={request.student_name} wallet={request.student_wallet} />

        <div className="flex-1 min-w-0">
          {/* Name + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white truncate leading-snug">
                {displayName}
              </p>
              {request.class_name && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{request.class_name}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mt-[3px]">
              <span className={`h-[6px] w-[6px] rounded-full shrink-0 ${STATUS_DOT[status]}`} />
              <span className={`text-[11px] font-medium ${STATUS_TEXT[status]}`}>
                {t(`educatorClassRequests.status.${status}`)}
              </span>
            </div>
          </div>

          {/* Date / time / duration */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[12px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-[11px] w-[11px] shrink-0" />
              {formatDate(request.requested_date, locale)} · {request.start_time}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-[11px] w-[11px] shrink-0" />
              {request.duration_minutes} min
            </span>
            {request.hourly_rate_usd != null && (
              <span className="tabular-nums">${request.hourly_rate_usd} USD</span>
            )}
          </div>

          {/* Student message — no box, just inline italic */}
          {request.student_message && (
            <p className="mt-1.5 text-[12px] text-slate-600 italic leading-relaxed line-clamp-2">
              "{request.student_message}"
            </p>
          )}

          {/* Actions */}
          {(canConfirm || canCancel || canComplete) && !confirmCancel && (
            <div className="flex items-center gap-0.5 mt-2.5">
              {canConfirm && (
                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                  disabled={isUpdating}
                  onClick={() => updateStatus({ id: request.id, status: 'confirmed' })}
                  className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 hover:text-emerald-400 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/[0.07] min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  {t('educatorClassRequests.actions.confirm')}
                </motion.button>
              )}
              {canComplete && (
                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                  disabled={isUpdating}
                  onClick={() => updateStatus({ id: request.id, status: 'completed' })}
                  className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-purple-400 px-2.5 py-1.5 rounded-lg hover:bg-purple-500/[0.06] min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <Flag className="h-3.5 w-3.5 shrink-0" />
                  {t('educatorClassRequests.actions.complete')}
                </motion.button>
              )}
              {canCancel && (
                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                  disabled={isUpdating}
                  onClick={() => setConfirmCancel(true)}
                  className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  {t('educatorClassRequests.actions.cancel')}
                </motion.button>
              )}
            </div>
          )}

          {/* Cancel confirm panel */}
          <AnimatePresence>
            {confirmCancel && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.14, ease: EASE }}
                className="mt-2.5 flex flex-col gap-1.5"
              >
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={t('educatorClassRequests.cancelReasonPlaceholder', 'Motivo de cancelación (opcional)')}
                  maxLength={500}
                  rows={2}
                  className="w-full text-[11px] text-slate-300 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-white/[0.15] transition-colors duration-150"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500 mr-1">
                    {t('educatorClassRequests.confirmCancel', '¿Cancelar esta clase?')}
                  </span>
                  <motion.button
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                    transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                    disabled={isUpdating}
                    onClick={() => updateStatus({
                      id: request.id,
                      status: 'cancelled',
                      cancellationReason: cancelReason.trim() || undefined,
                    })}
                    className="text-[11px] font-medium text-red-500 hover:text-red-400 min-h-[36px] px-2 rounded-lg hover:bg-red-500/[0.07] disabled:opacity-40 transition-colors duration-150"
                  >
                    {t('educatorClassRequests.cancelYes', 'Sí, cancelar')}
                  </motion.button>
                  <motion.button
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                    transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                    onClick={() => { setConfirmCancel(false); setCancelReason(''); }}
                    className="text-[11px] text-slate-600 hover:text-slate-300 min-h-[36px] px-2 rounded-lg hover:bg-white/[0.05] transition-colors duration-150"
                  >
                    {t('educatorClassRequests.cancelNo', 'No')}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Calendar shortcuts — confirmed only */}
          {status === 'confirmed' && (
            <div className="flex items-center gap-0.5 mt-1">
              <motion.a
                href={buildGoogleCalendarUrl(calendarParams)}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px] transition-colors duration-150"
              >
                <CalendarPlus className="h-3 w-3 shrink-0" />
                {t('calendar.googleCalendar')}
              </motion.a>
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                onClick={() => downloadICS(calendarParams)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px] transition-colors duration-150"
                title={t('calendar.downloadIcs')}
              >
                <Download className="h-3 w-3 shrink-0" />
                .ics
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const TABS: { id: FilterTab; labelKey: string }[] = [
  { id: 'all',       labelKey: 'educatorClassRequests.tabs.all' },
  { id: 'pending',   labelKey: 'educatorClassRequests.tabs.pending' },
  { id: 'confirmed', labelKey: 'educatorClassRequests.tabs.confirmed' },
  { id: 'history',   labelKey: 'educatorClassRequests.tabs.history' },
];

export default function EducatorClassRequests() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const { data, isPending } = useEducatorClassRequests();

  const all = data ?? [];

  const filtered = all.filter(r => {
    if (activeTab === 'all')       return true;
    if (activeTab === 'pending')   return r.status === 'pending';
    if (activeTab === 'confirmed') return r.status === 'confirmed';
    if (activeTab === 'history')   return r.status === 'cancelled' || r.status === 'completed';
    return true;
  });

  const pendingCount = all.filter(r => r.status === 'pending').length;

  return (
    <Layout>
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.06]"
        style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.88)' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-2">
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={() => navigate(-1)}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] shrink-0 transition-colors"
              aria-label={t('educatorClassRequests.back')}
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>

            <div className="flex items-center gap-2">
              <img
                src="/icons/maletinNeon.avif"
                alt=""
                className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0"
              />
              <h1 className="font-title text-sm font-semibold text-white">
                {t('educatorClassRequests.title')}
              </h1>

              {/* Pending badge — springs in/out */}
              <AnimatePresence mode="popLayout">
                {pendingCount > 0 && (
                  <motion.span
                    key={pendingCount}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', duration: 0.28, bounce: 0.25 }
                    }
                    className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 tabular-nums"
                  >
                    {pendingCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={() => navigate('/calendar')}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label="Ver calendario"
            >
              <Calendar className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Filter tabs — layoutId underline slides */}
          <div className="flex border-b border-white/[0.08] -mb-px">
            {TABS.map(tab => {
              const count =
                tab.id === 'all'       ? all.length
                : tab.id === 'pending'   ? all.filter(r => r.status === 'pending').length
                : tab.id === 'confirmed' ? all.filter(r => r.status === 'confirmed').length
                : all.filter(r => r.status === 'cancelled' || r.status === 'completed').length;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t(tab.labelKey)}
                  {count > 0 && (
                    <span className={`text-[10px] tabular-nums transition-colors duration-150 ${
                      isActive ? 'text-purple-400' : 'text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator-edu"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500"
                      transition={shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', duration: 0.38, bounce: 0.12 }
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-28">

        {/* Skeleton */}
        {isPending && (
          <div>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isPending && filtered.length === 0 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="flex flex-col items-center justify-center py-24 text-center gap-3"
          >
            <User className="h-7 w-7 text-slate-700" />
            <p className="text-sm text-slate-500">
              {activeTab === 'pending'
                ? t('educatorClassRequests.empty.pending')
                : t('educatorClassRequests.empty.other')}
            </p>
          </motion.div>
        )}

        {/* List */}
        {!isPending && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              {filtered.map((req, i) => (
                <RequestRow key={req.id} request={req} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
}
