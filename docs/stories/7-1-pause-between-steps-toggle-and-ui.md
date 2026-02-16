# Story 7.1: Pause-Between-Steps Toggle & UI

Status: drafted

## Story

As a **user**,
I want to enable a "pause between steps" setting on a timer,
So that the timer pauses at each step transition and I control when to start the next step.

## Acceptance Criteria

1. **AC1:** A "Pause between steps" toggle switch appears below the step list (alongside existing countdown toggle)
2. **AC2:** Default is OFF (false) — existing behavior preserved
3. **AC3:** Help text below toggle: "Timer pauses at each step transition. Tap to start the next step."
4. **AC4:** Setting saves as `pauseBetweenSteps` on the TimerTemplate document
5. **AC5:** Editing an existing timer loads the toggle state correctly

## Tasks / Subtasks

- [ ] **Task 1: Add pause-between-steps toggle to `timer-form.tsx`** (AC: 1, 2, 3, 4, 5)
  - [ ] Add state: `const [pauseBetweenSteps, setPauseBetweenSteps] = useState(initialTimer?.pauseBetweenSteps ?? false)`
  - [ ] Add a toggle switch block below the existing "Countdown mode" toggle, using the same visual pattern:
    ```
    <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
      <div className="space-y-0.5">
        <Label>Pause between steps</Label>
        <p className="text-xs text-muted-foreground">Timer pauses at each step transition. Tap to start the next step.</p>
      </div>
      <Switch checked={pauseBetweenSteps} onCheckedChange={setPauseBetweenSteps} />
    </div>
    ```
  - [ ] Include `pauseBetweenSteps` in `timerData` object inside `handleSubmit`:
    ```
    const timerData = {
      ...existing fields,
      pauseBetweenSteps,
    };
    ```
  - [ ] Verify: in edit mode, `initialTimer.pauseBetweenSteps` loads correctly (true or false)
  - [ ] Verify: v1 timers without `pauseBetweenSteps` field default to `false` (unchecked)

- [ ] **Task 2: Write tests** (AC: 1, 2, 4, 5)
  - [ ] Test `TimerForm`: renders "Pause between steps" toggle
  - [ ] Test: toggle defaults to OFF for new timer
  - [ ] Test: toggle reflects `true` when editing a timer with `pauseBetweenSteps: true`
  - [ ] Test: form submission includes `pauseBetweenSteps` in the data

## Dev Notes

### Architecture Patterns & Constraints

- **shadcn Switch:** Already imported in `timer-form.tsx` — used for "Countdown mode" toggle. Reuse same pattern. [Source: docs/stories/1-1-project-setup-and-deployment-pipeline.md AC5]
- **No barrel exports:** Import directly from component path. [Source: docs/architecture.md#Code-Organization]
- **Optional field:** `pauseBetweenSteps` is optional on `TimerTemplate` (Story 6.1). Missing = `false`. [Source: docs/architecture-v2.md#Schema-Evolution]

### Existing `timer-form.tsx` Structure

The timer form currently has this layout order:
1. AI Breakdown Panel (create mode only)
2. Timer Name input
3. Description input (optional)
4. StepListEditor
5. **Countdown mode toggle** ← add Pause toggle right after this
6. Total Duration display
7. Save / Cancel buttons

The new toggle should go between item 5 and 6 — after Countdown mode, before Total Duration.

### Session Creation Note

When a session is created from a template (in `use-timer-engine.ts` `start()` method), the `pauseBetweenSteps` value should be copied to the `RunSession`. This plumbing happens in Story 7.2 (engine changes) — this story only handles the template-level UI and persistence.

### References

- [Source: docs/architecture-v2.md#Schema-Evolution] — `pauseBetweenSteps?: boolean` on TimerTemplate
- [Source: docs/PRD-v2.md#FR15] — Pause-between-steps (manual advance mode)
- [Source: docs/ux-design-specification-v2.md] — Toggle UX matches existing countdown toggle pattern

---

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
