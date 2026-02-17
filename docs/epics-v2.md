# ADHD Timer v2 — Epic Breakdown

**Author:** BMad
**Date:** 2026-02-16
**Track:** BMad Method (Brownfield — extends v1 MVP)

---

## Overview

This document decomposes the [v2 PRD](./PRD-v2.md) into 5 epics and bite-sized stories for implementation. Each story is vertically sliced, sequentially ordered, and sized for a single dev agent session. Numbering continues from v1 (which ended at Epic 5, Story 5.3).

**Epic Summary:**

| Epic | Name | Stories | Theme | Value |
|------|------|---------|-------|-------|
| 6 | Step Types & Schema Evolution | 5 | 🧠 Smarter Steps | Steps gain personality — Active, Wait, Checkpoint |
| 7 | Playback Evolution | 4 | 🧠 Smarter Steps | Defer, manual advance — flexible execution |
| 8 | Routines & Habits | 4 | 🔁 Routines & Habits | Scheduling, streaks, daily companion |
| 9 | Learning Companion | 4 | 💬 Learning Companion | Suggestions, reminders — the app learns |
| 10 | Smarter AI | 2 | 🤖 Smarter AI | Vague-task detection — proactive help |
| | **Total** | **19** | | |

**Sequencing:** Epic 6 must come first (schema evolution is the foundation). Epic 7 depends on Epic 6 (playback builds on step types). Epics 8 and 9 can be worked in parallel after Epic 7. Epic 10 is independent — can be done anytime after Epic 6.

**Dependency Graph:**

```
Epic 6 (Step Types) ─→ Epic 7 (Playback Evolution) ─→ Epic 9 (Learning Companion)
                                                    ↗
                       Epic 8 (Routines & Habits) ──
                       
Epic 10 (Smarter AI) — independent after Epic 6
```

---

## Epic 6: Step Types & Schema Evolution

**Goal:** Extend the data model with step types (Active/Wait/Checkpoint), update the timer editor to support type selection, and update playback to handle each type distinctly.

**Business Value:** Steps gain personality — "Shower" feels different from "Wait for coffee to brew" and "Dressed by 7:30." This is the foundational schema change everything else builds on.

**FR Coverage:** FR14 (FR14.1–FR14.5)

---

### Story 6.1: Schema Evolution — Step Types & Timer Settings

As a **developer**,
I want to extend the TypeScript types and Firestore schema with step types and new timer settings,
So that all subsequent v2 features have a typed foundation.

**Acceptance Criteria:**

**Given** the existing `src/types/timer.ts` and `src/types/session.ts`
**When** the schema evolution is applied
**Then** the following types are updated/added:

1. **AC1:** `StepType` union type exists: `'active' | 'wait' | 'checkpoint'`
2. **AC2:** `Step` interface gains optional `type?: StepType` (default treated as `'active'`) and optional `targetTime?: string` (HH:MM, for checkpoints only)
3. **AC3:** `TimerTemplate` gains optional `pauseBetweenSteps?: boolean`
4. **AC4:** `TimerTemplate` gains optional `schedule?: Schedule` with `Schedule` interface: `{ enabled: boolean; days: DayOfWeek[]; timeOfDay: TimeOfDay }`
5. **AC5:** `TimerTemplate` gains optional `streak?: Streak` with `Streak` interface: `{ currentCount: number; lastCompletedDate: string; startDate: string }`
6. **AC6:** `SessionStatus` union type gains `'waiting-for-advance'`
7. **AC7:** `StepStatus` union type gains `'deferred'`
8. **AC8:** `SessionStep` gains optional `type?: StepType`
9. **AC9:** `RunSession` gains optional `deferredSteps?: string[]` and `pauseBetweenSteps?: boolean`
10. **AC10:** New utility types exported: `DayOfWeek`, `TimeOfDay`, `Schedule`, `Streak`, `StepType`
11. **AC11:** All existing v1 tests continue to pass with no changes (backward compatible)
12. **AC12:** New Firestore composite index added to `firestore.indexes.json`: `sessions` collection on `timerId` ASC + `status` ASC + `completedAt` DESC

**Prerequisites:** None (v1 complete)

**Technical Notes:**
- All new fields are optional — zero migration, zero breaking changes
- `totalPlannedDuration` calculation must treat Checkpoint steps as 0 duration
- Update `CreateTimerInput` and `UpdateTimerInput` utility types to include new fields
- Existing timer tests should continue to pass unchanged — add new tests for type narrowing and defaults
- Deploy the Firestore index early — it takes time to build: `firebase deploy --only firestore:indexes`

---

### Story 6.2: Checkpoint Utility Functions

As a **developer**,
I want utility functions for parsing checkpoint target times and comparing them to the current clock,
So that checkpoint playback logic has a well-tested foundation.

**Acceptance Criteria:**

**Given** the `src/lib/utils/` directory
**When** `checkpoint.ts` is created
**Then:**

1. **AC1:** `parseTargetTime("07:30")` returns `{ hours: 7, minutes: 30 }`
2. **AC2:** `parseTargetTime("7:30")` returns `{ hours: 7, minutes: 30 }` (flexible parsing)
3. **AC3:** `parseTargetTime("25:00")` throws or returns null (invalid input)
4. **AC4:** `getCheckpointStatus("07:30", now)` returns `{ status: 'ahead', diffMinutes: 4, message: '4 min early' }` when current time is 07:26
5. **AC5:** `getCheckpointStatus("07:30", now)` returns `{ status: 'behind', diffMinutes: 3, message: '3 min past' }` when current time is 07:33
6. **AC6:** `getCheckpointStatus("07:30", now)` returns `{ status: 'on-time', diffMinutes: 0, message: 'right on time' }` when current time is within ±1 minute
7. **AC7:** `formatClockTime("07:30")` returns locale-aware display (e.g., "7:30 AM" for en-US)
8. **AC8:** All functions are pure (no side effects) and accept optional `now` parameter for testability
9. **AC9:** Comprehensive test suite in `checkpoint.test.ts` with edge cases (midnight, noon, invalid formats)

