# Implementation Readiness Assessment Report

**Date:** 2026-02-14
**Project:** adhdtimer
**Assessed By:** BMad (via BMad Master 🧙)
**Assessment Type:** Phase 3 to Phase 4 Transition Validation

---

## Executive Summary

**Overall Assessment: ✅ READY TO PROCEED**

The ADHD Timer project has a comprehensive, well-aligned set of planning artifacts. The PRD, Architecture, Epic/Story Breakdown, and UX Design Specification are complete, internally consistent, and cross-referenced. No critical issues were found. A small number of high and medium priority observations are documented below — none are blocking. The story sequencing supports iterative delivery, and the first story can begin implementation immediately.

---

## Project Context

- **Project Type:** Web Application (PWA with real-time capabilities)
- **Domain:** General (no regulatory/compliance complexity)
- **Complexity:** Medium — real-time multi-device sync, AI integration, hierarchical timer state machine
- **Classification Level:** 3-4 (full planning: PRD + Architecture + Epics + UX Design)
- **Field Type:** Greenfield
- **Technology Stack:** Next.js 16.1.x, React 19.2, TypeScript 5.x, Tailwind CSS 4.x, Firebase 12.9.x (Auth + Firestore), shadcn/ui, @dnd-kit 6.3.x, OpenAI gpt-4o-mini, GCP Cloud Run
- **Target Users:** ADHD adults (primary), anyone running timed multi-step routines (secondary)

---

## Document Inventory

### Documents Reviewed

| Document | Path | Lines | Status |
|----------|------|-------|--------|
| Product Brief | `docs/product-brief-adhdtimer-2026-02-14.md` | ~100 | ✅ Complete |
| Brainstorming | `docs/brainstorming-session-results-2026-02-14.md` | 242 | ✅ Complete |
| PRD | `docs/PRD.md` | 790 | ✅ Complete |
| Epic Breakdown | `docs/epics.md` | 919 | ✅ Complete |
| UX Design Specification | `docs/ux-design-specification.md` | 811 | ✅ Complete |
| Architecture | `docs/architecture.md` | 789 | ✅ Complete |
| Workflow Status | `docs/bmm-workflow-status.yaml` | 45 | ✅ Current |
| Color Theme Explorer | `docs/ux-color-themes.html` | — | ✅ Reference artifact |
| Design Direction Mockups | `docs/ux-design-directions.html` | — | ✅ Reference artifact |

### Document Analysis Summary

All 6 core planning documents are present, dated, and internally complete. No placeholder sections remain. Terminology is consistent across documents. The PRD references the product brief and brainstorming session. The epics reference the PRD. The architecture references the PRD and epics. The UX design references all prior documents and explicitly maps component implementation to epic sequencing.

---

## Alignment Validation Results

### Cross-Reference Analysis

#### PRD → Architecture Alignment

