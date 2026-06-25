import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, Clock, CalendarDays, Loader2,
  CheckCircle2, MessageSquare, BookOpen,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEducatorProfile } from '@/hooks/useEducatorProfile';
import { useIssuerClasses } from '@/hooks/useIssuerClasses';
import { useRequestClass } from '@/hooks/useRequestClass';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { P } from '@/components/profile/palette';
import { GrainOverlay } from '@/components/profile/GrainOverlay';
import { resolveIpfs } from '@/lib/ipfs';
import { generateSlots, getUpcomingDays, filterValidSlots } from '@/lib/slots';
import type { UpcomingDay } from '@/lib/slots';
import type { ClassSettings, IssuerClass } from '@/types/dashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlotSelection {
  date: Date;
  startTime: string;
  durationMinutes: number;
}

type BookingStep = 'class' | 'slot';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlotSelection {
  date: Date;
  startTime: string;
  durationMinutes: number;
}

type BookingStep = 'class' | 'slot';

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

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calcPrice(hourlyRate: number | null | undefined, durationMinutes: number): string | null {
  if (hourlyRate == null) return null;
  const price = (hourlyRate * durationMinutes) / 60;
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Slot picker
// ---------------------------------------------------------------------------

interface SlotPickerProps {
  settings: ClassSettings;
  locale: string;
  t: (key: string) => string;
  prefersReduced: boolean | null;
  selectedSlot: string | null;
  onSelect: (info: SlotSelection | null) => void;
}

function SlotPicker({ settings, locale, t, prefersReduced, selectedSlot, onSelect }: SlotPickerProps) {
  const { durations, availability } = settings;

  const upcomingDays: UpcomingDay[] = availability ? getUpcomingDays(availability, 21) : [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(durations?.[0] ?? 60);

  const selectedDay = upcomingDays[selectedDayIdx];
  const slots =
    selectedDay && availability
      ? filterValidSlots(
          generateSlots(
            availability[selectedDay.dayKey].start,
            availability[selectedDay.dayKey].end,
            selectedDuration
          ),
          selectedDay.date
        )
      : [];

  function handleDurationChange(min: number) {
    setSelectedDuration(min);
    onSelect(null);
  }

  function handleDayChange(idx: number) {
    setSelectedDayIdx(idx);
    onSelect(null);
  }

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
                onClick={() => handleDurationChange(min)}
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
            onClick={() => handleDayChange(Math.max(0, selectedDayIdx - 1))}
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
                    onClick={() => handleDayChange(idx)}
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
            onClick={() => handleDayChange(Math.min(upcomingDays.length - 1, selectedDayIdx + 1))}
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
              slots.map((slot) => {
                const isSelected = selectedSlot === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() =>
                      isSelected
                        ? onSelect(null)
                        : onSelect({ date: selectedDay.date, startTime: slot.start, durationMinutes: selectedDuration })
                    }
                    className="px-4 py-2.5 rounded-xl text-sm font-mono tabular-nums transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: isSelected ? P.accent : P.surface,
                      border: `1px solid ${isSelected ? P.accent : P.border}`,
                      color: isSelected ? P.bg : P.textSecondary,
                    }}
                  >
                    {slot.start}
                  </button>
                );
              })
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
  const { toast } = useToast();
  const prefersReduced = useReducedMotion();
  const { data: educator, isPending, isError } = useEducatorProfile(wallet);
  const { data: classesData, isPending: classesLoading } = useIssuerClasses(wallet);
  const { mutate: requestClass, isPending: isSending } = useRequestClass();

  const availableClasses = classesData?.classes ?? [];
  const hasClasses = !classesLoading && availableClasses.length > 0;

  const [step, setStep] = useState<BookingStep>('class');
  const [selectedIssuerClass, setSelectedIssuerClass] = useState<IssuerClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<SlotSelection | null>(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [submitted]);

  const cs = educator?.class_settings;
  const displayName =
    [educator?.name, educator?.lastname].filter(Boolean).join(' ') ||
    educator?.organization_name ||
    '—';

  const priceLabel = selectedClass
    ? calcPrice(cs?.hourly_rate_usd, selectedClass.durationMinutes)
    : null;

  function handleConfirm() {
    if (!selectedClass || !wallet) return;

    // Build the absolute UTC timestamp of the selected slot so the backend
    // can validate lead time without any timezone ambiguity.
    const slotDt = new Date(selectedClass.date);
    const [slotH, slotM] = selectedClass.startTime.split(':').map(Number);
    slotDt.setHours(slotH, slotM, 0, 0);

    requestClass(
      {
        issuer_wallet_address: wallet,
        requested_date: toISODate(selectedClass.date),
        start_time: selectedClass.startTime,
        duration_minutes: selectedClass.durationMinutes,
        hourly_rate_usd: cs?.hourly_rate_usd ?? null,
        student_message: message.trim() || null,
        issuer_class_id: selectedIssuerClass?.id ?? null,
        requested_timestamp_utc: slotDt.toISOString(),
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => toast({ title: t('bookClass.errorSubmit'), variant: 'destructive' }),
      }
    );
  }

  function handleClassSelect(cls: IssuerClass) {
    setSelectedIssuerClass(cls);
    setStep('slot');
  }

  // Skip class step if educator has no classes configured
  const effectiveStep: BookingStep = (!classesLoading && availableClasses.length === 0) ? 'slot' : step;

  if (isPending || classesLoading) {
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
            className="text-sm transition-colors min-h-[44px] px-4 py-2 rounded-xl"
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
              onClick={() => {
                if (effectiveStep === 'slot' && hasClasses) {
                  setStep('class');
                  setSelectedClass(null);
                } else {
                  navigate(-1);
                }
              }}
              className="flex items-center gap-2 text-sm transition-colors rounded-xl px-3 py-2.5 -ml-2 min-h-[44px]"
              style={{ color: P.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = P.textPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = P.textMuted)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {effectiveStep === 'slot' && hasClasses
                  ? t('bookClass.backToClasses')
                  : t('bookClass.backToProfile')}
              </span>
            </button>
          </div>
        </div>

        {/* Success screen */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: prefersReduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-28 flex flex-col items-center text-center gap-6"
            >
              <CheckCircle2 className="h-16 w-16" style={{ color: P.accent }} />
              <div className="space-y-2">
                <p className="text-xl font-bold" style={{ color: P.textPrimary }}>
                  {t('bookClass.successTitle')}
                </p>
                <p className="text-sm" style={{ color: P.textMuted }}>
                  {t('bookClass.successHint')}
                </p>
              </div>
              {selectedClass && (
                <div
                  className="w-full rounded-2xl px-5 py-4 text-left space-y-1"
                  style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
                >
                  <p className="text-sm font-semibold" style={{ color: P.textPrimary }}>
                    {formatFullDate(selectedClass.date, i18n.language)}
                  </p>
                  <p className="text-sm" style={{ color: P.textSecondary }}>
                    {selectedClass.startTime}
                    <span className="mx-1.5 opacity-40">·</span>
                    {selectedClass.durationMinutes} {t('bookClass.min')}
                    {priceLabel && (
                      <>
                        <span className="mx-1.5 opacity-40">·</span>
                        {priceLabel} USD
                      </>
                    )}
                  </p>
                  {selectedIssuerClass && (
                    <p className="text-xs font-medium mt-0.5" style={{ color: P.accent }}>
                      {selectedIssuerClass.name}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>{displayName}</p>
                </div>
              )}
              <button
                onClick={() => navigate(`/educator/${wallet}`, { replace: true })}
                className="text-sm transition-colors min-h-[44px] px-4 py-2 rounded-xl"
                style={{ color: P.accent }}
              >
                {t('bookClass.backToProfile')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!submitted && (
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

            {/* Step 1 — Class selector */}
            <AnimatePresence mode="wait">
              {effectiveStep === 'class' && (
                <motion.div
                  key="class-step"
                  initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: prefersReduced ? 0 : 0.22 }}
                  className="rounded-2xl px-6 py-6"
                  style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <BookOpen className="h-4 w-4" style={{ color: P.accent }} />
                    <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: P.textMuted }}>
                      {t('bookClass.selectClass')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {availableClasses.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleClassSelect(cls)}
                        className="w-full text-left px-4 py-3.5 rounded-xl transition-all active:scale-[0.99]"
                        style={{ backgroundColor: P.surface, border: `1px solid ${P.border}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = P.accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = P.border)}
                      >
                        <p className="text-sm font-semibold" style={{ color: P.textPrimary }}>
                          {cls.name}
                        </p>
                        {cls.description && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: P.textMuted }}>
                            {cls.description}
                          </p>
                        )}
                        {cls.topics && cls.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cls.topics.map((topic) => (
                              <span
                                key={topic}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                style={{ backgroundColor: P.accentSoft, color: P.accent }}
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Slot picker */}
              {effectiveStep === 'slot' && (
                <motion.div
                  key="slot-step"
                  initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: prefersReduced ? 0 : 0.22 }}
                >
                  {/* Selected class badge + back */}
                  {selectedIssuerClass && hasClasses && (
                    <div
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-3"
                      style={{ backgroundColor: P.accentSoft, border: `1px solid ${P.accentBorder}` }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: P.accent }} />
                        <span className="text-sm font-semibold truncate" style={{ color: P.accent }}>
                          {selectedIssuerClass.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setStep('class'); setSelectedClass(null); }}
                        className="text-xs shrink-0 transition-colors"
                        style={{ color: P.textMuted }}
                      >
                        {t('bookClass.changeClass')}
                      </button>
                    </div>
                  )}

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
                      selectedSlot={selectedClass?.startTime ?? null}
                      onSelect={setSelectedClass}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation panel */}
            <AnimatePresence>
              {selectedClass && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: prefersReduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl px-6 py-6 space-y-5"
                  style={{ backgroundColor: P.card, border: `1px solid ${P.accent}40` }}
                >
                  {/* Summary */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: P.textMuted }}>
                      {t('bookClass.confirmTitle')}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold" style={{ color: P.textPrimary }}>
                        {formatFullDate(selectedClass.date, i18n.language)}
                      </p>
                      <p className="text-sm" style={{ color: P.textSecondary }}>
                        {selectedClass.startTime}
                        <span className="mx-1.5 opacity-40">·</span>
                        {selectedClass.durationMinutes} {t('bookClass.min')}
                        {priceLabel && (
                          <>
                            <span className="mx-1.5 opacity-40">·</span>
                            <span className="font-semibold" style={{ color: P.accent }}>{priceLabel} USD</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Optional message */}
                  <div>
                    <label
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold mb-2"
                      style={{ color: P.textMuted }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {t('bookClass.messageLabel')}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder={t('bookClass.messagePlaceholder')}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-all"
                      style={{
                        backgroundColor: P.surface,
                        border: `1px solid ${P.border}`,
                        color: P.textPrimary,
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = P.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = P.border)}
                    />
                    {message.length > 0 && (
                      <p className="text-[10px] text-right mt-1" style={{ color: P.textMuted }}>
                        {message.length}/500
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ backgroundColor: P.accent, color: P.bg }}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('bookClass.sending')}
                      </>
                    ) : (
                      t('bookClass.confirmBtn')
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

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
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                />
              </div>
            )}
          </motion.main>
        )}
      </div>
    </Layout>
  );
};

export default BookEducatorClass;
