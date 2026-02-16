# Story 7.4: Deferred Step Resolution

Status: drafted

## Story

As a **user**,
I want to resolve deferred steps after all main steps complete,
So that I don't forget anything I put off.

## Acceptance Criteria

1. **AC1:** TTS announces: "All main steps done. You deferred [Step Name] earlier. Ready to do it now?"
2. **AC2:** Display shows deferred step name with "↩" prefix and original planned duration
3. **AC3:** Three actions available: "Start" (runs step normally), "Skip" (marks skipped), "Defer again" (re-appends)
4. **AC4:** If `pauseBetweenSteps` is on, each deferred step shows the manual advance prompt
5. **AC5:** After all deferred steps are resolved (started/skipped), the timer completes normally
6. **AC6:** Completion view notes deferred steps: "N steps deferred, M completed later, K skipped"
7. **AC7:** Deferred badge disappears once all deferred steps are resolved
8. **AC8:** If user defers a step again during resolution, it goes back to the end of the deferred queue

## Tasks / Subtasks

- [ ] **Task 1: Create `src/components/session/deferred-resolution.tsx`** (AC: 2, 3)
  - [ ] Props:
    ```typescript
    interface DeferredResolutionProps {
      stepName: string;
      plannedDuration: number; // seconds
      onStart: () => void;
      onSkip: () => void;
      onDeferAgain: () => void;
    }
    ```
  - [ ] Display: "↩ [Step Name]" heading, planned duration below in `--muted` text
  - [ ] Three buttons:
    - "▶ Start" — primary, full-width
    - "⏭ Skip" — ghost, secondary
    - "↩ Defer again" — ghost, secondary
  - [ ] Start button auto-focused on mount
  - [ ] ARIA: `role="region"` with `aria-label="Deferred step resolution"`
  - [ ] `'use client'` directive

