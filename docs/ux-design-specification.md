# ADHD Timer UX Design Specification

_Created on 2026-02-14 by BMad_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

ADHD Timer is a web-first PWA that transforms routine execution from a daily cognitive battle into a guided, voice-announced, real-time-synced experience. The UX is designed as an **emotional co-pilot** — carrying the cognitive load of "what's next" so the user can just follow along.

The design direction is **Zen Ring** — concentric progress rings as the visual hero, minimal text, maximum calm. The visual foundation uses the **Deep Forest 🌲** color theme — earthy, grounding, dark-mode-first with moss greens and warm accents. The component system is built on **shadcn/ui** for standard UI elements, with custom components for the novel timer execution experience.

**Design Philosophy:** "Press play. Follow the voice. You're okay."

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Selected: shadcn/ui** (Radix UI primitives + Tailwind CSS)

**Rationale:**
- The running timer view is highly custom (progress rings, TTS, transitions) — no component library handles that. It's built from scratch regardless.
- The surrounding UI (timer library cards, creation form, settings, auth, modals, buttons, inputs) is standard — shadcn/ui handles all of it with accessible, keyboard-navigable, screen-reader-friendly components.
- Dark mode is built-in via Tailwind's `dark:` variant + shadcn theming.
- Zero dependency lock-in — components live in the project codebase, fully customizable.
- The aesthetic is clean and minimal, aligned with "warm, calm, uncluttered."
- Current version compatibility: shadcn/ui works with Next.js 14+, React 18+, Tailwind CSS.

**Components provided by shadcn/ui:**
- Button, Input, Label, Dialog/Modal, Toast, Card, Dropdown Menu, Switch/Toggle, Separator, Skeleton (loading), Form, Sheet (bottom drawer on mobile), Tooltip

**Custom components needed (built from scratch):**
- Concentric Progress Ring (the hero timer visualization)
- Timer Library Card (custom card with play button)
- Step List Editor (with drag-to-reorder, swipe-to-adjust)
- Step Transition Overlay (contextual message during step change)
- Completion Summary View
- AI Breakdown Input + Loading State

---

## 2. Core User Experience

### 2.1 Defining Experience

> **"Press play. Follow the voice. You're okay."**
>
> ADHD Timer's defining experience is the moment you tap one button and surrender the cognitive load. The voice tells you what to do. The screen shows where you are. The transitions tell you you're on track. You don't have to think, decide, or remember. You just follow along — and the routine gets done.

**Core Experience Principles:**

1. **Speed** — From app open to voice saying "Shower. 8 minutes." in 2 taps and < 3 seconds
2. **Guidance** — The app always tells you what's next, where you are, and that you're okay
3. **Flexibility** — Extend time, skip steps, take control on another device — no friction, no shame
4. **Feedback** — Progress is always visible. State changes are always communicated. Nothing happens silently.

**Inspiration Anchors:**
- **IntervalTimer:** Bold timer display, minimal UI during execution, phase-based color awareness
- **DoorDash:** Real-time step tracking, "it's handled" confidence, warm/friendly tone, anxiety-reducing progress visualization

### 2.2 Novel UX Patterns

**The Guided Execution Ring**

A concentric progress ring visualization — the hero of the running timer screen:

- **Outer ring** = total routine progress (how far through the entire timer)
- **Inner ring** = current step progress (how far through this step)
- **Center text** = step name (primary-soft color), elapsed time (large, light weight), pace status (ahead/behind color)
- **Ring colors shift** based on pace:
  - Ahead: calm teal-green (`#6BB5A0`)
  - On track: primary moss green (`#7EBD73`)
  - Behind: warm amber (`#D4A96A`)
- **Step indicator dots** below the ring show position in the sequence (filled = done, ring = current, dim = upcoming)

**Design Rationale:** The ring is the visual analog of the voice. Where TTS says "Shower. 8 minutes. You're 1 min ahead," the ring *shows* it. Together, they create redundant guidance — hear it AND see it — which is critical for ADHD users who may miss one channel.

**Interaction Model:**
- The ring is not interactive — it's purely visual feedback
- Controls (pause, skip, extend) live below the ring as circular icon buttons
- Minimal visual noise — the ring does the heavy lifting
- Ring progress uses `stroke-dashoffset` animation for smooth movement

**States:**
- **Running:** Rings animate smoothly, center text updates, step dots reflect position
- **Paused:** Rings freeze, center time stops, a subtle "paused" indicator appears
- **Step transition:** Brief overlay shows "Time to start [Next Step]" with pace context (3-5 seconds, then fades)
- **Completed:** Rings fill to 100%, transition to completion summary view

---

## 3. Visual Foundation

### 3.1 Color System

**Selected Theme: Deep Forest 🌲**

Earthy and grounding. A morning in a quiet forest — moss greens, warm bark, dappled light. The palette that says "you're rooted, you're safe."

**Interactive Visualization:** [ux-color-themes.html](./ux-color-themes.html)

