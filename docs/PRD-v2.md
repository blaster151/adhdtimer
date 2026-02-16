# ADHD Timer v2 — Product Requirements Document

**Author:** BMad
**Date:** 2026-02-16
**Version:** 2.0
**Base:** Brownfield evolution of v1 MVP (14 features, 5 epics, 23 stories — all complete)

---

## Executive Summary

ADHD Timer v1 is a shipped PWA that guides users through timed multi-step routines with voice announcements, visual progress rings, and real-time cross-device sync. v2 evolves the app from a guided timer into a **learning companion** — steps become semantically rich, routines become repeatable habits, and the app watches how you actually execute your routines to suggest improvements.

### What Makes v2 Special

**"Your plans learn from you."** The magic moment: you've run your Morning Routine five days in a row. The completion screen says: *"Shower averaged 10 min last 5 runs (planned 8). Get Dressed was always under 3 min. Adjust?"* You tap "Accept all" and your routine is instantly better — tuned to reality, not guesswork.

The second magic moment: you hit a Checkpoint — "Dressed by 7:30" — and the app tells you "2 minutes ahead of target. Nice pace." Your routine now has real-world time gates, not just relative pace.

---

## Project Classification

**Technical Type:** Web Application (PWA — brownfield evolution)
**Domain:** General (no regulatory/compliance complexity)
**Complexity:** Medium

- State machine evolution (defer step, manual advance) adds careful design work
- Historical run analysis for suggestions is a new data pattern
- Schema migration must be backward-compatible with live v1 data
- No new infrastructure (no push notifications, no native apps, no new backends)

**References:**
- v2 Product Brief: `docs/product-brief-adhdtimer-v2-2026-02-16.md`
- v1 PRD: `docs/PRD.md`
- v1 Architecture: `docs/architecture.md`
- v1 UX Design Spec: `docs/ux-design-specification.md`
- Brainstorming Session: `docs/brainstorming-session-results-2026-02-14.md`

---

## Success Criteria

### Primary Success Metric

**"I use the same routine 5 days running and the app suggests step duration tweaks helpfully."**

### Supporting Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Routine repetition | Same routine run 5+ times in 10 days | Session history data |
| Suggestion acceptance rate | Duration suggestions accepted >50% | Completion view interaction |
| Streak engagement | 5+ day streak on at least one routine | Streak tracker data |
| Step type adoption | 2+ step types used in primary routine | Timer template data |
| Defer usage | At least 1 defer per week | Session interaction data |
| Manual advance adoption | At least 1 routine uses pause-between-steps | Timer template settings |

---

## Product Scope

### v2 Features (8)

| # | Feature | Theme | FR Reference |
|---|---------|-------|-------------|
| 1 | Step types (Active / Wait / Checkpoint) | 🧠 Smarter Steps | FR14 |
| 2 | Pause-between-steps toggle (manual advance) | 🧠 Smarter Steps | FR15 |
| 3 | Defer step | 🧠 Smarter Steps | FR16 |
| 4 | Repeatable routines with scheduling | 🔁 Routines & Habits | FR17 |
| 5 | Streak / habit tracker | 🔁 Routines & Habits | FR18 |
| 6 | Post-completion review with suggestions | 💬 Learning Companion | FR19 |
| 7 | Gentle step reminder | 💬 Learning Companion | FR20 |
| 8 | AI vague-task detection | 🤖 Smarter AI | FR21 |

### Out of Scope for v2

- Push notifications / external reminders (deferred to native app era)
- Top-level timer switching (pause one, start another)
- "Capture idea for later" (rabbit trail parking lot)
- Flexible-order steps within a block
- Interwoven mode (timers with wait-gaps auto-interleave)
- Preference learning (gathers reasons, augments future AI suggestions)
- Run history browsing UI (data collected, no dedicated view)
- Digital body double / ambient audio / companion personality
- Native app shells (Capacitor)

### Future Vision (v3+)

- Native app shells via Capacitor → push notifications, background execution
- "Capture idea for later" (rabbit trail parking lot)
- Flexible-order steps / interwoven mode
- Preference learning
- Digital body double, ambient audio, AI time-block planner
- Full run history browsing and analytics

---

## User Experience Principles

### v2 UX Extensions

v2 inherits all v1 UX principles (see `docs/ux-design-specification.md`). The following additions apply:

