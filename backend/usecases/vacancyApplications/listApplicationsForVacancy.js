// Same URL shape as GET /api/opensea/certificate/:tokenId (routes/opensea.js) —
// kept independent from that route so this use case has no HTTP dependency.
function buildChainVerificationUrl(tokenId) {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress || !tokenId) return null;
  return `https://opensea.io/assets/matic/${contractAddress.toLowerCase()}/${tokenId}`;
}

/**
 * Applicants of one of the recruiter's own vacancies, ordered by submission
 * date (RF-23). Includes each shared certificate with its on-chain
 * verification link (RF-25). This — and getApplicationDetail — are the ONLY
 * places the applicant list (and therefore the count) is ever exposed
 * (RF-27, RN-06, RN-07).
 * Returns a result object — never throws on business errors.
 */
async function listApplicationsForVacancy({ models, vacancyId, recruiterWallet }) {
  if (!models || !vacancyId || !recruiterWallet) {
    throw new TypeError("listApplicationsForVacancy requires { models, vacancyId, recruiterWallet }");
  }

  const vacancy = await models.Vacancy.findOne({
    where: { id: vacancyId, recruiter_wallet_address: recruiterWallet.toLowerCase() },
  });
  if (!vacancy) {
    return { ok: false, code: "VACANCY_NOT_FOUND", httpStatus: 404, message: "Vacancy not found" };
  }

  const applications = await models.VacancyApplication.findAll({
    where: { vacancy_id: vacancy.id },
    include: [{ model: models.User, as: "student", attributes: ["name", "lastname", "wallet_address"] }],
    order: [["submitted_at", "DESC"]],
  });

  const allTokenIds = [...new Set(applications.flatMap((a) => a.shared_certificates || []))];
  const certificates = allTokenIds.length === 0 ? [] : await models.Certificate.findAll({
    where: { token_id: allTokenIds },
    attributes: ["token_id", "title", "issue_date"],
  });
  const certByTokenId = new Map(certificates.map((c) => [c.token_id, c]));

  return {
    ok: true,
    data: {
      vacancy: { id: vacancy.id, slug: vacancy.slug, position: vacancy.position },
      applications: applications.map((a) => ({
        id: a.id,
        student_wallet_address: a.student_wallet_address,
        student_name: [a.student?.name, a.student?.lastname].filter(Boolean).join(" ") || null,
        shared_certificates: (a.shared_certificates || []).map((tokenId) => {
          const cert = certByTokenId.get(tokenId);
          return {
            token_id: tokenId,
            title: cert?.title || null,
            issue_date: cert?.issue_date || null,
            chain_verification_url: buildChainVerificationUrl(tokenId),
          };
        }),
        message: a.message,
        status: a.status,
        submitted_at: a.submitted_at,
        viewed_at: a.viewed_at,
      })),
    },
  };
}

module.exports = { listApplicationsForVacancy };
