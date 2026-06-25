import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CalendarDays, Clock, ChevronRight, CalendarPlus, Download, Calendar, Award } from 'lucide-react';
import Layout from '@/components/Layout';
import { resolveIpfs } from '@/lib/ipfs';
import { useMyClassRequests, useCancelClassRequest, type MyClassRequest } from '@/hooks/useMyClassRequests';
import { buildGoogleCalendarUrl, downloadICS } from '@/utils/calendarUtils';

type StatusKey = 'pending' | 'confirmed' | 'cancelled' | 'completed';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATUS_DOT: Record<StatusKey, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-emerald-400',
  cancelled: 'bg-slate-600',
  completed: 'bg-slate-500',
};

const STATUS_TEXT: Record<StatusKey, string> = {
  pending:   'text-amber-500',
  confirmed: 'text-emerald-500',
  cancelled: 'text-slate-600',
  completed: 'text-slate-500',
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function EduAvatar({ photo, label }: { photo: string | null; label: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = label.trim()[0]?.toUpperCase() ?? '?';

  const resolvedSrc = resolveIpfs(photo);

  if (resolvedSrc && !imgFailed) {
    return (
      <img
        src={resolvedSrc}
        alt={label}
        className="h-10 w-10 rounded-full object-cover shrink-0 border border-white/[0.08]"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-white/[0.12] border border-white/[0.1] flex items-center justify-center shrink-0 select-none">
      <span className="text-[13px] font-semibold text-slate-200 leading-none">{initial}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.05] animate-pulse last:border-b-0">
      <div className="h-10 w-10 rounded-full bg-white/[0.06] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-36 bg-white/[0.07] rounded-full" />
        <div className="h-2.5 w-52 bg-white/[0.04] rounded-full" />
      </div>
      <div className="h-3 w-14 bg-white/[0.04] rounded-full shrink-0" />
    </div>
  );
}

function CalendarActions({ req }: { req: MyClassRequest }) {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const title = req.class_name
    ? `Clase: ${req.class_name}`
    : req.issuer_organization
    ? `Clase con ${req.issuer_organization}`
    : 'Clase — HackChain';

  const params = {
    title,
    requestedDate: req.requested_date,
    startTime: req.start_time,
    durationMinutes: req.duration_minutes,
    description: [
      req.issuer_organization ? `Educador: ${req.issuer_organization}` : null,
      req.class_name ? `Clase: ${req.class_name}` : null,
      'Sesión privada reservada a través de HackChain.',
    ].filter(Boolean).join('\n'),
    uid: `hackchain-class-${req.id}@hackchain.app`,
  };

  return (
    <div className="flex items-center gap-0.5 mt-2">
      <motion.a
        href={buildGoogleCalendarUrl(params)}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px]"
        style={{ transition: 'color 150ms ease-out, background-color 150ms ease-out' }}
      >
        <CalendarPlus className="h-3 w-3 shrink-0" />
        {t('calendar.googleCalendar')}
      </motion.a>
      <motion.button
        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
        onClick={() => downloadICS(params)}
        className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px]"
        style={{ transition: 'color 150ms ease-out, background-color 150ms ease-out' }}
        title={t('calendar.downloadIcs')}
      >
        <Download className="h-3 w-3 shrink-0" />
        .ics
      </motion.button>
    </div>
  );
}

