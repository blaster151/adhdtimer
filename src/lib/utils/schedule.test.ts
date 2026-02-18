import { describe, it, expect } from 'vitest';
import {
  isDueToday,
  getTimeOfDayBucket,
  isTimeOfDayMatch,
  sortTimersForLibrary,
} from './schedule';
import type { Schedule, TimerTemplate } from '@/types/timer';
import { Timestamp } from 'firebase/firestore';

// ========================================
// Helpers
// ========================================

/** Create a minimal TimerTemplate for testing */
function makeTimer(
  overrides: Partial<TimerTemplate> & { id: string; name: string },
): TimerTemplate {
  return {
    totalPlannedDuration: 300,
    countdownMode: false,
    steps: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

function makeSchedule(
  days: Schedule['days'],
  timeOfDay: Schedule['timeOfDay'] = 'anytime',
  enabled = true,
): Schedule {
  return { enabled, days, timeOfDay };
}

// ========================================
// isDueToday
// ========================================

describe('isDueToday', () => {
  // 2026-02-16 is a Monday, 17 Tue, 18 Wed, 19 Thu, 20 Fri, 21 Sat, 22 Sun
  const monday    = new Date(2026, 1, 16, 10, 0);
  const tuesday   = new Date(2026, 1, 17, 10, 0);
  const wednesday = new Date(2026, 1, 18, 10, 0);
  const thursday  = new Date(2026, 1, 19, 10, 0);
  const friday    = new Date(2026, 1, 20, 10, 0);
  const saturday  = new Date(2026, 1, 21, 10, 0);
  const sunday    = new Date(2026, 1, 22, 10, 0);

  it('returns true for each weekday when scheduled', () => {
    expect(isDueToday(makeSchedule(['mon']), monday)).toBe(true);
    expect(isDueToday(makeSchedule(['tue']), tuesday)).toBe(true);
    expect(isDueToday(makeSchedule(['wed']), wednesday)).toBe(true);
    expect(isDueToday(makeSchedule(['thu']), thursday)).toBe(true);
    expect(isDueToday(makeSchedule(['fri']), friday)).toBe(true);
    expect(isDueToday(makeSchedule(['sat']), saturday)).toBe(true);
    expect(isDueToday(makeSchedule(['sun']), sunday)).toBe(true);
  });

  it('returns false when weekday is not in schedule', () => {
    expect(isDueToday(makeSchedule(['tue', 'thu']), monday)).toBe(false);
    expect(isDueToday(makeSchedule(['mon', 'wed', 'fri']), tuesday)).toBe(false);
  });

  it('returns false when schedule is disabled', () => {
    expect(isDueToday(makeSchedule(['mon'], 'anytime', false), monday)).toBe(false);
  });

  it('returns false when days array is empty', () => {
    expect(isDueToday(makeSchedule([]), monday)).toBe(false);
  });

  it('handles weekday schedules (Mon–Fri)', () => {
    const weekdays = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri']);
    expect(isDueToday(weekdays, monday)).toBe(true);
    expect(isDueToday(weekdays, friday)).toBe(true);
    expect(isDueToday(weekdays, saturday)).toBe(false);
    expect(isDueToday(weekdays, sunday)).toBe(false);
  });

  it('handles every-day schedule', () => {
    const everyday = makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
    expect(isDueToday(everyday, monday)).toBe(true);
    expect(isDueToday(everyday, sunday)).toBe(true);
  });
});

// ========================================
// getTimeOfDayBucket
// ========================================

describe('getTimeOfDayBucket', () => {
  it('returns morning for 00:00', () => {
    expect(getTimeOfDayBucket(new Date(2026, 1, 17, 0, 0))).toBe('morning');
  });

  it('returns morning for 11:59', () => {
    expect(getTimeOfDayBucket(new Date(2026, 1, 17, 11, 59))).toBe('morning');
  });

  it('returns afternoon for 12:00 (noon)', () => {
    expect(getTimeOfDayBucket(new Date(2026, 1, 17, 12, 0))).toBe('afternoon');
  });

  it('returns afternoon for 16:59', () => {
    expect(getTimeOfDayBucket(new Date(2026, 1, 17, 16, 59))).toBe('afternoon');
  });

  it('returns evening for 17:00', () => {
    expect(getTimeOfDayBucket(new Date(2026, 1, 17, 17, 0))).toBe('evening');
  });

  it('returns evening for 23:59', () => {
    expect(getTimeOfDayBucket(new Date(2026, 1, 17, 23, 59))).toBe('evening');
  });
});

// ========================================
// isTimeOfDayMatch
// ========================================

describe('isTimeOfDayMatch', () => {
  it('always matches when timeOfDay is anytime', () => {
    const schedule = makeSchedule(['mon'], 'anytime');
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 8, 0))).toBe(true);
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 14, 0))).toBe(true);
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 20, 0))).toBe(true);
  });

  it('matches morning schedule in morning hours', () => {
    const schedule = makeSchedule(['mon'], 'morning');
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 9, 0))).toBe(true);
  });

  it('does not match morning schedule in afternoon', () => {
    const schedule = makeSchedule(['mon'], 'morning');
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 14, 0))).toBe(false);
  });

  it('matches afternoon schedule in afternoon hours', () => {
    const schedule = makeSchedule(['mon'], 'afternoon');
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 13, 0))).toBe(true);
  });

  it('matches evening schedule in evening hours', () => {
    const schedule = makeSchedule(['mon'], 'evening');
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 20, 0))).toBe(true);
  });

  it('does not match evening schedule in morning', () => {
    const schedule = makeSchedule(['mon'], 'evening');
    expect(isTimeOfDayMatch(schedule, new Date(2026, 1, 17, 8, 0))).toBe(false);
  });
});

