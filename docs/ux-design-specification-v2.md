# ADHD Timer v2 — UX Design Specification

_Created on 2026-02-16 by BMad_
_Extends v1 UX Design Specification: `docs/ux-design-specification.md`_

---

## Executive Summary

v2 extends the Zen Ring / Deep Forest design system established in v1. No changes to the visual foundation (color system, typography, spacing, layout). All v1 UX principles, component designs, and patterns remain in full effect.

v2 adds new interaction patterns for 8 features across 4 themes:
- **🧠 Smarter Steps** — step type visuals, checkpoint display, defer action, manual advance
- **🔁 Routines & Habits** — schedule configuration, "due today" awareness, streak badges
- **💬 Learning Companion** — suggestion cards on completion, gentle step reminders
- **🤖 Smarter AI** — inline vague-task detection during editing

**Design Philosophy Extension:** "Press play. Follow the voice. You're okay." → **"Press play. Follow the voice. You're okay. And tomorrow, it's even better."**

---

## 1. New Design Principles

These extend the v1 principles — they do not replace them.

### 1.1 The App Gets Smarter With You

Every run makes the next run better. Suggestions are gentle, data-driven, and always dismissible. The app never says "you're wrong" — it says "here's what I noticed."

### 1.2 Steps Have Personality

Active steps feel energetic. Wait steps feel calm and patient. Checkpoints feel like milestones. The visual and voice treatment reflects what kind of work each step represents.

### 1.3 Habits Form Without Pressure

Streaks are quiet celebrations, not anxiety engines. Missing a day is a reset, not a failure. The app never makes the user feel guilty for skipping.

---

## 2. New Color Tokens

v2 adds semantic color tokens to the existing Deep Forest palette. No existing tokens change.

| Token | Hex | Usage |
|-------|-----|-------|
| `--wait` | `#6B94B8` | Wait step ring color, calm slate blue (same as `--info`) |
| `--checkpoint` | `#C9A84C` | Checkpoint step indicator, warm gold — distinct from `--behind` amber |
| `--deferred` | `#8A8474` | Deferred step styling (same as `--muted`) |
| `--streak` | `#D4A96A` | Streak badge accent (same as `--accent-warm`) |
| `--suggestion` | `#6BB5A0` | Suggestion card accent (same as `--ahead` — calm, helpful) |

**Rationale:** Reusing existing palette values where possible maintains visual cohesion. New tokens are aliases — if the theme changes, they can diverge independently.

---

## 3. Step Type Visual System

### 3.1 Step Type Indicators

Each step type has a consistent visual identity used across all contexts (editor, running timer, completion view):

| Type | Icon | Ring Color | Voice Prefix | Editor Display |
|------|------|-----------|--------------|----------------|
| **Active** | ▶ (or none — default) | `--primary` / `--ahead` / `--behind` (pace-aware) | "[Step Name]. [Duration]." | Duration swipe/input |
| **Wait** | ⏳ | `--wait` (always — no pace coloring) | "[Step Name]. [Duration]. Waiting." | Duration swipe/input |
| **Checkpoint** | 🎯 | `--checkpoint` (brief flash) | "[Checkpoint Name]. [Status]." | Clock time picker |

### 3.2 Step Type in Timer Editor

**Type selector per step row:**

```
┌─────────────────────────────────────────────────────────┐
│ ≡  [Shower________________] [▶ Active ▾]  [10:00]  ×  │
│ ≡  [Coffee brewing________] [⏳ Wait   ▾]  [ 4:00]  ×  │
│ ≡  [Dressed by 7:30_______] [🎯 Check  ▾]  [7:30 ]  ×  │
│ ≡  [Get dressed___________] [▶ Active ▾]  [ 5:00]  ×  │
│                                                         │
│  [+ Add Step]                           Total: 19:00   │
└─────────────────────────────────────────────────────────┘
```

**Design decisions:**
- Type selector is a compact dropdown (icon + short label) between the step name and duration
- Default is Active — appears pre-selected; no action required for simple timers
- Selecting "Checkpoint" replaces the duration input with a time picker (HH:MM)
- Checkpoint steps show clock time (e.g., "7:30") instead of duration
- Checkpoint durations are excluded from the Total calculation (0 contribution)
- Type icon appears as a subtle badge on the drag handle area

