import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, CalendarDays, Loader2,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEducatorProfile } from '@/hooks/useEducatorProfile';
import { useTranslation } from 'react-i18next';
import { P } from '@/components/profile/palette';
import { GrainOverlay } from '@/components/profile/GrainOverlay';
import { resolveIpfs } from '@/lib/ipfs';
import { generateSlots, getUpcomingDays } from '@/lib/slots';
import type { UpcomingDay } from '@/lib/slots';
import type { ClassSettings } from '@/types/dashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name: string | null, lastname: string | null, org: string): string {
  const source = [name, lastname].filter(Boolean).join(' ') || org;
  return source.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDayLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

function formatFullDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

// ---------------------------------------------------------------------------
// Slot picker
// ---------------------------------------------------------------------------

interface SlotPickerProps {
  settings: ClassSettings;
  locale: string;
  t: (key: string) => string;
  prefersReduced: boolean | null;
}

function SlotPicker({ settings, locale, t, prefersReduced }: SlotPickerProps) {
  const { durations, availability } = settings;

  const upcomingDays: UpcomingDay[] = availability ? getUpcomingDays(availability, 21) : [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(durations?.[0] ?? 60);

  const selectedDay = upcomingDays[selectedDayIdx];
  const slots =
    selectedDay && availability
      ? generateSlots(
          availability[selectedDay.dayKey].start,
          availability[selectedDay.dayKey].end,
          selectedDuration
        )
      : [];

  if (!upcomingDays.length) {
    return (
      <p className="text-sm" style={{ color: P.textMuted }}>
        {t('bookClass.noAvailability')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Duration filter */}
      {durations && durations.length > 1 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: P.textMuted }}>
            {t('bookClass.durationLabel')}
          </p>
          <div className="flex flex-wrap gap-2">
            {durations.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setSelectedDuration(min)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: selectedDuration === min ? P.accent : P.surface,
                  color: selectedDuration === min ? P.bg : P.textSecondary,
                  border: `1px solid ${selectedDuration === min ? P.accent : P.border}`,
                }}
              >
                {selectedDuration === min && <Check className="h-3.5 w-3.5" />}
                <Clock className="h-3.5 w-3.5 opacity-60" />
                <span className="font-mono tabular-nums">{min}</span> {t('bookClass.min')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day navigator */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: P.textMuted }}>
          {t('bookClass.selectDay')}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={t('bookClass.prevDay')}
            onClick={() => setSelectedDayIdx((i) => Math.max(0, i - 1))}
            disabled={selectedDayIdx === 0}
            className="p-2 rounded-xl transition-colors disabled:opacity-30 shrink-0"
            style={{ backgroundColor: P.surface, border: `1px solid ${P.border}`, color: P.textMuted }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-2 min-w-max">
              {upcomingDays.map((day, idx) => {
                const active = idx === selectedDayIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDayIdx(idx)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-[0.97]"
                    style={{
                      backgroundColor: active ? P.accent : P.surface,
                      color: active ? P.bg : P.textSecondary,
                      border: `1px solid ${active ? P.accent : P.border}`,
                    }}
                  >
                    {formatDayLabel(day.date, locale)}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            aria-label={t('bookClass.nextDay')}
            onClick={() => setSelectedDayIdx((i) => Math.min(upcomingDays.length - 1, i + 1))}
            disabled={selectedDayIdx === upcomingDays.length - 1}
            className="p-2 rounded-xl transition-colors disabled:opacity-30 shrink-0"
            style={{ backgroundColor: P.surface, border: `1px solid ${P.border}`, color: P.textMuted }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {selectedDay && (
          <p className="mt-2 text-sm" style={{ color: P.textSecondary }}>
            {formatFullDate(selectedDay.date, locale)}
          </p>
        )}
      </div>

      {/* Slot grid */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: P.textMuted }}>
          {t('bookClass.selectSlot')}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedDayIdx}-${selectedDuration}`}
            initial={prefersReduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-2"
          >
            {slots.length === 0 ? (
              <p className="text-sm" style={{ color: P.textMuted }}>
                {t('bookClass.noSlots')}
              </p>
            ) : (
              slots.map((slot) => (
                <div
                  key={slot.start}
                  className="group relative px-4 py-2.5 rounded-xl text-sm font-mono tabular-nums cursor-not-allowed transition-all"
                  style={{
                    backgroundColor: P.surface,
                    border: `1px solid ${P.border}`,
                    color: P.textSecondary,
                  }}
                  title={t('bookClass.comingSoon')}
                >
                  {slot.start}
                  <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ backgroundColor: P.accentSoft }}
                  >
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.12em]" style={{ color: P.accent }}>
                      {t('bookClass.comingSoon')}
                    </span>
                  </span>
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const BookEducatorClass = () => {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const prefersReduced = useReducedMotion();
  const { data: educator, isPending, isError } = useEducatorProfile(wallet);

  const cs = educator?.class_settings;
  const displayName =
    [educator?.name, educator?.lastname].filter(Boolean).join(' ') ||
    educator?.organization_name ||
    '—';

  if (isPending) {
    return (
      <Layout>
        <GrainOverlay />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: P.accent }} />
        </div>
      </Layout>
    );
  }

  if (isError || !educator || !cs) {
    return (
      <Layout>
        <GrainOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
          <CalendarDays className="h-10 w-10 opacity-20" style={{ color: P.textMuted }} />
          <p className="text-sm" style={{ color: P.textMuted }}>
            {t('bookClass.notAvailable')}
          </p>
          <button
            onClick={() => navigate(`/educator/${wallet}`)}
            className="text-sm transition-colors"
            style={{ color: P.accent }}
          >
            {t('bookClass.backToProfile')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <GrainOverlay />

      <div className="min-h-screen font-body" style={{ color: P.textPrimary }}>
        {/* Sticky top bar */}
        <div
          className="sticky top-0 z-20 backdrop-blur-xl"
          style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.80)', borderBottom: `1px solid ${P.borderSub}` }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <button
              onClick={() => navigate(`/educator/${wallet}`)}
              className="flex items-center gap-2 text-sm transition-colors rounded-full px-2 py-1.5 -ml-2"
              style={{ color: P.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = P.textPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = P.textMuted)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('bookClass.backToProfile')}</span>
            </button>
          </div>
        </div>

        <motion.main
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-28 space-y-6"
        >
          {/* Educator identity strip */}
          <div className="flex items-center gap-4">
            <Avatar
              className="shrink-0 rounded-2xl"
              style={{ width: 52, height: 52, border: `1px solid ${P.border}`, backgroundColor: P.surface }}
            >
              <AvatarImage
                src={resolveIpfs(educator.photo_url)}
                alt={displayName}
                className="rounded-2xl object-cover"
              />
              <AvatarFallback
                className="text-base font-bold rounded-2xl"
                style={{ backgroundColor: P.surface, color: P.accent }}
              >
                {initials(educator.name, educator.lastname, educator.organization_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] uppercase tracking-[0.20em] font-semibold mb-0.5" style={{ color: P.accent }}>
                {t('bookClass.privateLessonWith')}
              </p>
              <p className="font-bold text-lg leading-tight" style={{ color: P.textPrimary }}>
                {displayName}
              </p>
              {educator.organization_name !== displayName && (
                <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>
                  {educator.organization_name}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: P.borderSub }} />

          {/* Pricing summary */}
          <div
            className="rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4"
            style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
          >
            {cs.hourly_rate_usd != null && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold mb-1" style={{ color: P.textMuted }}>
                  {t('bookClass.priceLabel')}
                </p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: P.textPrimary }}>
                  ${cs.hourly_rate_usd}
                  <span className="text-sm font-normal ml-1.5" style={{ color: P.textMuted }}>
                    USD {t('educatorProfile.classesPerHour')}
                  </span>
                </p>
              </div>
            )}
            {cs.accept_usdc && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full self-end mb-0.5"
                style={{ backgroundColor: P.surface, color: P.emerald, border: `1px solid oklch(0.72 0.14 155 / 0.25)` }}
              >
                <Check className="h-3 w-3" />
                USDC
              </span>
            )}
          </div>

          {/* Slot picker */}
          <div
            className="rounded-2xl px-6 py-6"
            style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-6"
              style={{ color: P.textMuted }}
            >
              {t('bookClass.availabilityTitle')}
            </p>
            <SlotPicker
              settings={cs}
              locale={i18n.language}
              t={t}
              prefersReduced={prefersReduced}
            />
          </div>

          {/* Google Calendar embed */}
          {cs.google_calendar_url && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${P.border}` }}
            >
              <div
                className="px-6 py-4"
                style={{ borderBottom: `1px solid ${P.borderSub}`, backgroundColor: P.card }}
              >
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: P.textMuted }}>
                  {t('bookClass.calendarTitle')}
                </p>
              </div>
              <iframe
                src={cs.google_calendar_url}
                title="Educator calendar"
                className="w-full"
                style={{ height: 420, border: 0, backgroundColor: P.surface }}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}

          {/* Coming soon notice */}
          <div
            className="rounded-2xl px-6 py-5 text-center"
            style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: P.textSecondary }}>
              {t('bookClass.comingSoonTitle')}
            </p>
            <p className="text-xs" style={{ color: P.textMuted }}>
              {t('bookClass.comingSoonHint')}
            </p>
          </div>
        </motion.main>
      </div>
    </Layout>
  );
};

export default BookEducatorClass;
