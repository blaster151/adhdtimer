# Epic 5: AI-Powered Task Breakdown — Technical Context

## Overview

Epic 5 adds the "wow moment" feature: users type a task name and receive a complete AI-generated timer with structured steps and durations. The implementation uses a server-side Next.js API route to securely call LLM APIs (OpenAI primary, Anthropic fallback), with rate limiting via Firestore and client-side form hydration.

**Prerequisites:** All of Epic 4 complete.

---

## Story Mapping

| Story | Focus | Primary Files |
|-------|-------|--------------|
| 5.1 | AI Breakdown API Route | `src/app/api/ai/breakdown/route.ts`, `src/lib/ai/prompt.ts` |
| 5.2 | AI Breakdown UI — Input & Loading | `src/components/timer/ai-breakdown-panel.tsx` |
| 5.3 | AI Edit, Regenerate & Save | `src/components/timer/ai-breakdown-panel.tsx`, `src/components/timer/timer-form.tsx` |

---

## Technical Design

### 5.1 — AI Breakdown API Route

**Endpoint:** `POST /api/ai/breakdown`

**File:** `src/app/api/ai/breakdown/route.ts`

**Request:**
```typescript
// Headers
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

// Body
{
  taskName: string;  // e.g., "make pasta carbonara"
}
```

**Response (200 — Success):**
```typescript
{
  timerName: string;  // e.g., "Make Pasta Carbonara"
  steps: Array<{
    name: string;           // e.g., "Boil water in large pot"
    durationMinutes: number; // e.g., 5
  }>;
}
```

**Error Responses:**
| Status | Condition | Response Body |
|--------|-----------|---------------|
| 401 | Missing or invalid Firebase token | `{ error: "Please sign in to use AI breakdown" }` |
| 429 | Rate limit exceeded (20/day) | `{ error: "You've used all 20 AI breakdowns today. Try again tomorrow!" }` |
| 503 | Both LLM APIs failed | `{ error: "Couldn't generate steps right now. Please try again or create manually." }` |

**Authentication Flow:**
1. Client calls `getIdToken()` on the Firebase user
2. Sends token as `Authorization: Bearer <token>`
3. API route verifies token:
   - Option A: Use `firebase-admin` for `verifyIdToken()` (if admin SDK added)
   - Option B: Manually verify JWT by fetching Google's public keys and validating signature + claims
   - **Recommended for v1:** Use lightweight JWT verification without full admin SDK (per ADR-2 decision to avoid firebase-admin). Use a library like `jose` to verify the token against Google's JWKS endpoint (`https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`)
4. Extract `uid` from verified token payload

**Rate Limiting:**
```typescript
// Firestore document: users/{userId}/aiUsage/{YYYY-MM-DD}
interface AIUsageRecord {
  count: number;  // incremented per AI call
  date: string;   // YYYY-MM-DD (redundant but useful for queries)
}

// Flow:
// 1. Read aiUsage doc for today's date
// 2. If count >= 20: return 429
// 3. Process AI request
// 4. On success: increment count (use Firestore increment to avoid races)
```

- Use `FieldValue.increment(1)` for atomic counter update
- Date key: `new Date().toISOString().split('T')[0]` → "2026-02-14"
- Since rate limit doc is under the user's path, existing security rules allow access

**LLM Integration:**

```typescript
// Primary: OpenAI
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  response_format: { type: 'json_object' },
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Task: "${taskName}"` }
  ],
  temperature: 0.7,
  max_tokens: 1000,
});