**Accessibility:**
- Type dropdown has `aria-label="Step type for [step name]"`
- Checkpoint time picker has `inputmode="numeric"` and accepts "730", "7:30", "07:30"

### 3.3 Wait Step — Running Timer

**Visual treatment:**
- Inner ring (step progress) uses `--wait` color — calm blue instead of green
- Center step name shows ⏳ icon prefix
- Breathing animation slows down (2x slower pulse) — visual calm
- Text below time: "Waiting..." in `--muted` color

**Behavior:**
- Auto-advances when duration elapses (default)
- Transition message: "Done waiting. Next: [Step Name]."
- Controls remain accessible — user can still Skip or Extend a Wait

**Interaction:**
```
┌──────────────────────────────┐
│         ╭────────╮           │
│       ╭─│ blue   │─╮        │
│     ╭─│ │ ring   │ │─╮      │
│     │ │ │        │ │ │      │
│     │ │ │⏳Coffee │ │ │      │
│     │ │ │ brewing│ │ │      │
│     │ │ │  2:34  │ │ │      │
│     │ │ │Waiting…│ │ │      │
│     ╰─│ │        │ │─╯      │
│       ╰─│        │─╯        │
│         ╰────────╯           │
│     ● ● ◉ ○ ○ ○ ○           │
│                               │
│   [Pause]  [Skip]  [+1 min]  │
└──────────────────────────────┘
```

### 3.4 Checkpoint Step — Running Timer

**Visual treatment:**
- No ring animation (checkpoint is instantaneous)
- Brief full-screen flash of `--checkpoint` gold at reduced opacity (200ms)
- Center displays: 🎯 icon + Checkpoint name + clock comparison
- Auto-continues after 3-4 seconds (or tap to advance immediately)

**Display states:**

| Status | Display | Color |
|--------|---------|-------|
| Ahead | "🎯 Dressed by 7:30 — 4 min early" | `--ahead` |
| On time | "🎯 Dressed by 7:30 — right on time" | `--on-track` |
| Behind | "🎯 Dressed by 7:30 — 3 min past" | `--behind` |

**Interaction:**
```
┌──────────────────────────────┐
│                               │
│         ╭────────╮           │
│       ╭─│        │─╮        │
│     ╭─│ │        │ │─╮      │
│     │ │ │   🎯   │ │ │      │
│     │ │ │Dressed │ │ │      │
│     │ │ │by 7:30 │ │ │      │
│     │ │ │        │ │ │      │
│     │ │ │ 4 min  │ │ │      │
│     │ │ │ early  │ │ │      │
│     ╰─│ │        │ │─╯      │
│       ╰─│  ✓     │─╯        │
│         ╰────────╯           │
│     ● ● ● ◉ ○ ○ ○           │
│                               │
│  [continues automatically]    │
└──────────────────────────────┘
```

**Accessibility:**
- ARIA live region: "Checkpoint: Dressed by 7:30. You are 4 minutes ahead of target."
- Checkpoint dot in step indicators uses 🎯 shape (diamond or target)

### 3.5 Step Type in Step Dots

The step indicator dots below the ring gain type awareness:

| Dot State | Active | Wait | Checkpoint |
|-----------|--------|------|------------|
| Completed | ● (filled `--primary`) | ● (filled `--wait`) | ◆ (diamond `--checkpoint`) |
| Current | ◉ (ring `--primary`) | ◉ (ring `--wait`) | ◇ (diamond ring `--checkpoint`) |
| Upcoming | ○ (dim) | ○ (dim, blue tint) | ◇ (dim diamond) |
| Deferred | ○ (dim, strikethrough) | — | — |

---

## 4. Defer Step UX

### 4.1 Defer Button

**Placement:** Added to the running timer control bar, alongside Pause/Skip/Extend.

