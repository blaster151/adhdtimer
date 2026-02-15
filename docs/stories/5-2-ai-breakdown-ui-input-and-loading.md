# Story 5.2: AI Breakdown UI — Input & Loading

## Status: ready-for-dev

## Story

As a **user**,
I want to type a task name and trigger an AI breakdown with clear loading feedback,
So that I can generate a timer from natural language.

## Prerequisites

- Story 5.1 complete (AI API route functional)
- `TimerForm` component exists from Story 1.4

## Acceptance Criteria (ACs)

### AC 5.2.1 — AI Input Section Visible
**Given** I am on the timer creation page
**When** I see the AI breakdown section
**Then** there is a text input with placeholder "Describe your task..." and a "Break it down ✨" button
**And** this section appears at the top of the page, above the manual step editor

### AC 5.2.2 — Loading State
**Given** I type a task name and tap the button
**When** the AI is processing
**Then** I see the button show a spinner and text "Breaking it down..."
**And** skeleton step rows appear below the input
**And** the input and button are disabled (no double-submit)

### AC 5.2.3 — Success Populates Form
**Given** the AI returns results
**When** the steps populate
**Then** the timer creation form is filled with the generated steps (names and durations)
**And** the timer name field is auto-filled with the AI-generated title
**And** I can see and edit all generated steps before saving

### AC 5.2.4 — Error Handling
**Given** the AI request fails (network error, rate limit, server error)
**When** the error occurs
**Then** I see a friendly inline message (e.g., "Couldn't generate steps — try again or create manually")
**And** the manual creation form remains fully usable
**And** the button is re-enabled for retry

### AC 5.2.5 — Rate Limit Message
**Given** I have used all 20 AI breakdowns today
**When** the API returns 429
**Then** the error message shows "You've used all 20 AI breakdowns today. Try again tomorrow!"
**And** the manual creation form remains usable

### AC 5.2.6 — Empty Input Prevention
**Given** the task name input is empty
**When** I tap the "Break it down ✨" button
**Then** no API call is made
**And** the input shows a validation hint (e.g., border highlight or placeholder text)

### AC 5.2.7 — AI Section Not Blocking
**Given** I don't want to use AI
**When** I ignore the AI section
**Then** I can scroll past it and create my timer manually
**And** the AI section does not interfere with manual creation

## Tasks

### Task 1: Create AIBreakdownPanel Component
- **File:** `src/components/timer/ai-breakdown-panel.tsx`
- `'use client'` directive
- Props: `onStepsGenerated(timerName: string, steps: Array<{ name: string; durationMinutes: number }>): void`
- State: `taskName`, `loading`, `error`
- Render: text input + button in idle state

### Task 2: Implement API Call Logic
- On button click:
  1. Validate `taskName` is non-empty
  2. Get Firebase ID token: `auth.currentUser?.getIdToken()`
  3. `fetch('/api/ai/breakdown', { method: 'POST', headers, body })`
  4. Handle response: 200 → call `onStepsGenerated`, error → set error message
- Disable input + button during loading
- Show specific error messages for 429 (rate limit) vs generic errors

### Task 3: Implement Loading Skeleton
- During loading state, render 4-6 skeleton rows below the input
- Use shadcn `Skeleton` component
- Each skeleton row mimics a step row shape (name placeholder + duration placeholder)
- Shimmer animation (shadcn default)

### Task 4: Integrate with TimerForm
- **File:** `src/components/timer/timer-form.tsx` (modify)
- Add `<AIBreakdownPanel>` at top of form, above step list
- `onStepsGenerated` callback:
  1. Set timer name field to `timerName`
  2. Convert steps: `{ id: crypto.randomUUID(), name, plannedDuration: durationMinutes * 60 }`
  3. Replace current steps in form state with generated steps
- AI section should only appear in "create" mode (not when editing existing timer)

### Task 5: Tests
- Component test: AIBreakdownPanel renders input + button in idle state
- Component test: loading state shows spinner + skeletons, button disabled
- Component test: success calls `onStepsGenerated` with correct data
- Component test: error displays friendly message, button re-enabled
- Component test: empty input prevents API call
- Integration test: AIBreakdownPanel + TimerForm — steps populate form on success

## Dev Notes

- The AI section should be visually distinct but not dominant. A subtle border or background difference separates it from the manual creation area below.
- On mobile, the AI input should be comfortably reachable (not tiny). The "Break it down ✨" button should be full-width on mobile.
- The `onStepsGenerated` callback completely replaces any existing steps in the form. If the user had manual steps, they get overwritten. This is acceptable because the Regenerate flow (Story 5.3) does the same. A future enhancement could add a confirmation dialog.
- Only show the AI panel on the "new timer" page, not on the "edit timer" page. The `TimerForm` receives a prop indicating mode.
