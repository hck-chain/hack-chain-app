import type { DayKey, WeeklyAvailability } from '@/types/dashboard';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface UpcomingDay {
  date: Date;
  dayKey: DayKey;
}

const DAY_INDEX: Record<DayKey, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateSlots(start: string, end: string, durationMin: number): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  while (current + durationMin <= endMin) {
    slots.push({ start: minutesToTime(current), end: minutesToTime(current + durationMin) });
    current += durationMin;
  }

  return slots;
}

// Returns the next N days (starting today) that match an enabled day in availability.
export function getUpcomingDays(availability: WeeklyAvailability, daysAhead = 14): UpcomingDay[] {
  const result: UpcomingDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const jsDay = date.getDay(); // 0 = Sunday
    const dayKey = (Object.entries(DAY_INDEX) as [DayKey, number][]).find(
      ([, idx]) => idx === jsDay
    )?.[0];

    if (dayKey && availability[dayKey]?.enabled) {
      result.push({ date, dayKey });
    }
  }

  return result;
}
