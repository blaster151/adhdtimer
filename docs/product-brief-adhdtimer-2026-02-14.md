# Product Brief: ADHD Timer

**Date:** 2026-02-14
**Author:** BMad
**Context:** Personal tool → community product (indie hacker path)

---

## Executive Summary

ADHD Timer is a web-first hierarchical timer application designed for people with ADHD — and useful for anyone who benefits from guided routine execution. Users create reusable multi-step timers (like a morning routine planned to the minute), press play, and the app guides them through each step with voice announcements, contextual transition messages, and gentle progress tracking. The app syncs in real-time across devices so a user can start a routine on their phone in the bathroom and continue on their laptop at their desk.

The core insight: existing timer and productivity apps treat time as a mechanical problem (count down, beep, repeat). For ADHD brains, time management is an **emotional regulation and energy management** problem. ADHD Timer is an **emotional co-pilot** — it carries the cognitive load of "what's next," provides contextual reassurance at every transition, and learns from the user without judgment.

**v1 goal:** A personal daily-use tool for the creator and close friends. **Long-term vision:** App Store distribution and SaaS business serving the broader ADHD community.

---

## Core Vision

### Problem Statement

People with ADHD face a unique constellation of time-related challenges:

- **The 10:22am paralysis:** You have a dozen things to do. You know you should be doing something. But the *decision* of which thing to do right now, at this exact moment, is paralyzing. The executive function tax of choosing is as exhausting as doing the task itself.

- **Pomodoro's dirty secret:** Traditional productivity techniques front-load willpower on every single cycle. "What do I work on for these 25 minutes?" asked 12 times a day = decision fatigue by noon. And Pomodoro never helps you *think smaller* about a big fuzzy task.

- **The morning routine grind:** Getting ready in the morning is a sequential, time-pressured process with dozens of micro-steps. Without external structure, ADHD users lose track of time, skip steps, run late, and start the day anxious and behind. Every. Single. Day.

- **Repeated task breakdown:** Each time you face a routine task, you re-derive the steps from scratch because nothing captured last time's breakdown. The cognitive work of planning is repeated endlessly instead of done once and reused.

### Problem Impact

- **Daily quality of life:** Morning anxiety, chronic lateness, relationship friction ("you're always late"), workplace stress
- **Cumulative executive function drain:** Every unstructured task transition burns willpower that could go toward actual work
- **Emotional toll:** Shame, frustration, RSD (Rejection Sensitive Dysphoria) triggered by repeated "failures" that aren't actually failures — they're unsupported transitions

### Why Existing Solutions Fall Short

| Solution | Why It Fails for ADHD |
|----------|----------------------|
| **Phone timer / Apple Timer** | Single countdown. No steps, no context, no guidance. The beep triggers anxiety, not action. |
| **Pomodoro apps (Focus Keeper, etc.)** | Requires willpower each cycle to decide what to do. No task breakdown. No awareness of the bigger picture. |
| **Task managers (Todoist, Things)** | Lists of tasks, not guided execution. Knowing what to do ≠ doing it. No time structure, no transitions. |
| **Calendar blocking** | Static. Doesn't adapt. Doesn't guide you through the block. Overruns silently cascade. |
| **Generic timer apps** | Flat timers. No hierarchy, no substeps, no reusability, no emotional design. |

**The gap:** No app combines hierarchical timer structure + guided step-by-step execution + emotional co-pilot design + reusable routine library + real-time multi-device sync.

### Proposed Solution

A web-first PWA that lets users:

1. **Create hierarchical timers** — A parent timer ("Morning Routine: 45 min") with sequential substeps ("Shower: 8 min → Get dressed: 5 min → Breakfast: 12 min → ...")
2. **Save and reuse routines** — Timer library with one-tap replay. "I broke this routine down once. I never think about it again."
3. **Press play and follow along** — The app guides you through each step with voice (TTS), visual progress (concentric rings or progress indicators), and contextual messages ("Time to start Get Dressed. You're 3 steps in, 1 minute ahead.")
4. **Adjust on the fly** — Swipe to change durations, skip steps, extend time without shame ("I need 3 more minutes" is a feature, not a failure)
5. **AI-powered task breakdown** — Type "do laundry" and watch the app generate a complete hierarchical timer with substeps and estimated durations
6. **Sync everywhere** — Phone in the bathroom, laptop at the desk. Same session, real-time. Pause on one device, see it paused on the other.

