# Epic 4: Timer Editing & Polish — Technical Context

## Overview

Epic 4 enhances the timer creation/editing experience and polishes the timer library. It adds swipe-to-adjust durations, drag-to-reorder steps, a count-up/countdown toggle, and responsive library improvements. All features build on the existing `StepListEditor` and `TimerLibrary` components from Epic 1.

**Prerequisites:** All of Epic 3 complete.

---

## Story Mapping

| Story | Focus | Primary Files |
|-------|-------|--------------|
| 4.1 | Swipe-to-adjust durations | `src/components/timer/step-list-editor.tsx` (enhanced) |
| 4.2 | Drag-to-reorder steps | `src/components/timer/step-list-editor.tsx` (enhanced), `@dnd-kit` |
| 4.3 | Count-up/countdown toggle | `src/components/timer/timer-form.tsx`, `src/components/session/running-timer.tsx` |
| 4.4 | Timer library polish | `src/components/timer/timer-library.tsx`, `src/components/timer/timer-card.tsx` |

---

## Technical Design

### 4.1 — Swipe-to-Adjust Durations

**Gesture System:**
- Use native touch events (`touchstart`, `touchmove`, `touchend`) on each step's duration area
- Calculate horizontal delta: each ~30px of horizontal movement = 1 minute increment/decrement
- Minimum duration: 1 minute (60 seconds) — never go below
- Desktop equivalent: click-drag on the duration area (mousedown/mousemove/mouseup)
- Provide haptic feedback if available: `navigator.vibrate?.(10)`
- Real-time visual update: duration number changes as user swipes

**Tap-to-Type Fallback:**
- Tapping the duration number toggles to an input field
- Parse flexible formats: `"5m"`, `"5:00"`, `"5"`, `"300s"` → all resolve to 300 seconds
- Duration parsing utility in `src/lib/utils/time.ts`:

```typescript
function parseDuration(input: string): number | null {
  // "5m" → 300, "5:00" → 300, "5" → 300 (assume minutes), "300s" → 300
  // Returns seconds or null if unparseable
}
```

**Total Duration Auto-Recalculation:**
- On any step duration change, sum all `step.plannedDuration` values
- Update `totalPlannedDuration` display in real-time

**Component Enhancement:**
- The existing `StepListEditor` from Story 1.4 gets enhanced (not replaced)
- Add `useSwipeAdjust` custom hook or inline touch handler per step row
- Step row layout: `[drag handle] [step name input] [duration (swipeable/tappable)]`

**Interface:**

```typescript
interface SwipeAdjustOptions {
  value: number;           // current duration in seconds
  onChange: (newValue: number) => void;
  minValue?: number;       // default 60 (1 minute)
  stepSize?: number;       // default 60 (1 minute per swipe increment)
  pixelsPerStep?: number;  // default 30
}
```

### 4.2 — Drag-to-Reorder Steps

**Library:** `@dnd-kit/core@^6.3`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Already specified in architecture as a project dependency
- Lightweight, React-native, accessible, touch-friendly

**Integration Pattern:**