```
┌──────────────────────────────────────────┐
│  [Pause]  [Skip]  [Defer]  [+1 min]     │
└──────────────────────────────────────────┘
```

**Button style:** Ghost button, `--muted` text, text label "Defer" (not icon-only — clarity matters for this new concept).

**Behavior on tap:**
1. Current step slides out (subtle left-slide animation, or instant if `prefers-reduced-motion`)
2. Next step slides in and begins
3. Deferred badge appears at top-right of ring area: "1 deferred" in `--deferred` color

### 4.2 Deferred Step Badge

**Position:** Small badge above the step dots, right-aligned.

```
                              1 deferred ↩
● ● ◉ ○ ○ ○
```

**Behavior:**
- Tapping the badge shows a brief list of deferred steps (toast-style or inline expand)
- Badge count updates as steps are deferred: "2 deferred ↩"
- Badge disappears when all deferred steps are resolved

### 4.3 Deferred Step Resolution

**When all main steps complete and deferred steps remain:**

```
┌──────────────────────────────┐
│                               │
│     All main steps done!      │
│                               │
│     You deferred:             │
│     ┌─────────────────────┐  │
│     │ ↩ Make bed  (5 min) │  │
│     └─────────────────────┘  │
│                               │
│  TTS: "You deferred Make bed  │
│  earlier. Ready to do it now?"│
│                               │
│  [Start]  [Skip]              │
└──────────────────────────────┘
```

**Design decisions:**
- Each deferred step is presented individually (not batched)
- User can Start (runs normally), Skip (marks skipped), or Defer again
- After resolving all deferred steps → normal completion view

### 4.4 Deferred Steps in Completion View

Added to the existing completion summary:

```
Done! 38 minutes. ☕
3 min ahead — nice pace

Steps: 5 completed, 1 deferred → completed later, 1 skipped
```

**Tone:** Neutral. "Deferred → completed later" is not positive or negative, just factual.

---

## 5. Manual Advance (Pause-Between-Steps) UX

### 5.1 Setting Toggle

**Location:** Timer creation/editing form, below the step list, alongside the existing countdown toggle.

```
┌─────────────────────────────────────────┐
│ Steps:                                   │
│ ≡ Shower         [Active]  [10:00]  ×   │
│ ≡ Get dressed    [Active]  [ 5:00]  ×   │
│ [+ Add Step]                 Total: 15m │
│                                          │
│ ─────────────────────────────────────── │
│ Show countdown              [  toggle  ] │
│ Pause between steps         [  toggle  ] │
└─────────────────────────────────────────┘
```

**Help text below toggle:** "Timer pauses at each step transition. Tap to start the next step."

### 5.2 Waiting-for-Advance State

**When a step completes and manual advance is on:**

```
┌──────────────────────────────┐
│                               │
│         ╭────────╮           │
│       ╭─│ rings  │─╮        │
│     ╭─│ │ frozen │ │─╮      │
│     │ │ │        │ │ │      │
│     │ │ │  Next: │ │ │      │
│     │ │ │  Get   │ │ │      │
│     │ │ │Dressed │ │ │      │
│     │ │ │        │ │ │      │
│     ╰─│ │        │ │─╯      │
│       ╰─│        │─╯        │
│         ╰────────╯           │
│     ● ◉ ○ ○ ○               │
│                               │
│  ┌─────────────────────────┐ │
│  │    ▶  Start Get Dressed │ │
│  └─────────────────────────┘ │
│                               │
│       [Skip]  [Stop]          │
└──────────────────────────────┘
```

**Design decisions:**
- Rings freeze (outer ring holds current total progress, inner ring empty for next step)
- Center text shows "Next: [Step Name]"
- Large primary button replaces the control bar: "▶ Start [Step Name]"
- Skip and Stop are available as ghost buttons below
- TTS: "Done. Next up: Get Dressed. Tap when ready."
- Time is NOT counting — no pressure on the transition

**Interaction with Wait steps:** Wait steps auto-advance normally (the wait IS the action). But the transition FROM a completed Wait → next step still pauses for manual advance.

**Interaction with Checkpoints:** Checkpoints display their status instantly, then show the manual advance prompt for the NEXT step. No pause on the Checkpoint itself.

