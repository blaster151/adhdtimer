# Story 1.6: Core Playback — Play, Pause, Skip

Status: ready-for-dev

## Story

As a **user**,
I want to start a timer and have it run through steps sequentially with play, pause, and skip controls,
so that I can execute my routine with basic guidance.

## Acceptance Criteria

1. **AC23:** Tapping "Play" on a timer card creates a new RunSession in Firestore and navigates to `/app/sessions/[sessionId]`
2. **AC24:** Running timer view shows current step name and elapsed time counting up (formatted as mm:ss or h:mm:ss)
3. **AC25:** Pause stops elapsed time display; Resume continues from the paused state with correct timestamp math
4. **AC26:** Skip marks current step as `skipped` and advances to the next step immediately — no confirmation dialog
5. **AC27:** When a step's elapsed time reaches its planned duration, auto-advance to the next step (step marked `completed`)
6. **AC28:** Last step completing sets session status to `completed`
7. **AC29:** Stop marks session `completed` (early stop) and returns to the timer library
8. **AC-extra-1:** Timer engine uses timestamp-based calculation (`Date.now() - startedAt`), not tick-counting (per ADR-3)
9. **AC-extra-2:** Each state transition (play, pause, resume, skip, auto-advance, stop) writes to Firestore immediately
10. **AC-extra-3:** UI refreshes at ~1s intervals via `setInterval` but actual elapsed is always recalculated from timestamps
11. **AC-extra-4:** Multiple pause/resume cycles maintain accurate elapsed time (no drift)
12. **AC-extra-5:** Basic step list displayed alongside current step (showing completed/upcoming steps with status indicators)

## Tasks / Subtasks

- [ ] **Task 1: Create useTimerEngine hook** (AC: 23, 24, 25, 26, 27, 28, 29, extra-1, extra-4)
  - [ ] Create `src/hooks/use-timer-engine.ts`
  - [ ] Implement the state machine with the following interface:
    ```typescript
    interface UseTimerEngineReturn {
      session: RunSession | null;
      currentStep: SessionStep | null;
      currentStepIndex: number;
      elapsedTime: number;         // current step elapsed (seconds)
      totalElapsedTime: number;    // all steps (seconds)
      isRunning: boolean;
      isPaused: boolean;
      isCompleted: boolean;
      start: (template: TimerTemplate) => Promise<void>;
      pause: () => Promise<void>;
      resume: () => Promise<void>;
      skip: () => Promise<void>;
      extend: (seconds: number) => Promise<void>;  // used by Story 1.7
      stop: () => Promise<void>;
    }
    ```
  - [ ] **start:** Create RunSession via `createSession()`, set step[0] to running, start display interval
  - [ ] **pause:** Record `pausedAt` timestamp, clear interval
  - [ ] **resume:** Adjust `startedAt` by pause duration, clear `pausedAt`, restart interval:
    ```
    pauseDuration = Date.now() - session.pausedAt
    currentStep.startedAt += pauseDuration
    ```
  - [ ] **skip:** Mark current step `skipped`, set `completedAt`, advance index, start next step
  - [ ] **auto-advance:** When `elapsedTime >= plannedDuration`, mark step `completed`, advance to next
  - [ ] **stop:** Mark session `completed`, mark current step `completed`, clear interval
  - [ ] **Completion:** When last step finishes (auto-advance or skip), set session status `completed`
  - [ ] Display interval: `setInterval(1000)` recalculates from timestamps each tick
  - [ ] Clean up interval on unmount

- [ ] **Task 2: Create PlaybackControls component** (AC: 25, 26, 29)
  - [ ] Create `src/components/session/playback-controls.tsx` (`'use client'`)
  - [ ] Props: engine actions (`pause`, `resume`, `skip`, `stop`, `extend`) + state (`isRunning`, `isPaused`)
  - [ ] Buttons:
    - Pause/Resume toggle (single button, icon changes)
    - Skip (forward icon)
    - Stop (square icon, secondary/destructive)
    - +1 min, +5 min (exposed but wired in Story 1.7)
  - [ ] Style with shadcn `Button` + Deep Forest theme
  - [ ] Disable buttons when not applicable (e.g., skip disabled on last step if completed)

- [ ] **Task 3: Create RunningTimer component** (AC: 24, extra-5)
  - [ ] Create `src/components/session/running-timer.tsx` (`'use client'`)
  - [ ] Fetches session data and passes to `useTimerEngine`
  - [ ] Display layout:
    - Current step name (large, prominent)
    - Elapsed time display (formatted via `formatDuration`)
    - Planned duration for comparison
    - Step list sidebar/section: all steps with status icons (✓ completed, ▶ running, ○ pending, ⊘ skipped)
    - `PlaybackControls` at bottom
  - [ ] Handle session completion: navigate to `/app` (completion view added in Epic 2)

