import { useEffect, useState, useRef } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { P } from "@/components/profile/palette";
import {
  VACANCY_AREAS,
  VACANCY_MODALITIES,
  VACANCY_SALARY_PERIODS,
  type Vacancy,
  type VacancyPayload,
} from "@/types/vacancy";
import { LABELS } from "./JobPrimitives";

function getDefaultClosingDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const empty: VacancyPayload = {
  position: "",
  company: "",
  area: "frontend",
  modality: "remoto",
  country: "",
  city: "",
  salary_min: 0,
  salary_max: 0,
  salary_currency: "USD",
  salary_period: "mes",
  description: "",
  requirements: [],
  closing_date: getDefaultClosingDate(),
};

function createInitialForm(vacancy?: Vacancy): VacancyPayload {
  if (!vacancy) {
    return empty;
  }

  return {
    position: vacancy.position,
    company: vacancy.company,
    area: vacancy.area,
    modality: vacancy.modality,
    country: vacancy.country ?? "",
    city: vacancy.city ?? "",
    salary_min: Number(vacancy.salary_min),
    salary_max: Number(vacancy.salary_max),
    salary_currency: vacancy.salary_currency,
    salary_period: vacancy.salary_period,
    description: vacancy.description ?? "",
    requirements: vacancy.requirements ?? [],
    closing_date: vacancy.closing_date ?? "",
  };
}
export function VacancyForm({
  vacancy,
  onSubmit,
  busy,
  onCancel,
}: {
  vacancy?: Vacancy;
  onSubmit: (payload: VacancyPayload | Partial<VacancyPayload>) => void;
  busy?: boolean;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<VacancyPayload>(() =>
    createInitialForm(vacancy),
  );

  const [requirementsText, setRequirementsText] = useState(() =>
    createInitialForm(vacancy).requirements.join("\n"),
  );

  const [closingDateError, setClosingDateError] = useState("");
  const closingDateRef = useRef<HTMLInputElement>(null);

  const hasApplications = (vacancy?.applications_count ?? 0) > 0;

  useEffect(() => {
    const initialForm = createInitialForm(vacancy);

    setForm(initialForm);
    setRequirementsText(initialForm.requirements.join("\n"));
  }, [vacancy]);

  const set = (key: keyof VacancyPayload, value: string | number | string[]) =>
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setClosingDateError("");

    if (form.closing_date) {
      const [year, month, day] = form.closing_date.split("-").map(Number);

      const closingDate = new Date(year, month - 1, day);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const minClosingDate = new Date(today);
      minClosingDate.setDate(today.getDate() + 7);

      const maxClosingDate = new Date(today);
      maxClosingDate.setDate(today.getDate() + 90);

      if (closingDate < minClosingDate || closingDate > maxClosingDate) {
        setClosingDateError(t("vacancyRecruiter.closingDateRangeError"));

        closingDateRef.current?.scrollIntoView?.({
          behavior: "smooth",
          block: "center",
        });

        closingDateRef.current?.focus();
        return;
      }
    }

    const requirements = requirementsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (hasApplications) {
      const {
        salary_min,
        salary_max,
        salary_currency,
        salary_period,
        ...payload
      } = form;

      onSubmit({
        ...payload,
        requirements,
      });

      return;
    }

    onSubmit({
      ...form,
      requirements,
    });
  };

  return (
    <form
      className="space-y-6 border-b pb-8"
      style={{ borderColor: P.borderSub }}
      onSubmit={handleSubmit}
    >
      {vacancy && (
        <div className="border-b pb-5" style={{ borderColor: P.borderSub }}>
          <p className="text-sm" style={{ color: P.textSecondary }}>
            {t("vacancyRecruiter.editingVacancy")}
          </p>

          {hasApplications && (
            <div className="mt-3 flex gap-3 text-sm" style={{ color: P.amber }}>
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />

              <p>{t("vacancyRecruiter.salaryLocked")}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("vacancyRecruiter.fields.position")}
          value={form.position}
          onChange={(value) => set("position", value)}
          required
        />

        <Field
          label={t("vacancyRecruiter.fields.company")}
          value={form.company}
          onChange={(value) => set("company", value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label={t("vacancyRecruiter.fields.area")}
          value={form.area}
          options={VACANCY_AREAS.map((area) => [area, LABELS[area]])}
          onChange={(value) => set("area", value)}
        />

        <Select
          label={t("vacancyRecruiter.fields.modality")}
          value={form.modality}
          options={VACANCY_MODALITIES.map((modality) => [
            modality,
            LABELS[modality],
          ])}
          onChange={(value) => set("modality", value)}
        />

        <div>
          <Field
            label={t("vacancyRecruiter.fields.closingDate")}
            type="date"
            value={form.closing_date ?? ""}
            error={!!closingDateError}
            inputRef={closingDateRef}
            onChange={(value) => {
              set("closing_date", value);
              setClosingDateError("");
            }}
          />

          {closingDateError && (
            <div
              className="
                mt-2 flex items-start gap-2 rounded-lg
                border border-red-400/20
                bg-red-500/5
                px-3 py-2
                text-sm text-red-300
              "
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p>{closingDateError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field
          label={t("vacancyRecruiter.fields.salaryMin")}
          type="number"
          value={String(form.salary_min)}
          onChange={(value) => set("salary_min", Number(value))}
          required
          disabled={hasApplications}
        />

        <Field
          label={t("vacancyRecruiter.fields.salaryMax")}
          type="number"
          value={String(form.salary_max)}
          onChange={(value) => set("salary_max", Number(value))}
          required
          disabled={hasApplications}
        />

        <Field
          label={t("vacancyRecruiter.fields.currency")}
          value={form.salary_currency}
          onChange={(value) => set("salary_currency", value.toUpperCase())}
          required
          disabled={hasApplications}
        />

        <Select
          label={t("vacancyRecruiter.fields.period")}
          value={form.salary_period}
          options={VACANCY_SALARY_PERIODS.map((period) => [period, period])}
          onChange={(value) => set("salary_period", value)}
          disabled={hasApplications}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("vacancyRecruiter.fields.country")}
          value={form.country ?? ""}
          onChange={(value) => set("country", value)}
        />

        <Field
          label={t("vacancyRecruiter.fields.city")}
          value={form.city ?? ""}
          onChange={(value) => set("city", value)}
        />
      </div>

      <label className="block text-sm" style={{ color: P.textSecondary }}>
        {t("vacancyRecruiter.fields.description")}

        <textarea
          required
          className="mt-2 min-h-32 w-full rounded-lg border p-3 text-sm  outline-none transition-colors focus:ring-1"
          style={{
            borderColor: P.border,
            backgroundColor: P.surface,
            color: P.textPrimary,
            outlineColor: P.borderFocus,
          }}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </label>

      <label className="block text-sm" style={{ color: P.textSecondary }}>
        {t("vacancyRecruiter.fields.requirements")}{" "}
        <span style={{ color: P.textMuted }}>
          {t("vacancyRecruiter.requirementsHint")}
        </span>
        <textarea
          required
          className="mt-2 min-h-24 w-full rounded-lg border p-3 text-sm outline-none transition-colors focus:ring-1"
          style={{
            borderColor: P.border,
            backgroundColor: P.surface,
            color: P.textPrimary,
            outlineColor: P.borderFocus,
          }}
          value={requirementsText}
          onChange={(event) => setRequirementsText(event.target.value)}
        />
      </label>

      <div
        className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end"
        style={{ borderColor: P.borderSub }}
      >
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            className="
              min-h-11 rounded-xl px-5
              text-sm font-medium
              transition-all duration-200
              hover:bg-white/5
              hover:text-white
            "
            style={{ color: P.textSecondary }}
            disabled={busy}
            onClick={onCancel}
          >
            {t("vacancyRecruiter.cancel")}
          </Button>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="
            min-h-11 rounded-xl px-5
            border border-purple-400/50
            bg-purple-500/15
            text-sm font-semibold text-purple-100
            shadow-[0_0_20px_rgba(168,85,247,0.10)]
            transition-all duration-200
            hover:-translate-y-0.5
            hover:border-purple-300/70
            hover:bg-purple-500/25
            hover:text-white
            hover:shadow-[0_0_24px_rgba(168,85,247,0.25)]
            active:translate-y-0
            active:scale-[0.98]
            disabled:pointer-events-none
            disabled:opacity-50
          "
        >
          {busy
            ? "Guardando..."
            : vacancy
              ? t("vacancyRecruiter.saveChanges")
              : t("vacancyRecruiter.publish")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  error = false,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="block text-sm" style={{ color: P.textSecondary }}>
      {label}

      <input
        ref={inputRef}
        required={required}
        disabled={disabled}
        type={type}
        className="mt-2 min-h-11 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderColor: error ? "#f87171" : P.border,
          backgroundColor: P.surface,
          color: P.textPrimary,
          outlineColor: error ? "#f87171" : P.borderFocus,
        }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm" style={{ color: P.textSecondary }}>
      {label}

      <RadixSelect value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className="mt-2 min-h-11 rounded-lg border text-sm"
          style={{
            borderColor: P.border,
            backgroundColor: P.surface,
            color: P.textPrimary,
          }}
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent
          style={{
            backgroundColor: P.card,
            borderColor: P.border,
            color: P.textPrimary,
          }}
        >
          {options.map(([option, text]) => (
            <SelectItem key={option} value={option}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </RadixSelect>
    </label>
  );
}
