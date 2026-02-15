# Story 3.4: Active Session Detection & Routing

Status: ready-for-dev

## Story

As a **user**,
I want the app to automatically show me my running timer when I open it,
so that I don't have to navigate to find my active session.

## Acceptance Criteria

1. **AC13:** Active session (status `running` or `paused`) auto-redirects to running timer view on app open
2. **AC14:** No active session → normal timer library display
3. **AC15:** Completed session → no redirect, normal library
4. **AC-extra-1:** Active session check runs after auth is confirmed
5. **AC-extra-2:** Check is a quick Firestore query (not a full collection listener)
6. **AC-extra-3:** Stale sessions (> 24h old) still redirect — user can Stop to clear

## Tasks / Subtasks

- [ ] **Task 1: Add active session query** (AC: 13, 14, 15, extra-2)
  - [ ] Add to `src/lib/firebase/sessions.ts`:
    ```typescript
    async function getActiveSession(userId: string): Promise<{ data: RunSession | null; error: Error | null }>
    ```
  - [ ] Query: `where('status', 'in', ['running', 'paused'])`, `limit(1)`
  - [ ] Return first match or null

- [ ] **Task 2: Implement auto-redirect in app layout** (AC: 13, 14, extra-1)
  - [ ] Update `src/app/app/layout.tsx`:
    - After auth confirmed and user loaded
    - Call `getActiveSession(userId)`
    - If active session found: `router.replace(/app/sessions/${session.id})`
    - If not found: render children normally (timer library)
  - [ ] Show loading state during check

- [ ] **Task 3: Handle edge cases** (AC: 15, extra-3)
  - [ ] Completed session: query only matches `running`/`paused` — completed sessions excluded automatically
  - [ ] Stale session (> 24h): still redirect, user can Stop to return to library
  - [ ] Multiple active sessions (shouldn't happen): take the most recent one

- [ ] **Task 4: Write tests** (AC: 13-15)
  - [ ] Mock Firestore query: active session → redirect
  - [ ] Mock Firestore query: no active session → show library
  - [ ] Mock Firestore query: completed session → show library
  - [ ] Verify: `npm run test`

## Dev Notes

### References

- [Source: docs/tech-spec-epic-3.md#Active-Session-Detection] — Query and redirect logic
- [Source: docs/ux-design-specification.md#5.1-Flow-2] — Zero-navigation app open
- [Source: docs/epics.md#Story-3.4] — Original epic story definition

## Dev Agent Record

### Context Reference

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
