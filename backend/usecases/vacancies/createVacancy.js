const {
  VACANCY_AREAS,
  VACANCY_MODALITIES,
  VACANCY_SALARY_PERIODS,
  FIXED_CURRENCIES,
  ISO_4217_RE,
  MIN_CLOSING_DAYS,
  MAX_CLOSING_DAYS,
  DEFAULT_CLOSING_DAYS,
  MAX_OPEN_VACANCIES_PER_RECRUITER,
  MIN_POSITION_LENGTH,
  MAX_POSITION_LENGTH,
  MIN_COMPANY_LENGTH,
  MAX_COMPANY_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_REQUIREMENTS,
  MAX_REQUIREMENTS,
} = require("./constants");
const { generateUniqueVacancySlug } = require("./slug");

function validatePosition(position) {
  if (typeof position !== "string" || position.trim().length < MIN_POSITION_LENGTH || position.trim().length > MAX_POSITION_LENGTH) {
    return { ok: false, code: "INVALID_POSITION", httpStatus: 400, message: `position must be ${MIN_POSITION_LENGTH}-${MAX_POSITION_LENGTH} characters` };
  }
  return null;
}

function validateCompany(company) {
  if (typeof company !== "string" || company.trim().length < MIN_COMPANY_LENGTH || company.trim().length > MAX_COMPANY_LENGTH) {
    return { ok: false, code: "INVALID_COMPANY", httpStatus: 400, message: `company must be ${MIN_COMPANY_LENGTH}-${MAX_COMPANY_LENGTH} characters` };
  }
  return null;
}

function validateArea(area) {
  if (!VACANCY_AREAS.includes(area)) {
    return { ok: false, code: "INVALID_AREA", httpStatus: 400, message: `area must be one of: ${VACANCY_AREAS.join(", ")}` };
  }
  return null;
}

function validateModality(modality) {
  if (!VACANCY_MODALITIES.includes(modality)) {
    return { ok: false, code: "INVALID_MODALITY", httpStatus: 400, message: `modality must be one of: ${VACANCY_MODALITIES.join(", ")}` };
  }
  return null;
}

// §3.1: pais/ciudad obligatorios "si no es remoto".
function validateLocation(modality, country, city) {
  if (modality === "remoto") return null;
  if (!country || !city) {
    return { ok: false, code: "LOCATION_REQUIRED", httpStatus: 400, message: "country and city are required unless modality is remoto" };
  }
  return null;
}

// RN-01 — sin salario no hay publicación.
function validateSalary(salaryMin, salaryMax, salaryCurrency, salaryPeriod) {
  const min = Number(salaryMin);
  const max = Number(salaryMax);
  if (salaryMin === undefined || salaryMin === null || salaryMax === undefined || salaryMax === null || !Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
    return { ok: false, code: "SALARY_REQUIRED", httpStatus: 400, message: "salary_min and salary_max are required" };
  }
  if (max < min) {
    return { ok: false, code: "INVALID_SALARY_RANGE", httpStatus: 400, message: "salary_max must be greater than or equal to salary_min" };
  }
  if (!salaryCurrency || !(FIXED_CURRENCIES.includes(salaryCurrency) || ISO_4217_RE.test(salaryCurrency))) {
    return { ok: false, code: "INVALID_CURRENCY", httpStatus: 400, message: `salary_currency must be one of ${FIXED_CURRENCIES.join(", ")} or a 3-letter ISO 4217 code` };
  }
  if (!VACANCY_SALARY_PERIODS.includes(salaryPeriod)) {
    return { ok: false, code: "INVALID_SALARY_PERIOD", httpStatus: 400, message: `salary_period must be one of: ${VACANCY_SALARY_PERIODS.join(", ")}` };
  }
  return null;
}

function validateDescription(description) {
  if (typeof description !== "string" || description.trim().length < MIN_DESCRIPTION_LENGTH || description.trim().length > MAX_DESCRIPTION_LENGTH) {
    return { ok: false, code: "INVALID_DESCRIPTION", httpStatus: 400, message: `description must be ${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} characters` };
  }
  return null;
}

