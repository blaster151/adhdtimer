# Story 7.3: Defer Step — Action & Tracking

Status: drafted

## Story

As a **user**,
I want to defer the current step to later during a running timer,
So that I can skip something temporarily without losing it.

## Acceptance Criteria

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

## Tasks / Subtasks

- [ ] **Task 1: Add `--deferred` CSS custom property** (AC: 4)
  - [ ] Add `--deferred: #8A8474;` to `:root` in `src/app/globals.css`
  - [ ] Note: same value as `--muted` — a semantic alias for deferred-context usage

- [ ] **Task 2: Create `src/components/session/defer-button.tsx`** (AC: 1, 8)
  - [ ] Props: `onDefer: () => void`, `disabled?: boolean`
  - [ ] Ghost button: "↩ Defer" in `--muted` text color
  - [ ] `aria-label="Defer step"`
  - [ ] Compact size to fit alongside existing Pause/Skip/Extend row
  - [ ] `'use client'` directive

- [ ] **Task 3: Create `src/components/session/deferred-badge.tsx`** (AC: 4, 5)
  - [ ] Props: `count: number`
  - [ ] Renders: small pill above step dots — "{count} deferred ↩"
  - [ ] Uses `--deferred` color for text
  - [ ] If `count === 0`: returns `null` (hidden)
  - [ ] `'use client'` directive

- [ ] **Task 4: Modify `use-timer-engine.ts` — add defer logic** (AC: 2, 3, 7, 9, 10)
  - [ ] Add new method: `defer(): Promise<void>`
    - Mark current step status as `'deferred'`
    - Append current step ID to `session.deferredSteps` array (initialize if undefined)
    - Advance `currentStepIndex` to the next non-deferred step
    - If `pauseBetweenSteps`: enter `waiting-for-advance` for the next step
    - If not: start next step immediately
    - Sync to Firestore immediately
  - [ ] Handle edge case: all remaining steps are deferred → trigger deferred resolution (Story 7.4)
  - [ ] Export `defer` method and `deferredCount` (derived from `session.deferredSteps?.length ?? 0`) from hook return
  - [ ] Do NOT trigger TTS for deferrals (silent action)

- [ ] **Task 5: Modify `playback-controls.tsx` — add Defer button** (AC: 1, 8)
  - [ ] Add prop: `onDefer?: () => void`, `currentStepType?: StepType`
  - [ ] Render `DeferButton` alongside existing extension buttons row
  - [ ] When `currentStepType === 'checkpoint'`: hide/disable Defer button
  - [ ] When `onDefer` is not provided: don't render Defer button (backward compat with non-defer contexts)

- [ ] **Task 6: Modify `step-dots.tsx` — deferred dot styling** (AC: 6)
  - [ ] When step `status === 'deferred'`: apply dimmed opacity + strikethrough effect
  - [ ] CSS: `opacity-40` and a small line-through decoration (or CSS `text-decoration: line-through` on the dot wrapper)
  - [ ] Deferred dots use `--deferred` color instead of type-based color

- [ ] **Task 7: Modify `running-timer.tsx` — integrate defer & badge** (AC: 4, 5, 11)
  - [ ] Import `DeferredBadge`
  - [ ] Render `DeferredBadge` above `StepDots` when `engine.deferredCount > 0`
  - [ ] Pass `engine.defer` to `PlaybackControls` as `onDefer` prop
  - [ ] Pass current step type to `PlaybackControls` for Checkpoint disabling

- [ ] **Task 8: Write tests** (AC: 2, 3, 4, 7, 8, 9)
  - [ ] Test `DeferButton`: renders, fires onDefer, disabled when told
  - [ ] Test `DeferredBadge`: renders count, hidden when 0
  - [ ] Test `useTimerEngine.defer()`: marks step deferred, appends to `deferredSteps`, advances index
  - [ ] Test: defer during running → next step starts immediately
  - [ ] Test: defer same step twice in one session (re-deferred during resolution)
  - [ ] Test: Checkpoint step → defer button is disabled
  - [ ] Test: deferred dots show dimmed styling

## Dev Notes

### Architecture Patterns & Constraints

- **Component files:** One per file, named export. [Source: docs/architecture.md#Code-Organization]
- **State machine:** All defer logic lives in `use-timer-engine.ts`. [Source: docs/architecture-v2.md#State-Machine-Evolution]
- **Firestore sync:** Deferred state syncs immediately via the existing session update pattern. [Source: docs/architecture.md#Error-Handling]
- **Silent action:** Deferrals do NOT trigger TTS. This is intentional — the user chose to defer; no need for narration. [Source: docs/epics-v2.md Story 7.3 AC11]

### State Machine — Defer

From `docs/architecture-v2.md`:

```
Step: running → (user taps Defer) → deferred
  → Step ID appended to session.deferredSteps[]
  → currentStepIndex advances to next non-deferred step
  → If all remaining steps are deferred → begin deferred resolution (Story 7.4)
```

### Existing `PlaybackControls` Layout

Current layout has two rows:
1. **Primary controls:** Pause/Resume, Skip, Stop
2. **Extension buttons:** +1 min, +5 min

Defer button should go in the extension buttons row (row 2), or as a new row between them. Keep it visually secondary (ghost variant) to avoid competing with primary Pause/Skip.

### Interaction with `waiting-for-advance`

If `pauseBetweenSteps` is true and the user defers a step:
1. Step is marked deferred
2. Next step is determined
3. Engine enters `waiting-for-advance` for the next step (if applicable)

Defer during `waiting-for-advance` doesn't make sense (the pending step hasn't started yet). The Defer button should only be visible during `running` state.

### References

- [Source: docs/architecture-v2.md#Deferred-Step-Processing] — Full defer + resolution flow
- [Source: docs/architecture-v2.md#State-Machine-Evolution] — `deferred` step status
- [Source: docs/architecture-v2.md#Project-Structure] — `defer-button.tsx`, `deferred-badge.tsx`
- [Source: docs/PRD-v2.md#FR16.1–FR16.5] — Defer Step functional requirements
- [Source: docs/ux-design-specification-v2.md] — Defer UX (ghost button, badge, dimmed dots)

---

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
