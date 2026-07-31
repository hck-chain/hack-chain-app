const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Reads a student's public profile (no email exposed).
 * Returns a result object — never throws on business errors.
 */
async function getPublicStudentProfile({ models, walletAddress }) {
  if (!models || !walletAddress) {
    throw new TypeError("getPublicStudentProfile requires { models, walletAddress }");
  }

  const wallet = walletAddress.toLowerCase();
  if (!WALLET_RE.test(wallet)) {
    return { ok: false, code: "INVALID_WALLET_ADDRESS", httpStatus: 400, message: "Invalid wallet address" };
  }

  const student = await models.Student.findOne({
    where: { wallet_address: wallet },
    include: [{ model: models.User, attributes: ["name", "lastname", "created_at"] }],
  });

  if (!student) {
    return { ok: false, code: "STUDENT_NOT_FOUND", httpStatus: 404, message: "Student not found" };
  }

  // Public count a recruiter relies on: revoked certificates and ones still
  // reserved (status 'pending', never minted on-chain) must not inflate it.
  // Revoking only flips is_revoked and leaves status as 'issued', so both apply.
  const totalCertificates = await models.Certificate.count({
    where: { student_wallet_address: wallet, is_revoked: false, status: "issued" },
  });

  return {
    ok: true,
    data: {
      student: {
        wallet_address: student.wallet_address,
        name: student.User?.name || null,
        lastname: student.User?.lastname || null,
        field_of_study: student.field_of_study || null,
        photo_url: student.photo_url || null,
        bio: student.bio || null,
        knowledge_areas: student.knowledge_areas || [],
        github_url: student.github_url || null,
        linkedin_url: student.linkedin_url || null,
        twitter_url: student.twitter_url || null,
        instagram_url: student.instagram_url || null,
        share_count: student.share_count,
        total_certificates: totalCertificates,
        joined_at: student.User?.created_at || student.created_at,
      },
    },
  };
}

module.exports = { getPublicStudentProfile };