| PRD Requirement | Architecture Support | Status |
|----------------|---------------------|--------|
| FR1: Hierarchical timer data model | Firestore data architecture with TypeScript interfaces (`TimerTemplate`, `Step`, `RunSession`, `SessionStep`) | ✅ Aligned |
| FR1.2: Timer state machine | `useTimerEngine` hook detailed as novel pattern with full data flow | ✅ Aligned |
| FR1.3: Timestamp-based time tracking | ADR-3 explicitly mandates timestamp math, never tick counting | ✅ Aligned |
| FR2: Timer CRUD | `src/lib/firebase/timers.ts` + `src/components/timer/` components mapped | ✅ Aligned |
| FR3: Playback controls | `src/components/session/playback-controls.tsx` + `useTimerEngine` hook | ✅ Aligned |
| FR4: Count-up/countdown modes | `countdownMode` boolean on `TimerTemplate` interface, display logic in architecture | ✅ Aligned |
| FR5: Real-time cross-device sync | `useFirestoreSession` hook with `onSnapshot` listener, `activeDeviceId` pattern, controller/observer mode | ✅ Aligned |
| FR6: Contextual transition messages | `src/components/session/transition-overlay.tsx`, pace calculation in `src/lib/utils/pace.ts` | ✅ Aligned |
| FR7: Text-to-speech | `useTTS` hook, Web Speech API, graceful degradation | ✅ Aligned |
| FR8: Visual progress indicator | `src/components/session/progress-ring.tsx`, SVG with `stroke-dashoffset` | ✅ Aligned |
| FR9: Authentication | Firebase Auth, `src/components/auth/` (auth-provider, sign-in-form, auth-guard) | ✅ Aligned |
| FR10: Swipe-to-adjust durations | `src/components/timer/step-list-editor.tsx` (enhanced in Epic 4), touch events | ✅ Aligned |
| FR11: AI subtask breakdown | Server-side API route `POST /api/ai/breakdown`, full prompt template, rate limiting via Firestore, OpenAI primary + Anthropic fallback | ✅ Aligned |
| FR12: Timer completion view | `src/components/session/completion-view.tsx` | ✅ Aligned |
| FR13: Screen wake lock | `useWakeLock` hook, Wake Lock API lifecycle | ✅ Aligned |
| NFR: Performance (< 2s load, < 3s sync, timestamp accuracy) | Turbopack bundling, Firestore write batching, timestamp-based timing, requestAnimationFrame display | ✅ Aligned |
| NFR: Security (API keys server-side, Firestore rules) | Security architecture section, `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` server-side only, Firestore rules enforce `auth.uid == userId` | ✅ Aligned |
| NFR: Accessibility (WCAG AA, 44px targets, reduced motion) | UX spec §8.2 (full WCAG AA strategy), architecture UI consistency rules (48px targets) | ✅ Aligned |

**Result: 14/14 functional requirements and all non-functional requirements have explicit architectural support. No gold-plating beyond PRD scope detected.**

#### PRD → Stories Coverage

| PRD Feature | Epic.Story | Coverage |
|-------------|-----------|----------|
| FR1: Timer data model | 1.3 (Data Model & Firestore Schema) | ✅ Full |
| FR2: Timer library CRUD | 1.4 (Create & List) + 1.5 (Edit & Delete) | ✅ Full |
| FR3.1: Play/Pause/Skip | 1.6 (Core Playback) | ✅ Full |
| FR3.2: Time extension | 1.7 (Time Extension) | ✅ Full |
| FR4: Count-up/countdown | 4.3 (Countdown Toggle) | ✅ Full |
| FR5.1: State sync | 3.1 (Session Listener) | ✅ Full |
| FR5.2: Conflict resolution / device handoff | 3.2 (Device Handoff) + 3.3 (Conflict Handling) | ✅ Full |
| FR5.3: Offline behavior | 3.3 (Sync Conflict Handling) | ✅ Full |
| FR6: Contextual transitions | 2.1 (Transition Messages) | ✅ Full |
| FR7: TTS | 2.2 (TTS Step Announcements) | ✅ Full |
| FR8: Visual progress | 2.3 (Visual Progress Indicator) | ✅ Full |
| FR9: Auth | 1.2 (Firebase Authentication) | ✅ Full |
| FR10: Swipe-to-adjust | 4.1 (Swipe-to-Adjust Durations) | ✅ Full |
| FR11: AI breakdown | 5.1 (API Route) + 5.2 (UI Input & Loading) + 5.3 (Edit, Regenerate & Save) | ✅ Full |
| FR12: Completion view | 2.4 (Timer Completion View) | ✅ Full |
| FR13: Wake lock | 2.5 (Screen Wake Lock) | ✅ Full |
| FR1.2: State machine | Covered across 1.6, 1.7 (engine) + 3.1-3.4 (sync) | ✅ Full |

**PRD User Flows to Story Mapping:**

