# Story 8.4: Streak Settings & Streak Update on Completion

## Status: backlog

## Story

As a **user**,
I want streaks to be opt-in and to update automatically when I complete scheduled routines,
So that I get quiet encouragement without pressure.

## Background

This story completes the **streak tracking system** by:
1. Adding a user-level "Show streaks" toggle in settings (localStorage)
2. Implementing automatic streak updates when a scheduled routine completes
3. Ensuring streak logic is robust, atomic, and non-intrusive

Streaks are **opt-in** at two levels:
- User-level: "Show streaks" toggle (default ON) hides all streak badges when OFF
- Timer-level: "Track streak" toggle in schedule config (from Story 8.1) enables tracking per-timer

This story focuses on the completion flow and settings integration.

## Acceptance Criteria

### Settings Sheet — Streak Toggle

**Given** the settings sheet
**When** I view settings
**Then:**

1. **AC1:** "Show streaks" toggle exists in the "Library" section
2. **AC2:** Toggle is ON by default for new users
3. **AC3:** Help text below toggle: "Display streak badges for scheduled routines"
4. **AC4:** Setting persists in localStorage: `adhd-timer-show-streaks` (boolean)
5. **AC5:** Setting loads correctly on app restart
6. **AC6:** Toggle state is accessible via `useSettings()` hook or similar

**Given** I disable "Show streaks"
**When** I return to the library
**Then:**

7. **AC7:** No streak badges appear anywhere in the library (DUE TODAY or ALL TIMERS)
8. **AC8:** Streak tracking STILL OCCURS in the background (streaks continue to increment on completion)
9. **AC9:** Re-enabling the toggle immediately shows current streak values

### Automatic Streak Update on Completion

**Given** I complete a scheduled routine with streak tracking enabled (`timer.schedule.enabled === true` and `timer.streak` exists)
**When** the session completes
**Then:**

10. **AC10:** Streak update logic runs immediately after session is marked `completed`
11. **AC11:** `calculateStreakUpdate()` is called with current streak, schedule, and completion date
12. **AC12:** Returned `Streak` object is written to the `TimerTemplate` document atomically
13. **AC13:** `streak.currentCount` increments correctly:
   - First completion: 0 → 1
   - Consecutive scheduled day: N → N+1
   - Gap (missed scheduled day): N → 1 (reset)
14. **AC14:** `streak.lastCompletedDate` updates to today's ISO date string
15. **AC15:** `streak.startDate` is set to today's date on first completion (count: 0 → 1) or reset
16. **AC16:** `streak.startDate` remains unchanged on increments (preserves original streak start)

### Weekend Gap Handling (No Reset)

**Given** a Mon–Fri scheduled routine with an active streak
**When** I complete it on Friday, skip Saturday and Sunday, and complete it again on Monday
**Then:**

17. **AC17:** Streak increments normally on Monday (Saturday and Sunday are not scheduled, so no gap detected)
18. **AC18:** `calculateStreakUpdate()` correctly identifies Monday as the next scheduled day after Friday

### Missed Day Handling (Reset)

**Given** a Mon–Fri scheduled routine with an active streak
**When** I complete it on Monday, miss Tuesday, and complete it on Wednesday
**Then:**

19. **AC19:** Streak resets to 1 on Wednesday completion
20. **AC20:** `streak.startDate` updates to Wednesday's date
21. **AC21:** No negative messaging shown to user (silent reset)

### Non-Scheduled Completion (No Update)

**Given** I complete a timer with NO schedule configured (`timer.schedule === undefined` or `timer.schedule.enabled === false`)
**When** the session completes
**Then:**

22. **AC22:** No streak update occurs
23. **AC23:** `streak` field is not written to Firestore
24. **AC24:** No errors or warnings logged

**Given** I complete a scheduled timer with streak tracking disabled (`timer.streak === undefined`)
**When** the session completes
**Then:**

25. **AC25:** No streak update occurs
26. **AC26:** `streak` field remains undefined

### Milestone Detection

**Given** I complete a scheduled routine and hit a milestone (Day 7, 14, 30, or 100)
**When** the streak update completes
**Then:**

27. **AC27:** Milestone is detected via `getMilestone(count)` from `streaks.ts`
28. **AC28:** Milestone data is stored in session state for toast display on library load
29. **AC29:** Toast appears when user returns to library (implemented in Story 8.3, but triggered here)
30. **AC30:** Multiple completions in quick succession only show the highest milestone toast

### Atomic Firestore Updates

**Given** streak update is triggered
**When** writing to Firestore
**Then:**

31. **AC31:** Streak update uses Firestore transaction or atomic `updateDoc()` to prevent race conditions
32. **AC32:** If write fails (offline, network error), update is retried or queued
33. **AC33:** No partial streak writes (all fields update together or none)

