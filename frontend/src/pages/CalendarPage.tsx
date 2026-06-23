import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, CalendarPlus, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import { resolveIpfs } from '@/lib/ipfs';
import { buildGoogleCalendarUrl, downloadICS } from '@/utils/calendarUtils';
import { useCalendarEvents, type CalendarEvent } from '@/hooks/useCalendarEvents';

// ─── Constants ───────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const STATUS_DOT: Record<string, string> = {
  confirmed: 'bg-emerald-400',
  pending:   'bg-amber-400',
  completed: 'bg-slate-500',
};

const STATUS_LABEL_ES: Record<string, string> = {
  confirmed: 'Confirmada',
  pending:   'Pendiente',
  completed: 'Completada',
};
const STATUS_LABEL_EN: Record<string, string> = {
  confirmed: 'Confirmed',
  pending:   'Pending',
  completed: 'Completed',
};
const STATUS_TEXT: Record<string, string> = {
  confirmed: 'text-emerald-500',
  pending:   'text-amber-500',
  completed: 'text-slate-500',
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

function buildGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Monday-first: Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7;

  const days: Date[] = [];
  for (let i = startOffset; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }
  let nextDay = 1;
  while (days.length < 42) {
    days.push(new Date(year, month + 1, nextDay++));
  }
  return days;
}

function formatDayLabel(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(y, m - 1, d));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7">
      {[...Array(42)].map((_, i) => (
        <div key={i} className="flex flex-col items-center py-3 gap-1">
          <div className="h-7 w-7 rounded-full bg-white/[0.05] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function DayCell({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  events,
  onClick,
}: {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  onClick: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const dotStatuses = [...new Set(events.map(e => e.status))].slice(0, 3);

  const circleClass = [
    'h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full text-[13px] sm:text-[14px] leading-none font-medium transition-all duration-150',
    isCurrentMonth ? 'text-white' : 'text-slate-700',
    isSelected
      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-200'
      : isToday
      ? 'bg-white/[0.08]'
      : 'hover:bg-white/[0.05]',
  ].join(' ');

  return (
    <motion.button
      whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }}
      transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
      onClick={onClick}
      className="flex flex-col items-center py-2.5 sm:py-3 focus:outline-none"
      aria-pressed={isSelected}
      aria-label={`${date.getDate()}, ${events.length} clase${events.length !== 1 ? 's' : ''}`}
    >
      <div className={circleClass}>
        {date.getDate()}
      </div>
      <div className="h-2 flex items-center gap-[3px] mt-0.5">
        {dotStatuses.map(status => (
          <span
            key={status}
            className={[
              'h-1 w-1 rounded-full',
              STATUS_DOT[status] ?? 'bg-slate-600',
              !isCurrentMonth ? 'opacity-25' : '',
            ].join(' ')}
          />
        ))}
      </div>
    </motion.button>
  );
}

function EventAvatar({ photo, label }: { photo: string | null; label: string }) {
  const [failed, setFailed] = useState(false);
  const initial = label.trim()[0]?.toUpperCase() ?? '?';
  const src = resolveIpfs(photo);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={label}
        onError={() => setFailed(true)}
        className="h-9 w-9 rounded-full object-cover shrink-0 border border-white/[0.08]"
      />
    );
  }
  return (
    <div className="h-9 w-9 rounded-full bg-white/[0.12] border border-white/[0.1] flex items-center justify-center shrink-0 select-none">
      <span className="text-[12px] font-semibold text-slate-200 leading-none">{initial}</span>
    </div>
  );
}