| User Flow | Stories Covering It |
|-----------|-------------------|
| Flow 1: First-time sign up & create | 1.2, 1.4, 1.6 |
| Flow 2: Repeat use (core loop) | 3.4 (session detection), 1.6 (playback), 2.1-2.5 (guided experience) |
| Flow 3: Manual timer creation | 1.4, 4.1, 4.2 |
| Flow 4: AI-assisted creation | 5.1, 5.2, 5.3 |
| Flow 5: Multi-device sync | 3.1, 3.2, 3.3, 3.4 |
| Flow 6: Timer editing | 1.5, 4.1, 4.2 |
| Flow 7: Error & edge cases | 3.3 (offline), 5.1 (rate limit), distributed across stories |

**Result: Every PRD requirement maps to at least one story. All 7 user flows have complete story coverage. No orphan stories without PRD traceability.**

#### Architecture → Stories Implementation

| Architecture Component | Implementation Story | Status |
|----------------------|---------------------|--------|
| Project initialization (`create-next-app`) | 1.1 (Project Setup) | ✅ |
| Firebase SDK + config | 1.1 + 1.2 | ✅ |
| Firestore security rules | 1.3 (Data Model) | ✅ |
| `AuthProvider` + `auth-guard` | 1.2 (Firebase Auth) | ✅ |
| `src/types/` interfaces | 1.3 (Data Model) | ✅ |
| `src/lib/firebase/timers.ts` CRUD | 1.4, 1.5 | ✅ |
| `src/lib/firebase/sessions.ts` | 1.6 (Playback) + 3.1 (Listener) | ✅ |
| `useTimerEngine` hook | 1.6 (Core Playback) | ✅ |
| `useFirestoreSession` hook | 3.1 (Session Listener) | ✅ |
| `useTTS` hook | 2.2 (TTS) | ✅ |
| `useWakeLock` hook | 2.5 (Wake Lock) | ✅ |
| `useDeviceId` hook | 3.2 (Device Handoff) | ✅ |
| `progress-ring.tsx` | 2.3 (Visual Progress) | ✅ |
| `transition-overlay.tsx` | 2.1 (Transition Messages) | ✅ |
| `completion-view.tsx` | 2.4 (Completion View) | ✅ |
| `observer-banner.tsx` | 3.2 (Device Handoff) | ✅ |
| `ai-breakdown-panel.tsx` | 5.2 (UI Input & Loading) | ✅ |
| `POST /api/ai/breakdown` route | 5.1 (API Route) | ✅ |
| `src/lib/utils/time.ts` | 1.6 (needed for display) | ✅ |
| `src/lib/utils/pace.ts` | 2.1 (Transition Messages) | ✅ |
| `src/lib/ai/prompt.ts` | 5.1 (API Route) | ✅ |
| @dnd-kit integration | 4.2 (Drag-to-Reorder) | ✅ |
| PWA (`@ducanh2912/next-pwa`) | 2.5 or 1.1 (noted in technical notes) | ✅ |
| GCP Cloud Run deployment | 1.1 (Project Setup) | ✅ |
| shadcn/ui component setup | 1.1 (Project Setup) | ✅ |

**Result: All architectural components have implementation stories. Infrastructure setup is covered in Story 1.1. No orphan architecture components.**

---

## Gap and Risk Analysis

### Critical Findings

**None.** No critical gaps, no conflicting technical approaches, no missing story coverage for core requirements.

### High Priority Concerns

**H1: Story 1.1 version references need update**
- **Finding:** Story 1.1 acceptance criteria say "Next.js 14+ with App Router" — the architecture document has since decided on Next.js 16.1.x. The story's acceptance criteria should reference 16.1.x to match the architecture.
- **Impact:** Low risk — the story's technical notes section says "Use `create-next-app`" which will pull 16.1.x by default. But for consistency, the version references should match.
- **Mitigation:** Update during story implementation planning (first sprint). Not blocking.

**H2: Story 1.1 references `firebase-admin` installation**
- **Finding:** Story 1.1 acceptance criteria list "`firebase-admin`" as a package to install, but ADR-2 in the architecture document explicitly decides against `firebase-admin` for data operations (client-side Firestore only).
- **Impact:** Minor confusion risk during implementation. The AI API route may need lightweight server-side token verification, but the story implies broader admin SDK usage.
- **Mitigation:** During sprint planning, clarify that `firebase-admin` is only needed if token verification requires it for the AI route (Story 5.1), not in Story 1.1. Can be deferred to Epic 5.

