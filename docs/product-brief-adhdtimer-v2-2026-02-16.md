# Product Brief: ADHD Timer v2

**Date:** 2026-02-16
**Author:** BMad
**Context:** Brownfield evolution — v2 feature release on a shipped MVP

---

## Executive Summary

ADHD Timer v1 shipped a complete guided timer experience: hierarchical timers, voice announcements, real-time cross-device sync, visual progress, AI task breakdown, and a warm completion view. It answers the question *"what's next?"* so ADHD brains don't have to.

**v2 transforms the app from a timer into a companion.** The core insight: a single timer run is useful, but a *routine practiced daily* is life-changing. v2 makes steps semantically rich (Active, Wait, Checkpoint), lets routines repeat on a schedule with streak tracking, and — most critically — watches how you actually execute your routines and suggests duration adjustments. *Your plans learn from you.*

The emotional shift: v1 says "here's what's next." v2 says "I've been paying attention, and I think Shower should be 10 minutes, not 8 — you've gone over three days in a row. Want me to adjust it?"

---

## Core Vision

### What v1 Established

A working PWA with 14 core features across 5 epics (23 stories, all completed):
- Hierarchical timers with library, CRUD, playback, time extension
- Voice-announced step transitions with contextual messages
- Real-time cross-device sync with control handoff
- AI-powered task breakdown from natural language
- Visual progress, completion view, screen wake lock
- Firebase Auth (Google + email), Firestore backend, GCP Cloud Run hosting

### What v2 Adds — "Your Plans Learn From You"

v1 treats every timer run as independent. v2 connects them — the app remembers how you actually execute routines and uses that knowledge to help you build better plans.

Three new capabilities define v2:

1. **Smarter Steps** — Steps gain types (Active, Wait, Checkpoint) and new behaviors (defer, manual advance). The app understands *what kind of work* each step represents.

2. **Routines & Habits** — Timers become repeatable routines with scheduling and streak tracking. The app becomes a daily companion, not a one-off tool.

3. **Learning Companion** — Post-completion review analyzes your runs and suggests duration tweaks. Gentle reminders nudge during long steps. The app watches, learns, and helps you plan better.

Plus: AI vague-task detection makes the existing AI breakdown smarter by proactively offering to decompose broad steps.

### Problem Statement

v1 users build a timer, run it, and see a completion summary — but the next time they run it, the timer is exactly the same. If Shower consistently takes 10 minutes instead of the planned 8, the user has to notice that pattern themselves and manually edit. The app has the data but doesn't use it.

Additionally, steps are all treated identically — but "Shower" (active, hands-busy) is fundamentally different from "Wait for coffee to brew" (passive, check back later) and "Leave by 7:45" (hard deadline, no duration). The playback experience doesn't reflect these differences.

Finally, there's no concept of "I do this every weekday morning." The app doesn't know that Morning Routine is a daily thing, doesn't track consistency, and doesn't help build the habit loop that makes routines stick.

### Proposed Solution

Eight features organized into three themes plus an AI enhancement:

**🧠 Smarter Steps**
- **Step types:** Active (default, current behavior), Wait (passive — different visual, optional auto-advance), Checkpoint (mid-routine time gate — clock-time target, no duration). Checkpoints can appear anywhere in a routine and multiple are allowed. "Coffee brewing by 7:15" → steps → "Dressed by 7:30" → steps → "Out the door by 7:45." On reaching a Checkpoint, the app compares current clock time to the target and reports status ("2 min ahead of 7:30 target" or "3 min past 7:15 target"), then continues to the next step. Checkpoints are informational, not blocking.
- **Pause-between-steps toggle:** Manual advance mode — timer pauses at each transition, user taps to start next step. Per-timer setting. Useful for routines where step transitions aren't predictable.
- **Defer step:** "Not now, come back before parent ends." Moves the step to the end of the queue (or a chosen position). The app tracks deferred steps and reminds before the timer completes.

