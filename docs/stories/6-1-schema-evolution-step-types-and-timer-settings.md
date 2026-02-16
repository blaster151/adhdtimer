# Story 6.1: Schema Evolution — Step Types & Timer Settings

Status: drafted

## Story

As a **developer**,
I want to extend the TypeScript types and Firestore schema with step types and new timer settings,
So that all subsequent v2 features have a typed foundation.

## Acceptance Criteria

1. **AC1:** `StepType` union type exists: `'active' | 'wait' | 'checkpoint'`
2. **AC2:** `Step` interface gains optional `type?: StepType` (default treated as `'active'`) and optional `targetTime?: string` (HH:MM, for checkpoints only)
3. **AC3:** `TimerTemplate` gains optional `pauseBetweenSteps?: boolean`
4. **AC4:** `TimerTemplate` gains optional `schedule?: Schedule` with `Schedule` interface: `{ enabled: boolean; days: DayOfWeek[]; timeOfDay: TimeOfDay }`
5. **AC5:** `TimerTemplate` gains optional `streak?: Streak` with `Streak` interface: `{ currentCount: number; lastCompletedDate: string; startDate: string }`
6. **AC6:** `SessionStatus` union type gains `'waiting-for-advance'`
7. **AC7:** `StepStatus` union type gains `'deferred'`
8. **AC8:** `SessionStep` gains optional `type?: StepType`
9. **AC9:** `RunSession` gains optional `deferredSteps?: string[]` and `pauseBetweenSteps?: boolean`
10. **AC10:** New utility types exported: `DayOfWeek`, `TimeOfDay`, `Schedule`, `Streak`, `StepType`
11. **AC11:** All existing v1 tests continue to pass with no changes (backward compatible)
12. **AC12:** New Firestore composite index added to `firestore.indexes.json`: `sessions` collection on `timerId` ASC + `status` ASC + `completedAt` DESC

## Tasks / Subtasks

- [ ] **Task 1: Add v2 types to `src/types/timer.ts`** (AC: 1, 2, 3, 4, 5, 10)
  - [ ] Add `StepType` union type: `'active' | 'wait' | 'checkpoint'`
  - [ ] Add `DayOfWeek` union type: `'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'`
  - [ ] Add `TimeOfDay` union type: `'morning' | 'afternoon' | 'evening' | 'anytime'`
  - [ ] Add `Schedule` interface: `{ enabled: boolean; days: DayOfWeek[]; timeOfDay: TimeOfDay }`
  - [ ] Add `Streak` interface: `{ currentCount: number; lastCompletedDate: string; startDate: string }`
  - [ ] Add optional `type?: StepType` and `targetTime?: string` to `Step` interface
  - [ ] Add optional `pauseBetweenSteps?: boolean`, `schedule?: Schedule`, `streak?: Streak` to `TimerTemplate`
  - [ ] Update `CreateTimerInput` — it already uses `Omit<TimerTemplate, ...>` so new optional fields flow through automatically; verify this is the case
  - [ ] Update `UpdateTimerInput` — same verification
  - [ ] Ensure all new types are named exports

- [ ] **Task 2: Add v2 types to `src/types/session.ts`** (AC: 6, 7, 8, 9)
  - [ ] Add `'waiting-for-advance'` to `SessionStatus` union type
  - [ ] Add `'deferred'` to `StepStatus` union type
  - [ ] Add optional `type?: StepType` to `SessionStep` (import `StepType` from `./timer`)
  - [ ] Add optional `deferredSteps?: string[]` and `pauseBetweenSteps?: boolean` to `RunSession`

- [ ] **Task 3: Add new type tests in `src/types/timer.test.ts`** (AC: 1, 2, 3, 4, 5, 10, 11)
  - [ ] Add test: `StepType` union type accepts all three values
  - [ ] Add test: `Step` with `type: 'checkpoint'` and `targetTime: '07:30'` compiles
  - [ ] Add test: `Step` without `type` compiles (backward compatible)
  - [ ] Add test: `TimerTemplate` with `pauseBetweenSteps`, `schedule`, `streak` compiles
  - [ ] Add test: `TimerTemplate` without v2 fields compiles (backward compatible)
  - [ ] Add test: `Schedule` interface accepts valid values
  - [ ] Add test: `Streak` interface accepts valid values
  - [ ] Add test: `DayOfWeek` and `TimeOfDay` types accept all expected values
  - [ ] Verify ALL existing tests still pass unchanged

- [ ] **Task 4: Add new session type tests in `src/types/timer.test.ts`** (AC: 6, 7, 8, 9, 11)
  - [ ] Add test: `SessionStatus` union includes `'waiting-for-advance'` (6 values total)
  - [ ] Add test: `StepStatus` union includes `'deferred'` (6 values total)
  - [ ] Add test: `SessionStep` with `type: 'wait'` compiles
  - [ ] Add test: `RunSession` with `deferredSteps` and `pauseBetweenSteps` compiles
  - [ ] Add test: `RunSession` without v2 fields compiles (backward compatible)

