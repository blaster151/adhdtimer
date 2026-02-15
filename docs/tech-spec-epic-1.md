# Epic Technical Specification: Foundation & Core Timer Engine

Date: 2026-02-14
Author: BMad
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the entire project foundation — from bare repository to a functional (single-device) timer app. It delivers the Next.js 16 project scaffold, Firebase Auth (Google + email), the Firestore data model for timer templates and run sessions, full timer library CRUD, core playback (play/pause/skip with timestamp-based timing), and the time extension feature. By the end of Epic 1, a user can sign in, create a timer with named steps, press play, watch it run through steps sequentially, extend time, and save their routines for reuse.

This epic covers PRD features FR1 (data model), FR2 (library CRUD), FR3 (playback + extension), and FR9 (authentication), plus the deployment pipeline. It intentionally excludes guided execution (voice, transitions, progress ring — Epic 2), cross-device sync (Epic 3), polish gestures (Epic 4), and AI breakdown (Epic 5).

## Objectives and Scope

### In Scope

- Next.js 16.1.x project initialization with TypeScript, Tailwind CSS 4, ESLint, Prettier
- shadcn/ui setup with Deep Forest theme tokens
- Firebase project configuration (Auth + Firestore, client-side SDK)
- Firestore security rules (user isolation)
- GCP Cloud Run deployment pipeline (Dockerfile, cloudbuild.yaml, Cloud Build trigger)
- PWA manifest and basic service worker setup (`@ducanh2912/next-pwa`)
- `.env.example` template for environment variables
- Firebase Auth: Google Sign-In + email/password, session persistence, sign-out
- Auth guard for protected routes (`/app/*`)
- TypeScript interfaces for `TimerTemplate`, `Step`, `RunSession`, `SessionStep`
- Firestore schema: `users/{userId}/timers/{timerId}`, `users/{userId}/sessions/{sessionId}`
- Timer CRUD: create, list, edit, delete, duplicate
- Timer library view with empty state, timer cards (name, duration, step count, last used)
- Timer creation/editing form with inline step list
- Core playback: play (create run session), pause, resume, skip, stop
- Timestamp-based timer engine (`useTimerEngine` hook)
- Time extension (+1 min, +5 min buttons)
- Basic running timer view (step name, elapsed time, controls)
- Utility functions: `formatDuration()`, `formatOverrun()`, `formatRelativeDate()`

### Out of Scope

- Contextual transition messages / transition overlay (Epic 2)
- Text-to-speech (Epic 2)
- Concentric progress ring visualization (Epic 2)
- Timer completion summary view (Epic 2)
- Screen wake lock (Epic 2)
- Step transition chime audio (Epic 2)
- Real-time cross-device sync / `onSnapshot` listener (Epic 3)
- Device handoff / observer mode (Epic 3)
- Offline persistence handling (Epic 3)
- Active session detection & routing (Epic 3)
- Swipe-to-adjust duration gesture (Epic 4 — basic +/- buttons used in Epic 1)
- Drag-to-reorder steps (Epic 4 — manual ordering in Epic 1)
- Countdown mode toggle (Epic 4)
- Timer library polish / responsive grid (Epic 4)
- AI task breakdown (Epic 5)

## System Architecture Alignment

Epic 1 touches the broadest set of architectural modules:

| Architecture Module | Epic 1 Usage |
|-------------------|-------------|
| `src/app/layout.tsx` | Root layout with AuthProvider |
| `src/app/page.tsx` | Landing page (public, SSR) |
| `src/app/login/page.tsx` | Sign-in page |
| `src/app/app/layout.tsx` | Auth-guarded layout |
| `src/app/app/page.tsx` | Timer library (home) |
| `src/app/app/timers/new/page.tsx` | Timer creation |
| `src/app/app/timers/[timerId]/edit/page.tsx` | Timer editing |
| `src/app/app/sessions/[sessionId]/page.tsx` | Running timer (basic — enhanced in Epic 2) |
| `src/components/auth/*` | AuthProvider, SignInForm, AuthGuard |
| `src/components/timer/*` | TimerLibrary, TimerCard, TimerForm, StepListEditor, EmptyState |
| `src/components/session/running-timer.tsx` | Basic running timer (controls only, no ring) |
| `src/components/session/playback-controls.tsx` | Pause, Skip, Extend buttons |
| `src/hooks/use-timer-engine.ts` | Core timer state machine |
| `src/hooks/use-auth.ts` | Auth context consumer |
| `src/lib/firebase/config.ts` | Firebase initialization |
| `src/lib/firebase/auth.ts` | Auth helpers |
| `src/lib/firebase/timers.ts` | Timer CRUD |
| `src/lib/firebase/sessions.ts` | Session CRUD (create, update — no real-time listener yet) |
| `src/types/timer.ts` | TimerTemplate, Step |
| `src/types/session.ts` | RunSession, SessionStep, SessionStatus, StepStatus |
| `src/lib/utils/time.ts` | Duration formatting utilities |
| `src/lib/utils/cn.ts` | Tailwind class merge (shadcn) |
| `src/styles/globals.css` | Deep Forest CSS custom properties |