**Prerequisites:** Story 6.1

**Technical Notes:**
- Use `Intl.DateTimeFormat` for locale-aware display per ADR-7
- Keep functions pure — accept `now?: Date` parameter for deterministic testing
- Edge case: midnight crossing (checkpoint at 00:15 when current time is 23:50 — should show "ahead" by 25 min, not "behind" by 23h35m). This is a rare but testable case.

---

### Story 6.3: Step Type Selector in Timer Editor

As a **user**,
I want to set each step's type (Active, Wait, or Checkpoint) when creating or editing a timer,
So that my routine can include different kinds of steps.

**Acceptance Criteria:**

**Given** I am creating or editing a timer
**When** I view the step list
**Then:**

1. **AC1:** Each step row shows a type selector dropdown between the step name and duration
2. **AC2:** Default type is "Active" with ▶ icon — requires no action for simple timers
3. **AC3:** Dropdown options: ▶ Active, ⏳ Wait, 🎯 Check
4. **AC4:** Selecting "Checkpoint" replaces the duration input with a time picker (HH:MM)
5. **AC5:** Selecting "Active" or "Wait" after "Checkpoint" replaces the time picker with a duration input
6. **AC6:** Checkpoint time picker accepts input formats: "730", "7:30", "07:30" and normalizes to HH:MM
7. **AC7:** Checkpoint steps show clock time (e.g., "7:30") instead of a duration
8. **AC8:** Checkpoint steps contribute 0 to the Total duration calculation
9. **AC9:** Step type is saved to Firestore as `step.type` when the timer is saved
10. **AC10:** Editing an existing timer with step types loads them correctly in the form
11. **AC11:** Existing v1 timers (no type field) display all steps as Active by default
12. **AC12:** Type selector has `aria-label="Step type for [step name]"` for accessibility
13. **AC13:** Checkpoint time picker has `inputmode="numeric"` for mobile keyboard optimization

**Prerequisites:** Story 6.2

**Technical Notes:**
- New component: `step-type-selector.tsx` — compact dropdown using shadcn `DropdownMenu`
- New component: `checkpoint-time-picker.tsx` — small HH:MM input, `inputmode="numeric"`
- Modify `step-list-editor.tsx` to integrate type selector per step row
- Modify `timer-form.tsx` to handle `totalPlannedDuration` calculation excluding Checkpoints
- Existing drag-to-reorder (@dnd-kit) should work unchanged with the new selector in each row

---

### Story 6.4: Wait Step Playback

As a **user**,
I want Wait steps to look and feel different from Active steps during playback,
So that I know when I'm actively working vs. passively waiting.

**Acceptance Criteria:**

**Given** a timer is running and the current step is a Wait step
**When** the step is active
**Then:**

1. **AC1:** Inner progress ring uses `--wait` color (calm blue) instead of pace-based green/amber
2. **AC2:** Step name shows ⏳ icon prefix in the center display
3. **AC3:** Text below time shows "Waiting..." in `--muted` color
4. **AC4:** TTS announces: "[Step Name]. [Duration] minutes. Waiting."
5. **AC5:** Wait step auto-advances when planned duration elapses (same as Active auto-advance)
6. **AC6:** User can still Pause, Skip, and Extend a Wait step (same controls as Active)
7. **AC7:** Transition message from Wait to next step: "Done waiting. Next: [Step Name]."
8. **AC8:** Step dot for Wait step uses `--wait` tint (blue) instead of `--primary` green
9. **AC9:** Breathing animation on the ring runs at 2x slower speed for Wait steps (visual calm)
10. **AC10:** `prefers-reduced-motion` disables the breathing animation entirely

**Prerequisites:** Story 6.3

**Technical Notes:**
- Modify `progress-ring.tsx`: accept `stepType` prop, use `--wait` color when `type === 'wait'`
- Modify `step-dots.tsx`: add type-aware coloring
- Modify `running-timer.tsx`: pass step type to child components
- Modify `transition-overlay.tsx`: custom Wait → next transition message
- Modify `use-tts.ts` or the TTS call site: adjust announcement for Wait steps
- CSS: add `--wait` custom property to `globals.css` (value: `#6B94B8`)

---

### Story 6.5: Checkpoint Playback

As a **user**,
I want Checkpoints to display my progress against a target clock time during playback,
So that I know if I'm ahead or behind schedule.

**Acceptance Criteria:**

**Given** a timer is running and the engine reaches a Checkpoint step
**When** the Checkpoint is processed
**Then:**

1. **AC1:** Checkpoint comparison fires: current clock time vs. `step.targetTime`
2. **AC2:** Status displays in center: "🎯 [Name] — [X] min early" or "[X] min past" or "right on time"
3. **AC3:** Status text uses `--ahead` (green), `--behind` (amber), or `--on-track` (green) coloring
4. **AC4:** Brief gold flash (`--checkpoint` color) at reduced opacity (200ms) across the ring area
5. **AC5:** TTS announces: "[Checkpoint Name]. You're [X minutes ahead/behind/right on time]."
6. **AC6:** Checkpoint auto-advances after 3-4 seconds (or user taps to advance immediately)
7. **AC7:** Checkpoint step is marked `completed` with `elapsedTime: 0` (instantaneous)
8. **AC8:** Step dot for Checkpoint uses diamond shape (◆) with `--checkpoint` color
9. **AC9:** `useCheckpoint` hook provides reactive status for the running timer UI
10. **AC10:** Checkpoint flash respects `prefers-reduced-motion` (no flash, instant display)
11. **AC11:** Multiple Checkpoints in a single timer work correctly (each displays independently)

