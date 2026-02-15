# Story 1.3: Timer Data Model & Firestore Schema

Status: ready-for-dev

## Story

As a **developer**,
I want a well-defined timer data model in Firestore,
so that timers, steps, and run sessions have a clear structure for all subsequent features.

## Acceptance Criteria

1. **AC12:** Firestore collections `users/{userId}/timers` and `users/{userId}/sessions` accept typed documents matching the defined schemas
2. **AC13:** TypeScript interfaces for `TimerTemplate`, `Step`, `RunSession`, `SessionStep`, `SessionStatus`, and `StepStatus` are defined in `src/types/`
3. **AC14:** Firestore security rules enforce user isolation — `request.auth.uid == userId` on all document paths
4. **AC-extra-1:** Union types used for `SessionStatus` and `StepStatus` (not enums, per ADR-5)
5. **AC-extra-2:** Durations stored as integer seconds in Firestore
6. **AC-extra-3:** `firestore.rules` file deployed and tested with Firebase emulator or test harness
7. **AC-extra-4:** Utility type helpers (e.g., `WithId<T>`) available if needed for Firestore doc ↔ TypeScript mapping

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript interfaces** (AC: 13, extra-1, extra-2)
  - [ ] Create `src/types/timer.ts`:
    ```typescript
    interface TimerTemplate {
      id: string;
      name: string;
      description?: string;
      totalPlannedDuration: number;  // seconds
      countdownMode: boolean;        // default false
      steps: Step[];
      createdAt: Timestamp;
      updatedAt: Timestamp;
      lastUsedAt?: Timestamp;
    }
    interface Step {
      id: string;
      name: string;
      plannedDuration: number;       // seconds
      notes?: string;
    }
    ```
  - [ ] Create `src/types/session.ts`:
    ```typescript
    type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';
    type StepStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped';
    interface RunSession {
      id: string;
      timerId: string;
      timerName: string;
      status: SessionStatus;
      currentStepIndex: number;
      startedAt: Timestamp;
      pausedAt?: Timestamp;
      completedAt?: Timestamp;
      activeDeviceId: string;
      totalElapsedTime: number;      // seconds
      steps: SessionStep[];
    }
    interface SessionStep {
      id: string;
      name: string;
      plannedDuration: number;       // seconds (may increase via extensions)
      originalPlannedDuration: number; // seconds (before extensions)
      elapsedTime: number;           // seconds
      status: StepStatus;
      startedAt?: Timestamp;
      completedAt?: Timestamp;
    }
    ```
  - [ ] Export all types from both files

- [ ] **Task 2: Create Firestore security rules** (AC: 14, extra-3)
  - [ ] Create `firestore.rules` in project root:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
  - [ ] Create `firebase.json` (or update) with rules path reference
  - [ ] Test rules prevent cross-user access (manual or emulator)

- [ ] **Task 3: Create Firestore helper scaffold** (AC: 12)
  - [ ] Verify `src/lib/firebase/config.ts` exports `db` (Firestore instance)
  - [ ] Create `src/lib/firebase/timers.ts` with typed function stubs:
    - `createTimer(userId: string, timer: Omit<TimerTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: TimerTemplate | null; error: Error | null }>`
    - `getTimers(userId: string): Promise<{ data: TimerTemplate[]; error: Error | null }>`
    - `getTimer(userId: string, timerId: string): Promise<{ data: TimerTemplate | null; error: Error | null }>`
    - `updateTimer(userId: string, timerId: string, data: Partial<TimerTemplate>): Promise<{ data: void | null; error: Error | null }>`
    - `deleteTimer(userId: string, timerId: string): Promise<{ data: void | null; error: Error | null }>`
    - `duplicateTimer(userId: string, timerId: string): Promise<{ data: TimerTemplate | null; error: Error | null }>`
  - [ ] Create `src/lib/firebase/sessions.ts` with typed function stubs:
    - `createSession(userId: string, template: TimerTemplate): Promise<{ data: RunSession | null; error: Error | null }>`
    - `updateSession(userId: string, sessionId: string, data: Partial<RunSession>): Promise<{ data: void | null; error: Error | null }>`
    - `getSession(userId: string, sessionId: string): Promise<{ data: RunSession | null; error: Error | null }>`
  - [ ] Implement actual Firestore calls (addDoc, getDocs, getDoc, updateDoc, deleteDoc)

- [ ] **Task 4: Create time utility functions** (AC: extra-2)
  - [ ] Create `src/lib/utils/time.ts`:
    - `formatDuration(seconds: number): string` — e.g., "5:00", "1:30:00"
    - `formatOverrun(seconds: number): string` — e.g., "+2:15"
    - `formatRelativeDate(date: Date): string` — e.g., "2 days ago", "Never"
    - `parseDurationInput(minutes: number): number` — converts minutes to seconds
  - [ ] Create `src/lib/utils/time.test.ts` with comprehensive tests for each function
  - [ ] Verify all tests pass

- [ ] **Task 5: Write type/schema tests** (AC: 12, 13)
  - [ ] Create `src/types/timer.test.ts` — type-level smoke tests (ensure interfaces compile, sample objects type-check)
  - [ ] Verify Firestore CRUD stubs compile with correct types
  - [ ] Run `npm run build` to confirm no type errors

## Dev Notes

### Architecture Patterns & Constraints

- **Union types, not enums:** `SessionStatus` and `StepStatus` must be union types per ADR-5 [Source: docs/architecture.md#ADR-5]
- **Durations in seconds:** All duration fields stored as integer seconds. UI converts to/from minutes for display. [Source: docs/tech-spec-epic-1.md#Data-Models]
- **Steps as array, not subcollection:** Steps stored within the parent document as an array. Sufficient for < 30 steps. [Source: docs/epics.md#Story-1.3-Technical-Notes]
- **Session copies template steps:** `RunSession.steps` is a snapshot from the template at creation time — template is never mutated during playback. [Source: docs/tech-spec-epic-1.md#Relationships]
- **Error tuple pattern:** All Firestore functions return `{ data, error }` — never throw. [Source: docs/architecture.md#Error-Handling]
- **No barrel exports:** Import from `src/types/timer.ts` directly, not from `src/types/index.ts`. [Source: docs/architecture.md#Code-Organization]

### Data Model Diagram

```
users/{userId}/
├── timers/{timerId}     → TimerTemplate document
│   { name, description?, totalPlannedDuration, countdownMode,
│     steps: [{ id, name, plannedDuration, notes? }],
│     createdAt, updatedAt, lastUsedAt? }
│
└── sessions/{sessionId} → RunSession document
    { timerId, timerName, status, currentStepIndex,
      startedAt, pausedAt?, completedAt?, activeDeviceId,
      totalElapsedTime,
      steps: [{ id, name, plannedDuration, originalPlannedDuration,
                elapsedTime, status, startedAt?, completedAt? }] }
```

### References

- [Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts] — Complete TypeScript interfaces and Firestore schemas
- [Source: docs/tech-spec-epic-1.md#Firestore-Security-Rules] — Security rules
- [Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces] — Firestore CRUD function signatures
- [Source: docs/architecture.md#ADR-5] — Union types over enums
- [Source: docs/architecture.md#ADR-3] — Timestamp-based timing
- [Source: docs/epics.md#Story-1.3] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
