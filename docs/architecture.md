# ADHD Timer — Architecture

## Executive Summary

ADHD Timer is a Next.js 16 PWA deployed on GCP Cloud Run, using Firebase (Auth + Firestore) for authentication and real-time data, with a custom client-side timer engine. The architecture prioritizes instant interaction (2-tap play), real-time cross-device sync via Firestore listeners, and AI-powered task breakdown via server-side Next.js API routes calling an LLM. The UI is built with shadcn/ui + Tailwind CSS in a Deep Forest dark theme.

## Project Initialization

First implementation story should execute:

```bash
npx create-next-app@latest adhdtimer --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"
```

**Verified:** `create-next-app` ships with Next.js 16.1.6 (latest stable as of 2026-02-14).

This establishes:
- Next.js 16 with App Router (provided by starter)
- TypeScript 5.x (provided by starter)
- Tailwind CSS 4.x (provided by starter)
- ESLint (provided by starter)
- Turbopack (default bundler in Next.js 16)
- `src/` directory structure (provided by starter)

**After starter, install additional dependencies:**

```bash
npm install firebase@^12.9 @dnd-kit/core@^6.3 @dnd-kit/sortable @dnd-kit/utilities
npx shadcn@latest init
```

**shadcn/ui components to install:**

```bash
npx shadcn@latest add button input label dialog toast card switch sheet skeleton dropdown-menu separator form
```

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
|----------|----------|---------|---------------|-----------|
| Framework | Next.js (App Router) | 16.1.x | All | PRD specifies; SSR for landing, CSR for app; GCP Cloud Run compatible |
| Language | TypeScript | 5.x | All | PROVIDED BY STARTER; type safety for timer state machine |
| UI Library | React | 19.2 | All | PROVIDED BY STARTER (ships with Next.js 16) |
| Styling | Tailwind CSS | 4.x | All | PROVIDED BY STARTER; utility-first, dark mode built-in |
| Component Library | shadcn/ui (Radix primitives) | latest | 1, 2, 4 | Accessible, zero lock-in, Next.js compatible |
| Database | Cloud Firestore | via Firebase 12.9.x | All | Real-time listeners for sync; offline persistence; scales automatically |
| Authentication | Firebase Auth | via Firebase 12.9.x | 1, 3 | Google + email/password; pairs with Firestore security rules |
| Real-Time Sync | Firestore `onSnapshot` | via Firebase 12.9.x | 3 | Native real-time listeners; no separate WebSocket needed |
| AI Integration | OpenAI API (GPT-4o-mini) | latest | 5 | Structured JSON output; cost-effective for task breakdown |
| AI Fallback | Anthropic API (Claude) | latest | 5 | Fallback if OpenAI is unavailable |
| TTS | Web Speech API | Browser native | 2 | Free, built-in, no external dependency |
| Wake Lock | Screen Wake Lock API | Browser native | 2 | Keeps screen on during timer; graceful degradation |
| Drag & Drop | @dnd-kit | 6.3.x | 4 | Lightweight, React-native, accessible, touch-friendly |
| Deployment | GCP Cloud Run | N/A | All | User's existing GCP account; pairs naturally with Firebase; containerized Next.js |
| Bundler | Turbopack | Built into Next.js 16 | All | PROVIDED BY STARTER; default in Next.js 16 |
| Linting | ESLint | 9.x | All | PROVIDED BY STARTER |
| Formatting | Prettier | 3.x | All | Code consistency across agents |
| PWA | `@ducanh2912/next-pwa` | latest | 2 | Service worker for installability; Workbox-based |

---

## Project Structure