**Prerequisites:** Story 6.4

**Technical Notes:**
- New hook: `use-checkpoint.ts` — wraps `getCheckpointStatus()` from checkpoint utility
- Modify `use-timer-engine.ts`: Checkpoint steps complete instantly (set elapsed=0, status=completed, advance)
- Modify `progress-ring.tsx`: Checkpoint flash animation (CSS keyframe, `--checkpoint` color)
- Modify `step-dots.tsx`: diamond shape for Checkpoint dots
- Modify `running-timer.tsx`: Checkpoint display state with auto-advance timeout (3-4s)
- CSS: add `--checkpoint` custom property to `globals.css` (value: `#C9A84C`)
- Consider: setTimeout for auto-advance, cleared if user taps to advance early

---

## Epic 7: Playback Evolution

**Goal:** Add defer-step functionality and manual advance (pause-between-steps) to the playback engine, making execution more flexible.

**Business Value:** Not every step works in fixed order. Defer lets you say "not now" without losing the step. Manual advance lets you control the pace between steps — critical for routines where transitions are unpredictable.

**FR Coverage:** FR15 (FR15.1–FR15.5), FR16 (FR16.1–FR16.5)

---

### Story 7.1: Pause-Between-Steps Toggle & UI

As a **user**,
I want to enable a "pause between steps" setting on a timer,
So that the timer pauses at each step transition and I control when to start the next step.

**Acceptance Criteria:**

**Given** I am creating or editing a timer
**When** I view the settings area below the step list
**Then:**

1. **AC1:** A "Pause between steps" toggle switch appears below the step list (alongside existing countdown toggle)
2. **AC2:** Default is OFF (false) — existing behavior preserved
3. **AC3:** Help text below toggle: "Timer pauses at each step transition. Tap to start the next step."
4. **AC4:** Setting saves as `pauseBetweenSteps` on the TimerTemplate document
5. **AC5:** Editing an existing timer loads the toggle state correctly

**Prerequisites:** Story 6.5 (Epic 6 complete)

**Technical Notes:**
- Modify `timer-form.tsx`: add toggle switch using shadcn `Switch` component
- Setting is per-timer, not global
- The value is copied to `RunSession.pauseBetweenSteps` at session creation (already in schema from 6.1)

---

### Story 7.2: Manual Advance Playback

As a **user**,
I want the timer to pause between steps when "pause between steps" is enabled, showing a "Start next step" button,
So that I control my own pace.

**Acceptance Criteria:**

**Given** a timer with `pauseBetweenSteps: true` is running
**When** a step completes
**Then:**

1. **AC1:** Session enters `waiting-for-advance` state (not `running`, not `paused`)
2. **AC2:** Chime plays (same as v1 step transition)
3. **AC3:** TTS announces: "Done. Next up: [Step Name]. Tap when ready."
4. **AC4:** Display shows: frozen rings (outer holds total progress, inner empty), "Next: [Step Name]" in center
5. **AC5:** Full-width primary button appears: "▶ Start [Step Name]"
6. **AC6:** Button is auto-focused for keyboard users
7. **AC7:** Time is NOT counting during `waiting-for-advance` — no overrun accumulation
8. **AC8:** Skip and Stop are available as ghost buttons below the Start button
9. **AC9:** Tapping "Start" begins the next step and resumes `running` state
10. **AC10:** Wake lock remains active during `waiting-for-advance`
11. **AC11:** Wait steps auto-advance as normal (the wait IS the action), but THEN pause for manual advance to the following step
12. **AC12:** Checkpoints display status instantly, THEN show manual advance for the next step
13. **AC13:** `waiting-for-advance` state syncs to Firestore — other devices see "Waiting for next step..."
14. **AC14:** ARIA announcement: "Step complete. Next step: [Name]. Activate Start button to begin."

**Prerequisites:** Story 7.1

**Technical Notes:**
- New component: `manual-advance-button.tsx` — full-width primary button with step name
- Modify `use-timer-engine.ts`: add `waiting-for-advance` state, transition logic
- Modify `running-timer.tsx`: render ManualAdvanceButton when in `waiting-for-advance`
- Modify `playback-controls.tsx`: hide normal controls during `waiting-for-advance`, show Skip/Stop
- Modify `use-firestore-session.ts`: sync `waiting-for-advance` status
- Interaction matrix: Wait step completes → auto-advance → waiting-for-advance → user taps → next step
- Interaction matrix: Checkpoint reached → display status → waiting-for-advance for NEXT step

---

### Story 7.3: Defer Step — Action & Tracking

As a **user**,
I want to defer the current step to later during a running timer,
So that I can skip something temporarily without losing it.

**Acceptance Criteria:**

**Given** a timer is running on an Active or Wait step
**When** I view the playback controls
**Then:**

