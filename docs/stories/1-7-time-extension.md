# Story 1.7: Time Extension ("I Need More Minutes")

Status: ready-for-dev

## Story

As a **user**,
I want to extend the current step's duration while it's running,
so that I can take more time without shame or friction.

## Acceptance Criteria

1. **AC30:** +1 min button adds 60 seconds to the current step's `plannedDuration` immediately
2. **AC31:** +5 min button adds 300 seconds to the current step's `plannedDuration` immediately
3. **AC32:** No confirmation dialog or judgment language is shown on extension — the button simply works
4. **AC33:** Extension updates the Firestore session document with the new `plannedDuration`
5. **AC-extra-1:** Display updates immediately to show the new planned duration
6. **AC-extra-2:** `originalPlannedDuration` remains unchanged (preserves the original plan for future analytics)
7. **AC-extra-3:** Extension works while paused (duration increases but timer stays paused)
8. **AC-extra-4:** Multiple extensions stack (e.g., pressing +1 min three times adds 3 minutes total)

## Tasks / Subtasks

- [ ] **Task 1: Implement extend action in useTimerEngine** (AC: 30, 31, 33, extra-1, extra-2, extra-3, extra-4)
  - [ ] Implement the `extend(seconds: number)` method in `useTimerEngine`:
    - Add `seconds` to `currentStep.plannedDuration`
    - Do NOT modify `currentStep.originalPlannedDuration`
    - Write updated session to Firestore via `updateSession()`
    - Update local state immediately (optimistic)
  - [ ] Works in both `running` and `paused` states
  - [ ] If step was about to auto-advance (elapsed ≈ planned), extension prevents the advance
  - [ ] Multiple calls stack correctly

- [ ] **Task 2: Wire extension buttons in PlaybackControls** (AC: 30, 31, 32)
  - [ ] Update `PlaybackControls` to call `extend(60)` on +1 min click and `extend(300)` on +5 min click
  - [ ] Buttons are always enabled during active session (running or paused)
  - [ ] No confirmation dialog — button press directly executes
  - [ ] No judgment language anywhere (no "running over", no warnings, no color change on extension)
  - [ ] Button labels: "+1" and "+5" (with "min" subtitle or similar)

- [ ] **Task 3: Update RunningTimer display** (AC: extra-1)
  - [ ] Ensure the planned duration display reflects the extended value
  - [ ] If displaying "elapsed / planned", the planned portion updates live
  - [ ] No visual indicator that the timer was extended (design principle: no shame)

- [ ] **Task 4: Write extend tests** (AC: 30, 31, 33, extra-2, extra-3, extra-4)
  - [ ] Add to `src/hooks/use-timer-engine.test.ts`:
    - Extend +60s → plannedDuration increases by 60
    - Extend +300s → plannedDuration increases by 300
    - originalPlannedDuration unchanged after extend
    - Extend while paused → duration increases, still paused
    - Multiple extends stack correctly
    - Extend prevents auto-advance when elapsed was at threshold
    - Firestore updateSession called with correct data
  - [ ] Verify all tests pass: `npm run test`

- [ ] **Task 5: Write component tests** (AC: 30, 31, 32)
  - [ ] Update `src/components/session/playback-controls.test.tsx`:
    - +1 min button calls extend(60)
    - +5 min button calls extend(300)
    - No confirmation dialog rendered on click
  - [ ] Verify all tests pass

## Dev Notes

### Architecture Patterns & Constraints

- **No judgment language:** This is a core design principle. Extension buttons work silently. No warnings, no color changes, no "over time" indicators. The user is taking the time they need. [Source: docs/ux-design-specification.md#Design-Principles]
- **originalPlannedDuration preserved:** The `SessionStep.originalPlannedDuration` field stores the duration before any extensions. `plannedDuration` reflects the current (possibly extended) value. This is important for future analytics/completion views in Epic 2. [Source: docs/tech-spec-epic-1.md#Data-Models]
- **Immediate Firestore write:** Extension triggers `updateSession()` to persist immediately. [Source: docs/tech-spec-epic-1.md#Reliability]
- **Timestamp-based engine unaffected:** Extension only changes the target duration, not the elapsed calculation. `startedAt` is untouched. [Source: docs/architecture.md#ADR-3]

### Extension Math

```typescript
// In useTimerEngine.extend():
const extend = async (seconds: number) => {
  const updatedSteps = [...session.steps];
  updatedSteps[currentStepIndex] = {
    ...updatedSteps[currentStepIndex],
    plannedDuration: updatedSteps[currentStepIndex].plannedDuration + seconds,
    // originalPlannedDuration stays the same
  };

  // Update local state immediately
  setSession(prev => ({ ...prev, steps: updatedSteps }));

  // Persist to Firestore
  await updateSession(userId, session.id, { steps: updatedSteps });
};
```

### UX Design Notes

- Extension buttons should be clearly visible but not the primary action (Pause/Resume is primary)
- Placement: alongside other playback controls, perhaps in a secondary row
- Per UX spec: "+1" and "+5" with subtle "min" labels
- When pace messaging is added in Epic 2, it will use the *updated* plannedDuration for pace calculation

### References

- [Source: docs/tech-spec-epic-1.md#useTimerEngine-hook-interface] — extend method in hook interface
- [Source: docs/tech-spec-epic-1.md#AC30-AC33] — Acceptance criteria
- [Source: docs/ux-design-specification.md#Design-Principles] — No judgment, no shame
- [Source: docs/epics.md#Story-1.7] — Original epic story definition
- [Source: docs/epics.md#Story-1.7-Technical-Notes] — Extension implementation notes

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