```
adhdtimer/
├── .env.local                          # Firebase config, AI API keys (gitignored)
├── .env.example                        # Template for env vars (committed)
├── .eslintrc.json                      # ESLint config
├── .prettierrc                         # Prettier config
├── Dockerfile                          # Multi-stage Next.js production build
├── cloudbuild.yaml                     # Cloud Build CI/CD pipeline config
├── .dockerignore                       # Exclude node_modules, .next, docs, etc.
├── next.config.ts                      # Next.js + PWA config
├── tailwind.config.ts                  # Tailwind with Deep Forest theme tokens
├── tsconfig.json                       # TypeScript config
├── components.json                     # shadcn/ui config
├── package.json
├── public/
│   ├── manifest.json                   # PWA manifest
│   ├── icons/                          # PWA icons (192, 512)
│   └── sounds/
│       └── chime.mp3                   # Step transition chime (gentle, short)
├── docs/                               # BMad Method docs (not deployed)
│   ├── PRD.md
│   ├── epics.md
│   ├── architecture.md
│   ├── ux-design-specification.md
│   └── ...
└── src/
    ├── app/
    │   ├── layout.tsx                  # Root layout: AuthProvider, ThemeProvider, Toaster
    │   ├── page.tsx                    # Landing page (public, SSR)
    │   ├── login/
    │   │   └── page.tsx               # Sign in page (Google + email)
    │   ├── app/
    │   │   ├── layout.tsx             # Authenticated layout: auth guard, session check
    │   │   ├── page.tsx               # Timer Library (home after auth)
    │   │   ├── timers/
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx       # Timer creation
    │   │   │   └── [timerId]/
    │   │   │       └── edit/
    │   │   │           └── page.tsx   # Timer editing (same component as new)
    │   │   └── sessions/
    │   │       └── [sessionId]/
    │   │           └── page.tsx       # Running timer view
    │   └── api/
    │       └── ai/
    │           └── breakdown/
    │               └── route.ts       # AI task breakdown (POST, server-side)
    ├── components/
    │   ├── ui/                        # shadcn/ui components (auto-generated)
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── dialog.tsx
    │   │   ├── toast.tsx
    │   │   ├── card.tsx
    │   │   ├── switch.tsx
    │   │   ├── sheet.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   └── ...
    │   ├── auth/
    │   │   ├── auth-provider.tsx       # AuthContext provider, onAuthStateChanged
    │   │   ├── sign-in-form.tsx        # Google + email sign-in
    │   │   └── auth-guard.tsx          # Redirect to /login if not authenticated
    │   ├── timer/
    │   │   ├── timer-library.tsx       # Timer card list with play buttons
    │   │   ├── timer-card.tsx          # Individual timer card
    │   │   ├── timer-form.tsx          # Create/edit form (shared component)
    │   │   ├── step-list-editor.tsx    # Ordered step list with add/remove/edit
    │   │   ├── ai-breakdown-panel.tsx  # AI input + loading + result
    │   │   └── empty-state.tsx         # "Create your first timer" prompt
    │   ├── session/
    │   │   ├── running-timer.tsx       # Main running timer orchestrator
    │   │   ├── progress-ring.tsx       # Concentric SVG progress rings (custom)
    │   │   ├── step-dots.tsx           # Step position indicator dots
    │   │   ├── playback-controls.tsx   # Pause, skip, extend buttons
    │   │   ├── transition-overlay.tsx  # Step transition message overlay
    │   │   ├── completion-view.tsx     # Timer completion summary
    │   │   └── observer-banner.tsx     # "Controlled from another device" + Take Control
    │   └── layout/
    │       ├── header.tsx              # App header with settings access
    │       └── settings-sheet.tsx      # Bottom drawer settings panel
    ├── hooks/
    │   ├── use-timer-engine.ts         # Core timer state machine
    │   ├── use-firestore-session.ts    # Real-time session listener
    │   ├── use-tts.ts                  # Text-to-speech with browser detection
    │   ├── use-wake-lock.ts            # Screen Wake Lock API wrapper
    │   ├── use-device-id.ts            # Unique device ID (sessionStorage)
    │   └── use-auth.ts                 # Auth context consumer hook
    ├── lib/
    │   ├── firebase/
    │   │   ├── config.ts              # Firebase app initialization
    │   │   ├── auth.ts                # Auth helper functions
    │   │   ├── timers.ts              # Timer CRUD operations (Firestore)
    │   │   └── sessions.ts            # Session CRUD + real-time listeners
    │   ├── ai/
    │   │   └── prompt.ts              # AI prompt template for task breakdown
    │   └── utils/
    │       ├── time.ts                # Duration formatting, parsing, calculations
    │       ├── pace.ts                # Pace calculation (ahead/behind/on-track)
    │       └── cn.ts                  # Tailwind class merge utility (shadcn)
    ├── types/
    │   ├── timer.ts                   # TimerTemplate, Step interfaces
    │   ├── session.ts                 # RunSession, SessionStep, SessionStatus
    │   └── user.ts                    # User preferences
    └── styles/
        └── globals.css                # Tailwind base + Deep Forest CSS custom properties
```

