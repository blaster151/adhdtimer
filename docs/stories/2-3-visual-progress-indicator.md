# Story 2.3: Visual Progress Indicator

Status: ready-for-dev

## Story

As a **user**,
I want to see clear visual progress for the current step and overall timer,
so that I can glance at the screen and instantly know where I am.

## Acceptance Criteria

1. **AC10:** Running timer shows concentric progress ring — outer ring = total timer progress, inner ring = current step progress
2. **AC11:** Current step name displayed large and prominent in ring center
3. **AC12:** Step list shows completed steps (with actual time), current step (highlighted), and upcoming steps
4. **AC13:** Overrun state: ring color shifts to warm amber (`--behind`), NO flash/pulse/alarm
5. **AC14:** Countdown mode: step shows remaining time counting down; overrun switches to "+X:XX over"
6. **AC15:** Overall progress indicator (outer ring) shows cumulative progress through all steps
7. **AC-extra-1:** Step dots below ring show position (filled=done, ring=current, dim=upcoming)
8. **AC-extra-2:** Ring colors shift by pace: ahead=`--ahead` teal, on-track=`--on-track` green, behind=`--behind` amber
9. **AC-extra-3:** Ring respects `prefers-reduced-motion` (instant snap, no smooth transitions)
10. **AC-extra-4:** SVG ring has dynamic `aria-label` with step, time, and pace info
11. **AC-extra-5:** Ring is responsive: 260px mobile, 280px tablet, 300px desktop

## Tasks / Subtasks

- [ ] **Task 1: Create ProgressRing component** (AC: 10, 11, 13, 15, extra-2, extra-3, extra-4, extra-5)
  - [ ] Create `src/components/session/progress-ring.tsx` (`'use client'`)
  - [ ] Props: `{ stepProgress, totalProgress, stepName, elapsedDisplay, paceMessage, paceStatus, isRunning, isPaused, countdownMode }`
  - [ ] SVG with viewBox "0 0 280 280":
    - Outer ring track (border color, 8px stroke)
    - Outer ring progress (pace-colored, `stroke-dashoffset` animated)
    - Inner ring track (border color, 10px stroke)
    - Inner ring progress (pace-colored, `stroke-dashoffset` animated)
    - Center text: step name (primary-soft), elapsed/remaining time (timer-time: 2.8rem, light weight), pace message (colored by status)
  - [ ] Progress calculation: `circumference = 2 * π * radius`, offset = `circumference * (1 - progress)`
  - [ ] Color mapping: ahead → `--ahead`, on-track → `--on-track`, behind → `--behind`
  - [ ] Overrun: inner ring stays at 100%, color = `--behind`
  - [ ] Paused: rings freeze, subtle "PAUSED" label below time
  - [ ] CSS transition: `stroke-dashoffset 1s linear` (disabled for reduced motion)
  - [ ] `will-change: stroke-dashoffset` for GPU acceleration
  - [ ] Responsive: use Tailwind responsive classes for ring container sizing
  - [ ] ARIA: `role="img"`, dynamic `aria-label`: "[Timer Name] progress: step X of Y, [Step Name], X minutes Y seconds elapsed, Z minutes ahead/behind"
  - [ ] Create `src/components/session/progress-ring.test.tsx`:
    - Renders SVG with correct structure
    - ARIA label includes step info
    - Color changes by pace status
    - Paused state shows label

- [ ] **Task 2: Create StepDots component** (AC: extra-1)
  - [ ] Create `src/components/session/step-dots.tsx` (`'use client'`)
  - [ ] Props: `{ steps: SessionStep[], currentIndex: number }`
  - [ ] Render horizontal row of dots:
    - Completed: filled circle (`--primary`)
    - Current: ring/outline (`--primary`, larger or glowing)
    - Upcoming: dim circle (`--muted`)
    - Skipped: filled with different indicator (`--muted` with line-through)
  - [ ] `role="list"`, `aria-label="Timer progress: step X of Y"`
  - [ ] Create `src/components/session/step-dots.test.tsx`

- [ ] **Task 3: Update RunningTimer with ring layout** (AC: 10, 11, 12)
  - [ ] Replace basic step name + elapsed display with full Zen Ring layout:
    - Timer name in header
    - `ProgressRing` centered
    - `StepDots` below ring
    - Step list (scrollable) below dots
    - `PlaybackControls` at bottom
  - [ ] Step list shows all steps with status indicators:
    - ✓ completed (with actual time)
    - ▶ running (highlighted, with live elapsed)
    - ○ pending
    - ⊘ skipped
  - [ ] Feed ring with `stepProgress`, `totalProgress`, pace data from `calculatePace()`
  - [ ] Feed ring with elapsed/countdown display from time utilities

- [ ] **Task 4: Add countdown display support** (AC: 14)
  - [ ] Update `src/lib/utils/time.ts`:
    - Add `formatCountdown(planned, elapsed)`: returns remaining time or "+M:SS over" if overrun
  - [ ] In ring: if `countdownMode`, show countdown; if overrun, show "+X:XX over" in `--behind` color
  - [ ] Update `src/lib/utils/time.test.ts` with countdown test cases

- [ ] **Task 5: Write comprehensive tests** (AC: 10-15)
  - [ ] All component tests pass
  - [ ] Ring renders at different progress levels
  - [ ] Countdown display works correctly including overrun
  - [ ] Verify: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **Zen Ring is the hero:** The ring is the visual centerpiece and primary focal point. Everything else is secondary. [Source: docs/ux-design-specification.md#4.1-Zen-Ring]
- **SVG `stroke-dashoffset`:** This is the simplest approach for ring animation. GPU-accelerated via `will-change`. [Source: docs/architecture.md#Performance-Considerations]
- **No countdown toggle UI in this story:** The display logic for countdown mode is implemented here, but the toggle switch on the timer form is Story 4.3. Timer's `countdownMode` field defaults to `false`. [Source: docs/epics.md#Story-4.3]
- **Ring is NOT interactive:** Purely visual feedback. Controls are separate buttons below. [Source: docs/ux-design-specification.md#4.1-Interaction-Patterns]

### Ring Math Reference

```typescript
const CIRCUMFERENCE = 2 * Math.PI * radius;
const offset = CIRCUMFERENCE * (1 - progress);
// SVG: stroke-dasharray={CIRCUMFERENCE} stroke-dashoffset={offset}
// rotate(-90) to start from top
```

### References

- [Source: docs/tech-spec-epic-2.md#Concentric-Progress-Ring-Design] — Full SVG structure and sizing
- [Source: docs/ux-design-specification.md#2.2-The-Guided-Execution-Ring] — Ring design rationale
- [Source: docs/ux-design-specification.md#6.1-Concentric-Progress-Ring] — Component spec with states
- [Source: docs/epics.md#Story-2.3] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