### Edge Cases

34. **AC34:** Completing the same routine twice in one day only counts as one streak increment
35. **AC35:** Completing a routine on a non-scheduled day (e.g., Saturday on Mon–Fri schedule) does NOT increment streak
36. **AC36:** Completing a routine at 23:59 and again at 00:01 the next day counts as two separate days
37. **AC37:** If user changes schedule days after starting a streak, existing streak continues with new schedule rules

## Technical Notes

### New Hook
- `src/hooks/use-streak.ts` (may already exist from Story 8.3 — extend if needed)
  - `updateStreakOnCompletion(timer: TimerTemplate, completionDate: Date): Promise<void>`
  - Calls `calculateStreakUpdate()` from `streaks.ts`
  - Writes result to Firestore
  - Detects milestone and stores in session/local state for toast

### Modifications
- `src/components/settings/settings-sheet.tsx` — Add "Show streaks" toggle in "Library" section
- Session completion flow (likely `use-timer-engine.ts` or completion handler):
  - After marking session `completed`, check if `timer.schedule?.enabled && timer.streak`
  - If true, call `updateStreakOnCompletion(timer, new Date())`

### Firestore Write
```typescript
import { doc, updateDoc } from 'firebase/firestore';

async function updateStreakOnCompletion(timer: TimerTemplate, completionDate: Date) {
  if (!timer.schedule?.enabled || !timer.streak) return;

  const updatedStreak = calculateStreakUpdate(timer.streak, timer.schedule, completionDate);
  
  const timerRef = doc(db, 'timers', timer.id);
  await updateDoc(timerRef, { streak: updatedStreak });

  // Check for milestone
  const milestone = getMilestone(updatedStreak.currentCount);
  if (milestone) {
    // Store milestone for toast display (e.g., localStorage or session state)
    sessionStorage.setItem('streak-milestone', JSON.stringify({ message: milestone, count: updatedStreak.currentCount }));
  }
}
```

### localStorage Keys
- `adhd-timer-show-streaks` (boolean, default: `true`)

### Settings Hook Example
```typescript
// src/hooks/use-settings.ts or similar
export function useSettings() {
  const [showStreaks, setShowStreaks] = useState(() => {
    const saved = localStorage.getItem('adhd-timer-show-streaks');
    return saved === null ? true : saved === 'true';
  });

  const toggleShowStreaks = (value: boolean) => {
    setShowStreaks(value);
    localStorage.setItem('adhd-timer-show-streaks', String(value));
  };

  return { showStreaks, toggleShowStreaks };
}
```

### Completion Flow Integration
Modify the completion handler (likely in `use-timer-engine.ts` or a dedicated completion service):

```typescript
async function handleSessionComplete(session: RunSession, timer: TimerTemplate) {
  // Mark session as completed (existing logic)
  await updateDoc(sessionRef, { status: 'completed', completedAt: Timestamp.now() });

  // Update streak if applicable
  await updateStreakOnCompletion(timer, new Date());

  // Show completion view, etc.
}
```

### Accessibility
- Settings toggle has descriptive label and help text
- Streak badge visibility change is transparent (no announcement needed — visual change only)

## Prerequisites

Story 8.3 (Due Today Section & Streak Badges) must be complete — streak badges are displayed by that story.

Story 8.2 (Schedule Utility Functions) must be complete — provides `calculateStreakUpdate()`, `getMilestone()`, etc.

Story 8.1 (Schedule Configuration UI) must be complete — users configure streak tracking per-timer there.

## Testing Checklist

- [ ] "Show streaks" toggle saves and loads correctly
- [ ] Disabling toggle hides badges but tracking continues
- [ ] Streak increments on consecutive scheduled days
- [ ] Streak resets on missed scheduled days
- [ ] Weekend gaps on Mon–Fri schedule do NOT reset streak
- [ ] Completing twice in one day only increments once
- [ ] Non-scheduled timers do not update streaks
- [ ] Milestone detection triggers toast (integration with 8.3)
- [ ] Firestore writes are atomic (no race conditions)
- [ ] Edge cases: midnight boundary, non-scheduled day completion

## Definition of Done

- [ ] All ACs pass
- [ ] "Show streaks" toggle added to settings sheet
- [ ] `updateStreakOnCompletion()` implemented in `use-streak.ts`
- [ ] Completion flow integrated with streak update logic
- [ ] Unit tests for streak update logic
- [ ] Integration test: complete routine → verify streak increment → verify Firestore write
- [ ] Integration test: missed day → verify reset
- [ ] Code review approved
- [ ] Merged to main branch