function EventCalendarActions({ event }: { event: CalendarEvent }) {
  const { t } = useTranslation();

  const params = {
    title: event.className
      ? `Clase: ${event.className}`
      : `Clase con ${event.counterpartName ?? 'HackChain'}`,
    requestedDate: event.date,
    startTime: event.startTime,
    durationMinutes: event.durationMinutes,
    description: [
      event.counterpartName ? `Con: ${event.counterpartName}` : null,
      event.className ? `Clase: ${event.className}` : null,
      'Reservado a través de HackChain.',
    ].filter(Boolean).join('\n'),
    uid: `hackchain-class-${event.id}@hackchain.app`,
  };

  return (
    <div className="flex items-center gap-0.5 mt-2">
      <a
        href={buildGoogleCalendarUrl(params)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px] transition-colors duration-150"
      >
        <CalendarPlus className="h-3 w-3 shrink-0" />
        {t('calendar.googleCalendar')}
      </a>
      <button
        onClick={() => downloadICS(params)}
        className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] min-h-[36px] transition-colors duration-150"
        title={t('calendar.downloadIcs')}
      >
        <Download className="h-3 w-3 shrink-0" />
        .ics
      </button>
    </div>
  );
}

function EventRow({
  event,
  index,
  locale,
}: {
  event: CalendarEvent;
  index: number;
  locale: string;
}) {
  const { i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const label = event.counterpartName ?? 'HackChain';
  const statusLabels = i18n.language.startsWith('es') ? STATUS_LABEL_ES : STATUS_LABEL_EN;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, delay: Math.min(index, 5) * 0.04, ease: EASE }}
      className="border-b border-white/[0.05] last:border-b-0 py-3.5 flex items-start gap-3"
    >
      <EventAvatar photo={event.counterpartPhoto} label={label} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white truncate leading-snug">{label}</p>
            {event.className && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">{event.className}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 mt-[3px]">
            <span className={`h-[6px] w-[6px] rounded-full shrink-0 ${STATUS_DOT[event.status] ?? 'bg-slate-600'}`} />
            <span className={`text-[11px] font-medium ${STATUS_TEXT[event.status] ?? 'text-slate-500'}`}>
              {statusLabels[event.status] ?? event.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1.5 text-[12px] text-slate-600">
          <span className="tabular-nums">{event.startTime}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-[10px] w-[10px] shrink-0" />
            {event.durationMinutes} min
          </span>
        </div>

        {event.status === 'confirmed' && <EventCalendarActions event={event} />}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
};

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const directionRef = useRef(1);

  const { eventsByDate, isPending, isEducator } = useCalendarEvents();

  const locale = i18n.language.startsWith('es') ? 'es-MX' : 'en-US';
  const today = todayStr();
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;

  const grid = useMemo(() => buildGrid(currentMonth), [currentMonth]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(currentMonth),
    [currentMonth, locale],
  );

  // Monday-first day headers derived from locale
  const dayHeaders = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    // Start from Monday (2026-06-01 is a Monday — we use a known Monday as anchor)
    const anchor = new Date(2026, 5, 1); // Mon 1 Jun 2026
    return [...Array(7)].map((_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      return fmt.format(d);
    });
  }, [locale]);

  const selectedEvents = useMemo(
    () => (selectedDate ? (eventsByDate[selectedDate] ?? []) : []),
    [selectedDate, eventsByDate],
  );

  function goNext() {
    directionRef.current = 1;
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  function goPrev() {
    directionRef.current = -1;
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function goToday() {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), 1);
    const diff =
      (target.getFullYear() * 12 + target.getMonth()) -
      (currentMonth.getFullYear() * 12 + currentMonth.getMonth());
    directionRef.current = diff >= 0 ? 1 : -1;
    setCurrentMonth(target);
    setSelectedDate(todayStr());
  }

  function handleDayClick(date: Date) {
    const dateStr = toDateStr(date);

    // If clicked on an adjacent-month day, switch month too
    if (
      date.getMonth() !== currentMonth.getMonth() ||
      date.getFullYear() !== currentMonth.getFullYear()
    ) {
      const diff =
        (date.getFullYear() * 12 + date.getMonth()) -
        (currentMonth.getFullYear() * 12 + currentMonth.getMonth());
      directionRef.current = diff > 0 ? 1 : -1;
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }

    setSelectedDate(prev => (prev === dateStr ? null : dateStr));
  }

  return (
    <Layout>
      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.06]"
        style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.88)' }}
      >
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between h-14 gap-2">
            {/* Back */}
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={() => navigate(-1)}
              className="h-9 w-9 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              aria-label={t('common.back', 'Volver')}
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>

            {/* Month nav */}
            <div className="flex items-center gap-1.5 min-w-0">
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                onClick={goPrev}
                className="h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>

              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={monthKey}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14, ease: EASE }}
                  className="text-[15px] font-semibold text-white min-w-[148px] text-center capitalize select-none"
                >
                  {monthLabel}
                </motion.span>
              </AnimatePresence>

              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
                onClick={goNext}
                className="h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Today shortcut */}
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
              transition={{ type: 'spring', duration: 0.12, bounce: 0 }}
              onClick={goToday}
              className="text-[12px] font-medium text-purple-400 hover:text-purple-300 transition-colors min-h-[36px] px-2 shrink-0"
            >
              {t('calendar.today', 'Hoy')}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-md mx-auto px-3 sm:px-4 pb-28">

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1 mt-2">
          {dayHeaders.map((d, i) => (
            <div
              key={i}
              className="text-center py-1.5 text-[11px] font-medium text-slate-700 uppercase tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.04]" />

        {/* Calendar grid */}
        {isPending ? (
          <CalendarSkeleton />
        ) : (
          <div className="relative overflow-hidden">
            <AnimatePresence initial={false} mode="wait" custom={directionRef.current}>
              <motion.div
                key={monthKey}
                custom={directionRef.current}
                variants={shouldReduceMotion ? undefined : slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: EASE }}
                className="grid grid-cols-7"
              >
                {grid.map(date => {
                  const dateStr = toDateStr(date);
                  const isCurrentMonth =
                    date.getMonth() === currentMonth.getMonth() &&
                    date.getFullYear() === currentMonth.getFullYear();
                  const dayEvents = eventsByDate[dateStr] ?? [];

                  return (
                    <DayCell
                      key={dateStr}
                      date={date}
                      isCurrentMonth={isCurrentMonth}
                      isToday={dateStr === today}
                      isSelected={dateStr === selectedDate}
                      events={dayEvents}
                      onClick={() => handleDayClick(date)}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ── Selected day panel ── */}
        <div className="border-t border-white/[0.05] mt-1" />

        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              key={selectedDate}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE }}
              className="pt-4"
            >
              {/* Section label */}
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 mb-3 capitalize">
                {formatDayLabel(selectedDate, locale)}
              </p>

              {selectedEvents.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18, delay: 0.06 }}
                  className="text-sm text-slate-600 py-6 text-center"
                >
                  {t('calendar.noEvents', 'No hay clases este día.')}
                </motion.p>
              ) : (
                <div>
                  {selectedEvents
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((event, i) => (
                      <EventRow key={event.id} event={event} index={i} locale={locale} />
                    ))}
                </div>
              )}

              {/* Legend */}
              {!isPending && Object.keys(eventsByDate).length > 0 && selectedEvents.length === 0 && (
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.04]">
                  {Object.entries(STATUS_DOT).map(([status, dotClass]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                      <span className="text-[10px] text-slate-700 capitalize">
                        {i18n.language.startsWith('es') ? STATUS_LABEL_ES[status] : STATUS_LABEL_EN[status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — no events at all */}
        {!isPending && Object.keys(eventsByDate).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="flex flex-col items-center gap-3 py-10 text-center"
          >
            <p className="text-sm text-slate-500">
              {isEducator
                ? t('calendar.emptyEducator', 'Aún no tenés clases agendadas.')
                : t('calendar.emptyTalent', 'Aún no tenés clases agendadas. Explorá educadores y agenda tu primera sesión.')}
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
