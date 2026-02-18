# Story 9.1: Suggestion Algorithm & Firestore Query

## Status: backlog

## Story

As a **developer**,
I want a pure suggestion algorithm and a Firestore query function for historical sessions,
So that the completion view can show data-driven duration suggestions.

## Background

This story creates the **foundation for the Learning Companion** feature — the v2 hero capability where "your plans learn from you."

After completing a timer, the app analyzes the last 3-5 sessions for the same timer and suggests duration adjustments when:
- **Sufficient data:** At least 3 completed sessions exist
- **Consistent deviation:** Average actual duration deviates from planned by ≥60 seconds (1 minute)
- **Same direction:** Majority (≥60%) of runs deviate in the same direction (all faster or all slower)

The algorithm is **pure** (no side effects, no Firestore calls) and operates on in-memory data. A separate Firestore query function fetches historical sessions for analysis.

## Acceptance Criteria

### Suggestion Algorithm (`src/lib/utils/suggestions.ts`)

**Given** `src/lib/utils/` directory
**When** `suggestions.ts` is created
**Then:**

1. **AC1:** `calculateSuggestions(currentSteps: Step[], historicalSessions: RunSession[], minSessions?: number, minDeviationSeconds?: number): Suggestion[]` returns an array of `Suggestion` objects
2. **AC2:** A `Suggestion` interface contains:
   ```typescript
   {
     stepId: string;
     stepName: string;
     currentDuration: number; // seconds
     suggestedDuration: number; // seconds, rounded to nearest 60
     averageActual: number; // seconds
     sampleSize: number; // number of sessions included
   }
   ```
3. **AC3:** `suggestedDuration` is rounded to the nearest 60 seconds (whole minutes only)
4. **AC4:** Suggestions are only generated when `|averageActual - currentDuration| >= minDeviationSeconds` (default: 60 seconds)
5. **AC5:** Default `minSessions` is 3 — suggestions require at least 3 historical sessions
6. **AC6:** Skipped steps are excluded from average calculation (status: `'skipped'`)
7. **AC7:** Deferred steps that were eventually completed ARE included (using `elapsedTime` from session step)
8. **AC8:** Checkpoint steps are excluded from suggestions entirely (they have 0 duration by design)
9. **AC9:** `calculateStepAverage(stepId: string, sessions: RunSession[]): number | null` returns the average elapsed time for a step across sessions, or `null` if insufficient data
10. **AC10:** Average calculation excludes outliers: if a step's elapsed time is >3 standard deviations from the mean, it's excluded (prevents one anomaly from skewing suggestions)

### Directional Consistency Check

**Given** a step has ≥3 historical completions
**When** calculating suggestions
**Then:**

11. **AC11:** Count how many sessions show `elapsedTime > plannedDuration` (overtime)
12. **AC12:** Count how many sessions show `elapsedTime < plannedDuration` (undertime)
13. **AC13:** Only generate a suggestion if ≥60% of sessions deviate in the same direction
14. **AC14:** Example: 5 sessions, 4 overtime, 1 undertime → suggestion generated (80% consistency)
15. **AC15:** Example: 5 sessions, 3 overtime, 2 undertime → suggestion generated (60% consistency)
16. **AC16:** Example: 4 sessions, 2 overtime, 2 undertime → NO suggestion (50% consistency, not enough)

### Edge Cases

17. **AC17:** If a step exists in the current timer but has NO historical data (new step), no suggestion is generated
18. **AC18:** If a step was renamed, suggestion matches by `stepId` (not name)
19. **AC19:** If all historical sessions for a step show status `'skipped'`, no suggestion is generated
20. **AC20:** If `historicalSessions` is empty or has <3 sessions, `calculateSuggestions` returns `[]` (empty array)
21. **AC21:** If `currentSteps` is empty, `calculateSuggestions` returns `[]`

### Firestore Query (`src/lib/firebase/sessions.ts`)

**Given** `src/lib/firebase/` directory
**When** `sessions.ts` is updated or created
**Then:**

22. **AC22:** `getCompletedSessionsForTimer(userId: string, timerId: string, limit?: number): Promise<RunSession[]>` queries Firestore:
   - Collection: `sessions`
   - Where: `userId == userId` AND `timerId == timerId` AND `status == 'completed'`
   - Order by: `completedAt` desc (most recent first)
   - Limit: default 5, configurable
23. **AC23:** Query uses the composite index created in Story 6.1: `sessions` on `timerId` ASC + `status` ASC + `completedAt` DESC
24. **AC24:** Returns typed `RunSession[]` (from `@/types/session`)
25. **AC25:** If query fails (network error, permission denied), throws error with descriptive message
26. **AC26:** If no sessions found, returns `[]` (empty array, not null)

### Test Coverage

**Given** `src/lib/utils/__tests__/` directory
**When** `suggestions.test.ts` is created
**Then:**

27. **AC27:** Tests cover:
   - Exact threshold match (59s deviation → no suggestion, 60s → suggestion)
   - Directional consistency (60% same direction → suggestion, 50% → no suggestion)
   - Sufficient sample size (2 sessions → no suggestion, 3 → suggestion)
   - Skipped steps excluded from average
   - Deferred-then-completed steps included
   - Checkpoint steps excluded entirely
   - Outlier exclusion (>3 standard deviations)
   - Rounding to nearest minute (e.g., 583s → 600s suggested)
   - Empty inputs (no sessions, no steps)
   - Renamed steps (match by ID)