**Constraints from architecture:**
- All app pages are client components (`'use client'`)
- Landing page is a server component (SSR)
- No barrel exports (import directly from file paths)
- Error handling: `{ data, error }` tuple pattern for Firestore ops
- Durations stored as integer seconds in Firestore
- Timer engine: timestamp-based, never tick-counting (ADR-3)
- Union types, not enums (ADR-5)
- `localStorage` for preferences, Firestore for data (ADR-6)

## Detailed Design

### Services and Modules

| Module | Responsibility | Input | Output |
|--------|---------------|-------|--------|
| **AuthProvider** (`components/auth/auth-provider.tsx`) | Wraps app with auth context; listens to `onAuthStateChanged` | Firebase config | `{ user, loading, signIn, signOut }` via context |
| **AuthGuard** (`components/auth/auth-guard.tsx`) | Redirects unauthenticated users to `/login` | Auth context | Renders children or redirects |
| **SignInForm** (`components/auth/sign-in-form.tsx`) | Google + email/password sign-in UI | User input | Calls Firebase Auth, redirects on success |
| **TimerLibrary** (`components/timer/timer-library.tsx`) | Fetches and displays user's timer list | Auth user ID | Rendered timer cards, sorted by `lastUsedAt` |
| **TimerCard** (`components/timer/timer-card.tsx`) | Single timer display with play/edit/delete actions | `TimerTemplate` | Click handlers for play, edit, duplicate, delete |
| **EmptyState** (`components/timer/empty-state.tsx`) | "Create your first timer" prompt when no timers exist | None | CTA button navigating to `/app/timers/new` |
| **TimerForm** (`components/timer/timer-form.tsx`) | Create/edit timer — shared component | Optional `TimerTemplate` (for edit) | Saves to Firestore via `timers.ts` |
| **StepListEditor** (`components/timer/step-list-editor.tsx`) | Inline step management (add, remove, edit name/duration) | `Step[]` | Updated `Step[]` via callback |
| **RunningTimer** (`components/session/running-timer.tsx`) | Orchestrates playback using `useTimerEngine` | `sessionId` param | Timer display + controls |
| **PlaybackControls** (`components/session/playback-controls.tsx`) | Pause, Skip, +1m, +5m, Stop buttons | Engine actions | Button clicks → engine actions |
| **useTimerEngine** (`hooks/use-timer-engine.ts`) | Core state machine: manages step transitions, time calculation, pause/resume/skip/extend | `RunSession` data | `{ currentStep, elapsedTime, actions, sessionStatus }` |
| **useAuth** (`hooks/use-auth.ts`) | Consumes AuthProvider context | None | `{ user, loading, signIn, signOut }` |
| **Firebase timers** (`lib/firebase/timers.ts`) | CRUD operations for timer templates | User ID + timer data | `{ data, error }` tuples |
| **Firebase sessions** (`lib/firebase/sessions.ts`) | Create/update run sessions | Session data | `{ data, error }` tuples |
| **Firebase config** (`lib/firebase/config.ts`) | Initialize Firebase app, export `db` and `auth` | Env vars | Firebase instances |
| **Firebase auth helpers** (`lib/firebase/auth.ts`) | `signInWithGoogle()`, `signInWithEmail()`, `signOutUser()` | Credentials | Auth result or error |
| **Time utils** (`lib/utils/time.ts`) | `formatDuration()`, `formatOverrun()`, `formatRelativeDate()`, `parseDurationInput()` | Numbers/strings | Formatted strings |

### Data Models and Contracts

**TimerTemplate** (Firestore: `users/{userId}/timers/{timerId}`):

```typescript
interface TimerTemplate {
  id: string;
  name: string;
  description?: string;
  totalPlannedDuration: number;    // seconds, auto-calculated from steps
  countdownMode: boolean;          // default false (Epic 4 adds UI toggle)
  steps: Step[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
}

interface Step {
  id: string;                      // crypto.randomUUID()
  name: string;
  plannedDuration: number;         // seconds
  notes?: string;
}
```