### 5.3 Waiting-for-Advance — Accessibility

- `aria-live="assertive"` announcement: "Step complete. Next step: Get Dressed. Activate the Start button to begin."
- Start button auto-focused for keyboard users
- Enter/Space activates the Start button

---

## 6. Repeatable Routines & Scheduling UX

### 6.1 Schedule Configuration

**Location:** Timer creation/editing form, as a collapsible section below the toggles.

```
┌──────────────────────────────────────────┐
│ Show countdown              [  toggle  ] │
│ Pause between steps         [  toggle  ] │
│                                          │
│ ▸ Schedule (optional)                    │
└──────────────────────────────────────────┘

Expanded:
┌──────────────────────────────────────────┐
│ ▾ Schedule                               │
│                                          │
│   Repeat on:                             │
│   [M] [T] [W] [T] [F] [ ] [ ]          │
│    ●   ●   ●   ●   ●   ○   ○           │
│                                          │
│   Time of day:                           │
│   [Morning] [Afternoon] [Evening] [Any]  │
│    ●●●●●●    ○○○○○○○    ○○○○○○   ○○○   │
│                                          │
│   Streaks enabled       [  toggle  ]     │
└──────────────────────────────────────────┘
```

**Design decisions:**
- Schedule section is collapsed by default — simple timers don't see it
- Day picker: 7 circular day buttons, filled when selected (`--primary`)
- Time-of-day: segmented control (only one selection)
- Streaks toggle is nested under Schedule (streaks only make sense for scheduled routines)
- All fields optional — a timer can be scheduled without streaks, or not scheduled at all

### 6.2 Timer Library — "Due Today" Section

**When scheduled routines exist:**

```
┌──────────────────────────────────────────┐
│ My Timers                          ⚙     │
│                                          │
│ DUE TODAY                                │
│ ┌──────────────────────────────────────┐ │
│ │ ☀ Morning Routine                    │ │
│ │ 5 steps · 33 min · Day 6 ☕          │ │
│ │                              [▶ Play]│ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ 🌙 Evening Wind-Down      ✓ Done    │ │
│ │ 4 steps · 20 min · Day 3            │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ALL TIMERS                               │
│ ┌──────────────────────────────────────┐ │
│ │ Make Pasta Carbonara                 │ │
│ │ 5 steps · 38 min                     │ │
│ │                              [▶ Play]│ │
│ └──────────────────────────────────────┘ │
│ ...                                      │
└──────────────────────────────────────────┘
```

**Design decisions:**
- "DUE TODAY" section appears at top only when scheduled routines are due
- Time-of-day icon: ☀ Morning, 🌤 Afternoon, 🌙 Evening
- Completed routines in "Due Today" show "✓ Done" badge with muted styling (no play button)
- Streak badge on the card: "Day 6 ☕" in `--streak` color
- Non-scheduled timers appear under "ALL TIMERS" section
- If no routines are due today, the "DUE TODAY" section doesn't appear (no "Nothing due!" empty state — that would be noise)

### 6.3 Streak Badge Design

**On timer library card:**
```
Day 6 ☕
```

**Milestone celebrations (brief toast, not modal):**

| Milestone | Toast Message | Duration |
|-----------|--------------|----------|
| Day 1 | "Day 1 — nice start" | 3 sec |
| Day 7 | "One week ☕" | 3 sec |
| Day 14 | "Two weeks — it's becoming a habit" | 3 sec |
| Day 30 | "One month 🌟" | 4 sec |
| Day 100 | "Triple digits. Respect. 💯" | 4 sec |

**Reset display:** No message. Streak silently resets to 0. Next completion: "Day 1 — fresh start."

**Style:**
- Small text, `--streak` color, right-aligned on the card
- No animation, no sparkle, no gamification energy
- Opt-in: respects "Show streaks" global setting

---

## 7. Post-Completion Review & Suggestions UX

### 7.1 Suggestion Section in Completion View

Extends the existing completion view (v1). Suggestions appear BELOW the standard summary.