**New Principle: The app gets smarter with you.** Every run makes the next run better. Suggestions are gentle, data-driven, and always dismissible. The app never says "you're wrong" — it says "here's what I noticed."

**New Principle: Steps have personality.** Active steps feel energetic. Wait steps feel calm and patient. Checkpoints feel like milestones. The visual and voice treatment should reflect what kind of work the step represents.

**New Principle: Habits form without pressure.** Streaks are quiet celebrations, not anxiety engines. Missing a day is a reset, not a failure. The app never makes the user feel guilty for skipping.

### Key v2 Interactions

| Interaction | Design Intent |
|------------|--------------|
| **Step type selection** | During timer creation/editing, each step has a type selector (default: Active). Minimal — icon or dropdown, not a whole screen. |
| **Wait step during playback** | Different visual treatment — muted ring, "waiting..." feel. Optional auto-advance when planned duration elapses. |
| **Checkpoint during playback** | Clock-time comparison displayed. "2 min ahead of 7:30 target" or "3 min past target." Brief, then auto-continue. |
| **Defer step** | Single action during playback — "Not now." Step moves to end (or chosen position). Badge/indicator shows deferred steps pending. Reminder before timer completes. |
| **Manual advance (pause-between-steps)** | At step transition, timer pauses. "Next: Get Dressed. Tap to start." User controls the pace. |
| **Post-completion suggestions** | Completion view adds a "Suggested Tweaks" section (only after 3+ runs). Accept/dismiss per suggestion or "Accept all." |
| **Streak display** | Timer library card shows streak badge. "Day 6 ☕" — subtle, warm. No fireworks, no shame on reset. |
| **Gentle reminder** | During long steps, periodic voice/visual nudge: "You're working on Shower." Configurable threshold. |
| **AI vague-task detection** | On step save/blur, inline suggestion appears: "This seems broad — break it down?" Dismissible. |

### Critical v2 User Flow: The Learning Loop

This is the hero flow that validates v2 — the routine that improves itself:

```
Day 1: Run "Morning Routine" → Completion view shows summary (same as v1)
Day 2: Run again → Same summary
Day 3: Run again → Same summary (data building)
Day 5: Run again → Completion view now shows:
  "Based on your last 5 runs:"
  ┌─────────────────────────────────────────────────┐
  │ ☕ Suggested Tweaks                              │
  │                                                   │
  │ 🔄 Shower: 8 min → 10 min (avg: 10:12)          │
  │    [Accept] [Dismiss]                             │
  │                                                   │
  │ 🔄 Get Dressed: 5 min → 3 min (avg: 2:48)       │
  │    [Accept] [Dismiss]                             │
  │                                                   │
  │ ✓ Other steps are on track                       │
  │                                                   │
  │ [Accept All]                        [Dismiss All] │
  └─────────────────────────────────────────────────┘
User taps "Accept All" → Timer template updated → Next run uses new durations
```

### v2 User Flow: Checkpoint Routine

```
Timer: "Morning Routine" (with Checkpoints)
  Steps:
    1. Shower — 10 min (Active)
    2. Coffee — 3 min (Active)
    3. ☕ Coffee brewing — Wait 4 min (Wait, auto-advance)
    4. 🎯 Dressed by 7:30 (Checkpoint)
    5. Get dressed — 5 min (Active)
    6. Breakfast — 12 min (Active)
    7. 🎯 Out the door by 7:45 (Checkpoint)

Running:
  → [Shower completes] → [Coffee completes]
  → [Wait: "Coffee is brewing. 4 min." — muted visual, calm]
  → [Wait completes, auto-advance]
  → [Checkpoint: Clock shows 7:26]
  → Voice: "Dressed by 7:30. You're 4 minutes ahead. Nice pace."
  → [Continue to Get Dressed]
  → [Get Dressed completes] → [Breakfast completes]
  → [Checkpoint: Clock shows 7:43]
  → Voice: "Out the door by 7:45. 2 minutes to spare."
  → [Timer complete]
```

---

## Functional Requirements

> **Note:** v2 FRs are numbered FR14–FR21, continuing from v1's FR1–FR13. All v1 FRs remain in effect. See `docs/PRD.md` for FR1–FR13.

### FR14: Step Types