// Fallback: Anthropic
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1000,
  messages: [
    { role: 'user', content: `${SYSTEM_PROMPT}\n\nTask: "${taskName}"` }
  ],
});
```

**Fallback Pattern:**
1. Try OpenAI → parse JSON response
2. If OpenAI throws (network, rate limit, timeout): try Anthropic
3. If Anthropic also throws: return 503
4. Parse and validate response JSON (ensure steps array exists, durations are positive numbers)

**Prompt Template (`src/lib/ai/prompt.ts`):**
```typescript
export const TASK_BREAKDOWN_PROMPT = `You are a practical task breakdown assistant. Break the following task into sequential steps that someone would follow to execute it.

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
}`;
```

**Environment Variables:**
| Variable | Scope | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | Server-side only | OpenAI API key |
| `ANTHROPIC_API_KEY` | Server-side only | Anthropic API key |

**Neither should use the `NEXT_PUBLIC_` prefix** — they must never be exposed to the client bundle.

### 5.2 — AI Breakdown UI — Input & Loading

**Component:** `src/components/timer/ai-breakdown-panel.tsx`

**Position:** Top of timer creation page, above the manual step list editor.

**States:**

| State | UI |
|-------|-----|
| **Idle** | Text input with placeholder "Describe your task..." + "Break it down ✨" button |
| **Loading** | Input disabled, button shows spinner, text "Breaking it down...", skeleton step rows below |
| **Success** | Panel collapses/minimizes; steps populate the TimerForm below |
| **Error** | Inline error message: "Couldn't generate steps — try again or create manually." Button re-enabled. |

**Client Integration:**

```typescript
async function handleBreakdown(taskName: string) {
  setLoading(true);
  setError(null);
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/ai/breakdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ taskName }),
    });
    
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error);
    }
    
    const data = await res.json();
    onStepsGenerated(data.timerName, data.steps);
  } catch (err) {
    setError(err.message || "Couldn't generate steps — try again or create manually.");
  } finally {
    setLoading(false);
  }
}
```

**Props Interface:**
```typescript
interface AIBreakdownPanelProps {
  onStepsGenerated: (timerName: string, steps: Array<{ name: string; durationMinutes: number }>) => void;
  disabled?: boolean;  // e.g., when in edit mode
}
```

**Loading Skeleton:**
- 4-6 skeleton rows mimicking step rows (gray shimmer animation)
- Use shadcn `Skeleton` component
- Disappears when real steps populate

**Double-Submit Prevention:**
- Disable button during loading
- Disable input during loading
- Loading state clears on response (success or error)

### 5.3 — AI Edit, Regenerate & Save

**All AI-generated steps populate the same `TimerForm` as manual creation.** The user can:
- Edit any step name inline
- Adjust any step duration (swipe or tap-to-type, per Story 4.1)
- Delete any step
- Add additional steps manually
- Reorder steps (drag, per Story 4.2)

**Auto-Fill Timer Name:**
- On successful AI response, set the timer name field to `data.timerName`
- The name is pre-filled but editable

**Steps Conversion:**
```typescript
// Convert AI response steps to form state
const formSteps = data.steps.map(step => ({
  id: crypto.randomUUID(),
  name: step.name,
  plannedDuration: step.durationMinutes * 60, // convert minutes to seconds
  notes: '',
}));
```

**Regenerate:**
- "Regenerate" button appears after AI steps are populated
- Re-calls the API with the same taskName
- Replaces current steps in form state
- Counts toward daily rate limit
- Shows loading state same as initial request

**Save Flow:**
- Identical to manual timer creation (Story 1.4)
- The AI just pre-populates the form — save uses the same `createTimer()` Firestore function
- No special AI metadata stored on the timer template

---

## Acceptance Criteria Traceability

### Story 5.1 — AI Breakdown API Route
| AC | Description | Source |
|----|-------------|--------|
| AC1 | POST `/api/ai/breakdown` with taskName returns structured steps JSON | Epic 5.1 AC, FR11.2 |
| AC2 | Unauthenticated requests return 401 | Epic 5.1 AC, FR11.4 |
| AC3 | Rate limit (20/day) returns 429 with friendly message | Epic 5.1 AC, FR11.4 |
| AC4 | LLM unavailable returns 503 with friendly message | Epic 5.1 AC, FR11.4 |
| AC5 | OpenAI is primary; Anthropic is fallback | Epic 5.1 Tech Notes |
| AC6 | API keys are server-side only (not exposed to client) | Architecture Security |
| AC7 | Rate limit counter is atomic (Firestore increment) | Architecture |

### Story 5.2 — AI Breakdown UI — Input & Loading
| AC | Description | Source |
|----|-------------|--------|
| AC8 | Text input with placeholder + "Break it down ✨" button visible on creation page | Epic 5.2 AC, FR11.1 |
| AC9 | Loading state shows spinner + "Breaking it down..." + skeleton steps | Epic 5.2 AC |
| AC10 | Success populates TimerForm with generated steps | Epic 5.2 AC, FR11.3 |
| AC11 | Error shows friendly inline message; manual form remains usable | Epic 5.2 AC, FR11.4 |
| AC12 | Button disabled during loading (no double-submit) | Epic 5.2 Tech Notes |

### Story 5.3 — AI Edit, Regenerate & Save
| AC | Description | Source |
|----|-------------|--------|
| AC13 | Generated steps are fully editable (name, duration, delete, add, reorder) | Epic 5.3 AC, FR11.3 |
| AC14 | "Regenerate" button sends new AI request and replaces steps | Epic 5.3 AC, FR11.3 |
| AC15 | Timer name auto-filled from AI response but editable | Epic 5.3 AC |
| AC16 | Save uses normal timer CRUD flow (identical to manual creation) | Epic 5.3 AC |
| AC17 | All Epic 4 interactions (swipe, drag) work on AI-generated steps | Epic 5.3 AC |
| AC18 | Regenerate counts toward daily rate limit | Epic 5.3 Tech Notes |

**Total: 18 ACs**

---

## Dependencies

### NPM Packages (New)
| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | latest | OpenAI API client |
| `@anthropic-ai/sdk` | latest | Anthropic API client |
| `jose` | latest | JWT verification (lightweight alternative to firebase-admin) |

### Environment Variables (New)
| Variable | Where Set | Description |
|----------|-----------|-------------|
| `OPENAI_API_KEY` | GCP Cloud Run secrets / `.env.local` | OpenAI API key |
| `ANTHROPIC_API_KEY` | GCP Cloud Run secrets / `.env.local` | Anthropic API key |

### Dependencies on Prior Epics
| Dependency | From | Required For |
|-----------|------|-------------|
| `TimerForm` component | Story 1.4 | Stories 5.2, 5.3 (hydrate with AI steps) |
| Timer CRUD (`createTimer`) | Story 1.4 | Story 5.3 (save uses same function) |
| Firebase Auth (`getIdToken`) | Story 1.2 | Story 5.1 (auth header) |
| Swipe-to-adjust | Story 4.1 | Story 5.3 (works on AI-generated steps) |
| Drag-to-reorder | Story 4.2 | Story 5.3 (works on AI-generated steps) |
| Firestore security rules | Story 1.3 | Story 5.1 (rate limit doc under user path) |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| API key exposure | Keys in server-side env vars only; never `NEXT_PUBLIC_` |
| Unauthorized AI access | Verify Firebase ID token on every request |
| Cost control | 20 calls/day/user rate limit; gpt-4o-mini is cost-effective (~$0.01/call) |
| Prompt injection | Task name is inserted into a structured prompt; LLM output is parsed as JSON (not executed) |
| Invalid LLM output | Validate response JSON schema; reject malformed responses and return 503 |

---

## Test Strategy

| Test | Type | Coverage |
|------|------|----------|
| API route — success path | Integration (Vitest + MSW) | Mock OpenAI response, verify 200 + correct JSON |
| API route — auth failure | Integration | Missing/invalid token → 401 |
| API route — rate limit | Integration | Mock Firestore counter ≥ 20 → 429 |
| API route — OpenAI failure, Anthropic success | Integration | Mock OpenAI error → Anthropic fallback → 200 |
| API route — both LLMs fail | Integration | Mock both errors → 503 |
| Prompt template | Unit | Verify prompt string contains required instructions |
| AIBreakdownPanel — idle state | Component (RTL) | Input + button rendered |
| AIBreakdownPanel — loading state | Component (RTL) | Spinner + skeleton visible, button disabled |
| AIBreakdownPanel — success | Component (RTL) | onStepsGenerated callback called with correct data |
| AIBreakdownPanel — error | Component (RTL) | Error message displayed, form still usable |
| Regenerate flow | Component (RTL) | Steps replaced on regenerate |
| Save after AI | Integration | AI steps saved via normal CRUD |