1. **AC1:** A "Defer" ghost button appears alongside Pause/Skip/Extend
2. **AC2:** Tapping "Defer" marks the current step as `deferred` and moves it to the end of the step queue
3. **AC3:** The next non-deferred step begins immediately
4. **AC4:** A badge appears above the step dots: "1 deferred ↩" in `--deferred` color
5. **AC5:** Badge count updates with each deferral: "2 deferred ↩"
6. **AC6:** Deferred step dots show strikethrough/dimmed styling
7. **AC7:** `deferredSteps` array on the RunSession tracks deferred step IDs in deferral order
8. **AC8:** Checkpoint steps cannot be deferred (Defer button is disabled/hidden for Checkpoints)
9. **AC9:** A step can be deferred multiple times in the same session (keeps going to end)
10. **AC10:** Firestore session document updates with deferral state immediately
11. **AC11:** TTS does NOT announce deferrals (silent action — just moves on)

**Prerequisites:** Story 7.2

**Technical Notes:**
- New component: `defer-button.tsx` — ghost button, `--muted` text
- New component: `deferred-badge.tsx` — small pill above step dots
- Modify `use-timer-engine.ts`: defer logic — mark step `deferred`, append to `deferredSteps`, advance `currentStepIndex`
- Modify `step-dots.tsx`: deferred styling (strikethrough/dim)
- Modify `playback-controls.tsx`: add Defer button, disable for Checkpoint steps
- CSS: add `--deferred` custom property to `globals.css` (value: `#8A8474`)

---

### Story 7.4: Deferred Step Resolution

As a **user**,
I want to resolve deferred steps after all main steps complete,
So that I don't forget anything I put off.

**Acceptance Criteria:**

**Given** all non-deferred steps have completed and deferred steps remain
**When** the timer engine detects no more main steps
**Then:**

1. **AC1:** TTS announces: "All main steps done. You deferred [Step Name] earlier. Ready to do it now?"
2. **AC2:** Display shows deferred step name with "↩" prefix and original planned duration
3. **AC3:** Three actions available: "Start" (runs step normally), "Skip" (marks skipped), "Defer again" (re-appends)
4. **AC4:** If `pauseBetweenSteps` is on, each deferred step shows the manual advance prompt
5. **AC5:** After all deferred steps are resolved (started/skipped), the timer completes normally
6. **AC6:** Completion view notes deferred steps: "N steps deferred, M completed later, K skipped"
7. **AC7:** Deferred badge disappears once all deferred steps are resolved
8. **AC8:** If user defers a step again during resolution, it goes back to the end of the deferred queue

**Prerequisites:** Story 7.3

**Technical Notes:**
- New component: `deferred-resolution.tsx` — presents one deferred step at a time with Start/Skip/Defer actions
- Modify `use-timer-engine.ts`: after last main step, switch to deferred step processing loop
- Modify `completion-view.tsx`: add deferred step summary line to stats
- State machine: when `currentStepIndex` passes all non-deferred → pop from `deferredSteps` → present
- Edge case: all deferred steps skipped → timer completes
- Edge case: re-deferral during resolution → step goes back to end of deferred queue

---

## Epic 8: Routines & Habits

**Goal:** Transform one-off timers into repeatable scheduled routines with streak tracking, in-app awareness, and personal theming.

**Note:** Story 8.5 (Theme Selection) is independent of the schedule/streak stories and can be parallelized.

**Business Value:** The app becomes a daily companion. "Morning Routine is due today" surfaces when you open the app. Quiet streak badges ("Day 6 ☕") reward consistency without pressure.

**FR Coverage:** FR17 (FR17.1–FR17.4), FR18 (FR18.1–FR18.5)

---

### Story 8.1: Schedule Configuration UI

As a **user**,
I want to optionally schedule a timer for specific days and times of day,
So that the app knows when my routines are supposed to happen.

**Acceptance Criteria:**

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

**Prerequisites:** Story 7.4 (Epic 7 complete) — but could also start after 6.1 if parallelizing

**Technical Notes:**
- New component: `schedule-section.tsx` — collapsible section with day picker + segmented control
- Modify `timer-form.tsx`: integrate ScheduleSection below existing toggles
- Day picker: 7 buttons with `DayOfWeek` values, multi-select toggle
- Time-of-day: use shadcn-compatible segmented control (or custom with button group)
- Collapsed summary: derive from schedule object when section is collapsed

---

### Story 8.2: Schedule Utility Functions & Due Today Logic

As a **developer**,
I want utility functions for schedule awareness (isDueToday, time-of-day matching, sorting),
So that the timer library can surface scheduled routines prominently.

**Acceptance Criteria:**

**Given** `src/lib/utils/` directory
**When** `schedule.ts` is created
**Then:**

1. **AC1:** `isDueToday(schedule, today?)` returns `true` when today's weekday matches `schedule.days`
2. **AC2:** `getTimeOfDayBucket(now?)` returns `'morning'` before 12:00, `'afternoon'` 12:00–17:00, `'evening'` after 17:00
3. **AC3:** `isTimeOfDayMatch(schedule, now?)` returns `true` when current bucket matches schedule or schedule is `'anytime'`
4. **AC4:** `sortTimersForLibrary(timers, completedTodayIds, today?)` returns `{ dueToday, rest }` with due-today timers sorted first
5. **AC5:** Timers with `schedule.enabled === false` or no schedule are always in the `rest` group
6. **AC6:** Comprehensive test suite in `schedule.test.ts` covering each weekday, edge cases (midnight, timezone), and anytime matching

**And given** `src/lib/utils/` directory
**When** `streaks.ts` is created
**Then:**