```
┌──────────────────────────────────────────┐
│                                          │
│              Done! 38 min. ☕             │
│          3 min ahead — nice pace         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Shower       10:12 / 8:00  +2:12  │  │
│  │ Get dressed   2:48 / 5:00  -2:12  │  │
│  │ Breakfast    12:30 / 12:00 +0:30  │  │
│  │ Brush teeth   2:45 / 3:00  -0:15  │  │
│  │ Pack bag      4:50 / 5:00  -0:10  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  ☕ Suggested Tweaks                     │
│  Based on your last 5 runs:             │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 🔄 Shower: 8 min → 10 min         │  │
│  │    avg: 10:12                      │  │
│  │    [Accept]  [Dismiss]             │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ 🔄 Get Dressed: 5 min → 3 min     │  │
│  │    avg: 2:48                       │  │
│  │    [Accept]  [Dismiss]             │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ✓ Other steps are on track             │
│                                          │
│  [Accept All]              [Dismiss All] │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│              [Done]                      │
└──────────────────────────────────────────┘
```

### 7.2 Suggestion Card Design

**Each suggestion card:**
- Background: `--surface` with left border accent in `--suggestion` color
- Icon: 🔄 (rotation arrows — change, not fix)
- Content: Step name, current → suggested duration, average actual below in `--muted`
- Buttons: "Accept" (primary ghost), "Dismiss" (muted ghost)
- Accepted cards: slide up/collapse with checkmark ✓, brief green flash
- Dismissed cards: fade out

**Bulk actions:**
- "Accept All" — primary ghost button, left-aligned
- "Dismiss All" — muted ghost button, right-aligned
- After bulk action, all cards animate out simultaneously

### 7.3 Suggestion Card — Accessibility

- Cards are in a `role="list"` region with `aria-label="Suggested duration adjustments"`
- Each card: `role="listitem"` with descriptive label: "Suggestion: Change Shower from 8 minutes to 10 minutes. Average actual duration: 10 minutes 12 seconds."
- Accept/Dismiss buttons have clear `aria-label`s
- After accepting: ARIA announcement "Shower adjusted to 10 minutes"
- After dismissing: ARIA announcement "Suggestion for Shower dismissed"

### 7.4 No-Suggestions State

When the timer has 3+ runs but no steps meet the threshold:

```
✓ Your durations are on track — no tweaks needed.
```

Displayed as a single line in `--muted` color. Brief, reassuring, no action required.

---

## 8. Gentle Step Reminder UX

### 8.1 Reminder Visual

**During a long active step, at the midpoint and during overruns:**

```
Midpoint reminder:
┌──────────────────────────────┐
│                               │
│  ┌─────────────────────────┐ │
│  │ You're working on Shower │ │  ← subtle overlay, fades in/out over 3s
│  └─────────────────────────┘ │
│                               │
│         ╭────────╮           │
│       ╭─│  ring  │─╮        │
│     ...  normal   ...        │
└──────────────────────────────┘
```

**Design decisions:**
- Reminder appears as a brief text overlay ABOVE the ring (same z-layer as transition overlay, different position)
- Text: "You're working on [Step Name]" — no time info, just grounding
- Style: `--text` on semi-transparent `--surface` background, small rounded pill
- Duration: Fades in over 0.5s, holds 2s, fades out over 0.5s
- TTS (if enabled): Same text, spoken softly
- No sound effect — voice is enough

### 8.2 Reminder Settings

**In settings sheet:**

```
┌──────────────────────────────────────────┐
│ Step Reminders              [  toggle  ] │
│ Remind during steps longer than:         │
│ [  5  ] minutes              ← stepper  │
└──────────────────────────────────────────┘
```

- Default: enabled, 5-minute threshold
- Stepper allows 3, 5, 10, 15 minute options
- When disabled, no midpoint or overrun reminders fire

### 8.3 Reminder — Reduced Motion

With `prefers-reduced-motion`:
- Text appears/disappears instantly (no fade)
- Ring pulse effect disabled (static display)

---

## 9. AI Vague-Task Detection UX

### 9.1 Inline Detection in Timer Editor

