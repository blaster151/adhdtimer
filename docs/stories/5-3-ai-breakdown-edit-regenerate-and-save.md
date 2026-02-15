# Story 5.3: AI Breakdown — Edit, Regenerate & Save

## Status: ready-for-dev

## Story

As a **user**,
I want to edit AI-generated steps and optionally regenerate before saving,
So that the final timer is exactly what I need.

## Prerequisites

- Story 5.2 complete (AI input + loading UI functional)
- All Epic 4 features available (swipe-to-adjust, drag-to-reorder)

## Acceptance Criteria (ACs)

### AC 5.3.1 — Edit Step Names
**Given** the AI has generated steps in the timer creation form
**When** I tap on a step name
**Then** I can edit the name inline
**And** my changes are preserved in form state

### AC 5.3.2 — Adjust Step Durations
**Given** the AI has generated steps
**When** I interact with a step's duration
**Then** I can adjust it via swipe gesture (per Story 4.1) or tap-to-type
**And** the total timer duration recalculates

### AC 5.3.3 — Delete and Add Steps
**Given** the AI has generated steps
**When** I delete a step
**Then** it is removed from the list
**And given** I tap "Add Step"
**Then** a new blank step is added to the list

### AC 5.3.4 — Reorder Steps
**Given** the AI has generated steps
**When** I drag a step to a new position (per Story 4.2)
**Then** the step list reorders accordingly

### AC 5.3.5 — Regenerate
**Given** I'm not satisfied with the AI results
**When** I tap "Regenerate"
**Then** a new AI request is sent with the same task name
**And** the results replace the current steps in the form
**And** this counts toward the daily rate limit

### AC 5.3.6 — Timer Name Auto-Fill
**Given** the AI populates steps
**When** the timer name field is updated
**Then** it is auto-filled with the AI-generated timer name
**But** I can edit the name freely

### AC 5.3.7 — Save Flow
**Given** I'm happy with the steps (AI-generated or edited)
**When** I tap "Save"
**Then** the timer is saved to my library using the same flow as manual timer creation
**And** there is no special AI metadata on the saved timer

### AC 5.3.8 — Regenerate Loading State
**Given** I tap "Regenerate"
**When** the AI is processing
**Then** the existing steps remain visible but dimmed/disabled
**And** a loading indicator appears
**And** on success, the steps are replaced with the new results

## Tasks

### Task 1: Add Regenerate Button
- **File:** `src/components/timer/ai-breakdown-panel.tsx` (modify)
- After AI steps are generated, show a "Regenerate" button below the AI input area
- Button calls the same API with the same `taskName`
- During regenerate: show loading indicator, dim existing steps
- On success: replace steps via `onStepsGenerated`
- On error: show error message, keep existing steps unchanged

### Task 2: Wire All Editing Capabilities to AI Steps
- Verify that AI-generated steps (which are just regular form state) support:
  - Inline name editing (from Story 1.4 StepListEditor)
  - Duration swipe adjustment (from Story 4.1)
  - Duration tap-to-type (from Story 4.1)
  - Step deletion (from Story 1.4)
  - Step addition (from Story 1.4)
  - Drag-to-reorder (from Story 4.2)
- This should work automatically since AI steps are converted to the same `Step` interface
- Test to verify all interactions work correctly

### Task 3: Timer Name Auto-Fill Logic
- **File:** `src/components/timer/timer-form.tsx` (modify `onStepsGenerated` handler)
- When AI returns results, set the timer name input to `data.timerName`
- Only auto-fill if the name field is currently empty or was previously auto-filled by AI
- If user has manually typed a name, don't overwrite it
- Track `isNameFromAI` flag in form state to manage this behavior

### Task 4: Regenerate Rate Limit Awareness
- When the API returns 429 on regenerate, show the rate limit message
- Disable the Regenerate button and show "20/20 used today" hint
- The user can still edit the existing steps and save manually

### Task 5: Tests
- Component test: Regenerate button appears after AI steps are generated
- Component test: Regenerate replaces steps with new results
- Component test: all editing interactions (swipe, drag, delete, add) work on AI steps
- Component test: timer name auto-fills from AI but allows manual override
- Component test: save creates timer identical to manual creation
- Component test: regenerate rate limit shows appropriate message
- Integration test: full flow — AI generate → edit → save → timer in library

## Dev Notes

- **No AI metadata on saved timer:** The saved `TimerTemplate` document is identical whether created manually or via AI. This simplifies the data model and means AI-generated timers are indistinguishable from manual ones.
- **Regenerate replaces all steps:** There's no merge or diff. The regenerate action completely replaces the step list. Users should be aware of this (the button could say "Regenerate (replaces current steps)").
- **This is the final story of the entire project.** After Story 5.3 is complete, the full MVP is delivered.
- **All prior Epic 4 features (swipe, drag) must work on AI-generated steps.** This is a key integration point — the AI just populates the form, and all existing editing UX applies.
