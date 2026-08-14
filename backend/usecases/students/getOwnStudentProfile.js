/**
 * Reads the authenticated student's own full profile.
 * Returns a result object — never throws on business errors.
 */
async function getOwnStudentProfile({ models, wallet }) {
  if (!models || !wallet) {
    throw new TypeError("getOwnStudentProfile requires { models, wallet }");
  }

  const student = await models.Student.findOne({
    where: { wallet_address: wallet.toLowerCase() },
    include: [{ model: models.User, attributes: ["name", "lastname", "email", "email_verified"] }],
  });

  if (!student) {
    return { ok: false, code: "STUDENT_NOT_FOUND", httpStatus: 404, message: "Student not found" };
  }

  return {
    ok: true,
    data: {
      wallet_address: student.wallet_address,
      field_of_study: student.field_of_study,
      photo_url: student.photo_url,
      bio: student.bio,
      knowledge_areas: student.knowledge_areas ?? [],
      github_url: student.github_url,
      linkedin_url: student.linkedin_url,
      twitter_url: student.twitter_url,
      instagram_url: student.instagram_url,
      share_count: student.share_count,
      // name/lastname/email are read-only here — they live on User and are not
      // editable through PATCH /me (changing an email needs its own re-verification flow).
      name: student.User?.name ?? null,
      lastname: student.User?.lastname ?? null,
      email: student.User?.email ?? null,
      email_verified: student.User?.email_verified ?? false,
    },
  };
}

module.exports = { getOwnStudentProfile };
