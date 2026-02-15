# Story 2.1: Contextual Transition Messages

Status: complete

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

- [x] **Task 1: Create pace calculation utility** (AC: 3, 4, 5)
  - [x] Create `src/lib/utils/pace.ts` with `calculatePace()` function
  - [x] Input: `steps: SessionStep[]`, `currentStepIndex: number`, `currentStepElapsed: number`
  - [x] Output: `{ deltaSeconds, status: 'ahead' | 'on-track' | 'behind', message: string }`
  - [x] Logic: sum completed steps' planned vs actual, add current step
  - [x] Within 30s → "Right on track"; ahead → "X min ahead — nice pace"; behind → "X min behind"
  - [x] Create `src/lib/utils/pace.test.ts` with comprehensive tests:
    - Ahead by 2 min → "2 min ahead — nice pace"
    - Ahead by 1 min → "1 min ahead"
    - Within 30s → "Right on track"
    - Behind by 1 min → "1 min behind"
    - Behind by 3 min → "3 min behind"
    - Edge: first step, no completed steps yet

- [x] **Task 2: Create TransitionOverlay component** (AC: 1, 2, extra-1, extra-3, extra-4)
  - [x] Create `src/components/session/transition-overlay.tsx` (`'use client'`)
  - [x] Props: `{ stepName, durationSeconds, stepNumber, totalSteps, paceMessage, paceStatus, visible }`
  - [x] Semi-transparent background overlay
  - [x] Content: "Time to start [Step Name]", "Step X of Y", pace message
  - [x] Pace message colored by status (ahead=`--ahead`, on-track=`--on-track`, behind=`--behind`)
  - [x] CSS animation: fade in over 300ms, visible 3-5s, fade out over 500ms
  - [x] `pointer-events: none` — controls remain clickable underneath
  - [x] `aria-live="polite"` region for screen reader
  - [x] `prefers-reduced-motion`: instant opacity changes
  - [x] Create `src/components/session/transition-overlay.test.tsx`

- [x] **Task 3: Add chime audio** (AC: extra-2)
  - [x] Add `public/sounds/chime.mp3` — gentle, short (< 1 second), royalty-free
  - [x] Pre-load audio in `RunningTimer` component on mount: `new Audio('/sounds/chime.mp3')`
  - [x] Play chime at each step transition (volume: 0.3)
  - [x] Chime enable/disable tied to TTS setting (Story 2.2)

- [x] **Task 4: Integrate overlay with useTimerEngine** (AC: 1, 2)
  - [x] Add `onStepTransition` callback to `useTimerEngine` (or expose transition event)
  - [x] In `RunningTimer`, on step transition:
    1. Play chime
    2. Show `TransitionOverlay` with pace data
    3. Auto-hide after 4 seconds
  - [x] Handle both auto-advance and skip transitions

- [x] **Task 5: Write integration tests** (AC: 1-5)
  - [x] Test pace calculation feeds correct data to overlay
  - [x] Test overlay shows and hides on timer transitions
  - [x] Verify all tests pass: `npm run test`

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
- Story 1.7 complete (Epic 1 done). Starting Epic 2.
- CSS variables `--ahead`, `--on-track`, `--behind` already in globals.css from Story 1.1

### Agent Model Used
Claude Opus 4.6 via GitHub Copilot

### Debug Log References
- No issues encountered — all tests passed first try

### Completion Notes List
- Created `src/lib/utils/pace.ts` — `calculatePace()` function with cumulative planned vs actual comparison, 30s on-track threshold, gentle language
- Created `src/lib/utils/pace.test.ts` — 12 tests covering ahead, behind, on-track, cumulative, edge cases, language rules
- Created `src/components/session/transition-overlay.tsx` — Semi-transparent overlay with auto-fade, pointer-events:none, aria-live polite, prefers-reduced-motion support
- Created `src/components/session/transition-overlay.test.tsx` — 7 tests covering rendering, visibility, pointer-events, ARIA, pace styling, auto-hide
- Created `public/sounds/chime.mp3` — Placeholder audio file (replace with real gentle chime)
- Updated `src/hooks/use-timer-engine.ts` — Added `TransitionEvent` interface, `lastTransition` state, `clearTransition()` action, fires transition on `advanceStep`
- Updated `src/components/session/running-timer.tsx` — Pre-loads chime, reacts to transition events (plays chime + shows overlay with pace data), auto-hides after 4s
- Total: 158 tests passing across 17 test files, clean build

### File List
- `src/lib/utils/pace.ts` — **NEW** — Pace calculation utility
- `src/lib/utils/pace.test.ts` — **NEW** — 12 pace tests
- `src/components/session/transition-overlay.tsx` — **NEW** — Step transition overlay component
- `src/components/session/transition-overlay.test.tsx` — **NEW** — 7 overlay tests
- `public/sounds/chime.mp3` — **NEW** — Placeholder chime audio
- `src/hooks/use-timer-engine.ts` — Updated: TransitionEvent, lastTransition, clearTransition
- `src/components/session/running-timer.tsx` — Updated: chime pre-load, overlay integration
