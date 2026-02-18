import { describe, it, expect } from 'vitest';
import {
  isScheduledDay,
  getPreviousScheduledDay,
  calculateStreakUpdate,
  validateStreak,
  getMilestone,
  formatStreakBadge,
} from './streaks';
import type { Schedule, Streak } from '@/types/timer';

// ========================================
// Helpers
// ========================================

function makeSchedule(
  days: Schedule['days'],
  timeOfDay: Schedule['timeOfDay'] = 'anytime',
  enabled = true,
): Schedule {
  return { enabled, days, timeOfDay };
}

function makeStreak(count: number, lastCompleted: string, startDate?: string): Streak {
  return {
    currentCount: count,
    lastCompletedDate: lastCompleted,
    startDate: startDate ?? lastCompleted,
  };
}

/** Shortcut: make a local Date at midnight from Y, M (1-based), D */
function day(year: number, month: number, date: number): Date {
  return new Date(year, month - 1, date);
}

// ========================================
// isScheduledDay
// ========================================

describe('isScheduledDay', () => {
  // 2026-02-16 Mon, 17 Tue, 18 Wed, 19 Thu, 20 Fri, 21 Sat, 22 Sun
  const weekdays = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri']);

  it('returns true for a scheduled weekday', () => {
    expect(isScheduledDay(weekdays, day(2026, 2, 16))).toBe(true); // Mon
    expect(isScheduledDay(weekdays, day(2026, 2, 20))).toBe(true); // Fri
  });

  it('returns false for a non-scheduled day', () => {
    expect(isScheduledDay(weekdays, day(2026, 2, 21))).toBe(false); // Sat
    expect(isScheduledDay(weekdays, day(2026, 2, 22))).toBe(false); // Sun
  });
});

// ========================================
// getPreviousScheduledDay
// ========================================

describe('getPreviousScheduledDay', () => {
  const weekdays = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri']);

  it('returns Friday when called from Monday (weekday schedule)', () => {
    const monday = day(2026, 2, 16);
    const prev = getPreviousScheduledDay(weekdays, monday);
    expect(prev.getFullYear()).toBe(2026);
    expect(prev.getMonth()).toBe(1); // Feb
    expect(prev.getDate()).toBe(13); // Friday Feb 13
  });

  it('returns Thursday when called from Friday', () => {
    const friday = day(2026, 2, 20);
    const prev = getPreviousScheduledDay(weekdays, friday);
    expect(prev.getDate()).toBe(19); // Thu
  });

  it('returns previous day for consecutive days', () => {
    const wednesday = day(2026, 2, 18);
    const prev = getPreviousScheduledDay(weekdays, wednesday);
    expect(prev.getDate()).toBe(17); // Tue
  });

  it('skips non-scheduled days', () => {
    const weekendOnly = makeSchedule(['sat', 'sun']);
    const monday = day(2026, 2, 16);
    const prev = getPreviousScheduledDay(weekendOnly, monday);
    expect(prev.getDate()).toBe(15); // Sun Feb 15
  });

  it('throws for empty schedule', () => {
    expect(() => {
      getPreviousScheduledDay(makeSchedule([]), day(2026, 2, 16));
    }).toThrow('schedule.days must not be empty');
  });
});

// ========================================
// calculateStreakUpdate
// ========================================

