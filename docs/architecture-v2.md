# ADHD Timer v2 — Architecture

_Created on 2026-02-16 by BMad_
_Extends v1 Architecture: `docs/architecture.md`_

---

## Executive Summary

v2 is a **brownfield evolution** of the existing Next.js 16 PWA. No new infrastructure, no new backends, no new third-party services. All changes are additive — new optional fields on existing Firestore documents, new client-side hooks, new UI components, and one new utility module for the suggestion algorithm.

**Key architectural changes:**
- Schema evolution (all new fields optional — zero migration)
- Timer engine state machine gains two new states: `waiting-for-advance` and `deferred`
- New utility module: `suggestions.ts` for the post-completion learning algorithm
- New utility module: `streaks.ts` for streak calculation
- New utility module: `vague-detect.ts` for client-side vague-task heuristics
- New utility module: `schedule.ts` for scheduling logic
- Extended Firestore query patterns (historical session queries for suggestions)
- 6 new hooks, 9+ new components, extending existing component tree

**What does NOT change:**
- Technology stack (Next.js 16, Firebase 12.9, Tailwind 4, shadcn/ui)
- Deployment pipeline (Cloud Build → Cloud Run)
- Security model (Firestore rules, client-side SDK, same user isolation)
- AI endpoint architecture (POST `/api/ai/breakdown` — reused for vague-task detection)
- All v1 ADRs remain in effect
- All v1 implementation patterns, naming conventions, and consistency rules remain

---

## Decision Summary — v2 Additions

| Category | Decision | Affects Features | Rationale |
|----------|----------|-----------------|-----------|
| Clock time handling | `Intl.DateTimeFormat` for locale-aware display; raw `Date` for comparison | FR14 (Checkpoints) | No new library; Checkpoint comparison is simple `Date.now()` vs target |
| Date handling (streaks) | Raw `Date` + custom `schedule.ts` utilities | FR17, FR18 | Consistent with ADR-4 (no date library); day comparison is simple |
| Suggestion algorithm | Client-side calculation in completion view | FR19 | Keeps it simple; data is already local from Firestore query |
| Vague-task detection | Client-side regex/heuristics first, AI call only on user action | FR21 | Saves API quota; pattern matching is instant |
| Schema evolution | All new fields optional with defaults | All | Zero migration; v1 data works unchanged |
| State machine | Extend existing `useTimerEngine` hook | FR15, FR16 | Single state machine source of truth; no parallel engine |

---

## New ADRs

### ADR-7: Clock Time for Checkpoints — No Timezone Library

**Decision:** Checkpoint `targetTime` stored as `HH:MM` string (24h format). Comparison uses local device clock via `new Date()`.

**Context:** Checkpoints compare "current time" to a target time like "7:30 AM". This introduces clock-time handling for the first time (v1 only dealt with durations).

**Rationale:**
- A morning routine's Checkpoint means "7:30 on this device" — timezone-agnostic by intent
- `new Date()` returns local device time — correct for personal routine tracking
- If user travels to a different timezone, their Checkpoint times should shift naturally (they want "local 7:30")
- No timezone conversion, no UTC storage, no `Intl.DateTimeFormat` for storage — just `HH:MM` string comparison
- Display formatting: `Intl.DateTimeFormat` with `{ hour: 'numeric', minute: '2-digit' }` for locale-aware rendering (12h/24h based on device)

**Consequences:**
- Checkpoints are device-local by design
- Cross-device sync works fine — both devices compare to their local clock (same timezone in practice)
- New utility function: `parseTargetTime(hhmm: string): { hours: number, minutes: number }`
- New utility function: `getCheckpointStatus(targetTime: string): { status: 'ahead' | 'on-time' | 'behind', diffMinutes: number }`

---

### ADR-8: Suggestion Algorithm — Client-Side, Read-Only Query

**Decision:** Calculate duration suggestions entirely client-side by querying the last 5 completed sessions for a timer from Firestore.

**Context:** FR19 requires comparing actual step durations against planned durations across multiple runs.

**Rationale:**
- Data is already in Firestore (`RunSession` documents with `SessionStep.elapsedTime`)
- Query: `users/{userId}/sessions` where `timerId == X`, `status == 'completed'`, order by `completedAt` desc, limit 5
- Calculation is simple (averages, standard deviation) — no server-side aggregation needed
- Running on completion (once per run) — not a hot path
- No new Firestore indexes beyond what's needed for the query (composite index on `timerId` + `status` + `completedAt`)

