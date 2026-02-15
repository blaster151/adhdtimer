import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimerEngine } from './use-timer-engine';
import type { RunSession, SessionStep } from '@/types/session';
import type { TimerTemplate } from '@/types/timer';
import { Timestamp } from 'firebase/firestore';

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'mock-device-id',
});

// Mock sessionStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
});

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock firebase
vi.mock('firebase/app', () => ({
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
  initializeApp: vi.fn(() => ({})),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

let mockTimestamp = Date.now();
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'session-123' })),
  getDoc: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  Timestamp: {
    now: () => ({
      toDate: () => new Date(mockTimestamp),
      toMillis: () => mockTimestamp,
    }),
    fromDate: (d: Date) => ({
      toDate: () => d,
      toMillis: () => d.getTime(),
    }),
    fromMillis: (ms: number) => ({
      toDate: () => new Date(ms),
      toMillis: () => ms,
    }),
  },
}));

// Mock session functions
const mockCreateSession = vi.fn();
const mockUpdateSession = vi.fn().mockResolvedValue({ data: undefined, error: null });
vi.mock('@/lib/firebase/sessions', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

const mockUpdateTimer = vi.fn().mockResolvedValue({ data: undefined, error: null });
vi.mock('@/lib/firebase/timers', () => ({
  updateTimer: (...args: unknown[]) => mockUpdateTimer(...args),
}));

function makeTemplate(stepCount = 2): TimerTemplate {
  return {
    id: 'timer-1',
    name: 'Test Timer',
    totalPlannedDuration: stepCount * 300,
    countdownMode: false,
    steps: Array.from({ length: stepCount }, (_, i) => ({
      id: `step-${i}`,
      name: `Step ${i + 1}`,
      plannedDuration: 300,
    })),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

function makeIdleSession(stepCount = 2): RunSession {
  return {
    id: 'session-123',
    timerId: 'timer-1',
    timerName: 'Test Timer',
    status: 'idle',
    currentStepIndex: 0,
    startedAt: Timestamp.fromDate(new Date(mockTimestamp)),
    activeDeviceId: 'mock-device-id',
    totalElapsedTime: 0,
    steps: Array.from({ length: stepCount }, (_, i) => ({
      id: `step-${i}`,
      name: `Step ${i + 1}`,
      plannedDuration: 300,
      originalPlannedDuration: 300,
      elapsedTime: 0,
      status: 'pending' as const,
    })),
  };
}

describe('useTimerEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockTimestamp = 1000000;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with null session', () => {
    const { result } = renderHook(() => useTimerEngine());
    expect(result.current.session).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isCompleted).toBe(false);
  });

  it('start creates a session and sets it to running', async () => {
    const template = makeTemplate();
    const createdSession = makeIdleSession();
    mockCreateSession.mockResolvedValue({ data: createdSession, error: null });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    expect(result.current.session).not.toBeNull();
    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentStep?.status).toBe('running');
    expect(result.current.currentStepIndex).toBe(0);
    expect(mockCreateSession).toHaveBeenCalledOnce();
    expect(mockUpdateTimer).toHaveBeenCalledOnce(); // lastUsedAt updated
  });

  it('startFromSession sets idle session to running', async () => {
    const session = makeIdleSession();

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    expect(result.current.session).not.toBeNull();
    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentStep?.status).toBe('running');
    expect(result.current.currentStepIndex).toBe(0);
  });

  it('pause freezes elapsed and sets status to paused', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      await result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.session?.status).toBe('paused');
    expect(result.current.session?.pausedAt).toBeDefined();
  });

  it('resume continues from paused state', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    await act(async () => {
      await result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);

    await act(async () => {
      await result.current.resume();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.session?.pausedAt).toBeUndefined();
  });

  it('skip marks current step as skipped and advances', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    expect(result.current.currentStepIndex).toBe(0);

    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.session?.steps[0].status).toBe('skipped');
    expect(result.current.session?.steps[1].status).toBe('running');
  });

  it('skip on last step completes the session', async () => {
    const session = makeIdleSession(1); // single step
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isCompleted).toBe(true);
    expect(result.current.session?.status).toBe('completed');
  });

  it('stop marks session as completed', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.isCompleted).toBe(true);
    expect(result.current.session?.status).toBe('completed');
    expect(result.current.session?.completedAt).toBeDefined();
  });

  it('stop from paused state works', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    await act(async () => {
      await result.current.pause();
    });

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.isCompleted).toBe(true);
  });

  it('extend increases the planned duration of current step', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    expect(result.current.currentStep?.plannedDuration).toBe(300);

    await act(async () => {
      await result.current.extend(60);
    });

    expect(result.current.currentStep?.plannedDuration).toBe(360);
  });

  it('single-step timer completes after skip', async () => {
    const session = makeIdleSession(1);
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isCompleted).toBe(true);
  });

  it('persists to Firestore on each state transition', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });
    expect(mockUpdateSession).toHaveBeenCalled();

    mockUpdateSession.mockClear();
    await act(async () => {
      await result.current.pause();
    });
    expect(mockUpdateSession).toHaveBeenCalled();

    mockUpdateSession.mockClear();
    await act(async () => {
      await result.current.resume();
    });
    expect(mockUpdateSession).toHaveBeenCalled();

    mockUpdateSession.mockClear();
    await act(async () => {
      await result.current.stop();
    });
    expect(mockUpdateSession).toHaveBeenCalled();
  });
});