---

## Epic to Architecture Mapping

| Epic | Primary Modules | Key Components | Infrastructure |
|------|----------------|----------------|----------------|
| **1: Foundation** | `src/app/`, `src/lib/firebase/`, `src/types/`, `src/components/auth/`, `src/components/timer/` | AuthProvider, TimerForm, StepListEditor, TimerLibrary, TimerCard | Firebase project, GCP Cloud Run deployment, Firestore security rules |
| **2: Guided Execution** | `src/components/session/`, `src/hooks/` | ProgressRing, TransitionOverlay, CompletionView, PlaybackControls | Web Speech API, Wake Lock API, Web Audio API (chime) |
| **3: Real-Time Sync** | `src/hooks/use-firestore-session.ts`, `src/components/session/observer-banner.tsx` | ObserverBanner, FirestoreSession hook | Firestore real-time listeners, `onSnapshot` |
| **4: Editing & Polish** | `src/components/timer/step-list-editor.tsx` (enhanced) | StepListEditor (swipe + drag), CountdownToggle | @dnd-kit, touch event handlers |
| **5: AI Breakdown** | `src/app/api/ai/`, `src/components/timer/ai-breakdown-panel.tsx`, `src/lib/ai/` | AIBreakdownPanel, API route | OpenAI/Anthropic API, rate limiting in Firestore |

---

## Technology Stack Details

### Core Technologies

#### Next.js 16.1.x

- **App Router** for file-based routing
- **Server Components** for landing page (SEO, fast initial load)
- **Client Components** for all interactive app pages (`'use client'` directive)
- **API Routes** for AI breakdown endpoint (`app/api/ai/breakdown/route.ts`)
- **Turbopack** as default bundler (stable in Next.js 16)
- All app pages under `src/app/app/` are client-rendered (timer state is entirely client-side)

#### Firebase 12.9.x (Client SDK)

- **Firebase Auth**: Client-side only. `onAuthStateChanged` listener in AuthProvider.
- **Cloud Firestore**: Client-side SDK with real-time listeners (`onSnapshot`). Offline persistence enabled.
- **No `firebase-admin`** needed in v1 — all Firestore access is client-side through security rules. The API route for AI uses Firebase Auth token verification via the client SDK's `getIdToken()` + manual JWT verification, or a lightweight admin SDK if needed solely for token verification.
- **Security Rules**: Row-level security — users can only read/write documents under their own `users/{userId}/` path.

#### Firestore Data Architecture

**Collection: `users/{userId}/timers/{timerId}`** — Timer Templates

```typescript
interface TimerTemplate {
  id: string;
  name: string;
  description?: string;
  totalPlannedDuration: number;  // seconds, auto-calculated
  countdownMode: boolean;        // default false
  steps: Step[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
}

interface Step {
  id: string;          // nanoid or crypto.randomUUID()
  name: string;
  plannedDuration: number;  // seconds
  notes?: string;
}
```

**Collection: `users/{userId}/sessions/{sessionId}`** — Run Sessions

```typescript
interface RunSession {
  id: string;
  timerId: string;               // reference to source template
  timerName: string;             // denormalized for display
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentStepIndex: number;
  startedAt: Timestamp;
  pausedAt?: Timestamp;
  completedAt?: Timestamp;
  activeDeviceId: string;        // which device controls
  totalElapsedTime: number;      // seconds (calculated from timestamps)
  steps: SessionStep[];
}

interface SessionStep {
  id: string;
  name: string;
  plannedDuration: number;       // seconds (may be extended)
  originalPlannedDuration: number; // seconds (before extensions)
  elapsedTime: number;           // seconds
  status: 'pending' | 'running' | 'paused' | 'completed' | 'skipped';
  startedAt?: Timestamp;
  completedAt?: Timestamp;
}
```

**Collection: `users/{userId}/aiUsage/{dateString}`** — AI Rate Limiting