### Key Differentiators

1. **Emotional co-pilot, not a countdown clock** — Every transition whispers: *what's next, where you are, you're okay*
2. **Reusable routine library** — Build once, replay forever. Eliminates repeated task breakdown
3. **Hierarchical timer model** — Parent/child timer relationships with dual time tracking (step time + total time)
4. **AI subtask breakdown** — The "wow moment" — natural language to structured timer in seconds
5. **No-judgment design** — Overruns mean flow. Extensions are a feature. "Your plans learn from you."
6. **Real-time multi-device sync** — Seamless experience across phone and desktop

---

## Target Users

### Primary Users: ADHD Adults (Working & Homemaking)

**Profile:** Adults (25-55) diagnosed or self-identified with ADHD who struggle with daily routine execution, time blindness, and task transition paralysis.

**Current behavior:**
- Use phone alarms or mental willpower to manage routines
- Frequently run late despite intending not to
- Re-derive task breakdowns from memory each time
- Experience morning anxiety and "where did the time go?" moments
- Have tried and abandoned Pomodoro apps, task managers, or calendar blocking

**What they'd value most:**
- "Just tell me what to do next and how long I have"
- Routines they set up once and replay without thinking
- Gentle, non-shaming guidance through transitions
- Voice announcements so they don't have to look at a screen

**Technical comfort:** Moderate. Comfortable with web apps and phones. Not interested in complex setup.

### Secondary Users: Neurotypical Routine Followers

**Profile:** Anyone who benefits from guided step-by-step execution of timed routines — parents getting kids ready, home cooks with complex recipes, people with elaborate workout sequences.

**What they'd value most:**
- Structured timer with substeps (not just a single countdown)
- Reusable routines
- Voice guidance (hands-free in kitchen, gym, etc.)

**Key insight:** The ADHD-first design accommodations (gentle transitions, no-shame overruns, contextual reassurance) don't exclude neurotypical users — they make the experience better for *everyone*.

---

## Success Metrics

### Personal Success (v1 — First 2 Weeks)

- **Daily use:** "I used my morning routine timer every day this week"
- **Emotional shift:** "I stopped dreading mornings"
- **Reliability:** App works smoothly on phone (mobile web) and laptop without sync issues

### Share-with-Friends Success (v1.1)