// ========================================
// sortTimersForLibrary
// ========================================

describe('sortTimersForLibrary', () => {
  const tuesday = new Date(2026, 1, 17, 10, 0); // A Tuesday

  const morningRoutine = makeTimer({
    id: 't1',
    name: 'Morning Routine',
    schedule: makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri'], 'morning'),
  });

  const workout = makeTimer({
    id: 't2',
    name: 'Workout',
    schedule: makeSchedule(['mon', 'wed', 'fri'], 'afternoon'),
  });

  const groceries = makeTimer({
    id: 't3',
    name: 'Grocery Shopping',
    // no schedule
  });

  const meditation = makeTimer({
    id: 't4',
    name: 'Evening Meditation',
    schedule: makeSchedule(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], 'evening'),
  });

  const disabledSchedule = makeTimer({
    id: 't5',
    name: 'Disabled Timer',
    schedule: makeSchedule(['tue'], 'anytime', false),
  });

  const allTimers = [morningRoutine, workout, groceries, meditation, disabledSchedule];

  it('separates due-today from rest', () => {
    const { dueToday, rest } = sortTimersForLibrary(allTimers, [], tuesday);

    // Tuesday: morningRoutine (Mon–Fri) and meditation (every day) are due
    expect(dueToday.map((t) => t.id)).toEqual(['t4', 't1']); // alphabetical: Evening Meditation, Morning Routine
    // Workout (Mon/Wed/Fri), Groceries (no schedule), Disabled (disabled) → rest
    expect(rest.map((t) => t.id)).toEqual(['t2', 't3', 't5']);
  });

  it('moves completed timers to rest', () => {
    const { dueToday, rest } = sortTimersForLibrary(allTimers, ['t1'], tuesday);

    expect(dueToday.map((t) => t.id)).toEqual(['t4']); // Only meditation
    expect(rest.map((t) => t.id)).toEqual(['t1', 't2', 't3', 't5']); // morningRoutine moved to rest
  });

  it('puts all timers in rest when none are due', () => {
    // Saturday: workout is not scheduled
    const saturday = new Date(2026, 1, 21, 10, 0);
    const { dueToday, rest } = sortTimersForLibrary([workout, groceries], [], saturday);

    expect(dueToday).toEqual([]);
    expect(rest.map((t) => t.id)).toEqual(['t2', 't3']);
  });

  it('puts timers with disabled schedule in rest', () => {
    const { dueToday, rest } = sortTimersForLibrary([disabledSchedule], [], tuesday);

    expect(dueToday).toEqual([]);
    expect(rest.map((t) => t.id)).toEqual(['t5']);
  });

  it('sorts dueToday alphabetically by name', () => {
    const a = makeTimer({ id: 'a', name: 'Zebra', schedule: makeSchedule(['tue']) });
    const b = makeTimer({ id: 'b', name: 'Alpha', schedule: makeSchedule(['tue']) });
    const c = makeTimer({ id: 'c', name: 'Mango', schedule: makeSchedule(['tue']) });

    const { dueToday } = sortTimersForLibrary([a, b, c], [], tuesday);
    expect(dueToday.map((t) => t.name)).toEqual(['Alpha', 'Mango', 'Zebra']);
  });

  it('preserves rest order (incoming order)', () => {
    const a = makeTimer({ id: 'a', name: 'Z-Timer' });
    const b = makeTimer({ id: 'b', name: 'A-Timer' });
    const c = makeTimer({ id: 'c', name: 'M-Timer' });

    const { rest } = sortTimersForLibrary([a, b, c], [], tuesday);
    // Should preserve original order, not sort alphabetically
    expect(rest.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('handles empty timer list', () => {
    const { dueToday, rest } = sortTimersForLibrary([], [], tuesday);
    expect(dueToday).toEqual([]);
    expect(rest).toEqual([]);
  });

  it('handles all timers completed', () => {
    const { dueToday } = sortTimersForLibrary(
      allTimers,
      ['t1', 't2', 't3', 't4', 't5'],
      tuesday,
    );
    expect(dueToday).toEqual([]);
  });
});
