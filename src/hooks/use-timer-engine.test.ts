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

// Mock useDeviceId
vi.mock('@/hooks/use-device-id', () => ({
  getDeviceId: () => 'mock-device-id',
  useDeviceId: () => 'mock-device-id',
}));

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
    vi.setSystemTime(new Date(mockTimestamp));
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

  it('extend +60s increases the planned duration by 60', async () => {
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

  it('extend +300s increases the planned duration by 300', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    await act(async () => {
      await result.current.extend(300);
    });

    expect(result.current.currentStep?.plannedDuration).toBe(600);
  });

  it('extend preserves originalPlannedDuration', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    expect(result.current.currentStep?.originalPlannedDuration).toBe(300);

    await act(async () => {
      await result.current.extend(60);
    });

    expect(result.current.currentStep?.originalPlannedDuration).toBe(300);

    await act(async () => {
      await result.current.extend(300);
    });

    expect(result.current.currentStep?.originalPlannedDuration).toBe(300);
  });

  it('extend while paused increases duration and stays paused', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    await act(async () => {
      await result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);
    expect(result.current.currentStep?.plannedDuration).toBe(300);

    await act(async () => {
      await result.current.extend(60);
    });

    expect(result.current.currentStep?.plannedDuration).toBe(360);
    expect(result.current.isPaused).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('multiple extends stack correctly', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    await act(async () => {
      await result.current.extend(60);
    });
    expect(result.current.currentStep?.plannedDuration).toBe(360);

    await act(async () => {
      await result.current.extend(60);
    });
    expect(result.current.currentStep?.plannedDuration).toBe(420);

    await act(async () => {
      await result.current.extend(60);
    });
    expect(result.current.currentStep?.plannedDuration).toBe(480);
  });

  it('extend calls updateSession with updated steps', async () => {
    const session = makeIdleSession();
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    mockUpdateSession.mockClear();

    await act(async () => {
      await result.current.extend(60);
    });

    expect(mockUpdateSession).toHaveBeenCalledOnce();
    // The persisted steps should have the updated plannedDuration
    const callArgs = mockUpdateSession.mock.calls[0];
    expect(callArgs[0]).toBe('test-uid'); // userId
    expect(callArgs[1]).toBe('session-123'); // sessionId
    const persistedData = callArgs[2];
    expect(persistedData.steps[0].plannedDuration).toBe(360);
    expect(persistedData.steps[0].originalPlannedDuration).toBe(300);
  });

  it('extend prevents auto-advance when elapsed is at threshold', async () => {
    const session = makeIdleSession();
    // Set planned duration to 5 seconds for quick test
    session.steps[0].plannedDuration = 5;
    session.steps[0].originalPlannedDuration = 5;
    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(session);
    });

    // Advance time to 4 seconds (just before auto-advance)
    mockTimestamp += 4000;
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Extend by 60 seconds before auto-advance triggers
    await act(async () => {
      await result.current.extend(60);
    });

    expect(result.current.currentStep?.plannedDuration).toBe(65);

    // Advance 2 more seconds — should still be running, NOT auto-advanced
    mockTimestamp += 2000;
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.session?.steps[0].status).toBe('running');
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

  // ========================================
  // Catch-up / reconnect tests
  // ========================================

  it('catches up through overdue steps on reconnect', async () => {
    // Session started 10 minutes ago, step 0 had 5 min planned, step 1 has 5 min planned
    // Step 0 started 10 min ago → 600s elapsed, 300s planned → overdue
    // Step 1 should have started 5 min ago → 300s elapsed, 300s planned → also overdue
    // Both steps overdue → session should complete
    const startTime = mockTimestamp - 600_000; // 10 min ago
    const runningSession: RunSession = {
      id: 'session-123',
      timerId: 'timer-1',
      timerName: 'Test Timer',
      status: 'running',
      currentStepIndex: 0,
      startedAt: Timestamp.fromDate(new Date(startTime)),
      activeDeviceId: 'mock-device-id',
      totalElapsedTime: 0,
      steps: [
        {
          id: 'step-0',
          name: 'Step 1',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'running' as const,
          startedAt: Timestamp.fromDate(new Date(startTime)),
        },
        {
          id: 'step-1',
          name: 'Step 2',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'pending' as const,
        },
      ],
    };

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(runningSession);
    });

    // Both steps overdue → session should be completed
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.session?.status).toBe('completed');
    expect(result.current.session?.steps[0].status).toBe('completed');
    expect(result.current.session?.steps[1].status).toBe('completed');
  });

  it('catches up to the correct in-progress step on reconnect', async () => {
    // Session started 4 minutes ago, step 0 has 3 min planned, step 1 has 5 min planned
    // Step 0: 240s elapsed, 180s planned → overdue, should be completed
    // Step 1: should have ~60s elapsed (started at startTime + 180s), 300s planned → still in progress
    const startTime = mockTimestamp - 240_000; // 4 min ago
    const runningSession: RunSession = {
      id: 'session-123',
      timerId: 'timer-1',
      timerName: 'Test Timer',
      status: 'running',
      currentStepIndex: 0,
      startedAt: Timestamp.fromDate(new Date(startTime)),
      activeDeviceId: 'mock-device-id',
      totalElapsedTime: 0,
      steps: [
        {
          id: 'step-0',
          name: 'Step 1',
          plannedDuration: 180, // 3 min
          originalPlannedDuration: 180,
          elapsedTime: 0,
          status: 'running' as const,
          startedAt: Timestamp.fromDate(new Date(startTime)),
        },
        {
          id: 'step-1',
          name: 'Step 2',
          plannedDuration: 300, // 5 min
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'pending' as const,
        },
      ],
    };

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(runningSession);
    });

    // Should have advanced to step 1
    expect(result.current.isRunning).toBe(true);
    expect(result.current.session?.currentStepIndex).toBe(1);
    expect(result.current.session?.steps[0].status).toBe('completed');
    expect(result.current.session?.steps[1].status).toBe('running');
    // Step 1 should show ~60s elapsed (started at startTime + 180s = 60s ago)
    expect(result.current.elapsedTime).toBe(60);
  });

  it('handles paused session on reconnect without catch-up', async () => {
    const runningSession: RunSession = {
      id: 'session-123',
      timerId: 'timer-1',
      timerName: 'Test Timer',
      status: 'paused',
      currentStepIndex: 0,
      startedAt: Timestamp.fromDate(new Date(mockTimestamp - 60_000)),
      pausedAt: Timestamp.fromDate(new Date(mockTimestamp - 30_000)),
      activeDeviceId: 'mock-device-id',
      totalElapsedTime: 30,
      steps: [
        {
          id: 'step-0',
          name: 'Step 1',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 30,
          status: 'paused' as const,
          startedAt: Timestamp.fromDate(new Date(mockTimestamp - 60_000)),
        },
        {
          id: 'step-1',
          name: 'Step 2',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'pending' as const,
        },
      ],
    };

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(runningSession);
    });

    // Should stay paused, no catch-up
    expect(result.current.isPaused).toBe(true);
    expect(result.current.session?.currentStepIndex).toBe(0);
    expect(result.current.elapsedTime).toBe(30);
  });

  it('reconnects to a running step that is not yet overdue', async () => {
    // Step 0 started 2 min ago, has 5 min planned → not overdue, just resume
    const startTime = mockTimestamp - 120_000; // 2 min ago
    const runningSession: RunSession = {
      id: 'session-123',
      timerId: 'timer-1',
      timerName: 'Test Timer',
      status: 'running',
      currentStepIndex: 0,
      startedAt: Timestamp.fromDate(new Date(startTime)),
      activeDeviceId: 'mock-device-id',
      totalElapsedTime: 0,
      steps: [
        {
          id: 'step-0',
          name: 'Step 1',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'running' as const,
          startedAt: Timestamp.fromDate(new Date(startTime)),
        },
        {
          id: 'step-1',
          name: 'Step 2',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'pending' as const,
        },
      ],
    };

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(runningSession);
    });

    // Should still be on step 0, showing 120s elapsed
    expect(result.current.session?.status).toBe('running');
    expect(result.current.isRunning).toBe(true);
    expect(result.current.session?.currentStepIndex).toBe(0);
    expect(result.current.elapsedTime).toBe(120);
  });

  // ---- v2: waiting-for-advance tests ----

  it('enters waiting-for-advance when pauseBetweenSteps is true', async () => {
    const template = makeTemplate(2);
    template.pauseBetweenSteps = true;
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.session?.pauseBetweenSteps).toBe(true);

    // Simulate step completion — advance to step 2
    await act(async () => {
      await result.current.skip();
    });

    // Should be in waiting-for-advance
    expect(result.current.isWaitingForAdvance).toBe(true);
    expect(result.current.session?.status).toBe('waiting-for-advance');
    expect(result.current.nextStepName).toBe('Step 2');
  });

  it('time does NOT tick during waiting-for-advance', async () => {
    const template = makeTemplate(2);
    template.pauseBetweenSteps = true;
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isWaitingForAdvance).toBe(true);
    const elapsedBefore = result.current.elapsedTime;

    // Advance time
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Elapsed should NOT have changed
    expect(result.current.elapsedTime).toBe(elapsedBefore);
  });

  it('advanceFromWaiting resumes running state', async () => {
    const template = makeTemplate(2);
    template.pauseBetweenSteps = true;
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isWaitingForAdvance).toBe(true);

    // Now user taps Start
    await act(async () => {
      await result.current.advanceFromWaiting();
    });

    expect(result.current.isWaitingForAdvance).toBe(false);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.session?.status).toBe('running');
    expect(result.current.session?.steps[1].status).toBe('running');
  });

  it('does NOT enter waiting-for-advance for last step', async () => {
    // Use single-step template
    const template = makeTemplate(1);
    template.pauseBetweenSteps = true;
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    await act(async () => {
      await result.current.skip();
    });

    // Should complete, not wait
    expect(result.current.isWaitingForAdvance).toBe(false);
    expect(result.current.isCompleted).toBe(true);
  });

  it('hydrates waiting-for-advance from Firestore session', async () => {
    const waitingSession: RunSession = {
      id: 'session-123',
      timerId: 'timer-1',
      timerName: 'Test Timer',
      status: 'waiting-for-advance',
      currentStepIndex: 1,
      startedAt: Timestamp.now(),
      activeDeviceId: 'mock-device-id',
      totalElapsedTime: 300,
      pauseBetweenSteps: true,
      steps: [
        {
          id: 'step-0',
          name: 'Step 1',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 300,
          status: 'completed' as const,
          completedAt: Timestamp.now(),
        },
        {
          id: 'step-1',
          name: 'Step 2',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'pending' as const,
        },
      ],
    };

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(waitingSession);
    });

    expect(result.current.isWaitingForAdvance).toBe(true);
    expect(result.current.nextStepName).toBe('Step 2');
    expect(result.current.elapsedTime).toBe(0);
  });

  // === Defer Tests (Story 7.3) ===

  it('defer marks step as deferred and advances to next step', async () => {
    const template = makeTemplate(3);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      await result.current.defer();
    });

    // Step 0 should be deferred
    expect(result.current.session?.steps[0].status).toBe('deferred');
    expect(result.current.session?.steps[0].wasDeferred).toBe(true);
    // Should advance to step 1
    expect(result.current.currentStepIndex).toBe(1);
    expect(result.current.session?.steps[1].status).toBe('running');
    // deferredSteps should contain step-0
    expect(result.current.session?.deferredSteps).toEqual(['step-0']);
    expect(result.current.deferredCount).toBe(1);
  });

  it('defer appends to deferredSteps on each deferral', async () => {
    const template = makeTemplate(4);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0
    await act(async () => {
      await result.current.defer();
    });

    expect(result.current.session?.deferredSteps).toEqual(['step-0']);
    expect(result.current.currentStepIndex).toBe(1);

    // Defer step 1
    await act(async () => {
      await result.current.defer();
    });

    expect(result.current.session?.deferredSteps).toEqual(['step-0', 'step-1']);
    expect(result.current.currentStepIndex).toBe(2);
    expect(result.current.deferredCount).toBe(2);
  });

  it('defer with pauseBetweenSteps enters waiting-for-advance', async () => {
    const template = makeTemplate(3);
    template.pauseBetweenSteps = true;
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        pauseBetweenSteps: true,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    await act(async () => {
      await result.current.defer();
    });

    // Should enter waiting-for-advance for step 1
    expect(result.current.isWaitingForAdvance).toBe(true);
    expect(result.current.session?.status).toBe('waiting-for-advance');
    expect(result.current.session?.steps[0].status).toBe('deferred');
    expect(result.current.session?.deferredSteps).toEqual(['step-0']);
  });

  it('defer enters deferred resolution when all remaining steps are deferred', async () => {
    const template = makeTemplate(2);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0
    await act(async () => {
      await result.current.defer();
    });

    // Now on step 1, defer it too
    await act(async () => {
      await result.current.defer();
    });

    // All steps deferred — should enter deferred resolution, not complete
    expect(result.current.isResolvingDeferred).toBe(true);
    expect(result.current.session?.status).toBe('resolving-deferred');
    expect(result.current.currentDeferredStep).not.toBeNull();
    expect(result.current.currentDeferredStep?.id).toBe('step-0');
  });

  it('defer skips over already-deferred steps when finding next', async () => {
    // Start a 4-step session, manually defer step 1 first, then defer step 0
    const template = makeTemplate(4);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0 → goes to step 1
    await act(async () => {
      await result.current.defer();
    });
    expect(result.current.currentStepIndex).toBe(1);

    // Defer step 1 → should skip deferred step 0 if looking back, goes to step 2
    await act(async () => {
      await result.current.defer();
    });
    expect(result.current.currentStepIndex).toBe(2);
    expect(result.current.session?.steps[2].status).toBe('running');
    expect(result.current.deferredCount).toBe(2);
  });

  // === Deferred Resolution Tests (Story 7.4) ===

  it('enters deferred resolution after last main step completes', async () => {
    const template = makeTemplate(2);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0 → goes to step 1
    await act(async () => {
      await result.current.defer();
    });

    // Skip step 1 → last main step done, should enter deferred resolution
    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isResolvingDeferred).toBe(true);
    expect(result.current.currentDeferredStep).not.toBeNull();
    expect(result.current.currentDeferredStep?.id).toBe('step-0');
    expect(result.current.session?.status).toBe('resolving-deferred');
  });

  it('startDeferredStep starts the deferred step normally', async () => {
    const template = makeTemplate(2);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0, skip step 1 → enters deferred resolution
    await act(async () => {
      await result.current.defer();
    });
    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isResolvingDeferred).toBe(true);

    // Start the deferred step
    await act(async () => {
      await result.current.startDeferredStep();
    });

    expect(result.current.isResolvingDeferred).toBe(false);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.session?.steps[0].status).toBe('running');
  });

  it('skipDeferredStep skips and completes when no more deferred steps', async () => {
    const template = makeTemplate(2);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0, skip step 1 → enters deferred resolution
    await act(async () => {
      await result.current.defer();
    });
    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isResolvingDeferred).toBe(true);

    // Skip the deferred step
    await act(async () => {
      await result.current.skipDeferredStep();
    });

    // No more deferred steps → should complete
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.isResolvingDeferred).toBe(false);
    expect(result.current.session?.steps[0].status).toBe('skipped');
  });

  it('deferAgain re-appends step and presents it again if only one', async () => {
    const template = makeTemplate(2);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0, skip step 1 → enters deferred resolution
    await act(async () => {
      await result.current.defer();
    });
    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isResolvingDeferred).toBe(true);
    expect(result.current.currentDeferredStep?.id).toBe('step-0');

    // Defer again → should re-append and present again (only deferred step)
    await act(async () => {
      await result.current.deferAgain();
    });

    expect(result.current.isResolvingDeferred).toBe(true);
    expect(result.current.currentDeferredStep?.id).toBe('step-0');
  });

  it('skipDeferredStep presents next deferred step when multiple exist', async () => {
    const template = makeTemplate(3);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0 → goes to step 1
    await act(async () => {
      await result.current.defer();
    });

    // Defer step 1 → goes to step 2
    await act(async () => {
      await result.current.defer();
    });

    // Skip step 2 → enters deferred resolution with step-0
    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isResolvingDeferred).toBe(true);
    expect(result.current.currentDeferredStep?.id).toBe('step-0');

    // Skip step-0 → should present step-1
    await act(async () => {
      await result.current.skipDeferredStep();
    });

    expect(result.current.isResolvingDeferred).toBe(true);
    expect(result.current.currentDeferredStep?.id).toBe('step-1');

    // Skip step-1 → should complete
    await act(async () => {
      await result.current.skipDeferredStep();
    });

    expect(result.current.isCompleted).toBe(true);
    expect(result.current.isResolvingDeferred).toBe(false);
  });

  it('deferred step that completes returns to resolution or completes session', async () => {
    const template = makeTemplate(2);
    const sessionSteps = template.steps.map((s) => ({
      ...s,
      originalPlannedDuration: s.plannedDuration,
      elapsedTime: 0,
      status: 'pending' as const,
    }));

    mockCreateSession.mockResolvedValueOnce({
      data: {
        id: 'session-123',
        timerId: template.id,
        timerName: template.name,
        status: 'idle',
        currentStepIndex: 0,
        startedAt: Timestamp.now(),
        activeDeviceId: 'mock-device-id',
        totalElapsedTime: 0,
        countdownMode: false,
        steps: sessionSteps,
      },
      error: null,
    });

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.start(template);
    });

    // Defer step 0, skip step 1 → enters deferred resolution
    await act(async () => {
      await result.current.defer();
    });
    await act(async () => {
      await result.current.skip();
    });

    expect(result.current.isResolvingDeferred).toBe(true);

    // Start the deferred step
    await act(async () => {
      await result.current.startDeferredStep();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.session?.steps[0].status).toBe('running');

    // Skip the running deferred step (simulates completion) → should complete since no more deferred
    await act(async () => {
      await result.current.skip();
    });

    // Deferred step should have been skipped and session should be complete
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.session?.steps[0].status).toBe('skipped');
  });

  it('hydrates resolving-deferred from Firestore session', async () => {
    const resolvingSession: RunSession = {
      id: 'session-123',
      timerId: 'timer-1',
      timerName: 'Test Timer',
      status: 'resolving-deferred' as RunSession['status'],
      currentStepIndex: 0,
      startedAt: Timestamp.now(),
      activeDeviceId: 'mock-device-id',
      totalElapsedTime: 300,
      steps: [
        {
          id: 'step-0',
          name: 'Step 1',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 0,
          status: 'pending' as const,
          wasDeferred: true,
        },
        {
          id: 'step-1',
          name: 'Step 2',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 300,
          status: 'completed' as const,
          completedAt: Timestamp.now(),
        },
      ],
      deferredSteps: [],
    };

    const { result } = renderHook(() => useTimerEngine());

    await act(async () => {
      await result.current.startFromSession(resolvingSession);
    });

    expect(result.current.isResolvingDeferred).toBe(true);
    expect(result.current.currentDeferredStep?.id).toBe('step-0');
  });
});