- [ ] **Task 2: Modify `use-timer-engine.ts` — deferred step processing loop** (AC: 1, 4, 5, 7, 8)
  - [ ] Add new state: `isResolvingDeferred: boolean` (default `false`)
  - [ ] Add new state: `currentDeferredStep: SessionStep | null`
  - [ ] In step-advance logic, after last main step completes:
    - Check if `session.deferredSteps` has entries
    - If yes:
      - Set `isResolvingDeferred: true`
      - Pop first step ID from `deferredSteps`
      - Find that step in `session.steps` array
      - Set `currentDeferredStep` to that step
      - Reset step status to `'pending'`
      - If `pauseBetweenSteps`: enter `waiting-for-advance`
      - If not: start step automatically
    - If no: complete timer normally
  - [ ] Add method: `startDeferredStep(): Promise<void>`
    - Set step status to `'running'`, start tick
    - Clear `currentDeferredStep`
    - Set `isResolvingDeferred: false` during run (the step is now active)
    - When this step completes → check if more deferred steps → loop
  - [ ] Add method: `skipDeferredStep(): Promise<void>`
    - Set step status to `'skipped'`
    - Check if more deferred steps → present next or complete
  - [ ] Add method: `deferAgain(): Promise<void>`
    - Re-append step ID to `deferredSteps` (goes to end of queue)
    - Present next deferred step (or complete if none remain — but this can't happen if we just re-deferred)
    - Edge case: if this was the only deferred step and user defers again → present it again immediately
  - [ ] Export: `isResolvingDeferred`, `currentDeferredStep`, `startDeferredStep`, `skipDeferredStep`, `deferAgain`

- [ ] **Task 3: Modify `running-timer.tsx` — deferred resolution display** (AC: 1, 2, 4)
  - [ ] Import `DeferredResolution`
  - [ ] When `engine.isResolvingDeferred && engine.currentDeferredStep`:
    - Render `DeferredResolution` component instead of normal playback UI
    - TTS: "All main steps done. You deferred [Step Name] earlier. Ready to do it now?"
    - Pass `onStart`, `onSkip`, `onDeferAgain` from engine methods
  - [ ] When deferred step is running (after user taps Start): show normal playback UI
  - [ ] When deferred step completes: check for more → show next deferred or complete

- [ ] **Task 4: Modify `completion-view.tsx` — deferred step summary** (AC: 6)
  - [ ] In `calculateCompletionStats()`, add:
    - `deferredCount`: number of steps that were deferred at any point
    - `deferredCompleted`: deferred steps that were eventually completed
    - `deferredSkipped`: deferred steps that were skipped during resolution
  - [ ] Calculate from `session.steps`: count steps where original status went through `'deferred'`
    - A step that was deferred and then completed: status is `'completed'` but its ID appears in deferred history
    - A step that was deferred and skipped: status is `'skipped'` and ID was in `deferredSteps`
  - [ ] Display in completion stats: "N steps deferred, M completed later, K skipped" (only if N > 0)
  - [ ] Subtle styling — `--muted` color, small text below existing stats

- [ ] **Task 5: Verify deferred badge integration** (AC: 7)
  - [ ] Verify: `DeferredBadge` count decreases as deferred steps are resolved
  - [ ] Verify: badge shows 0 / disappears when all deferred steps are resolved
  - [ ] Badge should track `session.deferredSteps.length` (the queue, not historical deferrals)

- [ ] **Task 6: Write tests** (AC: 1, 3, 5, 6, 8)
  - [ ] Test `DeferredResolution`: renders step name, planned duration, three buttons
  - [ ] Test `DeferredResolution`: Start, Skip, DeferAgain fire correct callbacks
  - [ ] Test `useTimerEngine`: after last main step, enters deferred resolution with first deferred step
  - [ ] Test: `startDeferredStep` starts the deferred step normally
  - [ ] Test: `skipDeferredStep` skips and presents next deferred step (or completes)
  - [ ] Test: `deferAgain` re-appends step, presents next (or re-presents same if only one)
  - [ ] Test: all deferred steps resolved → timer completes normally
  - [ ] Test: completion view shows deferred summary when steps were deferred
  - [ ] Test: completion view doesn't show deferred summary when no steps were deferred

## Dev Notes

### Architecture Patterns & Constraints

- **State machine:** Deferred resolution is an extension of the existing `use-timer-engine.ts` state machine. [Source: docs/architecture-v2.md#Deferred-Step-Processing]
- **Component files:** One per file, named export. [Source: docs/architecture.md#Code-Organization]
- **Error message tone:** Deferred messaging should be warm and non-judgmental. "You deferred [Name] earlier" — not "You skipped" or "You failed to complete." [Source: docs/architecture.md#Error-Handling]

### State Machine — Deferred Step Processing

From `docs/architecture-v2.md`:

```
[Current step index advances past last non-deferred step]
  → deferredSteps array empty?
    → YES: Timer completes normally
    → NO:
      → Pop first deferred step ID from array
      → Set that step status back to 'pending'
      → Set currentStepIndex to that step's position
      → TTS: "All main steps done. You deferred [Name]. Ready?"
      → If pauseBetweenSteps: show waiting-for-advance
      → If not: start step automatically
      → User can: Run, Skip, or Defer again (re-append to array)
```

### Existing `CompletionView` Stats

```typescript
interface CompletionStats {
  totalTime: number;
  plannedTime: number;
  stepsCompleted: number;
  stepsSkipped: number;
  totalSteps: number;
}
```

Add: `deferredCount`, `deferredCompleted`, `deferredSkipped` — all derived from session data.

### Tracking Deferred History

The `deferredSteps` array on the session is a **live queue** (steps waiting to be resolved). To calculate completion stats, we need to know which steps were ever deferred. Two approaches:

1. **Check step status flow:** A step that was deferred and then completed will have `status: 'completed'` but its ID will have appeared in `deferredSteps` at some point. Since we only have the final state, we need a separate history.
2. **Add `wasDeferred?: boolean` flag to SessionStep:** Simplest approach. Set to `true` when a step is first deferred. Never unset. This lets the completion view count deferred steps easily.

Recommend approach 2 — add `wasDeferred?: boolean` to `SessionStep`. This is a minor addition to the schema (already optional, zero migration). Add it in the `defer()` method of the engine.

### Edge Cases

- **All deferred steps skipped:** Timer completes with all deferred steps in `'skipped'` state.
- **Re-deferral of only remaining step:** The step re-appends to the queue. Since it's the only one, it gets presented again immediately. User can then Start, Skip, or Defer again (infinite loop protection: none needed — user is in control).
- **Defer during deferred resolution:** The "Defer again" option handles this. The step goes to the end of the queue. If it was the only one, it comes back.
- **Interaction with `pauseBetweenSteps`:** When resolving deferred steps with manual advance on, each deferred step gets the waiting-for-advance prompt before starting.

### References

- [Source: docs/architecture-v2.md#Deferred-Step-Processing] — Full deferred step processing flow
- [Source: docs/architecture-v2.md#State-Machine-Evolution] — `deferred` status, re-queueing
- [Source: docs/architecture-v2.md#Project-Structure] — `deferred-resolution.tsx` in session components
- [Source: docs/PRD-v2.md#FR16.3–FR16.5] — Deferred step resolution requirements
- [Source: docs/ux-design-specification-v2.md] — Deferred resolution UX (↩ prefix, three-action prompt)

---

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
