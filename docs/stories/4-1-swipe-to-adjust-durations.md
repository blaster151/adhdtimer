# Story 4.1: Swipe-to-Adjust Durations

## Status: ready-for-dev

## Story

As a **user**,
I want to swipe on a step's duration to quickly increase or decrease it,
So that I can adjust my routine timing with a natural, fast gesture.

## Prerequisites

- Story 3.4 complete (all of Epic 3 complete)
- `StepListEditor` component exists from Story 1.4

## Acceptance Criteria (ACs)

### AC 4.1.1 — Swipe Right to Increase Duration
**Given** I am on the timer creation or editing page
**When** I swipe right on a step's duration area
**Then** the duration increases by 1 minute per ~30px of horizontal movement
**And** the number updates in real-time as I swipe

### AC 4.1.2 — Swipe Left to Decrease Duration
**Given** I swipe left on a step's duration area
**When** the duration reaches 1 minute (60 seconds)
**Then** it stops decreasing (minimum 1 minute)
**And** the number updates in real-time as I swipe

### AC 4.1.3 — Tap-to-Type Input
**Given** I tap on the duration number
**When** a text input appears
**Then** I can type a specific duration
**And** the input accepts formats: "5m", "5:00", "5", "300s"

### AC 4.1.4 — Duration Format Parsing
**Given** I enter a duration in any supported format
**When** I confirm the input (blur or Enter)
**Then** "5m" → 5 minutes, "5:00" → 5 minutes, "5" → 5 minutes, "300s" → 5 minutes
**And** invalid input is rejected (field reverts to previous value)

### AC 4.1.5 — Total Duration Auto-Recalculation
**Given** I adjust any step's duration (via swipe or tap-to-type)
**When** the change is made
**Then** the total timer duration at the bottom of the form auto-recalculates

### AC 4.1.6 — Haptic Feedback
**Given** the device supports `navigator.vibrate()`
**When** I swipe to adjust a duration
**Then** a brief haptic pulse (10ms) fires on each minute increment
**And** on devices without vibration support, no error occurs (silent degradation)

### AC 4.1.7 — Desktop Click-Drag Support
**Given** I am using a desktop browser
**When** I click and drag horizontally on a step's duration area
**Then** the same increase/decrease behavior occurs as mobile swipe
**And** mouse cursor changes to indicate drag-ability (grab/grabbing cursor)

## Tasks

### Task 1: Create `parseDuration()` Utility
- **File:** `src/lib/utils/time.ts` (add to existing)
- Add `parseDuration(input: string): number | null` function
- Handle formats: "5m", "5:00", "5", "300s", "1h30m" (bonus)
- Return seconds or null for invalid input
- Add comprehensive unit tests in `src/lib/utils/time.test.ts`
- Test: "5m" → 300, "5:00" → 300, "5" → 300, "300s" → 300, "" → null, "abc" → null, "0" → null (minimum 1 min)

### Task 2: Create Swipe/Drag Gesture Handler
- Create `useSwipeAdjust` hook or inline handler for touch + mouse events
- Touch: `touchstart` → record start X, `touchmove` → calculate delta, `touchend` → finalize
- Mouse: `mousedown` → record start X, `mousemove` → calculate delta, `mouseup` → finalize
- Each ~30px delta = 1 minute change (configurable via `pixelsPerStep`)
- Clamp to minimum 60 seconds
- Call `navigator.vibrate?.(10)` on each minute threshold crossing

### Task 3: Enhance Step Row in StepListEditor
- Modify existing step row component in `StepListEditor`
- Duration area: supports swipe gesture by default
- On tap (without swipe): toggle to text input mode
- Text input: uses `parseDuration()` on blur/Enter, reverts on invalid
- Show grab/grabbing cursor on desktop for the duration area
- Real-time duration display update during swipe

### Task 4: Wire Total Duration Recalculation
- On any step duration change (swipe or type), recalculate sum
- Update the total duration display at bottom of `TimerForm`
- Ensure both swipe changes and tap-to-type changes trigger recalc

### Task 5: Component and Integration Tests
- Test swipe gesture handler with mock touch events
- Test tap-to-type toggle and parsing
- Test total duration recalculation
- Test haptic feedback call (mock `navigator.vibrate`)
- Test desktop mouse drag behavior
- Test minimum duration enforcement (can't go below 1 minute)

## Dev Notes

- The swipe gesture must NOT conflict with the drag-to-reorder gesture (Story 4.2). Swipe is horizontal on the duration area; drag is vertical via a separate drag handle. The interaction areas must be distinct.
- Consider using `e.preventDefault()` on `touchmove` within the duration area to prevent page scrolling during swipe adjustment.
- The `parseDuration` utility will also be used by the AI breakdown feature (Epic 5) for duration display.