**RunSession** (Firestore: `users/{userId}/sessions/{sessionId}`):

```typescript
type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';
type StepStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped';

interface RunSession {
  id: string;
  timerId: string;
  timerName: string;                // denormalized
  status: SessionStatus;
  currentStepIndex: number;
  startedAt: Timestamp;
  pausedAt?: Timestamp;
  completedAt?: Timestamp;
  activeDeviceId: string;          // set to current device in Epic 1, sync in Epic 3
  totalElapsedTime: number;        // seconds
  steps: SessionStep[];
}

interface SessionStep {
  id: string;
  name: string;
  plannedDuration: number;         // seconds (may be extended)
  originalPlannedDuration: number; // seconds (before extensions)
  elapsedTime: number;             // seconds
  status: StepStatus;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}
```

**Firestore Security Rules:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Relationships:**
- `RunSession.timerId` → references `TimerTemplate.id` (not a Firestore reference, just a string ID)
- `RunSession.steps` is a snapshot copied from the template at session creation time (template is not mutated)
- Steps stored as array within document (not subcollection) — sufficient for expected step counts (< 30)

### APIs and Interfaces

**No REST APIs in Epic 1.** All data flows through Firestore client SDK.

**Firebase Auth API surface used:**

| Method | Purpose |
|--------|---------|
| `signInWithPopup(auth, googleProvider)` | Google sign-in |
| `signInWithEmailAndPassword(auth, email, password)` | Email sign-in |
| `createUserWithEmailAndPassword(auth, email, password)` | Email sign-up |
| `signOut(auth)` | Sign out |
| `onAuthStateChanged(auth, callback)` | Auth state listener |

**Firestore operations (`lib/firebase/timers.ts`):**

| Function | Firestore Call | Returns |
|----------|---------------|---------|
| `createTimer(userId, timer)` | `addDoc(collection(db, 'users', userId, 'timers'), timer)` | `{ data: TimerTemplate, error: null }` or `{ data: null, error: Error }` |
| `getTimers(userId)` | `getDocs(query(collection(...), orderBy('lastUsedAt', 'desc')))` | `{ data: TimerTemplate[], error: null }` or `{ data: null, error: Error }` |
| `getTimer(userId, timerId)` | `getDoc(doc(db, 'users', userId, 'timers', timerId))` | `{ data: TimerTemplate, error }` |
| `updateTimer(userId, timerId, data)` | `updateDoc(doc(...), data)` | `{ data: void, error }` |
| `deleteTimer(userId, timerId)` | `deleteDoc(doc(...))` | `{ data: void, error }` |
| `duplicateTimer(userId, timerId)` | `getDoc` + `addDoc` with modified name | `{ data: TimerTemplate, error }` |

**Firestore operations (`lib/firebase/sessions.ts`):**

| Function | Firestore Call | Returns |
|----------|---------------|---------|
| `createSession(userId, template)` | `addDoc(collection(db, 'users', userId, 'sessions'), session)` | `{ data: RunSession, error }` |
| `updateSession(userId, sessionId, data)` | `updateDoc(doc(...), data)` | `{ data: void, error }` |
| `getSession(userId, sessionId)` | `getDoc(doc(...))` | `{ data: RunSession, error }` |

**useTimerEngine hook interface:**

```typescript
interface UseTimerEngineReturn {
  // State
  session: RunSession | null;
  currentStep: SessionStep | null;
  currentStepIndex: number;
  elapsedTime: number;            // current step elapsed (calculated from timestamps)
  totalElapsedTime: number;       // total across all steps
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;

  // Actions
  start: (template: TimerTemplate) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skip: () => Promise<void>;
  extend: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
}
```

### Workflows and Sequencing

**Story Sequencing within Epic 1:**

```
1.1 Project Setup → 1.2 Firebase Auth → 1.3 Data Model → 1.4 CRUD Create/List
                                                              ↓
                                         1.7 Time Extension ← 1.6 Core Playback ← 1.5 CRUD Edit/Delete
```

**Timer Creation Flow (Stories 1.4):**

```
User taps "Create Timer" → TimerForm renders
  → User enters timer name
  → User adds steps (StepListEditor):
      → Each step: name (text input) + duration (number input, default 5 min)
      → Total auto-calculates
  → User taps "Save"
  → createTimer(userId, timer) writes to Firestore
  → Navigate to Timer Library
  → Timer card appears in list
```

