# Story 7.2: Manual Advance Playback

Status: drafted

## Story

As a **user**,
I want the timer to pause between steps when "pause between steps" is enabled, showing a "Start next step" button,
So that I control my own pace.

## Acceptance Criteria

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

## Tasks / Subtasks

- [ ] **Task 1: Create `src/components/session/manual-advance-button.tsx`** (AC: 5, 6, 8, 14)
  - [ ] Props: `nextStepName: string`, `onStart: () => void`, `onSkip: () => void`, `onStop: () => void`
  - [ ] Full-width primary button: "▶ Start [nextStepName]"
  - [ ] Auto-focus on mount using `useRef` + `useEffect` (or `autoFocus` prop)
  - [ ] Below the primary button: two ghost buttons — "⏭ Skip" and "⏹ Stop"
  - [ ] ARIA live region or announcement: "Step complete. Next step: [Name]. Activate Start button to begin."
  - [ ] `'use client'` directive at top

- [ ] **Task 2: Modify `use-timer-engine.ts` — add `waiting-for-advance` state** (AC: 1, 7, 9, 11, 12)
  - [ ] Copy `pauseBetweenSteps` from template to session on `start()`:
    ```typescript
    const newSession: RunSession = {
      ...existingFields,
      pauseBetweenSteps: template.pauseBetweenSteps ?? false,
    };
    ```
  - [ ] Add new state: `isWaitingForAdvance: boolean` (default `false`)
  - [ ] In `advanceToNextStep()` (or equivalent step-completion logic):
    - After marking current step completed:
    - If `session.pauseBetweenSteps === true`:
      - Check next step type:
        - If `type === 'checkpoint'`: process Checkpoint normally (instant), THEN check the step AFTER that
        - If `type === 'wait'`: start Wait step automatically (wait IS the action), when Wait completes → enter `waiting-for-advance`
        - Otherwise (Active or undefined): enter `waiting-for-advance`
      - Enter `waiting-for-advance`:
        - Set `session.status = 'waiting-for-advance'`
        - Stop the tick interval (time NOT counting)
        - Set `isWaitingForAdvance: true`
    - If `pauseBetweenSteps === false`: auto-advance as v1 (no change)
  - [ ] Add new method: `advanceFromWaiting(): Promise<void>`
    - Sets `isWaitingForAdvance: false`
    - Sets `session.status = 'running'`
    - Starts the next step
    - Resumes tick interval
  - [ ] Add `skipFromWaiting(): Promise<void>` — skip the pending next step, check if another step follows
  - [ ] Export `isWaitingForAdvance` and `advanceFromWaiting` / `skipFromWaiting` from the hook return

- [ ] **Task 3: Modify `running-timer.tsx` — render ManualAdvanceButton** (AC: 2, 3, 4, 10, 13)
  - [ ] Import `ManualAdvanceButton`
  - [ ] When `engine.isWaitingForAdvance === true`:
    - Render `ManualAdvanceButton` instead of normal playback controls + center content
    - Keep ProgressRing visible but frozen (outer ring holds current total progress, inner ring empty/zero)
    - Center text: "Next: [Step Name]"
    - Play chime (same as v1 step transition)
    - TTS: "Done. Next up: [Step Name]. Tap when ready."
  - [ ] Wake lock: ensure it remains active during `waiting-for-advance` (already managed by `useWakeLock` based on session existence — verify it doesn't release)
  - [ ] Firestore sync: `waiting-for-advance` status already syncs via `useFirestoreSession` (it writes session status — just verify it handles the new value)

- [ ] **Task 4: Modify `playback-controls.tsx` — hide during `waiting-for-advance`** (AC: 8)
  - [ ] Add optional prop: `isWaitingForAdvance?: boolean`
  - [ ] When `isWaitingForAdvance === true`: return `null` (hide normal controls)
  - [ ] Alternative: the parent (`running-timer.tsx`) simply doesn't render `PlaybackControls` when waiting — check which is cleaner

- [ ] **Task 5: Write tests** (AC: 1, 5, 7, 9, 11, 12)
  - [ ] Test `ManualAdvanceButton`: renders with step name, fires onStart/onSkip/onStop
  - [ ] Test `ManualAdvanceButton`: button has auto-focus
  - [ ] Test `useTimerEngine`: entering `waiting-for-advance` when `pauseBetweenSteps` is true
  - [ ] Test: time does NOT tick during `waiting-for-advance`
  - [ ] Test: `advanceFromWaiting` resumes running state
  - [ ] Test: Wait step auto-advances, THEN enters `waiting-for-advance` for the following step
  - [ ] Test: Checkpoint processes instantly, THEN enters `waiting-for-advance` for the following step
  - [ ] Test: `waiting-for-advance` does NOT trigger for last step (timer completes instead)

## Dev Notes

### Architecture Patterns & Constraints

- **State machine source of truth:** `use-timer-engine.ts` is the single source of truth for session state. [Source: docs/architecture-v2.md#State-Machine-Evolution]
- **Hooks:** One hook per file, named export. [Source: docs/architecture.md#Code-Organization]
- **Component files:** One component per file, named export. [Source: docs/architecture.md#Code-Organization]
- **Firestore sync:** `useFirestoreSession` writes session changes to Firestore. The `waiting-for-advance` status should be written so other devices can see it. [Source: docs/architecture-v2.md#State-Transitions]

### State Machine — Waiting-for-Advance

From `docs/architecture-v2.md`:

```
[Step N completes]
  → pauseBetweenSteps?
    → YES:
      → Is next step a Checkpoint?
        → YES: Display Checkpoint → then waiting-for-advance for step AFTER Checkpoint
        → NO:
          → Is next step a Wait?
            → YES: Start Wait auto-advance → after Wait completes → waiting-for-advance
            → NO: Enter waiting-for-advance
    → NO: Auto-advance as v1
```

### Existing `UseTimerEngineReturn` Interface

```typescript
export interface UseTimerEngineReturn {
  session: RunSession | null;
  currentStep: SessionStep | null;
  currentStepIndex: number;
  elapsedTime: number;
  totalElapsedTime: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  lastTransition: TransitionEvent | null;
  clearTransition: () => void;
  start: (template: TimerTemplate) => Promise<void>;
  startFromSession: (existingSession: RunSession) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skip: () => Promise<void>;
  extend: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
  updateFromSnapshot: (snapshot: RunSession) => void;
}
```

Add to return: `isWaitingForAdvance`, `advanceFromWaiting`, `skipFromWaiting`, `nextStepName` (for display).

### Existing `PlaybackControlsProps`

```typescript
interface PlaybackControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isLastStep: boolean;
  disabled?: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
  onExtend?: (seconds: number) => void;
}
```

### Wake Lock Consideration

The `useWakeLock` hook in `running-timer.tsx` likely acquires the lock when a session exists and releases on unmount or completion. Verify that `waiting-for-advance` doesn't trigger release — the session still exists (not completed), so the lock should stay active.

### References

- [Source: docs/architecture-v2.md#State-Machine-Evolution] — `waiting-for-advance` state transitions
- [Source: docs/architecture-v2.md#Waiting-for-Advance-Behavior] — Full decision tree
- [Source: docs/architecture-v2.md#Project-Structure] — `manual-advance-button.tsx` in session components
- [Source: docs/PRD-v2.md#FR15.1–FR15.5] — Pause-between-steps functional requirements
- [Source: docs/ux-design-specification-v2.md] — Manual advance UX (frozen rings, "Next:" center text)

---

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
