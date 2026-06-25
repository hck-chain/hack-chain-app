import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, Loader2, DollarSign, Clock, CalendarDays,
  Check, AlertCircle,
  BookOpen, Plus, X, Trash2, EyeOff,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMyClassSettings, useUpdateClassSettings } from '@/hooks/useClassSettings';
import {
  useMyIssuerClasses,
  useCreateIssuerClass,
  useUpdateIssuerClass,
  useDeleteIssuerClass,
} from '@/hooks/useIssuerClasses';
import { P } from '@/components/profile/palette';
import { GrainOverlay } from '@/components/profile/GrainOverlay';
import { useTranslation } from 'react-i18next';
import type { ClassSettings, DayKey, WeeklyAvailability } from '@/types/dashboard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DURATIONS = [30, 45, 60] as const;

const DAYS: { key: DayKey; labelKey: string }[] = [
  { key: 'mon', labelKey: 'editClasses.dayMon' },
  { key: 'tue', labelKey: 'editClasses.dayTue' },
  { key: 'wed', labelKey: 'editClasses.dayWed' },
  { key: 'thu', labelKey: 'editClasses.dayThu' },
  { key: 'fri', labelKey: 'editClasses.dayFri' },
  { key: 'sat', labelKey: 'editClasses.daySat' },
  { key: 'sun', labelKey: 'editClasses.daySun' },
];

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  mon: { enabled: false, start: '09:00', end: '18:00' },
  tue: { enabled: false, start: '09:00', end: '18:00' },
  wed: { enabled: false, start: '09:00', end: '18:00' },
  thu: { enabled: false, start: '09:00', end: '18:00' },
  fri: { enabled: false, start: '09:00', end: '18:00' },
  sat: { enabled: false, start: '09:00', end: '13:00' },
  sun: { enabled: false, start: '09:00', end: '13:00' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isRangeValid(start: string, end: string): boolean {
  if (!start || !end) return false;
  return timeToMinutes(start) < timeToMinutes(end);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ratePerSession(hourlyRate: number, minutes: number): string {
  return ((hourlyRate * minutes) / 60).toFixed(2);
}

// ---------------------------------------------------------------------------
// SectionCard — same pattern as EditEducatorProfile
// ---------------------------------------------------------------------------

interface SectionCardProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ label, description, icon, children }: SectionCardProps) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: P.card, border: `1px solid ${P.border}` }}
    >
      <header
        className="flex items-start gap-3 px-6 py-5"
        style={{ borderBottom: `1px solid ${P.borderSub}` }}
      >
        {icon && (
          <div className="mt-0.5 shrink-0" style={{ color: P.accent }}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: P.textMuted }}>
            {label}
          </h2>
          {description && (
            <p className="text-sm mt-1.5" style={{ color: P.textSecondary }}>
              {description}
            </p>
          )}
        </div>
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Toggle — clean iOS-style boolean switch
// ---------------------------------------------------------------------------

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}