```typescript
interface AIUsageRecord {
  count: number;        // incremented per AI call
  date: string;         // YYYY-MM-DD
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

### Integration Points

#### AI Task Breakdown (Server-Side)

- **Endpoint:** `POST /api/ai/breakdown`
- **Auth:** Verify Firebase ID token from `Authorization: Bearer <token>` header
- **LLM:** OpenAI `gpt-4o-mini` (primary) with Anthropic Claude as fallback
- **API keys:** `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in environment variables (server-side only, never exposed to client)
- **Rate limiting:** Read/increment `users/{userId}/aiUsage/{today}` document. Reject if `count >= 20`.
- **Response format:** JSON with `steps[]` array

#### Text-to-Speech (Client-Side)

- **API:** `window.speechSynthesis` (Web Speech API)
- **Audio unlock:** First `speechSynthesis.speak()` call triggered by the user's "Play" button tap
- **Fallback:** If `speechSynthesis` is undefined or speaks fails, degrade silently to visual-only
- **Settings:** TTS enable/disable stored in `localStorage` (not Firestore — no need to sync this)

#### Screen Wake Lock (Client-Side)

- **API:** `navigator.wakeLock.request('screen')`
- **Lifecycle:** Acquire on timer start/resume, release on pause/complete/navigation
- **Fallback:** If API unavailable, no action — screen behaves normally

#### Step Transition Chime (Client-Side)

- **API:** Web Audio API or `<audio>` element
- **Sound:** Single gentle chime, pre-loaded as `/public/sounds/chime.mp3`
- **Trigger:** Play before TTS at each step transition

---

## Novel Pattern Designs

### Timer Engine State Machine

**Pattern Name:** Client-Side Timer Engine with Firestore Sync

**Purpose:** Manage the complex timer state machine (idle → running → paused → completed, with step sub-states) in client-side React state, while keeping Firestore as the source of truth for cross-device sync.

**Components:**

| Component | Responsibility |
|-----------|---------------|
| `useTimerEngine` hook | Core state machine: manages step transitions, time calculations, pause/resume, skip, extend |
| `useFirestoreSession` hook | Reads/writes RunSession document; provides real-time listener for observer mode |
| `useDeviceId` hook | Generates and stores unique device ID in `sessionStorage` |
| `RunningTimer` component | Orchestrates engine + UI, determines controller vs. observer mode |

**Data Flow:**

```
[User taps Play on TimerCard]
  → TimerForm creates RunSession doc in Firestore (status: running, step 0)
  → Navigate to /app/sessions/[sessionId]
  → RunningTimer mounts
    → useDeviceId returns device ID
    → useFirestoreSession subscribes to session doc via onSnapshot
    → Check: activeDeviceId === myDeviceId?
      → YES (Controller Mode):
          → useTimerEngine manages local state
          → Every state change (tick update, step advance, pause, skip, extend)
            writes back to Firestore session doc
          → useTTS speaks step transitions
          → useWakeLock keeps screen on
      → NO (Observer Mode):
          → useTimerEngine is passive (reads from Firestore snapshot, doesn't write)
          → Display mirrors Firestore state
          → Controls disabled, "Take Control" button shown
          → Tap "Take Control" → write activeDeviceId = myDeviceId
            → Becomes controller, other device becomes observer
```

**Time Tracking Implementation:**

```
# CRITICAL: Never count ticks. Always use timestamps.

elapsedTime = (Date.now() - step.startedAt) / 1000

# If paused, use pausedAt instead of Date.now()
elapsedTime = (session.pausedAt - step.startedAt) / 1000

# Total elapsed = sum of completed step elapsed times + current step elapsed
```

**Firestore Write Frequency:**
- Step transitions: immediate write (user-visible state change)
- Pause/resume: immediate write
- Extend: immediate write
- Elapsed time updates (tick display): **DO NOT write every second.** Calculate from timestamps. Only write elapsed time on state transitions (pause, step complete, etc.)

**Edge Cases:**
- Browser tab goes to background → timer continues when foregrounded (timestamp-based)
- Internet drops → local timer continues; writes queue in Firestore offline cache; sync on reconnect
- Stale session (>24h old) → show in running view, user can Stop to clear
- Two devices both offline → last writer wins on reconnect (acceptable for personal-use v1)

---

### AI Task Breakdown Pipeline

**Pattern Name:** Server-Side AI Pipeline with Client Hydration