7. **AC7:** `calculateStreakUpdate(currentStreak, schedule, completionDate)` increments streak count when previous scheduled day was completed
8. **AC8:** `calculateStreakUpdate` resets streak to 1 on a fresh start (gap since last completion)
9. **AC9:** `validateStreak(currentStreak, schedule, today)` returns `null` if streak is valid, or a reset Streak if days were missed
10. **AC10:** `isScheduledDay(schedule, date)` correctly handles each day of the week
11. **AC11:** `getPreviousScheduledDay(schedule, date)` finds the preceding scheduled day
12. **AC12:** Milestone detection: Day 7 ("One week ☕"), Day 14, Day 30 ("One month 🌟"), Day 100
13. **AC13:** Comprehensive test suite in `streaks.test.ts` — increment, reset, weekend gaps, milestone detection, edge cases

**Prerequisites:** Story 8.1

**Technical Notes:**
- All functions are pure with optional date parameters for deterministic testing
- `DayOfWeek` mapping: use `Date.getDay()` (0=Sun) mapped to our `DayOfWeek` type
- Weekend gap example: Mon-Fri schedule, completed Friday → skip Saturday/Sunday → still valid Monday
- Streak reset: if Monday is missed on a Mon-Fri schedule, streak resets on Tuesday's validation

---

### Story 8.3: Due Today Section & Streak Badges in Timer Library

As a **user**,
I want to see my scheduled routines prominently when I open the app, with streak badges showing my consistency,
So that I know what's due and feel quietly motivated.

**Acceptance Criteria:**

**Given** I open the timer library and have scheduled routines
**When** the library loads
**Then:**

1. **AC1:** "DUE TODAY" section appears at the top of the library
2. **AC2:** Only routines scheduled for today (matching day-of-week) appear in DUE TODAY
3. **AC3:** Each due-today card shows time-of-day icon: ☀ Morning, 🌤 Afternoon, 🌙 Evening
4. **AC4:** Cards with active streaks show badge: "Day N ☕" in `--streak` color
5. **AC5:** Routines already completed today show "✓ Done" badge with muted styling (no play button)
6. **AC6:** Non-scheduled timers appear under "ALL TIMERS" section below
7. **AC7:** If no routines are due today, the "DUE TODAY" section does not appear at all (no empty state noise)
8. **AC8:** Streak validation runs on library load — stale streaks are reset silently

**And given** I complete a scheduled routine
**When** the completion view closes and I return to the library
**Then:**

9. **AC9:** Streak increments and badge updates: "Day 7 — one week ☕"
10. **AC10:** Milestone toasts appear briefly (3-4 seconds): Day 7, Day 14, Day 30, Day 100
11. **AC11:** Routine card in DUE TODAY updates to show "✓ Done"

**And given** I missed a scheduled day
**When** I open the library the next scheduled day
**Then:**

12. **AC12:** Streak resets to 0 silently — no negative messaging
13. **AC13:** Next completion shows "Day 1 — fresh start"

**Prerequisites:** Story 8.2

**Technical Notes:**
- New component: `due-today-section.tsx` — renders DUE TODAY section header + filtered cards
- New component: `streak-badge.tsx` — small pill text, `--streak` color
- New hook: `use-schedule.ts` — computes `dueToday` and `completedToday` from timers + recent sessions
- New hook: `use-streak.ts` — validates streak on mount, provides update function
- Modify `timer-library.tsx`: integrate DueTodaySection at top, separate "ALL TIMERS" below
- Modify `timer-card.tsx`: add streak badge, done badge, time-of-day icon
- Query for completedToday: recent sessions where `timerId` matches and `completedAt` is today
- CSS: add `--streak` custom property to `globals.css` (value: `#D4A96A`)

---

### Story 8.4: Streak Settings & Streak Update on Completion

As a **user**,
I want streaks to be opt-in and to update automatically when I complete scheduled routines,
So that I get quiet encouragement without pressure.

**Acceptance Criteria:**

**Given** the settings sheet
**When** I view settings
**Then:**

1. **AC1:** "Show streaks" toggle exists, default: ON
2. **AC2:** When OFF, no streak badges appear anywhere in the library
3. **AC3:** Setting persists in localStorage (device-specific, per ADR-6)

**And given** I complete a scheduled routine with streak tracking enabled
**When** the session completes
**Then:**

4. **AC4:** Streak is updated on the TimerTemplate document atomically
5. **AC5:** `streak.currentCount` increments correctly based on schedule gap analysis
6. **AC6:** `streak.lastCompletedDate` updates to today's date
7. **AC7:** If this is Day 1 (fresh start after reset or first time), `streak.startDate` is set to today
8. **AC8:** Milestone detection triggers toast on return to library

**And given** streak tracking is disabled on a timer's schedule
**When** I complete the routine
**Then:**

9. **AC9:** No streak update occurs — `streak` field is not written
10. **AC10:** No streak badge appears on the card

**Prerequisites:** Story 8.3

**Technical Notes:**
- Modify `settings-sheet.tsx`: add "Show streaks" toggle
- Modify session completion flow: after marking session `completed`, call `useStreak.updateStreakOnCompletion()`
- Streak update: read current streak from template → calculate update → write back
- Use Firestore transaction or update for atomic streak writes
- localStorage key: `adhd-timer-show-streaks` (boolean)

---

### Story 8.5: User Theme Selection

As a **user**,
I want to choose from a curated set of color themes and have my choice persist across all my devices,
So that my timer experience feels personally mine and visually comfortable.

**Acceptance Criteria:**

**Given** `src/lib/themes/` directory
**When** theme definitions are created
**Then:**

