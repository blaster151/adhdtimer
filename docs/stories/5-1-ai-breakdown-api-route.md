# Story 5.1: AI Breakdown API Route

## Status: ready-for-dev

## Story

As a **developer**,
I want a server-side API route that sends a task name to an LLM and returns structured timer steps,
So that the AI integration is secure (API keys server-side) and reusable.

## Prerequisites

- Story 4.4 complete (all of Epic 4 complete)
- Firebase Auth configured (Story 1.2)
- Firestore security rules deployed (Story 1.3)

## Acceptance Criteria (ACs)

### AC 5.1.1 — Successful Breakdown
**Given** a POST request to `/api/ai/breakdown` with body `{ taskName: "do laundry" }` and valid auth token
**When** the API route processes the request
**Then** it returns 200 with structured JSON:
```json
{
  "timerName": "Do Laundry",
  "steps": [
    { "name": "Sort clothes by color/fabric", "durationMinutes": 5 },
    { "name": "Load washing machine", "durationMinutes": 3 },
    ...
  ]
}
```

### AC 5.1.2 — Authentication Required
**Given** the user is not authenticated (missing or invalid token)
**When** they call the API
**Then** the request is rejected with 401
**And** response body: `{ error: "Please sign in to use AI breakdown" }`

### AC 5.1.3 — Rate Limiting
**Given** the user has exceeded 20 AI calls today
**When** they call the API
**Then** the request is rejected with 429
**And** response body: `{ error: "You've used all 20 AI breakdowns today. Try again tomorrow!" }`

### AC 5.1.4 — LLM Failure with Fallback
**Given** the primary LLM (OpenAI) is unavailable
**When** the API route catches the error
**Then** it tries the fallback LLM (Anthropic)
**And** returns the successful response from the fallback

### AC 5.1.5 — Both LLMs Fail
**Given** both OpenAI and Anthropic are unavailable
**When** the API route catches both errors
**Then** it returns 503
**And** response body: `{ error: "Couldn't generate steps right now. Please try again or create manually." }`

### AC 5.1.6 — API Keys Server-Side Only
**Given** the API route uses `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`
**When** the client bundle is built
**Then** neither key appears in client-side JavaScript (no `NEXT_PUBLIC_` prefix)

### AC 5.1.7 — Atomic Rate Counter
**Given** multiple rapid AI requests from the same user
**When** the rate limit counter is incremented
**Then** it uses Firestore `FieldValue.increment(1)` for atomic update
**And** no race condition allows exceeding 20 calls

## Tasks

### Task 1: Install Dependencies
- Add `openai`, `@anthropic-ai/sdk`, and `jose` to project dependencies
- `jose` for lightweight JWT verification (avoids needing firebase-admin)
- Add `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` to `.env.local` template

### Task 2: Create AI Prompt Template
- **File:** `src/lib/ai/prompt.ts`
- Export `TASK_BREAKDOWN_PROMPT` constant with the engineered prompt
- Prompt instructs LLM to return 3-12 steps, realistic durations, JSON format
- Export helper to construct the full message array for each LLM provider

### Task 3: Create Token Verification Utility
- **File:** `src/lib/firebase/auth-server.ts` (new server-only file)
- Use `jose` library to verify Firebase ID tokens:
  - Fetch JWKS from Google's endpoint
  - Verify signature, expiration, audience (Firebase project ID), issuer
  - Extract `uid` from payload
- Cache JWKS for performance (jose handles this internally)
- Return `{ uid: string }` on success, throw on failure

### Task 4: Implement API Route
- **File:** `src/app/api/ai/breakdown/route.ts`
- Parse request body, validate `taskName` (non-empty string)
- Verify Firebase token → extract userId
- Check rate limit: read `users/{userId}/aiUsage/{today}` document
  - If `count >= 20`: return 429
- Call OpenAI `gpt-4o-mini` with JSON mode (`response_format: { type: 'json_object' }`)
  - Temperature: 0.7, max_tokens: 1000
- If OpenAI fails: call Anthropic Claude as fallback
- Parse and validate response JSON (ensure `steps` array, positive durations)
- Increment rate limit counter: `FieldValue.increment(1)`
- Return 200 with parsed result

### Task 5: Create Response Validation
- Validate LLM JSON output matches expected schema
- Ensure `steps` is a non-empty array
- Ensure each step has `name` (string) and `durationMinutes` (positive number)
- Clamp durations: minimum 1 minute, maximum 120 minutes per step
- If validation fails: treat as LLM failure (try fallback or return 503)

### Task 6: Tests
- Integration test (MSW): mock OpenAI response → verify 200 + correct JSON structure
- Integration test: missing auth token → 401
- Integration test: mock Firestore counter ≥ 20 → 429
- Integration test: mock OpenAI failure → Anthropic fallback → 200
- Integration test: mock both LLM failures → 503
- Unit test: prompt template contains required instructions
- Unit test: response validation rejects malformed JSON
- Unit test: token verification with mock JWKS

## Dev Notes

- **Token verification:** The architecture avoids `firebase-admin` (per ADR-2). Use `jose` for lightweight JWT verification. The JWKS URL for Firebase tokens is `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`. Verify: `iss` = `https://securetoken.google.com/{projectId}`, `aud` = `{projectId}`, `exp` > now.
- **Firestore access from API route:** The API route runs server-side but uses the client Firestore SDK initialized with the public Firebase config. Rate limit docs are under the user's own path, so security rules allow access. The route acts on behalf of the authenticated user.
- **Cost estimate:** gpt-4o-mini is ~$0.15/1M input tokens, ~$0.60/1M output tokens. A typical breakdown request costs < $0.01. At 20 requests/day/user, cost is negligible.
- **Timeout:** Set a 15-second timeout on LLM API calls. If timeout, try fallback.