**🔁 Routines & Habits**
- **Repeatable routines:** Timer templates gain scheduling metadata — which days of the week, what time of day (morning/afternoon/evening). No push notifications (deferred to native app era). Instead: in-app awareness. When the user opens the app, it knows "Morning Routine is due today" and surfaces it prominently.
- **Streak/habit tracker:** Opt-in, non-shaming. "Day 6 ☕" not "🔥 DON'T BREAK YOUR STREAK! 🔥". Tracks consecutive completions. Missing a day resets the counter without drama. Optional — users can ignore it entirely.

**💬 Learning Companion**
- **Post-completion review with suggestions:** After completing a routine that has 3+ prior runs, the completion view includes gentle suggestions: "Shower averaged 10 min over your last 5 runs (planned: 8). Adjust to 10?" User can accept individual suggestions, accept all, or dismiss. Suggestions are data-driven, not judgmental.
- **Gentle step reminder:** During long steps (configurable threshold, default 5+ minutes), a periodic nudge: "You're working on [Step Name]" — voice or visual. Not a nag, just a "hey, you're still here" for ADHD brains that lose track.

**🤖 Smarter AI**
- **AI vague-task detection:** When creating or editing a timer, if a step name is vague or broad ("clean the house", "work on project"), the AI proactively suggests: "This seems broad — want me to break it down into substeps?" Leverages the existing AI breakdown API. Trigger: step name analysis during save or on-blur.

---

## Target Users

### Primary Users (Same as v1)

ADHD adults who struggle with time blindness, task transition paralysis, and repeated mental task breakdown. They've already adopted the app for daily routines. v2 deepens their relationship with the app — it becomes something they rely on daily, not just occasionally.

**v2-specific user need:** "I've been using my Morning Routine timer for a week. I know some of my time estimates are wrong, but I keep forgetting to fix them. I wish the app would just tell me."

### Secondary Users

Anyone running timed multi-step routines regularly — parents managing kid bedtime routines, fitness enthusiasts with workout circuits, cooks following complex recipes. v2's scheduling and streaks make the app stickier for repeat use.

---

## Success Criteria

### Primary Success Metric

**"I use the same routine 5 days running and the app suggests step duration tweaks helpfully."**

This single criterion validates the entire v2 thesis: the app learns from usage patterns and makes actionable suggestions that the user finds genuinely helpful (not annoying, not obvious, not wrong).

### Supporting Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Routine repetition | Creator runs the same routine 5+ times in 10 days | Session history data |
| Suggestion acceptance | Duration adjustment suggestions accepted >50% of the time | Completion view interaction data |
| Streak engagement | Creator maintains a streak of 5+ days on at least one routine | Streak tracker data |
| Step type usage | Creator uses at least 2 step types in their primary routine | Timer template data |
| Manual advance adoption | At least 1 routine uses pause-between-steps mode | Timer template settings |
| Defer usage | Defer action used at least once per week | Session interaction data |

### What "Helpful" Means

The suggestion system must feel like a thoughtful friend, not a nagging robot:
- ✅ "Shower averaged 10 min last 5 runs (planned 8). Adjust?" — Helpful
- ✅ "Get Dressed was under 3 min every time. Shorten to 3?" — Helpful
- ❌ "You went 30 seconds over on Brush Teeth" — Noise, not signal (threshold needed)
- ❌ Suggesting changes after only 1-2 runs — Too early, not enough data

---

## v2 Scope

### Core Features (8)

| # | Feature | Theme | Complexity Estimate |
|---|---------|-------|-------------------|
| 1 | Step types (Active / Wait / Checkpoint) | 🧠 Smarter Steps | Medium — schema change, playback behavior changes, UI for type selection |
| 2 | Pause-between-steps toggle | 🧠 Smarter Steps | Small — per-timer setting, playback state machine change |
| 3 | Defer step | 🧠 Smarter Steps | Medium — queue manipulation during playback, deferred step tracking |
| 4 | Repeatable routines with scheduling | 🔁 Routines & Habits | Medium — scheduling metadata, in-app awareness UI, "due today" logic |
| 5 | Streak/habit tracker | 🔁 Routines & Habits | Small-Medium — session history analysis, streak display, reset logic |
| 6 | Post-completion review with suggestions | 💬 Learning Companion | Medium-Large — historical run analysis, suggestion generation, UI for accept/dismiss |
| 7 | Gentle step reminder | 💬 Learning Companion | Small — timer-based nudge during long steps, TTS/visual |
| 8 | AI vague-task detection | 🤖 Smarter AI | Small-Medium — step name analysis, proactive suggestion UI, integration with existing AI route |

