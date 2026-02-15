# Story 2.5: Screen Wake Lock

Status: ready-for-dev

## Story

As a **user**,
I want my phone screen to stay on while a timer is running,
so that I can see and hear step transitions without touching my phone.

## Acceptance Criteria

1. **AC22:** Wake Lock acquired when timer starts (Play tapped)
2. **AC23:** Wake Lock released when timer pauses
3. **AC24:** Wake Lock released when timer completes
4. **AC25:** Wake Lock re-acquired when timer resumes after pause
5. **AC26:** If browser does not support Wake Lock API, app works normally — no error displayed
6. **AC-extra-1:** Wake Lock released on component unmount (cleanup)
7. **AC-extra-2:** Wake Lock re-acquired on `visibilitychange` (tab returns to foreground while running)
8. **AC-extra-3:** Wake Lock released on Stop (early termination)

## Tasks / Subtasks

- [ ] **Task 1: Create useWakeLock hook** (AC: 22, 23, 24, 25, 26, extra-1, extra-2)
  - [ ] Create `src/hooks/use-wake-lock.ts`
  - [ ] Interface: `{ isSupported, isActive, request, release }`
  - [ ] Feature-detect: `'wakeLock' in navigator`
  - [ ] `request()`: call `navigator.wakeLock.request('screen')`, store sentinel
  - [ ] `release()`: call `sentinel.release()`, clear reference
  - [ ] Handle `visibilitychange` event: if document becomes visible and timer is running, re-request wake lock
  - [ ] Cleanup on unmount: release if active
  - [ ] All operations wrapped in try/catch — never throw to consumer
  - [ ] If `!isSupported`, all methods are no-ops

- [ ] **Task 2: Integrate with RunningTimer** (AC: 22, 23, 24, 25, extra-3)
  - [ ] In `RunningTimer`, use `useWakeLock` hook
  - [ ] Call `wakeLock.request()` on:
    - Timer start (session status → running)
    - Timer resume (paused → running)
  - [ ] Call `wakeLock.release()` on:
    - Timer pause (running → paused)
    - Timer complete (→ completed, before showing CompletionView)
    - Timer stop (early termination)
    - Component unmount / navigation away

- [ ] **Task 3: Write tests** (AC: 22-26)
  - [ ] Create `src/hooks/use-wake-lock.test.ts`:
    - Mock `navigator.wakeLock`
    - `request()` acquires lock → `isActive` = true
    - `release()` releases lock → `isActive` = false
    - Unsupported browser → `isSupported` = false, no errors
    - `request()` failure → caught, no throw
    - Cleanup on unmount releases lock
  - [ ] Verify all tests pass: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **Graceful degradation:** Wake Lock API is not universally supported (Firefox doesn't support it). App must work perfectly without it. [Source: docs/architecture.md#Error-Handling-Browser-APIs]
- **Visibility change handling:** Wake Lock is automatically released when the page becomes hidden. Must re-acquire on visibility change if timer is still running. [Source: docs/tech-spec-epic-2.md#Risks]
- **Supported browsers:** Chrome 84+, Edge 84+, Safari 16.4+, Firefox ❌. [Source: docs/tech-spec-epic-2.md#Browser-Compatibility]

### References

- [Source: docs/tech-spec-epic-2.md#Wake-Lock-Design] — Hook interface and lifecycle table
- [Source: docs/architecture.md#Screen-Wake-Lock] — Integration point spec
- [Source: docs/epics.md#Story-2.5] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
