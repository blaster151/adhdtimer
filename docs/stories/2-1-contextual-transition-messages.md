# Story 2.1: Contextual Transition Messages

Status: ready-for-dev

## Story

As a **user**,
I want to see a brief contextual message at each step transition telling me what's next and how I'm pacing,
so that I feel oriented and reassured at every transition.

## Acceptance Criteria

1. **AC1:** On step transition (auto-advance or skip), an overlay shows "Time to start [Step Name]", "Step X of Y", and a pace message
2. **AC2:** Overlay auto-fades after 3-5 seconds
3. **AC3:** Pace message uses calm language when ahead (e.g., "2 min ahead — nice pace")
4. **AC4:** Pace message uses gentle, factual language when behind (e.g., "3 min behind") — no alarms, no shame
5. **AC5:** Pace shows "Right on track" when cumulative elapsed is within 30 seconds of cumulative planned
6. **AC-extra-1:** Overlay does NOT block playback controls (`pointer-events: none`)
7. **AC-extra-2:** A gentle chime plays before the transition message (pre-loaded `Audio`)
8. **AC-extra-3:** Overlay respects `prefers-reduced-motion` (instant appear/disappear instead of fade)
9. **AC-extra-4:** Overlay content announced via `aria-live="polite"` region

## Tasks / Subtasks

- [ ] **Task 1: Create pace calculation utility** (AC: 3, 4, 5)
  - [ ] Create `src/lib/utils/pace.ts` with `calculatePace()` function
  - [ ] Input: `steps: SessionStep[]`, `currentStepIndex: number`, `currentStepElapsed: number`
  - [ ] Output: `{ deltaSeconds, status: 'ahead' | 'on-track' | 'behind', message: string }`
  - [ ] Logic: sum completed steps' planned vs actual, add current step
  - [ ] Within 30s → "Right on track"; ahead → "X min ahead — nice pace"; behind → "X min behind"
  - [ ] Create `src/lib/utils/pace.test.ts` with comprehensive tests:
    - Ahead by 2 min → "2 min ahead — nice pace"
    - Ahead by 1 min → "1 min ahead"
    - Within 30s → "Right on track"
    - Behind by 1 min → "1 min behind"
    - Behind by 3 min → "3 min behind"
    - Edge: first step, no completed steps yet

- [ ] **Task 2: Create TransitionOverlay component** (AC: 1, 2, extra-1, extra-3, extra-4)
  - [ ] Create `src/components/session/transition-overlay.tsx` (`'use client'`)
  - [ ] Props: `{ stepName, durationSeconds, stepNumber, totalSteps, paceMessage, paceStatus, visible }`
  - [ ] Semi-transparent background overlay
  - [ ] Content: "Time to start [Step Name]", "Step X of Y", pace message
  - [ ] Pace message colored by status (ahead=`--ahead`, on-track=`--on-track`, behind=`--behind`)
  - [ ] CSS animation: fade in over 300ms, visible 3-5s, fade out over 500ms
  - [ ] `pointer-events: none` — controls remain clickable underneath
  - [ ] `aria-live="polite"` region for screen reader
  - [ ] `prefers-reduced-motion`: instant opacity changes
  - [ ] Create `src/components/session/transition-overlay.test.tsx`

- [ ] **Task 3: Add chime audio** (AC: extra-2)
  - [ ] Add `public/sounds/chime.mp3` — gentle, short (< 1 second), royalty-free
  - [ ] Pre-load audio in `RunningTimer` component on mount: `new Audio('/sounds/chime.mp3')`
  - [ ] Play chime at each step transition (volume: 0.3)
  - [ ] Chime enable/disable tied to TTS setting (Story 2.2)

- [ ] **Task 4: Integrate overlay with useTimerEngine** (AC: 1, 2)
  - [ ] Add `onStepTransition` callback to `useTimerEngine` (or expose transition event)
  - [ ] In `RunningTimer`, on step transition:
    1. Play chime
    2. Show `TransitionOverlay` with pace data
    3. Auto-hide after 4 seconds
  - [ ] Handle both auto-advance and skip transitions

- [ ] **Task 5: Write integration tests** (AC: 1-5)
  - [ ] Test pace calculation feeds correct data to overlay
  - [ ] Test overlay shows and hides on timer transitions
  - [ ] Verify all tests pass: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **Running timer is sacred space:** No toasts, no modals during timer. The overlay is the ONLY interruption allowed. [Source: docs/ux-design-specification.md#7.1]
- **Language tone is critical:** Transition messages are the "soul" of the product. Review FR6.3 in PRD for language guidelines. [Source: docs/epics.md#Story-2.1-Technical-Notes]
- **No judgment on behind status:** "3 min behind" is factual. Never use "warning", "late", "running over", exclamation marks, or red color. [Source: docs/ux-design-specification.md#Design-Principles]

### References

- [Source: docs/tech-spec-epic-2.md#Transition-Overlay-Design] — Overlay spec
- [Source: docs/tech-spec-epic-2.md#Pace-Calculation-Utility] — Pace calc implementation
- [Source: docs/ux-design-specification.md#6.1-Step-Transition-Overlay] — Custom component spec
- [Source: docs/epics.md#Story-2.1] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
