import type { Schedule, Streak, DayOfWeek } from '@/types/timer';

// ========================================
// Constants
// ========================================

/** Ordered weekdays starting Monday, matching our DayOfWeek type */
const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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

// ========================================
// Helpers
// ========================================

/** Format a Date as 'YYYY-MM-DD' in local timezone */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a 'YYYY-MM-DD' string into a local Date at midnight */
function parseDateString(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Check whether two dates represent the same calendar day (local timezone) */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ========================================
// Schedule-day awareness
// ========================================

/**
 * Returns true when the given date's weekday is included in `schedule.days`.
 */
export function isScheduledDay(schedule: Schedule, date: Date): boolean {
  const dow = DAY_MAP[date.getDay()];
  return schedule.days.includes(dow);
}

/**
 * Walks backward from `fromDate` (exclusive) to find the most recent
 * calendar day whose weekday is in `schedule.days`.
 *
 * Safety: throws if schedule.days is empty (would loop forever).
 */
export function getPreviousScheduledDay(schedule: Schedule, fromDate: Date): Date {
  if (!schedule.days || schedule.days.length === 0) {
    throw new Error('getPreviousScheduledDay: schedule.days must not be empty');
  }

  const scheduledSet = new Set<DayOfWeek>(schedule.days);
  const cursor = new Date(fromDate);

  // Walk backward day by day, max 8 iterations (7 days in a week + 1 safety)
  for (let i = 0; i < 8; i++) {
    cursor.setDate(cursor.getDate() - 1);
    const dow = DAY_MAP[cursor.getDay()];
    if (scheduledSet.has(dow)) {
      return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    }
  }

  // Should never reach here with a valid schedule
  throw new Error('getPreviousScheduledDay: could not find a previous scheduled day');
}

// ========================================
// Streak calculation
// ========================================

/**
 * Calculates the updated Streak after a completion event.
 *
 * Rules:
 * - First completion (no existing streak or count 0): starts at 1.
 * - Consecutive: previous scheduled day was completed → increment.
 * - Gap detected: previous scheduled day was NOT completed → reset to 1.
 * - Duplicate same-day completion: keeps current count (no double-increment).
 */
export function calculateStreakUpdate(
  currentStreak: Streak | undefined,
  schedule: Schedule,
  completionDate: Date = new Date(),
): Streak {
  const todayStr = toDateString(completionDate);

  // First completion ever
  if (!currentStreak || currentStreak.currentCount === 0) {
    return {
      currentCount: 1,
      lastCompletedDate: todayStr,
      startDate: todayStr,
    };
  }

  // Same-day duplicate — no change
  const lastDate = parseDateString(currentStreak.lastCompletedDate);
  if (isSameDay(lastDate, completionDate)) {
    return { ...currentStreak };
  }

  // Check if the previous scheduled day was the last completed day
  const prevScheduled = getPreviousScheduledDay(schedule, completionDate);
  const wasConsecutive = isSameDay(prevScheduled, lastDate);

  if (wasConsecutive) {
    // Increment
    return {
      currentCount: currentStreak.currentCount + 1,
      lastCompletedDate: todayStr,
      startDate: currentStreak.startDate,
    };
  }

  // Gap — reset
  return {
    currentCount: 1,
    lastCompletedDate: todayStr,
    startDate: todayStr,
  };
}

// ========================================
// Streak validation (passive check)
// ========================================

/**
 * Validates whether the current streak is still intact.
 *
 * Returns `null` if the streak is still valid (no action needed).
 * Returns a reset Streak (count: 0) if scheduled days were missed.
 *
 * Intended to be called on app load / library view to catch stale streaks.
 */
export function validateStreak(
  currentStreak: Streak | undefined,
  schedule: Schedule,
  today: Date = new Date(),
): Streak | null {
  // No streak to validate
  if (!currentStreak || currentStreak.currentCount === 0) return null;

  // If today is not a scheduled day, we can't determine staleness yet
  // (user might still complete on the next scheduled day)
  // But we can check: was the most recent scheduled day before today completed?
  const lastCompleted = parseDateString(currentStreak.lastCompletedDate);

  // If last completed is today, streak is valid
  if (isSameDay(lastCompleted, today)) return null;

  // Find the most recent scheduled day before today
  const prevScheduled = getPreviousScheduledDay(schedule, today);

  // If the previous scheduled day IS the last completed date, streak is still valid
  if (isSameDay(prevScheduled, lastCompleted)) return null;

  // There's a gap — reset
  return {
    currentCount: 0,
    lastCompletedDate: currentStreak.lastCompletedDate,
    startDate: '',
  };
}

// ========================================
// Milestones & display
// ========================================

const MILESTONES: Record<number, string> = {
  7: 'One week ☕',
  14: 'Two weeks 🌟',
  30: 'One month 🔥',
  100: '100 days 🏆',
};

/**
 * Returns a milestone message for notable streak counts, or `null` otherwise.
 */
export function getMilestone(count: number): string | null {
  return MILESTONES[count] ?? null;
}

/**
 * Returns display text for a streak badge.
 * Returns `null` when count is 0 (no streak to display).
 */
export function formatStreakBadge(count: number): string | null {
  if (count <= 0) return null;
  return `Day ${count} 🔥`;
}