```typescript
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

**SortableStepRow Component:**
- Each step row gets a `useSortable` hook
- Drag handle: grip icon (6-dot or hamburger) on the left side of each row
- Visual feedback during drag:
  - Lifted step: subtle shadow + slight scale (1.02)
  - Drop zone: highlighted gap where step will land
  - Other items shift smoothly
- Touch: long-press activates drag (via `TouchSensor` with `activationConstraint: { delay: 250, tolerance: 5 }`)
- Desktop: click-and-hold on drag handle

**On Drop:**
- Reorder the `steps[]` array in form state
- Step order is persisted when user saves the timer (normal save flow)
- No Firestore write on drag — only on form save

**Accessibility:**
- `KeyboardSensor` support: Arrow keys to move items when drag handle is focused
- `sortableKeyboardCoordinates` for proper keyboard ordering
- ARIA: `aria-roledescription="sortable"` and announcement messages

### 4.3 — Count-Up / Countdown Toggle

**Data Model:**
- `countdownMode: boolean` field on `TimerTemplate` (default: `false`)
- Already defined in architecture's Firestore schema
- No change to `RunSession` or `SessionStep` — this is a display-only setting

**Toggle UI:**
- shadcn `Switch` component in the timer creation/editing form
- Position: below the step list, above the Save button
- Label: "Countdown mode" with a brief description: "Show remaining time instead of elapsed"
- Persisted with the timer template on save

**Display Logic (in RunningTimer / ProgressRing):**
- Count-up (default): display = `elapsedTime` formatted as `M:SS`
- Countdown: display = `max(0, plannedDuration - elapsedTime)` formatted as `M:SS`
- Overrun in countdown mode: when `elapsedTime > plannedDuration`, display = `+${elapsedTime - plannedDuration}` formatted as `+M:SS over`
- Overall timer countdown: `totalPlannedDuration - totalElapsedTime`

**Color Shift on Overrun:**
- When step is overrunning in countdown mode: text color shifts to warm amber (`text-warning` from design system)
- Transition: smooth CSS color transition (0.3s)

**Engine Impact: NONE**
- The timer engine (`useTimerEngine`) is unchanged — it always tracks elapsed time via timestamps
- Countdown is purely a display transformation in the UI layer
- The engine exposes `elapsedTime` and the component decides how to render it

### 4.4 — Timer Library Polish

**Responsive Layout:**
- Tailwind responsive grid:
  ```
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
  ```
- Mobile (< 768px): single-column card list, full-width cards
- Tablet (768px-1024px): 2-column grid
- Desktop (> 1024px): 3-column grid
- All cards have 48px minimum touch targets on interactive elements

**Timer Card Enhancements:**
- Display: timer name, total duration, step count, last used date
- `lastUsedAt` field on `TimerTemplate` — updated when a session is created from it
- Format: `formatRelativeDate(lastUsedAt)` → "Today", "Yesterday", "3 days ago", "Jan 15"
- If never used: display "Never used" in muted text

**Sorting:**
- Default sort: by `lastUsedAt` descending (most recently used first)
- Timers never used sort to the bottom
- No user-configurable sort in v1 (just last-used)

**Quick Actions on Timer Card:**
- **Play** (primary): 48px circular green button — most prominent action
- **Edit**: navigates to edit page
- **Duplicate**: creates a copy with " (copy)" appended to name
- **Delete**: confirmation dialog first (per existing Story 1.5)
- Mobile pattern: kebab menu (⋮) on card for Edit/Duplicate/Delete, Play button always visible
- Desktop: actions visible on hover or always via kebab menu

**Empty State (Enhancement of Story 1.4):**
- Warm illustration or icon (tree/leaf from Deep Forest theme)
- Text: "Create your first timer"
- Subtext: "Build a routine, then just press play."
- Prominent CTA button: "Create Timer" → navigates to /app/timers/new

---

## Acceptance Criteria Traceability

### Story 4.1 — Swipe-to-Adjust Durations
| AC | Description | Source |
|----|-------------|--------|
| AC1 | Swipe right on duration increases by 1 min per increment, real-time update | Epic 4.1 AC, FR10.1 |
| AC2 | Swipe left on duration decreases by 1 min (minimum 1 minute) | Epic 4.1 AC, FR10.1 |
| AC3 | Tap on duration number reveals text input | Epic 4.1 AC, FR10.2 |
| AC4 | Text input parses "5m", "5:00", "5", "300s" formats | Epic 4.1 AC, FR10.2 |
| AC5 | Total timer duration auto-recalculates on any step change | Epic 4.1 AC |
| AC6 | Haptic feedback on swipe if device supports vibration | Epic 4.1 Tech Notes |
| AC7 | Works on both mobile (touch) and desktop (click-drag) | Epic 4.1 Tech Notes |

### Story 4.2 — Drag-to-Reorder Steps
| AC | Description | Source |
|----|-------------|--------|
| AC8 | Long-press/grab drag handle makes step draggable with visual lift | Epic 4.2 AC |
| AC9 | Dragging step to new position reorders the list | Epic 4.2 AC |
| AC10 | New step order persists after save | Epic 4.2 AC |
| AC11 | Touch-friendly: works on both mobile and desktop | Epic 4.2 Tech Notes |
| AC12 | Keyboard accessible: arrow keys reorder when drag handle focused | Architecture accessibility |

### Story 4.3 — Count-Up / Countdown Toggle
| AC | Description | Source |
|----|-------------|--------|
| AC13 | Toggle switch in timer form saves `countdownMode` to template | Epic 4.3 AC, FR4.2 |
| AC14 | Countdown mode shows remaining time counting down | Epic 4.3 AC, FR4.2 |
| AC15 | Overall timer shows total remaining time in countdown mode | Epic 4.3 AC |
| AC16 | Overrun in countdown shows "+M:SS over" with warm amber color | Epic 4.3 AC, FR4.2 |
| AC17 | Default (no toggle) uses count-up mode | Epic 4.3 AC, FR4.1 |
| AC18 | Timer engine is unchanged — countdown is display-only | Epic 4.3 Tech Notes |

### Story 4.4 — Timer Library Polish
| AC | Description | Source |
|----|-------------|--------|
| AC19 | Timer cards show name, total duration, step count, last used date | Epic 4.4 AC |
| AC20 | Mobile: single-column card list with large touch targets | Epic 4.4 AC |
| AC21 | Desktop: responsive grid (2-3 columns) | Epic 4.4 AC |
| AC22 | Empty state shows warm prompt + "Create your first timer" CTA | Epic 4.4 AC |
| AC23 | Quick actions: Play (primary), Edit, Duplicate, Delete | Epic 4.4 AC |
| AC24 | Timers sorted by last used (most recent first) | Epic 4.4 Tech Notes |

**Total: 24 ACs**

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Touch events (swipe) | ✅ | ✅ | ✅ | ✅ |
| `navigator.vibrate()` | ✅ | ✅ | ❌ | ✅ |
| @dnd-kit (drag) | ✅ | ✅ | ✅ | ✅ |
| CSS Grid (responsive) | ✅ | ✅ | ✅ | ✅ |

**Note:** `navigator.vibrate()` is not supported on iOS Safari. Haptic feedback is best-effort — degrade silently if unavailable.

---

## Test Strategy

| Test | Type | Coverage |
|------|------|----------|
| `parseDuration()` unit tests | Unit (Vitest) | All format variations, edge cases, invalid input |
| Swipe gesture handler | Unit (Vitest) | Delta calculation, min/max bounds, increment logic |
| `StepListEditor` with drag | Component (RTL) | Render with steps, reorder via keyboard, verify order |
| Countdown display logic | Unit (Vitest) | Count-up, countdown, overrun formatting |
| Timer card rendering | Component (RTL) | All card states, relative date formatting |
| Responsive layout | Component (RTL) | Media query breakpoints (mock viewport) |
| Duration auto-recalc | Component (RTL) | Modify step duration, verify total updates |

---

## Dependencies on Prior Epics

| Dependency | From | Required For |
|-----------|------|-------------|
| `StepListEditor` component | Story 1.4 | Stories 4.1, 4.2 (enhance existing) |
| `TimerForm` component | Story 1.4 | Story 4.3 (add toggle) |
| `TimerLibrary` + `TimerCard` | Story 1.4 | Story 4.4 (polish) |
| `EmptyState` component | Story 1.4 | Story 4.4 (enhance) |
| `formatDuration()` utility | Story 1.6 | Story 4.3 (countdown display) |
| `RunningTimer` component | Story 1.6 | Story 4.3 (countdown display) |
| `ProgressRing` component | Story 2.3 | Story 4.3 (countdown display in ring) |
| `lastUsedAt` field on TimerTemplate | Architecture | Story 4.4 (sort + display) |
