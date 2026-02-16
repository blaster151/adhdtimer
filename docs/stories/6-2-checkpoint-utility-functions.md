# Story 6.2: Checkpoint Utility Functions

Status: drafted

## Story

As a **developer**,
I want utility functions for parsing checkpoint target times and comparing them to the current clock,
So that checkpoint playback logic has a well-tested foundation.

## Acceptance Criteria

1. **AC1:** `parseTargetTime("07:30")` returns `{ hours: 7, minutes: 30 }`
2. **AC2:** `parseTargetTime("7:30")` returns `{ hours: 7, minutes: 30 }` (flexible parsing)
3. **AC3:** `parseTargetTime("25:00")` returns null (invalid input)
4. **AC4:** `getCheckpointStatus("07:30", now)` returns `{ status: 'ahead', diffMinutes: 4, message: '4 min early' }` when current time is 07:26
5. **AC5:** `getCheckpointStatus("07:30", now)` returns `{ status: 'behind', diffMinutes: 3, message: '3 min past' }` when current time is 07:33
6. **AC6:** `getCheckpointStatus("07:30", now)` returns `{ status: 'on-time', diffMinutes: 0, message: 'right on time' }` when current time is within ±1 minute
7. **AC7:** `formatClockTime("07:30")` returns locale-aware display (e.g., "7:30 AM" for en-US)
8. **AC8:** All functions are pure (no side effects) and accept optional `now` parameter for testability
9. **AC9:** Comprehensive test suite in `checkpoint.test.ts` with edge cases (midnight, noon, invalid formats)

## Tasks / Subtasks