#### Background & Surface (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#0C0F0A` | Page background, near-black with green undertone |
| `--surface` | `#151A13` | Cards, panels, elevated containers |
| `--elevated` | `#1E261B` | Modals, popovers, secondary controls |
| `--border` | `#2A3326` | Borders, dividers, ring track backgrounds |

#### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#7EBD73` | Primary actions (play button, save, active states) |
| `--primary-soft` | `#A8C9A0` | Step name in timer, secondary emphasis |
| `--accent-warm` | `#D4A96A` | "+1 min" extend, warm accents, behind-state elements |
| `--text` | `#E8DCC8` | Primary text color (warm cream, not harsh white) |
| `--muted` | `#8A8474` | Secondary text, timestamps, metadata, disabled states |

#### Semantic / Timer State Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--ahead` | `#6BB5A0` | Pace ahead indicator, calm teal-green |
| `--on-track` | `#7EBD73` | On-track indicator (same as primary) |
| `--behind` | `#D4A96A` | Pace behind indicator, warm amber (NOT red) |
| `--warning` | `#C47A6C` | Destructive actions (delete timer), error states — muted terracotta |
| `--info` | `#6B94B8` | Informational badges, sync status, slate blue |

#### Design Rationale

- **Dark mode default** because many ADHD users are light-sensitive, especially in the morning
- **Green undertone in backgrounds** ties the entire surface layer to the forest metaphor
- **Warm cream text** (`#E8DCC8`) instead of pure white reduces eye strain and feels friendlier
- **Behind = amber, not red** because being behind schedule is information, not failure. Red triggers anxiety. Amber says "hey, just so you know."
- **Muted terracotta for warning** (`#C47A6C`) is only used for genuinely destructive actions (delete timer), never for "you're behind"

### 3.2 Typography

**Font Families:**

| Role | Font | Fallback | Rationale |
|------|------|----------|-----------|
| Heading & UI | Inter | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif | Clean, highly legible, excellent tabular numerals for timer display |
| Body | Inter | Same fallback stack | Consistency — one font family keeps the visual noise low |
| Monospace | JetBrains Mono | 'Fira Code', 'SF Mono', monospace | Only for duration input fields and debug info |

**Type Scale:**

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| h1 | 1.6rem (25.6px) | 700 | 1.2 | Page titles ("My Timers") |
| h2 | 1.4rem (22.4px) | 700 | 1.2 | Section headers, timer name in edit view |
| h3 | 1.1rem (17.6px) | 600 | 1.3 | Card titles, step names in list |
| body | 0.9rem (14.4px) | 400 | 1.5 | General text, descriptions |
| small | 0.8rem (12.8px) | 400 | 1.4 | Metadata, timestamps, step counts |
| caption | 0.7rem (11.2px) | 500 | 1.3 | Labels, uppercase section headers |
| timer-time | 2.8rem (44.8px) | 300 | 1.0 | Elapsed time display in ring center |
| timer-step | 1.1rem (17.6px) | 500 | 1.2 | Step name inside ring center |

**Font Weight Usage:**
- **300 (Light):** Timer time display only — large numerals that breathe
- **400 (Regular):** Body text, descriptions, metadata
- **500 (Medium):** Step names, labels, secondary buttons
- **600 (Semi-bold):** Card titles, emphasis within body text
- **700 (Bold):** Page titles, primary actions, timer name

### 3.3 Spacing & Layout

**Base Unit:** 4px

**Spacing Scale (Tailwind compatible):**

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Inline gaps, icon-to-text |
| `space-2` | 8px | Tight component padding, step dot gaps |
| `space-3` | 12px | Card internal padding (tight), button gaps |
| `space-4` | 16px | Standard card padding, section gaps |
| `space-5` | 20px | Page horizontal padding (mobile) |
| `space-6` | 24px | Between major sections |
| `space-8` | 32px | Page section separation |
| `space-10` | 40px | Safe area / bottom padding on mobile |

**Border Radius Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Input fields, chips, small elements |
| `radius-md` | 12px | Buttons, toast notifications |
| `radius-lg` | 16px | Cards, library timer cards |
| `radius-xl` | 20px | Modals, prominent floating elements |
| `radius-full` | 9999px | Circular buttons (play, pause, skip), pills |

**Layout Grid:**
- Mobile: Single column, 20px horizontal padding
- Tablet: Single column, 32px horizontal padding, max-width 600px centered
- Desktop: Single column content area max-width 480px centered (this is a mobile-first app — desktop is a convenience, not the primary experience)

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**Selected: Zen Ring (Direction 1)**

**Interactive Mockups:** [ux-design-directions.html](./ux-design-directions.html)

**Philosophy:** The concentric progress ring IS the app. Everything else whispers. Maximum calm, minimum cognitive load.

**Layout Pattern:**
- Running timer: Full-screen single-purpose view. Ring centered. Step dots below. Controls at bottom.
- Timer library: Vertical list of cards with prominent play buttons. Simple, scannable.
- Timer creation: Single-screen form. Steps as an inline editable list.
- Completion: Centered summary with emoji, stats, and a single "Done" button.

