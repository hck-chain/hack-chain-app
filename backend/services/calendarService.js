/**
 * Utilities for Google Calendar URL generation and ICS file creation.
 * Treats all datetimes as UTC — the event description informs attendees.
 */

function icsEscape(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// "YYYYMMDDTHHMMSSZ" — used in both Google Calendar URLs and ICS datetimes
function formatUTCDatetime(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function parseEventTimes(requestedDate, startTime, durationMinutes) {
  const [y, m, d] = requestedDate.split('-').map(Number);
  const [h, min] = startTime.split(':').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, h, min, 0));
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
}

/**
 * Builds a Google Calendar "Add to Calendar" URL.
 */
function buildGoogleCalendarUrl({ title, requestedDate, startTime, durationMinutes, description }) {
  const { start, end } = parseEventTimes(requestedDate, startTime, durationMinutes);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatUTCDatetime(start)}/${formatUTCDatetime(end)}`,
    details: description || 'Sesión privada reservada a través de HackChain.',
    location: 'HackChain — Online (hackchain.app)',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an ICS (iCalendar) file content string.
 * Compatible with Google Calendar, Apple Calendar, and Outlook.
 */
function buildICS({ uid, title, requestedDate, startTime, durationMinutes, description }) {
  const { start, end } = parseEventTimes(requestedDate, startTime, durationMinutes);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HackChain//HackChain Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatUTCDatetime(start)}`,
    `DTEND:${formatUTCDatetime(end)}`,
    `DTSTAMP:${formatUTCDatetime(now)}`,
    `UID:${uid || `hackchain-class-${Date.now()}@hackchain.app`}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(description || 'Sesión privada reservada a través de HackChain.')}`,
    'LOCATION:HackChain — Online (hackchain.app)',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de clase — HackChain',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/**
 * Returns the ICS as a Buffer ready for attaching to an email via Resend.
 */
function buildICSBuffer({ uid, title, requestedDate, startTime, durationMinutes, description }) {
  const content = buildICS({ uid, title, requestedDate, startTime, durationMinutes, description });
  return Buffer.from(content, 'utf-8');
}

module.exports = { buildGoogleCalendarUrl, buildICS, buildICSBuffer };
