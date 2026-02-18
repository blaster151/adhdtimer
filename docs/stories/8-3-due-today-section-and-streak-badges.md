# Story 8.3: Due Today Section & Streak Badges in Timer Library

## Status: backlog

## Story

As a **user**,
I want to see my scheduled routines prominently when I open the app, with streak badges showing my consistency,
So that I know what's due and feel quietly motivated.

## Background

This story transforms the timer library into a **routine-aware dashboard**. Scheduled timers that are due today appear in a dedicated "DUE TODAY" section at the top, with:
- Time-of-day icons (☀ Morning, 🌤 Afternoon, 🌙 Evening)
- Streak badges ("Day 7 — one week ☕") for timers with active streaks
- Completion badges ("✓ Done") for routines already completed today

This surfaces what needs attention without requiring the user to hunt through a list. The "DUE TODAY" section only appears when there's something due — no empty state noise.

## Acceptance Criteria

### Due Today Section Display

**Given** I open the timer library and have scheduled routines
**When** the library loads
**Then:**

1. **AC1:** "DUE TODAY" section appears at the top of the library (above "ALL TIMERS")
2. **AC2:** Only routines scheduled for today (matching day-of-week) appear in DUE TODAY
3. **AC3:** Section header: "DUE TODAY" in uppercase, `--muted` color, 12px letter-spacing
4. **AC4:** Each due-today card shows time-of-day icon in top-right corner:
   - ☀ for Morning
   - 🌤 for Afternoon
   - 🌙 for Evening
   - No icon for "Any"
5. **AC5:** Cards use the standard `timer-card.tsx` component with additional badges
6. **AC6:** Non-scheduled timers appear under "ALL TIMERS" section below
7. **AC7:** If no routines are due today, the "DUE TODAY" section does not appear at all
8. **AC8:** Section spacing: 24px gap between DUE TODAY and ALL TIMERS sections

### Streak Badges

**Given** a routine in DUE TODAY has an active streak (`streak.currentCount > 0`)
**When** the card renders
**Then:**

9. **AC9:** Streak badge appears in bottom-right corner: "Day N ☕"
10. **AC10:** Badge uses `--streak` color (`#D4A96A`)
11. **AC11:** Badge text: "Day [count] ☕" (e.g., "Day 3 ☕")
12. **AC12:** Milestone badges show enhanced text:
   - Day 7: "Day 7 — one week ☕"
   - Day 14: "Day 14 — two weeks 🌟"
   - Day 30: "Day 30 — one month 🔥"
   - Day 100: "Day 100 🏆"
13. **AC13:** Badge has subtle rounded background with semi-transparent `--streak` fill
14. **AC14:** Badge font size: 12px, weight: 500

### Completion Badges

**Given** I have completed a scheduled routine today
**When** I return to the library
**Then:**

15. **AC15:** The routine card shows "✓ Done" badge in top-left corner
16. **AC16:** Badge uses `--on-track` color (green)
17. **AC17:** Play button is hidden (replaced with checkmark or disabled state)
18. **AC18:** Card has slightly reduced opacity (0.8) to indicate completion
19. **AC19:** Tapping a completed routine card still opens the timer details (for review)
20. **AC20:** Completion state is determined by checking recent sessions: `sessions` where `timerId === timer.id` and `completedAt` is today

### Streak Validation on Load

**Given** the library is loading
**When** timers with streaks are fetched
**Then:**

21. **AC21:** `validateStreak()` runs for each timer with a streak
22. **AC22:** Stale streaks (missed scheduled days) are silently reset to `{ currentCount: 0, lastCompletedDate: '', startDate: '' }`
23. **AC23:** Firestore documents are updated atomically if reset occurs
24. **AC24:** No user-facing notification for resets (quiet reset)
25. **AC25:** Validation completes before rendering the library (no flash of incorrect badge)

### Milestone Toasts

**Given** I complete a scheduled routine and hit a milestone
**When** the completion view closes and I return to the library
**Then:**

26. **AC26:** A toast notification appears briefly (3 seconds):
   - Day 7: "One week ☕ — keep it going!"
   - Day 14: "Two weeks 🌟 — great momentum!"
   - Day 30: "One month 🔥 — you're crushing it!"
   - Day 100: "100 days 🏆 — legendary!"
27. **AC27:** Toast uses `--info` color with subtle animation (fade in, hold, fade out)
28. **AC28:** Toast is non-blocking (dismissible or auto-dismisses after 3 seconds)
29. **AC29:** Only one milestone toast shows at a time (if multiple routines hit milestones, show the highest)