**Purpose:** Securely call LLM API from server, return structured timer steps, hydrate into client-side timer creation form.

**Data Flow:**

```
[User types "make pasta carbonara" in AIBreakdownPanel]
  → Client POST to /api/ai/breakdown
    → Headers: Authorization: Bearer <Firebase ID token>
    → Body: { taskName: "make pasta carbonara" }
  → API Route:
    → Verify Firebase token (reject 401 if invalid)
    → Check rate limit: read aiUsage doc for today
      → If count >= 20: return 429 with friendly message
    → Call OpenAI gpt-4o-mini with structured prompt
      → If OpenAI fails: try Anthropic Claude as fallback
      → If both fail: return 503 with friendly message
    → Parse JSON response
    → Increment aiUsage counter
    → Return 200: { timerName, steps: [{ name, durationMinutes }] }
  → Client receives response
    → Populate TimerForm with generated steps
    → User edits, then saves (normal timer CRUD flow)
```

**Prompt Template:**

```
You are a practical task breakdown assistant. Break the following task into
sequential steps that someone would follow to execute it.

Task: "${taskName}"

Rules:
- Return 3-12 steps (most tasks need 4-8)
- Each step should be a concrete, actionable action
- Estimate realistic durations in minutes (minimum 1 minute per step)
- Steps should be sequential (do step 1, then step 2, etc.)
- Use simple, clear language
- Include any waiting/passive steps (e.g., "Wait for water to boil")

Return ONLY valid JSON in this exact format:
{
  "timerName": "Human-readable title for this timer",
  "steps": [
    { "name": "Step description", "durationMinutes": 5 },
    ...
  ]
}
```

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents.

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| **Files** | kebab-case | `timer-card.tsx`, `use-timer-engine.ts`, `step-list-editor.tsx` |
| **React components** | PascalCase | `TimerCard`, `ProgressRing`, `StepListEditor` |
| **Hooks** | camelCase with `use` prefix | `useTimerEngine`, `useTTS`, `useWakeLock` |
| **TypeScript interfaces** | PascalCase | `TimerTemplate`, `RunSession`, `SessionStep` |
| **TypeScript enums** | PascalCase (members: PascalCase) | Don't use enums; use union types: `'running' \| 'paused'` |
| **Firestore collections** | camelCase | `timers`, `sessions`, `aiUsage` |
| **Firestore fields** | camelCase | `plannedDuration`, `currentStepIndex`, `activeDeviceId` |
| **CSS classes** | Tailwind utilities | `bg-surface`, `text-primary`, `rounded-lg` |
| **API routes** | kebab-case paths | `/api/ai/breakdown` |
| **Environment variables** | SCREAMING_SNAKE | `OPENAI_API_KEY`, `NEXT_PUBLIC_FIREBASE_API_KEY` |

### Code Organization

| Pattern | Rule |
|---------|------|
| **Component files** | One component per file. Named export matching filename. |
| **Hook files** | One hook per file. Named export matching filename. |
| **Barrel exports** | No barrel (index.ts) files. Import directly from component path. |
| **Client components** | Add `'use client'` directive at top of file if it uses hooks, state, or browser APIs. |
| **Server components** | Default in App Router. Only landing page and layout shells are server components. |
| **Shared types** | All in `src/types/`. Import as `import type { TimerTemplate } from '@/types/timer'`. |
| **Firebase functions** | All in `src/lib/firebase/`. Thin wrappers around Firestore SDK calls. |
| **Utility functions** | In `src/lib/utils/`. Pure functions, fully typed, no side effects. |

### Error Handling

| Context | Pattern | Example |
|---------|---------|---------|
| **Firestore operations** | try/catch, return `{ data, error }` tuple | `const { data, error } = await createTimer(timer)` |
| **API routes** | try/catch, return appropriate HTTP status + JSON body | `return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })` |
| **AI API calls** | try primary → catch → try fallback → catch → return 503 | OpenAI fails → try Anthropic → both fail → 503 |
| **Browser APIs (TTS, Wake Lock)** | Feature-detect first, wrap in try/catch, fail silently | `if ('wakeLock' in navigator) { try { ... } catch {} }` |
| **Auth errors** | Redirect to /login | `onAuthStateChanged` + auth guard component |
| **Firestore listener errors** | Log to console, show toast if user-facing | `onSnapshot(ref, onNext, onError)` |
| **User-facing errors** | Toast with warm, non-technical language | "Couldn't save your timer. Check your connection and try again." |