### Out of Scope for v2

- Push notifications / external reminders (deferred to native app era)
- Top-level timer switching (pause one timer, start another)
- "Capture idea for later" (rabbit trail parking lot)
- Flexible-order steps within a block
- Interwoven mode (timers with wait-gaps auto-interleave)
- Preference learning (gathers reasons, augments future AI suggestions)
- Run history browsing UI (data is collected, but no dedicated history view yet)
- Digital body double / ambient audio / companion personality
- Native app shells (Capacitor)
- Any v3+ vision features

### Future Vision (v3+)

Retained from v1 product brief, plus new items that may emerge during v2 development:
- Native app shells via Capacitor → enables push notifications, background execution
- "Capture idea for later" (rabbit trail parking lot)
- Flexible-order steps within a block
- Interwoven mode (timers with wait-gaps auto-interleave)
- Preference learning (gathers reasons for choices, augments future AI suggestions)
- Digital body double, ambient audio, AI time-block planner
- Full run history browsing and analytics

---

## Technical Preferences

v2 builds on the existing v1 stack. No major infrastructure changes expected.

| Layer | Current (v1) | v2 Changes |
|-------|-------------|------------|
| **Framework** | Next.js 16.1.x (App Router) | No change |
| **Database** | Firestore | Schema evolution: step types field, scheduling metadata, run history for suggestions |
| **Auth** | Firebase Auth | No change |
| **AI** | OpenAI/Anthropic via API routes | Extend for vague-task detection (new prompt, possibly same route) |
| **TTS** | Web Speech API | Extend for gentle step reminders |
| **Hosting** | GCP Cloud Run | No change |
| **Notifications** | None | **Not in v2** — in-app awareness only |

### Key Technical Considerations

- **Schema migration:** Step types and scheduling metadata require Firestore schema changes. Must be backward-compatible with existing v1 timer data.
- **Run history storage:** Post-completion suggestions need access to historical run data. v1 already preserves RunSession documents. v2 needs to query and analyze them.
- **State machine evolution:** Defer step and pause-between-steps add new states/transitions to the playback engine. Must be carefully designed to not break existing playback.
- **Suggestion algorithm:** Duration adjustment suggestions need a simple but effective algorithm — likely rolling average of last N runs with configurable sensitivity threshold.

---

## Risks and Assumptions

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema migration breaks existing timers | High | Backward-compatible schema design; migration tested thoroughly |
| Suggestion algorithm feels annoying or unhelpful | Medium | Conservative thresholds (3+ runs, >1 min difference); easy dismiss |
| Step types add complexity to timer creation UX | Medium | Default to "Active" type; types are optional enhancement, not required |
| Defer step complicates playback state machine | Medium | Careful state machine design during architecture phase |
| Streak tracker feels gamified/pressuring | Low | Non-shaming language; opt-in; no negative reinforcement |
| Repeatable routines without push notifications feel incomplete | Low | In-app awareness compensates; push is a v3 native-app feature |

---

## Supporting Materials

- **v1 Product Brief:** `docs/product-brief-adhdtimer-2026-02-14.md`
- **v1 PRD:** `docs/PRD.md` (includes Growth Features / Post-MVP section)
- **v1 Architecture:** `docs/architecture.md`
- **v1 UX Design Spec:** `docs/ux-design-specification.md`
- **Brainstorming Session:** `docs/brainstorming-session-results-2026-02-14.md` (ideas #20, #22, #23 directly sourced)
- **v1 Epics:** `docs/epics.md` (23 stories, all completed)
- **v1 Sprint Status:** `docs/sprint-status.yaml` (all done, v2 planning section added)

---

_This Product Brief captures the vision for ADHD Timer v2 — the evolution from guided timer to learning companion._

_It was created through collaborative discovery and builds on the foundation of a shipped v1 MVP._

_Next: PRD v2 will transform this brief into detailed functional requirements, followed by UX Design and Architecture updates._
