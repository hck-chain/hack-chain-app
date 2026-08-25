const { VACANCY_AREAS, VACANCY_MODALITIES } = require("./constants");

function serializeVacancy(vacancy) {
  const daysToClose = Math.max(0, Math.ceil((new Date(`${vacancy.closing_date}T00:00:00Z`).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return {
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
    closing_date: vacancy.closing_date,
    days_to_close: daysToClose,
    published_at: vacancy.published_at,
    // Deliberately no applications_count / unreviewed_count here (RF-10, RF-27,
    // RN-06) — that data only ever appears in the owning recruiter's own endpoints.
  };
}

/**
 * Public listing of open vacancies (RF-08, RF-09, RN-05). Also used for
 * RF-11 (a recruiter's open vacancies on their public profile) via the
 * optional `recruiterWallet` filter.
 * Returns a result object — never throws on business errors.
 */
async function listVacancies({ models, area, modality, q, recruiterWallet }) {
  if (!models) {
    throw new TypeError("listVacancies requires { models }");
  }

  if (area !== undefined && !VACANCY_AREAS.includes(area)) {
    return { ok: false, code: "INVALID_AREA", httpStatus: 400, message: `area must be one of: ${VACANCY_AREAS.join(", ")}` };
  }
  if (modality !== undefined && !VACANCY_MODALITIES.includes(modality)) {
    return { ok: false, code: "INVALID_MODALITY", httpStatus: 400, message: `modality must be one of: ${VACANCY_MODALITIES.join(", ")}` };
  }

  const { Op } = models.Sequelize;
  const where = { status: "abierta" };
  if (area) where.area = area;
  if (modality) where.modality = modality;
  if (recruiterWallet) where.recruiter_wallet_address = recruiterWallet.toLowerCase();
  if (q) {
    // Op.like, not Op.iLike: iLike is Postgres-only and the test suite runs on
    // SQLite. SQLite's LIKE is already case-insensitive for ASCII, and Postgres's
    // LIKE is close enough for this MVP search (no precedent for iLike in the repo).
    const term = `%${q}%`;
    where[Op.or] = [{ position: { [Op.like]: term } }, { company: { [Op.like]: term } }];
  }

  const vacancies = await models.Vacancy.findAll({
    where,
    // RF-08, RN-05 — always chronological, never by popularity.
    order: [["published_at", "DESC"]],
  });

  return { ok: true, data: { vacancies: vacancies.map(serializeVacancy) } };
}

module.exports = { listVacancies, serializeVacancy };