**Visual Hierarchy:**
1. Progress rings (the hero — largest visual element, center of attention)
2. Step name + time (inside rings, text centered and right-side-up)
3. Pace status message (subtle, below time, breathing animation)
4. Step indicator dots (small, positional, below ring)
5. Controls (bottom of screen, always accessible, never in the way)

**Interaction Patterns:**
- **Running timer:** Minimal — watch and listen. Controls at bottom are always accessible.
- **Step transitions:** Brief overlay (3-5 seconds), then auto-fades. Shows next step name, pace.
- **Extend time:** Single tap on "+1m" button. No modal. No confirmation. Immediate.
- **Skip step:** Single tap on skip button. No confirmation. Principle: "Allow an override."
- **Timer library → Play:** One tap on the play button on the card. Instant.

**Visual Style:** Ultra minimal. The screen should feel like a breathing meditation app during execution — the ring pulses gently, the text is calm, and the controls are unobtrusive. Dense information is reserved for the completion view and timer editor.

**User's Reasoning:** "The concentric rings create a visual anchor that's calming but informative. You glance and know where you are. The text inside the rings keeps everything in one focal point — no scanning around the screen."

---

## 5. User Journey Flows

### 5.1 Critical User Paths

All 7 critical user flows are defined in the [PRD User Flows section](./PRD.md#user-flows). This section specifies the UX design approach for each.

#### Flow 1: First-Time User — Sign Up & Create First Timer

**Goal:** New user goes from landing page to playing their first timer.

**UX Approach:**
- **Landing page:** Clean, dark, single CTA: "Sign in with Google" (primary button) + "Sign in with Email" (secondary link)
- **Post-auth empty state:** The timer library shows a warm, inviting empty state — not a blank page. A large "Create your first timer" card with a friendly message: "Build a routine, then just press play."
- **Timer creation:** Single-screen inline form. Timer name field auto-focused. "Add Step" button adds an inline row (step name + duration). Total duration auto-calculates at bottom. "Save" button at bottom.
- **First play:** After save, the timer card appears with a prominent play button. One tap starts the experience.

**Screen Sequence:** Landing → Auth → Timer Library (empty state) → Timer Creation → Timer Library (with card) → Running Timer

**Key Design Decisions:**
- No onboarding tutorial in v1 — the empty state IS the onboarding
- Google Sign-In is visually primary (largest, most prominent) — lowest friction path
- Timer creation and timer editing use the exact same component — no mode confusion
- The AI breakdown option is visible on the creation page but secondary to manual creation

**Emotional Note:** The empty state must feel inviting, not empty. "Create your first timer" should feel exciting, not like homework.

#### Flow 2: Repeat User — Run Existing Routine (THE CORE LOOP)

**Goal:** User opens app, taps play on their routine. 2 taps. < 3 seconds.

**UX Approach:**
- **App opens:** Already signed in (session persists). Active session check runs.
  - If active session exists → auto-redirect to running timer view
  - If no active session → timer library
- **Timer library:** Sorted by last-used (most recent first). The timer they use most is right at the top. Play button is a 48px circular green button on each card — impossible to miss, easy to tap with groggy hands.
- **Running timer activates immediately:** Wake lock acquired, TTS speaks first step, ring begins animating.

**Screen Sequence:** App opens → Timer Library → Tap Play → Running Timer View

**Key Design Decisions:**
- Sorting by last-used means the user's daily routine is always the first card. The "decision" of which timer to play is almost zero.
- The play button is circular, green, 48px — the largest touch target on the card. Designed for half-awake morning taps.
- No intermediate "confirm start" screen. Play means play. Instantly.

**Emotional Note:** This is the product. From app open to "Shower. 8 minutes." must feel instant and inevitable.

#### Flow 3: Timer Creation — Manual

**Goal:** User creates a new routine from scratch.

**UX Approach:**
- **Single-screen form.** Timer name field at top. Steps list below. Add step button. Save at bottom.
- **Each step row:** Step name (text input, left) + duration (number, right). Swipe right/left to ±1 minute on duration (Epic 4). Drag handle on left for reorder (Epic 4). Swipe-to-delete.
- **Auto-calculated total** displayed below the step list.
- **Countdown toggle** at bottom (optional, default off).
- **Save button** at bottom, disabled until timer has a name and at least 1 step.

**Screen Sequence:** Timer Library → "+" Button → Timer Creation → Save → Timer Library

**Key Design Decisions:**
- ALL on one screen. No multi-page wizard. No tabs. ADHD users lose context in multi-step flows.
- Duration defaults to 5 minutes for new steps — always have a default.
- Swipe gestures and drag-to-reorder are Epic 4 polish. v1 has simple +/- buttons and manual ordering.

#### Flow 4: Timer Creation — AI-Assisted

**Goal:** User describes a task, AI generates a complete timer.

**UX Approach:**
- **AI section at top of creation page:** Text input with placeholder "Describe your task..." and a "Break it down ✨" button.
- **Loading state:** "Breaking it down..." with skeleton step rows animating in.
- **Success:** Timer name auto-filled. Steps populate in the same editable form below. User can edit names, adjust durations, add/remove/reorder before saving.
- **Regenerate:** Button below the generated steps to get a different breakdown.
- **Failure:** Friendly message ("Couldn't generate steps — try again or create manually"), manual form still fully functional.

**Screen Sequence:** Timer Creation → Type task → "Break it down ✨" → Loading → Steps populate → Edit/Save

**Key Design Decisions:**
- AI result populates the SAME form as manual creation. The user always has full control.
- The AI section is prominent but not blocking. User can ignore it and create manually.
- Rate limit message is friendly: "You've used all 20 AI breakdowns today. Try again tomorrow!"

**Emotional Note:** The AI result should feel like a helpful suggestion from a friend, not a rigid prescription.

#### Flow 5: Multi-Device Sync

**Goal:** Timer running on phone, user continues on laptop.

**UX Approach:**
- **Second device opens:** Auth is already active. Active session detected → auto-redirect to running timer.
- **Observer mode:** Same ring visualization, same progress, same step — but controls are DISABLED. A clear label indicates: "Controlled from another device."
- **"Take Control" button:** Visible, prominent enough to find but not prominent enough to accidentally tap. Single tap transfers control.
- **Control transfer:** Seamless. The other device becomes observer. No confirmation dialog (quick, frictionless).

**Screen Sequence:** Open app on Device 2 → Active session detected → Running Timer (Observer) → "Take Control" → Running Timer (Controller)

**Key Design Decisions:**
- Auto-redirect to active session means zero navigation decisions on the second device.
- Observer mode shows the exact same visual (rings, time, step) — the user confirms "yep, that's my timer" instantly.
- "Take Control" is a text button, not an icon. Clarity over cleverness.

**Emotional Note:** This should feel like magic. You put down your phone, sit at your desk, and your routine is just *there*.

#### Flow 6: Timer Editing

**Goal:** User modifies a saved timer after using it.

**UX Approach:**
- **Access:** Tap "Edit" action on timer card (or long-press → Edit context menu).
- **Edit page:** Identical to creation page, pre-populated with current values. Same form, same interactions.
- **Save:** Updates the template. Returns to timer library with updated card.

**Screen Sequence:** Timer Library → Edit action → Timer Edit (pre-populated) → Save → Timer Library

**Key Design Decisions:**
- Edit and create are the same component. Period. No mode-specific bugs, no learning two interfaces.
- Editing a template does NOT affect any running session based on that template.

#### Flow 7: Error & Edge Cases

**UX Approach for each:**

| Scenario | UX Response |
|----------|-------------|
| **Lost internet during timer** | Timer continues locally. No error shown. Reconnection syncs silently. |
| **App opened with no internet** | Library loads from cache. Play button shows: "Connect to internet to start." |
| **Stale session (hours old)** | Auto-redirect to session. User can "Stop" to clear and return to library. |
| **AI rate limit** | Friendly message + manual creation still works. |
| **TTS unavailable** | Graceful fallback to visual-only. No error state. |
| **Wake Lock unsupported** | No error. Screen behaves normally. |
| **Auth token expired** | Silent refresh. If refresh fails, redirect to sign-in. |

**Design Principle for all errors:** The user should never see a technical error. Every edge case has a human-readable message and a clear next action. Anxiety is the enemy.

---

## 6. Component Library

### 6.1 Component Strategy

**Standard components from shadcn/ui (customized with Deep Forest theme):**

| Component | Usage | Customization |
|-----------|-------|---------------|
| **Button** | All buttons throughout the app | Deep Forest color tokens, 12px radius |
| **Input** | Timer name, step name, email, password | Dark surface bg, cream text, muted placeholder |
| **Label** | Form labels | Caption size, muted color, uppercase |
| **Dialog** | Delete confirmation, take-control confirm | Dark elevated bg, soft border |
| **Toast** | Success messages, sync status, errors | Dark surface, left-colored-border for semantic |
| **Card** | Timer library cards shell | Surface bg, border, 16px radius |
| **Switch** | Countdown toggle, TTS toggle | Primary color when on |
| **Sheet** | Mobile bottom drawer for settings/options | Elevated bg, drag handle |
| **Skeleton** | Loading states (timer list, AI breakdown) | Subtle pulse on elevated bg |
| **Dropdown Menu** | Timer card actions (edit, duplicate, delete) | Elevated bg, muted text |

**Custom components (built from scratch):**

#### Concentric Progress Ring

- **Purpose:** The hero visualization of the running timer — shows step progress and total progress simultaneously.
- **Content:** Outer ring (total), inner ring (step), center text (step name, time, pace)
- **User Actions:** None — purely visual. Controls are separate buttons below.
- **States:**
  - *Running:* Rings animate via `stroke-dashoffset`. Colors reflect pace (ahead/on-track/behind).
  - *Paused:* Rings freeze. Subtle "PAUSED" label appears below time.
  - *Transition:* Rings hold while transition overlay shows next step (3-5 sec).
  - *Completed:* Both rings fill to 100%. Brief celebration state before navigation.
- **Variants:** Standard (260px for mobile), Compact (140px for compare view / desktop sidebar if needed)
- **Accessibility:** ARIA labels on the SVG: "Morning Routine progress: step 2 of 5, Shower, 5 minutes 23 seconds elapsed, 1 minute ahead of schedule"

#### Timer Library Card

- **Purpose:** Display a saved timer template with one-tap play access.
- **Content:** Timer name, step count, total duration, last used date, play button.
- **User Actions:** Tap play (start timer), tap card body (navigate to edit/detail), long-press or "..." menu (edit, duplicate, delete).
- **States:**
  - *Default:* Surface bg, primary play button.
  - *Active session:* If this timer has a running session, card shows "Running" badge with animated dot. Play button becomes "Resume" → navigates to running timer.
  - *Loading:* Skeleton shimmer while Firestore loads.
- **Variants:** Standard (full width), Empty State (dashed border, "+ Create your first timer" text).
- **Accessibility:** Card is a clickable region. Play button has `aria-label="Start Morning Routine, 5 steps, 33 minutes"`.

#### Step List Editor

- **Purpose:** Create and edit timer steps with inline name + duration editing.
- **Content:** Ordered list of step rows. Each row: drag handle, step name input, duration display/input, delete action.
- **User Actions:** Add step (bottom button), edit name (tap text field), adjust duration (tap number or swipe in Epic 4), reorder (drag handle in Epic 4), delete (swipe left or tap × icon).
- **States:**
  - *Default:* Editable rows with visible duration.
  - *Dragging:* Row lifts with subtle shadow, other rows make space (Epic 4).
  - *Swiping duration:* Number updates in real-time as user swipes (Epic 4).
  - *Empty:* "Add your first step" prompt.
  - *AI-populated:* Same visual as manual, but a "🔄 Regenerate" button appears.
- **Accessibility:** Each row is a labeled form group. Duration input accepts keyboard entry. Tab order flows name → duration → next row.

#### Step Transition Overlay

- **Purpose:** Communicate step changes during running timer — the visual analog of TTS announcements.
- **Content:** Next step name (large), duration, pace status, step position.
- **Behavior:** Appears as a semi-transparent overlay on the running timer view for 3-5 seconds, then auto-fades. Does NOT block controls.
- **States:**
  - *Ahead:* Tinted with `--ahead` color accent, calm messaging.
  - *Behind:* Tinted with `--behind` amber accent, factual messaging (never alarming).
  - *On Track:* Neutral tint, simple step announcement.
- **Accessibility:** Announced via ARIA live region: "Next step: Get Dressed. 5 minutes. You're 1 minute ahead."

#### Completion Summary View

- **Purpose:** Warm summary screen after a timer completes.
- **Content:** Emoji (☕), "Done!" message, total time vs. planned, ahead/behind summary, step-by-step breakdown, "Done" button.
- **User Actions:** Tap "Done" → return to timer library.
- **States:** Single state (completed). Tone adapts: ahead → "nice pace", behind → neutral factual, way behind → still neutral.
- **Accessibility:** Full summary readable by screen reader. No auto-dismiss — user controls when to leave.

#### AI Breakdown Panel

- **Purpose:** Input area for AI task breakdown on timer creation page.
- **Content:** Text input field, "Break it down ✨" button, loading skeleton, error message.
- **User Actions:** Type task description, tap generate, tap regenerate, dismiss error.
- **States:**
  - *Idle:* Input field with placeholder + button.
  - *Loading:* Skeleton step rows animate in with pulse effect.
  - *Success:* Panel collapses/minimizes, steps populate in the form below.
  - *Error:* Friendly error message with "try again" action.
  - *Rate limited:* Specific message about daily limit.
- **Accessibility:** Loading state announced via ARIA: "Generating steps, please wait." Result announced: "Generated 5 steps for Make Pasta Carbonara."

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

#### Button Hierarchy

| Level | Style | Usage |
|-------|-------|-------|
| **Primary** | Solid `--primary` bg, `--bg` text, 12px radius | Main actions: Play, Save, Done, Sign In |
| **Secondary** | `--elevated` bg, `--border` border, `--text` text | Supporting actions: Pause, Cancel, Take Control |
| **Ghost** | Transparent bg, `--accent-warm` or `--muted` text | Tertiary actions: +1 min, Regenerate, Sign in with email |
| **Destructive** | `--warning` bg on hover/active, outlined at rest | Delete timer (only after confirmation) |
| **Circular** | 48-52px circle, icon only | Play (on card), Pause, Skip, Extend (on running timer) |

**Rules:**
- Maximum ONE primary button visible at a time per screen
- Circular buttons on running timer are always 48px minimum (44px WCAG + padding)
- Destructive actions always require one confirmation step

#### Feedback Patterns

| Type | Visual | Duration | Usage |
|------|--------|----------|-------|
| **Success** | Toast with `--primary` left border, brief text | 3 seconds, auto-dismiss | Timer saved, timer deleted, settings updated |
| **Error** | Toast with `--warning` left border, action button | Persistent until dismissed | Save failed, auth error, network error |
| **Info** | Toast with `--info` left border | 4 seconds, auto-dismiss | Sync status, rate limit warning |
| **Loading** | Skeleton shimmer (elevated bg pulse) | Until content loads | Timer list loading, AI generating |
| **Step transition** | Overlay with fade-in/fade-out | 3-5 seconds, auto-dismiss | Step change during running timer |
| **Timer state** | Ring color shift (smooth CSS transition) | Continuous | Ahead/behind/on-track during running |

**Rules:**
- Toasts appear at top-center on mobile (avoid bottom — controls live there)
- Never stack more than 2 toasts
- Loading skeletons match the exact shape of the content they'll become
- The running timer view NEVER shows toasts — only the transition overlay

#### Form Patterns

- **Labels:** Above inputs, caption size, uppercase, muted color
- **Validation:** Inline, below the field, `--warning` color. Shown on blur, not on every keystroke.
- **Required fields:** No asterisks. Everything required is obviously required by context. Optional fields are marked "(optional)".
- **Help text:** Below input, small size, muted color. Used sparingly.
- **Duration inputs:** Default to 5 minutes. Accept "5", "5m", "5:00", "300s" — parsed intelligently.
- **Auto-focus:** Timer name field auto-focuses on creation page. First step name auto-focuses after "Add Step."

#### Modal / Dialog Patterns

- **Usage:** Confirmation ONLY for destructive actions (delete timer). Never for routine actions.
- **Style:** Dark elevated background, centered, max-width 400px, rounded-xl.
- **Dismiss:** Click outside to cancel, ESC to cancel, explicit Cancel button.
- **Focus trap:** Yes, keyboard focus is trapped in modal.
- **No modals during running timer.** Ever. The running timer is sacred space.

#### Navigation Patterns

- **No traditional nav bar.** This is a focused app with minimal navigation:
  - Timer Library (home) → Timer Creation/Edit → Running Timer → Completion → back to Library
- **Back navigation:** Browser back button works naturally. No custom back arrows needed in v1.
- **Active session routing:** If a session is running, any navigation to the app auto-redirects to the running timer. The user can Stop the timer to return to the library.
- **Settings:** Accessible from timer library page (gear icon in header). Opens as a Sheet (bottom drawer on mobile).

#### Empty State Patterns

| Location | Content | Action |
|----------|---------|--------|
| **Timer library (no timers)** | "Create your first timer" with large CTA card + AI breakdown option | Tap CTA → creation page |
| **Timer library (loading)** | 2-3 skeleton cards | Auto-resolves |
| **Step list (no steps)** | "Add your first step" prompt below the step list | Tap "Add Step" button |
| **AI breakdown result (empty/error)** | "Couldn't generate steps — try again or create manually" | Retry or manual |

**Rules:**
- Empty states are NEVER blank. Always a message + a clear action.
- Empty state messages are warm and inviting, never clinical ("Create your first timer" not "No timers found").

#### Confirmation Patterns

| Action | Confirmation Required? | Method |
|--------|----------------------|--------|
| Start timer | ❌ No | Instant play |
| Pause timer | ❌ No | Instant |
| Skip step | ❌ No | Instant — "Allow an override" |
| Extend time | ❌ No | Instant |
| Stop timer early | ❌ No | Instant (returns to library) |
| Take control (sync) | ❌ No | Instant |
| Save timer | ❌ No | Instant save |
| Delete timer | ✅ Yes | Dialog: "Delete Morning Routine?" with Cancel + Delete buttons |
| Sign out | ❌ No | Instant |

**Rule:** If it's reversible or non-destructive, don't confirm. Timers can be recreated. Steps can be re-added. Time can be un-extended (it can't, but extending is never harmful). The only irreversible action is deleting a timer template.

#### Notification Patterns

- **In-app only** for v1. No push notifications.
- **Toasts** for action confirmations (save, delete, errors).
- **Transition overlay** for step changes during running timer.
- **TTS** is the primary "notification" system during timer execution.
- **No notification stacking during running timer** — voice + visual overlay is sufficient.

#### Search Patterns

- **No search in v1.** The timer library will have < 20 timers for the target user base. Scrolling is sufficient.
- **Sorting:** By last used (default, most recent first). No user-configurable sort in v1.

#### Date/Time Patterns

- **Duration format:** `M:SS` for display (e.g., "5:23", "12:00"). Always zero-padded seconds.
- **Long durations:** `H:MM:SS` if timer exceeds 60 minutes.
- **Overrun display (countdown mode):** `+M:SS over` (e.g., "+0:30 over") in `--behind` color.
- **Timestamps (last used):** Relative — "Today", "Yesterday", "3 days ago", "Jan 15".
- **No timezone concerns** in v1 — all times are elapsed/duration, not clock-time.
- **Duration input:** Accept minutes as integer (default interpretation). "5" = 5 minutes. "5:00" = 5 minutes. "5m" = 5 minutes. "300" followed by "s" = 5 minutes.

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Primary platform:** Mobile phone in portrait mode (the bathroom morning routine use case).
**Secondary platform:** Desktop browser (laptop at desk after phone handoff).
**Not targeted:** Tablet (works, but not optimized).

#### Breakpoints

| Breakpoint | Width | Layout Adjustments |
|-----------|-------|-------------------|
| **Mobile** | < 640px | Single column, 20px padding, full-width cards, 260px ring |
| **Tablet** | 640-1024px | Single column, 32px padding, max-width 600px, ring scales to 280px |
| **Desktop** | > 1024px | Single column centered, max-width 480px, ring at 300px |

**Key Adaptation Rules:**
- The app is a single-column layout at ALL breakpoints. It never becomes a multi-column dashboard.
- The ring scales proportionally but remains centered.
- Touch targets remain 48px minimum on all breakpoints (even desktop — users may have touchscreens).
- Timer library cards remain full-width within the content column.
- The timer creation form remains single-column — no side-by-side fields.

**Navigation Adaptation:**
- No nav bar changes needed — the app has minimal navigation at all breakpoints.
- Settings Sheet (bottom drawer) on mobile → Settings Dialog (centered modal) on desktop.

**Content Adaptation:**
- Timer library: Single-column card list at all sizes.
- Running timer: Ring centered, controls at bottom — identical on all sizes.
- Completion view: Centered, single-column — identical on all sizes.
- Timer creation: Single-column form — identical on all sizes.

### 8.2 Accessibility Strategy

**Target:** WCAG 2.1 AA compliance.

#### Color Contrast

All text meets AA contrast ratios against their backgrounds:

| Text | Background | Contrast | Passes AA? |
|------|-----------|----------|-----------|
| `--text` (#E8DCC8) | `--background` (#0C0F0A) | 14.2:1 | ✅ AAA |
| `--text` (#E8DCC8) | `--surface` (#151A13) | 11.8:1 | ✅ AAA |
| `--primary` (#7EBD73) | `--bg` (#0C0F0A) | 8.1:1 | ✅ AAA |
| `--muted` (#8A8474) | `--bg` (#0C0F0A) | 4.8:1 | ✅ AA |
| `--ahead` (#6BB5A0) | `--bg` (#0C0F0A) | 8.5:1 | ✅ AAA |
| `--behind` (#D4A96A) | `--bg` (#0C0F0A) | 9.2:1 | ✅ AAA |

#### Keyboard Navigation

- All interactive elements reachable via Tab
- Running timer controls: Tab cycles through Pause → Skip → Extend
- Timer library: Tab moves between timer cards, Enter to play, Tab to play button specifically
- Forms: Standard tab order (name → step name → duration → next step → save)
- Modal focus trap: Tab cycles within modal when open
- ESC closes modals, sheets, dropdowns

#### Focus Indicators

- Visible focus ring: 2px solid `--primary` with 2px offset
- Focus ring uses `focus-visible` (keyboard only, not mouse click)
- Ring is visible on all interactive elements: buttons, inputs, cards, links

#### ARIA Requirements

| Element | ARIA | Details |
|---------|------|---------|
| Progress ring SVG | `role="img"`, `aria-label` | Dynamic label: "Step 2 of 5, Shower, 5:23 elapsed, 1 minute ahead" |
| Step transition overlay | `aria-live="polite"` | Announces step changes without interrupting screen reader |
| Timer state changes | `aria-live="polite"` on status region | "Timer paused", "Timer resumed", "Step skipped" |
| Play button on card | `aria-label` | "Start Morning Routine, 5 steps, 33 minutes" |
| Step dot indicators | `role="list"`, `aria-label` | "Timer progress: step 2 of 5" |
| Loading skeletons | `aria-busy="true"` | While loading |
| Form errors | `aria-describedby` | Links error message to input |

#### Screen Reader Considerations

- Timer state changes announced via `aria-live` regions
- Step transitions announced as "Next step: Get Dressed. 5 minutes. You're 1 minute ahead."
- Completion summary fully readable as structured content
- Timer library cards read as: "[Timer Name], [step count] steps, [duration], last used [date]. Button: Start."

#### Reduced Motion

- Respect `prefers-reduced-motion`:
  - Ring progress animation: instant snap instead of smooth transition
  - Breathing animation on pace status: disabled (static opacity)
  - Transition overlay: instant appear/disappear instead of fade
  - Skeleton loading pulse: replaced with static elevated background
  - Card hover effects: disabled

#### Form Accessibility

- All inputs have associated labels (via `htmlFor` or wrapping `<label>`)
- Error messages linked to inputs via `aria-describedby`
- Required fields use `aria-required="true"`
- Duration inputs have `inputmode="numeric"` for mobile numeric keyboard
- Step list uses `role="list"` with `role="listitem"` for each step

#### Testing Strategy

- **Automated:** axe-core integration in dev (eslint-plugin-jsx-a11y + axe dev tools)
- **Manual:** Keyboard-only navigation test for all flows
- **Screen reader:** VoiceOver (macOS/iOS) + NVDA (Windows) for critical flows
- **Contrast:** Verified via WebAIM contrast checker for all color pairs

---

## 9. Implementation Guidance

### 9.1 Completion Summary

**Design decisions locked in this specification:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Design System | shadcn/ui (Radix + Tailwind) | Best fit for Next.js stack, accessible, zero lock-in |
| Color Theme | Deep Forest 🌲 | Earthy, grounding, ADHD-friendly dark mode, safe and warm |
| Design Direction | Zen Ring | Maximum calm, concentric rings as hero, minimal text |
| Typography | Inter (all roles) | Clean, legible, excellent tabular numerals |
| Layout | Single-column, mobile-first | Phone-in-bathroom is the hero use case |
| Navigation | Minimal — library → timer → back | Focused app, not a platform |
| Confirmation | Only for delete | Every other action is instant — minimize decisions |
| Running Timer | Sacred space — no toasts, no modals | Voice + ring + overlay only |

### 9.2 Implementation Priority for UX

Components should be built in this order to match epic sequencing:

1. **Epic 1:** Button, Input, Label, Card (from shadcn), Timer Library Card (custom), Step List Editor (basic version), Empty State
2. **Epic 2:** Concentric Progress Ring, Step Transition Overlay, Completion Summary View, Toast (for TTS fallback notice)
3. **Epic 3:** Observer mode badge, "Take Control" button, sync status indicator
4. **Epic 4:** Step List Editor (enhanced with swipe + drag), Switch (countdown toggle)
5. **Epic 5:** AI Breakdown Panel, Skeleton loading states

### 9.3 CSS Architecture

- **Tailwind CSS** for all utility styling
- **CSS Custom Properties** for Deep Forest color tokens (defined in `globals.css`, consumed by Tailwind config)
- **shadcn/ui theme** customized via `components.json` and `globals.css` to use Deep Forest tokens
- **No CSS modules or styled-components** — Tailwind + CSS vars only
- **Animation:** CSS transitions for ring progress, CSS animations for breathing effect, `framer-motion` only if needed for complex gestures (drag-to-reorder)

### 9.4 Tailwind Theme Extension

```
// tailwind.config.ts colors extension
colors: {
  background: '#0C0F0A',
  surface: '#151A13',
  elevated: '#1E261B',
  border: '#2A3326',
  primary: '#7EBD73',
  'primary-soft': '#A8C9A0',
  'accent-warm': '#D4A96A',
  text: '#E8DCC8',
  muted: '#8A8474',
  ahead: '#6BB5A0',
  'on-track': '#7EBD73',
  behind: '#D4A96A',
  warning: '#C47A6C',
  info: '#6B94B8',
}
```

---

## Appendix

### Related Documents

- Product Requirements: `docs/PRD.md`
- Product Brief: `docs/product-brief-adhdtimer-2026-02-14.md`
- Brainstorming: `docs/brainstorming-session-results-2026-02-14.md`
- Epic Breakdown: `docs/epics.md`

### Core Interactive Deliverables

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: [ux-color-themes.html](./ux-color-themes.html)
  - Interactive HTML showing 4 color theme options explored (Deep Forest, Warm Dusk, Night Ocean, Soft Clay)
  - Live UI component examples in each theme (running timer, library cards, transitions, completion)
  - Side-by-side comparison mode
  - **Selected:** Deep Forest 🌲

- **Design Direction Mockups**: [ux-design-directions.html](./ux-design-directions.html)
  - Interactive HTML with 8 complete design approaches in phone frames
  - Full-screen mockups of running timer, timer library, step transitions, completion, AI creation
  - Design philosophy and rationale for each direction
  - **Selected:** Zen Ring (Direction 1) — concentric rings, centered text (right-side-up), minimal controls

### Cross-Workflow Notes: Epics Alignment

**Stories potentially affected by UX design decisions:**

| UX Discovery | Impact on Epics |
|-------------|----------------|
| Concentric ring component is complex SVG + animation | Story 2.3 (Visual Progress) may be larger than estimated — ring needs careful implementation |
| Step transition overlay is a custom animated component | Story 2.1 (Contextual Transitions) includes overlay animation work |
| Step List Editor has multiple interaction modes (basic → swipe → drag) | Stories 1.4/1.5 (basic), 4.1/4.2 (enhanced) are correctly split |
| Observer mode needs visual differentiation from controller mode | Story 3.2 (Device Control Handoff) includes observer UI |
| Empty state design is part of timer library | Covered in Story 1.4 — no new story needed |
| Settings as Sheet (bottom drawer) | Can be added to Story 1.1 or as a polish item — not a separate story |

**No new epics needed.** The UX design aligns with the existing 5-epic, 23-story structure. The main implementation risk is the Concentric Progress Ring component — recommend spiking it early in Epic 2.

### Next Steps & Follow-Up Workflows

This UX Design Specification can serve as input to:

- **Solution Architecture Workflow** — Define technical architecture with UX context
- **Solutioning Gate Check** — Validate PRD + UX + Architecture alignment
- **Sprint Planning** — Break into implementable sprints with UX specs per story

### Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-14 | 1.0 | Initial UX Design Specification | BMad |

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