**Error message tone guidelines:**
- Never show technical error messages to users
- Never use alarming language ("Error!", "Failed!", "Uh oh!")
- Always suggest a next action ("try again", "check your connection", "create manually")
- Match the product's warm, calm personality

### Logging Strategy

- **Development only** in v1 — no production logging infrastructure
- Use `console.error` for caught errors that need developer attention
- Use `console.warn` for degraded functionality (TTS unavailable, Wake Lock unsupported)
- Use `console.info` for significant state changes (session created, device handoff)
- **Never log** Firestore tick-level updates, user data, or API keys
- Wrap all console calls: agents should use them sparingly, only for debugging significant events

### Testing Strategy

| Layer | Tool | Pattern |
|-------|------|---------|
| **Unit tests** | Vitest | Utility functions (`time.ts`, `pace.ts`), state machine logic |
| **Component tests** | Vitest + React Testing Library | Component rendering, user interactions |
| **Integration tests** | Vitest + MSW (Mock Service Worker) | API route testing, Firebase mocking |
| **E2E tests** | Playwright (future — not v1 MVP) | Critical flows (create timer, play timer) |

**Test file location:** Co-located with source files.

| Source | Test |
|--------|------|
| `src/lib/utils/time.ts` | `src/lib/utils/time.test.ts` |
| `src/hooks/use-timer-engine.ts` | `src/hooks/use-timer-engine.test.ts` |
| `src/components/timer/timer-card.tsx` | `src/components/timer/timer-card.test.tsx` |

---

## Consistency Rules

### Date/Time Handling

| Context | Format | Library |
|---------|--------|---------|
| Firestore timestamps | `Timestamp` (Firestore native) | Firebase SDK |
| Duration storage | Integer seconds | None — raw math |
| Duration display (< 60min) | `M:SS` (e.g., "5:23") | Custom `formatDuration()` in `time.ts` |
| Duration display (≥ 60min) | `H:MM:SS` (e.g., "1:05:23") | Custom `formatDuration()` in `time.ts` |
| Overrun display | `+M:SS over` (e.g., "+0:30 over") | Custom `formatOverrun()` in `time.ts` |
| "Last used" timestamps | Relative: "Today", "Yesterday", "3 days ago", "Jan 15" | Custom `formatRelativeDate()` in `time.ts` |
| Timer tick calculation | `Date.now() - startedAt` (never setInterval counting) | None — raw math |
| Timezone | Not applicable — all durations, no clock times | N/A |

**No date library needed** — all dates are relative or Firestore-native. Raw `Date` and custom formatters suffice.

### API Response Format

**AI Breakdown endpoint:**

```typescript
// Success (200)
{
  timerName: string;
  steps: Array<{
    name: string;
    durationMinutes: number;
  }>;
}

// Error (401 | 429 | 503)
{
  error: string;  // User-friendly message
}
```

This is the only API route in v1. All other data flows through Firestore directly.

### UI Consistency

| Element | Convention |
|---------|-----------|
| **Primary button** | Solid `bg-primary text-background`, one per screen maximum |
| **Destructive action** | Always requires confirmation dialog |
| **Loading states** | Skeleton shimmer matching target shape |
| **Empty states** | Warm text + clear CTA, never blank |
| **Toasts** | Top-center, auto-dismiss 3-4s, max 2 stacked |
| **Never during running timer** | No toasts, no modals, no interruptions |
| **Touch targets** | 48px minimum on all interactive elements |
| **Border radius** | `rounded-sm` (8px) inputs, `rounded-md` (12px) buttons, `rounded-lg` (16px) cards, `rounded-full` circles |

---

## Security Architecture