**FR14.1 — Step Type Definitions**
- Each step in a Timer Template has a `type` field: `active` (default), `wait`, or `checkpoint`
- **Active** steps: Current v1 behavior. User is doing something. Standard playback.
- **Wait** steps: Passive time. User is waiting (coffee brewing, laundry running). Has a planned duration. Different visual treatment (muted/calm). Auto-advances when duration elapses by default.
- **Checkpoint** steps: Time gate. Has a `targetTime` (clock time, e.g., "7:30 AM") instead of a `plannedDuration`. On reaching a Checkpoint, the app compares current clock time to `targetTime` and displays status (ahead/behind), then immediately continues to the next step. Checkpoints have zero duration in the state machine.
- Default type is `active` — existing v1 timers have all-active steps (backward compatible).

**FR14.2 — Wait Step Behavior**
- During playback, Wait steps show a distinct visual state — muted progress ring, calmer colors, "Waiting..." indicator
- TTS announces: "[Step Name]. [Duration] minutes. Waiting."
- Wait steps auto-advance by default when planned duration elapses
- User can still pause, skip, or extend Wait steps (same controls as Active)
- Contextual message at auto-advance: "Done waiting. Next: [Step Name]"

**FR14.3 — Checkpoint Step Behavior**
- Checkpoints require a `targetTime` field (absolute clock time, stored as HH:MM in 24h format)
- On reaching a Checkpoint during playback:
  - Compare current clock time to `targetTime`
  - If ahead: "You hit [Checkpoint Name] [X] minutes early. Nice pace."
  - If behind: "[X] minutes past [Checkpoint Name] target." (neutral, factual)
  - If on time (within 1 minute): "Right on time for [Checkpoint Name]."
- TTS reads the Checkpoint status
- The Checkpoint is instantaneous — after displaying status, immediately advance to next step
- Checkpoints do NOT have planned duration — they have zero duration in total time calculations
- A timer can have multiple Checkpoints at any position
- Timer creation UI shows a time picker (clock time) for Checkpoints instead of a duration swipe

**FR14.4 — Step Type Selection in Timer Editor**
- Timer creation/editing UI adds a type selector per step
- Default is `active` — requires no action for simple timers
- Visual indicator: icon or badge showing step type (e.g., ⏳ Wait, 🎯 Checkpoint)
- Changing type to `checkpoint` replaces the duration input with a time picker
- Changing type back from `checkpoint` replaces the time picker with a duration input

**FR14.5 — Backward Compatibility**
- Existing v1 Timer Templates have no `type` field on steps
- All steps without a `type` field are treated as `active` (implicit default)
- No migration required — the absence of the field means `active`

### FR15: Pause-Between-Steps Toggle (Manual Advance)

**FR15.1 — Per-Timer Setting**
- Timer Templates gain a `pauseBetweenSteps` boolean field (default: `false`)
- When `true`, the timer pauses at each step transition instead of auto-advancing
- Setting is configurable in timer creation/editing UI (toggle switch)

**FR15.2 — Manual Advance Playback Behavior**
- When a step completes (elapsed ≥ planned) and `pauseBetweenSteps` is `true`:
  - Play the transition chime (same as v1)
  - TTS announces: "Done. Next up: [Next Step Name]. Tap when ready."
  - Display a "Start [Step Name]" button prominently
  - Timer is in a `waiting-for-advance` state — not running, not paused by user
  - Time is NOT counting during this wait (no overrun accumulation)
- User taps the button → next step begins, timer resumes
- User can still skip (advances without starting next step) or stop the timer
- If `pauseBetweenSteps` is `false`, behavior is identical to v1 (auto-advance)

**FR15.3 — Manual Advance with Wait Steps**
- Wait steps in a `pauseBetweenSteps` timer still auto-advance by default (the wait IS the action)
- But the transition FROM a Wait step to the next step still pauses for manual advance
- Example: Wait "Coffee brewing 4 min" → auto-completes → pauses → "Next: Get Dressed. Tap when ready."

**FR15.4 — Manual Advance with Checkpoints**
- Checkpoints are always instantaneous — manual advance does NOT pause at Checkpoints
- Checkpoint → displays status → immediately shows manual advance prompt for the NEXT step
- Example: Checkpoint "Dressed by 7:30" → "2 min ahead" → "Next: Get Dressed. Tap when ready."