// RF-03 — 1 a 10 líneas de texto libre.
function validateRequirements(requirements) {
  if (!Array.isArray(requirements) || requirements.length < MIN_REQUIREMENTS || requirements.length > MAX_REQUIREMENTS) {
    return { ok: false, code: "INVALID_REQUIREMENTS", httpStatus: 400, message: `requirements must be an array of ${MIN_REQUIREMENTS}-${MAX_REQUIREMENTS} items` };
  }
  if (requirements.some((r) => typeof r !== "string" || !r.trim())) {
    return { ok: false, code: "INVALID_REQUIREMENTS", httpStatus: 400, message: "each requirement must be a non-empty string" };
  }
  return null;
}

// RF-04 / RN-02 — 7 a 90 días, default 30.
function resolveClosingDate(closingDate) {
  if (closingDate === undefined || closingDate === null) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + DEFAULT_CLOSING_DAYS);
    return { value: d.toISOString().slice(0, 10) };
  }
  const parsed = new Date(`${closingDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { error: { ok: false, code: "INVALID_CLOSING_DATE", httpStatus: 400, message: "closing_date must be a valid date" } };
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days = Math.round((parsed.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (days < MIN_CLOSING_DAYS || days > MAX_CLOSING_DAYS) {
    return { error: { ok: false, code: "INVALID_CLOSING_DATE", httpStatus: 400, message: `closing_date must be between ${MIN_CLOSING_DAYS} and ${MAX_CLOSING_DAYS} days from today` } };
  }
  return { value: closingDate };
}

/**
 * Recruiter publishes a new vacancy.
 * Returns a result object — never throws on business errors.
 */
async function createVacancy({ models, recruiterWallet, ...fields }) {
  if (!models || !recruiterWallet) {
    throw new TypeError("createVacancy requires { models, recruiterWallet }");
  }

  const { position, company, area, modality, country, city, salaryMin, salaryMax, salaryCurrency, salaryPeriod, description, requirements, closingDate } = fields;

  const invalid =
    validatePosition(position) ||
    validateCompany(company) ||
    validateArea(area) ||
    validateModality(modality) ||
    validateLocation(modality, country, city) ||
    validateSalary(salaryMin, salaryMax, salaryCurrency, salaryPeriod) ||
    validateDescription(description) ||
    validateRequirements(requirements);
  if (invalid) return invalid;

  const closing = resolveClosingDate(closingDate);
  if (closing.error) return closing.error;

  const wallet = recruiterWallet.toLowerCase();

  // RN-03 — máximo 5 vacantes abiertas por reclutador.
  const openCount = await models.Vacancy.count({
    where: { recruiter_wallet_address: wallet, status: "abierta" },
  });
  if (openCount >= MAX_OPEN_VACANCIES_PER_RECRUITER) {
    return { ok: false, code: "VACANCY_LIMIT_REACHED", httpStatus: 409, message: `Maximum ${MAX_OPEN_VACANCIES_PER_RECRUITER} open vacancies per recruiter` };
  }

  const slug = await generateUniqueVacancySlug({ models, position, company });

  const vacancy = await models.Vacancy.create({
    slug,
    recruiter_wallet_address: wallet,
    position: position.trim(),
    company: company.trim(),
    area,
    modality,
    country: modality === "remoto" ? null : country.trim(),
    city: modality === "remoto" ? null : city.trim(),
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: salaryCurrency,
    salary_period: salaryPeriod,
    description: description.trim(),
    requirements: requirements.map((r) => r.trim()),
    closing_date: closing.value,
    status: "abierta",
    published_at: new Date(),
  });

  return {
    ok: true,
    data: {
      vacancy: {
        id: vacancy.id,
        slug: vacancy.slug,
        position: vacancy.position,
        company: vacancy.company,
        area: vacancy.area,
        modality: vacancy.modality,
        country: vacancy.country,
        city: vacancy.city,
        salary_min: vacancy.salary_min,
        salary_max: vacancy.salary_max,
        salary_currency: vacancy.salary_currency,
        salary_period: vacancy.salary_period,
        description: vacancy.description,
        requirements: vacancy.requirements,
        closing_date: vacancy.closing_date,
        status: vacancy.status,
        published_at: vacancy.published_at,
      },
    },
  };
}

module.exports = { createVacancy };
