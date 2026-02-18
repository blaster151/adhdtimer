# Story 8.2: Schedule Utility Functions & Due Today Logic

## Status: backlog

## Story

As a **developer**,
I want utility functions for schedule awareness (isDueToday, time-of-day matching, sorting),
So that the timer library can surface scheduled routines prominently.

## Background

This story creates the **pure logic layer** for schedule and streak calculations. These utilities will be used by Story 8.3 (Due Today section in library) and Story 8.4 (streak updates on completion).

Two new utility modules:
- `schedule.ts` — day-of-week matching, time-of-day buckets, sorting timers by due status
- `streaks.ts` — streak increment/reset logic, milestone detection, validation

All functions are **pure** with optional date parameters for deterministic testing.

## Acceptance Criteria

### Schedule Utilities (`src/lib/utils/schedule.ts`)

**Given** `src/lib/utils/` directory
**When** `schedule.ts` is created
**Then:**

1. **AC1:** `isDueToday(schedule: Schedule, today?: Date): boolean` returns `true` when today's weekday matches `schedule.days`
2. **AC2:** `isDueToday` returns `false` if `schedule.enabled === false`
3. **AC3:** `isDueToday` correctly maps `Date.getDay()` (0=Sunday) to our `DayOfWeek` type
4. **AC4:** `getTimeOfDayBucket(now?: Date): TimeOfDay` returns:
   - `'morning'` for hours 0–11 (before 12:00)
   - `'afternoon'` for hours 12–16 (12:00–16:59)
   - `'evening'` for hours 17–23 (17:00+)
5. **AC5:** `isTimeOfDayMatch(schedule: Schedule, now?: Date): boolean` returns `true` when:
   - Current bucket matches `schedule.timeOfDay`, OR
   - `schedule.timeOfDay === 'anytime'`
6. **AC6:** `sortTimersForLibrary(timers: TimerTemplate[], completedTodayIds: string[], today?: Date)` returns `{ dueToday: TimerTemplate[], rest: TimerTemplate[] }`
7. **AC7:** `sortTimersForLibrary` places timers in `dueToday` when:
   - `isDueToday()` returns true, AND
   - Timer ID is NOT in `completedTodayIds`
8. **AC8:** Timers with `schedule.enabled === false` or no schedule are always in the `rest` group
9. **AC9:** `dueToday` array is sorted alphabetically by timer name
10. **AC10:** `rest` array maintains existing order (most recent first, per Firestore query)

### Streak Utilities (`src/lib/utils/streaks.ts`)

**Given** `src/lib/utils/` directory
**When** `streaks.ts` is created
**Then:**

11. **AC11:** `isScheduledDay(schedule: Schedule, date: Date): boolean` returns `true` when the date's weekday is in `schedule.days`
12. **AC12:** `getPreviousScheduledDay(schedule: Schedule, fromDate: Date): Date` returns the most recent scheduled day before `fromDate`
13. **AC13:** `getPreviousScheduledDay` correctly skips non-scheduled days (e.g., skip Sat/Sun on Mon–Fri schedule)
14. **AC14:** `calculateStreakUpdate(currentStreak: Streak | undefined, schedule: Schedule, completionDate: Date): Streak` increments `currentCount` by 1 when:
   - Previous scheduled day was completed (based on `currentStreak.lastCompletedDate`), OR
   - This is the first completion (`currentStreak` is undefined or `currentCount === 0`)
15. **AC15:** `calculateStreakUpdate` resets to `{ currentCount: 1, lastCompletedDate: [today], startDate: [today] }` when there's a gap (missed scheduled day)
16. **AC16:** `calculateStreakUpdate` handles weekend gaps correctly: Mon–Fri schedule completed on Friday → Monday completion continues streak (no reset)
17. **AC17:** `validateStreak(currentStreak: Streak | undefined, schedule: Schedule, today: Date): Streak | null` returns `null` if streak is still valid
18. **AC18:** `validateStreak` returns a reset `Streak` (count: 0) if scheduled days were missed since `lastCompletedDate`
19. **AC19:** `getMilestone(count: number): string | null` returns milestone messages:
   - Day 7: "One week ☕"
   - Day 14: "Two weeks 🌟"
   - Day 30: "One month 🔥"
   - Day 100: "100 days 🏆"
   - All others: `null`
20. **AC20:** `formatStreakBadge(count: number): string` returns display text: "Day N ☕" for count > 0, or `null` for count === 0

### Edge Cases