**When a step name is detected as vague (on blur or save):**

```
┌──────────────────────────────────────────┐
│ ≡  [Clean the house_______] [Active]  ×  │
│    ┌─────────────────────────────────┐   │
│    │ 💡 This seems broad — want me   │   │
│    │    to break it down?            │   │
│    │    [Break it down ✨] [No thanks]│   │
│    └─────────────────────────────────┘   │
│ ≡  [Make dinner___________] [Active]  ×  │
└──────────────────────────────────────────┘
```

**Design decisions:**
- Suggestion appears inline, directly below the flagged step
- Background: `--surface` with left border in `--info` color
- "Break it down ✨" uses the same CTA text as the existing AI panel (consistency)
- "No thanks" is a small muted link (not a button — low visual weight)
- Dismissed suggestion disappears immediately (no animation)
- If user taps "Break it down": loading skeleton replaces the single step → multiple steps populate

### 9.2 AI Expansion Behavior

**When "Break it down" is tapped on a vague step:**

1. The single step row shows a brief loading skeleton
2. AI generates substeps
3. The single vague step is REPLACED by the generated substeps in the step list
4. Generated steps are highlighted briefly (subtle `--suggestion` left border, fades after 2s)
5. User can edit all generated steps normally

**Example:**
```
Before:
  ≡ Clean the house    [Active]  [30:00]

After AI:
  ≡ Pick up clutter    [Active]  [ 5:00]  ← highlighted briefly
  ≡ Vacuum living room [Active]  [10:00]  ← highlighted briefly
  ≡ Wipe kitchen       [Active]  [ 8:00]  ← highlighted briefly
  ≡ Clean bathroom     [Active]  [ 7:00]  ← highlighted briefly
```

### 9.3 Detection — No False Positives