**FR15.5 — State Machine Extension**
- New session state: `waiting-for-advance` (between `completed` step and next `running` step)
- This state does NOT sync as `paused` — it's distinct. Other devices see "Waiting for next step..."
- Wake lock remains active during `waiting-for-advance`

### FR16: Defer Step

**FR16.1 — Defer Action**
- During playback, the user can defer the current running step
- Interaction: "Defer" button alongside existing Pause/Skip/Extend controls
- Defer means: "Not now — come back to this before the timer ends"
- The deferred step is marked `deferred` and moved to the end of the step queue
- The next step in the original order begins immediately

**FR16.2 — Deferred Step Tracking**
- Deferred steps appear as a badge/indicator on the running timer UI: "1 deferred" or "2 deferred"
- Deferred steps are visible in the step list with distinct styling (e.g., dimmed, moved to bottom)
- When all non-deferred steps are complete, deferred steps are presented one by one
- TTS announces: "All main steps done. You deferred [Step Name] earlier. Ready to do it now?"

**FR16.3 — Deferred Step Resolution**
- When a deferred step comes up (after all others complete):
  - User can: Run it (normal step behavior), Skip it, or Defer again (it stays deferred)
  - If all deferred steps are skipped or completed, the timer completes normally
  - The completion view notes deferred steps: "2 steps deferred, 1 completed later, 1 skipped"