**Consequences:**
- 1 additional Firestore read query per timer completion (5 docs max)
- Suggestion logic lives in `src/lib/utils/suggestions.ts` — pure, testable, no side effects
- No Cloud Functions, no aggregation collection, no materialized views

---

### ADR-9: Streak Calculation — Client-Side on Template Document

**Decision:** Store streak metadata on the `TimerTemplate` document. Calculate streak validity client-side on app load.

**Context:** FR18 requires tracking consecutive days a scheduled routine is completed.

**Rationale:**
- Streak data is tiny (3 fields: `currentCount`, `lastCompletedDate`, `startDate`)
- Storing on the template avoids a separate collection query
- Validation on load: compare `lastCompletedDate` to today against schedule — if gap detected, reset `currentCount` to 0
- Write-on-completion: update streak fields atomically with the session completion
- No Cloud Functions, no scheduled jobs, no background processing

**Consequences:**
- Streak data may be stale if user doesn't open the app for days → validated on load
- Client-side calculation in `src/lib/utils/streaks.ts`
- Timer library component must call streak validation before rendering badges

---

### ADR-10: Vague-Task Detection — Heuristics First, AI On-Demand

**Decision:** Use client-side regex/heuristic patterns to detect vague step names. Only call the AI endpoint if the user explicitly taps "Break it down."

**Context:** FR21 requires detecting when a step name is too broad and offering to break it down.

**Rationale:**
- Client-side heuristics are free, instant (< 100ms), and require no API call
- False positives are low-cost (user just dismisses the suggestion)
- AI call only fires on explicit user action — preserves the 20/day rate limit
- Reuses the existing `/api/ai/breakdown` endpoint — no new API routes needed

**Consequences:**
- New utility: `src/lib/utils/vague-detect.ts` with `isVagueStepName(name: string): boolean`
- Heuristic patterns defined in code (not configurable in v2)
- AI breakdown generates sub-steps that replace the single vague step in the editor

---

## Schema Evolution

### TimerTemplate — Extended

```typescript
// src/types/timer.ts — v2 additions (all optional, backward compatible)

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

export interface Step {
  id: string;
  name: string;
  plannedDuration: number;     // seconds
  notes?: string;
  // v2 additions:
  type?: StepType;             // default 'active' (missing = active)
  targetTime?: string;         // HH:MM format, only for checkpoint steps
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
  // v2 additions:
  pauseBetweenSteps?: boolean;  // default false
  schedule?: Schedule;
  streak?: Streak;
}
```

**Backward compatibility:**
- `Step.type` missing → treated as `'active'`
- `Step.targetTime` missing → not a Checkpoint (validated: only present when `type === 'checkpoint'`)
- `TimerTemplate.pauseBetweenSteps` missing → `false`
- `TimerTemplate.schedule` missing → not scheduled
- `TimerTemplate.streak` missing → no streak tracking
- `totalPlannedDuration` calculation: Checkpoint steps contribute 0 seconds

### RunSession — Extended

```typescript
// src/types/session.ts — v2 additions (all optional, backward compatible)

export type SessionStatus = 
  | 'idle' 
  | 'running' 
  | 'paused' 
  | 'completed'
  | 'waiting-for-advance';  // v2: between steps when pauseBetweenSteps is on

export type StepStatus = 
  | 'pending' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'skipped'
  | 'deferred';  // v2: deferred to end of queue

export interface SessionStep {
  id: string;
  name: string;
  plannedDuration: number;
  originalPlannedDuration: number;
  elapsedTime: number;
  status: StepStatus;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  // v2 additions:
  type?: StepType;  // copied from template at session creation
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
  // v2 additions:
  deferredSteps?: string[];        // step IDs in deferral order
  pauseBetweenSteps?: boolean;     // copied from template at session creation
}
```

### Firestore Index Requirements

v2 requires one new composite index:

```
Collection: users/{userId}/sessions
Fields: timerId ASC, status ASC, completedAt DESC
Purpose: Suggestion algorithm — query last 5 completed sessions for a given timer
```

This should be added to `firestore.indexes.json`:

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
  ]
}
```

No security rule changes — the existing `users/{userId}/{document=**}` rule covers all new fields.

---

## State Machine Evolution

### v1 State Machine (unchanged)

```
Session:  idle → running ⇄ paused → completed
Step:     pending → running ⇄ paused → completed | skipped
```

### v2 State Machine (extended)

```
Session:  idle → running ⇄ paused → completed
                    ↕
          waiting-for-advance
                    ↕
                 running

