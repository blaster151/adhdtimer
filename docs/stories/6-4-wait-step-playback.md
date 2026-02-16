# Story 6.4: Wait Step Playback

Status: complete

## Story

As a **user**,
I want Wait steps to look and feel different from Active steps during playback,
So that I know when I'm actively working vs. passively waiting.

## Acceptance Criteria

1. **AC1:** Inner progress ring uses `--wait` color (calm blue `#6B94B8`) instead of pace-based green/amber
2. **AC2:** Step name shows ⏳ icon prefix in the center display
3. **AC3:** Text below time shows "Waiting..." in `--muted` color
4. **AC4:** TTS announces: "[Step Name]. [Duration] minutes. Waiting."
5. **AC5:** Wait step auto-advances when planned duration elapses (same as Active auto-advance)
6. **AC6:** User can still Pause, Skip, and Extend a Wait step (same controls as Active)
7. **AC7:** Transition message from Wait to next step: "Done waiting. Next: [Step Name]."
8. **AC8:** Step dot for Wait step uses `--wait` tint (blue) instead of `--primary` green
9. **AC9:** Breathing animation on the ring runs at 2x slower speed for Wait steps (visual calm)
10. **AC10:** `prefers-reduced-motion` disables the breathing animation entirely

## Tasks / Subtasks

- [ ] **Task 1: Add `--wait` CSS custom property** (AC: 1, 8)
  - [ ] Add `--wait: #6B94B8;` to `:root` in `src/app/globals.css`
  - [ ] Note: `--info` already uses `#6B94B8` — `--wait` is a semantic alias for step-type context

- [ ] **Task 2: Update `progress-ring.tsx` for Wait step coloring** (AC: 1, 9, 10)
  - [ ] Add `stepType?: StepType` prop to `ProgressRingProps`
  - [ ] When `stepType === 'wait'`: override inner ring color to `var(--wait)` regardless of pace status
  - [ ] Add a subtle breathing animation (CSS `@keyframes` on opacity: `0.85 → 1.0 → 0.85`) to the inner ring SVG circle
  - [ ] Normal breathing speed: `animation-duration: 4s` — Active steps
  - [ ] Wait step breathing speed: `animation-duration: 8s` (2x slower)
  - [ ] Add `@media (prefers-reduced-motion: reduce)` to disable breathing animation
  - [ ] Active steps use existing pace-based coloring (no change)

- [ ] **Task 3: Update `step-dots.tsx` for Wait step coloring** (AC: 8)
  - [ ] Accept `steps` with `type` field (already available on `SessionStep` from Story 6.1)
  - [ ] When a step has `type === 'wait'`: use `bg-[var(--wait)]` instead of `bg-[var(--primary)]`
  - [ ] Active and undefined types: existing `--primary` green (no change)

- [ ] **Task 4: Update `running-timer.tsx` center display** (AC: 2, 3)
  - [ ] Access `currentStep.type` from the session's step array
  - [ ] When `type === 'wait'`: prefix step name with "⏳ " in center display
  - [ ] When `type === 'wait'`: show "Waiting..." text below the time in `--muted` color
  - [ ] Pass `stepType` prop to `ProgressRing`

- [ ] **Task 5: Update TTS announcement for Wait steps** (AC: 4)
  - [ ] In the TTS announcement logic (in `running-timer.tsx`):
    - Active: "[Step Name]. [Duration] minutes." (unchanged)
    - Wait: "[Step Name]. [Duration] minutes. Waiting."
  - [ ] Check current step type before composing TTS string

- [ ] **Task 6: Update `transition-overlay.tsx` for Wait → next transitions** (AC: 7)
  - [ ] Accept optional `previousStepType?: StepType` prop
  - [ ] When `previousStepType === 'wait'`: use transition message "Done waiting. Next: [Step Name]."
  - [ ] Other types: use existing transition messages (no change)
  - [ ] Pass the previous step type from `running-timer.tsx`

- [ ] **Task 7: Verify playback behavior** (AC: 5, 6)
  - [ ] Verify Wait steps auto-advance on planned duration (same as Active — no engine change needed)
  - [ ] Verify Pause, Skip, Extend buttons work during Wait steps (same as Active)
  - [ ] No changes to `use-timer-engine.ts` — Wait steps behave identically in the state machine

- [ ] **Task 8: Write tests** (AC: 1, 2, 3, 4, 7, 8)
  - [ ] Test `ProgressRing`: renders with `--wait` color when `stepType='wait'`
  - [ ] Test `StepDots`: wait step dot uses `--wait` color
  - [ ] Test `TransitionOverlay`: shows "Done waiting" message for wait → next transition
  - [ ] Test: Wait steps don't affect existing Active step behavior

## Dev Notes

### Architecture Patterns & Constraints

- **CSS custom properties:** Add to `:root` in `globals.css`. Use `var(--wait)` in Tailwind via arbitrary values: `bg-[var(--wait)]`. [Source: docs/ux-design-specification-v2.md]
- **Reduced motion:** Always provide `prefers-reduced-motion` fallback for animations. [Source: docs/ux-design-specification.md]
- **No engine changes:** Wait steps use the same state machine as Active. The only differences are visual/auditory. [Source: docs/architecture-v2.md#State-Machine-Evolution]

### Existing Components to Modify

| Component | File | Change |
|-----------|------|--------|
| `ProgressRing` | `src/components/session/progress-ring.tsx` | Add `stepType` prop, `--wait` color, breathing animation |
| `StepDots` | `src/components/session/step-dots.tsx` | Type-aware dot coloring |
| `RunningTimer` | `src/components/session/running-timer.tsx` | Pass step type to children, ⏳ prefix, "Waiting..." text |
| `TransitionOverlay` | `src/components/session/transition-overlay.tsx` | "Done waiting" message variant |

### ProgressRing Props (current v1)

```typescript
interface ProgressRingProps {
  timerName: string;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  stepProgress: number;    // 0-1
  totalProgress: number;   // 0-1
  isOverrun: boolean;
  isPaused: boolean;
  paceStatus: PaceStatus;
  paceMessage: string;
  ariaElapsedLabel: string;
  children?: React.ReactNode;
}
```

Add: `stepType?: StepType` — defaults to `undefined` (treated as `'active'`)

### Color Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--wait` | `#6B94B8` | Wait step ring, dots |
| `--primary` | `#7EBD73` | Active step ring, dots (existing) |
| `--muted` | `#8A8474` | "Waiting..." text |

### References

- [Source: docs/architecture-v2.md#Project-Structure] — No new files for this story; modify existing
- [Source: docs/ux-design-specification-v2.md] — Wait step visual treatment (calm blue, slower breathing)
- [Source: docs/PRD-v2.md#FR14.2] — Wait step behavior (same auto-advance, different visual/auditory)
- [Source: docs/architecture-v2.md#State-Machine-Evolution] — No state machine changes for Wait

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