| Concern | Implementation |
|---------|---------------|
| **Authentication** | Firebase Auth (Google OAuth + email/password), client-side SDK |
| **Authorization** | Firestore security rules: `request.auth.uid == userId` on all user data paths |
| **API key protection** | `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in server-side env vars only (not `NEXT_PUBLIC_`) |
| **AI endpoint auth** | Verify Firebase ID token in API route before processing |
| **XSS prevention** | React's default JSX escaping; no `dangerouslySetInnerHTML` |
| **HTTPS** | Enforced by Cloud Run (default) |
| **CORS** | Not applicable — same-origin API routes |
| **Rate limiting** | AI endpoint: 20 calls/day/user via Firestore counter |
| **Session persistence** | Firebase Auth handles token refresh; sessions persist across browser restarts |

---

## Performance Considerations

| Concern | Strategy |
|---------|----------|
| **Page load (PWA cached)** | < 2 seconds target; Turbopack optimized bundles; service worker caching |
| **Timer accuracy** | Timestamp-based (`Date.now() - startedAt`), never tick-counting; display updates via `requestAnimationFrame` or 1s interval |
| **Firestore reads** | Real-time listener on active session only; timer library loads once on mount; no polling |
| **Firestore writes** | Batched on state transitions only; NOT on every tick; extend/skip/pause write immediately |
| **Bundle size** | Tree-shake Firebase (modular SDK v9+); code-split per route; shadcn components are local copies |
| **SVG ring animation** | CSS `stroke-dashoffset` transition; GPU-accelerated; `will-change: stroke-dashoffset` |
| **TTS latency** | Pre-construct utterance; speak immediately on step transition |
| **AI response** | Loading skeleton during API call; < 10s target |
| **Reduced motion** | Respect `prefers-reduced-motion`: disable ring animation, breathing effects, fade transitions |

---

## Deployment Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Hosting** | GCP Cloud Run | Containerized Next.js; auto-scaling; managed by Google Cloud |
| **CDN** | Cloud CDN (via Cloud Run or Firebase Hosting proxy) | Static assets cached globally; optional for v1 |
| **Serverless** | Cloud Run (container-based) | Next.js SSR + API routes run in a single container |
| **Database** | Cloud Firestore | Google Cloud, auto-scaling, no infrastructure management |
| **Auth** | Firebase Auth | Google Cloud, managed service |
| **Domain** | Custom domain via Cloud Run (future) | Default `.run.app` for v1 |
| **CI/CD** | Cloud Build + GitHub trigger | Push to `master` → build container → deploy to Cloud Run |

**Environment Variables (Cloud Run / Secret Manager):**

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## Development Environment

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x LTS or 22.x | Required for Next.js 16 |
| npm | 10.x+ | Ships with Node.js |
| Git | 2.x+ | Version control |
| Firebase CLI | latest | For Firestore rules deployment: `npm install -g firebase-tools` |
| gcloud CLI | latest | For Cloud Run deployment: `gcloud run deploy` |
| VS Code | latest | Recommended editor |

### Setup Commands

```bash
# Clone and install
git clone https://github.com/blaster151/adhdtimer.git
cd adhdtimer

# Install dependencies (after project initialization with create-next-app)
npm install

# Copy environment template
cp .env.example .env.local
# Fill in Firebase config + API keys in .env.local

# Run development server
npm run dev

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Run tests
npm run test