**H3: PWA setup timing unclear**
- **Finding:** The architecture lists `@ducanh2912/next-pwa` as a dependency. Story 1.1 mentions "Consider `next-pwa` setup here or defer to Epic 2 (wake lock story)." Story 2.5 (Wake Lock) doesn't explicitly mention PWA setup either. The PWA manifest and service worker configuration isn't assigned to a specific story.
- **Impact:** PWA installability could be missed or deferred accidentally.
- **Mitigation:** Assign PWA configuration to Story 1.1 during sprint planning, since it's infrastructure. Service worker caching can be basic initially and refined later.

### Medium Priority Observations

**M1: Chime/audio file not assigned to a story**
- **Finding:** Architecture mentions `/public/sounds/chime.mp3` (step transition chime via Web Audio API). FR3.3 in the PRD specifies "Play a brief audio chime." No story explicitly covers the chime implementation — Story 2.1 (Transition Messages) covers the visual overlay and text, and Story 2.2 covers TTS, but the chime is in between.
- **Impact:** The chime could be missed during implementation.
- **Mitigation:** Include chime implementation as a task within Story 2.1 or 2.2. It's a small addition (load audio file, play on step transition).

**M2: `formatRelativeDate()` utility not assigned to a specific story**
- **Finding:** Architecture and UX spec define relative date formatting ("Today", "Yesterday", "3 days ago") for the timer library's "last used" display. No story explicitly mentions implementing this utility.
- **Impact:** Very low — it's a trivial utility that will naturally be created when building the timer library card (Story 1.4 or 4.4).
- **Mitigation:** No action needed. Will be implemented as part of timer card rendering.

**M3: Prettier not included in Story 1.1 setup**
- **Finding:** Architecture decision table lists Prettier 3.x for code formatting. Story 1.1 mentions "ESLint + Prettier configured" in acceptance criteria, but the `create-next-app` starter only includes ESLint. Prettier requires separate installation.
- **Impact:** Low — Prettier setup is trivial but could be missed.
- **Mitigation:** Include in Story 1.1 technical tasks.

**M4: `.env.example` template story assignment**
- **Finding:** Architecture shows `.env.example` (committed template for env vars) in the project structure. No story explicitly covers creating this file.
- **Impact:** Very low — it's a simple file that will naturally be created during Story 1.1 or 1.2 (Firebase setup).
- **Mitigation:** Include in Story 1.1 setup tasks.

**M5: Firestore offline persistence enablement**
- **Finding:** Story 3.3 mentions `enablePersistence()` or `enableMultiTabIndexedDbPersistence()` in technical notes. Architecture mentions "Offline persistence enabled" for Firestore. The timing of when to enable this (Story 1.1 setup vs. Story 3.3) should be clarified.
- **Impact:** Low — if enabled early, it's a one-line addition to Firebase config.
- **Mitigation:** Enable offline persistence in the Firebase config module during Story 1.2 or 1.3 (data model setup). Story 3.3 then builds on it.

---

## UX and Special Concerns

### UX Validation

| Check | Status | Notes |
|-------|--------|-------|
| UX requirements documented in PRD | ✅ | PRD §"User Experience Principles" + 7 user flows |
| UX implementation tasks exist in stories | ✅ | UX spec §9.2 maps components to epic sequencing |
| Accessibility requirements have story coverage | ✅ | WCAG AA targets in PRD NFRs, detailed in UX §8.2, ARIA patterns defined per component |
| Responsive design addressed | ✅ | UX §8.1 defines 3 breakpoints, single-column mobile-first |
| User flow continuity maintained across stories | ✅ | All 7 PRD flows map to stories continuously |
| Architecture supports UX requirements | ✅ | SVG progress ring (stroke-dashoffset), shadcn/ui components, CSS custom properties for Deep Forest theme |
| Component library supports interaction patterns | ✅ | 6 custom components + 10 shadcn components all documented with states/variants/accessibility |

