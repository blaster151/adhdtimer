# Story 6.5: Checkpoint Playback

Status: drafted

## Story

As a **user**,
I want Checkpoints to display my progress against a target clock time during playback,
So that I know if I'm ahead or behind schedule.

## Acceptance Criteria

1. **AC1:** Checkpoint comparison fires: current clock time vs. `step.targetTime`
2. **AC2:** Status displays in center: "🎯 [Name] — [X] min early" or "[X] min past" or "right on time"
3. **AC3:** Status text uses `--ahead` (green `#6BB5A0`), `--behind` (amber `#D4A96A`), or `--on-track` (green `#7EBD73`) coloring
4. **AC4:** Brief gold flash (`--checkpoint` color `#C9A84C`) at reduced opacity (200ms) across the ring area
5. **AC5:** TTS announces: "[Checkpoint Name]. You're [X minutes ahead / behind / right on time]."
6. **AC6:** Checkpoint auto-advances after 3–4 seconds (or user taps to advance immediately)
7. **AC7:** Checkpoint step is marked `completed` with `elapsedTime: 0` (instantaneous)
8. **AC8:** Step dot for Checkpoint uses diamond shape (◆) with `--checkpoint` color
9. **AC9:** `useCheckpoint` hook provides reactive status for the running timer UI
10. **AC10:** Checkpoint flash respects `prefers-reduced-motion` (no flash, instant display)
11. **AC11:** Multiple Checkpoints in a single timer work correctly (each displays independently)

## Tasks / Subtasks

- [ ] **Task 1: Add `--checkpoint` CSS custom property** (AC: 3, 4)
  - [ ] Add `--checkpoint: #C9A84C;` to `:root` in `src/app/globals.css`
  - [ ] Verify `--ahead` (`#6BB5A0`), `--behind` (`#D4A96A`), `--on-track` (`#7EBD73`) already exist in `globals.css`

- [ ] **Task 2: Create `src/hooks/use-checkpoint.ts`** (AC: 1, 9)
  - [ ] Props/params: `targetTime: string | undefined`, `isActive: boolean`
  - [ ] Returns: `{ status: CheckpointStatusResult | null }` — uses `getCheckpointStatus()` from `@/lib/utils/checkpoint`
  - [ ] When `isActive` is true and `targetTime` is defined: compute status using `getCheckpointStatus(targetTime)`
  - [ ] Re-compute every second while active (via `setInterval`) to keep the diff fresh
  - [ ] When `isActive` becomes false: return `null`, clear interval
  - [ ] Cleanup: clear interval on unmount
  - [ ] `'use client'` implicit (hook uses `useState` / `useEffect`)

- [ ] **Task 3: Create `src/hooks/use-checkpoint.test.ts`** (AC: 9)
  - [ ] Test: returns null when `isActive` is false
  - [ ] Test: returns null when `targetTime` is undefined
  - [ ] Test: returns `CheckpointStatusResult` when active with valid targetTime
  - [ ] Test: cleans up interval on unmount (use `vi.useFakeTimers`)

- [ ] **Task 4: Modify `use-timer-engine.ts` for Checkpoint step processing** (AC: 7)
  - [ ] When advancing to a step with `type === 'checkpoint'`:
    - Set step `status: 'completed'`
    - Set step `elapsedTime: 0`
    - Set step `completedAt: Timestamp.now()`
    - Do NOT set `startedAt` (instant — no duration)
    - Do NOT start the tick interval for this step
  - [ ] After marking checkpoint complete, DON'T auto-advance immediately in the engine
  - [ ] Instead, set a flag/state: `isCheckpointDisplay: true` with the checkpoint step index
  - [ ] The UI layer (running-timer) handles the 3–4s display delay and then calls `engine.advanceToNextStep()`
  - [ ] This separates engine logic (instant completion) from UI logic (display timing)

- [ ] **Task 5: Modify `running-timer.tsx` for Checkpoint display** (AC: 2, 3, 5, 6, 11)
  - [ ] Import `useCheckpoint` hook
  - [ ] Detect when current step is a Checkpoint (via engine state flag or step type)
  - [ ] When Checkpoint is active:
    - Use `useCheckpoint` hook to get status
    - Render center display: "🎯 [Name] — {status.message}"
    - Color the status text: `--ahead` green, `--behind` amber, `--on-track` green
    - Start a 3.5s `setTimeout` for auto-advance
    - Show a "Tap to continue" hint below status
    - On tap anywhere in the ring area: clear timeout, advance immediately
  - [ ] TTS announcement: "[Checkpoint Name]. You're {status.message}."
  - [ ] After display timeout or tap: call engine advance, clear Checkpoint display state
  - [ ] Handle multiple Checkpoints: each displays independently (state resets between Checkpoints)

