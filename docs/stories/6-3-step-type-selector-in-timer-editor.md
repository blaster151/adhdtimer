# Story 6.3: Step Type Selector in Timer Editor

Status: drafted

## Story

As a **user**,
I want to set each step's type (Active, Wait, or Checkpoint) when creating or editing a timer,
So that my routine can include different kinds of steps.

## Acceptance Criteria

1. **AC1:** Each step row shows a type selector dropdown between the step name and duration
2. **AC2:** Default type is "Active" with ▶ icon — requires no action for simple timers
3. **AC3:** Dropdown options: ▶ Active, ⏳ Wait, 🎯 Check
4. **AC4:** Selecting "Checkpoint" replaces the duration input with a time picker (HH:MM)
5. **AC5:** Selecting "Active" or "Wait" after "Checkpoint" replaces the time picker with a duration input
6. **AC6:** Checkpoint time picker accepts input formats: "730", "7:30", "07:30" and normalizes to HH:MM
7. **AC7:** Checkpoint steps show clock time (e.g., "7:30") instead of a duration
8. **AC8:** Checkpoint steps contribute 0 to the Total duration calculation
9. **AC9:** Step type is saved to Firestore as `step.type` when the timer is saved
10. **AC10:** Editing an existing timer with step types loads them correctly in the form
11. **AC11:** Existing v1 timers (no type field) display all steps as Active by default
12. **AC12:** Type selector has `aria-label="Step type for [step name]"` for accessibility
13. **AC13:** Checkpoint time picker has `inputmode="numeric"` for mobile keyboard optimization

## Tasks / Subtasks

- [ ] **Task 1: Create `src/components/timer/step-type-selector.tsx`** (AC: 1, 2, 3, 12)
  - [ ] Create a compact dropdown component using shadcn `DropdownMenu`
  - [ ] Props: `value: StepType | undefined`, `onChange: (type: StepType) => void`, `stepName: string`
  - [ ] Display current type with icon: ▶ (active), ⏳ (wait), 🎯 (check)
  - [ ] Dropdown menu items: "▶ Active", "⏳ Wait", "🎯 Check"
  - [ ] Trigger button: compact (icon only when space-constrained, icon + label when space available)
  - [ ] Default when `value` is `undefined`: show ▶ Active
  - [ ] Add `aria-label="Step type for {stepName}"` on the trigger
  - [ ] `'use client'` directive at top

- [ ] **Task 2: Create `src/components/timer/checkpoint-time-picker.tsx`** (AC: 6, 7, 13)
  - [ ] Props: `value: string | undefined`, `onChange: (targetTime: string) => void`
  - [ ] Input field: `inputmode="numeric"`, placeholder "HH:MM"
  - [ ] On blur: normalize input via `parseTargetTime()` from `@/lib/utils/checkpoint`
    - `"730"` → `"07:30"`, `"7:30"` → `"07:30"`, `"07:30"` → `"07:30"`
  - [ ] Display formatted time using `formatClockTime()` when value is valid
  - [ ] Show validation hint if input is invalid after blur
  - [ ] Compact design — same row height as duration input
  - [ ] `'use client'` directive at top

- [ ] **Task 3: Integrate type selector into `step-list-editor.tsx`** (AC: 1, 4, 5, 9, 10, 11)
  - [ ] Import `StepTypeSelector` and `CheckpointTimePicker`
  - [ ] Modify `updateStep` function to handle `type` and `targetTime` fields
  - [ ] In each step row (via `SortableStepRow` or directly):
    - Add `StepTypeSelector` between step name input and duration input
    - When type is `'checkpoint'`: render `CheckpointTimePicker` instead of duration input
    - When type is `'active'` or `'wait'` (or undefined): render normal duration input
  - [ ] When switching FROM checkpoint TO active/wait: clear `targetTime`, restore default duration
  - [ ] When switching TO checkpoint FROM active/wait: clear `plannedDuration` to 0, show time picker
  - [ ] Ensure `addStep()` creates new steps with default `type: undefined` (treated as active)
  - [ ] Existing steps without `type` field display as Active (v1 backward compat)

