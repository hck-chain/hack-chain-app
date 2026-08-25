// requested_date/start_time on a ClassRequest are the agreed wall-clock time
// ("20:00" means 8pm for both parties), never UTC. Treating them as UTC
// directly (e.g. `new Date(`${date}T${time}:00Z`)`) shifts every comparison
// by the timezone's UTC offset — this bit classReminderWorker.js and
// classExpiryWorker.js, which need a real, comparable UTC instant (unlike
// the ICS/calendar-link display code in calendarService.js, which only
// needs the digits to look right and uses a "floating" time instead).

// The platform currently has no per-booking timezone — every class request
// is created and consumed by users in this single market.
const PLATFORM_TIME_ZONE = "America/Mexico_City";

/**
 * Converts a wall-clock local time ("YYYY-MM-DD" + "HH:MM") in the given IANA
 * timezone into the real UTC epoch milliseconds it represents.
 */
function localWallClockToUtcMs(dateStr, timeStr, timeZone = PLATFORM_TIME_ZONE) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);

  // Naive guess: treat the wall-clock digits as if they were already UTC.
  const naiveUtcMs = Date.UTC(y, m - 1, d, h, min, 0);

  // Ask the ICU timezone database what wall-clock time that instant actually
  // reads as in `timeZone`, then correct by the difference.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(new Date(naiveUtcMs))
    .reduce((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  const tzWallMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return naiveUtcMs + (naiveUtcMs - tzWallMs);
}

module.exports = { localWallClockToUtcMs, PLATFORM_TIME_ZONE };
