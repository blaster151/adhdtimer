# Story 9.2: Suggestion UI in Completion View

## Status: backlog

## Story

As a **user**,
I want to see duration adjustment suggestions when I complete a routine with 3+ prior runs,
So that my timers get better over time without manual effort.

## Background

This story brings the **Learning Companion** feature to life visually. After completing a timer, the completion view shows a "Suggested Tweaks" section with data-driven duration adjustments.

Each suggestion shows:
- Step name
- Current → suggested duration (in minutes)
- Average actual duration (in muted text)
- "Accept" and "Dismiss" actions

Accepting a suggestion updates the step's `plannedDuration` on the TimerTemplate document immediately. Users can accept individual suggestions or bulk-accept all at once.

The section only appears when there are actionable suggestions — no empty states, no noise.

## Acceptance Criteria

### Suggestion Section Display

**Given** I complete a timer that has 3+ prior completed sessions
**When** the completion view loads
**Then:**

1. **AC1:** "Suggested Tweaks" section appears below the existing step summary
2. **AC2:** Section header: "☕ Suggested Tweaks" with subtext "Based on your last N runs:" (N = number of sessions analyzed)
3. **AC3:** Section uses `--suggestion` color (`#6BB5A0`) for header icon/accent
4. **AC4:** Section spacing: 24px gap above, 16px padding inside
5. **AC5:** If no suggestions are generated, section does NOT appear (completion view is identical to v1)

### Suggestion Card

**Given** a suggestion is displayed
**When** I view the suggestion card
**Then:**

6. **AC6:** Each suggestion is a card with:
   - Step name (bold, 16px)
   - Current → suggested duration (e.g., "8 min → 10 min")
   - Average actual below in muted text (e.g., "Averaged 9:42 over 5 runs")
   - "Accept" button (primary, small)
   - "Dismiss" button (ghost, small)
7. **AC7:** Arrow uses → symbol (not ASCII `->`)
8. **AC8:** Duration format: whole minutes only (e.g., "8 min", not "8:00")
9. **AC9:** Average actual shows minutes:seconds (e.g., "9:42")
10. **AC10:** Cards are stacked vertically with 12px gap between

### Individual Actions

**Given** I view a suggestion card
**When** I tap "Accept"
**Then:**

11. **AC11:** Card collapses smoothly (0.3s transition) with ✓ checkmark appearing
12. **AC12:** Brief green flash (`--on-track` color, 200ms) on the card background
13. **AC13:** Step's `plannedDuration` is updated on the TimerTemplate document in Firestore
14. **AC14:** `totalPlannedDuration` is recalculated and updated on the TimerTemplate
15. **AC15:** ARIA announcement: "[Step Name] adjusted to [N] minutes"
16. **AC16:** Button becomes disabled with loading spinner during update
17. **AC17:** Error handling: if Firestore write fails, show error toast and revert card state

**Given** I view a suggestion card
**When** I tap "Dismiss"
**Then:**

18. **AC18:** Card fades out smoothly (0.3s transition) and is removed from the DOM
19. **AC19:** No Firestore write occurs (dismiss is client-side only)
20. **AC20:** ARIA announcement: "Suggestion for [Step Name] dismissed"
21. **AC21:** Dismissed suggestion does NOT reappear on next completion of the same timer (persisted in localStorage for 30 days)

### Bulk Actions

**Given** multiple suggestions are displayed
**When** I view the bottom of the suggestion section
**Then:**

22. **AC22:** "Accept All" button appears (primary, full-width or prominent)
23. **AC23:** "Dismiss All" button appears (ghost, next to Accept All)
24. **AC24:** Bulk action buttons are disabled if all suggestions have been individually accepted/dismissed

**Given** I tap "Accept All"
**When** the action processes
**Then:**

25. **AC25:** All suggestion cards collapse sequentially with staggered animation (100ms delay between each)
26. **AC26:** All accepted changes are batched into a single Firestore write (atomic update)
27. **AC27:** `totalPlannedDuration` is recalculated once for all changes
28. **AC28:** ARIA announcement: "All suggestions applied"
29. **AC29:** Loading state shows on "Accept All" button during write

**Given** I tap "Dismiss All"
**When** the action processes
**Then:**

30. **AC30:** All suggestion cards fade out sequentially with staggered animation
31. **AC31:** All dismissals are persisted to localStorage (timer-specific)
32. **AC32:** ARIA announcement: "All suggestions dismissed"

### On-Track Message

**Given** a timer has 3+ prior completed sessions
**When** the completion view loads and NO steps meet the deviation threshold
**Then:**

33. **AC33:** A single line displays: "✓ Your durations are on track — no tweaks needed."
34. **AC34:** Message uses `--muted` color and smaller font size (14px)
35. **AC35:** Message appears in place of the suggestion section (same vertical position)
36. **AC36:** No action buttons appear

### Edge Cases

37. **AC37:** If a timer has fewer than 3 prior completed sessions, no suggestion section appears (completion view is identical to v1)
38. **AC38:** If all suggestions are for Checkpoint steps, no section appears (Checkpoints excluded by algorithm)
39. **AC39:** If Firestore write fails for Accept All, partial updates are rolled back (all-or-nothing)
40. **AC40:** Dismissed suggestions are stored per-timer in localStorage: key = `dismissed-suggestions-${timerId}`, value = `{ [stepId]: timestamp }`
41. **AC41:** Dismissed suggestions older than 30 days are ignored (re-shown if still valid)

## Technical Notes

