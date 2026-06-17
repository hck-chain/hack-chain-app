const {
  VALID_DURATIONS,
  TIME_RE,
  MAX_MESSAGE_LENGTH,
} = require("./constants");

/**
 * Student sends a class request to an educator.
 * Returns a result object — never throws on business errors.
 */
async function requestClass({
  models,
  studentWallet,
  issuerWalletAddress,
  requestedDate,
  startTime,
  durationMinutes,
  hourlyRateUsd,
  studentMessage,
  issuerClassId,
  requestedTimestampUtc,
}) {
  if (!models || !studentWallet) {
    throw new TypeError("requestClass requires { models, studentWallet }");
  }

  if (!issuerWalletAddress || !requestedDate || !startTime || !durationMinutes) {
    return { ok: false, code: "MISSING_FIELDS", httpStatus: 400 };
  }

  if (!VALID_DURATIONS.includes(Number(durationMinutes))) {
    return { ok: false, code: "INVALID_DURATION", httpStatus: 400 };
  }

  if (!TIME_RE.test(startTime)) {
    return { ok: false, code: "INVALID_TIME_FORMAT", httpStatus: 400 };
  }

  // Prefer the UTC timestamp sent by the client — timezone-safe.
  // Fall back to reconstructing from date+time strings (tests, legacy callers).
  let classDateTime;
  if (requestedTimestampUtc) {
    classDateTime = new Date(requestedTimestampUtc);
  } else {
    const date = new Date(requestedDate);
    if (isNaN(date.getTime())) {
      return { ok: false, code: "INVALID_OR_PAST_DATE", httpStatus: 400 };
    }
    const [startH, startM] = startTime.split(':').map(Number);
    classDateTime = new Date(date);
    classDateTime.setHours(startH, startM, 0, 0);
  }

  if (isNaN(classDateTime.getTime())) {
    return { ok: false, code: "INVALID_OR_PAST_DATE", httpStatus: 400 };
  }

  const minLeadMs = 24 * 60 * 60 * 1000;
  if (classDateTime < new Date(Date.now() + minLeadMs)) {
    return { ok: false, code: "INSUFFICIENT_LEAD_TIME", httpStatus: 400 };
  }

  const issuer = await models.Issuer.findOne({
    where: { wallet_address: issuerWalletAddress.toLowerCase() },
  });

  if (!issuer || !issuer.class_settings) {
    return { ok: false, code: "EDUCATOR_NOT_FOUND", httpStatus: 404 };
  }

  const sanitizedMessage = studentMessage
    ? String(studentMessage).trim().slice(0, MAX_MESSAGE_LENGTH)
    : null;

  let resolvedClassId = null;
  let resolvedClassName = null;

  if (issuerClassId != null) {
    const issuerClass = await models.IssuerClass.findOne({
      where: {
        id: Number(issuerClassId),
        issuer_wallet_address: issuerWalletAddress.toLowerCase(),
        is_active: true,
      },
    });

    if (!issuerClass) {
      return { ok: false, code: "CLASS_NOT_FOUND", httpStatus: 400 };
    }

    resolvedClassId = issuerClass.id;
    resolvedClassName = issuerClass.name;
  }

  const record = await models.ClassRequest.create({
    student_wallet_address: studentWallet.toLowerCase(),
    issuer_wallet_address: issuerWalletAddress.toLowerCase(),
    requested_date: requestedDate,
    start_time: startTime,
    duration_minutes: Number(durationMinutes),
    hourly_rate_usd: hourlyRateUsd != null ? Number(hourlyRateUsd) : null,
    student_message: sanitizedMessage,
    issuer_class_id: resolvedClassId,
    class_name: resolvedClassName,
    status: "pending",
  });

  return { ok: true, data: { id: record.id, status: record.status, class_name: resolvedClassName } };
}

module.exports = { requestClass };
