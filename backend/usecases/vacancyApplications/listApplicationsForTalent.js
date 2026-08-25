/**
 * Talent's own applications with each one's current status (RF-20).
 * Returns a result object — never throws on business errors.
 */
async function listApplicationsForTalent({ models, studentWallet }) {
  if (!models || !studentWallet) {
    throw new TypeError("listApplicationsForTalent requires { models, studentWallet }");
  }

  const applications = await models.VacancyApplication.findAll({
    where: { student_wallet_address: studentWallet.toLowerCase() },
    include: [{ model: models.Vacancy, as: "vacancy", attributes: ["id", "slug", "position", "company", "status"] }],
    order: [["submitted_at", "DESC"]],
  });

  return {
    ok: true,
    data: {
      applications: applications.map((a) => ({
        id: a.id,
        vacancy: a.vacancy ? { id: a.vacancy.id, slug: a.vacancy.slug, position: a.vacancy.position, company: a.vacancy.company, status: a.vacancy.status } : null,
        shared_certificates: a.shared_certificates,
        message: a.message,
        status: a.status,
        submitted_at: a.submitted_at,
        viewed_at: a.viewed_at,
      })),
    },
  };
}

module.exports = { listApplicationsForTalent };