- [ ] **Task 1: Create `src/lib/utils/checkpoint.ts`** (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [ ] Define `ParsedTime` interface: `{ hours: number; minutes: number }`
  - [ ] Define `CheckpointStatusResult` interface: `{ status: 'ahead' | 'on-time' | 'behind'; diffMinutes: number; message: string }`
  - [ ] Implement `parseTargetTime(timeStr: string): ParsedTime | null`
    - Parse formats: `"07:30"`, `"7:30"`, `"0730"` (optional colon)
    - Validate: hours 0–23, minutes 0–59
    - Return `null` for invalid input (don't throw)
  - [ ] Implement `getCheckpointStatus(targetTime: string, now?: Date): CheckpointStatusResult`
    - Parse `targetTime` via `parseTargetTime()`
    - Compare to `now ?? new Date()` — extract hours and minutes
    - Calculate diff in minutes: `(targetHours * 60 + targetMinutes) - (nowHours * 60 + nowMinutes)`
    - Handle midnight crossing: if absolute diff > 720 (12 hours), adjust direction
    - On-time threshold: `|diff| <= 1` minute
    - Build message: `"{N} min early"`, `"{N} min past"`, `"right on time"`
  - [ ] Implement `formatClockTime(timeStr: string, locale?: string): string`
    - Parse via `parseTargetTime()`
    - Use `Intl.DateTimeFormat` with `{ hour: 'numeric', minute: '2-digit' }` for locale-aware display
    - Default locale: `undefined` (uses browser default)
    - Return empty string for invalid input

- [ ] **Task 2: Create `src/lib/utils/checkpoint.test.ts`** (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  - [ ] **parseTargetTime tests:**
    - `"07:30"` → `{ hours: 7, minutes: 30 }`
    - `"7:30"` → `{ hours: 7, minutes: 30 }`
    - `"0730"` → `{ hours: 7, minutes: 30 }` (no colon)
    - `"23:59"` → `{ hours: 23, minutes: 59 }`
    - `"00:00"` → `{ hours: 0, minutes: 0 }`
    - `"25:00"` → `null`
    - `"12:60"` → `null`
    - `""` → `null`
    - `"abc"` → `null`
    - `"7"` → `null` (no minutes)
  - [ ] **getCheckpointStatus tests:**
    - 07:26 vs target 07:30 → `{ status: 'ahead', diffMinutes: 4, message: '4 min early' }`
    - 07:33 vs target 07:30 → `{ status: 'behind', diffMinutes: 3, message: '3 min past' }`
    - 07:30 vs target 07:30 → `{ status: 'on-time', diffMinutes: 0, message: 'right on time' }`
    - 07:31 vs target 07:30 → `{ status: 'on-time', ... }` (within ±1 min threshold)
    - 07:29 vs target 07:30 → `{ status: 'on-time', ... }` (within ±1 min threshold)
    - 12:00 vs target 12:00 → on-time (noon edge)
    - 23:50 vs target 00:15 → ahead (midnight crossing — 25 min ahead, not 23h35m behind)
    - Invalid target time → graceful handling (returns sensible default or throws)
  - [ ] **formatClockTime tests:**
    - `"07:30"` with en-US locale → contains "7:30" and "AM"
    - `"15:00"` with en-US locale → contains "3:00" and "PM"
    - `"00:00"` with en-US locale → contains "12:00" and "AM"
    - Invalid input → returns empty string

- [ ] **Task 3: Verify integration** (AC: 8)
  - [ ] Run `npx vitest run src/lib/utils/checkpoint.test.ts` — all tests pass
  - [ ] Run `npx vitest run` — all existing tests still pass
  - [ ] Verify no side effects — functions don't modify arguments, don't access `this`, don't touch DOM

## Dev Notes

### Architecture Patterns & Constraints

- **Pure utility functions:** All functions in `src/lib/utils/` must be pure — no side effects, fully typed, accept optional parameters for testability. [Source: docs/architecture.md#Code-Organization]
- **Naming:** kebab-case files, camelCase exports. [Source: docs/architecture.md#Naming-Conventions]
- **Test co-location:** `checkpoint.ts` → `checkpoint.test.ts` in same directory. [Source: docs/architecture.md#Testing-Strategy]
- **No barrel exports:** Import directly: `import { parseTargetTime } from '@/lib/utils/checkpoint'`. [Source: docs/architecture.md#Code-Organization]
- **Locale-aware display:** Use `Intl.DateTimeFormat` per ADR-7. [Source: docs/architecture-v2.md#ADR-7]

### Midnight Crossing Logic

The trickiest edge case is midnight crossing. Example:
- Target: `00:15` (12:15 AM)
- Current: `23:50` (11:50 PM)
- Naive diff: `(0*60 + 15) - (23*60 + 50)` = `15 - 1430` = `-1415` minutes (wrong!)
- Corrected: absolute diff > 720 (half a day) → adjust by adding 1440 (24h in minutes)
- Result: `-1415 + 1440 = 25` → user is 25 minutes ahead

This assumes checkpoints are within a ±12 hour window of "now", which is always true for morning/evening routines.

### ADR-7 Reference

Per ADR-7: Checkpoint `targetTime` is stored as `HH:MM` string (24h format). Comparison uses local device clock. No timezone library. `Intl.DateTimeFormat` for display only.

### Existing Utils Pattern

Follow the pattern of existing utils (`src/lib/utils/time.ts`, `src/lib/utils/pace.ts`):
- Named exports only
- Pure functions with typed parameters and return values
- Optional parameters for testability (e.g., `now?: Date`)
- Comprehensive test file covering happy paths, edge cases, and invalid input

### References

- [Source: docs/architecture-v2.md#ADR-7] — Clock Time for Checkpoints — No Timezone Library
- [Source: docs/architecture-v2.md#Checkpoint-Processing] — State machine Checkpoint processing flow
- [Source: docs/architecture-v2.md#Project-Structure] — `checkpoint.ts` in `src/lib/utils/`
- [Source: docs/architecture.md#Code-Organization] — Utility function patterns
- [Source: docs/PRD-v2.md#FR14.4] — Checkpoint displays ahead/on-time/behind status

---

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
