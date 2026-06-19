export interface CalendarEventParams {
  title: string;
  requestedDate: string;   // "YYYY-MM-DD"
  startTime: string;       // "HH:MM" or "HH:MM:SS"
  durationMinutes: number;
  description?: string;
  uid?: string;
}

function parseEventTimes(requestedDate: string, startTime: string, durationMinutes: number) {
  const [y, m, d] = requestedDate.split('-').map(Number);
  const [h, min] = startTime.split(':').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, h, min, 0));
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
}

function formatUTCDatetime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Builds a Google Calendar "Add to Calendar" URL.
 * Opens in a new tab so the user can add the event in one click.
 */
export function buildGoogleCalendarUrl({
  title,
  requestedDate,
  startTime,
  durationMinutes,
  description,
}: CalendarEventParams): string {
  const { start, end } = parseEventTimes(requestedDate, startTime, durationMinutes);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatUTCDatetime(start)}/${formatUTCDatetime(end)}`,
    details: description ?? 'Sesión privada reservada a través de HackChain.',
    location: 'HackChain — Online (hackchain.app)',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an ICS file and triggers a browser download.
 * Compatible with Apple Calendar and Outlook.
 */
export function downloadICS({
  title,
  requestedDate,
  startTime,
  durationMinutes,
  description,
  uid,
}: CalendarEventParams): void {
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
    `UID:${uid ?? `hackchain-class-${Date.now()}@hackchain.app`}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(description ?? 'Sesión privada reservada a través de HackChain.')}`,
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
  ].join('\r\n');

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