### New Hook
- `src/hooks/use-suggestions.ts`
  - `useSuggestions(timer: TimerTemplate, userId: string)`
  - Calls `getCompletedSessionsForTimer()` on mount
  - Calls `calculateSuggestions()` with current steps + historical sessions
  - Provides: `suggestions`, `acceptSuggestion(stepId)`, `dismissSuggestion(stepId)`, `acceptAll()`, `dismissAll()`
  - Manages loading/error states for Firestore writes
  - Reads/writes dismissed suggestions to localStorage

### New Components
- `src/components/completion/suggestion-section.tsx` — Section wrapper with header + bulk actions
- `src/components/completion/suggestion-card.tsx` — Individual suggestion card with Accept/Dismiss
- `src/components/completion/on-track-message.tsx` — Static message when no suggestions

### Modifications
- `src/components/completion/completion-view.tsx` — Integrate SuggestionSection conditionally below step summary

### Firestore Update (Single Suggestion)
```typescript
async function acceptSuggestion(suggestion: Suggestion) {
  const stepIndex = timer.steps.findIndex(s => s.id === suggestion.stepId);
  if (stepIndex === -1) return;

  const updatedSteps = [...timer.steps];
  updatedSteps[stepIndex] = {
    ...updatedSteps[stepIndex],
    plannedDuration: suggestion.suggestedDuration,
  };

  const newTotalDuration = updatedSteps.reduce((sum, s) => sum + (s.type === 'checkpoint' ? 0 : s.plannedDuration), 0);

  const timerRef = doc(db, 'timers', timer.id);
  await updateDoc(timerRef, {
    steps: updatedSteps,
    totalPlannedDuration: newTotalDuration,
  });
}
```

### Firestore Update (Accept All)
```typescript
async function acceptAll(suggestions: Suggestion[]) {
  const updatedSteps = [...timer.steps];

  for (const suggestion of suggestions) {
    const stepIndex = updatedSteps.findIndex(s => s.id === suggestion.stepId);
    if (stepIndex !== -1) {
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        plannedDuration: suggestion.suggestedDuration,
      };
    }
  }

  const newTotalDuration = updatedSteps.reduce((sum, s) => sum + (s.type === 'checkpoint' ? 0 : s.plannedDuration), 0);

  const timerRef = doc(db, 'timers', timer.id);
  await updateDoc(timerRef, {
    steps: updatedSteps,
    totalPlannedDuration: newTotalDuration,
  });
}
```

### localStorage — Dismissed Suggestions
```typescript
// Format: { [stepId]: timestamp }
localStorage.setItem(`dismissed-suggestions-${timerId}`, JSON.stringify({
  'step-1': Date.now(),
  'step-2': Date.now(),
}));

// Read and filter out stale (>30 days)
function getDismissedSuggestions(timerId: string): Set<string> {
  const stored = localStorage.getItem(`dismissed-suggestions-${timerId}`);
  if (!stored) return new Set();

  const parsed = JSON.parse(stored);
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  return new Set(
    Object.entries(parsed)
      .filter(([_, timestamp]) => now - (timestamp as number) < thirtyDaysMs)
      .map(([stepId]) => stepId)
  );
}
```

### CSS Custom Properties
- `--suggestion`: `#6BB5A0` (teal accent for suggestions)
- `--on-track`: existing green from semantic colors

### Animation Example (Card Collapse)
```css
.suggestion-card.accepted {
  animation: collapse 0.3s ease-out forwards;
}

@keyframes collapse {
  from { max-height: 120px; opacity: 1; }
  to { max-height: 0; opacity: 0; padding: 0; margin: 0; }
}

.suggestion-card.flash {
  animation: flash 0.2s ease-out;
}

@keyframes flash {
  0% { background: transparent; }
  50% { background: hsl(var(--on-track) / 0.2); }
  100% { background: transparent; }
}
```

### Accessibility
- Section header: `<h2>` tag
- Suggestion list: `role="list"`
- Each card: `role="listitem"`
- Accept button: `aria-label="Accept suggestion to adjust [Step Name] to [N] minutes"`
- Dismiss button: `aria-label="Dismiss suggestion for [Step Name]"`
- ARIA live region announces state changes (accepted/dismissed)

### Error Handling
- If Firestore write fails:
  - Show toast: "Failed to save changes. Please try again."
  - Revert card to initial state (show Accept/Dismiss buttons again)
  - Log error to console for debugging

## Prerequisites

Story 9.1 (Suggestion Algorithm & Firestore Query) must be complete — provides `calculateSuggestions()` and `getCompletedSessionsForTimer()`.

Story 6.1 (Schema Evolution) must be complete — requires `Step`, `TimerTemplate` types.

## Testing Checklist

- [ ] Suggestion section appears when ≥3 sessions and deviation ≥60s
- [ ] Individual Accept updates Firestore and UI correctly
- [ ] Individual Dismiss removes card and persists to localStorage
- [ ] Accept All batches all updates into single Firestore write
- [ ] Dismiss All removes all cards and persists to localStorage
- [ ] On-track message displays when no suggestions
- [ ] No section appears when <3 sessions
- [ ] Dismissed suggestions don't reappear within 30 days
- [ ] Dismissed suggestions DO reappear after 30 days
- [ ] Error handling on Firestore write failure
- [ ] Accessibility: ARIA labels, announcements, keyboard navigation
- [ ] Animation: collapse, fade-out, stagger delay

## Definition of Done

- [ ] All ACs pass
- [ ] `use-suggestions.ts` hook implemented
- [ ] `suggestion-section.tsx`, `suggestion-card.tsx`, `on-track-message.tsx` created
- [ ] Completion view integrated with suggestion section
- [ ] Unit tests for `use-suggestions` hook
- [ ] Integration test: complete timer → verify suggestions appear → accept → verify Firestore update
- [ ] Integration test: dismiss → verify localStorage persistence
- [ ] Accessibility audit passed
- [ ] Code review approved
- [ ] Merged to main branch