- [ ] **Task 4: Update `timer-form.tsx` total duration calculation** (AC: 8)
  - [ ] Modify `totalDuration` calculation: exclude steps where `type === 'checkpoint'`
  - [ ] Current: `steps.reduce((sum, s) => sum + s.plannedDuration, 0)`
  - [ ] Updated: `steps.reduce((sum, s) => (s.type === 'checkpoint' ? sum : sum + s.plannedDuration), 0)`
  - [ ] Verify total duration display updates when a step type changes to/from checkpoint

- [ ] **Task 5: Verify step type persistence** (AC: 9, 10)
  - [ ] Ensure `timerData` in `handleSubmit` includes step `type` and `targetTime` fields
  - [ ] Verify: steps with `type: 'active'` or `type: undefined` persist correctly
  - [ ] Verify: checkpoint steps persist `targetTime` and `type: 'checkpoint'`
  - [ ] Verify: loading an existing timer in edit mode restores types and target times

- [ ] **Task 6: Write tests** (AC: 1, 2, 3, 4, 5, 8, 11)
  - [ ] Test `StepTypeSelector`: renders with default Active, dropdown shows all 3 options, fires onChange
  - [ ] Test `CheckpointTimePicker`: renders input, normalizes "730" to "07:30" on blur
  - [ ] Test `StepListEditor`: integrating type selector, switching between types changes the input field
  - [ ] Test: total duration excludes checkpoint steps
  - [ ] Test: v1 steps (no type field) render as Active

## Dev Notes

### Architecture Patterns & Constraints

- **Component files:** One component per file, named export matching filename. [Source: docs/architecture.md#Code-Organization]
- **Client components:** `'use client'` directive required for components using hooks, state, or browser APIs. [Source: docs/architecture.md#Code-Organization]
- **No barrel exports:** Import directly from component path. [Source: docs/architecture.md#Code-Organization]
- **Naming:** kebab-case files, PascalCase components. [Source: docs/architecture.md#Naming-Conventions]
- **shadcn/ui:** `DropdownMenu` is already installed (Story 1.1 AC5). [Source: docs/stories/1-1-project-setup-and-deployment-pipeline.md]

### Existing Components to Modify

**`src/components/timer/step-list-editor.tsx`** — the main step list editor:
- Uses `@dnd-kit` for drag-to-reorder
- Has `SortableStepRow` component for each step
- `updateStep(id, field, value)` function handles field changes
- `addStep()` creates new `Step` objects with `crypto.randomUUID()` IDs

**`src/components/timer/timer-form.tsx`** — the timer create/edit form:
- Manages form state: `name`, `description`, `steps`, `countdownMode`
- Calculates `totalDuration` via `steps.reduce()`
- Submits via `createTimer()` or `updateTimer()` from Firebase lib

### Checkpoint Time Picker Design

The checkpoint time picker replaces the duration swipe-to-adjust input:
- Same visual row height — no layout shift when switching types
- `inputmode="numeric"` triggers numeric keyboard on mobile
- Normalization uses `parseTargetTime()` from Story 6.2
- Display uses `formatClockTime()` from Story 6.2 for locale-aware rendering (e.g., "7:30 AM")

### Step Type Persistence

Step `type` and `targetTime` are already part of the `Step` interface (Story 6.1). They flow through `CreateTimerInput` and `UpdateTimerInput` automatically since those are `Omit<TimerTemplate, ...>` derivatives. No Firestore rule changes needed — existing rules cover all new fields.

### References

- [Source: docs/architecture-v2.md#Project-Structure] — `step-type-selector.tsx` and `checkpoint-time-picker.tsx`
- [Source: docs/architecture-v2.md#Schema-Evolution] — Step interface with v2 fields
- [Source: docs/ux-design-specification-v2.md] — Step type visuals, Checkpoint time picker UX
- [Source: docs/PRD-v2.md#FR14.1] — Three step types: Active, Wait, Checkpoint
- [Source: docs/PRD-v2.md#FR14.4] — Checkpoint target time clock display

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
