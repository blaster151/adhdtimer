# Story 1.2: Firebase Authentication

Status: ready-for-dev

## Story

As a **user**,
I want to sign in with Google or email/password,
so that my timers are saved to my account and accessible from any device.

## Acceptance Criteria

1. **AC7:** Clicking "Sign in with Google" redirects to Google OAuth and, after successful auth, redirects to the timer library page (empty state)
2. **AC8:** Email/password sign-in creates an account (if new) or signs in (if existing) and redirects to the timer library page
3. **AC9:** Auth session persists across page refresh and new browser tabs
4. **AC10:** Clicking "Sign out" signs the user out and returns them to the landing page
5. **AC11:** Unauthenticated access to any `/app/*` route redirects to `/login`
6. **AC-extra-1:** Loading state is displayed while auth state is being determined (no flash of wrong page)
7. **AC-extra-2:** Auth errors (invalid email, wrong password, popup closed) display a user-friendly toast message

## Tasks / Subtasks

- [ ] **Task 1: Create AuthProvider context** (AC: 9, extra-1)
  - [ ] Create `src/components/auth/auth-provider.tsx` as a `'use client'` component
  - [ ] Initialize Firebase Auth `onAuthStateChanged` listener in `useEffect`
  - [ ] Expose `{ user, loading, signIn, signOut }` via React context
  - [ ] Wrap the app in `AuthProvider` inside `src/app/layout.tsx`
  - [ ] Add loading skeleton/spinner while `loading === true`

- [ ] **Task 2: Create useAuth hook** (AC: 9)
  - [ ] Create `src/hooks/use-auth.ts` that consumes the auth context
  - [ ] Throw clear error if used outside `AuthProvider`
  - [ ] Return typed `{ user: User | null, loading: boolean, signIn, signOut }`

- [ ] **Task 3: Create Firebase auth helpers** (AC: 7, 8, 10)
  - [ ] Create `src/lib/firebase/auth.ts` with:
    - `signInWithGoogle()` — uses `signInWithPopup(auth, new GoogleAuthProvider())`
    - `signInWithEmail(email, password)` — uses `signInWithEmailAndPassword`
    - `signUpWithEmail(email, password)` — uses `createUserWithEmailAndPassword`
    - `signOutUser()` — uses `signOut(auth)`
  - [ ] Each function returns `{ data, error }` tuple (architecture error pattern)
  - [ ] Write unit tests for each helper (mock Firebase Auth)

- [ ] **Task 4: Create Sign-In page** (AC: 7, 8, extra-2)
  - [ ] Create `src/app/login/page.tsx` as a `'use client'` page
  - [ ] Create `src/components/auth/sign-in-form.tsx` with:
    - Google sign-in button (primary CTA, uses shadcn `Button`)
    - Divider ("or")
    - Email + password form (shadcn `Input`, `Label`, `Form`)
    - Toggle between "Sign In" and "Create Account" modes
    - Submit button
  - [ ] On success: redirect to `/app` using `router.push`
  - [ ] On error: display error message via shadcn `toast`
  - [ ] If user is already authenticated, redirect to `/app` immediately
  - [ ] Style with Deep Forest theme tokens

- [ ] **Task 5: Create AuthGuard component** (AC: 11, extra-1)
  - [ ] Create `src/components/auth/auth-guard.tsx`
  - [ ] If `loading`: show skeleton loader
  - [ ] If `!user`: redirect to `/login` via `router.replace`
  - [ ] If `user`: render `children`
  - [ ] Create `src/app/app/layout.tsx` wrapping content with `AuthGuard`

- [ ] **Task 6: Create protected app shell** (AC: 11)
  - [ ] Create `src/app/app/layout.tsx` as `'use client'` layout
  - [ ] Wrap children with `AuthGuard`
  - [ ] Include basic navigation header with app name and sign-out button

- [ ] **Task 7: Create placeholder timer library page** (AC: 7, 8)
  - [ ] Create `src/app/app/page.tsx` as `'use client'` page
  - [ ] Display "Timer Library" heading with user email/name
  - [ ] Display "Coming in Story 1.4" placeholder text
  - [ ] This confirms auth redirect is working end-to-end

- [ ] **Task 8: Update landing page** (AC: 7)
  - [ ] Update `src/app/page.tsx` to include "Sign In" link/button navigating to `/login`
  - [ ] If user is already authenticated, show "Go to Timers" link instead

- [ ] **Task 9: Write tests** (AC: 7, 8, 9, 10, 11)
  - [ ] `src/components/auth/auth-guard.test.tsx` — test redirect when no user, render children when user exists
  - [ ] `src/components/auth/sign-in-form.test.tsx` — test form renders, mock sign-in calls, error display
  - [ ] `src/lib/firebase/auth.test.ts` — test all auth helper functions with mocked Firebase
  - [ ] Verify all tests pass with `npm run test`

## Dev Notes

### Architecture Patterns & Constraints

- **All app pages are client components:** Use `'use client'` directive on `src/app/login/page.tsx`, `src/app/app/layout.tsx`, `src/app/app/page.tsx` [Source: docs/architecture.md#Client-Components]
- **Landing page stays server component:** `src/app/page.tsx` remains SSR. If it needs auth state, use a client sub-component. [Source: docs/architecture.md#SSR]
- **Error handling:** Auth helpers must return `{ data, error }` tuple — never throw. [Source: docs/architecture.md#Error-Handling]
- **No barrel exports:** Import directly from file paths, not `index.ts`. [Source: docs/architecture.md#Code-Organization]
- **No firebase-admin:** Per ADR-2, all auth is client-side only in Epic 1. [Source: docs/architecture.md#ADR-2]

### Firebase Auth Methods

```typescript
// Google Sign-In
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);

// Email/Password
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Auth State Listener
import { onAuthStateChanged } from 'firebase/auth';
onAuthStateChanged(auth, (user) => { ... });
```

### Route Structure After This Story

```
/               → Landing page (public, server component)
/login          → Sign-in form (public, client component)
/app            → Timer library placeholder (protected, client component)
/app/*          → All protected routes (guarded by AuthGuard)
```

### Dependencies on Story 1.1

- Firebase SDK must be installed (`firebase@^12.9`)
- `src/lib/firebase/config.ts` must export initialized `auth` instance
- shadcn/ui components available: `Button`, `Input`, `Label`, `Form`, `toast`
- Deep Forest theme tokens applied in `globals.css`
- Environment variables configured for Firebase

### References

- [Source: docs/tech-spec-epic-1.md#AuthProvider] — AuthProvider component spec
- [Source: docs/tech-spec-epic-1.md#Firebase-Auth-API-surface] — Auth methods used
- [Source: docs/tech-spec-epic-1.md#AC7-AC11] — Acceptance criteria
- [Source: docs/architecture.md#Error-Handling] — `{ data, error }` tuple pattern
- [Source: docs/ux-design-specification.md#7.1-Authentication] — Sign-in UX flow
- [Source: docs/epics.md#Story-1.2] — Original epic story definition

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List