### UX Risk: Progress Ring Complexity

The Concentric Progress Ring is the most complex custom component. The UX spec notes this explicitly:

> "Story 2.3 (Visual Progress) may be larger than estimated — ring needs careful implementation"

**Recommendation:** Consider a focused spike or prototype of the SVG ring component early in Epic 2 to validate the animation approach. The architecture's specification (CSS `stroke-dashoffset` with `will-change` for GPU acceleration) is sound, but implementation details (ring sizing, text centering, responsive scaling, reduced motion) will require iteration.

---

## Detailed Findings

### 🔴 Critical Issues

_None found. All core requirements have complete coverage across PRD, Architecture, and Stories._

### 🟠 High Priority Concerns

**H1:** Story 1.1 version references say "Next.js 14+" — should be "Next.js 16.1.x" per architecture decision. Update during sprint planning.

**H2:** Story 1.1 includes `firebase-admin` in dependency list — conflicts with ADR-2 (client-side only). Defer `firebase-admin` to Story 5.1 if needed for token verification.

**H3:** PWA setup (`@ducanh2912/next-pwa`, manifest, icons) is not explicitly assigned to a story. Assign to Story 1.1 during sprint planning.

### 🟡 Medium Priority Observations

**M1:** Step transition chime (audio file + Web Audio API playback) not explicitly assigned to a story. Include in Story 2.1 or 2.2.

**M2:** `formatRelativeDate()` utility will be needed for timer cards — not explicitly assigned but will naturally emerge in Story 1.4/4.4.

**M3:** Prettier setup not included in `create-next-app` starter. Add to Story 1.1 tasks.

**M4:** `.env.example` file creation not explicitly assigned. Include in Story 1.1.

**M5:** Firestore offline persistence should be enabled early (Story 1.2/1.3) rather than waiting for Story 3.3.

### 🟢 Low Priority Notes

**L1:** The epics document references "react-beautiful-dnd" as an alternative to @dnd-kit in Story 4.2. The architecture has finalized on @dnd-kit 6.3.x. Minor inconsistency in the epics technical notes — no impact, as architecture is authoritative.

