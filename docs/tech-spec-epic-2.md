# Epic Technical Specification: Guided Execution Experience

Date: 2026-02-14
Author: BMad
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 transforms the bare timer from Epic 1 into an emotional co-pilot. It adds contextual transition messages at each step change, text-to-speech voice announcements, a concentric progress ring visualization (the "Zen Ring" — the hero of the product), a warm completion summary view, and screen wake lock to keep the phone awake during routines. By the end of Epic 2, when a user taps Play on their morning routine, they hear "Shower. 8 minutes. You're right on track," see calming rings animate, feel oriented at every transition, and get a warm "Done!" summary at the end.

This epic covers PRD features FR4 (visual progress), FR5 (TTS), FR6 (transition messages), FR7 (completion summary), and FR8 (screen wake lock). It intentionally excludes cross-device sync (Epic 3), creation polish (Epic 4), and AI breakdown (Epic 5).

## Objectives and Scope

### In Scope

- Contextual transition message overlay at each step change (pace-aware, auto-dismiss)
- Pace calculation utility (`ahead` / `on-track` / `behind`)
- Text-to-speech announcements via Web Speech API (`useTTS` hook)
- TTS enable/disable preference stored in `localStorage`
- Step transition chime audio (gentle, pre-loaded)
- Concentric progress ring SVG component (outer = total, inner = step)
- Ring color shifts based on pace (ahead → teal, on-track → green, behind → amber)
- Step indicator dots below the ring
- Enhanced running timer view layout (ring-centric, per Zen Ring design)
- Overrun visual state (color shift to amber, "+X:XX over" display)
- Countdown mode display (countdown math, overrun switch-over)
- Timer completion summary view with stats, pace summary, step breakdown
- Warm, no-judgment completion language
- Screen Wake Lock API integration (`useWakeLock` hook)
- Graceful degradation for all browser APIs (TTS, Wake Lock)

### Out of Scope

- Cross-device sync / `onSnapshot` real-time listener (Epic 3)
- Observer mode / device handoff (Epic 3)
- Offline persistence handling (Epic 3)
- Active session detection & routing (Epic 3)
- Swipe-to-adjust duration gesture (Epic 4)
- Drag-to-reorder steps (Epic 4)
- Countdown mode toggle UI (Epic 4 — the display logic is Epic 2, the toggle switch is Epic 4)
- Timer library polish / responsive grid (Epic 4)
- AI task breakdown (Epic 5)
- Settings page/sheet (deferred — TTS toggle could live inline for now)

## System Architecture Alignment

Epic 2 builds on the running timer infrastructure from Epic 1:

| Architecture Module | Epic 2 Usage |
|-------------------|-------------|
| `src/components/session/running-timer.tsx` | **Enhanced** — replace basic layout with Zen Ring-centric layout |
| `src/components/session/progress-ring.tsx` | **NEW** — concentric SVG progress rings (outer total, inner step) |
| `src/components/session/step-dots.tsx` | **NEW** — step position indicator dots below ring |
| `src/components/session/transition-overlay.tsx` | **NEW** — step transition message overlay (3-5s, auto-fade) |
| `src/components/session/completion-view.tsx` | **NEW** — timer completion summary screen |
| `src/components/session/playback-controls.tsx` | Minor updates — layout adjustment to fit below ring |
| `src/hooks/use-tts.ts` | **NEW** — Web Speech API wrapper with browser detection |
| `src/hooks/use-wake-lock.ts` | **NEW** — Screen Wake Lock API wrapper |
| `src/hooks/use-timer-engine.ts` | Minor updates — fire transition events, expose hooks for overlay timing |
| `src/lib/utils/pace.ts` | **NEW** — pace calculation (ahead/behind/on-track) |
| `src/lib/utils/time.ts` | Minor updates — add countdown display math, overrun formatting |
| `src/styles/globals.css` | Minor — ring animation keyframes, reduced motion media queries |
| `public/sounds/chime.mp3` | **NEW** — gentle step transition chime audio file |

