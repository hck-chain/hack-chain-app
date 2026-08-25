const VALID_TRANSITIONS = ["contactado", "descartada"];

/**
 * Recruiter marks an application Contactado or Descartada (RF-26). Every
 * change is stamped with author and date (RNF-06). RN-08 — every application
 * ends in contactado, descartada, or cerrada_sin_respuesta (the last one is
 * set by closeVacancy/the expiry worker, not here).
 *
 * "Contactado" here is a status change only — there is no chat module in the
 * repo yet (see PR notes), so no contact channel is revealed to the talent.
 * Returns a result object — never throws on business errors.
 */
async function updateApplicationStatus({ models, applicationId, recruiterWallet, status }) {
  if (!models || !applicationId || !recruiterWallet) {
    throw new TypeError("updateApplicationStatus requires { models, applicationId, recruiterWallet }");
  }

  if (!VALID_TRANSITIONS.includes(status)) {
    return { ok: false, code: "INVALID_STATUS", httpStatus: 400, message: `status must be one of: ${VALID_TRANSITIONS.join(", ")}` };
  }

  const application = await models.VacancyApplication.findOne({
    where: { id: applicationId },
    include: [{ model: models.Vacancy, as: "vacancy" }],
  });
  if (!application || application.vacancy?.recruiter_wallet_address !== recruiterWallet.toLowerCase()) {
    return { ok: false, code: "APPLICATION_NOT_FOUND", httpStatus: 404, message: "Application not found" };
  }

  if (application.status === "cerrada_sin_respuesta") {
    return { ok: false, code: "APPLICATION_CLOSED", httpStatus: 409, message: "This application's vacancy is already closed" };
  }

  await application.update({
    status,
    status_changed_at: new Date(),
    status_changed_by: recruiterWallet.toLowerCase(),
  });

  return {
    ok: true,
    data: {
      application: {
        id: application.id,
        vacancy_id: application.vacancy_id,
        student_wallet_address: application.student_wallet_address,
        status: application.status,
        status_changed_at: application.status_changed_at,
      },
    },
  };
}

module.exports = { updateApplicationStatus };
