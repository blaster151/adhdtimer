# Story 4.3: Count-Up / Countdown Toggle

## Status: ready-for-dev

## Story

As a **user**,
I want to switch between count-up and countdown display modes for my timers,
So that I can choose the time display that works best for me.

## Prerequisites

- Story 4.2 complete (drag-to-reorder steps)
- `TimerForm` component exists from Story 1.4
- `RunningTimer` and display components exist from Stories 1.6, 2.3

## Acceptance Criteria (ACs)

### AC 4.3.1 — Toggle in Timer Form
**Given** I am creating or editing a timer
**When** I see the "Countdown mode" toggle switch
**Then** I can enable or disable countdown mode
**And** the toggle appears below the step list, above the Save button

### AC 4.3.2 — Countdown Mode Persists
**Given** I enable countdown mode and save the timer
**When** I reopen the timer for editing
**Then** the countdown toggle shows the saved state (enabled)
**And** `countdownMode: true` is stored on the `TimerTemplate` document

### AC 4.3.3 — Countdown Display During Playback
**Given** I run a timer with countdown mode enabled
**When** the timer is running
**Then** each step shows remaining time counting down (e.g., 4:32 → 4:31 → ...)
**And** overall timer shows total remaining time

### AC 4.3.4 — Overrun Display in Countdown Mode
**Given** a step overruns its planned duration in countdown mode
**When** the countdown reaches 0:00
**Then** the display switches to "+0:01 over", "+0:02 over" (count-up of overrun)
**And** the text color shifts to warm amber

### AC 4.3.5 — Default Count-Up Mode
**Given** no countdown toggle is set (default)
**When** the timer runs
**Then** count-up mode is used: 0:00 → 0:01 → 0:02 → ...
**And** this is the existing behavior (no change)

### AC 4.3.6 — Engine Unchanged
**Given** countdown mode is enabled or disabled
**When** the timer engine runs
**Then** the engine behavior is identical (timestamp-based elapsed tracking)
**And** countdown is purely a display-layer transformation

### AC 4.3.7 — Progress Ring Countdown
**Given** countdown mode is enabled
**When** the ProgressRing component renders
**Then** the time display inside the ring shows countdown format
**And** the ring animation direction/progress remains the same (fills as time passes)

### AC 4.3.8 — Overrun Color Transition
**Given** a step enters overrun in countdown mode
**When** the display switches from countdown to "+over" format
**Then** the color transition to warm amber is smooth (CSS transition ~0.3s)
**And** the transition is not jarring or abrupt

## Tasks

### Task 1: Add Countdown Toggle to TimerForm
- **File:** `src/components/timer/timer-form.tsx`
- Add shadcn `Switch` component below step list, above Save button
- Label: "Countdown mode"
- Description text: "Show remaining time instead of elapsed"
- Wire toggle to `countdownMode` field in form state
- Default: false (unchecked)

### Task 2: Create Countdown Display Utility
- **File:** `src/lib/utils/time.ts` (add to existing)
- Add `formatCountdown(elapsedSeconds: number, plannedSeconds: number): { display: string; isOverrun: boolean }`
- When `elapsed < planned`: return `{ display: formatDuration(planned - elapsed), isOverrun: false }`
- When `elapsed >= planned`: return `{ display: "+" + formatDuration(elapsed - planned) + " over", isOverrun: true }`
- Unit tests for all cases including edge (exactly at planned, 1 second over, large overrun)

### Task 3: Update RunningTimer / ProgressRing Display
- **File:** `src/components/session/running-timer.tsx`, `src/components/session/progress-ring.tsx`
- Read `countdownMode` from the session's source timer template
- If `countdownMode`:
  - Step time: use `formatCountdown(stepElapsed, stepPlanned)`
  - Overall time: use `formatCountdown(totalElapsed, totalPlanned)`
  - Apply `text-warning` class when `isOverrun === true`
- If not `countdownMode`: existing count-up display (no change)
- Smooth color transition: `transition-colors duration-300`

### Task 4: Update Firestore Schema Usage
- Ensure `countdownMode` field is read/written in timer CRUD functions
- Default value: `false` for existing timers without the field (backward compatible)
- No migration needed — Firestore is schemaless; missing field defaults to `false`

### Task 5: Tests
- Unit test: `formatCountdown()` utility — all cases
- Component test: TimerForm renders toggle, toggles state, saves correctly
- Component test: RunningTimer displays countdown format when enabled
- Component test: overrun color shift applies correctly
- Test: default behavior unchanged when `countdownMode` is false/undefined

## Dev Notes

- **Critical:** The timer engine (`useTimerEngine`) must NOT be modified. Countdown is purely a UI transformation: `display = plannedDuration - elapsedTime`. The engine always tracks elapsed time via timestamps.
- The `countdownMode` boolean is on `TimerTemplate`, not `RunSession`. The running timer reads it from the template reference.
- For overall timer countdown, use `totalPlannedDuration - totalElapsedTime` where `totalElapsedTime` is sum of all completed step elapsed times + current step elapsed.
- The warm amber color for overrun should use the existing design system token (e.g., `hsl(var(--warning))` from the Deep Forest theme).