Step:     pending → running ⇄ paused → completed | skipped
                      ↓
                   deferred → (re-queued as pending at end)
```

### State Transitions — New in v2

| From | Event | To | Condition |
|------|-------|----|-----------|
| `running` (session) | Step completes | `waiting-for-advance` | `pauseBetweenSteps === true` AND next step is not a Wait/Checkpoint |
| `waiting-for-advance` | User taps "Start" | `running` | Always |
| `waiting-for-advance` | User taps "Skip" | `running` or `waiting-for-advance` | Skips next step, may advance or wait again |
| `waiting-for-advance` | User taps "Stop" | `completed` | Always |
| `running` (step) | User taps "Defer" | `deferred` | Step is Active or Wait (not Checkpoint) |
| `deferred` | All main steps complete | `pending` (re-queued) | Deferred steps presented in order |
| `running` (session) | Checkpoint reached | (stay `running`) | Checkpoint displays, immediately advances |

### Waiting-for-Advance Behavior

```
[Step N completes]
  → pauseBetweenSteps?
    → YES:
      → Is next step a Checkpoint?
        → YES: Display Checkpoint → then show waiting-for-advance for step AFTER Checkpoint
        → NO:
          → Is next step a Wait?
            → YES: Start Wait auto-advance (no manual advance needed for Waits)
            → After Wait completes → waiting-for-advance for next step
            → NO: Enter waiting-for-advance
              → Session status = 'waiting-for-advance'
              → Time NOT counting
              → Display "Next: [Step Name]. Start."
              → User taps Start → step begins, session status = 'running'
    → NO: Auto-advance as v1
```

### Deferred Step Processing

```
[Current step index advances past last non-deferred step]
  → deferredSteps array empty?
    → YES: Timer completes normally
    → NO:
      → Pop first deferred step ID from array
      → Set that step status back to 'pending'
      → Set currentStepIndex to that step's position
      → TTS: "All main steps done. You deferred [Name]. Ready?"
      → If pauseBetweenSteps: show waiting-for-advance
      → If not: start step automatically
      → User can: Run, Skip, or Defer again (re-append to array)
```

### Checkpoint Processing

```
[Timer engine reaches a Checkpoint step]
  → Read step.targetTime (HH:MM)
  → Compare to Date.now() local time
  → Calculate diff in minutes
  → Set step status = 'completed' (zero duration — instant)
  → Set step elapsedTime = 0
  → Display status: ahead / on-time / behind
  → TTS: "[Checkpoint Name]. [Status message]."
  → Auto-advance to next step (no delay in state machine; UI shows briefly)
```

---

## Project Structure — v2 Additions

New files only. All existing files remain in place.

```
src/
├── components/
│   ├── timer/
│   │   ├── step-type-selector.tsx      # Compact dropdown: Active/Wait/Checkpoint
│   │   ├── checkpoint-time-picker.tsx   # HH:MM time input for Checkpoint steps
│   │   ├── schedule-section.tsx         # Collapsible schedule config (days, time-of-day)
│   │   └── vague-task-suggestion.tsx    # Inline "break it down?" suggestion
│   ├── session/
│   │   ├── defer-button.tsx             # "Defer" ghost button in playback controls
│   │   ├── deferred-badge.tsx           # "N deferred ↩" indicator
│   │   ├── deferred-resolution.tsx      # "You deferred X. Ready?" prompt
│   │   ├── manual-advance-button.tsx    # "▶ Start [Step Name]" full-width button
│   │   ├── suggestion-card.tsx          # Individual duration suggestion card
│   │   ├── suggestion-section.tsx       # "Suggested Tweaks" section in completion
│   │   ├── streak-badge.tsx             # "Day N ☕" badge component
│   │   └── reminder-overlay.tsx         # "You're working on [X]" gentle nudge
│   └── library/
│       └── due-today-section.tsx         # "DUE TODAY" section in timer library
├── hooks/
│   ├── use-suggestions.ts               # Queries history, calculates suggestions
│   ├── use-streak.ts                    # Streak validation + update logic
│   ├── use-schedule.ts                  # Schedule awareness (due today, time-of-day)
│   ├── use-vague-detect.ts              # Debounced vague-task detection for editor
│   ├── use-reminder.ts                  # Midpoint/overrun reminder timing
│   └── use-checkpoint.ts               # Checkpoint clock comparison
├── lib/
│   └── utils/
│       ├── suggestions.ts               # Pure: suggestion algorithm (averages, thresholds)
│       ├── suggestions.test.ts          # Tests for suggestion algorithm
│       ├── streaks.ts                   # Pure: streak calculation, validation, reset
│       ├── streaks.test.ts              # Tests for streak logic
│       ├── schedule.ts                  # Pure: isDueToday, getTimeOfDayBucket, dayMatches
│       ├── schedule.test.ts             # Tests for schedule utilities
│       ├── vague-detect.ts              # Pure: isVagueStepName heuristics
│       ├── vague-detect.test.ts         # Tests for vague detection patterns
│       └── checkpoint.ts               # Pure: parseTargetTime, getCheckpointStatus
│       └── checkpoint.test.ts          # Tests for checkpoint utilities
└── types/
    └── (timer.ts and session.ts updated in-place — see Schema Evolution above)
