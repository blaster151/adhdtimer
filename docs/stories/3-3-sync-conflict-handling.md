# Story 3.3: Sync Conflict Handling

Status: ready-for-dev

## Story

As a **user**,
I want timer sync to handle connection drops and edge cases gracefully,
so that my timer doesn't break if I lose internet briefly.

## Acceptance Criteria

1. **AC9:** Timer continues running locally when device loses internet
2. **AC10:** On reconnect, local state syncs back to Firestore within seconds
3. **AC11:** Cached data shown when opening app with no internet
4. **AC12:** Starting a new timer while offline shows friendly message: "Connect to internet to start a timer"
5. **AC-extra-1:** Firestore offline persistence enabled (`enableMultiTabIndexedDbPersistence`)
6. **AC-extra-2:** Two devices offline simultaneously — last writer wins on reconnect (no crash)
7. **AC-extra-3:** `onSnapshot` listeners automatically reconnect after network restoration

## Tasks / Subtasks

- [ ] **Task 1: Enable Firestore offline persistence** (AC: extra-1, 11)
  - [ ] Update `src/lib/firebase/config.ts`:
    - Call `enableMultiTabIndexedDbPersistence(db)` after initialization
    - Handle `catch` for already-initialized errors
  - [ ] Verify cached data loads on subsequent offline opens

- [ ] **Task 2: Implement offline timer resilience** (AC: 9, 10)
  - [ ] Timer engine already uses timestamp-based calculation — inherently works offline
  - [ ] Firestore SDK queues writes when offline, replays on reconnect
  - [ ] Verify: pause timer → go offline → resume → go online → session syncs
  - [ ] No code changes needed if using Firestore offline persistence — this is a verification task

- [ ] **Task 3: Block new timer creation offline** (AC: 12)
  - [ ] In `TimerLibrary` or `TimerCard` play handler:
    - Check `navigator.onLine` before creating session
    - If offline: show toast "Connect to internet to start a timer"
    - Do not attempt to create session document
  - [ ] Consider: listen for `online`/`offline` events to update UI state

- [ ] **Task 4: Handle stale sessions** (AC: related to 3.4)
  - [ ] If a session's `startedAt` is > 24 hours old and still `running`/`paused`:
    - Still show it (user can Stop to clear)
    - Optionally show a note: "This session started over 24 hours ago"

- [ ] **Task 5: Write tests** (AC: 9-12)
  - [ ] Test offline detection (`navigator.onLine` mock)
  - [ ] Test "connect to internet" message appears
  - [ ] Test timer engine operates correctly with timestamp math (no drift verification)
  - [ ] Verify: `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **Timestamp-based timing (ADR-3) is the key:** Timer engine calculates elapsed from timestamps, not ticks. This means offline operation is inherently correct — no drift, no sync issues. [Source: docs/architecture.md#ADR-3]
- **Last-write-wins:** Firestore's default conflict resolution. Acceptable for personal-use v1. [Source: docs/epics.md#Story-3.3-Technical-Notes]
- **Offline persistence:** Firestore caches documents locally in IndexedDB. Reads work offline. Writes queue and replay. [Source: docs/architecture.md#Firebase-12.9.x]

### References

- [Source: docs/tech-spec-epic-3.md#Offline-Reconnect-Handling] — Offline strategy
- [Source: docs/epics.md#Story-3.3] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
