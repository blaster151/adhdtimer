# ADHD Timer - Epic Breakdown

**Author:** BMad
**Date:** 2026-02-14
**Track:** BMad Method (Greenfield)

---

## Overview

This document decomposes the [PRD](./PRD.md) into 5 epics and bite-sized stories for implementation. Each story is vertically sliced, sequentially ordered, and sized for a single dev agent session.

**Epic Summary:**

| Epic | Name | Stories | Value |
|------|------|---------|-------|
| 1 | Foundation & Core Timer Engine | 7 | App exists, auth works, timers play |
| 2 | Guided Execution Experience | 5 | Emotional co-pilot — voice, transitions, progress |
| 3 | Real-Time Sync | 4 | Same timer, any device |
| 4 | Timer Editing & Polish | 4 | Frictionless creation and management |
| 5 | AI-Powered Task Breakdown | 3 | Type a task, get a timer |
| | **Total** | **23** | |

**Sequencing:** After Epic 2, you have a usable single-device product. After Epic 3, you have the full morning routine experience. Epics 4 and 5 are polish and delight.

---

## Epic 1: Foundation & Core Timer Engine

**Goal:** Establish the project, deployment pipeline, authentication, timer data model, and core playback — the skeleton everything else builds on.

**Business Value:** Without this, nothing works. This epic delivers a functional (if bare-bones) timer app: sign in, create a timer, press play, watch it run.

---

### Story 1.1: Project Setup & Deployment Pipeline

As a **developer**,
I want a fully configured Next.js project with CI/CD deployment to GCP Cloud Run,
So that every subsequent story can be built, tested, and deployed incrementally.

**Acceptance Criteria:**

**Given** the project repository exists on GitHub
**When** the developer initializes the Next.js project
**Then** the following are configured:
- Next.js 14+ with App Router
- TypeScript enabled
- Tailwind CSS installed and configured
- ESLint + Prettier configured
- Firebase SDK installed (`firebase`, `firebase-admin`)
- Project deploys to GCP Cloud Run on push to `master` (via Cloud Build)
- Environment variables configured for Firebase (dev)
- Basic folder structure: `app/`, `components/`, `lib/`, `types/`
- A "Hello World" landing page renders at `/`

**Prerequisites:** None (first story)

**Technical Notes:**
- Use `create-next-app` with App Router + TypeScript + Tailwind
- Set up `.env.local` for Firebase config (project ID, API key, etc.)
- Cloud Build trigger linked to GitHub repo for auto-deploy to Cloud Run
- Consider `next-pwa` setup here or defer to Epic 2 (wake lock story)

---

### Story 1.2: Firebase Authentication

As a **user**,
I want to sign in with Google or email/password,
So that my timers are saved to my account and accessible from any device.

**Acceptance Criteria:**

**Given** I am on the app landing page and not signed in
**When** I click "Sign in with Google"
**Then** I am redirected to Google OAuth, and after successful auth, I am redirected to the timer library page (empty state)

**And given** I choose email/password sign-in
**When** I enter a valid email and password and submit
**Then** I am signed in and redirected to the timer library page

**And given** I am signed in
**When** I refresh the page or open the app in a new tab
**Then** I remain signed in (session persists)

**And given** I am signed in
**When** I click "Sign out"
**Then** I am signed out and returned to the landing page

**Prerequisites:** Story 1.1

**Technical Notes:**
- Use Firebase Auth with `GoogleAuthProvider` and `EmailAuthProvider`
- Client-side auth with `onAuthStateChanged` listener
- Protected routes: `/app/*` requires auth, redirects to `/login` if not authenticated
- Auth context provider wrapping the app
- Firestore security rules: users can only read/write their own data (set up rules file)

---

### Story 1.3: Timer Data Model & Firestore Schema

As a **developer**,
I want a well-defined timer data model in Firestore,
So that timers, steps, and run sessions have a clear structure for all subsequent features.

**Acceptance Criteria:**

**Given** the Firestore database is configured
**When** the data model is implemented
**Then** the following collections and document structures exist:

