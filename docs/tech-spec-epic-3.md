# Epic Technical Specification: Real-Time Sync

Date: 2026-02-14
Author: BMad
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 enables multi-device real-time sync — the "magic" feature where a user starts their morning routine on their phone in the bathroom and continues it on their laptop at the desk. It introduces Firestore real-time listeners (`onSnapshot`), device control handoff (controller vs observer mode), offline/reconnect resilience, and active session auto-detection on app open.

This epic covers PRD feature FR10 (multi-device sync) and FR11 (session detection/routing). It builds on the complete Epic 1+2 foundation (auth, data model, timer engine, guided execution, TTS, wake lock).

## Objectives and Scope

### In Scope

- Firestore `onSnapshot` real-time listener on active RunSession document
- `useFirestoreSession` hook for real-time session data
- Observer mode: read-only view of timer from non-controlling device
- Controller mode: full playback controls (existing from Epic 1)
- "Take Control" button for device handoff
- `activeDeviceId` field management and checking
- `useDeviceId` hook (unique ID per browser session via `sessionStorage`)
- Observer banner component ("Controlled from another device")
- Offline/reconnect handling with Firestore persistence enabled
- Last-write-wins conflict resolution (acceptable for single-user v1)
- Active session detection on app load (query for running/paused sessions)
- Auto-redirect to running session on app open
- Stale session handling (sessions > 24h old)

### Out of Scope

- Multi-user shared timers (v1 is personal use only)
- Custom conflict resolution beyond last-write-wins
- Push notifications for session state changes
- Offline timer creation (requires online to create session and enable sync)
- Session history / run log viewing

## System Architecture Alignment

| Architecture Module | Epic 3 Usage |
|-------------------|-------------|
| `src/hooks/use-firestore-session.ts` | **NEW** — real-time `onSnapshot` listener on RunSession doc |
| `src/hooks/use-device-id.ts` | **NEW** — unique device ID via `sessionStorage` |
| `src/hooks/use-timer-engine.ts` | **Modified** — accept external session updates (observer mode) |
| `src/components/session/running-timer.tsx` | **Modified** — controller vs observer mode switching |
| `src/components/session/observer-banner.tsx` | **NEW** — "Controlled from another device" + Take Control |
| `src/components/session/playback-controls.tsx` | **Modified** — disabled in observer mode |
| `src/app/app/layout.tsx` | **Modified** — active session check on mount |
| `src/lib/firebase/sessions.ts` | **Modified** — add `onSnapshot` listener, active session query |

**Constraints from architecture:**
- `onSnapshot` listener on single session document (not entire collection)
- `activeDeviceId` is a string field in RunSession, stored in `sessionStorage` per device
- Last-write-wins is Firestore's default — no custom conflict resolution needed
- Firestore offline persistence enabled via `enablePersistence()`
- Starting new timers requires online (session doc creation needs sync)
- Timer engine uses timestamps, inherently resilient to sync delays

## Detailed Design

### useFirestoreSession Hook

```typescript
interface UseFirestoreSessionReturn {
  session: RunSession | null;
  loading: boolean;
  error: Error | null;
}

function useFirestoreSession(userId: string, sessionId: string): UseFirestoreSessionReturn {
  // Subscribe to onSnapshot(doc(db, 'users', userId, 'sessions', sessionId))
  // Update local state on each snapshot
  // Unsubscribe on unmount
}
```

**Real-time data flow:**
- Controller device writes state changes → Firestore → `onSnapshot` fires on all listeners → Observer devices update their UI

### useDeviceId Hook

```typescript
function useDeviceId(): string {
  // Check sessionStorage for 'adhd-timer-device-id'
  // If not found, generate crypto.randomUUID(), store in sessionStorage
  // Return the device ID
}
```

- `sessionStorage` = unique per browser tab session
- Survives page refresh within same tab
- New tab = new device ID (correct behavior for multi-device)