describe('calculateStreakUpdate', () => {
  const weekdays = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri']);
  const everyday = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

  describe('first completion', () => {
    it('starts at count 1 when no existing streak', () => {
      const result = calculateStreakUpdate(undefined, weekdays, day(2026, 2, 17));
      expect(result.currentCount).toBe(1);
      expect(result.lastCompletedDate).toBe('2026-02-17');
      expect(result.startDate).toBe('2026-02-17');
    });

    it('starts at count 1 when existing streak has count 0', () => {
      const streak = makeStreak(0, '');
      const result = calculateStreakUpdate(streak, weekdays, day(2026, 2, 17));
      expect(result.currentCount).toBe(1);
    });
  });

  describe('consecutive completions', () => {
    it('increments for consecutive weekdays', () => {
      // Completed Monday, now completing Tuesday
      const streak = makeStreak(3, '2026-02-16', '2026-02-12'); // Mon
      const result = calculateStreakUpdate(streak, weekdays, day(2026, 2, 17)); // Tue
      expect(result.currentCount).toBe(4);
      expect(result.lastCompletedDate).toBe('2026-02-17');
      expect(result.startDate).toBe('2026-02-12'); // preserved
    });

    it('increments across weekend gap for Mon–Fri schedule', () => {
      // Completed Friday, now completing Monday — no reset!
      const streak = makeStreak(5, '2026-02-20', '2026-02-16'); // Fri
      const result = calculateStreakUpdate(streak, weekdays, day(2026, 2, 23)); // Mon
      expect(result.currentCount).toBe(6);
      expect(result.lastCompletedDate).toBe('2026-02-23');
    });
  });

  describe('gap detection', () => {
    it('resets when a scheduled day was missed', () => {
      // Completed Wednesday, skipped Thursday, now completing Friday
      const streak = makeStreak(3, '2026-02-18', '2026-02-16'); // Wed
      const result = calculateStreakUpdate(streak, weekdays, day(2026, 2, 20)); // Fri
      // Previous scheduled day before Friday = Thursday. Last completed = Wednesday → gap!
      expect(result.currentCount).toBe(1);
      expect(result.startDate).toBe('2026-02-20');
    });

    it('resets when multiple days were missed', () => {
      // Completed Monday, now completing Thursday (missed Tue + Wed)
      const streak = makeStreak(5, '2026-02-16', '2026-02-10'); // Mon
      const result = calculateStreakUpdate(streak, weekdays, day(2026, 2, 19)); // Thu
      expect(result.currentCount).toBe(1);
    });
  });

  describe('same-day duplicate', () => {
    it('does not double-increment for same-day completion', () => {
      const streak = makeStreak(3, '2026-02-17', '2026-02-15');
      const result = calculateStreakUpdate(streak, weekdays, day(2026, 2, 17));
      expect(result.currentCount).toBe(3); // unchanged
      expect(result.lastCompletedDate).toBe('2026-02-17');
    });
  });

  describe('every-day schedule', () => {
    it('increments for consecutive calendar days', () => {
      const streak = makeStreak(2, '2026-02-16', '2026-02-15');
      const result = calculateStreakUpdate(streak, everyday, day(2026, 2, 17));
      expect(result.currentCount).toBe(3);
    });

    it('resets when a day is skipped', () => {
      const streak = makeStreak(5, '2026-02-15', '2026-02-11');
      const result = calculateStreakUpdate(streak, everyday, day(2026, 2, 17)); // skipped 16
      expect(result.currentCount).toBe(1);
    });
  });
});

// ========================================
// validateStreak
// ========================================

describe('validateStreak', () => {
  const weekdays = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri']);

  it('returns null when no streak exists', () => {
    expect(validateStreak(undefined, weekdays, day(2026, 2, 17))).toBeNull();
  });

  it('returns null when streak count is 0', () => {
    const streak = makeStreak(0, '');
    expect(validateStreak(streak, weekdays, day(2026, 2, 17))).toBeNull();
  });

  it('returns null when last completed is today', () => {
    const streak = makeStreak(5, '2026-02-17');
    expect(validateStreak(streak, weekdays, day(2026, 2, 17))).toBeNull();
  });

  it('returns null when streak is still valid (last completed is previous scheduled day)', () => {
    // Completed Monday, checking on Tuesday — still valid
    const streak = makeStreak(5, '2026-02-16');
    expect(validateStreak(streak, weekdays, day(2026, 2, 17))).toBeNull();
  });

  it('returns null across weekend gap (Fri → Mon)', () => {
    // Completed Friday, checking on Monday — still valid for Mon–Fri schedule
    const streak = makeStreak(5, '2026-02-20');
    expect(validateStreak(streak, weekdays, day(2026, 2, 23))).toBeNull();
  });

  it('returns reset streak when gap detected', () => {
    // Completed Wednesday, checking on Friday — missed Thursday
    const streak = makeStreak(5, '2026-02-18');
    const result = validateStreak(streak, weekdays, day(2026, 2, 20));
    expect(result).not.toBeNull();
    expect(result!.currentCount).toBe(0);
  });

  it('returns reset streak for stale multi-day gap', () => {
    // Completed Monday, checking on Thursday — missed Tue + Wed
    const streak = makeStreak(10, '2026-02-16');
    const result = validateStreak(streak, weekdays, day(2026, 2, 19));
    expect(result).not.toBeNull();
    expect(result!.currentCount).toBe(0);
  });
});