**FR16.4 — Defer Limitations**
- Only the currently running step can be deferred (not upcoming steps)
- Checkpoint steps cannot be deferred (they're instantaneous)
- Wait steps CAN be deferred (e.g., "I'll start the laundry later")
- A step can be deferred multiple times within the same session (keeps going to end of queue)

**FR16.5 — State Machine Extension**
- New step status: `deferred` (in addition to v1's `pending`, `running`, `paused`, `completed`, `skipped`)
- Session gains a `deferredSteps` array tracking deferred step IDs in deferral order
- When `currentStepIndex` would advance past all non-deferred steps, switch to processing deferred steps

### FR17: Repeatable Routines with Scheduling

**FR17.1 — Scheduling Metadata**
- Timer Templates gain optional scheduling fields:
  - `schedule.days`: Array of weekdays (e.g., `['mon', 'tue', 'wed', 'thu', 'fri']`)
  - `schedule.timeOfDay`: `'morning'` | `'afternoon'` | `'evening'` | `'anytime'`
  - `schedule.enabled`: boolean (default `false`)
- Scheduling is purely metadata — no push notifications, no background jobs
- Used for in-app awareness and streak calculation

**FR17.2 — In-App Awareness**
- When the user opens the timer library:
  - Routines scheduled for today are surfaced prominently (e.g., "Due today" section or badge)
  - If a scheduled routine hasn't been run today, it shows as "ready"
  - If already completed today, it shows as "done" with a checkmark
  - If not scheduled for today, it appears in the normal library position
- Sorting: "Due today" routines sort to the top of the library
- Time-of-day awareness: morning routines surface when the app is opened before noon, etc.

**FR17.3 — Schedule Configuration UI**
- Timer creation/editing adds an optional "Schedule" section (collapsed by default)
- Day picker: tap weekdays to toggle (M T W T F S S)
- Time of day: segmented control (Morning / Afternoon / Evening / Anytime)
- Simple toggle to enable/disable schedule

**FR17.4 — No External Reminders**
- No push notifications in v2 — scheduling is entirely in-app
- The app does NOT run background jobs, scheduled tasks, or Cloud Functions for reminders
- If the user doesn't open the app, they don't get reminded (this is acceptable for v2)

### FR18: Streak / Habit Tracker

**FR18.1 — Streak Calculation**
- For scheduled routines, track consecutive days the routine was completed
- A "completion" = at least one session for this timer completed on a scheduled day
- Streak increments by 1 for each consecutive scheduled day with a completion
- Missing a scheduled day resets the streak to 0 (no shame, no message — just resets)
- Non-scheduled days don't affect the streak (weekend doesn't break a weekday streak)

**FR18.2 — Streak Display**
- Timer library card for scheduled routines shows the streak: "Day 6 ☕" or "🔥 12" (but tasteful, not aggressive)
- Streak appears only for scheduled routines with `schedule.enabled = true`
- First day (Day 1) shows immediately after first completion: "Day 1 — nice start"
- Milestone celebrations are subtle: Day 7 "One week ☕", Day 30 "One month 🌟" — brief toast, not a modal

**FR18.3 — Streak Reset Behavior**
- When a scheduled day passes without completion:
  - Streak resets to 0 silently
  - Next completion shows "Day 1 — fresh start" (not "You broke your 12-day streak!")
  - No negative messaging ever
- The user can see their current streak but NOT historical streaks (no "longest streak" in v2 — too competitive)

**FR18.4 — Opt-In**
- Streaks are visible by default for scheduled routines
- Global setting: "Show streaks" toggle (settings sheet)
- When disabled, no streak badges appear anywhere

**FR18.5 — Data Storage**
- Streak data stored on the Timer Template document:
  - `streak.currentCount`: number (default 0)
  - `streak.lastCompletedDate`: date string (YYYY-MM-DD)
  - `streak.startDate`: date string (when current streak began)
- Streak calculation happens client-side when the app loads (compare `lastCompletedDate` with today and schedule)

### FR19: Post-Completion Review with Suggestions

**FR19.1 — Suggestion Trigger**
- Suggestions appear in the completion view ONLY when:
  - The timer has been completed 3+ times previously (minimum data threshold)
  - At least one step has a significant duration deviation (see FR19.2)
- If fewer than 3 prior completions, the completion view is identical to v1

**FR19.2 — Suggestion Algorithm**
- For each step in the completed session:
  - Query the last N completed sessions for the same timer (N = 5, configurable)
  - Calculate the average actual duration across those sessions
  - Compare average actual to current planned duration
  - If difference ≥ 1 minute AND consistent (standard deviation check — most runs deviate in the same direction): generate a suggestion
- Suggestions are always toward the average — never suggesting the user be faster or slower than they naturally are
- Checkpoint steps are excluded from duration suggestions (they have target times, not durations)
- Skipped steps are excluded from the average calculation for that step
- Deferred steps that were eventually completed are included (using their actual duration)

**FR19.3 — Suggestion Display**
- In the completion view, after the existing summary (v1), add a "Suggested Tweaks" section:
  - Each suggestion shows: step name, current planned duration, suggested duration (rounded to nearest minute), average actual
  - Per-suggestion actions: "Accept" or "Dismiss"
  - Bulk actions: "Accept All" or "Dismiss All"
- Tone: "Based on your last 5 runs:" — factual, friendly
- Accepting a suggestion updates the Timer Template's step `plannedDuration` immediately
- Accepting also recalculates `totalPlannedDuration` on the Timer Template

**FR19.4 — Suggestion Persistence**
- Dismissed suggestions are not remembered — the same suggestion may appear again on the next completion (if the data still supports it)
- This is intentional: user patterns may change, and a previously dismissed suggestion may become more relevant
- No "never suggest this again" option in v2 (keep it simple)

**FR19.5 — Data Requirements**
- v1 already preserves `RunSession` documents after completion (they're never deleted)
- v2 needs to query: `users/{userId}/sessions` where `timerId == X` and `status == 'completed'`, ordered by `completedAt`, limit N
- Each `SessionStep` already has `elapsedTime` and `plannedDuration` — sufficient for the algorithm

### FR20: Gentle Step Reminder

**FR20.1 — Reminder Trigger**
- During a running step, if the step's planned duration is ≥ the reminder threshold (default: 5 minutes):
  - At the midpoint of the planned duration, deliver a gentle reminder
  - For steps that overrun, deliver an additional reminder every N minutes after the planned duration (default: every 3 minutes)
- Reminders do NOT fire for Wait steps (the user isn't actively working)
- Reminders do NOT fire for Checkpoint steps (instantaneous)

**FR20.2 — Reminder Content**
- Voice (TTS): "You're working on [Step Name]." — simple, factual, grounding
- Visual: Brief overlay or pulse effect on the progress ring — subtle, not alarming
- No time information in the reminder (that's what the screen shows) — just a "hey, you're here" nudge
- Tone: A gentle tap on the shoulder, not an alarm

**FR20.3 — Reminder Settings**
- Global setting: "Step reminders" toggle (settings sheet), default: enabled
- Configurable threshold: "Remind me during steps longer than X minutes" (default: 5)
- When disabled, no reminders fire

**FR20.4 — Browser Tab Constraints**
- Same constraints as v1 TTS — reminders may not fire if the app tab is not active
- Wake Lock (FR13) mitigates this for the primary device
- Not a v2 concern — same known constraint as v1

### FR21: AI Vague-Task Detection

**FR21.1 — Detection Trigger**
- When creating or editing a timer, analyze step names for vagueness
- Trigger: on step name blur (user finishes typing) or on save
- Detection is client-side first (pattern matching), with optional AI confirmation

**FR21.2 — Vagueness Patterns**
- Client-side heuristics for likely-vague step names:
  - Very short + generic: "work", "stuff", "things"
  - Contains broad scope words: "clean the house", "work on project", "do homework"
  - Very long / sentence-like: "figure out what to do about the kitchen situation"
- These heuristics trigger an inline suggestion — NOT an automatic AI call (saves API costs)

**FR21.3 — Suggestion UI**
- When a vague step is detected, show an inline suggestion below the step:
  - "This seems broad — want me to break it down into substeps?"
  - Button: "Break it down ✨" (same language as existing AI breakdown)
  - Dismiss: "No thanks" (inline, small)
- If user taps "Break it down":
  - Call the existing AI breakdown API route (`/api/ai/breakdown`)
  - Replace the single vague step with the AI-generated substeps in the step list
  - User can edit the generated steps normally (same as Story 5.2/5.3 flow)
- If dismissed, the step is left as-is (no persistence of dismissal — may suggest again on next edit)

**FR21.4 — Rate Limiting**
- AI calls for vague-task detection share the same rate limit as the existing AI breakdown feature (20/day per user)
- Client-side heuristics (pattern matching) are free — only the AI call counts against the limit

**FR21.5 — Interaction with AI Breakdown Panel**
- The existing AI breakdown panel (top of timer creation page) handles whole-timer generation
- Vague-task detection handles individual step refinement
- Both can be used in the same timer creation session
- If a step was generated by AI breakdown, don't immediately flag it as vague (trust the AI output for that session)

---

## Non-Functional Requirements

### v2 NFR Updates

All v1 NFRs remain in effect (see `docs/PRD.md`). The following additions apply:

**Performance**

| Requirement | Target | Rationale |
|------------|--------|-----------|
| Suggestion calculation | < 2 seconds on completion | User shouldn't wait for historical analysis |
| Streak calculation | < 500ms on library load | Should feel instant when opening the app |
| Vague-task detection (client) | < 100ms per step | Pattern matching is fast — must feel immediate |

**Data**

| Requirement | Target | Rationale |
|------------|--------|-----------|
| Historical sessions queried | Last 5 completed sessions per timer | Sufficient for suggestion algorithm; limits Firestore reads |
| Schema backward compatibility | 100% — no migration required | Existing v1 timers must work unchanged |

**Accessibility**

| Requirement | Target | Rationale |
|------------|--------|-----------|
| Step type indicators | Both visual (icon) and ARIA label | Step types must be perceivable by screen readers |
| Suggestion actions | Keyboard navigable | Accept/dismiss must work without touch |
| Streak display | Non-essential (decorative) | Streaks are enhancement, not core — can be aria-hidden |

---

## Technical Preferences

v2 builds entirely on the v1 stack. See `docs/architecture.md` for full technical details.

### Schema Evolution

**TimerTemplate additions:**
```typescript
// Step type — backward compatible (missing = 'active')
interface Step {
  // ...existing v1 fields...
  type?: 'active' | 'wait' | 'checkpoint';  // default 'active'
  targetTime?: string;  // HH:MM format, only for checkpoint steps
}

// Timer-level settings
interface TimerTemplate {
  // ...existing v1 fields...
  pauseBetweenSteps?: boolean;  // default false
  schedule?: {
    enabled: boolean;
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  };
  streak?: {
    currentCount: number;
    lastCompletedDate: string;  // YYYY-MM-DD
    startDate: string;          // YYYY-MM-DD
  };
}
```

**RunSession additions:**
```typescript
interface SessionStep {
  // ...existing v1 fields...
  type?: 'active' | 'wait' | 'checkpoint';  // from template
  status: StepStatus;  // v1 statuses + 'deferred'
}

interface RunSession {
  // ...existing v1 fields...
  deferredSteps?: string[];  // array of step IDs in deferral order
  pauseBetweenSteps?: boolean;  // copied from template at session creation
}

type StepStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped' | 'deferred';
type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'waiting-for-advance';
```

All new fields are optional with sensible defaults — **zero migration required**.

---

## User Flows

### Flow 8: Post-Completion Learning Loop

**Trigger:** User completes a routine for the 5th+ time

```
Timer completes
  │
  └─ Completion View (v1 summary)
       │
       ├─ "Done! 38 minutes. ☕"
       ├─ Steps summary (same as v1)
       │
       ├─ [3+ prior completions?]
       │     ├─ NO → End (same as v1)
       │     └─ YES ↓
       │
       ├─ "Suggested Tweaks" section
       │     ├─ "Based on your last 5 runs:"
       │     ├─ "🔄 Shower: 8 min → 10 min (avg: 10:12)"
       │     │     [Accept] [Dismiss]
       │     ├─ "🔄 Get Dressed: 5 min → 3 min (avg: 2:48)"
       │     │     [Accept] [Dismiss]
       │     ├─ "✓ Other steps are on track"
       │     └─ [Accept All]  [Dismiss All]
       │
       └─ User action:
            ├─ Accept → Timer Template updated, totalDuration recalculated
            └─ Dismiss → No change, same suggestion may appear next time
```

### Flow 9: Routine with Defer

**Trigger:** User wants to skip a step temporarily during a running timer

```
Running Timer
  │
  ├─ Step: "Make bed" running
  ├─ User taps [Defer]
  │     ├─ Step marked 'deferred', moved to end of queue
  │     ├─ Badge appears: "1 deferred"
  │     └─ Next step begins immediately
  │
  ├─ ... (remaining steps run) ...
  │
  ├─ All main steps complete
  │     └─ TTS: "All main steps done. You deferred Make bed. Ready?"
  │           ├─ [Start] → Run deferred step normally
  │           ├─ [Skip] → Mark skipped, timer completes
  │           └─ [Defer again] → Stays deferred (edge case)
  │
  └─ Timer completes
       └─ Completion: "1 step deferred → completed later"
```

### Flow 10: Scheduled Routine with Streak

**Trigger:** User opens app on a weekday morning with a scheduled routine

```
App Opens
  │
  ├─ Timer Library loads
  │
  ├─ [Scheduled routines due today?]
  │     └─ YES → "Due Today" section at top
  │           ├─ "Morning Routine" — "Day 6 ☕" streak badge
  │           └─ One-tap Play
  │
  ├─ User completes the routine
  │     ├─ Streak increments: "Day 7 — one week! ☕"
  │     └─ Brief toast celebration (subtle)
  │
  └─ Next day (missed):
       ├─ Streak resets to 0 silently
       └─ Next completion: "Day 1 — fresh start"
```

### Flow 11: Manual Advance Routine

**Trigger:** User runs a routine with pause-between-steps enabled

```
Running Timer (pauseBetweenSteps: true)
  │
  ├─ Step 1: "Shower" — runs normally, elapsed time counting
  ├─ [Step 1 completes]
  │     ├─ Chime plays
  │     ├─ TTS: "Done. Next up: Get Dressed. Tap when ready."
  │     ├─ Timer enters 'waiting-for-advance' state
  │     ├─ Screen shows: "Next: Get Dressed" + [Start] button
  │     └─ Time is NOT counting (no penalty for transition time)
  │
  ├─ User taps [Start]
  │     └─ Step 2 begins, timer resumes
  │
  ├─ [Wait step: "Coffee brewing 4 min"]
  │     └─ Wait auto-advances (it's a Wait, not manual)
  │     └─ THEN pauses for manual advance to next step
  │
  └─ [Checkpoint: "Dressed by 7:30"]
       └─ Displays status, immediately shows manual advance for next step
```

---

## Implementation Planning

### Epic Breakdown Required

The 8 v2 features need decomposition into implementable epics and bite-sized stories, continuing the numbering from v1 (Epic 6+). Each story must be completable by a single dev agent session.

**Next Step:** Epic and story decomposition, followed by UX Design v2 and Architecture v2 updates.

---

_This PRD captures the requirements for ADHD Timer v2 — the evolution from guided timer to learning companion. "Your plans learn from you" is the thread that connects every feature._

_Created through collaborative discovery between BMad and the BMad Master agent._