**Timer Playback Flow (Stories 1.6-1.7):**

```
User taps "Play" on timer card
  → createSession(userId, template) writes new RunSession to Firestore
    → steps[] copied from template, status set to 'running', step 0 starts
    → activeDeviceId set to current device (crypto.randomUUID in sessionStorage)
  → Navigate to /app/sessions/[sessionId]
  → RunningTimer mounts → useTimerEngine initializes
  → Display loop (setInterval 1000ms for UI refresh):
      → elapsedTime = (Date.now() - step.startedAt) / 1000
      → If elapsedTime >= plannedDuration → auto-advance to next step
      → Update display: step name, elapsed time, controls
  → User actions:
      → Pause → set session.pausedAt, step.status='paused', stop display loop
      → Resume → clear pausedAt, adjust startedAt by pause duration, resume loop
      → Skip → mark step 'skipped', advance to next step immediately
      → Extend (+1m/+5m) → add 60/300 to step.plannedDuration, update Firestore
      → Stop → mark session 'completed', navigate to library
  → Last step completes → session status = 'completed', navigate to library
      (Completion view added in Epic 2)
```

**Pause/Resume Timestamp Math:**

```
// On pause:
session.pausedAt = Timestamp.now()

// On resume:
const pauseDuration = Date.now() - session.pausedAt
currentStep.startedAt = new Timestamp(
  currentStep.startedAt.seconds + Math.floor(pauseDuration / 1000),
  currentStep.startedAt.nanoseconds
)
session.pausedAt = null
```

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|---------------|
| Page load (PWA, cached) | < 2 seconds | Turbopack code-splitting, service worker caching |
| Timer display accuracy | ±500ms visual | Timestamp-based: `Date.now() - startedAt`, UI refresh every ~1s |
| Timer creation save | < 1 second | Single Firestore `addDoc` call |
| Timer library load | < 1 second | Single `getDocs` query, ordered by `lastUsedAt` |
| Auth redirect | < 2 seconds | Firebase Auth with Google popup or email form |

### Security

| Concern | Implementation |
|---------|---------------|
| **Authentication** | Firebase Auth (Google + email/password) |
| **Authorization** | Firestore rules: `request.auth.uid == userId` on all paths |
| **HTTPS** | Enforced by Cloud Run |
| **XSS** | React default JSX escaping, no `dangerouslySetInnerHTML` |
| **API keys** | Firebase client config is safe to expose (secured by Firestore rules). AI keys deferred to Epic 5. |
| **Session** | Firebase Auth manages token refresh automatically |

### Reliability/Availability

| Concern | Strategy |
|---------|----------|
| **Firestore availability** | Google Cloud SLA (99.999% multi-region). Client retries built into SDK. |
| **Auth availability** | Firebase Auth managed service. If down, user sees login error with retry prompt. |
| **Timer accuracy on tab background** | Timestamp-based calculation is inherently resilient — no drift even if tab throttled. Recalculates on foregrounding. |
| **Data loss prevention** | Each state transition writes to Firestore immediately. No "save" batching. |
| **Graceful degradation** | If Firestore write fails, show toast: "Couldn't save. Check your connection." Timer continues locally. |

### Observability

| Signal | Implementation |
|--------|---------------|
| `console.error` | Caught errors in Firestore operations (dev only) |
| `console.warn` | Auth state changes, degraded functionality |
| `console.info` | Session created, session completed (dev only) |
| **No production logging** | v1 is personal use; no monitoring infrastructure needed yet |

## Dependencies and Integrations

### npm Dependencies (installed in Story 1.1)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.x | Framework (via `create-next-app`) |
| `react` | 19.2.x | UI library (ships with Next.js 16) |
| `react-dom` | 19.2.x | React DOM (ships with Next.js 16) |
| `typescript` | 5.x | Language (via `create-next-app`) |
| `tailwindcss` | 4.x | Styling (via `create-next-app`) |
| `firebase` | ^12.9 | Auth + Firestore client SDK |
| `@ducanh2912/next-pwa` | latest | PWA service worker |

### npm Dependencies (deferred — installed later)

| Package | Version | Used In |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.3 | Epic 4 (drag-to-reorder) |
| `@dnd-kit/sortable` | latest | Epic 4 |
| `@dnd-kit/utilities` | latest | Epic 4 |
| `prettier` | ^3 | Story 1.1 (dev dependency) |

