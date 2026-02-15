# Story 2.4: Timer Completion View

Status: ready-for-dev

## Story

As a **user**,
I want to see a warm summary when my timer finishes,
so that I feel a sense of completion and can see how it went.

## Acceptance Criteria

1. **AC16:** Completion view shows "Done!" with total actual time and a warm closing (e.g., ☕ emoji)
2. **AC17:** Shows total actual time vs total planned time, and counts of steps completed and skipped
3. **AC18:** Steps overrunning by > 1 minute listed with actual vs planned time
4. **AC19:** Ahead summary: understated language ("X minutes ahead — nice pace")
5. **AC20:** Behind summary: neutral language, no shame ("X minutes longer than planned")
6. **AC21:** "Done" or "Back to Library" button returns to timer library (`/app`)
7. **AC-extra-1:** Completion view replaces the running timer view when session status = `completed`
8. **AC-extra-2:** All steps shown with status indicators (✓ completed, ⊘ skipped)
9. **AC-extra-3:** Session data remains in Firestore (not deleted)
10. **AC-extra-4:** Full completion summary readable by screen reader

## Tasks / Subtasks

- [ ] **Task 1: Create CompletionView component** (AC: 16, 17, 18, 19, 20, 21, extra-2, extra-4)
  - [ ] Create `src/components/session/completion-view.tsx` (`'use client'`)
  - [ ] Props: `{ session: RunSession }`
  - [ ] Layout:
    - ☕ emoji + "Done!" heading
    - Total actual time (formatted) — large display
    - Pace summary: "[X] minutes ahead/behind/on time"
    - Total planned vs actual comparison
    - Steps completed / steps skipped counts
    - Step-by-step breakdown:
      - Each step: status icon (✓/⊘), name, actual time / planned time
      - Steps overrunning by > 60s: show "(+M:SS)" in `--behind` color
      - Skipped steps: "skipped" label in `--muted` color
    - "Done" button → `router.push('/app')`
  - [ ] Summary language:
    - Ahead: "X minutes ahead — nice pace"
    - On time (within 1 min): "Right on time"
    - Behind: "X minutes longer than planned" (never "X minutes late" or "behind schedule")
  - [ ] Style with Deep Forest theme, centered layout, shadcn `Card` for step list
  - [ ] ARIA: heading hierarchy, labeled lists, button accessible

- [ ] **Task 2: Calculate completion stats** (AC: 17, 18, 19, 20)
  - [ ] Create helper function (inline or in `pace.ts`):
    - `totalActualTime`: sum of all step `elapsedTime`
    - `totalPlannedTime`: sum of all step `originalPlannedDuration` (before extensions)
    - `stepsCompleted`: count where status = `completed`
    - `stepsSkipped`: count where status = `skipped`
    - `overrunSteps`: steps where `elapsedTime - originalPlannedDuration > 60`
    - `paceMessage`: ahead/behind/on-time summary

- [ ] **Task 3: Integrate with RunningTimer** (AC: extra-1)
  - [ ] In `RunningTimer`, when `session.status === 'completed'`:
    - Hide ring, controls, step dots
    - Render `CompletionView` instead
  - [ ] Wake Lock released (handled by Story 2.5)
  - [ ] TTS stops (no announcement on completion)

- [ ] **Task 4: Update timer engine completion flow** (AC: extra-1, extra-3)
  - [ ] Ensure `useTimerEngine` sets session status `completed` and `completedAt` timestamp
  - [ ] Session document remains in Firestore — do NOT delete on completion
  - [ ] Navigation from completion: user taps "Done" → `/app`

- [ ] **Task 5: Write tests** (AC: 16-21)
  - [ ] Create `src/components/session/completion-view.test.tsx`:
    - Renders "Done!" heading
    - Shows correct total time
    - Ahead: warm language
    - Behind: neutral language, no judgment
    - Overrun steps highlighted with (+M:SS)
    - Skipped steps shown correctly
    - "Done" button navigates to /app
  - [ ] Verify all tests pass: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **No judgment language:** Completion is a moment of celebration, not report card. "Longer than planned" not "behind". [Source: docs/ux-design-specification.md#Design-Principles]
- **Overrun threshold:** Only highlight steps where actual - planned > 60 seconds. Small overruns are normal and not worth calling out. [Source: docs/epics.md#Story-2.4-Technical-Notes]
- **Session data persists:** RunSession documents are never deleted. Enables future run history feature. [Source: docs/epics.md#Story-2.4-Technical-Notes]
- **originalPlannedDuration for stats:** Use `originalPlannedDuration` (before extensions) for "total planned" calculation, so extensions don't mask the original intent.

### References

- [Source: docs/tech-spec-epic-2.md#Completion-View-Design] — Layout and language spec
- [Source: docs/ux-design-specification.md#6.1-Completion-Summary-View] — Custom component spec
- [Source: docs/epics.md#Story-2.4] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
