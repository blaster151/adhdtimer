# Brainstorming Session Results

**Session Date:** 2026-02-14
**Facilitator:** Master Task Executor 🧙 BMad Master
**Participant:** BMad

## Executive Summary

**Topic:** Core features and design philosophy for ADHD Timer — a multi-device synchronized hierarchical timer application for ADHD task and energy management

**Session Goals:** Explore core features, user experience, emotional design principles, and differentiation strategy for an ADHD-first timer application

**Techniques Used:** Five Whys (Deep), Assumption Reversal (Deep)

**Total Ideas Generated:** 43+

### Key Themes Identified

1. **Emotional Infrastructure** — The app's core job isn't tracking time — it's managing emotional state. Every feature decision should pass the test: "Does this reduce anxiety, preserve momentum, or build confidence?"

2. **Cognitive Load Elimination** — The ADHD brain has limited executive function bandwidth. Every micro-decision the app can absorb (what's next, how long, am I okay) is energy freed for the actual task.

3. **Adaptive Intelligence** — The app learns and evolves — from timer duration adjustments to preference learning to AI-generated subtasks. It gets smarter *about this specific user* over time.

4. **Fluid Structure** — Not rigid. Not chaos. A spectrum from "fully guided" to "I'll pick my own order" with smart defaults everywhere. Steps can be deferred, skipped, extended, reordered — but the system always has a suggestion ready.

5. **Multi-Modal Presence** — The app meets you where you are — voice, visual (rings, toasts, Dynamic Island), text, ambient sound. Desktop or phone. The experience adapts to context, not the other way around.

6. **Compassionate Design** — No shame. Overruns are flow. Skips are valid. Streaks are gentle. The tagline says it all: *"Your plans learn from you."*

## Root Cause Analysis (Five Whys)

**Starting Statement:** People with ADHD struggle with managing time across tasks.

| Level | Finding |
|-------|---------|
| **Why 1** | Time blindness, hyperfocus rabbit trails, and ambiguous/insufficiently broken-down tasks |
| **Why 2** | Anxiety of the whole — fear there isn't enough time for everything; existing tools have no memory of the bigger picture; Pomodoro demands repeated willpower expenditure |
| **Why 3** | Every transition feels like a cold restart; executive function disorder makes resumption feel like starting the whole day over; during long steps, users forget what they're supposed to be doing |
| **Why 4** | Context lost at boundaries: *what am I doing, where am I in the bigger picture, am I okay?* The app needs to answer all three in a single glance/voice prompt |
| **Why 5** | **Emotional safety** — RSD/impostor syndrome + existential priority anxiety ("Am I spending time on routines instead of growth?") create a paralysis loop |

**Root Cause:** ADHD timer tools fail because they treat time as a mechanical problem when it's actually an **emotional regulation / energy management** problem. The app must be an **emotional co-pilot** that carries the cognitive load of "what's next," provides contextual reassurance, and learns from the user without judgment.

## Technique Sessions

### Technique 1: Five Whys

Drilled from surface-level "time blindness" to the emotional bedrock: RSD, impostor syndrome, and the paralysis loop between safety-seeking and growth-seeking. Produced the foundational insight that the app is an emotional co-pilot, not a countdown clock.

**Key ideas generated during Five Whys:**
- "Capture idea for later" — quick-capture for rabbit-trail thoughts during a running timer
- AI detection of vague/breakdown-able tasks
- Willpower-light transitions — the app handles "what's next"
- "Everything else" visibility — see other timers without them hijacking focus
- Gentle step reminder during long steps
- Auto-Pomodoro overlay on scheduled routines
- Contextual transition messages: "Time to start [step]. You're 3 steps in, 12 min ahead"
- Adaptive notification delivery (toasts on desktop, push on mobile, voice if enabled)

### Technique 2: Assumption Reversal

Flipped five core assumptions about timer apps:

**Assumption 1: "Timers should count down"**
→ Count-up as default. Zen mode (color gradient, no numbers). **Concentric ring visualization** — nested circles with inner spinning faster. "Oddly satisfying" checkpoint reward videos.

**Assumption 2: "The user must set up their own timers"**
→ Natural language timer creation ("I need to do laundry" → AI generates full timer). AI time-block planner with side-by-side arrangement proposals. Preference learning over time.

**Assumption 3: "Steps must run in a fixed sequence"**
→ Flexible-order steps within a block. Design principle: **"Always have a default. Never force a choice. Allow an override."** Defer step capability.

**Assumption 4: "Being behind schedule is bad"**
→ Overruns mean flow. No-judgment learning loop. Post-completion review suggests timer adjustments. Tagline: **"Your plans learn from you."**

**Assumption 5: "A timer app should stay out of your way"**
→ **Digital body double** concept — ambient companion presence. Background audio that shifts with progress. Persistent visual presence via Live Activity / Dynamic Island. The psychological model of "body doubling" for ADHD.

### Additional Ideas Generated (outside techniques)

- **Repeatable routines** with scheduled frequency + time, app reminds you
- **Low-key streak/habit tracker** — opt-in, non-shaming
- **Timer library ("My Timers")** — reusable templates vs. one-shot timers with easy deletion
- **Swipe-to-adjust durations** on each substep line
- **Interwoven mode** — timers with wait-gaps auto-interleave (cooking + laundry)
- **Step types: Active / Wait / Checkpoint** as first-class concepts
- **Errands mode** — destinations, driving times, optimal trip planning, closing-time awareness
- **Departure time awareness** — "4pm appointment → leave at 3:40"
- **GTD context tags** (Phone, Computer, On Errand) slipstreamed into gaps
- **AI-OCR recipe → auto-generate cooking timer**
- **Interval/repeating-set support** (gym timers) — consider but deprioritize
- **Delegate-to-external-app step type** — count time block without managing internals

## Idea Categorization

### Immediate Opportunities (v1)

_Core features that define the product_

1. Hierarchical timers — parent timer with sequential substeps, dual time tracking
2. Real-time cross-device sync — pause on one device, see it paused on another
3. "Skip to next step" — covers both "irrelevant today" and "finished early"
4. "I need X more minutes" — silent time extension on current step
5. Top-level timer switching — pause current, start another (context switch handling)
6. "Pause between steps" toggle — optional manual advance
7. Count-up default with countdown toggle
8. Concentric ring visualization — nested circles, inner spins faster
9. Contextual transition messages — "Time to start [step]. You're 3 steps in, 12 min ahead"
10. Text-to-speech — voice reads each step aloud as it begins
11. Post-completion review — steps that overran/underran, suggest timer adjustments
12. Timer library ("My Timers") — reusable templates vs. one-shot timers, easy deletion
13. Swipe-to-adjust durations — quick duration changes per substep
14. Step types: Active / Wait / Checkpoint
15. Defer step — "not now, come back before parent ends"
16. Design principle: "Always have a default. Never force a choice. Allow an override."
17. AI subtask breakdown — leaf steps broken into substeps, fitted to parent duration or estimated

### Future Innovations (v2)

_Validated ideas needing more development_

18. AI detection of vague tasks — proactive "this seems broad, want to break it down?"
19. "Capture idea for later" — quick-capture during running timer (rabbit trail parking lot)
20. Gentle step reminder — periodic nudge during long steps: "You're working on [X]"
21. Auto-Pomodoro overlay — app layers breaks on top of routines, or AI-inserts breaks
22. Repeatable routines — scheduled frequency + time, app reminds you
23. Low-key streak/habit tracker — opt-in, non-shaming "Day 12 ✓"
24. Natural language timer creation — "I need to do laundry" → AI generates full timer
25. Adaptive notification delivery — toasts (desktop) / push (mobile) / voice, on active device
26. No-judgment learning loop — "Your plans learn from you" — overruns celebrated as flow
27. Preference learning — gathers reasons for choices, augments future AI suggestions
28. Flexible-order steps — unordered steps within a block, default suggested but overridable
29. Interwoven mode — timers with wait-gaps auto-interleave (cooking + laundry together)
30. Delegate-to-external-app step type — "Gym: 45 min" counted without managing internals

### Moonshots (v3+)

_Bold, transformative concepts_

31. Digital body double — ambient presence, voice, personality as a companion
32. Live Activity / Dynamic Island — persistent step + progress ring on lock screen
33. Background ambient audio — subtle soundscape that shifts with progress
34. AI time-block planner — "2 hours before meeting" → proposes which routines fit, side-by-side options
35. Errands mode — destinations, driving times, optimal trip planning, closing-time awareness
36. Departure time awareness — "4pm appointment → leave at 3:40" as first-class feature
37. GTD context tags — Phone/Computer/Errand, slipstreamed into gaps
38. AI-OCR recipe → timer — photograph a recipe, auto-generate cooking timer with gaps
39. Calendar integration — awareness of upcoming commitments reducing background anxiety
40. "Oddly satisfying" checkpoint rewards — dopamine micro-hits at step completions
41. Zen mode — color gradient / progress bar only, no numbers
42. Interval/repeating-set support — gym-style timer as optional extension
43. Side-by-side schedule proposals with reason-gathering for preference learning

### Insights and Learnings

_Key realizations from the session_

1. Time management apps fail ADHD users because they're built for neurotypical brains — this app must be built from ADHD-first principles
2. The transition between steps is the most dangerous moment — and also the greatest design opportunity
3. "Body doubling" is the psychological model for the companion presence — not a chatbot, not a tool, but a felt presence
4. Wait steps are a first-class concept — and they unlock the interweaving engine that differentiates the product
5. The concentric ring visualization solves spatial time comprehension without number anxiety
6. Preference learning creates a flywheel — the longer you use it, the better it gets, the harder it is to leave
7. It's energy management, not time management — whether that's emotional regulation or its own axis

## Design Principles

| # | Principle |
|---|-----------|
| 1 | It's **energy management**, not time management |
| 2 | The app is an **emotional co-pilot**, not a countdown clock |
| 3 | Every transition whispers: **what's next, where you are, you're okay** |
| 4 | **"Always have a default. Never force a choice. Allow an override."** |
| 5 | Gentle honesty over false cheerfulness |
| 6 | **"Your plans learn from you"** — no-judgment learning loop |
| 7 | **Digital body double** — companion presence, not a silent tool |
| 8 | Capture stray thoughts without breaking flow |

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: The Core Timer Engine

- Rationale: Everything depends on this. No AI, no transitions, no sync matter if the hierarchical timer model isn't rock-solid. This is the data model, the state machine, and the fundamental UX.
- Next steps: Define timer data model (Timer → Steps → Substeps with types Active/Wait/Checkpoint); Build state machine (running/paused/completed/skipped/deferred); Implement real-time sync architecture; Build core UI with concentric ring visualization; Implement skip/defer/extend controls; Top-level timer switching with auto-pause
- Resources needed: Frontend framework (React Native or web-first PWA), real-time backend (Firebase/Supabase), state management
- Timeline: 4-6 weeks for functional core

#### #2 Priority: Contextual Transitions & TTS

- Rationale: This is what makes it feel ADHD-first. Without it, you've built a fancy timer. With it, you've built an emotional co-pilot. This is the soul of the product.
- Next steps: Design transition message system with contextual variables; Build encouragement engine (ahead/behind/on-track logic); Integrate TTS (Web Speech API / AVSpeechSynthesizer); Implement toast/notification system; Design pause-between-steps checkpoint UX; In-step periodic nudge system
- Resources needed: TTS APIs, notification framework, UX copy/tone design
- Timeline: 2-3 weeks, partially overlapping with Priority #1

#### #3 Priority: AI Subtask Breakdown

- Rationale: The "wow moment" — type "do laundry" and watch the app generate a complete hierarchical timer. Validates the AI direction and is the hook that makes people tell their friends.
- Next steps: Design AI prompt engineering (task name → structured substep JSON); Integrate LLM API with structured output; Build "break down this step" UI trigger; Implement duration fitting logic; Add "insufficient context" response path; Allow user editing before accepting
- Resources needed: LLM API access (OpenAI/Anthropic), prompt engineering, structured output parsing
- Timeline: 2-3 weeks, begins after core data model is stable

## Reflection and Follow-up

### What Worked Well

- Five Whys drilled straight to the emotional core and unlocked design principles
- Assumption Reversal produced concrete differentiators (concentric rings, tagline, body double)
- Tangential conversation produced some of the strongest ideas (interwoven mode, errands, satisfying videos)

### Areas for Further Exploration

- Technical architecture deep-dive (real-time sync, offline-first)
- Competitive analysis (existing ADHD timer space)
- User research with other ADHD users
- Monetization model

### Recommended Follow-up Techniques

- Role Playing — brainstorm as different user personas (teen, working parent, student)
- SCAMPER — systematically iterate on the core timer UX once data model exists

### Questions That Emerged

1. How deep should the hierarchy go? Firm 2-level limit or allow arbitrary nesting?
2. What's the right balance between AI-generated and user-created timers?
3. Should the app have accounts/auth from v1 (needed for sync) or start local-only?
4. Web-first (PWA) or native-first (React Native / Swift)?
5. How to handle conflicts in real-time sync?

### Next Session Planning

- **Suggested topics:** Product brief creation → PRD → Architecture decisions
- **Recommended timeframe:** Immediately — momentum from this session is high
- **Preparation needed:** This brainstorming report

---

_Session facilitated using the BMAD CIS brainstorming framework_