### Controller vs Observer Mode

**Determination:** `session.activeDeviceId === myDeviceId`

| Mode | Controls | Writes | Banner |
|------|----------|--------|--------|
| Controller | Full playback controls enabled | Writes state changes to Firestore | None |
| Observer | Controls disabled/hidden | Does NOT write (reads only via `onSnapshot`) | "Controlled from another device" + "Take Control" button |

**Take Control Flow:**
1. Observer taps "Take Control"
2. Write `{ activeDeviceId: myDeviceId }` to session document
3. `onSnapshot` fires on all devices
4. Previous controller sees `activeDeviceId !== myDeviceId` → becomes observer
5. New controller sees `activeDeviceId === myDeviceId` → becomes controller
6. No timer interruption — seamless transition

### Active Session Detection

On app load (after auth), in `src/app/app/layout.tsx`:

```typescript
// Query for active sessions
const q = query(
  collection(db, 'users', userId, 'sessions'),
  where('status', 'in', ['running', 'paused']),
  limit(1)
);
const snapshot = await getDocs(q);
if (!snapshot.empty) {
  const activeSession = snapshot.docs[0];
  router.replace(`/app/sessions/${activeSession.id}`);
}
```

**Stale session handling:** If session `startedAt` is > 24 hours ago, still redirect but user can Stop to clear it.

### Offline/Reconnect Handling

- Enable Firestore offline persistence in `config.ts`: `enableMultiTabIndexedDbPersistence(db)`
- Timer engine continues locally using timestamp math (inherently accurate offline)
- Firestore SDK queues writes when offline; replays on reconnect
- `onSnapshot` listeners automatically reconnect
- Starting a new timer while offline: blocked with message "Connect to internet to start a timer"

## Acceptance Criteria (Authoritative)

| # | Acceptance Criterion | Source Story |
|---|---------------------|-------------|
| AC1 | Opening app on Device B shows currently active session from Device A in real-time | 3.1 |
| AC2 | Step transitions on Device A appear on Device B within 2-3 seconds | 3.1 |
| AC3 | Paused state on Device A shows as paused on Device B | 3.1 |
| AC4 | Device B shows timer in read-only (observer) mode with "Take Control" button | 3.2 |
| AC5 | Tapping "Take Control" on Device B makes it the controller; Device A becomes observer | 3.2 |
| AC6 | Control transfer is seamless — no timer interruption | 3.2 |
| AC7 | Controller device uses all playback controls normally (pause, skip, extend) | 3.2 |
| AC8 | Observer controls are visually disabled | 3.2 |
| AC9 | Timer continues locally when device loses internet | 3.3 |
| AC10 | On reconnect, local state syncs back to Firestore within seconds | 3.3 |
| AC11 | Cached data shown when opening app offline | 3.3 |
| AC12 | Starting a new timer while offline shows friendly "connect to internet" message | 3.3 |
| AC13 | Active session (running/paused) auto-redirects user to running timer on app open | 3.4 |
| AC14 | No active session → normal timer library display | 3.4 |
| AC15 | Completed session → no redirect (normal library) | 3.4 |

## Test Strategy Summary

| Layer | Tool | Coverage |
|-------|------|---------|
| **Unit** | Vitest | `useDeviceId` (generation, persistence), `useFirestoreSession` (mock onSnapshot), active session query logic |
| **Component** | Vitest + RTL | `ObserverBanner` (renders, Take Control click), `RunningTimer` (controller vs observer mode), `PlaybackControls` (disabled in observer) |
| **Integration** | Vitest + mock Firestore | Session detection flow, control handoff, offline state |
| **Manual** | Developer testing | Two browser tabs as two devices: play on tab A, observe on tab B, take control, pause/resume sync, offline test |

**Test file co-location:**
- `src/hooks/use-firestore-session.test.ts`
- `src/hooks/use-device-id.test.ts`
- `src/components/session/observer-banner.test.tsx`