function ClassRow({ req, index }: { req: MyClassRequest; index: number }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelClassRequest();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const status = req.status as StatusKey;
  const statusLabel = t(`classInbox.status.${status}`, status);
  const label = req.issuer_organization || req.issuer_wallet;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index, 5) * 0.038, ease: EASE }}
      className="border-b border-white/[0.05] last:border-b-0 group"
    >
      <div className="flex items-start gap-3 py-3.5">
        <EduAvatar photo={req.issuer_photo} label={label} />

        <div className="flex-1 min-w-0">
          {/* Row header: name + status */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white truncate leading-snug">
                {req.issuer_organization
                  ? req.issuer_organization
                  : `${req.issuer_wallet.slice(0, 6)}…${req.issuer_wallet.slice(-4)}`}
              </p>
              {req.class_name && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{req.class_name}</p>
              )}
            </div>

            {/* Status: dot + label — no border, no background */}
            <div className="flex items-center gap-1.5 shrink-0 mt-[3px]">
              <span className={`h-[6px] w-[6px] rounded-full shrink-0 ${STATUS_DOT[status]}`} />
              <span className={`text-[11px] font-medium ${STATUS_TEXT[status]}`}>{statusLabel}</span>
            </div>
          </div>

          {/* Meta: date + time + duration */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[12px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-[11px] w-[11px] shrink-0" />
              {formatDate(req.requested_date)} · {req.start_time}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-[11px] w-[11px] shrink-0" />
              {req.duration_minutes} min
            </span>
            {req.hourly_rate_usd && (
              <span className="tabular-nums">
                ${parseFloat(String(req.hourly_rate_usd)).toFixed(0)} USD
              </span>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-between mt-1.5">
            <button
              onClick={() => navigate(`/educator/${req.issuer_wallet}`)}
              className="inline-flex items-center gap-0.5 text-[12px] text-slate-600 hover:text-slate-300 min-h-[36px] -ml-0.5 px-1 rounded-lg"
              style={{ transition: 'color 150ms ease-out' }}
              aria-label={`Ver perfil de ${label}`}
            >
              {t('talentClasses.viewProfile')}
              <ChevronRight className="h-3 w-3 shrink-0" />
            </button>

            {/* Cancel — only for pending requests */}
            {status === 'pending' && (
              <AnimatePresence mode="wait" initial={false}>
                {confirmCancel ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={{ duration: 0.14, ease: EASE }}
                    className="flex flex-col items-end gap-1.5 w-full"
                  >
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder={t('talentClasses.cancelReasonPlaceholder', 'Motivo (opcional)')}
                      maxLength={500}
                      rows={2}
                      className="w-full text-[11px] text-slate-300 placeholder:text-slate-600 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-white/[0.15] transition-colors duration-150"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 mr-1">
                        {t('talentClasses.confirmCancel', '¿Retirar?')}
                      </span>
                      <motion.button
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                        transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                        disabled={isCancelling}
                        onClick={() => cancelRequest({ id: req.id, reason: cancelReason.trim() || undefined })}
                        className="text-[11px] font-medium text-red-500 hover:text-red-400 min-h-[36px] px-2 rounded-lg hover:bg-red-500/[0.07] disabled:opacity-40 transition-colors duration-150"
                      >
                        {t('talentClasses.cancelYes', 'Sí')}
                      </motion.button>
                      <motion.button
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                        transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                        onClick={() => { setConfirmCancel(false); setCancelReason(''); }}
                        className="text-[11px] text-slate-600 hover:text-slate-300 min-h-[36px] px-2 rounded-lg hover:bg-white/[0.05] transition-colors duration-150"
                      >
                        {t('talentClasses.cancelNo', 'No')}
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="trigger"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                    onClick={() => setConfirmCancel(true)}
                    className="text-[11px] text-slate-400 hover:text-red-400 min-h-[36px] px-2 rounded-lg hover:bg-red-500/[0.06] transition-colors duration-150"
                  >
                    {t('talentClasses.cancelRequest', 'Cancelar')}
                  </motion.button>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Pending: remind the talent what class and where to check status */}
          {status === 'pending' && (
            <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
              {req.class_name
                ? t('talentClasses.pendingTopicHint', { topic: req.class_name })
                : null}
              {' '}{t('talentClasses.pendingStatusHint')}
            </p>
          )}

          {/* Calendar shortcuts — confirmed only */}
          {status === 'confirmed' && <CalendarActions req={req} />}

          {/* Completed: link to certificates */}
          {status === 'completed' && (
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={() => navigate('/dashboard/talent')}
              className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-purple-400 hover:text-purple-300 min-h-[36px] -ml-0.5 px-1 rounded-lg"
              style={{ transition: 'color 150ms ease-out' }}
            >
              <Award className="h-3 w-3 shrink-0" />
              {t('talentClasses.viewCertificate')}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </span>
      {count != null && count > 0 && (
        <span className="text-[10px] font-bold text-slate-700 tabular-nums">{count}</span>
      )}
    </div>
  );
}

const HISTORY_PAGE_SIZE = 5;

export default function TalentClasses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { data: requests, isPending } = useMyClassRequests();
  const [historyVisible, setHistoryVisible] = useState(HISTORY_PAGE_SIZE);

  const active  = requests?.filter(r => r.status === 'pending' || r.status === 'confirmed') ?? [];
  const history = requests?.filter(r => r.status === 'completed' || r.status === 'cancelled') ?? [];
  const historySlice = history.slice(0, historyVisible);
  const hasMoreHistory = historyVisible < history.length;
  const pendingCount   = requests?.filter(r => r.status === 'pending').length ?? 0;
  const confirmedCount = requests?.filter(r => r.status === 'confirmed').length ?? 0;
  const hasAny = (requests?.length ?? 0) > 0;

  return (
    <Layout>
      <div className="min-h-screen font-body text-slate-200">
        {/* Header */}
        <div
          className="sticky top-0 z-20 border-b border-white/[0.06]"
          style={{
            backgroundColor: 'oklch(0.11 0.012 280 / 0.92)',
            backdropFilter: 'blur(20px) saturate(1.4)',
          }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={() => navigate('/dashboard/talent')}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/[0.06] shrink-0"
              style={{ transition: 'color 150ms ease-out, background-color 150ms ease-out' }}
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>

            <div className="flex-1 min-w-0">
              <h1 className="font-title text-[15px] font-semibold text-white leading-none truncate">
                {t('talentClasses.title')}
              </h1>
              {confirmedCount > 0 && (
                <p className="text-[11px] text-emerald-500 mt-0.5 leading-none">
                  {confirmedCount} {t('talentClasses.confirmed')}
                </p>
              )}
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
        </div>

        <motion.main
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-28"
        >
          {/* Loading */}
          {isPending && (
            <div>
              {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!isPending && !hasAny && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="mt-24 flex flex-col items-center text-center gap-3"
            >
              <CalendarDays className="h-7 w-7 text-slate-700" />
              <div className="space-y-1 max-w-[220px]">
                <p className="text-sm font-medium text-slate-400">{t('talentClasses.empty')}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{t('talentClasses.emptyHint')}</p>
              </div>
              <button
                onClick={() => navigate('/educators')}
                className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 mt-1 min-h-[44px]"
                style={{ transition: 'color 150ms ease-out' }}
              >
                {t('talentClasses.discover')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* Active classes */}
          {!isPending && active.length > 0 && (
            <section className="mb-5">
              <SectionLabel
                label={t('talentClasses.sectionActive')}
                count={pendingCount || undefined}
              />
              <AnimatePresence mode="popLayout">
                {active.map((req, i) => (
                  <ClassRow key={req.id} req={req} index={i} />
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* History */}
          {!isPending && history.length > 0 && (
            <section>
              <SectionLabel label={t('talentClasses.sectionHistory')} count={history.length} />
              <AnimatePresence mode="popLayout">
                {historySlice.map((req, i) => (
                  <ClassRow key={req.id} req={req} index={i} />
                ))}
              </AnimatePresence>

              {hasMoreHistory && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                  onClick={() => setHistoryVisible(v => v + HISTORY_PAGE_SIZE)}
                  className="w-full mt-2 py-2.5 text-[12px] text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/[0.04] transition-colors duration-150"
                >
                  {t('talentClasses.showMore', { count: Math.min(HISTORY_PAGE_SIZE, history.length - historyVisible) })}
                </motion.button>
              )}
            </section>
          )}
        </motion.main>
      </div>
    </Layout>
  );
}
