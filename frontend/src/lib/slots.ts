import type { DayKey, WeeklyAvailability } from '@/types/dashboard';

export interface BusySlot {
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:MM"
  durationMinutes: number;
}

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

export const MIN_LEAD_HOURS = 24;

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

// Removes slots that start within MIN_LEAD_HOURS from now.
export function filterValidSlots(slots: TimeSlot[], date: Date): TimeSlot[] {
  const cutoff = new Date(Date.now() + MIN_LEAD_HOURS * 60 * 60 * 1000);
  return slots.filter((slot) => {
    const [h, m] = slot.start.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(h, m, 0, 0);
    return slotDateTime >= cutoff;
  });
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Returns true when a slot overlaps with any busy period on the same date.
// Overlap condition: slotStart < busyEnd && slotEnd > busyStart
export function isSlotBusy(
  slotStart: string,
  slotDate: Date,
  slotDuration: number,
  busySlots: BusySlot[],
): boolean {
  const dateStr = toDateStr(slotDate);
  const slotStartMin = timeToMinutes(slotStart);
  const slotEndMin = slotStartMin + slotDuration;

  return busySlots.some(busy => {
    if (busy.date !== dateStr) return false;
    const busyStartMin = timeToMinutes(busy.startTime);
    const busyEndMin = busyStartMin + busy.durationMinutes;
    return slotStartMin < busyEndMin && slotEndMin > busyStartMin;
  });
}

// Returns upcoming days that have at least one slot outside the lead-time window.
// A day is excluded if its availability end time falls before the cutoff — meaning
// no slot on that day can ever satisfy the MIN_LEAD_HOURS requirement.
export function getUpcomingDays(availability: WeeklyAvailability, daysAhead = 14): UpcomingDay[] {
  const result: UpcomingDay[] = [];
  const cutoff = new Date(Date.now() + MIN_LEAD_HOURS * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const jsDay = date.getDay();
    const dayKey = (Object.entries(DAY_INDEX) as [DayKey, number][]).find(
      ([, idx]) => idx === jsDay
    )?.[0];

    if (!dayKey || !availability[dayKey]?.enabled) continue;

    // Skip days where the last possible slot start (= end time) is before the cutoff.
    const [endH, endM] = availability[dayKey].end.split(':').map(Number);
    const dayEnd = new Date(date);
    dayEnd.setHours(endH, endM, 0, 0);
    if (dayEnd <= cutoff) continue;

    result.push({ date, dayKey });
  }

  return result;
}
