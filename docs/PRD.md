# ADHD Timer - Product Requirements Document

**Author:** BMad
**Date:** 2026-02-14
**Version:** 1.0

---

## Executive Summary

ADHD Timer is a web-first PWA that transforms routine execution from a daily cognitive battle into a guided, voice-announced, real-time-synced experience. Users create hierarchical timers (parent routines with sequential substeps), save them to a reusable library, and press play — the app guides them through each step with voice, visual progress, and contextual transition messages. AI-powered task breakdown lets users type a task name and receive a complete structured timer in seconds.

The product targets ADHD adults who struggle with time blindness, task transition paralysis, and repeated mental task breakdown — but its guided execution model benefits anyone running timed multi-step routines.

### What Makes This Special

**The Emotional Co-Pilot.** ADHD Timer isn't a countdown clock — it's a companion that carries the cognitive load of "what's next." Three magic moments define the experience:

1. **"Just press play"** — A routine built once replays forever. Zero willpower, zero re-planning.
2. **"Time to start Get Dressed. You're 1 minute ahead."** — Every transition whispers what's next, where you are, and that you're okay.
3. **"Do laundry" → complete timer** — AI generates a full hierarchical timer from a task name. The wow moment that makes people tell their friends.

---

## Project Classification

**Technical Type:** Web Application (PWA with real-time capabilities)
**Domain:** General (no regulatory/compliance complexity)
**Complexity:** Medium

- Real-time multi-device sync adds architectural complexity
- AI integration (LLM API) adds external dependency
- Hierarchical timer state machine requires careful design
- No domain-specific regulatory requirements

**References:**
- Product Brief: `docs/product-brief-adhdtimer-2026-02-14.md`
- Brainstorming Session: `docs/brainstorming-session-results-2026-02-14.md`

---

## Success Criteria

### Personal Daily-Use Success (Weeks 1-2)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Daily routine use | Creator uses morning routine timer 5+ days/week | Personal tracking |
| Emotional shift | "I stopped dreading mornings" | Subjective — does the creator reach for the app willingly? |
| Sync reliability | Timer state consistent across devices within a few seconds | Manual testing — start on phone, verify on laptop |
| Voice guidance | TTS reads step transitions without manual intervention | Functional — works on Chrome desktop + mobile Safari/Chrome |