### Settings Integration

**Given** the settings sheet has "Show streaks" toggle
**When** I disable streaks
**Then:**

30. **AC30:** No streak badges appear anywhere in the library
31. **AC31:** Due today section still functions normally (just no streak badges)
32. **AC32:** Setting persists in localStorage: `adhd-timer-show-streaks` (boolean)

### Edge Cases

33. **AC33:** If a timer has `schedule.enabled === true` but no days selected, it does NOT appear in DUE TODAY
34. **AC34:** If a timer is scheduled for today but already completed, it still appears in DUE TODAY (with "✓ Done" badge)
35. **AC35:** If all due-today timers are completed, section still shows with all cards marked done (doesn't disappear)
36. **AC36:** Streak badges do NOT appear on non-scheduled timers in ALL TIMERS section

## Technical Notes

### New Components
- `src/components/library/due-today-section.tsx` — Section wrapper with header + filtered timer cards
- `src/components/library/streak-badge.tsx` — Streak badge overlay for timer cards
- `src/components/library/completion-badge.tsx` — "✓ Done" badge overlay
- `src/components/library/time-of-day-icon.tsx` — Icon component for Morning/Afternoon/Evening

### New Hooks
- `src/hooks/use-schedule.ts` — Computes `dueToday` and `completedToday` from timers + recent sessions
  - Calls `sortTimersForLibrary()` from `schedule.ts`
  - Queries recent sessions to determine completion status
- `src/hooks/use-streak.ts` — Validates streak on mount, provides `updateStreakOnCompletion()` function
  - Calls `validateStreak()` from `streaks.ts`
  - Writes reset streaks to Firestore atomically

### Modifications
- `src/components/library/timer-library.tsx` — Integrate DueTodaySection at top, separate "ALL TIMERS" below
- `src/components/library/timer-card.tsx` — Add streak badge, completion badge, time-of-day icon slots

### Firestore Queries
**Completed Today Query:**
```typescript
const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);

const q = query(
  collection(db, 'sessions'),
  where('userId', '==', userId),
  where('status', '==', 'completed'),
  where('completedAt', '>=', Timestamp.fromDate(today)),
  where('completedAt', '<', Timestamp.fromDate(tomorrow))
);
```

Returns all sessions completed today. Map to `timerIds` to determine which routines are done.

**Streak Validation:**
- Read timers with `streak.currentCount > 0`
- For each, call `validateStreak(timer.streak, timer.schedule, new Date())`
- If result is a reset Streak, update Firestore doc

### CSS Custom Properties
- `--streak`: `#D4A96A` (from Story 8.3 epic)
- `--on-track`: existing green from semantic colors

### Badge Styling
Streak badge:
```css
.streak-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: hsl(var(--streak) / 0.2);
  color: hsl(var(--streak));
  font-size: 12px;
  font-weight: 500;
}
```

Completion badge:
```css
.completion-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: hsl(var(--on-track) / 0.2);
  color: hsl(var(--on-track));
  font-size: 12px;
  font-weight: 600;
}
```

### Accessibility
- Section headers use `<h2>` tags
- Streak badges have `aria-label`: "Current streak: N days"
- Completion badges have `aria-label`: "Completed today"
- Time-of-day icons have `aria-label`: "Morning routine" / "Afternoon routine" / "Evening routine"

## Prerequisites

Story 8.2 (Schedule Utility Functions) must be complete — provides `sortTimersForLibrary()`, `validateStreak()`, etc.

Story 8.1 (Schedule UI) must be complete — users need to configure schedules first.

## Testing Checklist

- [ ] DUE TODAY section appears only when routines are due
- [ ] Time-of-day icons display correctly for each bucket
- [ ] Streak badges show correct count and milestone text
- [ ] Completion badges appear for completed routines
- [ ] Completed routines remain in DUE TODAY section
- [ ] Stale streaks are validated and reset on library load
- [ ] Milestone toasts appear on completion
- [ ] "Show streaks" toggle hides/shows badges correctly
- [ ] Edge cases: no days selected, all completed, empty library
- [ ] Accessibility: ARIA labels, screen reader announcements

## Definition of Done

- [ ] All ACs pass
- [ ] All new components created with tests
- [ ] `use-schedule.ts` and `use-streak.ts` hooks implemented
- [ ] Integration test: schedule timer, complete it, verify streak badge
- [ ] Integration test: complete routine, verify milestone toast
- [ ] Accessibility audit passed
- [ ] Code review approved
- [ ] Merged to main branch
