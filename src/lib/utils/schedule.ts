import type { Schedule, DayOfWeek, TimeOfDay, TimerTemplate } from '@/types/timer';

// ========================================
// Day-of-week mapping
// ========================================

/**
 * Maps JavaScript `Date.getDay()` (0 = Sunday) to our short `DayOfWeek` type.
 */
const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

/**
 * Returns true when today's weekday is included in the schedule's days list
 * and the schedule is enabled.
 *
 * All date comparisons use the local timezone of the provided Date object.
 */
export function isDueToday(schedule: Schedule, today: Date = new Date()): boolean {
  if (!schedule.enabled) return false;
  if (!schedule.days || schedule.days.length === 0) return false;

  const dayOfWeek = DAY_MAP[today.getDay()];
  return schedule.days.includes(dayOfWeek);
}

// ========================================
// Time-of-day buckets
// ========================================

/**
 * Returns the current time-of-day bucket based on the hour:
 * - morning:   00:00–11:59
 * - afternoon:  12:00–16:59
 * - evening:    17:00–23:59
 */
export function getTimeOfDayBucket(now: Date = new Date()): TimeOfDay {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Returns true when the schedule's time-of-day matches the current bucket,
 * or when the schedule is set to 'anytime'.
 */
export function isTimeOfDayMatch(schedule: Schedule, now: Date = new Date()): boolean {
  if (schedule.timeOfDay === 'anytime') return true;
  return schedule.timeOfDay === getTimeOfDayBucket(now);
}

// ========================================
// Timer sorting for library view
// ========================================

export interface SortedTimers {
  dueToday: TimerTemplate[];
  rest: TimerTemplate[];
}

/**
 * Splits a timer list into "due today" and "rest" groups.
 *
 * A timer lands in `dueToday` when:
 * 1. It has a schedule with `enabled === true`
 * 2. Today's weekday is in `schedule.days`
 * 3. Its id is NOT in `completedTodayIds`
 *
 * - `dueToday` is sorted alphabetically by timer name.
 * - `rest` preserves the incoming order (assumed most-recent-first from Firestore).
 */
export function sortTimersForLibrary(
  timers: TimerTemplate[],
  completedTodayIds: string[],
  today: Date = new Date(),
): SortedTimers {
  const completedSet = new Set(completedTodayIds);
  const dueToday: TimerTemplate[] = [];
  const rest: TimerTemplate[] = [];

  for (const timer of timers) {
    const schedule = timer.schedule;
    if (
      schedule &&
      isDueToday(schedule, today) &&
      !completedSet.has(timer.id)
    ) {
      dueToday.push(timer);
    } else {
      rest.push(timer);
    }
  }

  // Alphabetical sort for due-today section
  dueToday.sort((a, b) => a.name.localeCompare(b.name));

  return { dueToday, rest };
}