### shadcn/ui Components (installed in Story 1.1)

`button`, `input`, `label`, `dialog`, `toast`, `card`, `switch`, `sheet`, `skeleton`, `dropdown-menu`, `separator`, `form`

### External Services

| Service | Used From | Configuration |
|---------|-----------|---------------|
| Firebase Auth | Client-side | `NEXT_PUBLIC_FIREBASE_*` env vars |
| Cloud Firestore | Client-side | Same Firebase project |
| GCP Cloud Run | Deployment | Dockerfile + Cloud Build trigger |
| GCP Cloud Build | CI/CD | `cloudbuild.yaml` + GitHub trigger |

### Integration Points

- **Firebase Auth ↔ Firestore:** Auth `uid` is the path key for all Firestore documents (`users/{uid}/...`). Firestore security rules enforce this relationship.
- **TimerTemplate ↔ RunSession:** Session is created by copying template steps at play-time. Session references `timerId` but does not mutate the template.

## Acceptance Criteria (Authoritative)

Extracted from epics.md Stories 1.1–1.7 and normalized:

| # | Acceptance Criterion | Source Story |
|---|---------------------|-------------|
| AC1 | Next.js 16.1.x project with TypeScript, Tailwind CSS 4, App Router, ESLint, Prettier is initialized and builds | 1.1 |
| AC2 | Firebase SDK is installed and configured with environment variables | 1.1 |
| AC3 | shadcn/ui is initialized with Deep Forest theme tokens in `globals.css` | 1.1 |
| AC4 | Project deploys to GCP Cloud Run via Cloud Build on push to `master` | 1.1 |
| AC5 | A "Hello World" landing page renders at `/` | 1.1 |
| AC6 | PWA manifest exists and app is installable | 1.1 |
| AC7 | Google Sign-In redirects to OAuth and returns to timer library on success | 1.2 |
| AC8 | Email/password sign-in creates account or signs in and redirects to timer library | 1.2 |
| AC9 | Auth session persists across page refresh and new tabs | 1.2 |
| AC10 | Sign-out returns user to landing page | 1.2 |
| AC11 | Unauthenticated access to `/app/*` redirects to `/login` | 1.2 |
| AC12 | Firestore collections `users/{userId}/timers` and `users/{userId}/sessions` accept typed documents | 1.3 |
| AC13 | TypeScript interfaces for `TimerTemplate`, `Step`, `RunSession`, `SessionStep` are defined in `src/types/` | 1.3 |
| AC14 | Firestore security rules enforce user isolation (`auth.uid == userId`) | 1.3 |
| AC15 | Empty timer library shows "Create your first timer" prompt with CTA | 1.4 |
| AC16 | Timer creation form accepts timer name + ordered steps (name + duration each) with at least 1 step required | 1.4 |
| AC17 | Total duration auto-calculates from step durations | 1.4 |
| AC18 | Saved timer appears in library showing name, duration, step count, last used | 1.4 |
| AC19 | Edit form pre-populates with existing timer data | 1.5 |
| AC20 | Editing timer name/steps/durations persists to Firestore | 1.5 |
| AC21 | Delete timer shows confirmation dialog then removes from Firestore | 1.5 |
| AC22 | Duplicate creates a copy with "(copy)" suffix | 1.5 |
| AC23 | Tapping "Play" creates a new RunSession and navigates to running timer view | 1.6 |
| AC24 | Running timer shows current step name and elapsed time counting up | 1.6 |
| AC25 | Pause stops elapsed time; Resume continues from paused state | 1.6 |
| AC26 | Skip marks current step `skipped` and advances to next step with no confirmation | 1.6 |
| AC27 | When step elapsed time reaches planned duration, auto-advance to next step | 1.6 |
| AC28 | Last step completing sets session status to `completed` | 1.6 |
| AC29 | Stop marks session `completed` (early) and returns to library | 1.6 |
| AC30 | +1 min button adds 60 seconds to current step's `plannedDuration` immediately | 1.7 |
| AC31 | +5 min button adds 300 seconds to current step's `plannedDuration` immediately | 1.7 |
| AC32 | No confirmation dialog or judgment language on extension | 1.7 |
| AC33 | Extension updates Firestore session document | 1.7 |

## Traceability Mapping