# Build for production
npm run build
```

### Recommended VS Code Extensions

- Tailwind CSS IntelliSense
- ESLint
- Prettier
- Firebase (optional)
- GitLens

---

## Architecture Decision Records (ADRs)

### ADR-1: Next.js 16 over Next.js 15

**Decision:** Use Next.js 16.1.x (latest stable)

**Context:** PRD specifies "Next.js 14+". Next.js 16 is now stable with significant improvements.

**Rationale:**
- Turbopack is the default bundler (faster dev + builds)
- React 19.2 ships with it (View Transitions, `useEffectEvent`)
- React Compiler support (stable) for automatic memoization
- Active security maintenance — 16.1 includes critical patches
- `create-next-app` defaults to 16.x

**Consequences:** Must use App Router patterns (no Pages Router). All security patches applied.

---

### ADR-1b: GCP Cloud Run over Vercel

**Decision:** Deploy on GCP Cloud Run instead of Vercel.

**Context:** The user already has a GCP account. Firebase (Auth + Firestore) is a Google Cloud product.

**Rationale:**
- User's existing GCP account — no new vendor relationship needed
- Firebase and Cloud Run share the same GCP project — unified billing, IAM, and Secret Manager
- Cloud Run supports containerized Next.js with SSR, API routes, and static assets in one deployment
- Cloud Build provides CI/CD triggered by GitHub push (same as Vercel Git integration)
- Environment variables and secrets managed via GCP Secret Manager or Cloud Run env config
- Cloud Run auto-scales to zero when idle — cost-effective for low-traffic v1

**Consequences:**
- Requires a `Dockerfile` for multi-stage Next.js build (straightforward, well-documented)
- Requires `cloudbuild.yaml` for CI/CD pipeline configuration
- No edge functions (Cloud Run is regional) — acceptable for v1 with small user base
- ISR (Incremental Static Regeneration) may need extra config vs. Vercel — not needed for v1 (only landing page is SSR)

### ADR-2: Client-Side Firestore (No Admin SDK for Data)

**Decision:** All Firestore reads/writes go through the client-side Firebase SDK. No `firebase-admin` for data operations.

**Context:** The app is a PWA where all timer logic runs in the browser. Real-time sync requires client-side listeners.

**Rationale:**
- Client-side `onSnapshot` is required for real-time sync — can't replicate server-side
- Security rules handle authorization — no need for trusted server-side access for data
- Simpler architecture — no custom backend, no REST API layer for CRUD
- Only exception: AI API route may need lightweight server-side token verification

**Consequences:**
- Firestore security rules must be comprehensive and tested
- No server-side data validation beyond Firestore rules (acceptable for v1)
- AI endpoint uses Firebase Auth token verification (verify JWT manually or use admin SDK solely for auth)

---

### ADR-3: Timestamp-Based Timer, Not Tick-Based

**Decision:** Calculate all elapsed times from `Date.now() - startedAt`, never from counting `setInterval` ticks.

**Context:** Browser timers (`setInterval`, `setTimeout`) are unreliable — browsers throttle them in background tabs, and they drift over long periods.

**Rationale:**
- Timestamp math is always accurate regardless of tab focus, CPU load, or browser throttling
- Naturally resilient to offline/reconnect — timestamps don't drift
- All devices can independently calculate correct elapsed time from the same timestamps
- Display update frequency (every ~1s) is separate from time tracking accuracy

**Consequences:**
- `setInterval` is used ONLY for triggering UI re-renders (display refresh), NOT for time accumulation
- All time values stored in Firestore are timestamps or accumulated seconds from timestamp math
- Step transition detection: check `elapsedTime >= plannedDuration` on each display tick

---

### ADR-4: No External Date Library

**Decision:** Use raw `Date`, Firestore `Timestamp`, and custom utility functions. No `date-fns`, `dayjs`, or `luxon`.

**Context:** The app only deals with durations (seconds → `M:SS` display) and relative dates ("2 days ago"). No timezone handling, no date formatting, no calendar operations.

**Rationale:**
- Three utility functions cover all needs: `formatDuration()`, `formatOverrun()`, `formatRelativeDate()`
- Adding a date library adds bundle size for zero benefit
- Durations are integer seconds — simple math

**Consequences:** Custom utility functions in `src/lib/utils/time.ts` — must be well-tested.

---

### ADR-5: Union Types over Enums

**Decision:** Use TypeScript string union types, not `enum`.

**Context:** Timer and step states need typed values.

**Rationale:**
- Union types produce no runtime JavaScript (enums produce objects)
- Better tree-shaking
- Simpler to use with Firestore (stored as plain strings)
- More idiomatic modern TypeScript

**Example:**
```typescript
type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';
type StepStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped';
```

---

### ADR-6: localStorage for User Preferences, Firestore for Data

**Decision:** User preferences (TTS enabled, theme) stored in `localStorage`. Timer data and sessions stored in Firestore.

**Context:** Some settings are device-specific (TTS volume, display preferences), while timer data must sync across devices.

**Rationale:**
- TTS enable/disable is device-specific — you might want TTS on phone but not laptop
- No need to sync preferences across devices in v1
- Reduces Firestore reads/writes
- `localStorage` is instant, no async overhead

**Consequences:** Preferences don't sync. Acceptable for v1. Could migrate to Firestore user profile later.

---

_Generated by BMAD Decision Architecture Workflow v1.3.2_
_Date: 2026-02-14_
_For: BMad_