**Constraints from architecture:**
- All session components are `'use client'` (browser APIs: TTS, Wake Lock, Audio)
- Browser APIs must feature-detect and degrade silently — never error to user
- TTS preference stored in `localStorage`, not Firestore (ADR-6)
- Running timer is "sacred space" — no toasts, no modals during timer execution (UX spec §7.1)
- Ring animation uses CSS `stroke-dashoffset` transitions, GPU-accelerated
- Respect `prefers-reduced-motion` for all animations
- Overrun color = `--behind` (warm amber #D4A96A), never red

## Detailed Design

### Services and Modules

| Module | Responsibility | Input | Output |
|--------|---------------|-------|--------|
| **ProgressRing** (`components/session/progress-ring.tsx`) | SVG concentric rings with animated progress and center text | `{ stepProgress, totalProgress, stepName, elapsedTime, paceStatus, isRunning, isPaused }` | Rendered SVG with smooth stroke-dashoffset animation |
| **StepDots** (`components/session/step-dots.tsx`) | Step position indicator dots (filled=done, ring=current, dim=upcoming) | `{ steps: SessionStep[], currentIndex: number }` | Horizontal dot row |
| **TransitionOverlay** (`components/session/transition-overlay.tsx`) | Step transition announcement overlay | `{ stepName, duration, stepNumber, totalSteps, paceMessage, paceStatus, visible }` | Semi-transparent overlay that auto-fades |
| **CompletionView** (`components/session/completion-view.tsx`) | Warm timer completion summary | `{ session: RunSession }` | Stats card with step breakdown and "Done" CTA |
| **useTTS** (`hooks/use-tts.ts`) | Web Speech API wrapper — speak, cancel, enable/disable, detect support | Text to speak | Speaks via `speechSynthesis` |
| **useWakeLock** (`hooks/use-wake-lock.ts`) | Screen Wake Lock lifecycle — acquire/release on timer state | `{ isActive: boolean }` | Keeps screen on while active |
| **pace.ts** (`lib/utils/pace.ts`) | Calculate cumulative pace (ahead/behind/on-track) | `{ steps: SessionStep[], currentIndex: number, currentElapsed: number }` | `{ deltaSeconds, status: 'ahead' \| 'on-track' \| 'behind', message: string }` |

### Concentric Progress Ring Design

The ring is the visual hero of the product per the Zen Ring design direction.

**SVG Structure:**
```
<svg viewBox="0 0 280 280">
  <!-- Outer ring track (background) -->
  <circle cx="140" cy="140" r="130" stroke="var(--border)" stroke-width="8" fill="none" />
  <!-- Outer ring progress (total timer) -->
  <circle cx="140" cy="140" r="130" stroke="{paceColor}" stroke-width="8" fill="none"
          stroke-dasharray="{circumference}" stroke-dashoffset="{totalOffset}"
          transform="rotate(-90 140 140)" />
  <!-- Inner ring track (background) -->
  <circle cx="140" cy="140" r="108" stroke="var(--border)" stroke-width="10" fill="none" />
  <!-- Inner ring progress (current step) -->
  <circle cx="140" cy="140" r="108" stroke="{paceColor}" stroke-width="10" fill="none"
          stroke-dasharray="{circumference}" stroke-dashoffset="{stepOffset}"
          transform="rotate(-90 140 140)" />
  <!-- Center text -->
  <text text-anchor="middle">
    <tspan x="140" y="125" class="step-name">{stepName}</tspan>
    <tspan x="140" y="155" class="elapsed-time">{elapsedDisplay}</tspan>
    <tspan x="140" y="175" class="pace-status">{paceMessage}</tspan>
  </text>
</svg>
```

**Ring Colors by Pace:**
| Pace Status | Ring Color | CSS Variable |
|------------|-----------|-------------|
| Ahead | `#6BB5A0` | `--ahead` |
| On Track | `#7EBD73` | `--on-track` |
| Behind | `#D4A96A` | `--behind` |

**Ring Sizing (responsive):**
| Breakpoint | Ring Width | Inner Radius | Outer Radius |
|-----------|-----------|-------------|-------------|
| Mobile (< 640px) | 260px | 100px | 120px |
| Tablet (640-1024px) | 280px | 108px | 130px |
| Desktop (> 1024px) | 300px | 116px | 140px |

**Progress Calculation:**
```typescript
// Step progress (inner ring)
const stepProgress = Math.min(elapsedTime / plannedDuration, 1.0);
// If overrunning: progress stays at 1.0 (full ring), color shifts to --behind

// Total progress (outer ring)
const completedStepsDuration = steps
  .slice(0, currentStepIndex)
  .reduce((sum, s) => sum + s.plannedDuration, 0);
const totalPlanned = steps.reduce((sum, s) => sum + s.plannedDuration, 0);
const totalProgress = (completedStepsDuration + elapsedTime) / totalPlanned;
```

**Overrun State:**
- When `elapsedTime > plannedDuration`: inner ring stays full (100%), ring color shifts to `--behind`
- Center time display switches to "+M:SS over" format using `formatOverrun()`
- NO flashing, pulsing, or alarming visual — just a calm color shift

**Animation:**
- Ring progress uses CSS `transition: stroke-dashoffset 1s linear`
- On pause: rings freeze (no transition)
- Respect `prefers-reduced-motion`: instant snap instead of smooth transition

**ARIA:**
- SVG has `role="img"` and dynamic `aria-label`: "Morning Routine progress: step 2 of 5, Shower, 5 minutes 23 seconds elapsed, 1 minute ahead of schedule"

### Transition Overlay Design

**Behavior:**
- Appears as semi-transparent overlay on the running timer for 3-5 seconds
- Triggered on step transitions (auto-advance, skip)
- Does NOT block playback controls (pointer-events: none on overlay)
- Auto-fades via CSS animation

**Content:**
```
"Time to start [Step Name]"
"Step [X] of [Y]"
"[Pace Message]"
```

**Pace Message Language:**
| Pace | Message Template | Color |
|------|-----------------|-------|
| ≥ 2 min ahead | "X min ahead — nice pace" | `--ahead` |
| 1 min ahead | "1 min ahead" | `--ahead` |
| Within 30 sec | "Right on track" | `--on-track` |
| 1 min behind | "1 min behind" | `--behind` |
| ≥ 2 min behind | "X min behind" | `--behind` |

**Language Rules (from UX spec §2.1):**
- Ahead: calm, understated ("nice pace")
- Behind: gentle, factual, NEVER alarming — no "warning", no "running late"
- NEVER use exclamation marks for behind status

### Text-to-Speech Design

**useTTS Hook Interface:**
```typescript
interface UseTTSReturn {
  speak: (text: string) => void;
  cancel: () => void;
  isSupported: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
```

**Speech Content:**
- On step transition: `"[Step Name]. [Duration] minutes."`
- Example: `"Shower. 8 minutes."`
- On first step: `"[Step Name]. [Duration] minutes."`

**Implementation:**
```typescript
const speak = (text: string) => {
  if (!isSupported || !isEnabled) return;
  speechSynthesis.cancel(); // Cancel any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  speechSynthesis.speak(utterance);
};
```

**Audio Unlock (iOS Safari):**
- `speechSynthesis.speak()` must be called in response to a user gesture
- The "Play" button tap on timer start serves as this gesture
- Speak a silent utterance or the first step name immediately on Play

**TTS Enable/Disable:**
- Stored in `localStorage` key `adhd-timer-tts-enabled` (default: `true`)
- Toggle accessible in running timer view or settings

**Graceful Degradation:**
- Check `'speechSynthesis' in window` before using
- If unavailable: `isSupported = false`, all `speak()` calls are no-ops
- Never show error to user

### Step Transition Chime

**Implementation:**
- Pre-load audio: `new Audio('/sounds/chime.mp3')` on component mount
- Play before TTS at each step transition
- Volume: 0.3 (gentle, not startling)
- Enable/disable tied to TTS setting (if TTS off, chime off too)

### Wake Lock Design

**useWakeLock Hook Interface:**
```typescript
interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
}
```

**Lifecycle:**
| Timer State | Wake Lock |
|------------|-----------|
| Play / Resume | `request()` — acquire |
| Pause | `release()` — release |
| Complete | `release()` — release |
| Stop | `release()` — release |
| Component unmount | `release()` — cleanup |

**Graceful Degradation:**
- Check `'wakeLock' in navigator` before using
- If unavailable: `isSupported = false`, all calls are no-ops
- Never show error to user

### Completion View Design

**Layout:**
```
☕ Done!
[Total Actual Time]

[Ahead/Behind Summary]

Steps:
✓ Shower — 8:23 / 8:00
✓ Get Dressed — 5:12 / 5:00 (+0:12)
⊘ Breakfast — skipped
✓ Pack Bag — 3:45 / 3:00 (+0:45)

[Done Button → /app]
```

**Summary Language:**
| Pace | Message |
|------|---------|
| Ahead | "X minutes ahead — nice pace" |
| On Track (within 1 min) | "Right on time" |
| Behind | "X minutes longer than planned" |

**Step Breakdown Rules:**
- Show all steps with actual vs planned time
- Steps overrunning by > 1 min: show `(+M:SS)` in `--behind` color
- Skipped steps: show with ⊘ icon and "skipped" label
- NO judgment language on any step — just factual data

**Navigation:**
- "Done" or "Back to Library" button → `router.push('/app')`
- In Epic 1, session completion navigated directly to library. Now it navigates to this completion view first.

### Pace Calculation Utility

**`src/lib/utils/pace.ts`:**

```typescript
interface PaceResult {
  deltaSeconds: number;     // positive = ahead, negative = behind
  status: 'ahead' | 'on-track' | 'behind';
  message: string;          // Human-readable pace message
}

function calculatePace(
  steps: SessionStep[],
  currentStepIndex: number,
  currentStepElapsed: number
): PaceResult {
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  for (let i = 0; i < currentStepIndex; i++) {
    cumulativePlanned += steps[i].plannedDuration;
    cumulativeActual += steps[i].elapsedTime;
  }
  // Add current step
  cumulativePlanned += steps[currentStepIndex].plannedDuration;
  cumulativeActual += currentStepElapsed;

  const delta = cumulativePlanned - cumulativeActual; // positive = ahead

  if (Math.abs(delta) <= 30) {
    return { deltaSeconds: delta, status: 'on-track', message: 'Right on track' };
  }

  const minutes = Math.round(Math.abs(delta) / 60);
  if (delta > 0) {
    return {
      deltaSeconds: delta,
      status: 'ahead',
      message: minutes >= 2 ? `${minutes} min ahead — nice pace` : `1 min ahead`,
    };
  }
  return {
    deltaSeconds: delta,
    status: 'behind',
    message: minutes >= 2 ? `${minutes} min behind` : `1 min behind`,
  };
}
```

### Updated Running Timer Layout

**Before (Epic 1):** Basic step name + elapsed time + controls
**After (Epic 2):** Full Zen Ring layout

```
┌─────────────────────────────┐
│      [Header: Timer Name]   │
│                             │
│    ┌─────────────────┐      │
│    │   ◯ Progress    │      │
│    │   ◯  Ring       │      │
│    │   (step name)   │      │
│    │   (elapsed)     │      │
│    │   (pace)        │      │
│    └─────────────────┘      │
│                             │
│    ● ● ◉ ○ ○  (step dots)  │
│                             │
│  ┌──────────────────────┐   │
│  │ Step list (scrollable)│   │
│  │ ✓ Shower      8:23   │   │
│  │ ▶ Get Dressed  2:15   │   │
│  │ ○ Breakfast    —      │   │
│  └──────────────────────┘   │
│                             │
│  [+1] [+5]  [⏸]  [⏭] [⏹] │
└─────────────────────────────┘
```

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|---------------|
| Ring animation | 60fps | CSS `stroke-dashoffset` transition, GPU-accelerated via `will-change` |
| TTS latency | < 500ms from transition | Pre-construct utterance, speak immediately |
| Chime latency | < 100ms from transition | Pre-loaded `Audio` object |
| Transition overlay | Smooth fade in/out | CSS animation with `opacity` + `transform` |
| Completion view render | < 500ms | Simple calculation from session data |

### Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge | Fallback |
|---------|--------|--------|---------|------|----------|
| Web Speech API (TTS) | ✅ 33+ | ✅ 7+ | ✅ 49+ | ✅ 14+ | Silent degradation |
| Screen Wake Lock API | ✅ 84+ | ✅ 16.4+ | ❌ | ✅ 84+ | No wake lock |
| SVG stroke-dashoffset | ✅ | ✅ | ✅ | ✅ | N/A (universal) |
| Web Audio / `<audio>` | ✅ | ✅ | ✅ | ✅ | No chime |

### Accessibility

| Requirement | Implementation |
|------------|---------------|
| Ring ARIA label | Dynamic `aria-label` on SVG reflecting step, time, pace |
| Transition overlay | `aria-live="polite"` region for screen reader announcements |
| Reduced motion | `prefers-reduced-motion`: disable ring animation, overlay fade, breathing effects |
| Step dots ARIA | `role="list"` with `aria-label` "Timer progress: step X of Y" |
| Color-only information | Pace message text always accompanies ring color (not color-only) |

## Dependencies and Integrations

### New npm Dependencies

None — all features use browser-native APIs or existing project dependencies.

### Browser APIs Used

| API | Purpose | Required By |
|-----|---------|------------|
| `window.speechSynthesis` | Text-to-speech | Story 2.2 |
| `navigator.wakeLock` | Screen wake lock | Story 2.5 |
| `new Audio()` | Step transition chime | Story 2.1 |
| `matchMedia('(prefers-reduced-motion: reduce)')` | Reduced motion | All stories |

### New Static Assets

| File | Purpose |
|------|---------|
| `public/sounds/chime.mp3` | Gentle step transition chime (< 50KB) |

### Dependencies on Epic 1

- `useTimerEngine` hook must expose: current step data, elapsed time, session status, step transitions
- `PlaybackControls` component exists and functions
- `RunningTimer` component exists as orchestrator
- `formatDuration()` and `formatOverrun()` utilities exist in `time.ts`
- Session data model (`RunSession`, `SessionStep`) defined and functional
- Firestore session CRUD operational

## Acceptance Criteria (Authoritative)

Extracted from epics.md Stories 2.1–2.5 and normalized:

| # | Acceptance Criterion | Source Story |
|---|---------------------|-------------|
| AC1 | Step transition overlay shows "Time to start [Step Name]", "Step X of Y", and pace message | 2.1 |
| AC2 | Overlay fades after 3-5 seconds automatically | 2.1 |
| AC3 | Pace message uses calm language when ahead ("X min ahead — nice pace") | 2.1 |
| AC4 | Pace message uses gentle factual language when behind ("X min behind") — no alarms | 2.1 |
| AC5 | Pace message shows "Right on track" when within 30 seconds of planned pace | 2.1 |
| AC6 | TTS speaks "[Step Name]. [Duration] minutes." on each step transition | 2.2 |
| AC7 | TTS works without additional interaction on first step (audio unlocked via Play tap) | 2.2 |
| AC8 | TTS can be disabled via a setting; when disabled, no voice plays | 2.2 |
| AC9 | If browser doesn't support Web Speech API, app degrades to visual-only — no error | 2.2 |
| AC10 | Running timer shows concentric progress ring (outer=total, inner=step) | 2.3 |
| AC11 | Current step name displayed large and prominent in ring center | 2.3 |
| AC12 | Step list shows completed, current (highlighted), and upcoming steps | 2.3 |
| AC13 | Overrun state: ring color shifts to warm amber, no flash/pulse/alarm | 2.3 |
| AC14 | Countdown mode shows remaining time counting down; overrun shows "+X:XX over" | 2.3 |
| AC15 | Overall progress indicator shows progress through all steps | 2.3 |
| AC16 | Completion view shows "Done!" with total actual time and warm closing | 2.4 |
| AC17 | Completion shows total actual vs planned, steps completed/skipped count | 2.4 |
| AC18 | Steps overrunning by > 1 min listed with actual vs planned | 2.4 |
| AC19 | Ahead summary: understated ("X minutes ahead — nice pace") | 2.4 |
| AC20 | Behind summary: neutral, no shame ("X minutes longer than planned") | 2.4 |
| AC21 | "Done" button returns to timer library | 2.4 |
| AC22 | Wake Lock acquired when timer starts/resumes | 2.5 |
| AC23 | Wake Lock released when timer pauses | 2.5 |
| AC24 | Wake Lock released when timer completes | 2.5 |
| AC25 | Wake Lock re-acquired on resume after pause | 2.5 |
| AC26 | If Wake Lock API unsupported, app works normally — no error | 2.5 |

## Traceability Mapping

| AC | Spec Section | Component(s) / Module(s) | Test Approach |
|----|-------------|-------------------------|---------------|
| AC1-AC5 | Transitions + Pace | `TransitionOverlay`, `pace.ts` | Unit: pace calc; Component: overlay rendering |
| AC6-AC9 | TTS | `useTTS` | Unit: hook behavior, mock speechSynthesis |
| AC10-AC15 | Progress Ring | `ProgressRing`, `StepDots`, `RunningTimer` | Component: SVG rendering, ARIA; Unit: progress math |
| AC16-AC21 | Completion | `CompletionView` | Component: renders stats, language checks |
| AC22-AC26 | Wake Lock | `useWakeLock` | Unit: hook lifecycle, mock navigator.wakeLock |

## Risks, Assumptions, Open Questions

| Type | Item | Mitigation / Next Step |
|------|------|----------------------|
| **Risk** | Progress ring SVG complexity — many moving parts (animation, color, center text, responsive sizing) | Spike implementation early; start with static ring, then add animation |
| **Risk** | iOS Safari TTS audio unlock is fragile | Test on real iOS device; ensure `speechSynthesis.speak()` is called synchronously in the Play button handler |
| **Risk** | Wake Lock re-acquisition after page visibility change (tab switch + return) | Listen for `visibilitychange` event and re-request wake lock |
| **Assumption** | `chime.mp3` can be freely sourced or created (< 50KB, gentle tone) | Use a royalty-free chime from freesound.org or similar |
| **Assumption** | CSS `stroke-dashoffset` transition provides smooth enough ring animation at 1s intervals | If not smooth enough, consider `requestAnimationFrame` for sub-second interpolation |
| **Open Question** | Should TTS toggle be in the running timer view or only in settings? | Recommendation: small toggle icon in running timer header for quick access |
| **Open Question** | Should chime play before or after TTS? | Recommendation: chime first (50ms), then TTS. Chime alerts attention, TTS delivers content. |

## Test Strategy Summary

| Layer | Tool | Coverage |
|-------|------|---------|
| **Unit** | Vitest | `pace.ts` (all pace scenarios: ahead, behind, on-track, edge cases), `time.ts` (countdown math, overrun formatting) |
| **Unit** | Vitest | `useTTS` hook (mock `speechSynthesis`, enable/disable, unsupported browser), `useWakeLock` hook (mock `navigator.wakeLock`, acquire/release lifecycle) |
| **Component** | Vitest + React Testing Library | `ProgressRing` (SVG renders, ARIA label, color by pace), `TransitionOverlay` (content rendering, auto-dismiss), `CompletionView` (stats, language, button), `StepDots` (correct dot states) |
| **Manual** | Developer testing | Full flow: play timer → hear TTS → see ring animate → transitions → completion. Test on mobile Chrome + Safari. Test Wake Lock on mobile. Test TTS disable. Test reduced motion. |

**Test file co-location:**
- `src/lib/utils/pace.test.ts`
- `src/hooks/use-tts.test.ts`
- `src/hooks/use-wake-lock.test.ts`
- `src/components/session/progress-ring.test.tsx`
- `src/components/session/transition-overlay.test.tsx`
- `src/components/session/completion-view.test.tsx`
- `src/components/session/step-dots.test.tsx`

**Critical test scenarios:**
1. Pace calc: completed 3 steps ahead of schedule → "3 min ahead — nice pace"
2. Pace calc: completed 2 steps behind → "2 min behind" (no alarm language)
3. Pace calc: within 30s → "Right on track"
4. TTS: speak called with correct text on transition
5. TTS: speak not called when disabled
6. TTS: no error when speechSynthesis undefined
7. Wake Lock: request called on play, release on pause/complete
8. Wake Lock: no error when API unavailable
9. Ring: progress at 50% → stroke-dashoffset at 50%
10. Ring: overrun state → color = --behind
11. Completion: ahead summary uses warm language
12. Completion: behind summary uses neutral language, no shame
