const { Op } = require("sequelize");

/**
 * Closes a vacancy (manually, by its owning recruiter) and marks every
 * application still waiting on a response as "cerrada_sin_respuesta"
 * (RF-07, RN-08). Exported separately (closeVacancyRecord) so the expiry
 * worker can reuse the exact same closing logic for automatic closes,
 * keeping manual and automatic closes from diverging.
 * Returns a result object — never throws on business errors.
 */
async function closeVacancyRecord(vacancy, models) {
  await vacancy.update({ status: "cerrada", closed_at: new Date() });

  await models.VacancyApplication.update(
    { status: "cerrada_sin_respuesta", status_changed_at: new Date(), status_changed_by: "system" },
    { where: { vacancy_id: vacancy.id, status: { [Op.in]: ["enviada", "vista"] } } }
  );

  return models.VacancyApplication.findAll({
    where: { vacancy_id: vacancy.id, status: "cerrada_sin_respuesta" },
    attributes: ["id", "student_wallet_address"],
  });
}

async function closeVacancy({ models, vacancyId, recruiterWallet }) {
  if (!models || !vacancyId || !recruiterWallet) {
    throw new TypeError("closeVacancy requires { models, vacancyId, recruiterWallet }");
  }

  const vacancy = await models.Vacancy.findOne({
    where: { id: vacancyId, recruiter_wallet_address: recruiterWallet.toLowerCase() },
  });
  if (!vacancy) {
    return { ok: false, code: "VACANCY_NOT_FOUND", httpStatus: 404, message: "Vacancy not found" };
  }

  // A closed vacancy never reopens (§4.1).
  if (vacancy.status === "cerrada") {
    return { ok: false, code: "VACANCY_ALREADY_CLOSED", httpStatus: 409, message: "Vacancy is already closed" };
  }

  const affectedApplications = await closeVacancyRecord(vacancy, models);

  return {
    ok: true,
    data: {
      vacancy: { id: vacancy.id, slug: vacancy.slug, status: vacancy.status, closed_at: vacancy.closed_at },
      notified_applications: affectedApplications.map((a) => ({ id: a.id, student_wallet_address: a.student_wallet_address })),
    },
  };
}

module.exports = { closeVacancy, closeVacancyRecord };