- [ ] **Task 5: Update Firestore composite index** (AC: 12)
  - [ ] Add composite index to `firestore.indexes.json`:
    ```json
    {
      "indexes": [
        {
          "collectionGroup": "sessions",
          "queryScope": "COLLECTION",
          "fields": [
            { "fieldPath": "timerId", "order": "ASCENDING" },
            { "fieldPath": "status", "order": "ASCENDING" },
            { "fieldPath": "completedAt", "order": "DESCENDING" }
          ]
        }
      ],
      "fieldOverrides": []
    }
    ```
  - [ ] Note: Deploy with `firebase deploy --only firestore:indexes` — index builds take time

- [ ] **Task 6: Run all tests and verify** (AC: 11)
  - [ ] Run `npx vitest run` — all existing tests pass
  - [ ] Run `npm run build` — no compile errors
  - [ ] Manually verify: existing `TimerTemplate` and `RunSession` objects in codebase still typecheck

## Dev Notes

### Architecture Patterns & Constraints

- **Union types, not enums:** Per ADR-5, use `type X = 'a' | 'b'` — never TypeScript enums. [Source: docs/architecture.md#Naming-Conventions]
- **No barrel exports:** Import directly from file paths, not via `index.ts`. [Source: docs/architecture.md#Code-Organization]
- **Shared types in `src/types/`:** Import as `import type { TimerTemplate } from '@/types/timer'`. [Source: docs/architecture.md#Code-Organization]
- **All new fields are optional:** Zero migration — existing Firestore documents work without any changes. [Source: docs/architecture-v2.md#Schema-Evolution]
- **Test co-location:** Tests live next to source files: `timer.ts` → `timer.test.ts`. [Source: docs/architecture.md#Testing-Strategy]

### Schema Evolution Reference

From `docs/architecture-v2.md`:

```typescript
// timer.ts additions
export type StepType = 'active' | 'wait' | 'checkpoint';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Schedule {
  enabled: boolean;
  days: DayOfWeek[];
  timeOfDay: TimeOfDay;
}

export interface Streak {
  currentCount: number;
  lastCompletedDate: string;  // YYYY-MM-DD
  startDate: string;          // YYYY-MM-DD
}
```

**Backward compatibility rules:**
- `Step.type` missing → treated as `'active'`
- `Step.targetTime` missing → not a Checkpoint
- `TimerTemplate.pauseBetweenSteps` missing → `false`
- `TimerTemplate.schedule` missing → not scheduled
- `TimerTemplate.streak` missing → no streak tracking
- `totalPlannedDuration` calculation: Checkpoint steps contribute 0 seconds (implemented in later stories)

### Existing Type Files

**`src/types/timer.ts` (current v1):**
```typescript
export interface Step {
  id: string;
  name: string;
  plannedDuration: number; // seconds
  notes?: string;
}

export interface TimerTemplate {
  id: string;
  name: string;
  description?: string;
  totalPlannedDuration: number;
  countdownMode: boolean;
  steps: Step[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
}

export type CreateTimerInput = Omit<TimerTemplate, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTimerInput = Partial<Omit<TimerTemplate, 'id' | 'createdAt'>>;
```

**`src/types/session.ts` (current v1):**
```typescript
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';
export type StepStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped';

export interface SessionStep {
  id: string;
  name: string;
  plannedDuration: number;
  originalPlannedDuration: number;
  elapsedTime: number;
  status: StepStatus;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface RunSession {
  id: string;
  timerId: string;
  timerName: string;
  status: SessionStatus;
  currentStepIndex: number;
  startedAt: Timestamp;
  pausedAt?: Timestamp;
  completedAt?: Timestamp;
  activeDeviceId: string;
  totalElapsedTime: number;
  countdownMode?: boolean;
  steps: SessionStep[];
}
```

### Firestore Index

The composite index on `sessions` is needed for Story 9.1 (suggestion algorithm queries last 5 completed sessions for a timer). Deploy early — Firestore index builds can take minutes to hours depending on data size.

```
Collection: users/{userId}/sessions
Fields: timerId ASC, status ASC, completedAt DESC
```

### References

- [Source: docs/architecture-v2.md#Schema-Evolution] — Full v2 schema with all new types
- [Source: docs/architecture-v2.md#ADR-7] — Clock time handling for Checkpoints
- [Source: docs/architecture-v2.md#ADR-8] — Suggestion algorithm (requires composite index)
- [Source: docs/architecture-v2.md#ADR-9] — Streak calculation on template document
- [Source: docs/architecture-v2.md#State-Machine-Evolution] — New session/step statuses
- [Source: docs/PRD-v2.md#FR14] — Step Types functional requirements
- [Source: docs/PRD-v2.md#Schema-Evolution] — Schema evolution section

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
