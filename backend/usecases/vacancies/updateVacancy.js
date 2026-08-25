const {
  VACANCY_AREAS,
  VACANCY_MODALITIES,
  VACANCY_SALARY_PERIODS,
  FIXED_CURRENCIES,
  ISO_4217_RE,
  MIN_POSITION_LENGTH,
  MAX_POSITION_LENGTH,
  MIN_COMPANY_LENGTH,
  MAX_COMPANY_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_REQUIREMENTS,
  MAX_REQUIREMENTS,
} = require("./constants");

function validateOptionalString(value, { min, max, code, label }) {
  if (value === undefined) return null;
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    return { ok: false, code, httpStatus: 400, message: `${label} must be ${min}-${max} characters` };
  }
  return null;
}

/**
 * Recruiter edits their own vacancy.
 * RF-06: the salary can't change once the vacancy has applications. Salary is
 * therefore only accepted here if the request includes it AND there are no
 * applications yet — callers that don't touch salary just omit the fields.
 * Returns a result object — never throws on business errors.
 */
async function updateVacancy({ models, vacancyId, recruiterWallet, ...fields }) {
  if (!models || !vacancyId || !recruiterWallet) {
    throw new TypeError("updateVacancy requires { models, vacancyId, recruiterWallet }");
  }

  const { position, company, area, modality, country, city, salaryMin, salaryMax, salaryCurrency, salaryPeriod, description, requirements } = fields;

  const invalid =
    validateOptionalString(position, { min: MIN_POSITION_LENGTH, max: MAX_POSITION_LENGTH, code: "INVALID_POSITION", label: "position" }) ||
    validateOptionalString(company, { min: MIN_COMPANY_LENGTH, max: MAX_COMPANY_LENGTH, code: "INVALID_COMPANY", label: "company" }) ||
    validateOptionalString(description, { min: MIN_DESCRIPTION_LENGTH, max: MAX_DESCRIPTION_LENGTH, code: "INVALID_DESCRIPTION", label: "description" });
  if (invalid) return invalid;

  if (area !== undefined && !VACANCY_AREAS.includes(area)) {
    return { ok: false, code: "INVALID_AREA", httpStatus: 400, message: `area must be one of: ${VACANCY_AREAS.join(", ")}` };
  }
  if (modality !== undefined && !VACANCY_MODALITIES.includes(modality)) {
    return { ok: false, code: "INVALID_MODALITY", httpStatus: 400, message: `modality must be one of: ${VACANCY_MODALITIES.join(", ")}` };
  }
  if (requirements !== undefined) {
    if (!Array.isArray(requirements) || requirements.length < MIN_REQUIREMENTS || requirements.length > MAX_REQUIREMENTS || requirements.some((r) => typeof r !== "string" || !r.trim())) {
      return { ok: false, code: "INVALID_REQUIREMENTS", httpStatus: 400, message: `requirements must be an array of ${MIN_REQUIREMENTS}-${MAX_REQUIREMENTS} non-empty strings` };
    }
  }

  const salaryFieldsTouched = salaryMin !== undefined || salaryMax !== undefined || salaryCurrency !== undefined || salaryPeriod !== undefined;

  // Ownership in the `where` — a mismatched id/owner returns 404 without
  // leaking whether the vacancy exists.
  const vacancy = await models.Vacancy.findOne({
    where: { id: vacancyId, recruiter_wallet_address: recruiterWallet.toLowerCase() },
  });
  if (!vacancy) {
    return { ok: false, code: "VACANCY_NOT_FOUND", httpStatus: 404, message: "Vacancy not found" };
  }

  if (vacancy.status !== "abierta") {
    return { ok: false, code: "VACANCY_NOT_EDITABLE", httpStatus: 409, message: "Only open vacancies can be edited" };
  }

  if (salaryFieldsTouched) {
    const applicationsCount = await models.VacancyApplication.count({ where: { vacancy_id: vacancy.id } });
    if (applicationsCount > 0) {
      return { ok: false, code: "SALARY_LOCKED", httpStatus: 409, message: "Salary can't be edited once the vacancy has applications" };
    }

    const min = salaryMin !== undefined ? Number(salaryMin) : Number(vacancy.salary_min);
    const max = salaryMax !== undefined ? Number(salaryMax) : Number(vacancy.salary_max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
      return { ok: false, code: "SALARY_REQUIRED", httpStatus: 400, message: "salary_min and salary_max are required" };
    }
    if (max < min) {
      return { ok: false, code: "INVALID_SALARY_RANGE", httpStatus: 400, message: "salary_max must be greater than or equal to salary_min" };
    }
    const currency = salaryCurrency !== undefined ? salaryCurrency : vacancy.salary_currency;
    if (!currency || !(FIXED_CURRENCIES.includes(currency) || ISO_4217_RE.test(currency))) {
      return { ok: false, code: "INVALID_CURRENCY", httpStatus: 400, message: `salary_currency must be one of ${FIXED_CURRENCIES.join(", ")} or a 3-letter ISO 4217 code` };
    }
    const period = salaryPeriod !== undefined ? salaryPeriod : vacancy.salary_period;
    if (!VACANCY_SALARY_PERIODS.includes(period)) {
      return { ok: false, code: "INVALID_SALARY_PERIOD", httpStatus: 400, message: `salary_period must be one of: ${VACANCY_SALARY_PERIODS.join(", ")}` };
    }
  }

  const nextModality = modality !== undefined ? modality : vacancy.modality;
  const nextCountry = country !== undefined ? country : vacancy.country;
  const nextCity = city !== undefined ? city : vacancy.city;
  if (nextModality !== "remoto" && (!nextCountry || !nextCity)) {
    return { ok: false, code: "LOCATION_REQUIRED", httpStatus: 400, message: "country and city are required unless modality is remoto" };
  }

  const updates = {};
  if (position !== undefined) updates.position = position.trim();
  if (company !== undefined) updates.company = company.trim();
  if (area !== undefined) updates.area = area;
  if (modality !== undefined) updates.modality = modality;
  if (nextModality === "remoto") {
    if (modality !== undefined) {
      updates.country = null;
      updates.city = null;
    }
  } else {
    if (country !== undefined) updates.country = country.trim();
    if (city !== undefined) updates.city = city.trim();
  }
  if (salaryFieldsTouched) {
    if (salaryMin !== undefined) updates.salary_min = salaryMin;
    if (salaryMax !== undefined) updates.salary_max = salaryMax;
    if (salaryCurrency !== undefined) updates.salary_currency = salaryCurrency;
    if (salaryPeriod !== undefined) updates.salary_period = salaryPeriod;
  }
  if (description !== undefined) updates.description = description.trim();
  if (requirements !== undefined) updates.requirements = requirements.map((r) => r.trim());

  await vacancy.update(updates);

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
      },
    },
  };
}

module.exports = { updateVacancy };
