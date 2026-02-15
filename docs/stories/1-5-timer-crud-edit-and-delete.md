# Story 1.5: Timer CRUD — Edit & Delete

Status: ready-for-dev

## Story

As a **user**,
I want to edit or delete my saved timers,
so that I can refine routines and remove ones I don't need.

## Acceptance Criteria

1. **AC19:** Edit form pre-populates with the timer's current name, description, steps, and durations
2. **AC20:** Editing timer name, steps, or durations persists changes to Firestore and the library reflects them
3. **AC21:** Delete timer shows a confirmation dialog, then removes the timer from Firestore on confirm
4. **AC22:** Duplicate creates a copy with "(copy)" suffix appended to the name
5. **AC-extra-1:** Edit page is at `/app/timers/[timerId]/edit`
6. **AC-extra-2:** After saving edits, user is redirected back to the timer library
7. **AC-extra-3:** Cancel from edit returns to library without saving
8. **AC-extra-4:** Delete confirmation uses shadcn `Dialog` — not OS-level alert
9. **AC-extra-5:** Duplicate immediately appears in the timer library

## Tasks / Subtasks

- [ ] **Task 1: Create edit page** (AC: 19, extra-1)
  - [ ] Create `src/app/app/timers/[timerId]/edit/page.tsx` (`'use client'`)
  - [ ] Fetch existing timer via `getTimer(userId, timerId)`
  - [ ] Pass timer data to `TimerForm` as `initialTimer` prop
  - [ ] Show loading skeleton while fetching
  - [ ] Handle "timer not found" with redirect or error message

- [ ] **Task 2: Update TimerForm for edit mode** (AC: 19, 20, extra-2, extra-3)
  - [ ] When `initialTimer` is provided, pre-populate all fields
  - [ ] On save in edit mode: call `updateTimer(userId, timerId, data)` instead of `createTimer`
  - [ ] Update `updatedAt` timestamp on save
  - [ ] Add "Cancel" button that navigates back to `/app` without saving
  - [ ] Show loading state on submit button during save
  - [ ] Redirect to `/app` on success

- [ ] **Task 3: Implement delete with confirmation** (AC: 21, extra-4)
  - [ ] Add delete handler to `TimerCard` or `TimerLibrary`
  - [ ] Create delete confirmation dialog using shadcn `Dialog`:
    - Title: "Delete [Timer Name]?"
    - Description: "This action cannot be undone."
    - Cancel + Confirm (destructive) buttons
  - [ ] On confirm: call `deleteTimer(userId, timerId)`
  - [ ] Remove timer from local state optimistically or refetch
  - [ ] Show toast on success: "Timer deleted"

- [ ] **Task 4: Implement duplicate** (AC: 22, extra-5)
  - [ ] Add duplicate action to `TimerCard` overflow menu
  - [ ] Call `duplicateTimer(userId, timerId)` which:
    - Fetches original timer
    - Creates new timer with name: `${original.name} (copy)`
    - Resets `createdAt`, `updatedAt` to now, clears `lastUsedAt`
  - [ ] Add duplicated timer to local state or refetch list
  - [ ] Show toast: "Timer duplicated"

- [ ] **Task 5: Wire edit/delete/duplicate to TimerCard** (AC: 19, 21, 22)
  - [ ] Update `TimerCard` props to receive `onEdit`, `onDelete`, `onDuplicate` handlers
  - [ ] Edit button: `router.push(/app/timers/${timer.id}/edit)`
  - [ ] Delete button: opens confirmation dialog
  - [ ] Duplicate: in overflow dropdown menu (shadcn `DropdownMenu`)
  - [ ] Update `TimerLibrary` to pass handlers to each `TimerCard`

- [ ] **Task 6: Write tests** (AC: 19, 20, 21, 22)
  - [ ] Update `src/components/timer/timer-form.test.tsx` — test edit mode pre-population, update call
  - [ ] Create `src/components/timer/delete-dialog.test.tsx` — confirm/cancel behavior
  - [ ] Test duplicate flow with mocked Firestore
  - [ ] Verify all tests pass: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **Reuse TimerForm:** The same `TimerForm` component from Story 1.4 is reused for editing. The `initialTimer` prop differentiates create vs edit mode. [Source: docs/epics.md#Story-1.5-Technical-Notes]
- **Delete confirmation:** Use shadcn `Dialog`, not OS-level `window.confirm()`. [Source: docs/epics.md#Story-1.5-Technical-Notes]
- **Optimistic UI optional:** Can either refetch the timer list after mutations or update local state optimistically. Either approach is acceptable for v1.
- **Error tuple pattern:** All Firestore calls (`updateTimer`, `deleteTimer`, `duplicateTimer`) return `{ data, error }`. [Source: docs/architecture.md#Error-Handling]
- **Dynamic route:** Next.js App Router dynamic segment `[timerId]` for the edit page.

### Route Structure After This Story

```
/app/timers/new              → Create new timer (Story 1.4)
/app/timers/[timerId]/edit   → Edit existing timer (this story)
```

### References

- [Source: docs/tech-spec-epic-1.md#Services-and-Modules] — TimerForm (edit mode), TimerCard actions
- [Source: docs/tech-spec-epic-1.md#Firestore-operations-timers.ts] — updateTimer, deleteTimer, duplicateTimer signatures
- [Source: docs/tech-spec-epic-1.md#AC19-AC22] — Acceptance criteria
- [Source: docs/ux-design-specification.md#7.4-Timer-Card-Actions] — Edit/delete/duplicate UX
- [Source: docs/epics.md#Story-1.5] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
