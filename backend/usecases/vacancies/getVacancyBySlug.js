const { UNVERIFIED_COMPANY_NOTICE } = require("./constants");

/**
 * Public vacancy detail by slug (RF-12), reachable without a session.
 * Also returns closed vacancies in read-only mode (RF-13) — the caller
 * decides whether to show the "apply" button based on `status`.
 * Never includes the applicant count (RF-10, RF-27, RN-06).
 * Returns a result object — never throws on business errors.
 */
async function getVacancyBySlug({ models, slug }) {
  if (!models || !slug) {
    throw new TypeError("getVacancyBySlug requires { models, slug }");
  }

  const vacancy = await models.Vacancy.findOne({ where: { slug } });
  if (!vacancy) {
    return { ok: false, code: "VACANCY_NOT_FOUND", httpStatus: 404, message: "Vacancy not found" };
  }

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
        closed_at: vacancy.closed_at,
        recruiter_wallet_address: vacancy.recruiter_wallet_address,
      },
      // RF-14 — exact wording required on the public vacancy page.
      unverified_company_notice: UNVERIFIED_COMPANY_NOTICE,
    },
  };
}

module.exports = { getVacancyBySlug };