```

### Modified Existing Files

| File | Changes |
|------|---------|
| `src/types/timer.ts` | Add `StepType`, `DayOfWeek`, `TimeOfDay`, `Schedule`, `Streak` types. Extend `Step` and `TimerTemplate` interfaces. |
| `src/types/session.ts` | Add `'waiting-for-advance'` to `SessionStatus`, `'deferred'` to `StepStatus`. Extend `SessionStep` and `RunSession`. |
| `src/hooks/use-timer-engine.ts` | Add `waiting-for-advance` state, defer logic, checkpoint processing, manual advance, reminder triggers |
| `src/components/session/playback-controls.tsx` | Add Defer button, conditional manual advance button |
| `src/components/session/step-dots.tsx` | Add type-aware shapes (diamond for Checkpoint), deferred styling |
| `src/components/session/completion-view.tsx` | Add suggestion section, deferred step summary |
| `src/components/session/progress-ring.tsx` | Add Wait step ring color (`--wait`), Checkpoint flash |
| `src/components/session/running-timer.tsx` | Orchestrate new states, reminder overlay, checkpoint display |
| `src/components/session/transition-overlay.tsx` | Handle Wait → next transition message, Checkpoint status message |
| `src/components/timer/timer-form.tsx` | Add pause-between-steps toggle, schedule section |
| `src/components/timer/step-list-editor.tsx` | Add type selector per step row, integrate vague-task suggestion |
| `src/components/timer/timer-library.tsx` | Add "Due Today" section, streak badges on cards |
| `src/components/timer/timer-card.tsx` | Add streak badge, "✓ Done" badge, time-of-day icon |
| `src/components/layout/settings-sheet.tsx` | Add "Step reminders" toggle + threshold, "Show streaks" toggle |
| `src/lib/firebase/sessions.ts` | Add `getCompletedSessionsForTimer()` query function |
| `src/lib/firebase/timers.ts` | Add `updateStepDurations()` for accepting suggestions, streak update helpers |
| `src/lib/utils/time.ts` | Add `formatClockTime()` for Checkpoint display |
| `src/lib/utils/pace.ts` | Add checkpoint pace comparison helper |
| `src/styles/globals.css` | Add `--wait`, `--checkpoint`, `--deferred`, `--streak`, `--suggestion` CSS custom properties |
| `firestore.indexes.json` | Add composite index for suggestion query |

---

## New Integration Points

### Suggestion Algorithm — Data Flow

```
[Timer completes → completion-view.tsx mounts]
  → useSuggestions(timerId) hook fires
    → Calls getCompletedSessionsForTimer(userId, timerId, limit=5)
      → Firestore query: sessions where timerId=X, status='completed', 
        orderBy completedAt desc, limit 5
    → Returns SessionStep[] arrays from each historical session
  → suggestions.ts.calculateSuggestions(currentSteps, historicalSessions)
    → For each step:
      → Filter out skipped steps from history
      → Calculate rolling average of elapsedTime across sessions
      → Compare average to plannedDuration
      → If |diff| >= 60 seconds AND direction is consistent:
        → Generate suggestion: { stepId, stepName, currentDuration, suggestedDuration, avgActual }
    → Return Suggestion[] (may be empty)
  → suggestion-section.tsx renders cards
  → User taps "Accept":
    → updateStepDurations(timerId, [{ stepId, newDuration }])
      → Firestore: update timer doc with new step durations + recalculated totalPlannedDuration
  → User taps "Dismiss": card removed from UI (no persistence)