- [ ] **Task 6: Modify `progress-ring.tsx` for Checkpoint flash** (AC: 4, 10)
  - [ ] When `stepType === 'checkpoint'` and Checkpoint is active:
    - Apply a CSS `@keyframes` flash: background color `var(--checkpoint)` at 20% opacity → transparent (200ms)
    - Flash once on Checkpoint activation (not repeated)
  - [ ] `@media (prefers-reduced-motion: reduce)`: no flash animation, just instant display
  - [ ] Inner ring: show `--checkpoint` color (gold) during Checkpoint display

- [ ] **Task 7: Modify `step-dots.tsx` for Checkpoint diamond shape** (AC: 8)
  - [ ] When step `type === 'checkpoint'`: render diamond shape (◆) instead of circle (●)
  - [ ] Diamond uses `--checkpoint` gold color
  - [ ] Implementation: CSS `transform: rotate(45deg)` on a square div, or SVG diamond, or unicode ◆ character
  - [ ] Size: same bounding box as regular dots for consistent row alignment

- [ ] **Task 8: Write integration tests** (AC: 1, 2, 5, 6, 7, 11)
  - [ ] Test `RunningTimer`: Checkpoint step shows "🎯 [Name]" with status message
  - [ ] Test: Checkpoint auto-advances after timeout
  - [ ] Test: Tap during Checkpoint advances immediately
  - [ ] Test: Checkpoint step marked `completed` with `elapsedTime: 0`
  - [ ] Test: Multiple Checkpoints in sequence work independently
  - [ ] Test `StepDots`: checkpoint dot renders diamond shape

## Dev Notes

### Architecture Patterns & Constraints

- **Hooks:** One hook per file, named export, `use-` prefix. [Source: docs/architecture.md#Code-Organization]
- **Reduced motion:** All animations must have `prefers-reduced-motion` fallback. [Source: docs/ux-design-specification.md]
- **Engine vs. UI separation:** Timer engine handles state transitions (instant completion). UI handles display timing (3–4s delay). This keeps the engine pure and testable. [Source: docs/architecture-v2.md#Checkpoint-Processing]
- **Test co-location:** `use-checkpoint.ts` → `use-checkpoint.test.ts`. [Source: docs/architecture.md#Testing-Strategy]

### Existing Components to Modify

| Component | File | Change |
|-----------|------|--------|
| `useTimerEngine` | `src/hooks/use-timer-engine.ts` | Checkpoint step instant completion logic |
| `RunningTimer` | `src/components/session/running-timer.tsx` | Checkpoint display, auto-advance, tap-to-advance |
| `ProgressRing` | `src/components/session/progress-ring.tsx` | Checkpoint flash animation, gold color |
| `StepDots` | `src/components/session/step-dots.tsx` | Diamond shape for Checkpoint dots |

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/use-checkpoint.ts` | Reactive checkpoint status (wraps `getCheckpointStatus`) |
| `src/hooks/use-checkpoint.test.ts` | Tests for useCheckpoint hook |

### State Machine — Checkpoint Processing

From `docs/architecture-v2.md`:

```
[Timer engine reaches a Checkpoint step]
  → Read step.targetTime (HH:MM)
  → Compare to Date.now() local time
  → Calculate diff in minutes
  → Set step status = 'completed' (zero duration — instant)
  → Set step elapsedTime = 0
  → Display status: ahead / on-time / behind
  → TTS: "[Checkpoint Name]. [Status message]."
  → Auto-advance to next step (no delay in state machine; UI shows briefly)
```

The engine marks the step complete instantly. The UI layer delays the visual transition by 3–4 seconds for the user to read the status. The user can tap to skip the delay.

### Color Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--checkpoint` | `#C9A84C` | Flash, diamond dot, ring color during display |
| `--ahead` | `#6BB5A0` | "X min early" text |
| `--on-track` | `#7EBD73` | "right on time" text |
| `--behind` | `#D4A96A` | "X min past" text |

### Auto-Advance Timing

- Use `setTimeout(3500)` for the 3–4 second display
- On user tap: `clearTimeout` and advance immediately
- On `prefers-reduced-motion`: still show 3.5s (reduced motion affects animation, not timing)
- During the 3.5s display: no time counting (step already marked completed instantly)

### References

- [Source: docs/architecture-v2.md#Checkpoint-Processing] — Full Checkpoint processing flow
- [Source: docs/architecture-v2.md#State-Machine-Evolution] — Checkpoint state transitions
- [Source: docs/architecture-v2.md#ADR-7] — Clock Time for Checkpoints
- [Source: docs/architecture-v2.md#Project-Structure] — `use-checkpoint.ts` in `src/hooks/`
- [Source: docs/ux-design-specification-v2.md] — Checkpoint visual treatment (gold flash, diamond dots)
- [Source: docs/PRD-v2.md#FR14.4] — Checkpoint displays ahead/on-time/behind status
- [Source: docs/PRD-v2.md#FR14.5] — Checkpoint is informational, not blocking

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
