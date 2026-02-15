import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { verifyFirebaseToken } from '@/lib/firebase/auth-server';
import { buildMessages } from '@/lib/ai/prompt';
import { validateBreakdownResponse } from '@/lib/ai/validate';

const DAILY_LIMIT = 20;
const LLM_TIMEOUT = 15_000; // 15 seconds

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function callOpenAI(taskName: string): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const client = new OpenAI({ apiKey, timeout: LLM_TIMEOUT });
  const messages = buildMessages(taskName);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty OpenAI response');

  return JSON.parse(content);
}

async function callAnthropic(taskName: string): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey, timeout: LLM_TIMEOUT });
  const messages = buildMessages(taskName);

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 1000,
    system: messages[0].content,
    messages: [{ role: 'user', content: messages[1].content }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected Anthropic response type');

  return JSON.parse(block.text);
}

async function checkRateLimit(
  userId: string,
): Promise<{ allowed: boolean; error: string | null }> {
  try {
    const docRef = doc(db, 'users', userId, 'aiUsage', todayKey());
    const snap = await getDoc(docRef);
    const count = snap.exists() ? (snap.data().count as number) ?? 0 : 0;
    return { allowed: count < DAILY_LIMIT, error: null };
  } catch (err) {
    return { allowed: false, error: (err as Error).message };
  }
}

async function incrementRateLimit(userId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'aiUsage', todayKey());
  await setDoc(docRef, { count: increment(1) }, { merge: true });
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Please sign in to use AI breakdown' },
      { status: 401 },
    );
  }

  const authResult = await verifyFirebaseToken(token);
  if (authResult.error || !authResult.data) {
    return NextResponse.json(
      { error: 'Please sign in to use AI breakdown' },
      { status: 401 },
    );
  }

  const userId = authResult.data.uid;

  // 2. Parse and validate request body
  let taskName: string;
  try {
    const body = await request.json();
    taskName = body?.taskName;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof taskName !== 'string' || taskName.trim() === '') {
    return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
  }

  taskName = taskName.trim();

  // 3. Rate limit check
  const rateCheck = await checkRateLimit(userId);
  if (rateCheck.error) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 });
  }
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "You've used all 20 AI breakdowns today. Try again tomorrow!" },
      { status: 429 },
    );
  }

  // 4. Call LLM with fallback
  let raw: unknown;
  let usedFallback = false;

  try {
    raw = await callOpenAI(taskName);
  } catch {
    // OpenAI failed — try Anthropic fallback
    usedFallback = true;
    try {
      raw = await callAnthropic(taskName);
    } catch {
      return NextResponse.json(
        { error: "Couldn't generate steps right now. Please try again or create manually." },
        { status: 503 },
      );
    }
  }

  // 5. Validate LLM response
  const validation = validateBreakdownResponse(raw);
  if (validation.error || !validation.data) {
    // Invalid response from primary — try fallback if not already used
    if (!usedFallback) {
      try {
        raw = await callAnthropic(taskName);
        const fallbackValidation = validateBreakdownResponse(raw);
        if (fallbackValidation.error || !fallbackValidation.data) {
          return NextResponse.json(
            { error: "Couldn't generate steps right now. Please try again or create manually." },
            { status: 503 },
          );
        }
        // Increment rate limit and return fallback result
        await incrementRateLimit(userId).catch(() => {});
        return NextResponse.json(fallbackValidation.data);
      } catch {
        return NextResponse.json(
          { error: "Couldn't generate steps right now. Please try again or create manually." },
          { status: 503 },
        );
      }
    }
    return NextResponse.json(
      { error: "Couldn't generate steps right now. Please try again or create manually." },
      { status: 503 },
    );
  }

  // 6. Increment rate limit (atomic) and return result
  await incrementRateLimit(userId).catch(() => {});

  return NextResponse.json(validation.data);
}
