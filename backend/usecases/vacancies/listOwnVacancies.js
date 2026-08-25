/**
 * Recruiter's own vacancies (open AND closed), each with its applicant counts
 * (RF-22) — this is the only place those counts are ever exposed (RF-27, RN-06).
 * Returns a result object — never throws on business errors.
 */
async function listOwnVacancies({ models, recruiterWallet }) {
  if (!models || !recruiterWallet) {
    throw new TypeError("listOwnVacancies requires { models, recruiterWallet }");
  }

  const vacancies = await models.Vacancy.findAll({
    where: { recruiter_wallet_address: recruiterWallet.toLowerCase() },
    order: [["published_at", "DESC"]],
  });

  const counts = vacancies.length === 0 ? [] : await models.VacancyApplication.findAll({
    where: { vacancy_id: vacancies.map((v) => v.id) },
    attributes: ["vacancy_id", "status", [models.Sequelize.fn("COUNT", models.Sequelize.col("id")), "count"]],
    group: ["vacancy_id", "status"],
    raw: true,
  });

  const byVacancy = new Map();
  for (const row of counts) {
    if (!byVacancy.has(row.vacancy_id)) byVacancy.set(row.vacancy_id, { total: 0, unreviewed: 0 });
    const entry = byVacancy.get(row.vacancy_id);
    const n = Number(row.count);
    entry.total += n;
    if (row.status === "enviada") entry.unreviewed += n;
  }

  return {
    ok: true,
    data: {
      vacancies: vacancies.map((vacancy) => {
        const entry = byVacancy.get(vacancy.id) || { total: 0, unreviewed: 0 };
        return {
          id: vacancy.id,
          slug: vacancy.slug,
          position: vacancy.position,
          company: vacancy.company,
          area: vacancy.area,
          modality: vacancy.modality,
          salary_min: vacancy.salary_min,
          salary_max: vacancy.salary_max,
          salary_currency: vacancy.salary_currency,
          salary_period: vacancy.salary_period,
          closing_date: vacancy.closing_date,
          status: vacancy.status,
          published_at: vacancy.published_at,
          closed_at: vacancy.closed_at,
          applications_count: entry.total,
          unreviewed_count: entry.unreviewed,
        };
      }),
    },
  };
}

module.exports = { listOwnVacancies };
