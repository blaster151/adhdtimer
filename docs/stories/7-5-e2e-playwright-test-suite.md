# Story 7.5: End-to-End Playwright Test Suite

Status: in-progress

## Story

As a **developer**,
I want a Playwright e2e test suite covering all critical user flows,
So that regressions in cross-component integration, routing, and real-browser behavior are caught automatically.

## Acceptance Criteria

1. **AC1:** Playwright is installed with a `playwright.config.ts` at project root
2. **AC2:** npm scripts exist: `test:e2e` (headless) and `test:e2e:ui` (interactive Playwright UI)
3. **AC3:** Firebase Auth and Firestore emulators are used for all e2e tests — no production data touched
4. **AC4:** A reusable auth helper signs in a test user via the Firebase Auth emulator before each test
5. **AC5:** Happy-path flow passes: sign in → see timer library → create timer with 3 steps → run to completion
6. **AC6:** Timer CRUD flows pass: create, edit (rename + reorder steps), duplicate, delete
7. **AC7:** Playback flow passes: play → pause → resume → skip → extend → complete
8. **AC8:** Step-type variations pass: active step runs normally, wait step auto-completes, checkpoint shows manual advance
9. **AC9:** Defer flow passes: defer a step → resolve (start) → completion view shows deferred stats
10. **AC10:** Pause-between-steps flow passes: toggle on → steps pause for manual advance between each
11. **AC11:** All e2e tests pass in CI (Cloud Build) as a pre-deploy gate
12. **AC12:** Tests run against Chromium only (mobile viewport optional stretch goal)

## Tasks / Subtasks

- [x] **Task 1: Install Playwright & configure** (AC: 1, 2, 12)
  - [x] Install: `@playwright/test` as devDependency
  - [x] Run `npx playwright install chromium` (Chromium only — keep CI fast)
  - [ ] Create `playwright.config.ts`:
    ```typescript
    import { defineConfig } from '@playwright/test';

    export default defineConfig({
      testDir: './e2e',
      fullyParallel: false,        // Sequential — shared emulator state
      forbidOnly: !!process.env.CI,
      retries: process.env.CI ? 1 : 0,
      workers: 1,                   // Single worker — Firebase emulator
      reporter: process.env.CI ? 'github' : 'html',
      use: {
        baseURL: 'http://localhost:3002',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
      },
      projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
      ],
      webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3002',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
    });
    ```
  - [ ] Add npm scripts to `package.json`:
    ```json
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
    ```
  - [ ] Add to `.gitignore`: `playwright-report/`, `test-results/`, `blob-report/`
  - [ ] Create `e2e/` directory at project root

- [x] **Task 2: Firebase emulator integration** (AC: 3, 4)
  - [ ] Create `e2e/helpers/firebase-emulator.ts`:
    - Export `EMULATOR_AUTH_URL` = `http://localhost:9099`
    - Export `EMULATOR_FIRESTORE_URL` = `http://localhost:8080`
    - `clearFirestoreData()` — HTTP call to emulator clear endpoint
    - `clearAuthUsers()` — HTTP call to auth emulator clear endpoint
    - `createTestUser(email, password)` — HTTP call to auth emulator to create user
  - [ ] Create `e2e/helpers/auth.ts`:
    - `signInTestUser(page)` — navigates to `/login`, fills email/password, clicks sign in, waits for `/app` redirect
    - Uses a well-known test user: `test@adhdtimer.test` / `testpassword123`
  - [ ] Create `e2e/fixtures.ts` — custom Playwright test fixture that:
    - Before all: creates test user in auth emulator
    - Before each: clears Firestore data (clean slate)
    - After all: clears auth users
  - [ ] Document: developers must run `npx firebase emulators:start` before `npm run test:e2e`
  - [ ] Set env vars for emulator connection in Playwright config or `.env.test`:
    ```
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
    NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
    ```
  - [ ] Verify: app detects emulator env vars and connects to emulators (update `config.ts` if needed with `connectAuthEmulator` / `connectFirestoreEmulator`)

- [x] **Task 3: Auth & navigation smoke test** (AC: 4, 5)
  - [ ] Create `e2e/auth.spec.ts`:
    - Test: unauthenticated user visiting `/app` redirects to `/login`
    - Test: sign in with valid credentials → redirects to `/app` → timer library visible
    - Test: sign in with invalid credentials → error message shown
    - Test: empty library state — "No timers yet" or equivalent CTA visible

- [x] **Task 4: Timer CRUD e2e tests** (AC: 5, 6)
  - [ ] Create `e2e/timer-crud.spec.ts`:
    - Test: create timer — click "New Timer" → fill name + 3 steps with durations → save → appears in library
    - Test: edit timer — click timer → edit → change name → save → updated in library
    - Test: edit steps — reorder steps via drag (or add/remove steps) → save → persisted
    - Test: duplicate timer — long-press or menu → duplicate → copy appears in library
    - Test: delete timer — menu → delete → confirm → removed from library
    - Test: create timer with step types — add active, wait, and checkpoint steps → save