```

### Streak Update — Data Flow

```
[Timer completes → session marked 'completed']
  → Is timer scheduled? (template.schedule?.enabled === true)
    → NO: skip streak logic
    → YES:
      → streaks.ts.calculateStreakUpdate(currentStreak, schedule, completionDate)
        → Is today a scheduled day?
          → NO: no streak change
          → YES:
            → Was lastCompletedDate yesterday (or last scheduled day)?
              → YES: increment currentCount
              → NO: reset to 1 (fresh start)
        → Return updated Streak object
      → Write updated streak to TimerTemplate document
      → Show streak toast if milestone (Day 7, 14, 30, 100)

[App opens → timer-library.tsx mounts]
  → For each scheduled timer:
    → streaks.ts.validateStreak(currentStreak, schedule, today)
      → Has a scheduled day been missed since lastCompletedDate?
        → YES: reset currentCount to 0, clear startDate
        → NO: streak is valid
    → Update template if streak was invalidated
```

### Schedule Awareness — Data Flow

```
[timer-library.tsx mounts]
  → useSchedule() hook
    → Get all user timers (already loaded)
    → For each timer with schedule?.enabled === true:
      → schedule.ts.isDueToday(schedule, today)
        → Check if today's weekday is in schedule.days
      → schedule.ts.getTimeOfDayBucket(now)
        → Returns 'morning' | 'afternoon' | 'evening' based on current hour
      → schedule.ts.isCompletedToday(timerId, sessions)
        → Check if any completed session for this timer has completedAt today
    → Return { dueToday: TimerTemplate[], completedToday: string[] }
  → due-today-section.tsx renders if dueToday is non-empty
```

### Checkpoint Comparison — Data Flow

```
[Timer engine reaches Checkpoint step]
  → checkpoint.ts.parseTargetTime(step.targetTime)
    → Returns { hours: number, minutes: number }
  → checkpoint.ts.getCheckpointStatus(targetTime)
    → now = new Date()
    → target = new Date(now) with hours/minutes set from targetTime
    → diff = (target.getTime() - now.getTime()) / 60000  // minutes
    → if diff > 1: return { status: 'ahead', diffMinutes: Math.abs(diff) }
    → if diff < -1: return { status: 'behind', diffMinutes: Math.abs(diff) }
    → return { status: 'on-time', diffMinutes: 0 }
  → useCheckpoint() hook provides reactive status for UI
  → progress-ring.tsx shows checkpoint gold flash
  → transition-overlay.tsx shows status message
  → TTS speaks status
  → Engine auto-advances after UI display (3-4 second hold via setTimeout)