// ========================================
// getMilestone
// ========================================

describe('getMilestone', () => {
  it('returns message for day 7', () => {
    expect(getMilestone(7)).toBe('One week ☕');
  });

  it('returns message for day 14', () => {
    expect(getMilestone(14)).toBe('Two weeks 🌟');
  });

  it('returns message for day 30', () => {
    expect(getMilestone(30)).toBe('One month 🔥');
  });

  it('returns message for day 100', () => {
    expect(getMilestone(100)).toBe('100 days 🏆');
  });

  it('returns null for non-milestone days', () => {
    expect(getMilestone(1)).toBeNull();
    expect(getMilestone(6)).toBeNull();
    expect(getMilestone(8)).toBeNull();
    expect(getMilestone(15)).toBeNull();
    expect(getMilestone(50)).toBeNull();
    expect(getMilestone(99)).toBeNull();
  });
});

// ========================================
// formatStreakBadge
// ========================================

describe('formatStreakBadge', () => {
  it('returns badge text for positive counts', () => {
    expect(formatStreakBadge(1)).toBe('Day 1 🔥');
    expect(formatStreakBadge(7)).toBe('Day 7 🔥');
    expect(formatStreakBadge(100)).toBe('Day 100 🔥');
  });

  it('returns null for count 0', () => {
    expect(formatStreakBadge(0)).toBeNull();
  });

  it('returns null for negative counts', () => {
    expect(formatStreakBadge(-1)).toBeNull();
  });
});

// ========================================
// Edge cases: dates
// ========================================

describe('date edge cases', () => {
  const everyday = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

  it('midnight completion (23:59) and next day (00:01) are different days', () => {
    const late = new Date(2026, 1, 17, 23, 59);
    const early = new Date(2026, 1, 18, 0, 1);

    const streak1 = calculateStreakUpdate(undefined, everyday, late);
    expect(streak1.lastCompletedDate).toBe('2026-02-17');

    const streak2 = calculateStreakUpdate(streak1, everyday, early);
    expect(streak2.currentCount).toBe(2);
    expect(streak2.lastCompletedDate).toBe('2026-02-18');
  });

  it('handles leap year (Feb 29)', () => {
    // 2028 is a leap year
    const feb28 = day(2028, 2, 28); // Mon
    const feb29 = day(2028, 2, 29); // Tue
    const mar1 = day(2028, 3, 1);   // Wed

    const leapSchedule = makeSchedule(['mon', 'tue', 'wed']);

    const s1 = calculateStreakUpdate(undefined, leapSchedule, feb28);
    expect(s1.lastCompletedDate).toBe('2028-02-28');

    const s2 = calculateStreakUpdate(s1, leapSchedule, feb29);
    expect(s2.currentCount).toBe(2);
    expect(s2.lastCompletedDate).toBe('2028-02-29');

    const s3 = calculateStreakUpdate(s2, leapSchedule, mar1);
    expect(s3.currentCount).toBe(3);
  });

  it('completion on non-scheduled day still creates streak entry', () => {
    const weekdays = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri']);
    const saturday = day(2026, 2, 21);
    const result = calculateStreakUpdate(undefined, weekdays, saturday);
    // Even though Saturday isn't scheduled, user chose to complete — still count it
    expect(result.currentCount).toBe(1);
  });
});
