// Tests for calendarUtils.ts — Google Calendar URL + ICS generation.
// downloadICS touches document/Blob/URL.createObjectURL (jsdom-only), so it's
// covered separately; buildGoogleCalendarUrl is pure and safe to test directly.

import { describe, it, expect } from 'vitest';
import { buildGoogleCalendarUrl } from '@/utils/calendarUtils';

const BASE_PARAMS = {
  title: 'Clase con Ana',
  requestedDate: '2026-08-24',
  startTime: '20:00',
  durationMinutes: 60,
};

describe('buildGoogleCalendarUrl', () => {
  it('encodes the event start/end as floating local time (no trailing Z)', () => {
    const url = buildGoogleCalendarUrl(BASE_PARAMS);
    const dates = new URL(url).searchParams.get('dates');
    expect(dates).toBe('20260824T200000/20260824T210000');
  });

  // Regression guard: the reported bug — a class agreed for 20:00 was
  // showing up 4 hours off once added to a calendar. Root cause was the
  // agreed local time being emitted with a Z suffix, so the calendar client
  // re-converted it through the viewer's own timezone.
  it('does not append Z to the start/end datetimes', () => {
    const url = buildGoogleCalendarUrl(BASE_PARAMS);
    const dates = new URL(url).searchParams.get('dates');
    expect(dates).not.toMatch(/Z/);
  });

  it('includes the title and a sensible default description', () => {
    const url = buildGoogleCalendarUrl(BASE_PARAMS);
    const params = new URL(url).searchParams;
    expect(params.get('text')).toBe(BASE_PARAMS.title);
    expect(params.get('details')).toContain('HackChain');
  });
});