| AC | Spec Section | Component(s) / Module(s) | Test Approach |
|----|-------------|-------------------------|---------------|
| AC1-AC6 | Project Setup | `next.config.ts`, `globals.css`, `Dockerfile`, `cloudbuild.yaml`, `manifest.json` | Build succeeds, deploy succeeds, PWA audit |
| AC7-AC8 | Auth | `AuthProvider`, `SignInForm`, `lib/firebase/auth.ts` | Component test: mock Firebase Auth |
| AC9-AC10 | Auth | `AuthProvider`, `useAuth` | Integration test: auth state persistence |
| AC11 | Auth | `AuthGuard` | Component test: redirect on no user |
| AC12-AC14 | Data Model | `types/*.ts`, `firestore.rules` | Unit test: type checks; rules test: security |
| AC15 | Library | `EmptyState` | Component test: renders when timers=[] |
| AC16-AC17 | CRUD | `TimerForm`, `StepListEditor` | Component test: form validation, auto-calc |
| AC18 | Library | `TimerLibrary`, `TimerCard` | Component test: renders timer data |
| AC19-AC22 | CRUD | `TimerForm`, `lib/firebase/timers.ts` | Integration test: edit/delete/duplicate flows |
| AC23-AC29 | Playback | `useTimerEngine`, `RunningTimer`, `PlaybackControls` | Unit test: state machine transitions; component test: button actions |
| AC30-AC33 | Extension | `useTimerEngine.extend()`, `PlaybackControls` | Unit test: duration math; component test: button behavior |

## Risks, Assumptions, Open Questions

| Type | Item | Mitigation / Next Step |
|------|------|----------------------|
| **Assumption** | `create-next-app` 16.1.x provides a working TypeScript + Tailwind + App Router starter | Verified via npm registry 2026-02-14 — correct |
| **Assumption** | Firebase client SDK v12.9 works with Next.js 16 (no SSR conflicts for client-only usage) | All Firebase code runs in `'use client'` components — no SSR issue expected |
| **Assumption** | GCP Cloud Run can serve a containerized Next.js app with SSR + API routes | Well-documented pattern; Next.js standalone output mode in Dockerfile |
| **Risk** | Cloud Build setup may take longer than expected for first-time GCP users | Mitigation: provide complete `cloudbuild.yaml` and `Dockerfile` in Story 1.1; document setup steps |
| **Risk** | Timer engine state machine complexity — many transitions to handle correctly | Mitigation: comprehensive unit tests for `useTimerEngine`; timestamp math is deterministic |
| **Risk** | Firestore security rules may be too permissive or too restrictive | Mitigation: test rules with Firebase emulator in Story 1.3 |
| **Open Question** | Should Story 1.6 include a minimal step list during playback (showing completed/upcoming steps) or defer to Epic 2? | Recommendation: include basic step list in 1.6 — it's valuable for usability even without the progress ring. Show step names with status indicators. |
| **Open Question** | PWA setup — install `@ducanh2912/next-pwa` in Story 1.1 or defer to Story 2.5? | Recommendation: Story 1.1, since it's infrastructure. Just basic manifest + service worker. |

## Test Strategy Summary

| Layer | Tool | Coverage |
|-------|------|---------|
| **Unit** | Vitest | `time.ts` utilities (formatDuration, formatOverrun, parseDurationInput), `useTimerEngine` state machine (all transitions, pause/resume math, extend, edge cases) |
| **Component** | Vitest + React Testing Library | `SignInForm`, `TimerForm`, `StepListEditor`, `TimerCard`, `EmptyState`, `PlaybackControls`, `AuthGuard` |
| **Integration** | Vitest + Firebase emulator (or mocked SDK) | Timer CRUD flow (create → read → edit → delete), Auth flow (sign in → protected route → sign out) |
| **Manual** | Developer testing | Full end-to-end: sign in → create timer → play → pause → resume → skip → extend → complete. Verify on mobile Chrome + desktop. |

**Test file co-location:**
- `src/lib/utils/time.test.ts`
- `src/hooks/use-timer-engine.test.ts`
- `src/components/timer/timer-form.test.tsx`
- `src/components/timer/timer-card.test.tsx`
- `src/components/auth/auth-guard.test.tsx`

**Critical test scenarios for `useTimerEngine`:**
1. Start → step 0 becomes running, elapsed counts up
2. Pause → elapsed freezes; Resume → elapsed continues correctly (timestamp math)
3. Skip → step marked skipped, next step starts immediately
4. Auto-advance → step elapsed reaches planned → next step starts
5. Extend → planned duration increases, no reset of elapsed
6. Last step completes → session status = completed
7. Stop → session status = completed (early stop)
8. Multiple pause/resume cycles → elapsed remains accurate
