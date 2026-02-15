# Story 3.1: Real-Time Session Listener

Status: ready-for-dev

## Story

As a **user**,
I want to open the app on a second device and see my currently running timer in real-time,
so that I can move between devices without losing my place.

## Acceptance Criteria

1. **AC1:** Device B shows the currently active session from Device A with current step, elapsed time, and progress in sync
2. **AC2:** Step transitions on Device A appear on Device B within 2-3 seconds
3. **AC3:** Paused state on Device A shows as paused on Device B
4. **AC-extra-1:** `useFirestoreSession` hook subscribes to `onSnapshot` on the session document
5. **AC-extra-2:** `useDeviceId` hook generates and persists a unique device ID in `sessionStorage`
6. **AC-extra-3:** Unsubscribes from listener on component unmount

## Tasks / Subtasks

- [ ] **Task 1: Create useDeviceId hook** (AC: extra-2)
  - [ ] Create `src/hooks/use-device-id.ts`
  - [ ] Check `sessionStorage` for key `adhd-timer-device-id`
  - [ ] If missing, generate `crypto.randomUUID()`, store in `sessionStorage`
  - [ ] Return device ID string
  - [ ] Create `src/hooks/use-device-id.test.ts`

- [ ] **Task 2: Create useFirestoreSession hook** (AC: 1, 2, 3, extra-1, extra-3)
  - [ ] Create `src/hooks/use-firestore-session.ts`
  - [ ] Subscribe to `onSnapshot(doc(db, 'users', userId, 'sessions', sessionId))`
  - [ ] Return `{ session, loading, error }`
  - [ ] Unsubscribe on unmount
  - [ ] Create `src/hooks/use-firestore-session.test.ts` (mock onSnapshot)

- [ ] **Task 3: Integrate real-time session with RunningTimer** (AC: 1, 2, 3)
  - [ ] Replace one-time `getSession` fetch with `useFirestoreSession` real-time listener
  - [ ] Timer engine receives session updates from listener
  - [ ] Observer devices: UI reflects latest Firestore state (elapsed calc from timestamps)
  - [ ] Controller device: continues writing local state; listener confirms writes

- [ ] **Task 4: Update useTimerEngine for external updates** (AC: 1)
  - [ ] Accept external session data from `useFirestoreSession`
  - [ ] In observer mode: engine is passive, recalculates display from incoming session data
  - [ ] In controller mode: engine manages local state, writes to Firestore

- [ ] **Task 5: Write tests** (AC: 1-3)
  - [ ] Mock `onSnapshot` to simulate real-time updates
  - [ ] Verify RunningTimer updates when snapshot data changes
  - [ ] Verify: `npm run test`

## Dev Notes

### References

- [Source: docs/tech-spec-epic-3.md#useFirestoreSession-Hook] — Hook interface
- [Source: docs/tech-spec-epic-3.md#useDeviceId-Hook] — Device ID generation
- [Source: docs/architecture.md#Timer-Engine-State-Machine] — Data flow for controller vs observer
- [Source: docs/epics.md#Story-3.1] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