- [ ] **Task 4: Create session page** (AC: 23)
  - [ ] Create `src/app/app/sessions/[sessionId]/page.tsx` (`'use client'`)
  - [ ] Read `sessionId` from route params
  - [ ] Render `RunningTimer` with `sessionId`
  - [ ] Loading state while session loads

- [ ] **Task 5: Wire Play button in TimerCard** (AC: 23)
  - [ ] Update `TimerCard` and `TimerLibrary` to handle Play action:
    - Call `createSession(userId, template)` from `lib/firebase/sessions.ts`
    - On success: `router.push(/app/sessions/${session.id})`
    - Update timer's `lastUsedAt` via `updateTimer()`
  - [ ] Show loading indicator on play button during session creation

- [ ] **Task 6: Write useTimerEngine tests** (AC: 23-29, extra-1, extra-4)
  - [ ] Create `src/hooks/use-timer-engine.test.ts` with comprehensive state machine tests:
    1. Start → step 0 running, elapsed counts up
    2. Pause → elapsed freezes; Resume → elapsed continues correctly
    3. Skip → step marked skipped, next step starts
    4. Auto-advance → elapsed reaches planned → next step starts
    5. Last step completes → session completed
    6. Stop → session completed (early)
    7. Multiple pause/resume cycles → no drift
    8. Edge case: single-step timer
  - [ ] Mock Firestore calls and `Date.now()` for deterministic tests

- [ ] **Task 7: Write component tests** (AC: 24, 25, 26)
  - [ ] Create `src/components/session/playback-controls.test.tsx` — button states, click handlers
  - [ ] Create `src/components/session/running-timer.test.tsx` — renders step info, controls
  - [ ] Verify all tests pass: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **Timestamp-based timing (ADR-3):** NEVER count ticks. Always calculate elapsed = `Date.now() - startedAt`. This is resilient to tab backgrounding, CPU throttling, and ensures no drift. [Source: docs/architecture.md#ADR-3]
- **Pause/resume math:** On pause, record `pausedAt`. On resume, shift `startedAt` forward by the pause duration. This way `Date.now() - startedAt` always gives correct elapsed. [Source: docs/tech-spec-epic-1.md#Pause-Resume-Timestamp-Math]
- **Immediate Firestore writes:** Every state transition writes to Firestore. This enables future cross-device sync (Epic 3) and prevents data loss. [Source: docs/tech-spec-epic-1.md#Reliability]
- **No real-time listener yet:** In Epic 1, session data is written but not listened to via `onSnapshot`. That comes in Epic 3 (Story 3.1). Read once on mount, then local state drives UI.
- **Session copies steps from template:** `createSession` copies the template's steps into the session. Template is never mutated during playback. [Source: docs/tech-spec-epic-1.md#Relationships]
- **Device ID:** Set `activeDeviceId` to a `crypto.randomUUID()` stored in `sessionStorage`. Single-device in Epic 1; sync uses it in Epic 3.

### State Machine Transitions

```
IDLE → start() → RUNNING (step 0)
RUNNING → pause() → PAUSED
PAUSED → resume() → RUNNING
RUNNING → skip() → RUNNING (next step) | COMPLETED (if last)
RUNNING → auto-advance → RUNNING (next step) | COMPLETED (if last)
RUNNING → stop() → COMPLETED
PAUSED → stop() → COMPLETED
```

### Elapsed Time Calculation

```typescript
// In the setInterval callback (every ~1000ms):
if (session.status === 'running' && currentStep.startedAt) {
  const elapsed = Math.floor((Date.now() - currentStep.startedAt.toMillis()) / 1000);
  setElapsedTime(elapsed);

  // Auto-advance check
  if (elapsed >= currentStep.plannedDuration) {
    advanceToNextStep();
  }
}
```

### References

- [Source: docs/tech-spec-epic-1.md#useTimerEngine-hook-interface] — Complete hook interface
- [Source: docs/tech-spec-epic-1.md#Timer-Playback-Flow] — Playback sequence diagram
- [Source: docs/tech-spec-epic-1.md#Pause-Resume-Timestamp-Math] — Pause/resume math
- [Source: docs/tech-spec-epic-1.md#AC23-AC29] — Acceptance criteria
- [Source: docs/tech-spec-epic-1.md#Test-Strategy] — Critical test scenarios for useTimerEngine
- [Source: docs/architecture.md#ADR-3] — Timestamp-based timing decision
- [Source: docs/epics.md#Story-1.6] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
