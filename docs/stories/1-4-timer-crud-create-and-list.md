# Story 1.4: Timer CRUD — Create & List

Status: ready-for-dev

## Story

As a **user**,
I want to create a new timer with named steps and durations, and see all my timers in a library,
so that I can build my routines and find them later.

## Acceptance Criteria

1. **AC15:** Empty timer library shows "Create your first timer" prompt with a clear CTA button
2. **AC16:** Timer creation form accepts timer name (required) + ordered steps, each with a name (required) and duration in minutes (required, default 5), with at least 1 step required to save
3. **AC17:** Total duration auto-calculates from step durations and displays in real time
4. **AC18:** Saved timer appears in the library showing: name, total duration, step count, and last used date (or "Never")
5. **AC-extra-1:** Timer creation navigates to `/app/timers/new`
6. **AC-extra-2:** After saving, user is redirected back to the timer library
7. **AC-extra-3:** Form validation prevents saving without a name or with zero steps
8. **AC-extra-4:** Timer cards in the library are sorted by `lastUsedAt` descending (most recent first), with never-used timers at the end

## Tasks / Subtasks

- [ ] **Task 1: Create EmptyState component** (AC: 15)
  - [ ] Create `src/components/timer/empty-state.tsx` (`'use client'`)
  - [ ] Display illustration/icon, "Create your first timer" heading, descriptive text
  - [ ] Include shadcn `Button` CTA navigating to `/app/timers/new`
  - [ ] Style with Deep Forest theme tokens
  - [ ] Create `src/components/timer/empty-state.test.tsx` — renders CTA, click navigates

- [ ] **Task 2: Create StepListEditor component** (AC: 16, 17)
  - [ ] Create `src/components/timer/step-list-editor.tsx` (`'use client'`)
  - [ ] Props: `steps: Step[]`, `onChange: (steps: Step[]) => void`
  - [ ] Each step row: name input (text, required) + duration input (number, minutes, default 5) + remove button
  - [ ] "Add Step" button appends a new step with defaults
  - [ ] Auto-generate `step.id` via `crypto.randomUUID()`
  - [ ] Steps displayed in order (manual reorder deferred to Epic 4)
  - [ ] Create `src/components/timer/step-list-editor.test.tsx` — add step, remove step, update step name/duration

- [ ] **Task 3: Create TimerForm component** (AC: 16, 17, extra-3)
  - [ ] Create `src/components/timer/timer-form.tsx` (`'use client'`)
  - [ ] Props: optional `initialTimer: TimerTemplate` (for edit reuse in Story 1.5)
  - [ ] Fields: Timer name (shadcn `Input`), description (optional `Input`), steps (`StepListEditor`)
  - [ ] Display auto-calculated total duration (sum of step durations, formatted with `formatDuration`)
  - [ ] Validate: name required, at least 1 step, each step has name and duration > 0
  - [ ] On save: call `createTimer(userId, timerData)` from `lib/firebase/timers.ts`
  - [ ] Show loading state on submit button
  - [ ] On success: redirect to `/app` via `router.push`
  - [ ] On error: display toast
  - [ ] Create `src/components/timer/timer-form.test.tsx` — validation, auto-calc, save flow (mock Firestore)

- [ ] **Task 4: Create TimerCard component** (AC: 18, extra-4)
  - [ ] Create `src/components/timer/timer-card.tsx` (`'use client'`)
  - [ ] Props: `timer: TimerTemplate`, `onPlay`, `onEdit`, `onDelete`, `onDuplicate` callbacks
  - [ ] Display: timer name, formatted total duration, step count, last used (via `formatRelativeDate`)
  - [ ] Action buttons: Play (primary), Edit, overflow menu (Delete, Duplicate) — per UX spec
  - [ ] Style with shadcn `Card` and Deep Forest theme
  - [ ] Create `src/components/timer/timer-card.test.tsx` — renders data, action button clicks

- [ ] **Task 5: Create TimerLibrary component** (AC: 15, 18, extra-4)
  - [ ] Create `src/components/timer/timer-library.tsx` (`'use client'`)
  - [ ] Fetch timers using `getTimers(userId)` on mount
  - [ ] If no timers: render `EmptyState`
  - [ ] If timers exist: render list of `TimerCard` components
  - [ ] Sort by `lastUsedAt` descending, never-used at end
  - [ ] Include "Create Timer" floating action button or header button
  - [ ] Loading state: shadcn `Skeleton` cards
  - [ ] Create `src/components/timer/timer-library.test.tsx` — empty state, populated list, loading state

- [ ] **Task 6: Wire up pages** (AC: extra-1, extra-2)
  - [ ] Update `src/app/app/page.tsx` to render `TimerLibrary` (replace placeholder from Story 1.2)
  - [ ] Create `src/app/app/timers/new/page.tsx` (`'use client'`) rendering `TimerForm`
  - [ ] Verify navigation flow: library → create → save → library

- [ ] **Task 7: Integration test** (AC: 15, 16, 17, 18)
  - [ ] Test full flow with mocked Firestore: library empty → create → library populated
  - [ ] Verify all component tests pass: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **Duration input in minutes, storage in seconds:** Form accepts minutes, converts to seconds on save using `parseDurationInput()`. Display uses `formatDuration()`. [Source: docs/tech-spec-epic-1.md#Data-Models]
- **Client components:** All components here use `'use client'`. [Source: docs/architecture.md#Client-Components]
- **Error tuple pattern:** `createTimer` and `getTimers` return `{ data, error }`. Handle both paths. [Source: docs/architecture.md#Error-Handling]
- **No barrel exports:** Import `TimerForm` directly from `src/components/timer/timer-form.tsx`. [Source: docs/architecture.md#Code-Organization]
- **Step ordering:** Sequential addition only in this story. Drag-to-reorder comes in Epic 4 (Story 4.2). [Source: docs/epics.md#Story-1.4-Technical-Notes]
- **Duration adjustment:** Simple number input in this story. Swipe-to-adjust gesture comes in Epic 4 (Story 4.1). [Source: docs/epics.md#Story-1.4-Technical-Notes]

### Component Hierarchy

```
TimerLibrary
├── EmptyState (when timers.length === 0)
│   └── Button → navigate to /app/timers/new
└── TimerCard[] (when timers exist)
    ├── Play button → createSession (Story 1.6)
    ├── Edit button → navigate to /app/timers/[id]/edit (Story 1.5)
    └── Menu → Delete, Duplicate (Story 1.5)

TimerForm (at /app/timers/new)
├── Name Input
├── Description Input (optional)
├── StepListEditor
│   └── Step rows (name + duration + remove)
├── Total Duration display
└── Save Button
```

### References

- [Source: docs/tech-spec-epic-1.md#Services-and-Modules] — TimerLibrary, TimerCard, TimerForm, StepListEditor, EmptyState specs
- [Source: docs/tech-spec-epic-1.md#Firestore-operations-timers.ts] — createTimer, getTimers function signatures
- [Source: docs/tech-spec-epic-1.md#AC15-AC18] — Acceptance criteria
- [Source: docs/ux-design-specification.md#7.3-Timer-Library] — Timer library UX patterns
- [Source: docs/epics.md#Story-1.4] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