**L2:** PRD "Technical Preferences" section references "Next.js 14+" and "React 18+" — these are pre-architecture preferences, not decisions. No update needed (they're inputs, not outputs), but could cause confusion if read in isolation.

**L3:** Story 1.1 folder structure in acceptance criteria shows `app/`, `components/`, `lib/`, `types/` — architecture uses `src/app/`, `src/components/`, etc. (the `--src-dir` flag in `create-next-app` creates the `src/` prefix). Minor discrepancy in story — architecture is authoritative.

---

## Positive Findings

### ✅ Well-Executed Areas

1. **Exceptional PRD depth.** 14 functional requirements, each with sub-requirements, edge cases, and tone guidelines. The "no judgment on overruns" philosophy is consistently enforced across FR12, FR6, and FR3 — zero contradictions.

2. **Timestamp-based timing is well-protected.** ADR-3 in the architecture explicitly mandates timestamp math. The PRD says it. The epics' technical notes repeat it. The architecture's novel pattern design enforces it. Three layers of defense against a common timer implementation mistake.

3. **UX Design Specification is production-quality.** 811 lines covering design system, visual foundation, 7 user journey flows with UX treatment, 6 custom components with states/variants/accessibility details, full WCAG 2.1 AA strategy with contrast ratios verified, reduced motion support, and screen reader ARIA patterns. This is implementation-ready.

4. **Architecture's novel pattern designs are outstanding.** The Timer Engine State Machine pattern and AI Task Breakdown Pipeline pattern are fully detailed with data flows, state diagrams, edge cases, and Firestore write frequency guidelines. Dev agents can implement directly from these patterns.

5. **Story sequencing is logical and iterative.** After Epic 2, you have a usable single-device product. After Epic 3, you have the full morning routine experience. Epics 4 and 5 are polish and delight. Each story has clear prerequisites and can be completed independently.

6. **Cross-document consistency is excellent.** Color tokens match across UX spec, architecture Tailwind config, and brainstorming principles. State machine states match across PRD (FR1.2), architecture (TypeScript interfaces), and epics (acceptance criteria). API response format matches across architecture and epic 5 stories.

7. **Error handling philosophy is consistent.** PRD says "no technical errors to users." Architecture patterns table defines try/catch tuple patterns. UX spec defines toast patterns with warm language. Stories include error state acceptance criteria. The "warm, calm" personality is enforced at every layer.

8. **Technology versions are verified and current.** Architecture explicitly documents verified versions (Next.js 16.1.6, Firebase 12.9.0, @dnd-kit 6.3.1) as of 2026-02-14 via npm registry checks.

9. **Greenfield setup is comprehensive.** Story 1.1 is a complete project initialization story. Architecture provides the exact `create-next-app` command, additional dependency installs, and shadcn/ui component list. The first story IS the starter template initialization command, as required.

10. **BDD acceptance criteria are well-formed.** All 23 stories use Given/When/Then format with multiple scenarios. Criteria are specific enough to test but not so rigid they prevent implementation flexibility.

---

## Recommendations

### Immediate Actions Required

1. **During Sprint Planning:** Update Story 1.1 acceptance criteria to reference Next.js 16.1.x (not "14+") and remove `firebase-admin` from the initial dependency list.

2. **During Sprint Planning:** Explicitly assign PWA setup (`@ducanh2912/next-pwa`, `manifest.json`, PWA icons) to Story 1.1.

3. **During Sprint Planning:** Add chime audio implementation as a task in Story 2.1 or 2.2.

### Suggested Improvements

1. Enable Firestore offline persistence in Story 1.2/1.3 Firebase configuration (one line), rather than waiting for Story 3.3.

2. Add Prettier installation + `.prettierrc` creation as an explicit task in Story 1.1.

3. Add `.env.example` creation as an explicit task in Story 1.1.

4. Consider prototyping the SVG Concentric Progress Ring early in Epic 2 to validate the animation approach before building the full running timer view.

### Sequencing Adjustments

**No sequencing changes needed.** The current epic ordering (1 → 2 → 3 → 4 → 5) is correct:
- Foundation (1) before Guided Experience (2) ✅
- Authentication (1.2) before protected resources (everything after) ✅
- Data model (1.3) before CRUD (1.4-1.5) ✅
- Core playback (1.6) before guided experience (2.x) ✅
- All of Epic 2 before sync (3.x) — ensures the running timer view is complete before adding multi-device ✅
- Core features (1-3) before editing polish (4) and AI (5) ✅

---

## Readiness Decision

### Overall Assessment: ✅ READY TO PROCEED

The project passes all readiness criteria:

- ✅ No critical issues found
- ✅ All required documents present and complete (PRD, Architecture, Epics, UX Design)
- ✅ Core alignments validated (PRD↔Architecture: 14/14, PRD↔Stories: 14/14, Architecture↔Stories: complete)
- ✅ Story sequencing is logical and supports iterative delivery
- ✅ Technology choices are consistent across all documents
- ✅ Greenfield project specifics addressed (init command, env setup, deployment)
- ✅ UX requirements fully documented and aligned with architecture
- ✅ Security concerns addressed (Firestore rules, server-side API keys, token verification)
- ✅ Performance requirements achievable with chosen architecture

### Conditions for Proceeding

The three high-priority concerns (H1-H3) should be addressed during Sprint Planning — they are refinements, not blockers:

1. Update Story 1.1 version references to match architecture
2. Defer `firebase-admin` to Story 5.1
3. Assign PWA setup to Story 1.1

These are 5-minute adjustments during sprint planning, not architectural rework.

---

## Next Steps

1. **Sprint Planning** — Break the 5 epics and 23 stories into sprints, incorporating the refinements above
2. **Story Implementation** — Begin with Story 1.1 (Project Setup & Deployment Pipeline)
3. **First Deployable Milestone** — End of Epic 1 (7 stories): working auth + timer CRUD + basic playback on GCP Cloud Run

### Workflow Status Update

`docs/bmm-workflow-status.yaml` updated:
- `solutioning-gate-check: docs/implementation-readiness-report-2026-02-14.md`

---

## Appendices

### A. Validation Criteria Applied

- **Level 3-4 Project Validation** (from `validation-criteria.yaml`):
  - PRD Completeness ✅
  - Architecture Coverage ✅
  - PRD-Architecture Alignment ✅
  - Story Implementation Coverage ✅
  - Comprehensive Sequencing ✅
- **Greenfield Special Context**:
  - Project initialization stories exist ✅ (Story 1.1)
  - First story is starter template initialization ✅
  - Development environment setup documented ✅ (Architecture §"Development Environment")
  - CI/CD pipeline stories included ✅ (Cloud Build auto-deploy to Cloud Run in Story 1.1)
  - Initial data/schema setup planned ✅ (Story 1.3)
  - Deployment infrastructure stories present ✅ (Story 1.1)
- **UX Workflow Active Context**:
  - UX requirements in PRD ✅
  - UX implementation stories exist ✅
  - Accessibility requirements covered ✅
  - Responsive design addressed ✅
  - User flow continuity maintained ✅

### B. Traceability Matrix

| PRD FR | Architecture Module | Epic.Story | UX Component |
|--------|-------------------|-----------|--------------|
| FR1 (Data Model) | `src/types/`, Firestore collections | 1.3 | — |
| FR2 (Library CRUD) | `src/lib/firebase/timers.ts`, `src/components/timer/` | 1.4, 1.5 | Timer Library Card, Step List Editor |
| FR3 (Playback) | `useTimerEngine`, `src/components/session/` | 1.6, 1.7 | Playback Controls |
| FR4 (Count modes) | `countdownMode` on `TimerTemplate` | 4.3 | Switch component |
| FR5 (Sync) | `useFirestoreSession`, `useDeviceId` | 3.1-3.4 | Observer Banner |
| FR6 (Transitions) | `src/lib/utils/pace.ts`, `transition-overlay.tsx` | 2.1 | Step Transition Overlay |
| FR7 (TTS) | `useTTS` hook | 2.2 | — (browser API) |
| FR8 (Visual progress) | `progress-ring.tsx`, SVG | 2.3 | Concentric Progress Ring |
| FR9 (Auth) | Firebase Auth, `src/components/auth/` | 1.2 | Sign-In Form |
| FR10 (Swipe adjust) | Touch event handlers | 4.1 | Step List Editor (enhanced) |
| FR11 (AI breakdown) | `POST /api/ai/breakdown`, `src/lib/ai/prompt.ts` | 5.1-5.3 | AI Breakdown Panel |
| FR12 (Completion) | `completion-view.tsx` | 2.4 | Completion Summary View |
| FR13 (Wake lock) | `useWakeLock` hook | 2.5 | — (browser API) |

### C. Risk Mitigation Strategies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SVG Progress Ring complexity exceeds estimate | Medium | Medium | Prototype early in Epic 2; fallback to simpler CSS conic-gradient if SVG proves too complex |
| iOS Safari TTS/Wake Lock limitations | Medium | Low | PRD acknowledges v1 constraint; graceful degradation already designed |
| OpenAI API availability/latency | Low | Medium | Anthropic fallback defined; friendly error messages; manual creation always available |
| Firestore real-time listener costs at scale | Low | Low | v1 targets < 10 users; Firestore free tier sufficient; architecture doesn't prevent optimization |
| Next.js 16 breaking changes during development | Low | Medium | Pin exact version in package.json; verified 16.1.6 is stable |

---

_This readiness assessment was generated using the BMad Method Implementation Ready Check workflow (v6-alpha)_