1. **AC1:** 5 themes defined: Deep Forest 🌲 (default), Warm Dusk 🌅, Night Ocean 🌊, Soft Clay 🏺, Twilight Lavender 🌙
2. **AC2:** `ThemeDefinition` contains all CSS custom property values (backgrounds, primary, semantic, shadcn tokens)
3. **AC3:** Each theme passes WCAG AA contrast for text-on-background
4. **AC4:** `useTheme()` hook reads/writes Firestore `users/{userId}.themeId`, caches in localStorage
5. **AC5:** Theme change takes effect immediately via CSS custom property updates — no page reload
6. **AC6:** Fast initial paint: localStorage read on load, Firestore reconciliation in background
7. **AC7:** Theme picker in settings: emoji + name + 4-swatch preview, `role="radiogroup"`, keyboard navigable
8. **AC8:** Falls back gracefully: Firestore → localStorage → Deep Forest default
9. **AC9:** Firestore rules allow authenticated users to read/write their own `users/{userId}` doc
10. **AC10:** Comprehensive test suite: theme definitions, CSS application, hook behavior, picker UI, Firestore persistence

**Prerequisites:** Can be parallelized after Story 8.1 (independent of schedule/streak work)

**Technical Notes:**
- Full story doc: `docs/stories/8-5-user-theme-selection.md`
- New files: `src/lib/themes/themes.ts`, `src/lib/themes/apply-theme.ts`, `src/hooks/use-theme.ts`, `src/components/settings/theme-picker.tsx`, `src/lib/firebase/user-preferences.ts`
- Existing `globals.css` `:root` block unchanged — serves as CSS fallback
- Theme palettes sourced from `docs/ux-color-themes.html` + new Twilight Lavender

---

## Epic 9: Learning Companion

**Goal:** The app watches how you execute routines and helps you improve — post-completion duration suggestions and gentle step reminders during long steps.

**Business Value:** This is the v2 hero feature. "Your plans learn from you." After 5 runs, the app says "Shower averaged 10 min (planned 8). Adjust?" Gentle reminders nudge during long steps. The app becomes a thoughtful companion, not just a dumb timer.

**FR Coverage:** FR19 (FR19.1–FR19.5), FR20 (FR20.1–FR20.4)

---

### Story 9.1: Suggestion Algorithm & Firestore Query

As a **developer**,
I want a pure suggestion algorithm and a Firestore query function for historical sessions,
So that the completion view can show data-driven duration suggestions.

**Acceptance Criteria:**

**Given** `src/lib/utils/` directory
**When** `suggestions.ts` is created
**Then:**

1. **AC1:** `calculateSuggestions(currentSteps, historicalSessions, minSessions?, minDeviationSeconds?)` returns an array of `Suggestion` objects
2. **AC2:** A `Suggestion` contains: `{ stepId, stepName, currentDuration, suggestedDuration, averageActual }`
3. **AC3:** `suggestedDuration` is rounded to the nearest 60 seconds (whole minutes)
4. **AC4:** Suggestions are only generated when `|averageActual - currentDuration| >= 60 seconds` (default threshold)
5. **AC5:** Suggestions require at least 3 historical sessions (default `minSessions`)
6. **AC6:** Skipped steps are excluded from average calculation
7. **AC7:** Deferred steps that were eventually completed ARE included (using actual elapsed time)
8. **AC8:** Checkpoint steps are excluded from suggestions entirely
9. **AC9:** `calculateStepAverage(stepId, sessions)` returns the average or `null` if insufficient data
10. **AC10:** Comprehensive test suite in `suggestions.test.ts` — averages, thresholds, edge cases (all skipped, mixed statuses, < 3 sessions)

**And given** `src/lib/firebase/sessions.ts`
**When** a new query function is added
**Then:**

11. **AC11:** `getCompletedSessionsForTimer(userId, timerId, limit?)` queries Firestore: `sessions` where `timerId == X`, `status == 'completed'`, ordered by `completedAt` desc, limit 5
12. **AC12:** Query uses the composite index created in Story 6.1
13. **AC13:** Returns typed `RunSession[]`

**Prerequisites:** Story 8.4 (Epic 8 complete) — but could start after 6.1 if parallelizing

**Technical Notes:**
- `suggestions.ts` is pure — no Firestore dependency, operates on in-memory data
- Standard deviation check from PRD: "most runs deviate in the same direction" — implement as: majority (≥60%) of runs should deviate in the same direction for a suggestion to fire
- Test with realistic data: 5 sessions where Shower is consistently 10 min but planned as 8 min

---

### Story 9.2: Suggestion UI in Completion View

As a **user**,
I want to see duration adjustment suggestions when I complete a routine with 3+ prior runs,
So that my timers get better over time without manual effort.

**Acceptance Criteria:**

**Given** I complete a timer that has 3+ prior completed sessions
**When** the completion view loads
**Then:**

1. **AC1:** "Suggested Tweaks" section appears below the existing step summary
2. **AC2:** Header: "☕ Suggested Tweaks" with subtext "Based on your last N runs:"
3. **AC3:** Each suggestion shows: step name, current → suggested duration, average actual below in muted text
4. **AC4:** Each suggestion has "Accept" and "Dismiss" buttons
5. **AC5:** "Accept All" and "Dismiss All" bulk action buttons appear below all cards
6. **AC6:** Accepted suggestions: card collapses with ✓ checkmark, brief green flash
7. **AC7:** Dismissed suggestions: card fades out
8. **AC8:** Accepting a suggestion updates the step's `plannedDuration` on the TimerTemplate document
9. **AC9:** Accepting also recalculates and updates `totalPlannedDuration`
10. **AC10:** ARIA: suggestion list has `role="list"`, each card `role="listitem"` with descriptive labels
11. **AC11:** After accept: ARIA announcement "[Step Name] adjusted to [N] minutes"
12. **AC12:** After dismiss: ARIA announcement "Suggestion for [Step Name] dismissed"