- At least 1 specific friend adopts the app for their own routines
- Friend creates their own timers (not just using the creator's)
- Friend sticks with it for 2+ weeks

### Long-term Business Success (v2+)

- App Store / Play Store presence
- Organic growth through ADHD community word-of-mouth
- Sustainable monetization (freemium or subscription)
- Positive reviews citing the emotional/ADHD-first design as differentiating

---

## MVP Scope

### Core Features (Launch Day — 12 features)

1. **Hierarchical timers** — Parent timer with sequential substeps, dual time tracking (step time + total elapsed)
2. **Timer library ("My Timers")** — Create, save, reuse, and delete timer templates
3. **Play / Pause / Skip step** — Core playback controls for running a timer
4. **"I need X more minutes"** — Extend current step duration without judgment
5. **Count-up default** — With countdown toggle per timer/step
6. **Contextual transition messages** — "Time to start [step]. You're 3 steps in, 2 min ahead"
7. **Text-to-speech** — Voice reads each step aloud as it begins
8. **Real-time cross-device sync** — Mobile browser + desktop PWA, same session state
9. **Visual progress indicator** — Concentric rings or progress visualization
10. **User accounts & auth** — Required for sync (Firebase Auth — Google/email)
11. **Swipe-to-adjust durations** — Quick inline duration changes per substep
12. **AI subtask breakdown** — Type a task name, AI generates hierarchical timer with substeps and durations

### Out of Scope for MVP

- Post-completion review / timer adjustment suggestions
- Step types (Active / Wait / Checkpoint) as distinct concepts
- Defer step ("not now, come back later")
- Top-level timer switching (pause one timer, start another)
- Pause-between-steps toggle
- AI task picker / "what should I do at 10:22"
- Scheduled routines with reminders
- Streaks / habit tracking
- Errands mode / departure time awareness
- Body double / ambient audio / companion personality
- Dynamic Island / Live Activity
- Native app shells (Capacitor)
- Shared timers / social features

### MVP Success Criteria

- Creator uses morning routine timer daily for 2 consecutive weeks
- App syncs reliably between phone (mobile Safari/Chrome) and laptop
- One friend creates and uses their own timer without hand-holding
- AI subtask breakdown produces usable results for common routines

### Future Vision

**v2:** Post-completion learning ("your plans learn from you"), step types, AI vague-task detection, repeatable routines with scheduling, flexible-order steps, interwoven mode, preference learning

**v3+:** Digital body double, ambient audio, AI time-block planner, errands mode, calendar integration, native app shells, App Store distribution, SaaS monetization

---

## Technical Preferences

*Note: These are preferences for the Product Brief. Final architecture decisions will be made during the Architecture workflow.*

| Layer | Preference | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js + React | Creator's familiar stack; SSR/SSG for marketing pages, CSR for app |
| **Hosting** | GCP Cloud Run | User's existing GCP account; pairs with Firebase |
| **Database / Sync** | Firestore | Real-time listeners, offline support, no server to manage, pairs with Firebase Auth |
| **Auth** | Firebase Auth | Google + email login, minimal setup, pairs with Firestore |
| **TTS** | Web Speech API | Free, built into browsers, no API cost |
| **AI** | OpenAI or Anthropic API | Structured output for subtask breakdown |
| **Platform** | Web-first PWA | Installable on mobile home screens; Capacitor for future native shells |
| **Styling** | TBD (Tailwind likely) | Creator preference, decided during architecture |

**Appification path:** Web-first PWA → Capacitor (or similar) wrapping for App Store / Play Store when distribution demands it. React Native is *not* the path — staying in the Next.js/React ecosystem.

---

## Risks and Assumptions

### Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Real-time sync complexity** | Conflict resolution when same timer active on two devices | Firestore's real-time listeners handle most cases; design "single active controller" model |
| **TTS on mobile browsers** | Safari/iOS has quirks with Web Speech API autoplay policies | Test early on iOS Safari; may need user interaction to unlock audio; fallback to visual-only |
| **AI subtask cost** | Each breakdown calls an LLM; costs scale with usage | Rate limiting per user; cache common breakdowns; consider on-device models later |
| **Scope creep** | 12 MVP features is already ambitious for "soon" | Ruthless prioritization; launch with core 8, fast-follow with remaining 4 if needed |
| **PWA limitations on iOS** | iOS Safari has limited PWA support (no push notifications, limited background) | Acceptable for v1 (timer runs in foreground); native shell solves this for v2+ |

### Key Assumptions

1. ADHD users will adopt a *new* app if it clearly serves their specific needs (validated by creator's own pain)
2. Web Speech API is reliable enough for step-by-step TTS on major browsers
3. Firestore real-time sync is sufficient for timer state synchronization
4. AI-generated subtask breakdowns are useful enough to justify the feature complexity
5. A morning routine is the right "hero use case" to anchor v1 around

### Open Questions for Architecture Phase

1. Timer data model: How deep should hierarchy go? (Recommendation: 2 levels for MVP — Timer → Steps)
2. State machine design: Running / Paused / Completed / Skipped — how do transitions work with sync?
3. Offline behavior: What happens when a device loses connection mid-timer?
4. AI prompt engineering: Structured output format for subtask generation
5. Concentric rings: Canvas/SVG/CSS animation approach?

---

## Design Principles

*Carried forward from brainstorming session — these are the soul of the product:*

| # | Principle |
|---|-----------|
| 1 | It's **energy management**, not time management |
| 2 | The app is an **emotional co-pilot**, not a countdown clock |
| 3 | Every transition whispers: **what's next, where you are, you're okay** |
| 4 | **"Always have a default. Never force a choice. Allow an override."** |
| 5 | Gentle honesty over false cheerfulness |
| 6 | **"Your plans learn from you"** — no-judgment learning loop |
| 7 | Capture stray thoughts without breaking flow |
| 8 | **Build once, replay forever** — reusable routines eliminate repeated cognitive work |

---

## Supporting Materials

- **Brainstorming Session:** `docs/brainstorming-session-results-2026-02-14.md` — 43+ ideas, Five Whys root cause analysis, Assumption Reversal, v1/v2/v3 categorization, design principles, action planning

---

_This Product Brief captures the vision and requirements for ADHD Timer._

_It was created through collaborative discovery and reflects the unique needs of this personal-tool-to-product project._

_Next: PRD (Product Manager agent) will transform this brief into detailed product requirements with epics and stories._
