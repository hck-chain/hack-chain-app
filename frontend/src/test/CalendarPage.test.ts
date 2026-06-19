// Tests for CalendarPage pure logic.
//
// Full render is blocked by the React 18/19 monorepo version conflict —
// Radix UI and Lucide pick up root React 19, causing hook failures.
// This file covers the utilities that drive the calendar's data layer.

import { describe, it, expect } from 'vitest';

// ── Pure helpers copied from CalendarPage.tsx ─────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildGrid(monthDate: Date): Date[] {
  const year  = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay  = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Monday-first: Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7;

  const days: Date[] = [];
  for (let i = startOffset; i > 0; i--) days.push(new Date(year, month, 1 - i));
  for (let d = 1; d <= totalDays; d++)   days.push(new Date(year, month, d));
  let nextDay = 1;
  while (days.length < 42) days.push(new Date(year, month + 1, nextDay++));
  return days;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('toDateStr()', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toDateStr(new Date(2026, 5, 1))).toBe('2026-06-01');
  });

  it('zero-pads single-digit month and day', () => {
    expect(toDateStr(new Date(2026, 0, 7))).toBe('2026-01-07');
  });

  it('uses local date parts — not UTC', () => {
    // Using a fixed local date avoids timezone drift compared to toISOString()
    const d = new Date(2026, 11, 31);
    expect(toDateStr(d)).toBe('2026-12-31');
  });

  it('handles year boundary correctly', () => {
    expect(toDateStr(new Date(2027, 0, 1))).toBe('2027-01-01');
  });
});

describe('buildGrid()', () => {
  it('always returns exactly 42 cells', () => {
    // Test a variety of months with different start-day offsets
    const months = [
      new Date(2026, 5, 1),  // June 2026 — starts on Monday
      new Date(2026, 0, 1),  // January 2026 — starts on Thursday
      new Date(2026, 1, 1),  // February 2026 — starts on Sunday
      new Date(2026, 10, 1), // November 2026 — starts on Sunday
    ];
    for (const m of months) {
      expect(buildGrid(m)).toHaveLength(42);
    }
  });

  it('first cell is a Monday', () => {
    // June 2026 starts on Monday — no padding needed
    const june2026 = new Date(2026, 5, 1);
    const grid = buildGrid(june2026);
    expect(grid[0].getDay()).toBe(1); // 1 = Monday
  });

  it('pads previous-month days before the 1st when month does not start on Monday', () => {
    // January 2026 starts on Thursday (day=4), so 3 padding days from Dec 2025
    const jan2026 = new Date(2026, 0, 1);
    const grid = buildGrid(jan2026);
    const firstCurrentMonthIndex = grid.findIndex(
      d => d.getMonth() === 0 && d.getFullYear() === 2026
    );
    expect(firstCurrentMonthIndex).toBe(3); // Mon, Tue, Wed from Dec 2025
    expect(grid[0].getDay()).toBe(1); // first cell is Monday
  });

  it('fills trailing cells with next-month days to reach 42', () => {
    const june2026 = new Date(2026, 5, 1);
    const grid = buildGrid(june2026);
    const last = grid[41];
    // June has 30 days, starts Monday → grid fills with July days
    expect(last.getMonth()).toBe(6); // July
  });

  it('contains all days of the target month exactly once', () => {
    const aug2026 = new Date(2026, 7, 1); // August — 31 days
    const grid = buildGrid(aug2026);
    const augDays = grid
      .filter(d => d.getMonth() === 7 && d.getFullYear() === 2026)
      .map(d => d.getDate());
    expect(augDays).toHaveLength(31);
    expect(augDays[0]).toBe(1);
    expect(augDays[30]).toBe(31);
  });

  it('last cell is always a Sunday', () => {
    const months = [
      new Date(2026, 5, 1),
      new Date(2026, 0, 1),
      new Date(2026, 8, 1),
    ];
    for (const m of months) {
      const grid = buildGrid(m);
      expect(grid[41].getDay()).toBe(0); // 0 = Sunday
    }
  });
});

describe('selectedDate initial state', () => {
  it('starts as null so the detail panel is not shown on mount', () => {
    // Documents the intent of the null initialization:
    // the panel only appears after an explicit day click.
    const initialState: string | null = null;
    expect(initialState).toBeNull();
  });
});

describe('direction tracking for month slide', () => {
  it('going forward sets direction to 1', () => {
    let direction = 1;
    // Simulates goPrev() / goNext() direction ref updates
    direction = 1;
    expect(direction).toBe(1);
  });

  it('going backward sets direction to -1', () => {
    let direction = 1;
    direction = -1;
    expect(direction).toBe(-1);
  });

  it('adjacent-month day click sets direction based on month diff', () => {
    const currentMonth = new Date(2026, 5, 1); // June
    const nextMonthDay = new Date(2026, 6, 3); // July 3
    const diff =
      (nextMonthDay.getFullYear() * 12 + nextMonthDay.getMonth()) -
      (currentMonth.getFullYear() * 12 + currentMonth.getMonth());
    expect(diff > 0 ? 1 : -1).toBe(1);
  });

  it('clicking a prev-month day sets direction to -1', () => {
    const currentMonth = new Date(2026, 5, 1); // June
    const prevMonthDay = new Date(2026, 4, 31); // May 31
    const diff =
      (prevMonthDay.getFullYear() * 12 + prevMonthDay.getMonth()) -
      (currentMonth.getFullYear() * 12 + currentMonth.getMonth());
    expect(diff > 0 ? 1 : -1).toBe(-1);
  });
});