21. **AC21:** Timezone handling: all functions use the local timezone of the provided `Date` object (no UTC conversion)
22. **AC22:** Midnight edge case: completion at 23:59 and 00:01 are treated as different days
23. **AC23:** Leap year handling: February 29 is correctly handled in date calculations
24. **AC24:** Empty schedule: `schedule.days === []` returns `false` for all `isDueToday` checks

### Test Coverage

**Given** `src/lib/utils/__tests__/` directory
**When** test files are created
**Then:**

25. **AC25:** `schedule.test.ts` covers:
   - Each weekday (Monday–Sunday)
   - Each time-of-day bucket (morning, afternoon, evening, anytime)
   - Edge cases: midnight, noon, 16:59, 17:00
   - Empty schedules, disabled schedules
   - `sortTimersForLibrary` with various combinations
26. **AC26:** `streaks.test.ts` covers:
   - First completion (count 0 → 1)
   - Consecutive completions (increment)
   - Gap scenarios (reset to 1)
   - Weekend gaps on Mon–Fri schedule (no reset)
   - Milestone detection (days 7, 14, 30, 100)
   - Validation with stale streaks
   - Edge cases: same-day duplicate completion, completion on non-scheduled day

## Technical Notes

### Type Imports
```typescript
import type { Schedule, Streak, DayOfWeek, TimeOfDay, TimerTemplate } from '@/types/timer';
```

### Day-of-Week Mapping
JavaScript's `Date.getDay()` returns 0=Sunday, 1=Monday, ..., 6=Saturday.

Our `DayOfWeek` type uses short names: `'mon'`, `'tue'`, `'wed'`, `'thu'`, `'fri'`, `'sat'`, `'sun'`.

Mapping:
```typescript
const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};
```

### Time-of-Day Buckets
- Morning: 00:00–11:59 (hours 0–11)
- Afternoon: 12:00–16:59 (hours 12–16)
- Evening: 17:00–23:59 (hours 17–23)

### Streak Gap Analysis Example

**Scenario:** Mon–Fri schedule, streak at Day 5, last completed Thursday.

- **Friday completion:** Increment to Day 6 (consecutive scheduled day)
- **Monday completion after Friday completion:** Increment to Day 7 (Saturday and Sunday are not scheduled, so no gap)
- **Tuesday completion after Thursday (missed Friday):** Reset to Day 1 (gap detected)

**Implementation approach:**
```typescript
const prevScheduledDay = getPreviousScheduledDay(schedule, completionDate);
const wasCompleted = isSameDay(prevScheduledDay, new Date(currentStreak.lastCompletedDate));
if (wasCompleted) {
  // Increment
} else {
  // Reset
}
```

### Testing Strategy
Use explicit `new Date(year, month, day, hour)` constructors for deterministic local-timezone dates:
```typescript
test('isDueToday returns true on Monday for Mon-Fri schedule', () => {
  const monday = new Date(2026, 1, 16, 10, 0); // A Monday
  const schedule = { enabled: true, days: ['mon', 'tue', 'wed', 'thu', 'fri'], timeOfDay: 'anytime' };
  expect(isDueToday(schedule, monday)).toBe(true);
});
```

### Exports
```typescript
// schedule.ts exports
export { isDueToday, getTimeOfDayBucket, isTimeOfDayMatch, sortTimersForLibrary };

// streaks.ts exports
export { isScheduledDay, getPreviousScheduledDay, calculateStreakUpdate, validateStreak, getMilestone, formatStreakBadge };
```

## Prerequisites

Story 6.1 (Schema Evolution) must be complete — requires `Schedule`, `Streak`, `DayOfWeek`, `TimeOfDay` types.

Story 8.1 (Schedule UI) should be complete or in progress — provides context for schedule structure.

## Testing Checklist

- [ ] `isDueToday` correctly identifies each weekday
- [ ] Time-of-day buckets match expected hours
- [ ] `sortTimersForLibrary` separates due-today vs. rest
- [ ] Streak increment logic handles consecutive completions
- [ ] Streak reset logic handles gaps correctly
- [ ] Weekend gaps on Mon–Fri schedule do NOT reset streak
- [ ] Milestone detection returns correct messages
- [ ] All edge cases covered (midnight, empty schedules, disabled schedules)
- [ ] Test coverage ≥ 90% for both modules

## Definition of Done

- [ ] All ACs pass
- [ ] `schedule.ts` and `streaks.ts` created with full implementations
- [ ] `schedule.test.ts` and `streaks.test.ts` with comprehensive coverage
- [ ] All tests passing
- [ ] Code review approved
- [ ] Merged to main branch