function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 group disabled:opacity-50"
    >
      <span
        className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
        style={{ backgroundColor: checked ? P.accent : P.surface, border: `1px solid ${checked ? P.accent : P.border}` }}
      >
        <span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform duration-200"
          style={{
            backgroundColor: checked ? P.bg : P.textMuted,
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </span>
      {label && (
        <span className="text-sm" style={{ color: P.textSecondary }}>
          {label}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TimeInput — styled time picker
// ---------------------------------------------------------------------------

interface TimeInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}

function TimeInput({ value, onChange, disabled, label }: TimeInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: P.textMuted }}>
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-xl px-3 py-2.5 text-sm font-mono tabular-nums outline-none transition-colors disabled:opacity-50 [color-scheme:dark]"
        style={{
          backgroundColor: P.surface,
          border: `1px solid ${P.border}`,
          color: P.textPrimary,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = P.borderFocus)}
        onBlur={(e) => (e.currentTarget.style.borderColor = P.border)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TopicTagInput — type a topic and press Enter or comma to add
// ---------------------------------------------------------------------------

interface TopicTagInputProps {
  topics: string[];
  onChange: (topics: string[]) => void;
  disabled?: boolean;
  placeholder: string;
}

function TopicTagInput({ topics, onChange, disabled, placeholder }: TopicTagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTopic() {
    const value = input.trim();
    if (!value || topics.includes(value) || topics.length >= 10) return;
    onChange([...topics, value]);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTopic();
    }
    if (e.key === 'Backspace' && !input && topics.length > 0) {
      onChange(topics.slice(0, -1));
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-xl px-3 py-2.5 min-h-[44px] cursor-text"
      style={{ backgroundColor: P.surface, border: `1px solid ${P.border}` }}
      onClick={() => inputRef.current?.focus()}
    >
      {topics.map((topic) => (
        <span
          key={topic}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: P.accentSoft, color: P.accent, border: `1px solid ${P.accentBorder}` }}
        >
          {topic}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(topics.filter((t) => t !== topic)); }}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && topics.length < 10 && (
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTopic}
          placeholder={topics.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
          style={{ color: P.textPrimary }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClassCatalogSection — create/list/delete educator classes
// ---------------------------------------------------------------------------

function ClassCatalogSection({ t, prefersReduced }: { t: (k: string) => string; prefersReduced: boolean | null }) {
  const { data, isPending } = useMyIssuerClasses();
  const createClass = useCreateIssuerClass();
  const updateClass = useUpdateIssuerClass();
  const deleteClass = useDeleteIssuerClass();

  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTopics, setNewTopics] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const classes = data?.classes ?? [];
  const isCreating = createClass.isPending;

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createClass.mutateAsync({ name, description: newDescription.trim() || undefined, topics: newTopics });
      setNewName('');
      setNewDescription('');
      setNewTopics([]);
      setShowForm(false);
    } catch (_) {}
  }

  return (
    <SectionCard
      label={t('editClasses.catalogSection')}
      description={t('editClasses.catalogHint')}
      icon={<BookOpen className="h-4 w-4" />}
    >
      <div className="space-y-3">
        {isPending ? (
          <div className="flex items-center gap-2 py-2" style={{ color: P.textMuted }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t('editClasses.catalogLoading')}</span>
          </div>
        ) : (
          <>
            {/* Existing classes */}
            <AnimatePresence initial={false}>
              {classes.map((cls) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: prefersReduced ? 0 : 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                    style={{
                      backgroundColor: cls.is_active ? P.surface : 'transparent',
                      border: `1px solid ${cls.is_active ? P.border : P.borderSub}`,
                      opacity: cls.is_active ? 1 : 0.5,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate" style={{ color: P.textPrimary }}>
                        {cls.name}
                      </p>
                      {cls.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: P.textMuted }}>
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
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title={cls.is_active ? t('editClasses.catalogDeactivate') : t('editClasses.catalogActivate')}
                        onClick={() => updateClass.mutate({ id: cls.id!, is_active: !cls.is_active })}
                        disabled={updateClass.isPending}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                        style={{ color: P.textMuted }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = P.textPrimary)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = P.textMuted)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('editClasses.catalogDelete')}
                        onClick={() => deleteClass.mutate(cls.id!)}
                        disabled={deleteClass.isPending}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                        style={{ color: P.textMuted }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'oklch(0.65 0.18 25)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = P.textMuted)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {classes.length === 0 && !showForm && (
              <p className="text-sm py-1" style={{ color: P.textMuted }}>
                {t('editClasses.catalogEmpty')}
              </p>
            )}

            {/* Add class form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: prefersReduced ? 0 : 0.22 }}
                  className="overflow-hidden"
                >
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ backgroundColor: P.surface, border: `1px solid ${P.accentBorder}` }}
                  >
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      maxLength={255}
                      placeholder={t('editClasses.catalogNamePlaceholder')}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors"
                      style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, color: P.textPrimary }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = P.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = P.border)}
                    />
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      maxLength={1000}
                      placeholder={t('editClasses.catalogDescPlaceholder')}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors"
                      style={{ backgroundColor: P.card, border: `1px solid ${P.border}`, color: P.textPrimary }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = P.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = P.border)}
                    />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1.5" style={{ color: P.textMuted }}>
                        {t('editClasses.catalogTopicsLabel')}
                      </p>
                      <TopicTagInput
                        topics={newTopics}
                        onChange={setNewTopics}
                        placeholder={t('editClasses.catalogTopicsPlaceholder')}
                      />
                      <p className="text-[10px] mt-1" style={{ color: P.textMuted }}>
                        {t('editClasses.catalogTopicsHint')}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCreate}
                        disabled={!newName.trim() || isCreating}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{ backgroundColor: P.accent, color: P.bg }}
                      >
                        {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        {t('editClasses.catalogAddBtn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowForm(false); setNewName(''); setNewDescription(''); setNewTopics([]); }}
                        className="px-4 py-2 rounded-xl text-sm transition-colors"
                        style={{ color: P.textMuted }}
                      >
                        {t('editClasses.catalogCancelBtn')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showForm && classes.length < 20 && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 text-sm font-medium transition-colors mt-1"
                style={{ color: P.accent }}
              >
                <Plus className="h-4 w-4" />
                {t('editClasses.catalogAddClass')}
              </button>
            )}
          </>
        )}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const EditEducatorClasses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();

  const { data: settings, isPending: isLoading } = useMyClassSettings();
  const updateSettings = useUpdateClassSettings();

  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [acceptUsdc, setAcceptUsdc] = useState(false);
  const [durations, setDurations] = useState<number[]>([30, 60]);
  const [availability, setAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY);
  useEffect(() => {
    if (!settings) return;
    setHourlyRate(settings.hourly_rate_usd != null ? String(settings.hourly_rate_usd) : '');
    setAcceptUsdc(settings.accept_usdc ?? false);
    setDurations(settings.durations?.length ? settings.durations : [30, 60]);
    setAvailability({ ...DEFAULT_AVAILABILITY, ...(settings.availability ?? {}) });
  }, [settings]);

  const isSaving = updateSettings.isPending;

  const parsedRate = parseFloat(hourlyRate);
  const rateValid = hourlyRate === '' || (!isNaN(parsedRate) && parsedRate >= 0 && parsedRate <= 9999);

  const toggleDuration = (min: number) => {
    setDurations((prev) =>
      prev.includes(min) ? prev.filter((d) => d !== min) : [...prev, min].sort((a, b) => a - b)
    );
  };

  const toggleDay = (day: DayKey) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const updateDayTime = (day: DayKey, field: 'start' | 'end', value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const invalidDays = DAYS.filter(
    ({ key }) => availability[key].enabled && !isRangeValid(availability[key].start, availability[key].end)
  );

  const handleSave = async () => {
    if (!rateValid) {
      toast({ title: t('editClasses.errorTitle'), description: t('editClasses.invalidRate'), variant: 'destructive' });
      return;
    }
    if (durations.length === 0) {
      toast({ title: t('editClasses.errorTitle'), description: t('editClasses.noDurations'), variant: 'destructive' });
      return;
    }
    if (invalidDays.length > 0) {
      toast({ title: t('editClasses.errorTitle'), description: t('editClasses.invalidTimeRange'), variant: 'destructive' });
      return;
    }

    const payload: Partial<ClassSettings> = {
      hourly_rate_usd: hourlyRate.trim() ? parsedRate : null,
      accept_usdc: acceptUsdc,
      durations,
      availability,
    };

    try {
      await updateSettings.mutateAsync(payload);
      toast({ title: t('editClasses.savedTitle'), description: t('editClasses.savedDesc') });
      navigate('/educator/profile/edit');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: t('editClasses.errorTitle'), description: message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <GrainOverlay />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: P.accent }} />
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
          style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.78)', borderBottom: `1px solid ${P.borderSub}` }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/educator/profile/edit')}
              className="flex items-center gap-2 transition-colors text-sm rounded-full px-2 py-1.5 -ml-2"
              style={{ color: P.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = P.textPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = P.textMuted)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('editClasses.backToProfile')}</span>
            </button>

            <span
              className="text-[11px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: P.textMuted }}
            >
              {t('editClasses.pageTitle')}
            </span>

            <div className="w-16" />
          </div>
        </div>

        <motion.main
          initial={prefersReduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-32 space-y-5"
        >

          {/* ── Class catalog ── */}
          <ClassCatalogSection t={t} prefersReduced={prefersReduced} />

          {/* ── Pricing ── */}
          <SectionCard
            label={t('editClasses.pricingSection')}
            description={t('editClasses.pricingHint')}
            icon={<DollarSign className="h-4 w-4" />}
          >
            <div className="space-y-5">
              {/* Rate input */}
              <div>
                <label
                  className="block text-[11px] uppercase tracking-[0.16em] font-semibold mb-2"
                  style={{ color: P.textMuted }}
                >
                  {t('editClasses.hourlyRateLabel')}
                </label>
                <div
                  className="flex items-center rounded-xl overflow-hidden transition-colors"
                  style={{ backgroundColor: P.surface, border: `1px solid ${rateValid ? P.border : 'oklch(0.65 0.18 25 / 0.55)'}` }}
                >
                  <span
                    className="px-4 py-3 text-sm font-mono font-semibold shrink-0"
                    style={{ color: P.textMuted, borderRight: `1px solid ${P.borderSub}` }}
                  >
                    USD
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={9999}
                    step={0.01}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    disabled={isSaving}
                    placeholder="0.00"
                    className="flex-1 bg-transparent border-0 outline-none py-3 px-3.5 text-[15px] font-mono tabular-nums disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ color: P.textPrimary }}
                    onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = P.borderFocus)}
                    onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = rateValid ? P.border : 'oklch(0.65 0.18 25 / 0.55)')}
                  />
                  <span className="pr-4 text-sm font-mono" style={{ color: P.textMuted }}>/hr</span>
                </div>
              </div>

              {/* Per-session breakdown — only shown when rate + durations are set */}
              {parsedRate > 0 && durations.length > 0 && rateValid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: P.accentSoft, border: `1px solid ${P.accentBorder}` }}
                >
                  <div className="px-4 py-3 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: P.accent }}>
                      {t('editClasses.perSessionBreakdown')}
                    </p>
                    {durations.map((min) => (
                      <div key={min} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: P.textSecondary }}>
                          {min} {t('editClasses.min')}
                        </span>
                        <span className="text-sm font-mono tabular-nums font-semibold" style={{ color: P.textPrimary }}>
                          ${ratePerSession(parsedRate, min)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* USDC toggle */}
              <div
                className="flex items-center justify-between py-3.5 px-4 rounded-xl"
                style={{ backgroundColor: P.surface, border: `1px solid ${P.border}` }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: P.textPrimary }}>
                    {t('editClasses.acceptUsdc')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>
                    {t('editClasses.acceptUsdcHint')}
                  </p>
                </div>
                <Toggle checked={acceptUsdc} onChange={setAcceptUsdc} disabled={isSaving} />
              </div>
            </div>
          </SectionCard>

          {/* ── Session duration ── */}
          <SectionCard
            label={t('editClasses.durationSection')}
            description={t('editClasses.durationHint')}
            icon={<Clock className="h-4 w-4" />}
          >
            <div className="flex gap-3 flex-wrap">
              {DURATIONS.map((min) => {
                const selected = durations.includes(min);
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => toggleDuration(min)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: selected ? P.accent : P.surface,
                      color: selected ? P.bg : P.textSecondary,
                      border: `1px solid ${selected ? P.accent : P.border}`,
                    }}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    <span className="font-mono tabular-nums">{min}</span>
                    <span>{t('editClasses.min')}</span>
                  </button>
                );
              })}
            </div>
            {durations.length === 0 && (
              <p className="mt-3 text-xs" style={{ color: 'oklch(0.75 0.16 25)' }}>
                {t('editClasses.selectAtLeastOne')}
              </p>
            )}
          </SectionCard>

          {/* ── Weekly availability ── */}
          <SectionCard
            label={t('editClasses.availabilitySection')}
            description={t('editClasses.availabilityHint')}
            icon={<CalendarDays className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {/* Day chips row */}
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(({ key, labelKey }) => {
                  const enabled = availability[key].enabled;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: enabled ? P.accent : P.surface,
                        color: enabled ? P.bg : P.textMuted,
                        border: `1px solid ${enabled ? P.accent : P.border}`,
                      }}
                    >
                      {t(labelKey)}
                    </button>
                  );
                })}
              </div>

              {/* Time ranges — shown only for enabled days */}
              <AnimatePresence initial={false}>
                {DAYS.filter(({ key }) => availability[key].enabled).map(({ key, labelKey }) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: prefersReduced ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    {(() => {
                      const rangeInvalid = !isRangeValid(availability[key].start, availability[key].end);
                      return (
                        <div className="mt-1 space-y-1.5">
                          <div
                            className="flex items-center gap-4 flex-wrap px-4 py-3 rounded-xl"
                            style={{
                              backgroundColor: P.surface,
                              border: `1px solid ${rangeInvalid ? 'oklch(0.65 0.18 25 / 0.55)' : P.borderSub}`,
                            }}
                          >
                            <span
                              className="text-[11px] uppercase tracking-[0.14em] font-semibold w-8 shrink-0"
                              style={{ color: P.accent }}
                            >
                              {t(labelKey)}
                            </span>
                            <TimeInput
                              label={t('editClasses.startTime')}
                              value={availability[key].start}
                              onChange={(v) => updateDayTime(key, 'start', v)}
                              disabled={isSaving}
                            />
                            <span className="text-sm self-end pb-2.5" style={{ color: P.textMuted }}>—</span>
                            <TimeInput
                              label={t('editClasses.endTime')}
                              value={availability[key].end}
                              onChange={(v) => updateDayTime(key, 'end', v)}
                              disabled={isSaving}
                            />
                          </div>
                          {rangeInvalid && (
                            <p className="flex items-center gap-1.5 text-xs px-1" style={{ color: 'oklch(0.75 0.16 25)' }}>
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                              {t('editClasses.invalidTimeRangeInline')}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </motion.div>
                ))}
              </AnimatePresence>

              {!DAYS.some(({ key }) => availability[key].enabled) && (
                <p className="text-xs pt-1" style={{ color: P.textMuted }}>
                  {t('editClasses.noAvailabilitySet')}
                </p>
              )}
            </div>
          </SectionCard>

        </motion.main>

        {/* ── Footer ── */}
        <footer
          className="sticky bottom-0 z-10 backdrop-blur-xl"
          style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.85)', borderTop: `1px solid ${P.borderSub}` }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <p className="text-xs hidden sm:block" style={{ color: P.textMuted }}>
              {t('editClasses.savedChangesNote')}
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving || durations.length === 0 || invalidDays.length > 0}
              className="ml-auto font-semibold px-7 rounded-full transition-all hover:scale-[1.015] disabled:hover:scale-100"
              style={{ backgroundColor: P.accent, color: P.bg, border: 'none' }}
            >
              {isSaving
                ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{t('editClasses.saving')}</>
                : t('editClasses.saveBtn')
              }
            </Button>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default EditEducatorClasses;