- [x] **Task 5: Core playback e2e tests** (AC: 5, 7, 8, 10)
  - [ ] Create `e2e/playback.spec.ts`:
    - **Setup helper:** `createTimerWithSteps(page, name, steps[])` — creates a timer via UI, returns timer card locator
    - Test: play timer → progress ring visible → time counting → step name displayed
    - Test: pause/resume — pause mid-step → time stops → resume → time continues
    - Test: skip — skip current step → advances to next step
    - Test: extend — tap extend (+1 min or configured) → duration increases
    - Test: complete — run through all steps (skip through) → completion view with stats
    - Test: wait step — wait step auto-completes when timer reaches 0
    - Test: checkpoint step — checkpoint shows manual advance UI → tap "Start [Next Step]" → advances
    - Test: pause-between-steps — toggle on before starting → after each step, manual advance prompt appears

- [x] **Task 6: Defer flow e2e tests** (AC: 9)
  - [ ] Create `e2e/defer.spec.ts`:
    - Test: defer a step — tap Defer → step marked deferred → badge shows "1 deferred ↩" → next step starts
    - Test: resolve deferred — after all main steps, deferred resolution screen → tap "Start" → step runs → completes
    - Test: skip deferred — in resolution, tap "Skip" → step skipped → completion view
    - Test: defer again — in resolution, tap "Defer again" → re-queued → presented again
    - Test: completion view shows deferred summary — "N deferred, M completed, K skipped"

- [ ] **Task 7: CI integration** (AC: 11)
  - [ ] Update `cloudbuild.yaml` to add e2e step:
    - Install Firebase tools in CI image
    - Start Firebase emulators (background)
    - Start Next.js dev server (background)
    - Wait for both to be ready
    - Run `npx playwright test`
    - Upload test results as artifacts on failure
  - [ ] Alternatively: add a `docker-compose.test.yaml` that orchestrates emulators + app + Playwright
  - [ ] Verify: CI fails if any e2e test fails (gate deployment)

## Dev Notes

### Architecture Patterns & Constraints

- **Firebase Emulator Suite:** Already configured in `firebase.json` — auth on port 9099, Firestore on port 8080, UI on port 4000. [Source: firebase.json]
- **App port:** Dev server runs on port 3002. [Source: package.json `dev` script]
- **Test isolation:** Each test gets a clean Firestore — use emulator REST API to clear between tests. Auth user persists across tests (created once in `beforeAll`).
- **No production data:** The `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` env var tells the Firebase SDK to route all auth calls to the emulator. Same pattern for Firestore via `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST`.
- **Sequential execution:** Firebase emulators don't support concurrent test isolation well. Run with `workers: 1`.

### Emulator Connection

The app's `src/lib/firebase/config.ts` may need a small update to detect emulator env vars:

```typescript
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';

if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST) {
  connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
}
if (process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, parseInt(port));
}
```

### Key Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing → redirects to `/login` or `/app` |
| `/login` | Sign-in form (Google + email/password) |
| `/app` | Timer library (list of user's timers) |
| `/app/timers/new` | Create new timer |
| `/app/timers/[timerId]/edit` | Edit existing timer |
| `/app/sessions/[sessionId]` | Running timer session |

### Test Data Strategy

- **Test user:** `test@adhdtimer.test` / `testpassword123` — created in auth emulator
- **Timers:** Created via UI in each test (or in `beforeEach` via a shared helper)
- **No seed data:** Each test creates what it needs from scratch for full isolation
- **Short durations:** Use 3–5 second steps in e2e tests to keep execution fast

### Playwright Best Practices Applied

- Use `page.getByRole()`, `page.getByText()`, `page.getByLabel()` over CSS selectors
- Use `expect(locator).toBeVisible()` over `waitForSelector`
- Use `test.describe` to group related flows
- Use `test.slow()` for inherently slow flows (full timer completion)
- Use `page.clock` API to manipulate time for timer-based tests (avoid real-time waits)

## Estimation

| Task | Effort | Notes |
|------|--------|-------|
| Task 1 | Small | Config + install |
| Task 2 | Medium | Emulator helpers + fixture setup + config.ts update |
| Task 3 | Small | 4 basic navigation tests |
| Task 4 | Medium | 6 CRUD tests, some complex (drag reorder) |
| Task 5 | Large | 8 playback tests, timer manipulation |
| Task 6 | Medium | 5 defer-specific tests |
| Task 7 | Medium | CI pipeline changes |
| **Total** | **~1 large session** | |