- `users/{userId}/timers/{timerId}` — Timer Template:
  ```
  { name, description?, totalPlannedDuration, steps: [{ id, name, plannedDuration, notes? }], createdAt, updatedAt }
  ```
- `users/{userId}/sessions/{sessionId}` — Run Session:
  ```
  { timerId, status (idle|running|paused|completed), currentStepIndex, startedAt, pausedAt?, steps: [{ id, name, plannedDuration, elapsedTime, status (pending|running|paused|completed|skipped) }], activeDeviceId, totalElapsedTime }
  ```
- TypeScript types/interfaces defined for all models in `types/`
- Firestore security rules enforce user isolation

**And given** types are defined
**When** a developer imports them
**Then** full TypeScript type safety is available for all timer operations

**Prerequisites:** Story 1.2

**Technical Notes:**
- Timer templates are the library — immutable during playback
- Run sessions are transient execution instances (reference timerId but don't mutate template)
- `activeDeviceId` in session supports future sync conflict resolution (Epic 3)
- Steps stored as array within document (not subcollection) — simpler for v1, sufficient for expected step counts (< 30)
- Consider a `lib/firebase/` module with typed helper functions for CRUD
- Durations stored in seconds (integers)

---

### Story 1.4: Timer CRUD — Create & List

As a **user**,
I want to create a new timer with named steps and durations, and see all my timers in a library,
So that I can build my routines and find them later.

**Acceptance Criteria:**

**Given** I am signed in and on the timer library page
**When** there are no timers
**Then** I see an empty state with a "Create your first timer" prompt and a clear CTA button

**And given** I click "Create Timer"
**When** the creation form appears
**Then** I can enter:
- Timer name (required)
- Add steps: each with a name (required) and duration in minutes (required, default 5)
- At least 1 step is required to save
- Total duration auto-calculates and displays

**And given** I have entered a valid timer with steps
**When** I tap "Save"
**Then** the timer is saved to Firestore and appears in my timer library

**And given** I have saved timers
**When** I view the timer library
**Then** I see a list/grid of timer cards showing: name, total duration, step count, last used date (or "Never")

**Prerequisites:** Story 1.3

**Technical Notes:**
- Timer creation page at `/app/timers/new`
- Timer library page at `/app` (home after sign-in)
- Use React state for the creation form, save to Firestore on submit
- Step list is an ordered array — user adds steps sequentially for now (drag-to-reorder comes in Epic 4)
- Duration input: simple number field for minutes (enhanced swipe gesture in Epic 4)

---

### Story 1.5: Timer CRUD — Edit & Delete

As a **user**,
I want to edit or delete my saved timers,
So that I can refine routines and remove ones I don't need.

**Acceptance Criteria:**

**Given** I am on the timer library and I tap on a timer card's edit action
**When** the edit form loads
**Then** it is pre-populated with the timer's current name, steps, and durations

**And given** I modify the timer name, add/remove steps, or change durations
**When** I tap "Save"
**Then** the timer template is updated in Firestore and the library reflects changes

**And given** I want to delete a timer
**When** I initiate the delete action (button or swipe)
**Then** I see a brief confirmation ("Delete Morning Routine?")
**And when** I confirm
**Then** the timer is removed from Firestore and disappears from the library

**And given** I want to duplicate a timer
**When** I select "Duplicate" from the timer's actions
**Then** a copy is created with the name "[Original Name] (copy)" and I can edit it

**Prerequisites:** Story 1.4

**Technical Notes:**
- Edit page at `/app/timers/[timerId]/edit`
- Reuse the creation form component with pre-populated data
- Delete confirmation: simple modal or inline confirmation, not OS-level dialog
- Duplicate: client-side copy of the document, new Firestore ID

---

### Story 1.6: Core Playback — Play, Pause, Skip

As a **user**,
I want to start a timer and have it run through steps sequentially with play, pause, and skip controls,
So that I can execute my routine with basic guidance.

**Acceptance Criteria:**

**Given** I am on the timer library and I tap "Play" on a timer
**When** the timer starts
**Then** a new Run Session is created in Firestore
**And** the first step begins with status `running`
**And** I see the running timer view showing: current step name, elapsed time counting up, and playback controls (pause, skip)

**And given** the timer is running
**When** I tap "Pause"
**Then** the current step and timer pause, elapsed time stops incrementing
**And when** I tap "Play" (resume)
**Then** the timer resumes from where it was paused

**And given** the timer is running
**When** I tap "Skip"
**Then** the current step is marked `skipped`, the next step begins immediately
**And** no confirmation dialog appears (principle: "Allow an override")

**And given** the timer is running and the current step's elapsed time reaches its planned duration
**When** the step auto-advances
**Then** the current step is marked `completed` with its actual elapsed time
**And** the next step begins with status `running`

**And given** the last step completes or is skipped
**When** there are no more steps
**Then** the Run Session status becomes `completed`

**And given** the timer is running
**When** I tap "Stop"
**Then** the Run Session is marked `completed` (early stop), and I return to the library

**Prerequisites:** Story 1.5

**Technical Notes:**
- Running timer page at `/app/sessions/[sessionId]`
- Timer tick: use `requestAnimationFrame` or `setInterval(1000)` for display, but calculate actual elapsed from `Date.now() - startedAt` (timestamp-based, not tick-counting) for accuracy
- Step transitions update the Run Session document in Firestore
- State machine: implement a `useTimerEngine` hook or similar that manages the state transitions
- For now, this is single-device only — sync comes in Epic 3

---

### Story 1.7: Time Extension ("I Need More Minutes")

As a **user**,
I want to extend the current step's duration while it's running,
So that I can take more time without shame or friction.

**Acceptance Criteria:**

**Given** a timer is running and I'm on the current step
**When** I tap "+1 min" button
**Then** the step's planned duration increases by 60 seconds immediately
**And** the display updates to reflect the new planned duration
**And** no confirmation dialog appears
**And** no judgment language is shown (no "running behind!" warning)

**And given** I tap "+5 min" button
**When** the button is pressed
**Then** the step's planned duration increases by 300 seconds

**And given** I have extended a step's duration
**When** the contextual transition message calculates pace (Epic 2)
**Then** it uses the *updated* planned duration for pace calculation

**Prerequisites:** Story 1.6

**Technical Notes:**
- Two buttons on the running timer view: "+1" and "+5" (minutes)
- Update the step's `plannedDuration` in the Run Session document
- Timer continues running — only the target changes
- Extension is recorded in the run session (actual planned duration reflects extensions)

---

## Epic 2: Guided Execution Experience

**Goal:** Transform the bare timer into an emotional co-pilot — voice announcements, contextual messages, visual progress, completion summary, and screen wake lock.

**Business Value:** This is what makes ADHD Timer *special*. Without Epic 2, it's just another timer. With it, every transition whispers "what's next, where you are, you're okay."

---

### Story 2.1: Contextual Transition Messages

As a **user**,
I want to see a brief contextual message at each step transition telling me what's next and how I'm pacing,
So that I feel oriented and reassured at every transition.

**Acceptance Criteria:**

**Given** a timer is running and a step transition occurs (auto-advance or skip)
**When** the next step begins
**Then** a toast/overlay message appears showing:
- "Time to start **[Step Name]**"
- "Step [X] of [Y]"
- Pace: "You're [X] min ahead" / "[X] min behind" / "Right on track"
**And** the message fades after 3-5 seconds

**And given** the user is ahead of schedule (cumulative elapsed < cumulative planned)
**When** the pace message displays
**Then** it uses calm, understated language (e.g., "2 min ahead — nice pace")

**And given** the user is behind schedule
**When** the pace message displays
**Then** it uses gentle, factual language (e.g., "3 min behind") — no alarms, no shame

**And given** the user is within 30 seconds of planned pace
**When** the pace message displays
**Then** it shows "Right on track"

**Prerequisites:** Story 1.6

**Technical Notes:**
- Pace calculation: sum of `actualElapsed` for completed steps vs. sum of `plannedDuration` for those same steps
- Toast component: absolute positioned overlay on the running timer view, auto-dismiss with CSS animation
- Transition messages are the *soul* of the product — tone is critical. Review FR6.3 for language guidelines.

---

### Story 2.2: Text-to-Speech Step Announcements

As a **user**,
I want the app to read each step name aloud when it begins,
So that I don't need to look at the screen to know what to do next.

**Acceptance Criteria:**

**Given** a timer is running and a step transition occurs
**When** the new step begins
**Then** TTS speaks: "[Step Name]. [Duration] minutes."

**And given** TTS is enabled (default)
**When** the first step of a timer begins
**Then** TTS works without additional user interaction (audio unlocked during the "Play" tap)

**And given** the user has disabled TTS in settings
**When** a step transition occurs
**Then** no voice announcement plays (visual transition only)

**And given** the browser does not support Web Speech API or TTS fails
**When** a step transition occurs
**Then** the app degrades gracefully to visual-only — no error displayed

**Prerequisites:** Story 2.1

**Technical Notes:**
- Use `window.speechSynthesis.speak()` with a `SpeechSynthesisUtterance`
- iOS Safari requires a user gesture to unlock audio — the "Play" button tap on timer start serves as this gesture
- Create a `useTTS` hook that handles: browser support detection, audio unlock, speak/cancel, enable/disable setting
- TTS setting stored in user preferences (Firestore or localStorage for v1)
- Voice: default system voice, rate 1.0, pitch 1.0

---

### Story 2.3: Visual Progress Indicator

As a **user**,
I want to see clear visual progress for the current step and overall timer,
So that I can glance at the screen and instantly know where I am.

**Acceptance Criteria:**

**Given** a timer is running
**When** I look at the running timer view
**Then** I see:
- Current step name displayed **large and prominent**
- Current step elapsed time (count-up, or countdown if toggled)
- A progress ring/bar showing current step progress (elapsed / planned)
- Overall timer progress indicator showing progress through all steps
- A step list showing completed steps (with actual time), current step (highlighted), and upcoming steps

**And given** a step is overrunning (elapsed > planned)
**When** the progress indicator reaches 100%
**Then** the ring/bar shows overrun state visually (e.g., color shift to warm amber) but does NOT flash, pulse, or alarm

**And given** the timer is in countdown mode
**When** a step overruns
**Then** the display switches to show "+0:30 over" (count-up of overrun time)

**Prerequisites:** Story 2.1

**Technical Notes:**
- Progress ring: SVG circle with `stroke-dashoffset` animation, or CSS `conic-gradient` — choose simplest approach that looks good
- Step list: scrollable list below the progress ring, current step pinned to view
- Color palette: calm blue-green for ahead/on-track, warm amber for behind/overrun, muted gray for pending steps
- This is the visual centerpiece — should look great on both phone and desktop
- Responsive: progress ring scales appropriately for mobile vs. desktop viewport

---

### Story 2.4: Timer Completion View

As a **user**,
I want to see a warm summary when my timer finishes,
So that I feel a sense of completion and can see how it went.

**Acceptance Criteria:**

**Given** a timer has completed (all steps completed/skipped or user stopped early)
**When** the completion view appears
**Then** I see:
- "Done! [Total actual time]. ☕" (or similar warm closing)
- Total actual time vs. total planned time
- Number of steps completed and skipped
- Steps that overran by more than 1 minute listed with actual vs. planned

**And given** the timer finished ahead of schedule
**When** the summary shows
**Then** it includes "2 minutes ahead — nice pace" (understated)

**And given** the timer finished behind schedule
**When** the summary shows
**Then** it includes "4 minutes longer than planned" (neutral, no shame)

**And given** I want to leave the completion view
**When** I tap "Done" or "Back to Library"
**Then** I return to the timer library

**Prerequisites:** Story 2.3

**Technical Notes:**
- Completion view replaces the running timer view when session status = `completed`
- Read step data from the Run Session document
- Overrun threshold: only highlight steps where `actualElapsed - plannedDuration > 60 seconds`
- Run session data remains in Firestore (not deleted) — enables future run history feature
- Tone: review FR12.2 for no-judgment language guidelines

---

### Story 2.5: Screen Wake Lock

As a **user**,
I want my phone screen to stay on while a timer is running,
So that I can see and hear step transitions without touching my phone.

**Acceptance Criteria:**

**Given** a timer starts (Play is tapped)
**When** the run session begins
**Then** a Screen Wake Lock is acquired (screen stays on)

**And given** the timer is paused
**When** the pause action occurs
**Then** the Wake Lock is released (screen can dim normally)

**And given** the timer resumes
**When** Play is tapped again
**Then** the Wake Lock is re-acquired

**And given** the timer completes
**When** the completion view appears
**Then** the Wake Lock is released

**And given** the browser does not support the Wake Lock API
**When** a timer starts
**Then** the app works normally without wake lock — no error displayed

**Prerequisites:** Story 2.4

**Technical Notes:**
- Use `navigator.wakeLock.request('screen')` — returns a `WakeLockSentinel`
- Release via `sentinel.release()`
- Wake Lock API: supported in Chrome 84+, Edge 84+, Safari 16.4+
- Create a `useWakeLock` hook: acquire on mount/play, release on unmount/pause/complete
- Test on mobile Chrome and Safari — this is critical for the morning routine use case

---

## Epic 3: Real-Time Sync

**Goal:** Enable the same timer session to be viewed and controlled across multiple devices in real-time.

**Business Value:** Unlocks the hero flow — phone in the bathroom for morning routine, laptop at the desk for work blocks. The timer follows you.

---

### Story 3.1: Real-Time Session Listener

As a **user**,
I want to open the app on a second device and see my currently running timer in real-time,
So that I can move between devices without losing my place.

**Acceptance Criteria:**

**Given** I have a timer running on Device A
**When** I open the app on Device B (signed in to the same account)
**Then** Device B shows the currently active run session
**And** the running timer view displays with current step, elapsed time, and progress — in sync with Device A

**And given** the timer is running on Device A
**When** a step transition occurs on Device A
**Then** Device B sees the step transition within 2-3 seconds

**And given** the timer is paused on Device A
**When** Device B's view updates
**Then** Device B shows the paused state

**Prerequisites:** Story 2.5 (all of Epic 2 complete)

**Technical Notes:**
- Use Firestore `onSnapshot` listener on the active Run Session document
- When user opens the app, check for any session with status `running` or `paused` for this user
- If active session found, navigate directly to the running timer view
- Timer display on non-controlling device: calculate elapsed from `startedAt` timestamp + step elapsed data, not from local ticks
- The listener receives real-time updates as Device A writes state changes

---

### Story 3.2: Device Control Handoff

As a **user**,
I want to take control of a running timer from my current device,
So that I can pause, skip, or interact from whichever device I'm near.

**Acceptance Criteria:**

**Given** a timer is running with Device A as the active controller
**When** I view the session on Device B
**Then** Device B shows the timer state in read-only mode with a "Take Control" button

**And given** I tap "Take Control" on Device B
**When** the action completes
**Then** Device B becomes the active controller (`activeDeviceId` updated)
**And** Device A becomes read-only
**And** the transition is seamless — no timer interruption

**And given** I am the active controller
**When** I use any playback control (pause, skip, extend)
**Then** the action is executed and synced to all other devices

**And given** I am in read-only mode
**When** I try to tap playback controls
**Then** the controls are visually disabled or hidden, with "Take Control" prominently available

**Prerequisites:** Story 3.1

**Technical Notes:**
- `activeDeviceId` field in the Run Session document — generate a unique device ID per browser session (e.g., `crypto.randomUUID()`, stored in `sessionStorage`)
- Before executing any playback action, check `activeDeviceId === myDeviceId`
- "Take Control" writes `activeDeviceId = myDeviceId` to the session doc
- No locking mechanism needed — last writer wins is acceptable for personal use (v1 is single-user)

---

### Story 3.3: Sync Conflict Handling

As a **user**,
I want timer sync to handle connection drops and edge cases gracefully,
So that my timer doesn't break if I lose internet briefly.

**Acceptance Criteria:**

**Given** the active controller device loses internet connection
**When** the timer is running
**Then** the timer continues running locally on that device (using local timestamps)

**And given** the device reconnects
**When** Firestore sync resumes
**Then** the local state is written back to Firestore
**And** other devices see the updated state within a few seconds

**And given** two devices both made changes while offline (rare edge case)
**When** both reconnect
**Then** the most recent timestamp wins — no crash, no data corruption

**And given** a device opens the app with no internet
**When** the user views the timer library
**Then** cached data is shown (Firestore offline persistence)
**And** starting a new timer is blocked with a friendly message: "Sync unavailable — connect to internet to start a timer"

**Prerequisites:** Story 3.2

**Technical Notes:**
- Enable Firestore offline persistence (`enablePersistence()` or `enableMultiTabIndexedDbPersistence()`)
- Timer engine: always calculate elapsed from timestamps, never from tick counts — this makes offline/reconnect naturally resilient
- Last-write-wins: Firestore's default behavior handles this for single-document updates
- Starting a timer requires online (to create the session doc and enable sync) — acceptable v1 constraint

---

### Story 3.4: Active Session Detection & Routing

As a **user**,
I want the app to automatically show me my running timer when I open it,
So that I don't have to navigate to find my active session.

**Acceptance Criteria:**

**Given** I have an active run session (status `running` or `paused`)
**When** I open the app on any device
**Then** I am automatically routed to the running timer view for that session

**And given** I have no active session
**When** I open the app
**Then** I see the timer library (normal home screen)

**And given** I had an active session but it completed while I was away
**When** I open the app
**Then** I see the timer library (session is completed, no redirect)

**Prerequisites:** Story 3.3

**Technical Notes:**
- On app load (after auth), query for sessions where `userId == currentUser && status in ['running', 'paused']`
- If found, redirect to `/app/sessions/[sessionId]`
- This should be a quick check — use a simple Firestore query, not a full collection listener
- Handle edge case: stale session (started hours ago, never completed) — consider auto-completing sessions older than 24 hours

---

## Epic 4: Timer Editing & Polish

**Goal:** Make timer creation and management frictionless — swipe gestures, drag reorder, count modes, and library polish.

**Business Value:** "Build once, replay forever" only works if building is fast and painless. This epic makes the creation UX match the execution UX in quality.

---

### Story 4.1: Swipe-to-Adjust Durations

As a **user**,
I want to swipe on a step's duration to quickly increase or decrease it,
So that adjusting times is fast and tactile.

**Acceptance Criteria:**

**Given** I am on the timer creation or editing page
**When** I swipe right on a step's duration area
**Then** the duration increases by 1 minute per swipe increment
**And** the number updates in real-time as I swipe

**And given** I swipe left on a step's duration
**When** the gesture is detected
**Then** the duration decreases by 1 minute (minimum 1 minute)

**And given** I tap on the duration number
**When** a text input appears
**Then** I can type a specific duration (supports "5m", "5:00", "5", "300s")

**And given** I adjust any step's duration
**When** the change is made
**Then** the total timer duration auto-recalculates and updates

**Prerequisites:** Story 3.4 (all of Epic 3 complete)

**Technical Notes:**
- Use touch events (`touchstart`, `touchmove`, `touchend`) for swipe gesture detection
- Calculate horizontal delta — each ~30px of movement = 1 minute increment
- Provide haptic feedback if available (`navigator.vibrate(10)`)
- Tap-to-type: toggle between swipe mode and input mode
- Duration parsing: regex to handle "5m" / "5:00" / "5" / "300s" formats
- Works on both mobile (touch) and desktop (click-drag)

---

### Story 4.2: Drag-to-Reorder Steps

As a **user**,
I want to drag steps to reorder them in my timer,
So that I can rearrange my routine without deleting and recreating steps.

**Acceptance Criteria:**

**Given** I am on the timer creation or editing page with multiple steps
**When** I long-press (or grab the drag handle on) a step
**Then** the step becomes draggable with a visual lift effect

**And given** I drag the step to a new position
**When** I release it
**Then** the step list reorders and the new order is reflected

**And given** I save the timer after reordering
**When** the save completes
**Then** the new step order is persisted in Firestore

**Prerequisites:** Story 4.1

**Technical Notes:**
- Use a drag-and-drop library (e.g., `@dnd-kit/core` or `react-beautiful-dnd`) — don't reinvent
- Each step row has a drag handle icon on the left
- Visual feedback: lifted step has subtle shadow, drop zone highlighted
- Touch-friendly: works on both mobile and desktop
- Update the steps array order in state, persist on save

---

### Story 4.3: Count-Up / Countdown Toggle

As a **user**,
I want to switch between count-up and countdown display modes for my timers,
So that I can choose the time display that works best for me.

**Acceptance Criteria:**

**Given** I am creating or editing a timer
**When** I toggle the "Countdown mode" switch
**Then** the timer is saved with countdown mode enabled

**And given** I run a timer in countdown mode
**When** the timer is running
**Then** each step shows remaining time counting down (e.g., 4:32 → 4:31 → ...)
**And** overall timer shows total remaining time

**And given** a step overruns in countdown mode
**When** the countdown reaches 0:00
**Then** the display switches to "+0:01 over", "+0:02 over" (count-up of overrun)
**And** the color shifts to warm amber

**And given** no toggle is set (default)
**When** the timer runs
**Then** count-up mode is used (0:00 → 0:01 → ...)

**Prerequisites:** Story 4.2

**Technical Notes:**
- `countdownMode` boolean field on the Timer Template document
- Display logic: if countdown, show `plannedDuration - elapsedTime`; if overrun, show `+(elapsedTime - plannedDuration)`
- The timer engine doesn't change — only the display math
- Color shift on overrun: use the warm amber from the design system

---

### Story 4.4: Timer Library Polish

As a **user**,
I want the timer library to feel polished and informative,
So that finding and managing my routines is a pleasure.

**Acceptance Criteria:**

**Given** I have multiple saved timers
**When** I view the timer library
**Then** each timer card shows: name, total duration, step count, and last used date (or "Never used")

**And given** I view the library on a phone
**When** the screen is narrow
**Then** the layout is a single-column card list, touch-friendly, with large tap targets

**And given** I view the library on a desktop
**When** the screen is wide
**Then** the layout is a responsive grid (2-3 columns)

**And given** I have no timers
**When** I see the empty state
**Then** I see a warm, inviting prompt: illustration/icon + "Create your first timer" + prominent CTA button

**And given** I want quick actions on a timer
**When** I interact with a timer card
**Then** I can: Play (primary action), Edit, Duplicate, Delete — with minimal taps

**Prerequisites:** Story 4.3

**Technical Notes:**
- Responsive layout: Tailwind grid with breakpoint-based columns
- Timer cards: `last_used` field on timer template, updated when a session is created from it
- Empty state: simple illustration or icon + text + button — keep it warm, not clinical
- Quick actions: consider a swipe-reveal pattern on mobile, or a kebab menu, or inline buttons
- Sort timers by last used (most recent first) — most-used routines always at top

---

## Epic 5: AI-Powered Task Breakdown

**Goal:** Enable users to type a task name and receive a complete hierarchical timer generated by AI.

**Business Value:** The "wow moment" — the feature that makes people say "holy crap, show me that again." Demonstrates the product's intelligence and dramatically reduces timer creation friction.

---

### Story 5.1: AI Breakdown API Route

As a **developer**,
I want a server-side API route that sends a task name to an LLM and returns structured timer steps,
So that the AI integration is secure (API keys server-side) and reusable.

**Acceptance Criteria:**

**Given** a POST request to `/api/ai/breakdown` with body `{ taskName: "do laundry" }`
**When** the API route processes the request
**Then** it calls the LLM API (OpenAI or Anthropic) with a prompt engineered for task breakdown
**And** returns a structured JSON response:
```json
{
  "steps": [
    { "name": "Sort clothes by color/fabric", "durationMinutes": 5 },
    { "name": "Load washing machine", "durationMinutes": 3 },
    { "name": "Add detergent and start cycle", "durationMinutes": 2 },
    ...
  ],
  "totalDurationMinutes": 45
}
```

**And given** the user is not authenticated
**When** they call the API
**Then** the request is rejected with 401

**And given** the user exceeds the rate limit (20/day)
**When** they call the API
**Then** the request is rejected with 429 and a friendly message

**And given** the LLM API is unavailable or errors
**When** the API route catches the error
**Then** it returns a 503 with a friendly error message

**Prerequisites:** Story 4.4 (all of Epic 4 complete)

**Technical Notes:**
- Next.js API route at `app/api/ai/breakdown/route.ts`
- LLM API key stored in environment variable (never exposed to client)
- Prompt engineering: "Break this task into sequential steps for someone executing it. Return JSON array of {name, durationMinutes}. Be practical and realistic."
- Use structured output / JSON mode if available (OpenAI `response_format: { type: "json_object" }`)
- Rate limiting: simple counter in Firestore (`users/{userId}/aiUsage/{date}`) — increment on each call, reject if > 20
- Auth: verify Firebase ID token in the API route

---

### Story 5.2: AI Breakdown UI — Input & Loading

As a **user**,
I want to type a task name and trigger an AI breakdown with clear loading feedback,
So that I can generate a timer from natural language.

**Acceptance Criteria:**

**Given** I am on the timer creation page
**When** I see the AI breakdown section
**Then** there is a text input with placeholder "Describe your task..." and a "Break it down ✨" button

**And given** I type "make pasta carbonara" and tap the button
**When** the AI is processing
**Then** I see a loading indicator (spinner or skeleton steps) with text like "Breaking it down..."

**And given** the AI returns results
**When** the steps populate
**Then** the timer creation form is filled with the generated steps (names and durations)
**And** I can see and edit all generated steps before saving

**And given** the AI request fails (network error, rate limit, etc.)
**When** the error occurs
**Then** I see a friendly message: "Couldn't generate steps — try again or create manually"
**And** the manual creation form remains fully usable

**Prerequisites:** Story 5.1

**Technical Notes:**
- AI input section at the top of the timer creation page (above manual step entry)
- On successful response, populate the steps array in form state
- User has NOT saved yet — they can freely edit the AI-generated steps
- Loading state: disable the button, show spinner, prevent double-submit
- Error state: toast or inline message, non-blocking

---

### Story 5.3: AI Breakdown — Edit, Regenerate & Save

As a **user**,
I want to edit AI-generated steps and optionally regenerate before saving,
So that the final timer is exactly what I need.

**Acceptance Criteria:**

**Given** the AI has generated steps in the timer creation form
**When** I view the generated steps
**Then** I can:
- Edit any step name (inline)
- Adjust any step duration (swipe or tap-to-type, per Story 4.1)
- Delete any step
- Add additional steps manually
- Reorder steps (drag, per Story 4.2)

**And given** I'm not satisfied with the AI results
**When** I tap "Regenerate"
**Then** a new AI request is sent (same task name) and results replace the current steps
**And** this counts toward the daily rate limit

**And given** I want to name the timer
**When** the AI populates steps
**Then** the timer name field is auto-filled with the task name (e.g., "Make Pasta Carbonara") but editable

**And given** I'm happy with the steps
**When** I tap "Save"
**Then** the timer is saved to my library like any manually created timer

**Prerequisites:** Story 5.2

**Technical Notes:**
- Regenerate: re-call the API route with the same taskName, replace steps in form state
- Auto-fill timer name: capitalize the task input as the default timer name
- The save flow is identical to manual timer creation (Story 1.4) — the AI just pre-populates the form
- All editing capabilities from Epic 4 (swipe, drag, etc.) work on AI-generated steps

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