**And given** the timer has 3+ runs but no step meets the deviation threshold
**When** the completion view loads
**Then:**

13. **AC13:** A single line displays: "✓ Your durations are on track — no tweaks needed." in `--muted` color

**And given** the timer has fewer than 3 prior completed sessions
**When** the completion view loads
**Then:**

14. **AC14:** No suggestion section appears (completion view is identical to v1)

**Prerequisites:** Story 9.1

**Technical Notes:**
- New hook: `use-suggestions.ts` — calls `getCompletedSessionsForTimer`, runs `calculateSuggestions`, provides accept/dismiss/acceptAll/dismissAll
- New component: `suggestion-card.tsx` — individual suggestion with Accept/Dismiss
- New component: `suggestion-section.tsx` — section wrapper with header + bulk actions
- Modify `completion-view.tsx`: integrate SuggestionSection conditionally
- Accept action: calls `updateDoc` on the timer template to set new step duration
- CSS: add `--suggestion` custom property to `globals.css` (value: `#6BB5A0`)

---

### Story 9.3: Gentle Step Reminder

As a **user**,
I want a subtle reminder during long steps to keep me grounded,
So that I don't lose track of what I'm doing.

**Acceptance Criteria:**

**Given** an Active step is running with planned duration ≥ reminder threshold (default 5 min)
**When** the step reaches its midpoint
**Then:**

1. **AC1:** A brief text overlay appears above the ring: "You're working on [Step Name]"
2. **AC2:** Overlay fades in (0.5s), holds (2s), fades out (0.5s) — total 3s
3. **AC3:** TTS speaks: "You're working on [Step Name]" (if TTS enabled)
4. **AC4:** No time information in the reminder — just the step name
5. **AC5:** Overlay style: `--text` on semi-transparent `--surface` background, rounded pill

**And given** the step overruns (elapsed > planned)
**When** every 3 minutes of overrun
**Then:**

6. **AC6:** The same reminder fires again (same visual + voice)

**And given** settings
**When** reminder toggle and threshold are configured
**Then:**

7. **AC7:** "Step reminders" toggle exists in settings sheet, default: ON
8. **AC8:** Threshold stepper offers: 3, 5, 10, 15 minute options, default: 5
9. **AC9:** When disabled, no reminders fire at all
10. **AC10:** Settings persist in localStorage

**And given** the step is a Wait or Checkpoint
**When** the step is active
**Then:**

11. **AC11:** No reminder fires (Wait steps are passive; Checkpoints are instantaneous)

**And given** `prefers-reduced-motion` is active
**When** a reminder triggers
**Then:**

12. **AC12:** Overlay appears/disappears instantly (no fade animation)

**Prerequisites:** Story 9.2

**Technical Notes:**
- New hook: `use-reminder.ts` — manages setTimeout/setInterval for midpoint + overrun reminders
- New component: `reminder-overlay.tsx` — positioned above the ring, CSS fade animation
- Modify `settings-sheet.tsx`: add "Step reminders" toggle + threshold stepper
- Modify `running-timer.tsx`: integrate useReminder, render ReminderOverlay conditionally
- Reminder cleanup: clear all timers on step change, pause, or session end
- localStorage keys: `adhd-timer-reminder-enabled` (boolean), `adhd-timer-reminder-threshold` (number)

---

### Story 9.4: Reminder Settings Integration & Polish

As a **user**,
I want the reminder and streak settings to work smoothly together and be discoverable,
So that I can customize my experience.

**Acceptance Criteria:**

**Given** the settings sheet has new v2 toggles
**When** I open settings
**Then:**

1. **AC1:** Settings are organized in logical groups: "Playback" (TTS, reminders), "Library" (streaks)
2. **AC2:** Reminder threshold only shows when reminders are enabled
3. **AC3:** All settings load correctly on app restart
4. **AC4:** Settings work correctly with real timer playback (end-to-end)
5. **AC5:** Settings sheet doesn't break on narrow screens (320px)

**And given** all v2 playback features are integrated
**When** running a complex timer (Active + Wait + Checkpoint + pause-between-steps + defer + reminders)
**Then:**

6. **AC6:** All features work together without conflicts
7. **AC7:** Checkpoint skips reminder logic (instantaneous)
8. **AC8:** Wait steps skip reminder logic (passive)
9. **AC9:** Deferred steps still trigger reminders when eventually run
10. **AC10:** Manual advance + reminder: reminder timers pause during `waiting-for-advance`

**Prerequisites:** Story 9.3

**Technical Notes:**
- This is an integration/polish story — primarily testing and fixing edge cases
- Modify `settings-sheet.tsx`: organize settings into groups, conditional threshold display
- Run end-to-end scenarios: create a timer with all step types, pause-between-steps, and run it
- Test: defer a step, run remaining, resolve deferred step, get suggestion on completion
- This story is the "shake it until it breaks" pass for all of Epics 6-9

---

## Epic 10: Smarter AI

**Goal:** The AI proactively helps during timer creation by detecting vague step names and offering to break them down.

**Business Value:** Users don't always realize a step is too broad. "Clean the house" is not a step — it's 5 steps. The AI notices and offers to help before you even ask.

**FR Coverage:** FR21 (FR21.1–FR21.5)

---

### Story 10.1: Vague-Task Detection Utilities

As a **developer**,
I want a client-side heuristic for detecting vague step names,
So that the timer editor can flag broad steps and offer AI assistance.

**Acceptance Criteria:**

