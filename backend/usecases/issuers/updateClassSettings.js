const { VALID_DURATIONS, VALID_DAYS, TIME_RE } = require("./constants");

function validateAvailability(availability) {
  if (typeof availability !== "object" || availability === null || Array.isArray(availability)) {
    return "availability must be an object";
  }

  // Whitelist-only: reject any key that is not a valid day to prevent JSONB injection
  const incomingKeys = Object.keys(availability);
  const extraKeys = incomingKeys.filter((k) => !VALID_DAYS.includes(k));
  if (extraKeys.length > 0) {
    return `availability contains invalid keys: ${extraKeys.join(", ")}`;
  }

  for (const day of VALID_DAYS) {
    const slot = Object.prototype.hasOwnProperty.call(availability, day) ? availability[day] : undefined;
    if (slot === undefined || slot === null) continue;
    if (typeof slot !== "object" || Array.isArray(slot)) {
      return `availability.${day} must be an object`;
    }
    if (typeof slot.enabled !== "boolean") {
      return `availability.${day}.enabled must be a boolean`;
    }
    if (slot.enabled) {
      if (!TIME_RE.test(slot.start) || !TIME_RE.test(slot.end)) {
        return `availability.${day} must have valid HH:MM start and end times`;
      }
      if (slot.start >= slot.end) {
        return `availability.${day}.start must be before end`;
      }
    }
  }

  return null;
}

/**
 * Updates the authenticated issuer's class_settings (partial merge).
 * Returns a result object — never throws on business errors.
 */
async function updateClassSettings({
  models,
  wallet,
  hourlyRateUsd,
  acceptUsdc,
  durations,
  availability,
  googleCalendarUrl,
}) {
  if (!models || !wallet) {
    throw new TypeError("updateClassSettings requires { models, wallet }");
  }

  if (hourlyRateUsd !== undefined && hourlyRateUsd !== null) {
    if (typeof hourlyRateUsd !== "number" || hourlyRateUsd < 0 || hourlyRateUsd > 9999) {
      return {
        ok: false, code: "INVALID_HOURLY_RATE", httpStatus: 400,
        message: "hourly_rate_usd must be a number between 0 and 9999",
      };
    }
  }

  if (acceptUsdc !== undefined && typeof acceptUsdc !== "boolean") {
    return {
      ok: false, code: "INVALID_ACCEPT_USDC", httpStatus: 400,
      message: "accept_usdc must be a boolean",
    };
  }

  if (durations !== undefined) {
    const isValid =
      Array.isArray(durations) &&
      durations.length > 0 &&
      durations.length <= VALID_DURATIONS.length &&
      durations.every((d) => VALID_DURATIONS.includes(d)) &&
      new Set(durations).size === durations.length;

    if (!isValid) {
      return {
        ok: false, code: "INVALID_DURATIONS", httpStatus: 400,
        message: "durations must be a non-empty array of unique values from [30, 45, 60]",
      };
    }
  }

  if (availability !== undefined) {
    const error = validateAvailability(availability);
    if (error) {
      return { ok: false, code: "INVALID_AVAILABILITY", httpStatus: 400, message: error };
    }
  }

  if (googleCalendarUrl !== undefined && googleCalendarUrl !== null) {
    if (typeof googleCalendarUrl !== "string" || googleCalendarUrl.length > 1000) {
      return {
        ok: false, code: "INVALID_GOOGLE_CALENDAR_URL", httpStatus: 400,
        message: "google_calendar_url must be a string of max 1000 characters",
      };
    }
    if (
      googleCalendarUrl.trim().length > 0 &&
      !googleCalendarUrl.trim().startsWith("https://calendar.google.com/")
    ) {
      return {
        ok: false, code: "INVALID_GOOGLE_CALENDAR_URL", httpStatus: 400,
        message: "google_calendar_url must be a valid Google Calendar embed URL",
      };
    }
  }

  const issuer = await models.Issuer.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!issuer) {
    return { ok: false, code: "ISSUER_NOT_FOUND", httpStatus: 404, message: "Issuer not found" };
  }

  const current = issuer.class_settings ?? {};
  const updated = {
    ...current,
    ...(hourlyRateUsd !== undefined && { hourly_rate_usd: hourlyRateUsd ?? null }),
    ...(acceptUsdc !== undefined && { accept_usdc: acceptUsdc }),
    ...(durations !== undefined && { durations }),
    ...(availability !== undefined && { availability }),
    ...(googleCalendarUrl !== undefined && { google_calendar_url: googleCalendarUrl?.trim() || null }),
  };

  await issuer.update({ class_settings: updated });

  return { ok: true, data: { class_settings: issuer.class_settings } };
}

module.exports = { updateClassSettings };
