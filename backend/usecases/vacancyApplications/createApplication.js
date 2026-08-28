const { MAX_APPLICATION_MESSAGE_LENGTH } = require("../vacancies/constants");

function validateMessage(message) {
  if (message === undefined || message === null || message === "") return null;
  if (typeof message !== "string" || message.length > MAX_APPLICATION_MESSAGE_LENGTH) {
    return { ok: false, code: "MESSAGE_TOO_LONG", httpStatus: 400, message: `message must be ${MAX_APPLICATION_MESSAGE_LENGTH} characters or less` };
  }
  return null;
}

function validateSharedCertificates(sharedCertificates) {
  // RF-16 — el talento puede no compartir ninguno.
  if (sharedCertificates === undefined || sharedCertificates === null) return null;
  if (!Array.isArray(sharedCertificates) || sharedCertificates.some((c) => typeof c !== "string")) {
    return { ok: false, code: "INVALID_SHARED_CERTIFICATES", httpStatus: 400, message: "shared_certificates must be an array of token_id strings" };
  }
  return null;
}

/**
 * Talent applies to a vacancy (RF-15). One application per vacancy per
 * talent (RF-19, RN via the DB unique index) and a fixed set of the
 * talent's own certificates may be shared (RF-16, RF-17, RN-07).
 * Returns a result object — never throws on business errors.
 */
async function createApplication({ models, vacancyId, studentWallet, sharedCertificates, message }) {
  if (!models || !vacancyId || !studentWallet) {
    throw new TypeError("createApplication requires { models, vacancyId, studentWallet }");
  }

  const invalid = validateMessage(message) || validateSharedCertificates(sharedCertificates);
  if (invalid) return invalid;

  const wallet = studentWallet.toLowerCase();

  const vacancy = await models.Vacancy.findOne({ where: { id: vacancyId } });
  if (!vacancy) {
    return { ok: false, code: "VACANCY_NOT_FOUND", httpStatus: 404, message: "Vacancy not found" };
  }
  if (vacancy.status !== "abierta") {
    return { ok: false, code: "VACANCY_CLOSED", httpStatus: 409, message: "This vacancy is no longer accepting applications" };
  }

  const certificateIds = sharedCertificates || [];
  if (certificateIds.length > 0) {
    // RN-07 — only the talent's own, non-revoked, issued certificates may be shared.
    const owned = await models.Certificate.findAll({
      where: { token_id: certificateIds, student_wallet_address: wallet, is_revoked: false, status: "issued" },
      attributes: ["token_id"],
    });
    if (owned.length !== certificateIds.length) {
      return { ok: false, code: "INVALID_SHARED_CERTIFICATES", httpStatus: 400, message: "One or more shared certificates don't belong to you" };
    }
  }

  const existing = await models.VacancyApplication.findOne({
    where: { vacancy_id: vacancy.id, student_wallet_address: wallet },
  });
  if (existing) {
    return { ok: false, code: "ALREADY_APPLIED", httpStatus: 409, message: "You already applied to this vacancy" };
  }

  let application;
  try {
    application = await models.VacancyApplication.create({
      vacancy_id: vacancy.id,
      student_wallet_address: wallet,
      shared_certificates: certificateIds,
      message: message ? message.trim() : null,
      status: "enviada",
      submitted_at: new Date(),
    });
  } catch (err) {
    // Race: two concurrent requests both pass the findOne check above.
    if (err.name === "SequelizeUniqueConstraintError") {
      return { ok: false, code: "ALREADY_APPLIED", httpStatus: 409, message: "You already applied to this vacancy" };
    }
    throw err;
  }

  return {
    ok: true,
    data: {
      application: {
        id: application.id,
        vacancy_id: application.vacancy_id,
        shared_certificates: application.shared_certificates,
        message: application.message,
        status: application.status,
        submitted_at: application.submitted_at,
      },
    },
  };
}

module.exports = { createApplication };
