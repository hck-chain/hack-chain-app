/**
 * Marks an application as "vista" the first time the owning recruiter opens
 * its detail (RF-24). Idempotent: only the enviada → vista transition sets
 * viewed_at; later calls are a no-op. Notification (RF-21) is sent by the
 * caller (route), same convention as the rest of the module — this use case
 * only reports whether a transition actually happened.
 * Returns a result object — never throws on business errors.
 */
async function markApplicationViewed({ models, applicationId, recruiterWallet }) {
  if (!models || !applicationId || !recruiterWallet) {
    throw new TypeError("markApplicationViewed requires { models, applicationId, recruiterWallet }");
  }

  const application = await models.VacancyApplication.findOne({
    where: { id: applicationId },
    include: [{ model: models.Vacancy, as: "vacancy" }],
  });
  if (!application || application.vacancy?.recruiter_wallet_address !== recruiterWallet.toLowerCase()) {
    return { ok: false, code: "APPLICATION_NOT_FOUND", httpStatus: 404, message: "Application not found" };
  }

  let transitioned = false;
  if (application.status === "enviada") {
    await application.update({ status: "vista", viewed_at: new Date() });
    transitioned = true;
  }

  return {
    ok: true,
    data: {
      application: {
        id: application.id,
        vacancy_id: application.vacancy_id,
        student_wallet_address: application.student_wallet_address,
        shared_certificates: application.shared_certificates,
        message: application.message,
        status: application.status,
        submitted_at: application.submitted_at,
        viewed_at: application.viewed_at,
      },
      transitioned_to_viewed: transitioned,
    },
  };
}

module.exports = { markApplicationViewed };
