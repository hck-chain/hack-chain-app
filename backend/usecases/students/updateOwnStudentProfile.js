const MAX_BIO_LENGTH = 500;
const MAX_KNOWLEDGE_AREAS = 5;
const MAX_KNOWLEDGE_AREA_LENGTH = 100;
const MAX_URL_LENGTH = 500;
const MAX_FIELD_OF_STUDY_LENGTH = 255;
const HTTPS_URL_RE = /^https:\/\/\S+$/;

// Social links map 1:1 to columns; null clears the link, same as photo_url on the issuer side.
const SOCIAL_FIELDS = [
  { arg: "githubUrl", column: "github_url", code: "INVALID_GITHUB_URL", label: "github_url" },
  { arg: "linkedinUrl", column: "linkedin_url", code: "INVALID_LINKEDIN_URL", label: "linkedin_url" },
  { arg: "twitterUrl", column: "twitter_url", code: "INVALID_TWITTER_URL", label: "twitter_url" },
  { arg: "instagramUrl", column: "instagram_url", code: "INVALID_INSTAGRAM_URL", label: "instagram_url" },
];

function validateBio(bio) {
  if (bio === undefined || bio === null) return null;
  if (typeof bio !== "string") {
    return { ok: false, code: "INVALID_BIO", httpStatus: 400, message: "bio must be a string" };
  }
  if (bio.length > MAX_BIO_LENGTH) {
    return { ok: false, code: "BIO_TOO_LONG", httpStatus: 400, message: "bio must be 500 characters or less" };
  }
  return null;
}

function validateKnowledgeAreas(knowledgeAreas) {
  if (knowledgeAreas === undefined) return null;
  if (!Array.isArray(knowledgeAreas)) {
    return { ok: false, code: "INVALID_KNOWLEDGE_AREAS", httpStatus: 400, message: "knowledge_areas must be an array" };
  }
  if (knowledgeAreas.length > MAX_KNOWLEDGE_AREAS) {
    return { ok: false, code: "TOO_MANY_KNOWLEDGE_AREAS", httpStatus: 400, message: "Maximum 5 knowledge areas allowed" };
  }
  if (knowledgeAreas.some((a) => typeof a !== "string" || a.length > MAX_KNOWLEDGE_AREA_LENGTH)) {
    return {
      ok: false,
      code: "INVALID_KNOWLEDGE_AREA",
      httpStatus: 400,
      message: "Each knowledge area must be a string of max 100 characters",
    };
  }
  return null;
}

function validateSocialUrl(value, { code, label }) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > MAX_URL_LENGTH || !HTTPS_URL_RE.test(value.trim())) {
    return { ok: false, code, httpStatus: 400, message: `${label} must be a valid https:// URL` };
  }
  return null;
}

function validateFieldOfStudy(fieldOfStudy) {
  if (fieldOfStudy === undefined || fieldOfStudy === null) return null;
  if (typeof fieldOfStudy !== "string" || fieldOfStudy.length > MAX_FIELD_OF_STUDY_LENGTH) {
    return {
      ok: false,
      code: "INVALID_FIELD_OF_STUDY",
      httpStatus: 400,
      message: "field_of_study must be a string of max 255 characters",
    };
  }
  return null;
}

/**
 * Updates the authenticated student's own profile.
 * Only columns on `students` are writable — name/lastname/email live on User and
 * stay read-only (changing an email needs its own re-verification flow).
 * Returns a result object — never throws on business errors.
 */
async function updateOwnStudentProfile({ models, wallet, ...fields }) {
  if (!models || !wallet) {
    throw new TypeError("updateOwnStudentProfile requires { models, wallet }");
  }

  const { bio, knowledgeAreas, fieldOfStudy } = fields;

  const invalid =
    validateBio(bio) ||
    validateKnowledgeAreas(knowledgeAreas) ||
    validateFieldOfStudy(fieldOfStudy) ||
    SOCIAL_FIELDS.reduce((found, f) => found || validateSocialUrl(fields[f.arg], f), null);
  if (invalid) return invalid;

  const student = await models.Student.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!student) {
    return { ok: false, code: "STUDENT_NOT_FOUND", httpStatus: 404, message: "Student not found" };
  }

  const updates = {};
  if (bio !== undefined) updates.bio = bio === null ? null : bio.trim();
  if (knowledgeAreas !== undefined) updates.knowledge_areas = knowledgeAreas;
  if (fieldOfStudy !== undefined) updates.field_of_study = fieldOfStudy === null ? null : fieldOfStudy.trim();
  for (const f of SOCIAL_FIELDS) {
    const value = fields[f.arg];
    if (value !== undefined) updates[f.column] = value === null ? null : value.trim();
  }

  await student.update(updates);

  return {
    ok: true,
    data: {
      message: "Profile updated",
      student: {
        wallet_address: student.wallet_address,
        field_of_study: student.field_of_study,
        photo_url: student.photo_url,
        bio: student.bio,
        knowledge_areas: student.knowledge_areas,
        github_url: student.github_url,
        linkedin_url: student.linkedin_url,
        twitter_url: student.twitter_url,
        instagram_url: student.instagram_url,
      },
    },
  };
}

module.exports = { updateOwnStudentProfile };