**Steps that should NOT trigger detection:**
- Steps generated by AI (in the same session — trust the AI's own output)
- Steps with very specific names: "Shower", "Brush teeth", "Boil water"
- Steps that have been previously dismissed for this exact name

**Steps that SHOULD trigger detection:**
- "Clean the house", "Work on project", "Do homework", "Get ready", "Chores"
- Very long descriptions that read like tasks, not steps
- Single-word generic verbs: "work", "clean", "organize" (without a specific object)

---

## 10. Component Library — v2 Additions

### 10.1 New Custom Components

#### Step Type Selector

- **Purpose:** Compact dropdown for selecting step type in timer editor
- **Content:** Icon + short label (▶ Active, ⏳ Wait, 🎯 Check)
- **User Actions:** Tap to open dropdown, select type
- **States:** Active (default), Wait, Checkpoint — each with distinct icon
- **Variants:** Standard (in step row), Compact (icon-only for narrow screens)
- **Accessibility:** `aria-label="Step type"`, keyboard navigable dropdown

#### Checkpoint Time Picker

- **Purpose:** Clock time input for Checkpoint steps (replaces duration input)
- **Content:** HH:MM input field with AM/PM toggle (or 24h based on locale)
- **User Actions:** Tap to type time, or use stepper arrows
- **States:** Empty (placeholder "7:30"), Filled, Error (invalid time)
- **Accessibility:** `inputmode="numeric"`, `aria-label="Checkpoint target time"`

#### Defer Button

- **Purpose:** Defer current step during playback
- **Content:** Text button "Defer"
- **Style:** Ghost button, `--muted` text, same size as other control buttons
- **States:** Default, Pressed (brief haptic if supported), Disabled (can't defer Checkpoints)

#### Deferred Badge

- **Purpose:** Show count of deferred steps during playback
- **Content:** "[N] deferred ↩"
- **Style:** Small pill, `--deferred` color text, positioned above step dots
- **User Actions:** Tap to see list of deferred steps (toast/expand)
- **States:** Hidden (0 deferred), Visible (1+ deferred)

#### Manual Advance Button

- **Purpose:** Large "Start next step" button shown during waiting-for-advance state
- **Content:** "▶ Start [Step Name]"
- **Style:** Full-width primary button, prominent, auto-focused
- **States:** Default (ready to tap), Pressed
- **Accessibility:** Auto-focused, `aria-label="Start [step name]"`

#### Suggestion Card

- **Purpose:** Show a duration adjustment suggestion in the completion view
- **Content:** Step name, current → suggested duration, average actual, Accept/Dismiss
- **Style:** `--surface` background, `--suggestion` left border accent
- **User Actions:** Accept (updates template), Dismiss (removes card)
- **States:** Default, Accepted (collapse with ✓), Dismissed (fade out)
- **Accessibility:** `role="listitem"`, descriptive labels, keyboard navigable

#### Streak Badge

- **Purpose:** Display streak count on timer library card
- **Content:** "Day [N] ☕" or milestone text
- **Style:** Small text, `--streak` color, right-aligned on card
- **States:** Active streak (Day N), No streak (hidden), Milestone (toast appears)

#### Schedule Section

- **Purpose:** Collapsible schedule configuration in timer editor
- **Content:** Day picker, time-of-day segmented control, streaks toggle
- **Style:** Collapsible section with ▸/▾ indicator
- **States:** Collapsed (default), Expanded, Configured (shows summary when collapsed: "Mon-Fri, Morning")

#### Vague Task Suggestion

- **Purpose:** Inline suggestion below a vague step name in the editor
- **Content:** "💡 This seems broad — want me to break it down?"
- **Style:** Inline card, `--info` left border, subtle background
- **User Actions:** "Break it down ✨" (triggers AI) or "No thanks" (dismisses)
- **States:** Visible, Loading (AI processing), Dismissed

### 10.2 Modified Existing Components

#### Timer Library Card (extended)

- **New elements:** Streak badge (if scheduled), "✓ Done" badge (if completed today), time-of-day icon
- **New section header:** "DUE TODAY" appears above scheduled routine cards

#### Completion Summary View (extended)

- **New section:** "Suggested Tweaks" below existing summary (conditionally shown)
- **New element:** Deferred step summary line in the stats area

#### Step Dots (extended)

- **New shapes:** Diamond (◆/◇) for Checkpoint steps, strikethrough for deferred steps
- **New colors:** `--wait` tint for Wait steps, `--checkpoint` for Checkpoint steps

#### Playback Controls (extended)

- **New button:** "Defer" added to control bar
- **New state:** `waiting-for-advance` replaces controls with manual advance button

#### Settings Sheet (extended)

- **New toggles:** "Step reminders" with threshold stepper, "Show streaks"

---

## 11. Responsive Considerations

No changes to the v1 responsive strategy. All new components follow the same rules:

- Single-column layout at all breakpoints
- 48px minimum touch targets
- Mobile-first, phone-in-portrait is the hero
- Schedule day picker: 7 buttons fit in a single row at 320px width
- Suggestion cards: full-width within content column
- Step type selector: compact enough to fit in step row on narrow screens (icon + abbreviated label)

---

## 12. Implementation Priority for v2 UX

Components should be built in this order to match anticipated epic sequencing:

1. **Step Types Epic:** Step Type Selector, Checkpoint Time Picker, Wait step ring visual, Checkpoint display, Step Dots (extended)
2. **Playback Evolution Epic:** Defer Button, Deferred Badge, Manual Advance Button, Playback Controls (extended)
3. **Routines & Habits Epic:** Schedule Section, Timer Library Card (extended with due today + streak), Streak Badge
4. **Learning Companion Epic:** Suggestion Card, Completion Summary View (extended), Reminder overlay
5. **Smarter AI Epic:** Vague Task Suggestion (inline)

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-14 | 1.0 | Initial UX Design Specification (v1 MVP) | BMad |
| 2026-02-16 | 2.0 | v2 UX extensions — step types, defer, manual advance, scheduling, streaks, suggestions, reminders, vague-task detection | BMad |

---

_This v2 UX Design Specification extends the v1 Zen Ring / Deep Forest design system with new interaction patterns for 8 features. All v1 patterns, components, and principles remain in full effect._

_Next: Architecture v2 will define schema changes, state machine evolution, and technical implementation approach._