28. **AC28:** Mock data includes realistic scenarios:
   - "Shower" planned 8 min, actual average 10 min over 5 sessions → suggest 10 min
   - "Read" planned 15 min, actual average 12 min over 4 sessions → suggest 12 min
   - "Exercise" planned 20 min, mixed results (2 over, 2 under) → no suggestion

## Technical Notes

### Type Definitions

```typescript
// src/lib/utils/suggestions.ts
export interface Suggestion {
  stepId: string;
  stepName: string;
  currentDuration: number; // seconds
  suggestedDuration: number; // seconds
  averageActual: number; // seconds
  sampleSize: number;
}

export function calculateSuggestions(
  currentSteps: Step[],
  historicalSessions: RunSession[],
  minSessions: number = 3,
  minDeviationSeconds: number = 60
): Suggestion[];

export function calculateStepAverage(
  stepId: string,
  sessions: RunSession[]
): number | null;
```

### Algorithm Pseudocode

```typescript
function calculateSuggestions(currentSteps, historicalSessions, minSessions = 3, minDeviationSeconds = 60) {
  if (historicalSessions.length < minSessions) return [];

  const suggestions: Suggestion[] = [];

  for (const step of currentSteps) {
    if (step.type === 'checkpoint') continue; // Skip checkpoints

    const completions = historicalSessions
      .flatMap(session => session.steps)
      .filter(sessionStep => sessionStep.stepId === step.id && sessionStep.status === 'completed');

    if (completions.length < minSessions) continue; // Not enough data

    const elapsedTimes = completions.map(s => s.elapsedTime);
    const average = calculateAverage(elapsedTimes, excludeOutliers = true);
    const deviation = Math.abs(average - step.plannedDuration);

    if (deviation < minDeviationSeconds) continue; // Within threshold

    // Check directional consistency
    const overtime = completions.filter(s => s.elapsedTime > step.plannedDuration).length;
    const undertime = completions.filter(s => s.elapsedTime < step.plannedDuration).length;
    const consistency = Math.max(overtime, undertime) / completions.length;

    if (consistency < 0.6) continue; // Not consistent enough

    suggestions.push({
      stepId: step.id,
      stepName: step.name,
      currentDuration: step.plannedDuration,
      suggestedDuration: Math.round(average / 60) * 60, // Round to nearest minute
      averageActual: average,
      sampleSize: completions.length,
    });
  }

  return suggestions;
}
```

### Outlier Detection (Standard Deviation)

```typescript
function calculateAverage(values: number[], excludeOutliers: boolean = false): number {
  if (!excludeOutliers) return values.reduce((sum, v) => sum + v, 0) / values.length;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const filtered = values.filter(v => Math.abs(v - mean) <= 3 * stdDev);
  return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
}
```

### Firestore Query Implementation

```typescript
// src/lib/firebase/sessions.ts
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { RunSession } from '@/types/session';

export async function getCompletedSessionsForTimer(
  userId: string,
  timerId: string,
  limitCount: number = 5
): Promise<RunSession[]> {
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    where('timerId', '==', timerId),
    where('status', '==', 'completed'),
    orderBy('completedAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RunSession));
}
```

### Testing Example

```typescript
// suggestions.test.ts
import { calculateSuggestions } from './suggestions';

test('suggests adjustment when average exceeds planned by 60+ seconds', () => {
  const currentSteps = [{ id: '1', name: 'Shower', plannedDuration: 480, type: 'active' }]; // 8 min
  const historicalSessions = [
    { steps: [{ stepId: '1', elapsedTime: 600, status: 'completed' }] }, // 10 min
    { steps: [{ stepId: '1', elapsedTime: 600, status: 'completed' }] }, // 10 min
    { steps: [{ stepId: '1', elapsedTime: 600, status: 'completed' }] }, // 10 min
  ];

  const suggestions = calculateSuggestions(currentSteps, historicalSessions);

  expect(suggestions).toHaveLength(1);
  expect(suggestions[0].suggestedDuration).toBe(600); // 10 min
});
```

## Prerequisites

Story 6.1 (Schema Evolution) must be complete — requires `Step`, `RunSession`, `StepStatus` types.

Story 8.4 or Epic 8 is recommended but not required — suggestions work independently of schedules/streaks.

## Testing Checklist

- [ ] Suggestions generate when deviation ≥60 seconds
- [ ] No suggestions when deviation <60 seconds
- [ ] Directional consistency filter works (≥60% same direction)
- [ ] Skipped steps excluded from average
- [ ] Checkpoint steps excluded entirely
- [ ] Deferred-then-completed steps included
- [ ] Outlier detection excludes >3σ values
- [ ] Rounding to nearest minute works correctly
- [ ] Edge cases: empty inputs, insufficient data, all skipped
- [ ] Firestore query returns correct sessions
- [ ] Firestore query uses composite index (check Cloud Console)

## Definition of Done

- [ ] All ACs pass
- [ ] `suggestions.ts` created with full implementation
- [ ] `suggestions.test.ts` with ≥90% coverage
- [ ] `getCompletedSessionsForTimer()` added to `sessions.ts`
- [ ] Integration test: fetch historical sessions → calculate suggestions
- [ ] Code review approved
- [ ] Merged to main branch
