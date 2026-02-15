# Story 4.4: Timer Library Polish

## Status: ready-for-dev

## Story

As a **user**,
I want the timer library to feel polished and informative,
So that finding and managing my routines is a pleasure.

## Prerequisites

- Story 4.3 complete (count-up/countdown toggle)
- `TimerLibrary`, `TimerCard`, `EmptyState` components exist from Story 1.4

## Acceptance Criteria (ACs)

### AC 4.4.1 — Timer Card Information
**Given** I have multiple saved timers
**When** I view the timer library
**Then** each timer card shows: name, total duration, step count, and last used date
**And** timers never used show "Never used" in muted text

### AC 4.4.2 — Mobile Layout
**Given** I view the library on a phone (< 768px)
**When** the screen is narrow
**Then** the layout is a single-column card list
**And** all interactive elements have 48px minimum touch targets

### AC 4.4.3 — Desktop Layout
**Given** I view the library on a desktop (> 1024px)
**When** the screen is wide
**Then** the layout is a responsive grid (3 columns)
**And** tablet (768px-1024px) shows 2 columns

### AC 4.4.4 — Empty State Polish
**Given** I have no timers
**When** I see the empty state
**Then** I see a warm, inviting design with icon + "Create your first timer"
**And** subtext: "Build a routine, then just press play."
**And** a prominent CTA button that navigates to timer creation

### AC 4.4.5 — Quick Actions
**Given** I interact with a timer card
**When** I want quick actions
**Then** I can: Play (primary, always visible), Edit, Duplicate, Delete
**And** secondary actions are in a kebab menu (⋮) to keep the card clean

### AC 4.4.6 — Sort by Last Used
**Given** I have multiple timers with different usage history
**When** I view the timer library
**Then** timers are sorted by last used (most recent first)
**And** timers never used appear at the bottom

### AC 4.4.7 — Last Used Date Formatting
**Given** a timer was last used at various times
**When** I view the "last used" text on a card
**Then** it displays: "Today", "Yesterday", "3 days ago", "Jan 15" (for older dates)
**And** the formatting uses `formatRelativeDate()` from `time.ts`

### AC 4.4.8 — Last Used Timestamp Update
**Given** I start playing a timer (create a session from it)
**When** the session is created
**Then** the timer template's `lastUsedAt` field is updated to now
**And** the library sort order reflects the change on next visit

### AC 4.4.9 — Duplicate Action
**Given** I tap "Duplicate" on a timer card
**When** the action executes
**Then** a copy of the timer is created with " (copy)" appended to the name
**And** the duplicate appears in the library immediately

### AC 4.4.10 — Responsive Grid Transitions
**Given** I resize the browser window
**When** the viewport crosses breakpoints (768px, 1024px)
**Then** the grid smoothly transitions between 1, 2, and 3 columns
**And** cards maintain consistent spacing and proportions

## Tasks

### Task 1: Create `formatRelativeDate()` Utility
- **File:** `src/lib/utils/time.ts` (add to existing)
- Implement `formatRelativeDate(timestamp: Timestamp | null): string`
- Logic: today → "Today", yesterday → "Yesterday", 2-6 days → "X days ago", 7+ days → "Mon DD" format, null → "Never used"
- No date library needed — raw Date comparisons
- Unit tests for all cases (today, yesterday, 3 days ago, last week, last month, null)

### Task 2: Enhance TimerCard Component
- **File:** `src/components/timer/timer-card.tsx`
- Add display fields: step count (`timer.steps.length`), last used (`formatRelativeDate(timer.lastUsedAt)`)
- Play button: 48px circular, `bg-primary`, always visible on card
- Kebab menu (⋮): dropdown with Edit, Duplicate, Delete actions
- Use shadcn `DropdownMenu` component for kebab menu
- Card layout: name (top), metadata row (duration · steps · last used), play button (right side)

### Task 3: Implement Responsive Grid Layout
- **File:** `src/components/timer/timer-library.tsx`
- Replace existing list layout with responsive grid:
  ```
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
  ```
- Cards: consistent height, `rounded-lg` border radius, proper padding
- Ensure 48px minimum touch targets on all interactive elements

### Task 4: Implement Sorting and lastUsedAt Update
- **File:** `src/lib/firebase/timers.ts` (enhance existing)
- Sort timers by `lastUsedAt` descending (nulls last) when fetching
- When creating a session from a timer, update `lastUsedAt` on the template document
- Query: `orderBy('lastUsedAt', 'desc')` — handle null values client-side (push to end)

### Task 5: Polish Empty State
- **File:** `src/components/timer/empty-state.tsx`
- Warm illustration or thematic icon (tree/leaf from Deep Forest theme)
- Text: "Create your first timer"
- Subtext: "Build a routine, then just press play."
- CTA button: "Create Timer" → navigates to `/app/timers/new`
- Center vertically in the library area

### Task 6: Tests
- Component test: TimerCard renders all metadata (name, duration, steps, last used)
- Component test: kebab menu opens and shows Edit/Duplicate/Delete
- Component test: TimerLibrary renders correct grid at different viewports
- Component test: EmptyState renders with correct text and CTA
- Unit test: `formatRelativeDate()` — all cases
- Test: sorting order (most recent first, never-used last)
- Test: duplicate action creates copy with " (copy)" suffix

## Dev Notes

- The `lastUsedAt` field may not exist on timers created before this story is implemented. Handle `null`/`undefined` gracefully — show "Never used" and sort to bottom.
- The kebab menu should use shadcn `DropdownMenu` for consistency with the design system. On mobile, ensure the dropdown doesn't clip off-screen.
- The Play button on each card should be the same action as in Story 1.4 — create a session and navigate to the running timer view. The enhancement here is the visual prominence (48px circular green button).
- For the responsive grid, Tailwind's built-in responsive prefixes (`md:`, `lg:`) handle all breakpoint logic. No JavaScript resize listeners needed.
