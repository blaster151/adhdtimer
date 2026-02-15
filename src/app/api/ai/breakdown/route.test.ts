import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- Mocks ----

const mockVerifyFirebaseToken = vi.fn();
vi.mock('@/lib/firebase/auth-server', () => ({
  verifyFirebaseToken: (...args: unknown[]) => mockVerifyFirebaseToken(...args),
}));

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => args.join('/'),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  increment: (n: number) => ({ __increment: n }),
}));

vi.mock('@/lib/firebase/config', () => ({
  db: 'mock-db',
}));

const mockOpenAICreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: (...args: unknown[]) => mockOpenAICreate(...args),
        },
      };
    },
  };
});

const mockAnthropicCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: (...args: unknown[]) => mockAnthropicCreate(...args),
      };
    },
  };
});

// Stub env vars so the LLM client guards pass
vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key');

// Import after mocks
const { POST } = await import('@/app/api/ai/breakdown/route');

// ---- Helpers ----

const validLLMResponse = {
  timerName: 'Do Laundry',
  steps: [
    { name: 'Sort clothes', durationMinutes: 5 },
    { name: 'Load washer', durationMinutes: 3 },
    { name: 'Start cycle', durationMinutes: 1 },
  ],
};

function makeOpenAIResponse(content: unknown) {
  return {
    choices: [{ message: { content: JSON.stringify(content) } }],
  };
}

function makeAnthropicResponse(content: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(content) }],
  };
}

function makeRequest(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  return new NextRequest('http://localhost:3000/api/ai/breakdown', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function mockAuthSuccess(uid = 'user-123') {
  mockVerifyFirebaseToken.mockResolvedValue({ data: { uid }, error: null });
}

function mockRateLimit(count: number) {
  mockGetDoc.mockResolvedValue({
    exists: () => count > 0,
    data: () => ({ count }),
  });
}

// ---- Tests ----

describe('POST /api/ai/breakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue(undefined);
  });

  // AC 5.1.2 — Authentication Required
  it('returns 401 when no auth token is provided', async () => {
    const req = makeRequest({ taskName: 'do laundry' });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Please sign in to use AI breakdown');
  });

  it('returns 401 when token is invalid', async () => {
    mockVerifyFirebaseToken.mockResolvedValue({ data: null, error: 'Invalid' });
    const req = makeRequest({ taskName: 'do laundry' }, 'bad-token');
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Please sign in to use AI breakdown');
  });

  // Request validation
  it('returns 400 when taskName is missing', async () => {
    mockAuthSuccess();
    const req = makeRequest({}, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Task name is required');
  });

  it('returns 400 when taskName is empty', async () => {
    mockAuthSuccess();
    const req = makeRequest({ taskName: '  ' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Task name is required');
  });

  // AC 5.1.3 — Rate Limiting
  it('returns 429 when rate limit exceeded', async () => {
    mockAuthSuccess();
    mockRateLimit(20);
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('20 AI breakdowns today');
  });

  it('allows request when under rate limit', async () => {
    mockAuthSuccess();
    mockRateLimit(19);
    mockOpenAICreate.mockResolvedValue(makeOpenAIResponse(validLLMResponse));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // AC 5.1.1 — Successful Breakdown
  it('returns 200 with breakdown result on success', async () => {
    mockAuthSuccess();
    mockRateLimit(0);
    mockOpenAICreate.mockResolvedValue(makeOpenAIResponse(validLLMResponse));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timerName).toBe('Do Laundry');
    expect(body.steps).toHaveLength(3);
    expect(body.steps[0].name).toBe('Sort clothes');
    expect(body.steps[0].durationMinutes).toBe(5);
  });

  it('increments rate limit counter after success', async () => {
    mockAuthSuccess();
    mockRateLimit(5);
    mockOpenAICreate.mockResolvedValue(makeOpenAIResponse(validLLMResponse));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    await POST(req);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.stringContaining('aiUsage'),
      { count: { __increment: 1 } },
      { merge: true },
    );
  });

  // AC 5.1.4 — LLM Failure with Fallback
  it('falls back to Anthropic when OpenAI fails', async () => {
    mockAuthSuccess();
    mockRateLimit(0);
    mockOpenAICreate.mockRejectedValue(new Error('OpenAI down'));
    mockAnthropicCreate.mockResolvedValue(makeAnthropicResponse(validLLMResponse));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timerName).toBe('Do Laundry');
  });

  it('falls back to Anthropic when OpenAI returns invalid JSON', async () => {
    mockAuthSuccess();
    mockRateLimit(0);
    mockOpenAICreate.mockResolvedValue(makeOpenAIResponse({ invalid: true }));
    mockAnthropicCreate.mockResolvedValue(makeAnthropicResponse(validLLMResponse));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timerName).toBe('Do Laundry');
  });

  // AC 5.1.5 — Both LLMs Fail
  it('returns 503 when both LLMs fail', async () => {
    mockAuthSuccess();
    mockRateLimit(0);
    mockOpenAICreate.mockRejectedValue(new Error('OpenAI down'));
    mockAnthropicCreate.mockRejectedValue(new Error('Anthropic down'));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("Couldn't generate steps");
  });

  it('returns 503 when OpenAI returns bad JSON and Anthropic also fails', async () => {
    mockAuthSuccess();
    mockRateLimit(0);
    mockOpenAICreate.mockResolvedValue(makeOpenAIResponse({ invalid: true }));
    mockAnthropicCreate.mockRejectedValue(new Error('Anthropic down'));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain("Couldn't generate steps");
  });

  // Rate limit with no prior usage document
  it('allows first request when no usage doc exists', async () => {
    mockAuthSuccess();
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => null });
    mockOpenAICreate.mockResolvedValue(makeOpenAIResponse(validLLMResponse));
    const req = makeRequest({ taskName: 'do laundry' }, 'valid-token');
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