**Given** `src/lib/utils/` directory
**When** `vague-detect.ts` is created
**Then:**

1. **AC1:** `isVagueStepName(name)` returns `true` for known vague patterns
2. **AC2:** Detects single generic words: "work", "clean", "organize", "stuff", "things", "chores", "errands"
3. **AC3:** Detects broad scope phrases: "clean the house", "work on project", "do homework", "get ready"
4. **AC4:** Detects very long names (>60 chars) — sentence-like descriptions
5. **AC5:** Returns `false` for specific names: "Shower", "Brush teeth", "Boil water for pasta"
6. **AC6:** Returns `false` for empty strings, very short strings (1-2 chars), and whitespace-only
7. **AC7:** `VAGUE_PATTERNS` exported for testing and potential future extension
8. **AC8:** Comprehensive test suite in `vague-detect.test.ts` with true positives, true negatives, and edge cases
9. **AC9:** Function completes in < 100ms (it's regex — should be microseconds)

**Prerequisites:** Story 6.1 (needs schema types, but otherwise independent)

**Technical Notes:**
- Implementation: array of RegExp patterns, test each against the trimmed lowercased step name
- Keep patterns conservative — false positives are low-cost (user just dismisses) but annoying if too frequent
- Future: patterns can be extended without changing the API
- Do NOT flag empty names — those are just unfinished steps in progress

---

### Story 10.2: Vague-Task Suggestion UI in Timer Editor

As a **user**,
I want to see a helpful suggestion when I type a vague step name, offering to break it down with AI,
So that I create more actionable routines.

**Acceptance Criteria:**

**Given** I am creating or editing a timer and I type a vague step name (e.g., "clean the house")
**When** I leave the step name field (blur) or save the timer
**Then:**

1. **AC1:** An inline suggestion appears below the step: "💡 This seems broad — want me to break it down?"
2. **AC2:** Two actions: "Break it down ✨" button and "No thanks" link
3. **AC3:** Suggestion has `--info` left border and subtle background styling
4. **AC4:** Suggestion appearance is debounced (500ms after blur, not on every keystroke)

**And given** I tap "Break it down ✨"
**When** the AI processes the request
**Then:**

5. **AC5:** Loading skeleton replaces the single step row
6. **AC6:** AI calls the existing `/api/ai/breakdown` endpoint with the step name
7. **AC7:** Generated substeps replace the single vague step in the step list
8. **AC8:** Generated steps are highlighted briefly (subtle `--suggestion` left border, fades after 2s)
9. **AC9:** User can edit all generated steps normally (names, durations, types, reorder)
10. **AC10:** AI call counts against the existing 20/day rate limit

**And given** I tap "No thanks"
**When** the suggestion is dismissed
**Then:**

11. **AC11:** Suggestion disappears immediately
12. **AC12:** No persistence — same suggestion may reappear on next edit

**And given** a step was generated by the AI breakdown panel in this session
**When** vague detection runs
**Then:**

13. **AC13:** AI-generated steps are NOT flagged as vague (trust the AI's own output for the session)

**Prerequisites:** Story 10.1

**Technical Notes:**
- New hook: `use-vague-detect.ts` — debounced (500ms) vague detection per step, tracks dismissed state per session
- New component: `vague-task-suggestion.tsx` — inline card below step row
- Modify `step-list-editor.tsx`: integrate useVagueDetect per step, render suggestion inline
- "Break it down" calls the same API route as the existing AI breakdown panel (Story 5.1)
- Track AI-generated step IDs in form state to suppress re-detection
- Rate limit: same 20/day counter in Firestore `aiUsage` — shared with main AI panel

---

## Story Sequencing Summary

| Order | Story | Epic | Key Deliverable |
|-------|-------|------|----------------|
| 1 | 6.1 | Step Types | Schema evolution — foundation for everything |
| 2 | 6.2 | Step Types | Checkpoint utility functions |
| 3 | 6.3 | Step Types | Step type selector in editor |
| 4 | 6.4 | Step Types | Wait step playback |
| 5 | 6.5 | Step Types | Checkpoint playback |
| 6 | 7.1 | Playback | Pause-between-steps toggle |
| 7 | 7.2 | Playback | Manual advance playback |
| 8 | 7.3 | Playback | Defer step action + tracking |
| 9 | 7.4 | Playback | Deferred step resolution |
| 10 | 8.1 | Routines | Schedule configuration UI |
| 11 | 8.2 | Routines | Schedule + streak utility functions |
| 12 | 8.3 | Routines | Due today section + streak badges |
| 13 | 8.4 | Routines | Streak settings + completion update |
| 14 | 9.1 | Learning | Suggestion algorithm + Firestore query |
| 15 | 9.2 | Learning | Suggestion UI in completion view |
| 16 | 9.3 | Learning | Gentle step reminder |
| 17 | 9.4 | Learning | Settings integration + full polish |
| 18 | 10.1 | Smart AI | Vague-task detection utilities |
| 19 | 10.2 | Smart AI | Vague-task suggestion UI |

**Parallelization opportunities:**
- Stories 10.1 and 10.2 can run anytime after 6.1 (independent of Epics 7-9)
- Stories 8.1–8.2 could start after 6.1 if parallelizing with Epic 7 (no dependency on defer/manual advance)
- Stories 9.1–9.2 could start after 6.1 if parallelizing (suggestions don't depend on playback evolution)

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-14 | 1.0 | Initial Epic Breakdown (v1 MVP — Epics 1-5, 23 stories) | BMad |
| 2026-02-16 | 2.0 | v2 Epic Breakdown (Epics 6-10, 19 stories) | BMad |

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