### Friend Adoption Success (Month 1-2)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Friend onboarding | 1 specific friend creates their own timers | They sign up and build a timer without hand-holding |
| Retention | Friend uses the app for 2+ consecutive weeks | They're still opening it |
| Self-service | Friend creates timers independently (not copying creator's) | They build routines for their own life |

### Product-Market Signal (Month 3+)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Organic interest | Unprompted "can I try that?" from people who see it in use | Word of mouth |
| Routine library growth | Creator has 3+ saved routines they actively use | Timer library count |
| AI breakdown utility | AI-generated timers are usable with minor edits 70%+ of the time | Subjective quality |

---

## Product Scope

### MVP — Minimum Viable Product (14 Features)

| # | Feature | Core Value |
|---|---------|-----------|
| 1 | Hierarchical timers | Parent timer with sequential substeps, dual time tracking (step + total) |
| 2 | Timer library ("My Timers") | Create, save, reuse, delete timer templates |
| 3 | Play / Pause / Skip step | Core playback controls |
| 4 | "I need X more minutes" | Extend current step without shame |
| 5 | Count-up default | With per-timer/step countdown toggle |
| 6 | Contextual transition messages | "Time to start [step]. You're 3 steps in, 2 min ahead" |
| 7 | Text-to-speech | Voice reads each step name aloud as it begins |
| 8 | Real-time cross-device sync | Mobile browser + desktop PWA, same session |
| 9 | Visual progress indicator | Progress visualization for current step and overall timer |
| 10 | User accounts & auth | Firebase Auth (Google + email) — required for sync |
| 11 | Swipe-to-adjust durations | Quick inline duration edits per substep |
| 12 | AI subtask breakdown | Natural language → hierarchical timer with substeps and durations |
| 13 | Timer completion view | Warm summary screen — total time, overruns, steps completed/skipped |
| 14 | Screen wake lock | Keep screen active during running timer (critical for phone use) |

**Onboarding:** v1 relies on an intuitive empty state ("Create your first timer" prompt + clear CTA). Formal onboarding/tutorial is a v1.1 fast-follow, not launch-blocking.

### Growth Features (Post-MVP / v2)

- Post-completion review with timer adjustment suggestions ("Your plans learn from you")
- Step types as first-class concepts (Active / Wait / Checkpoint)
- Defer step ("not now, come back before parent ends")
- Top-level timer switching (pause one, start another)
- Pause-between-steps toggle (manual advance mode)
- AI vague-task detection ("this seems broad, want to break it down?")
- "Capture idea for later" (rabbit trail parking lot)
- Gentle step reminder during long steps
- Repeatable routines with scheduling and reminders
- Flexible-order steps within a block
- Interwoven mode (timers with wait-gaps auto-interleave)
- Preference learning (gathers reasons, augments future AI suggestions)

### Vision Features (v3+)

- Digital body double (ambient companion presence)
- Background ambient audio shifting with progress
- AI time-block planner ("2 hours before meeting" → proposes which routines fit)
- Errands mode with driving times and optimal trip planning
- Departure time awareness as first-class feature
- Calendar integration for upcoming commitment awareness
- Native app shells via Capacitor (App Store / Play Store)
- Monetization (freemium or subscription model)
- Dynamic Island / Live Activity (iOS)
- Streak/habit tracking (opt-in, non-shaming)

---

## User Experience Principles

### Design Philosophy

The UX is built on 8 design principles established during brainstorming:

1. **Energy management, not time management** — The app manages emotional state, not just minutes
2. **Emotional co-pilot, not countdown clock** — Companion presence, not mechanical tool
3. **Every transition whispers: what's next, where you are, you're okay** — The soul of every screen
4. **"Always have a default. Never force a choice. Allow an override."** — Minimize executive function cost
5. **Gentle honesty over false cheerfulness** — "You're 2 minutes behind" not "Great job! 🎉" when you're not
6. **"Your plans learn from you"** — Overruns = data, not failure
7. **Digital body double** — The psychological model of felt presence (v2+ for full implementation, but tone is v1)
8. **Capture stray thoughts without breaking flow** — Even in v1, the UX shouldn't demand sustained focus

### Visual Personality

- **Warm, calm, uncluttered.** Not corporate productivity. Not gamified dopamine.
- **Dark mode default** (many ADHD users are sensitive to bright screens, especially mornings)
- **Large touch targets** — designed for groggy morning hands on a phone
- **Minimal text on screen** — the voice does the heavy lifting; the screen shows *where you are*
- **Progress visualization is the hero** — concentric rings or progress bars dominate the running timer view
- **Muted, earthy color palette** with gentle accent colors for state changes (ahead = calm blue-green, behind = warm amber, not alarming red)

### Key Interactions

| Interaction | Design Intent |
|------------|--------------|
| **Start a routine** | One tap from home screen. No decisions required. |
| **Running timer view** | Visual progress dominates. Current step name large. Time visible but not anxiety-inducing. |
| **Step transition** | Voice announces next step. Visual smoothly transitions. Contextual message appears briefly ("You're 1 min ahead"). |
| **Extend time** | Tap/swipe gesture. No modal, no confirmation. Instantly adds time. No judgment language. |
| **Skip step** | Single action. No "are you sure?" — the principle says "allow an override." |
| **Create/edit timer** | List of steps with inline duration editing. Swipe to adjust. Drag to reorder. Add step with one tap. |
| **AI breakdown** | Text input → loading state → structured result appears → user can edit before saving. |
| **Pause** | Obvious, always accessible. Timer state syncs immediately to other devices. |

### Critical User Flow: Morning Routine

This is the hero flow — the experience that validates the entire product:

```
Wake up → Open app (phone) → Tap "Morning Routine"
→ Voice: "Shower. 8 minutes."
→ [Concentric ring spinning, step name large, total progress visible]
→ [8 min passes — chime]
→ Voice: "Get dressed. 5 minutes. You're 1 minute ahead."
→ [User moves to laptop — same timer running, synced]
→ [Skip a step — no friction, no shame]
→ Voice: "Breakfast. 12 minutes."
→ [Timer completes]
→ Brief summary: "45 minutes. 2 steps ran over, 1 skipped. Done! ☕"
```

---

## Functional Requirements

### FR1: Timer Data Model & Hierarchy

**FR1.1 — Hierarchical Timer Structure**
- The Timer Library stores **timer templates** — reusable routine definitions
- A Timer Template contains an ordered list of Steps
- Each Step has: name (string), planned duration (seconds), type (active — v1 only has active), notes (optional string)
- Timer Template has: name, total planned duration (auto-calculated from steps), description (optional), created/modified timestamps
- Hierarchy depth: 2 levels for MVP (Timer → Steps). No sub-substeps in v1.
- Pressing "Play" on a template creates a **Run Session** — a transient execution instance with its own elapsed times, step states, and completion data
- Run Sessions reference the source template but do NOT mutate it
- Run history is out of scope for v1, but the data model must not prevent future run logging

**FR1.2 — Timer State Machine**
- Timer states: `idle` → `running` → `paused` → `completed`
- Step states: `pending` → `running` → `paused` → `completed` | `skipped`
- Only one step can be `running` at a time within a timer
- Only one timer can be `running` at a time per user (v1 — no multi-timer in v1)
- Pausing the timer pauses the current step
- Skipping a step marks it `skipped` and advances to next step
- Completing the last step completes the timer
- State transitions sync to Firestore in real-time

**FR1.3 — Time Tracking**
- Each running step tracks elapsed time (count-up by default)
- Timer tracks total elapsed time across all steps
- Countdown mode available as per-timer toggle (shows remaining time instead)
- Extending a step adds time to planned duration without pausing
- Overruns are tracked (actual > planned) but never block progression

### FR2: Timer Library

**FR2.1 — CRUD Operations**
- Users can create new timers with a name and ordered list of steps
- Users can edit any saved timer (name, steps, durations, order)
- Users can delete timers from their library
- Users can duplicate an existing timer as a starting point

**FR2.2 — Timer List View**
- Home screen shows all saved timers in a list/grid
- Each timer card shows: name, total duration, step count, last used date
- One-tap to start any timer
- Quick access to edit

**FR2.3 — Timer Creation/Editing**
- Inline step list with name and duration per step
- Swipe gesture to adjust duration (FR11)
- Drag to reorder steps
- Add step: single tap, enter name and duration
- Remove step: swipe-to-delete or explicit remove button
- Auto-calculate total timer duration from steps

### FR3: Playback Controls

**FR3.1 — Core Controls**
- Play: Start timer from idle, or resume from paused
- Pause: Pause current step and timer. Sync state to all devices.
- Skip: Mark current step as skipped, advance to next step immediately
- Stop: End timer early, mark as incomplete

**FR3.2 — Time Extension ("I need X more minutes")**
- User can extend current step's planned duration while it's running
- Interaction: tap a "+1 min" / "+5 min" button, or swipe gesture
- No confirmation dialog. Immediate. No judgment language.
- Extension updates planned duration — does NOT reset elapsed time
- Contextual message adjusts: "You're now 2 minutes behind" (gentle, factual)

**FR3.3 — Step Advancement**
- When a step's elapsed time reaches planned duration:
  - Play a brief audio chime (built-in sound via Web Audio API — short, gentle, non-alarming)
  - TTS announces next step name (FR7)
  - Display contextual transition message (FR6)
  - Auto-advance to next step (no user action required by default)
- If the user extends time, the step continues until new planned duration
- **Background tab limitation:** Browsers throttle timers and audio in background tabs. Chime and TTS may not fire if the app tab is not active. This is mitigated by FR13 (Wake Lock) keeping the screen/tab active. Known v1 constraint — documented, not solved.

### FR4: Count-Up / Countdown Modes

**FR4.1 — Default Count-Up**
- Running timer shows elapsed time counting up (0:00 → 0:01 → ...)
- This is the default for all timers and steps

**FR4.2 — Countdown Toggle**
- Per-timer setting: "Show countdown instead"
- When enabled, display shows remaining time counting down
- Timer behavior is identical — only the display changes
- When a step overruns its planned duration in countdown mode, display switches to count-up showing overrun time (e.g., "+0:30 over")

### FR5: Real-Time Cross-Device Sync

**FR5.1 — State Synchronization**
- Timer state (running/paused/completed, current step, elapsed times) syncs across all user's devices
- Sync target: eventually consistent within 2-3 seconds
- Powered by Firestore real-time listeners
- User opens app on second device → sees current timer state immediately

**FR5.2 — Conflict Resolution**
- Single-writer model: the device that started/resumed the timer is the "active controller"
- Other devices are read-only observers (can view progress, cannot control)
- Any device can "take control" with an explicit action (tap to take control)
- Prevents simultaneous pause/play conflicts

**FR5.3 — Offline Behavior (v1 — Minimal)**
- If a device loses connection, the running timer continues locally
- When reconnection happens, local state syncs back
- If conflicts exist (both devices ran independently), most recent action wins
- v1 does NOT require full offline-first — connection is expected for sync features

### FR6: Contextual Transition Messages

**FR6.1 — Transition Message Content**
- When advancing to a new step, display a brief contextual message:
  - Step name: "Time to start **[Step Name]**"
  - Position: "Step [X] of [Y]"
  - Pace: "You're [X minutes] ahead/behind/on track"
- Message appears as a brief overlay or toast, then fades (3-5 seconds)

**FR6.2 — Pace Calculation**
- Compare cumulative elapsed time vs. cumulative planned time for completed steps
- Ahead: total elapsed < total planned → "X min ahead" (calm tone)
- Behind: total elapsed > total planned → "X min behind" (gentle, factual — NOT alarming)
- On track: within 30 seconds → "Right on track"

**FR6.3 — Tone**
- Language is factual and warm, never judgmental
- Behind schedule is information, not failure
- No exclamation marks on negative messages. No "Uh oh!" or "Hurry up!"
- Positive messages are understated: "Nice pace" not "AMAZING JOB! 🎉🎉🎉"

### FR7: Text-to-Speech

**FR7.1 — Step Announcement**
- When a new step begins, TTS reads: "[Step Name]. [Duration] minutes."
- Uses Web Speech API (SpeechSynthesis)
- Voice: default system voice, moderate speed, moderate volume
- TTS fires automatically — no user action needed

**FR7.2 — Browser Constraints**
- Mobile browsers (especially iOS Safari) require user interaction to unlock audio
- On first timer start, ensure a user tap/click has occurred to unlock TTS
- If TTS is unavailable or blocked, fall back gracefully to visual-only (no error state)

**FR7.3 — TTS Toggle**
- Global setting: enable/disable TTS
- When disabled, transitions are visual only
- Default: enabled

### FR8: Visual Progress Indicator

**FR8.1 — Running Timer Display**
- Current step name displayed prominently (large text)
- Current step elapsed/remaining time displayed
- Overall timer progress visible (how far through total routine)
- Visual indicator: progress ring, bar, or concentric rings (design decision during architecture/UX)

**FR8.2 — Step List View During Playback**
- While timer is running, user can see the full step list
- Completed steps show actual duration and completed state
- Current step highlighted
- Upcoming steps show planned durations
- Skipped steps visually distinct (greyed/struck through)

### FR9: User Accounts & Authentication

**FR9.1 — Authentication Methods**
- Google Sign-In (primary — lowest friction)
- Email + password (alternative)
- Firebase Authentication

**FR9.2 — User Data**
- Each user has a unique account
- All timers are private to the user (no sharing in v1)
- Timer library, preferences, and running state are associated with user account

**FR9.3 — Session Persistence**
- Stay signed in across browser sessions
- Auth state synced — signing in on one device makes the other device ready

### FR10: Swipe-to-Adjust Durations

**FR10.1 — Gesture**
- In timer creation/editing view, each step's duration is adjustable via horizontal swipe
- Swipe right: increase duration
- Swipe left: decrease duration
- Step size: configurable (default 1 minute per swipe increment)
- Visual feedback: duration number updates in real-time as user swipes

**FR10.2 — Alternative Input**
- Tap on duration to type a specific time (keyboard input)
- Support formats: "5m", "5:00", "300" (seconds), "5" (interpreted as minutes)

### FR11: AI Subtask Breakdown

**FR11.1 — Input**
- User types a task name or brief description (e.g., "do laundry", "make pasta carbonara", "clean the kitchen")
- Single text input field with "Break it down" button

**FR11.2 — AI Processing**
- Send task name to LLM API (OpenAI or Anthropic)
- Request structured output: array of { step_name, estimated_duration_minutes }
- Prompt engineered for practical, real-world task breakdowns
- Include context: "Break this into sequential steps for someone executing the task. Estimate realistic durations."

**FR11.3 — Output & Editing**
- Display generated steps in the timer editor
- User can edit step names, adjust durations, reorder, add, or remove steps before saving
- "Regenerate" option to get a different breakdown
- If AI returns poor results, user can dismiss and create manually

**FR11.4 — Error Handling**
- If AI API is unavailable: show friendly message, allow manual creation
- If task is too vague: AI should still attempt, user can refine
- Rate limiting: reasonable per-user limit to manage API costs (e.g., 20 breakdowns/day)

### FR12: Timer Completion View

**FR12.1 — Completion Summary Screen**
- When the last step completes (or user stops the timer), show a brief completion summary
- Summary includes:
  - Total actual time vs. total planned time
  - Number of steps completed, skipped
  - Steps that overran or underran significantly (> 1 minute difference)
- Tone: warm, factual, celebratory without being over-the-top. "Done! 45 minutes. ☕"
- Single action to dismiss and return to timer library

**FR12.2 — No Judgment on Overruns**
- Overrun steps are presented as data, not failure
- Language: "Shower took 10 min (planned 8)" — not "Shower went 2 min OVER! ⚠️"
- If overall timer was faster than planned: "2 minutes ahead — nice pace"
- If overall timer was slower: "4 minutes longer than planned" (neutral)

### FR13: Screen Wake Lock

**FR13.1 — Keep Screen Active During Timer**
- When a timer is running, request a Wake Lock via the Screen Wake Lock API
- Prevents the phone screen from dimming/locking during active routine execution
- Critical for the morning routine use case (phone in bathroom, hands wet, can't keep tapping)

**FR13.2 — Wake Lock Lifecycle**
- Acquire wake lock when timer starts or resumes
- Release wake lock when timer pauses, completes, or user navigates away
- If Wake Lock API is not supported (older browsers), degrade gracefully — no error, just let the screen behave normally
- Note: Wake Lock API is supported in Chrome (desktop + Android) and Safari 16.4+. Coverage is good but not universal.

**FR13.3 — Known PWA Limitations**
- iOS Safari may still suspend background tabs even with Wake Lock in some scenarios
- v1 requirement: user must keep the app in the foreground (tab active, screen on)
- This is acceptable for the morning routine use case (phone propped up in bathroom)
- Future: native app shell via Capacitor will solve background execution

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|------------|--------|-----------|
| Timer tick accuracy | ±500ms displayed, actual tracking via timestamps | Timer UX must feel responsive; actual elapsed calculated from start timestamp, not tick counting |
| Page load (PWA, cached) | < 2 seconds | Morning routine: user is groggy, every second matters |
| Sync latency | < 3 seconds for state propagation | "Eventually consistent within a few seconds" per user requirement |
| TTS response | < 1 second from step transition to voice | Seamless transition experience |
| AI breakdown response | < 10 seconds | Acceptable wait with loading indicator |

### Security

| Requirement | Target | Rationale |
|------------|--------|-----------|
| Authentication | Firebase Auth with secure token handling | Standard — user data is personal |
| Data privacy | Timer data is private per-user, no cross-user access | Firestore security rules enforce isolation |
| API keys | LLM API keys server-side only (Next.js API routes) | Never expose AI API keys to client |
| HTTPS | All traffic over HTTPS | Standard web security |

### Accessibility

| Requirement | Target | Rationale |
|------------|--------|-----------|
| Screen reader support | Basic ARIA labels on all interactive elements | Broad audience includes users with additional needs |
| Touch targets | Minimum 44x44px | Critical for groggy morning use on phone |
| Color contrast | WCAG AA minimum | Readability in various lighting |
| Reduced motion | Respect `prefers-reduced-motion` | Some ADHD users are sensitive to animation |
| Font sizing | Support browser zoom / dynamic text | Accessibility baseline |

### Scalability (Light Touch for v1)

- v1 target: Single user (creator) + small number of friends (< 10 users)
- Firestore scales automatically — no infrastructure concern for v1
- AI API cost scales with usage — rate limiting handles this
- Architecture should not *prevent* scaling, but optimizing for scale is NOT a v1 concern

---

## Technical Preferences

*These are inputs for the Architecture workflow — not final decisions.*

| Layer | Preference | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | Creator's stack; SSR for marketing, CSR for app |
| UI Library | React 18+ | Core of Next.js |
| Styling | Tailwind CSS (likely) | Final decision during architecture |
| Database | Firestore | Real-time listeners, offline support, pairs with Auth |
| Auth | Firebase Auth | Google + email, minimal setup |
| TTS | Web Speech API | Free, built-in, browser-native |
| AI | OpenAI or Anthropic API | Via Next.js API routes (server-side) |
| Hosting | GCP Cloud Run | User's existing GCP; pairs with Firebase |
| PWA | next-pwa or similar | Service worker for installability |
| Future native | Capacitor | Web → native shell when App Store needed |

---

## User Flows

### Flow 1: First-Time User — Sign Up & Create First Timer

**Trigger:** User hears about ADHD Timer, visits the app URL

```
Landing Page
  │
  ├─ "Sign in with Google" → Google OAuth → Timer Library (empty state)
  │                                           │
  │                                           └─ "Create your first timer" CTA
  │                                                │
  │                                                └─ Timer Creation Page
  │                                                     │
  │                                                     ├─ Enter timer name ("Morning Routine")
  │                                                     ├─ Add steps one by one:
  │                                                     │    "Shower" — 8 min
  │                                                     │    "Get dressed" — 5 min
  │                                                     │    "Breakfast" — 12 min
  │                                                     │    "Brush teeth" — 3 min
  │                                                     │    "Pack bag" — 5 min
  │                                                     │
  │                                                     ├─ See total: 33 min
  │                                                     └─ Tap "Save"
  │                                                          │
  │                                                          └─ Timer Library (timer card visible)
  │                                                               │
  │                                                               └─ Tap "Play" → Running Timer View
  │
  └─ "Sign in with Email" → Email/password form → Same flow as above
```

**Key decisions:** Zero. The flow has exactly one path. Sign in → empty state guides you → create → play.

**Emotional note:** The empty state must feel inviting, not empty. "Create your first timer" should feel exciting, not like homework.

---

### Flow 2: Repeat User — Run an Existing Routine

**Trigger:** User wakes up, grabs phone, opens app

```
App Opens
  │
  ├─ [Already signed in — session persists]
  │
  ├─ [Active session exists?]
  │     ├─ YES → Auto-redirect to Running Timer View (Story 3.4)
  │     └─ NO ↓
  │
  Timer Library
    │
    ├─ Timers sorted by last used (most recent first)
    ├─ "Morning Routine" card is right at top
    │
    └─ Tap "Play" on Morning Routine
         │
         └─ Running Timer View
              │
              ├─ Wake Lock acquired (screen stays on)
              ├─ TTS: "Shower. 8 minutes."
              ├─ Concentric ring spinning, step name large
              │
              ├─ [Step completes] → Chime + TTS: "Get dressed. 5 minutes. You're 1 minute ahead."
              ├─ [User extends] → Tap "+1 min" → planned duration adjusts, no judgment
              ├─ [User skips] → Tap "Skip" → next step immediately, no confirmation
              ├─ [User pauses] → Tap "Pause" → timer stops, wake lock released
              │     └─ Tap "Play" → resumes, wake lock re-acquired
              │
              ├─ ... (steps continue) ...
              │
              └─ [Last step completes]
                   │
                   └─ Completion View
                        ├─ "Done! 38 minutes. ☕"
                        ├─ "3 min ahead — nice pace"
                        ├─ Steps summary (overruns highlighted gently)
                        └─ Tap "Done" → Timer Library
```

**Key decisions:** ONE — which timer to play. And if it's sorted by last-used, even that is barely a decision.

**Emotional note:** From app open to "Shower. 8 minutes." should be **2 taps and < 3 seconds**. This is the core value loop — it must be instant.

---

### Flow 3: Timer Creation — Manual

**Trigger:** User wants to create a new routine

```
Timer Library
  │
  └─ Tap "+" / "New Timer"
       │
       └─ Timer Creation Page
            │
            ├─ Timer Name field (required)
            │
            ├─ Steps List:
            │     ├─ Tap "Add Step" → inline row appears
            │     │     ├─ Step name (text input)
            │     │     └─ Duration (swipe to adjust, or tap to type)
            │     │
            │     ├─ [Repeat: add more steps]
            │     ├─ [Drag handle to reorder]
            │     ├─ [Swipe step left to delete]
            │     └─ [Swipe duration right/left to ±1 min]
            │
            ├─ Total Duration (auto-calculated, displayed)
            │
            ├─ Countdown toggle (optional, default off)
            │
            └─ Tap "Save"
                 │
                 └─ Timer Library (new timer card appears)
```

**Key decisions:** Timer name + step names + durations. All inline, all on one screen. No multi-page wizard.

---

### Flow 4: Timer Creation — AI-Assisted

**Trigger:** User has a task idea but doesn't want to manually break it down

```
Timer Creation Page
  │
  ├─ AI Section (top of page):
  │     ├─ Text input: "Describe your task..."
  │     └─ "Break it down ✨" button
  │
  └─ User types "make pasta carbonara"
       │
       └─ Tap "Break it down ✨"
            │
            ├─ Loading: "Breaking it down..." (spinner / skeleton steps)
            │
            ├─ [SUCCESS] → Steps populate in the form below:
            │     ├─ Timer name auto-filled: "Make Pasta Carbonara"
            │     ├─ Steps:
            │     │     "Boil water" — 10 min
            │     │     "Cook spaghetti" — 12 min
            │     │     "Fry guanciale" — 8 min
            │     │     "Mix eggs and cheese" — 3 min
            │     │     "Combine and serve" — 5 min
            │     │
            │     ├─ User can: edit names, swipe durations, add/remove/reorder steps
            │     ├─ "Regenerate" → new AI call, steps replaced
            │     └─ Tap "Save" → Timer Library
            │
            └─ [FAILURE] → "Couldn't generate steps — try again or create manually"
                  └─ Manual creation form still fully functional
```

**Key decisions:** One — accept AI output or regenerate. Everything is editable, so the user always has full control.

**Emotional note:** The AI result should feel like a helpful suggestion, not a rigid prescription. The user is always in charge.

---

### Flow 5: Multi-Device Sync — Phone to Laptop

**Trigger:** Timer running on phone, user moves to laptop

```
Phone (Active Controller)                    Laptop (Observer → Controller)
─────────────────────────                    ──────────────────────────────
Timer running                                User opens app in browser
  │                                            │
  │                                            ├─ Auth: already signed in
  │                                            ├─ Active session detected
  │                                            └─ Auto-redirect to Running Timer View
  │                                                 │
  │                                                 ├─ Shows same timer, same step,
  │                                                 │   same elapsed time (synced via Firestore)
  │                                                 │
  │                                                 ├─ Controls are DISABLED
  │                                                 │   (phone is active controller)
  │                                                 │
  │                                                 └─ "Take Control" button visible
  │                                                      │
  │                                                      └─ User taps "Take Control"
  │                                                           │
  ├─ Phone becomes read-only ◄───── sync ─────►  Laptop becomes active controller
  │   (controls disabled,                         │
  │    "Take Control" appears)                    ├─ Controls now enabled
  │                                               ├─ Wake lock acquired on laptop
  │                                               └─ User continues: pause, skip,
  │                                                   extend — all synced to phone
  │
  └─ Step transitions visible on both devices simultaneously
```

**Key decisions:** ONE — "Take Control" when switching devices. Otherwise, the sync is invisible and automatic.

**Emotional note:** This should feel like magic. You put down your phone, sit at your desk, and your routine is just *there*. No QR codes, no pairing, no setup.

---

### Flow 6: Timer Editing — Modify Existing Routine

**Trigger:** User wants to adjust a saved timer after using it

```
Timer Library
  │
  └─ Tap "Edit" on timer card (or long-press → Edit)
       │
       └─ Timer Edit Page (identical to creation, pre-populated)
            │
            ├─ Timer name (editable)
            ├─ Steps (editable):
            │     ├─ Change "Shower" from 8 min → 10 min (swipe right)
            │     ├─ Add new step "Make coffee" — 4 min
            │     ├─ Drag "Make coffee" to position 3
            │     ├─ Delete "Pack bag" (swipe left)
            │     └─ Total auto-recalculates
            │
            └─ Tap "Save" → Timer Library (updated card)
```

**Key decisions:** Just edit and save. Same page as creation. No mode confusion.

---

### Flow 7: Error & Edge Case Flows

**7a: Lost Internet During Timer**
```
Timer running → Internet drops
  │
  ├─ Timer continues locally (timestamp-based)
  ├─ No error shown (user shouldn't worry)
  ├─ Internet returns → state syncs back to Firestore
  └─ Other devices see updated state within seconds
```

**7b: App Opened With No Internet**
```
App opens → No internet
  │
  ├─ Timer library loads from Firestore cache
  ├─ User can browse saved timers
  ├─ Tap "Play" → Friendly message: "Connect to internet to start a timer"
  └─ (Sync is required to create run sessions)
```

**7c: Stale Session (started hours ago, never completed)**
```
App opens → Active session found, started 6 hours ago
  │
  ├─ Auto-redirect to Running Timer View
  ├─ User sees paused/running session from earlier
  └─ Can "Stop" to clear it and return to library
      (Future: auto-complete sessions older than 24 hours)
```

**7d: AI Rate Limit Hit**
```
User taps "Break it down ✨" → Rate limit exceeded
  │
  ├─ Friendly message: "You've used all 20 AI breakdowns for today. Try again tomorrow!"
  └─ Manual creation still fully available
```

---

### Flow Summary Matrix

| Flow | Taps to Value | Key Decision Points | Emotional Note |
|------|--------------|--------------------|----|
| 1. First-time | ~6 (sign in + create + play) | Timer name + steps | Inviting, guided |
| 2. Repeat use | **2** (open + play) | Which timer (almost none if sorted) | **Instant. This is the product.** |
| 3. Manual create | ~4-8 (name + steps + save) | Step names/durations | Fast, inline, one screen |
| 4. AI create | ~3 (type + generate + save) | Accept/edit AI result | Wow moment, user in charge |
| 5. Multi-device | **1** (take control) | When to switch | Magic — just works |
| 6. Edit timer | ~3-5 (edit actions + save) | What to change | Same as create, no friction |
| 7. Edge cases | 0-1 | None | Graceful, no anxiety |

---

## Implementation Planning

### Epic Breakdown Required

The 12 MVP features and supporting requirements above need decomposition into implementable epics and bite-sized stories. Each story must be completable by a single development agent in one focused session.

**Next Step:** Epic and story decomposition follows in this workflow.

---

_This PRD captures the essence of ADHD Timer — an emotional co-pilot that carries the cognitive load of "what's next" so ADHD brains can just follow along and feel okay._

_Created through collaborative discovery between BMad and the BMad Master agent._
