# Story 8.1: Schedule Configuration UI

## Status: backlog

## Story

As a **user**,
I want to optionally schedule a timer for specific days and times of day,
So that the app knows when my routines are supposed to happen.

## Background

This story introduces the **schedule configuration UI** for timers, enabling them to become repeatable routines. The schedule includes:
- Day-of-week selection (M T W T F S S)
- Time-of-day segmented control (Morning, Afternoon, Evening, Any)
- Streak tracking toggle (nested under schedule)

Schedule data is saved as part of the `TimerTemplate` document in Firestore. This UI is the foundation for Epic 8 (Routines & Habits) — once schedules are configured, subsequent stories will surface "due today" routines and track streaks.

## Acceptance Criteria

### Schedule Section in Timer Form

**Given** I am creating or editing a timer
**When** I view the settings area below the step list
**Then:**

1. **AC1:** A collapsible "Schedule (optional)" section appears below the toggles
2. **AC2:** Section is collapsed by default with ▸ indicator
3. **AC3:** Expanding reveals: day picker (M T W T F S S), time-of-day segmented control, streaks toggle
4. **AC4:** Day picker: 7 circular buttons, filled (`--primary`) when selected
5. **AC5:** Time-of-day: segmented control with "Morning", "Afternoon", "Evening", "Any" — single selection
6. **AC6:** Streaks toggle: "Track streak" with switch — nested under schedule
7. **AC7:** When collapsed with a schedule configured, summary shows: "Mon–Fri, Morning" (or similar)
8. **AC8:** Schedule saves as `schedule` object on TimerTemplate; streaks toggle enables streak tracking
9. **AC9:** All schedule fields are optional — a timer can exist without a schedule
10. **AC10:** Day picker fits in a single row at 320px screen width (48px min touch targets)
11. **AC11:** Loading an existing scheduled timer populates all fields correctly

### Day Picker Interaction

**Given** the schedule section is expanded
**When** I interact with the day picker
**Then:**

12. **AC12:** Days can be toggled individually (multi-select)
13. **AC13:** Visual feedback on tap: active state shows immediately
14. **AC14:** Selected days show filled background with `--primary` color
15. **AC15:** Unselected days show outlined border with `--border` color
16. **AC16:** Days are labeled with single letters: M T W T F S S
17. **AC17:** Accessible label: "Select days of the week for this routine"

### Time-of-Day Segmented Control

**Given** the schedule section is expanded
**When** I interact with the time-of-day control
**Then:**

18. **AC18:** Control displays 4 options: Morning, Afternoon, Evening, Any
19. **AC19:** Only one option can be selected at a time (single-select)
20. **AC20:** Selected option shows `--primary` background with contrasting text
21. **AC21:** Unselected options show `--muted` text
22. **AC22:** Default selection: "Any" (no specific time constraint)
23. **AC23:** Accessible label: "Select time of day for this routine"

### Streak Toggle

**Given** the schedule section is expanded
**When** I view the streak toggle
**Then:**

24. **AC24:** "Track streak" toggle appears below time-of-day control
25. **AC25:** Toggle is OFF by default
26. **AC26:** Help text below toggle: "Count consecutive completions on scheduled days"
27. **AC27:** Toggle state saves to `schedule.enabled` field for streaks (separate from schedule.enabled)

### Collapsed Summary

**Given** the schedule section is collapsed and I have configured a schedule
**When** I view the section header
**Then:**

28. **AC28:** Summary text appears: "[Days], [Time]" — e.g., "Mon–Fri, Morning"
29. **AC29:** Consecutive days are abbreviated: "Mon–Fri" instead of "Mon, Tue, Wed, Thu, Fri"
30. **AC30:** If "Any" time is selected, only days show: "Mon–Fri"
31. **AC31:** If no days selected, summary shows: "No schedule"
32. **AC32:** Summary uses `--muted` text color

### Data Persistence

**Given** I configure a schedule
**When** I save the timer
**Then:**

33. **AC33:** Schedule saves as: `{ enabled: true, days: DayOfWeek[], timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime' }`
34. **AC34:** If streak toggle is ON, `streak` field initializes as: `{ currentCount: 0, lastCompletedDate: '', startDate: '' }`
35. **AC35:** If no days are selected but section was expanded, schedule does NOT save (no partial schedules)
36. **AC36:** Editing an existing timer loads schedule state correctly into all controls

### Accessibility

**Given** the schedule section
**When** I navigate with keyboard or screen reader
**Then:**

37. **AC37:** Section header is focusable and activatable with Enter/Space
38. **AC38:** Day picker buttons are keyboard navigable with Tab
39. **AC39:** Segmented control is keyboard navigable with arrow keys
40. **AC40:** ARIA labels for all interactive elements
41. **AC41:** ARIA announcement when schedule is enabled: "Schedule configured: [summary]"

## Technical Notes

### New Components
- `src/components/timer-form/schedule-section.tsx` — Collapsible section wrapper
- `src/components/timer-form/day-picker.tsx` — 7-day multi-select button group
- `src/components/timer-form/time-of-day-control.tsx` — Segmented control for time selection

### Modifications
- `src/components/timer-form/timer-form.tsx` — Integrate ScheduleSection below existing toggles

### Types (from Story 6.1)
```typescript
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

interface Schedule {
  enabled: boolean;
  days: DayOfWeek[];
  timeOfDay: TimeOfDay;
}

interface Streak {
  currentCount: number;
  lastCompletedDate: string; // ISO date string
  startDate: string; // ISO date string
}

interface TimerTemplate {
  // ...existing fields
  schedule?: Schedule;
  streak?: Streak;
}
```

### CSS Custom Properties
- Use existing `--primary`, `--border`, `--muted`, `--surface` from theme system
- Day picker button size: 48px × 48px for touch targets
- Segmented control: shadcn Button group with toggle state

### Edge Cases
- If user toggles streak ON but doesn't select any days, show inline error: "Select days to track streak"
- If user collapses section without selecting days, schedule is not saved (treated as disabled)
- Schedule with `enabled: false` is treated as "no schedule" throughout the app

## Prerequisites

Story 6.1 (Schema Evolution) must be complete — requires `Schedule`, `Streak`, `DayOfWeek`, `TimeOfDay` types.

Story 7.4 (Epic 7 complete) is recommended but not strictly required — schedule can be built in parallel with playback evolution.

## Testing Checklist

- [ ] Day picker allows multi-select and deselect
- [ ] Time-of-day control shows correct selection
- [ ] Streak toggle saves correctly
- [ ] Collapsed summary displays correctly for all combinations
- [ ] Schedule persists to Firestore on save
- [ ] Editing existing scheduled timer loads all fields
- [ ] Schedule works at 320px screen width
- [ ] Keyboard navigation works for all controls
- [ ] Screen reader announces schedule state changes

## Definition of Done

- [ ] All ACs pass
- [ ] Component tests written for ScheduleSection, DayPicker, TimeOfDayControl
- [ ] Integration test: create timer with schedule, save, reload, verify
- [ ] Accessibility audit passed (keyboard + screen reader)
- [ ] Code review approved
- [ ] Merged to main branch