```

### Vague-Task Detection — Data Flow

```
[step-list-editor.tsx: step name input onBlur]
  → useVagueDetect(stepName) hook
    → vague-detect.ts.isVagueStepName(stepName)
      → Check against pattern list:
        → Single generic word: /^(work|clean|organize|stuff|things|chores|errands)$/i
        → Broad scope phrases: /(clean|organize|work on|do) (the |my )?(house|room|project|homework)/i
        → Very long (>60 chars) — sentence-like
        → Very short (1-2 chars) — likely incomplete (don't flag, just ignore)
      → Return boolean
    → If true: show vague-task-suggestion.tsx below the step row
  → User taps "Break it down ✨":
    → Call existing /api/ai/breakdown with step name
    → Replace single step with generated substeps in the step list
  → User taps "No thanks":
    → Hide suggestion (no persistence)
```

### Gentle Reminder — Data Flow

```
[running-timer.tsx: step is running]
  → useReminder(step, settings) hook
    → Check: is step Active? (not Wait, not Checkpoint)
    → Check: is step.plannedDuration >= reminderThreshold?
      → NO: no reminder
      → YES:
        → Calculate midpoint = plannedDuration / 2
        → Set timeout for midpoint: show reminder
        → If step overruns (elapsedTime > plannedDuration):
          → Set interval for every overrunInterval minutes
    → Return { showReminder: boolean, reminderText: string }
  → reminder-overlay.tsx renders when showReminder is true
    → Pill overlay above ring: "You're working on [Step Name]"
    → Fades in/out over 3 seconds (or instant with prefers-reduced-motion)
    → TTS: same text
```

---

## New Utility Modules — Detailed Design

### `src/lib/utils/suggestions.ts`

```typescript
export interface Suggestion {
  stepId: string;
  stepName: string;
  currentDuration: number;    // seconds
  suggestedDuration: number;  // seconds (rounded to nearest 60)
  averageActual: number;      // seconds
}

/**
 * Calculate duration suggestions based on historical run data.
 * Returns suggestions only for steps with consistent deviations ≥ 60s.
 */
export function calculateSuggestions(
  currentSteps: SessionStep[],
  historicalSessions: RunSession[],
  minSessions?: number,          // default 3
  minDeviationSeconds?: number,  // default 60
): Suggestion[];

/**
 * Calculate the average elapsed time for a given step across sessions.
 * Excludes skipped sessions. Includes deferred-then-completed.
 */
export function calculateStepAverage(
  stepId: string,
  sessions: RunSession[],
): number | null;  // null if insufficient data
```

### `src/lib/utils/streaks.ts`

```typescript
import type { Schedule, Streak } from '@/types/timer';

export interface StreakUpdate {
  streak: Streak;
  isNewMilestone: boolean;
  milestoneMessage?: string;  // "One week ☕", etc.
}

/**
 * Validate and update streak after a routine completion.
 * Returns updated streak and whether a milestone was hit.
 */
export function calculateStreakUpdate(
  currentStreak: Streak | undefined,
  schedule: Schedule,
  completionDate: string,  // YYYY-MM-DD
): StreakUpdate;

/**
 * Validate a streak on app load — check for missed scheduled days.
 * Returns null if streak is still valid, or a reset Streak if days were missed.
 */
export function validateStreak(
  currentStreak: Streak | undefined,
  schedule: Schedule,
  today: string,  // YYYY-MM-DD
): Streak | null;

/**
 * Check if a given date is a scheduled day.
 */
export function isScheduledDay(
  schedule: Schedule,
  date: string,  // YYYY-MM-DD
): boolean;

/**
 * Get the previous scheduled day before a given date.
 * Used for gap detection.
 */
export function getPreviousScheduledDay(
  schedule: Schedule,
  date: string,  // YYYY-MM-DD
): string;  // YYYY-MM-DD
```

### `src/lib/utils/schedule.ts`

```typescript
import type { Schedule, TimerTemplate } from '@/types/timer';

export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening';

/**
 * Check if a timer is due today based on its schedule.
 */
export function isDueToday(
  schedule: Schedule,
  today?: Date,  // defaults to new Date()
): boolean;

/**
 * Get the current time-of-day bucket.
 * Morning: before 12:00, Afternoon: 12:00-17:00, Evening: after 17:00
 */
export function getTimeOfDayBucket(now?: Date): TimeOfDayBucket;

/**
 * Check if the time-of-day matches the schedule's timeOfDay setting.
 * 'anytime' always matches.
 */
export function isTimeOfDayMatch(
  schedule: Schedule,
  now?: Date,
): boolean;

/**
 * Sort timers for library display: due-today first, then by lastUsedAt.
 */
export function sortTimersForLibrary(
  timers: TimerTemplate[],
  completedTodayIds: Set<string>,
  today?: Date,
): { dueToday: TimerTemplate[]; rest: TimerTemplate[] };
```

### `src/lib/utils/vague-detect.ts`

```typescript
/**
 * Check if a step name is likely too vague/broad.
 * Uses client-side heuristics only — no AI call.
 */
export function isVagueStepName(name: string): boolean;

/**
 * Internal: list of patterns that indicate vagueness.
 * Exported for testing.
 */
export const VAGUE_PATTERNS: RegExp[];
```

### `src/lib/utils/checkpoint.ts`

```typescript
export type CheckpointStatus = 'ahead' | 'on-time' | 'behind';

export interface CheckpointResult {
  status: CheckpointStatus;
  diffMinutes: number;  // always positive
  message: string;      // "4 minutes early", "right on time", "3 minutes past"
}

/**
 * Parse a target time string (HH:MM) into hours and minutes.
 */
export function parseTargetTime(hhmm: string): { hours: number; minutes: number };

/**
 * Compare current clock time to a checkpoint target.
 * On-time threshold: ±1 minute.
 */
export function getCheckpointStatus(
  targetTime: string,  // HH:MM
  now?: Date,          // defaults to new Date()
): CheckpointResult;

/**
 * Format a clock time for display using device locale.
 * Returns "7:30 AM" or "07:30" based on user's locale.
 */
export function formatClockTime(hhmm: string): string;
```

---

## New Hooks — Detailed Design

### `use-suggestions.ts`

```typescript
/**
 * Fetch historical sessions and calculate suggestions for the completion view.
 * Runs once on mount. Returns suggestions + loading state.
 */
export function useSuggestions(timerId: string): {
  suggestions: Suggestion[];
  isLoading: boolean;
  acceptSuggestion: (stepId: string) => Promise<void>;
  dismissSuggestion: (stepId: string) => void;
  acceptAll: () => Promise<void>;
  dismissAll: () => void;
};
```

### `use-streak.ts`

```typescript
/**
 * Manage streak for a specific timer.
 * Validates on mount, provides update function.
 */
export function useStreak(timer: TimerTemplate): {
  streak: Streak | null;
  updateStreakOnCompletion: () => Promise<StreakUpdate>;
};
```

### `use-schedule.ts`

```typescript
/**
 * Schedule awareness for the timer library.
 * Determines which timers are due today.
 */
export function useSchedule(timers: TimerTemplate[]): {
  dueToday: TimerTemplate[];
  completedToday: Set<string>;
  isLoading: boolean;
};
```

### `use-vague-detect.ts`

```typescript
/**
 * Debounced vague-task detection for a step name input.
 * Returns whether the name is vague (with 500ms debounce on changes).
 */
export function useVagueDetect(stepName: string): {
  isVague: boolean;
  isDismissed: boolean;
  dismiss: () => void;
};
```

### `use-reminder.ts`

```typescript
/**
 * Manages gentle step reminders during playback.
 * Fires at midpoint and during overruns based on user settings.
 */
export function useReminder(
  step: SessionStep | null,
  isRunning: boolean,
  settings: { enabled: boolean; thresholdMinutes: number },
): {
  showReminder: boolean;
  reminderText: string;
};
```

### `use-checkpoint.ts`

```typescript
/**
 * Provides checkpoint status comparison for the running timer.
 */
export function useCheckpoint(
  step: SessionStep | null,
): {
  isCheckpoint: boolean;
  status: CheckpointResult | null;
};
```

---

## Epic-to-Architecture Mapping (v2)

| Epic | Primary Modules | Key New Components | Key New Hooks | Key New Utils |
|------|----------------|-------------------|--------------|--------------|
| **Step Types** | `types/`, `hooks/use-timer-engine`, `components/timer/`, `components/session/` | StepTypeSelector, CheckpointTimePicker | useCheckpoint | checkpoint.ts |
| **Playback Evolution** | `hooks/use-timer-engine`, `components/session/` | DeferButton, DeferredBadge, DeferredResolution, ManualAdvanceButton | useReminder | — |
| **Routines & Habits** | `types/`, `lib/firebase/timers`, `components/timer/`, `components/library/` | ScheduleSection, DueTodaySection, StreakBadge | useSchedule, useStreak | schedule.ts, streaks.ts |
| **Learning Companion** | `lib/firebase/sessions`, `components/session/` | SuggestionCard, SuggestionSection, ReminderOverlay | useSuggestions, useReminder | suggestions.ts |
| **Smarter AI** | `components/timer/`, `lib/utils/` | VagueTaskSuggestion | useVagueDetect | vague-detect.ts |

---

## Performance Considerations — v2

| Concern | Strategy | Target |
|---------|----------|--------|
| Suggestion query | Firestore composite index; limit 5 docs; runs once on completion | < 2s total |
| Streak validation | Client-side date comparison; runs once on library load | < 500ms |
| Schedule awareness | Client-side filter over already-loaded timers; no extra queries | < 100ms |
| Vague-task detection | Client-side regex; debounced 500ms; no API call | < 100ms |
| Checkpoint comparison | Single `Date.now()` comparison; no query | < 1ms |
| Reminder timer | `setTimeout`-based; cleared on step change/pause | No perf concern |
| Deferred step processing | Array manipulation in memory; Firestore write on transition | < 50ms |
| New CSS tokens | 5 new CSS custom properties; no bundle impact | 0 |
| New components | Code-split per route; only loaded when relevant route is active | No bundle regression |

---

## Testing Strategy — v2 Additions

All v1 testing patterns remain. New test requirements:

| Module | Test Type | Key Test Cases |
|--------|-----------|---------------|
| `suggestions.ts` | Unit (Vitest) | Average calculation, threshold detection, skipped step exclusion, deferred step inclusion, empty history, < 3 sessions |
| `streaks.ts` | Unit (Vitest) | Increment, reset on missed day, weekend gap (weekday schedule), milestone detection, fresh start, edge: schedule change |
| `schedule.ts` | Unit (Vitest) | isDueToday for each weekday, time-of-day buckets, 'anytime' matches, empty schedule |
| `vague-detect.ts` | Unit (Vitest) | Known vague names, known specific names, edge cases (empty, very short, emoji) |
| `checkpoint.ts` | Unit (Vitest) | Ahead/behind/on-time, midnight edge, parse valid/invalid HH:MM, locale formatting |
| `use-timer-engine.ts` | Unit (Vitest) | Defer flow, manual advance flow, checkpoint auto-advance, Wait auto-advance, deferred resolution, combined scenarios |
| `use-suggestions.ts` | Integration (Vitest + mock) | Firestore query mock, suggestion calculation, accept/dismiss actions |
| `completion-view.tsx` | Component (RTL) | Renders suggestions when available, accept updates template, dismiss removes card |
| `step-list-editor.tsx` | Component (RTL) | Type selector changes input type, Checkpoint shows time picker, vague suggestion appears |
| `timer-library.tsx` | Component (RTL) | Due-today section renders, streak badges appear, completed-today badge |

---

## Consistency Rules — v2 Additions

### Date/Time Handling (v2 extensions to v1 table)

| Context | Format | Library |
|---------|--------|---------|
| Checkpoint targetTime storage | `HH:MM` string (24h) | None — string |
| Checkpoint targetTime display | Locale-aware (12h/24h) | `Intl.DateTimeFormat` |
| Schedule days | Lowercase weekday abbreviations | None — string literals |
| Streak dates | `YYYY-MM-DD` string | None — `Date.toISOString().slice(0, 10)` |
| Day-of-week comparison | `Date.getDay()` → mapped to `DayOfWeek` type | Custom `getDayOfWeek()` in `schedule.ts` |

### New Utility Functions Summary

| Function | Module | Pure? | Async? |
|----------|--------|-------|--------|
| `calculateSuggestions()` | suggestions.ts | ✅ | ❌ |
| `calculateStepAverage()` | suggestions.ts | ✅ | ❌ |
| `calculateStreakUpdate()` | streaks.ts | ✅ | ❌ |
| `validateStreak()` | streaks.ts | ✅ | ❌ |
| `isScheduledDay()` | streaks.ts | ✅ | ❌ |
| `isDueToday()` | schedule.ts | ✅ | ❌ |
| `getTimeOfDayBucket()` | schedule.ts | ✅ | ❌ |
| `sortTimersForLibrary()` | schedule.ts | ✅ | ❌ |
| `isVagueStepName()` | vague-detect.ts | ✅ | ❌ |
| `parseTargetTime()` | checkpoint.ts | ✅ | ❌ |
| `getCheckpointStatus()` | checkpoint.ts | ✅ | ❌ |
| `formatClockTime()` | checkpoint.ts | ✅ | ❌ |

All new utility functions are pure and synchronous — fully testable with no mocking required.

---

## Migration Strategy

**There is no migration.** All schema changes are additive optional fields. Existing v1 documents work unchanged:

| Existing v1 Data | v2 Behavior |
|-----------------|-------------|
| Steps without `type` field | Treated as `'active'` |
| Templates without `pauseBetweenSteps` | Defaults to `false` |
| Templates without `schedule` | Not scheduled, no "Due Today", no streak |
| Templates without `streak` | No streak badge displayed |
| Sessions without `deferredSteps` | No deferred step processing |
| Sessions without `pauseBetweenSteps` | No manual advance |
| SessionSteps without `type` | Treated as `'active'` |

**Firestore index:** The new composite index must be deployed before the suggestion feature ships:
```bash
firebase deploy --only firestore:indexes
```

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-14 | 1.0 | Initial Architecture (v1 MVP) | BMad |
| 2026-02-16 | 2.0 | v2 Architecture — schema evolution, state machine extensions, new modules, new ADRs | BMad |

---

_This v2 Architecture document extends the v1 architecture with schema evolution, state machine changes, and new module designs for 8 features. All v1 patterns, ADRs, and conventions remain in full effect._

_Next: Gate Check to validate readiness, then Epic & Story Breakdown._
