# Story 4.2: Drag-to-Reorder Steps

## Status: ready-for-dev

## Story

As a **user**,
I want to drag steps to reorder them in my timer,
So that I can rearrange my routine without deleting and recreating steps.

## Prerequisites

- Story 4.1 complete (swipe-to-adjust durations)
- `StepListEditor` component exists from Story 1.4

## Acceptance Criteria (ACs)

### AC 4.2.1 — Drag Handle Activation
**Given** I am on the timer creation or editing page with multiple steps
**When** I long-press (mobile) or click (desktop) the drag handle on a step
**Then** the step becomes draggable with a visual lift effect (subtle shadow + slight scale)

### AC 4.2.2 — Reorder on Drop
**Given** I drag a step to a new position
**When** I release it
**Then** the step list reorders to reflect the new position
**And** other steps shift smoothly to accommodate

### AC 4.2.3 — Order Persistence
**Given** I save the timer after reordering steps
**When** the save completes
**Then** the new step order is persisted in Firestore
**And** reopening the timer shows the updated order

### AC 4.2.4 — Mobile Touch Support
**Given** I am on a mobile device
**When** I long-press a step's drag handle (250ms delay)
**Then** the drag activates without triggering scroll
**And** I can drag the step to a new position with my finger

### AC 4.2.5 — Desktop Mouse Support
**Given** I am on a desktop browser
**When** I click and hold the drag handle
**Then** the drag activates immediately
**And** I can drag the step to a new position with my mouse

### AC 4.2.6 — Keyboard Accessibility
**Given** I am using keyboard navigation
**When** I focus the drag handle and press Arrow Up/Down
**Then** the step moves up or down in the list
**And** screen readers announce the position change

### AC 4.2.7 — Visual Drop Zone Feedback
**Given** I am dragging a step
**When** I hover over a potential drop position
**Then** a visual indicator (highlighted gap) shows where the step will land
**And** the dragged step has a shadow/lift effect distinguishing it from the list

## Tasks

### Task 1: Install and Configure @dnd-kit
- Ensure `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` are in dependencies
- Configure sensors: `PointerSensor`, `TouchSensor` (with delay: 250ms, tolerance: 5px), `KeyboardSensor`
- Set up `sortableKeyboardCoordinates` for keyboard reordering

### Task 2: Create SortableStepRow Component
- **File:** `src/components/timer/sortable-step-row.tsx`
- Wrap existing step row content with `useSortable` hook
- Apply `CSS.Transform.toString(transform)` for drag positioning
- Add drag handle element (grip/hamburger icon) on the left
- Style: lifted state gets `shadow-lg`, `scale-[1.02]`, `z-10`, `opacity-90`
- Handle receives `{...attributes, ...listeners}` from useSortable

### Task 3: Integrate DndContext into StepListEditor
- Wrap step list in `<DndContext>` with `closestCenter` collision detection
- Wrap items in `<SortableContext>` with `verticalListSortingStrategy`
- Handle `onDragEnd`: reorder the steps array in form state using `arrayMove`
- Use `restrictToVerticalAxis` modifier to prevent horizontal dragging
- Ensure step IDs are stable (use `step.id` as sortable key)

### Task 4: Ensure Non-Conflict with Swipe Gesture
- Drag handle is a distinct area (left side icon) — not the entire row
- Duration swipe area (Story 4.1) is separate from drag handle
- Both gestures coexist: horizontal swipe on duration, vertical drag via handle
- Test that swiping on duration doesn't activate drag and vice versa

### Task 5: Tests
- Component test: render StepListEditor with 3+ steps, verify order
- Keyboard test: focus drag handle, press arrow keys, verify reorder
- Test: reorder steps, save timer, verify persisted order
- Test: drag handle is present and has correct ARIA attributes
- Test: only steps with drag handle interaction activate drag (not entire row)

## Dev Notes

- `@dnd-kit` is already specified in the architecture as a project dependency (`@dnd-kit/core@^6.3`).
- The drag gesture uses a vertical axis only (`restrictToVerticalAxis` modifier). The swipe gesture (Story 4.1) uses horizontal axis only. These should not conflict as long as the touch targets are distinct.
- Step IDs (nanoid/crypto.randomUUID) must remain stable during reorder — only the array index changes.
- No Firestore write happens during drag — the reorder is in local form state only. The new order is persisted when the user taps Save.
