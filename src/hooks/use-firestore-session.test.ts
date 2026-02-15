import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFirestoreSession } from './use-firestore-session';

// Capture the onSnapshot callback so we can trigger it in tests
let snapshotCallback: ((session: unknown) => void) | null = null;
let snapshotErrorCallback: ((error: Error) => void) | null = null;
const mockUnsubscribe = vi.fn();

vi.mock('@/lib/firebase/sessions', () => ({
  subscribeToSession: (
    _userId: string,
    _sessionId: string,
    onData: (session: unknown) => void,
    onError: (error: Error) => void,
  ) => {
    snapshotCallback = onData;
    snapshotErrorCallback = onError;
    return mockUnsubscribe;
  },
}));

function makeSession(overrides = {}) {
  return {
    id: 'session-1',
    timerId: 'timer-1',
    timerName: 'Morning Routine',
    status: 'running',
    currentStepIndex: 0,
    startedAt: { toDate: () => new Date(), toMillis: () => Date.now() },
    activeDeviceId: 'device-a',
    totalElapsedTime: 0,
    steps: [
      {
        id: 's1',
        name: 'Shower',
        plannedDuration: 600,
        originalPlannedDuration: 600,
        elapsedTime: 0,
        status: 'running',
        startedAt: { toDate: () => new Date(), toMillis: () => Date.now() },
      },
    ],
    ...overrides,
  };
}

describe('useFirestoreSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCallback = null;
    snapshotErrorCallback = null;
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() =>
      useFirestoreSession('user-1', 'session-1'),
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns session data when snapshot fires', () => {
    const { result } = renderHook(() =>
      useFirestoreSession('user-1', 'session-1'),
    );
    const session = makeSession();
    act(() => {
      snapshotCallback!(session);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.session).toEqual(session);
    expect(result.current.error).toBeNull();
  });

  it('returns error when snapshot errors', () => {
    const { result } = renderHook(() =>
      useFirestoreSession('user-1', 'session-1'),
    );
    act(() => {
      snapshotErrorCallback!(new Error('Permission denied'));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.session).toBeNull();
    expect(result.current.error?.message).toBe('Permission denied');
  });

  it('updates session on subsequent snapshots', () => {
    const { result } = renderHook(() =>
      useFirestoreSession('user-1', 'session-1'),
    );
    const session1 = makeSession({ currentStepIndex: 0 });
    act(() => {
      snapshotCallback!(session1);
    });
    expect(result.current.session?.currentStepIndex).toBe(0);

    const session2 = makeSession({ currentStepIndex: 1 });
    act(() => {
      snapshotCallback!(session2);
    });
    expect(result.current.session?.currentStepIndex).toBe(1);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() =>
      useFirestoreSession('user-1', 'session-1'),
    );
    expect(mockUnsubscribe).not.toHaveBeenCalled();
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe when userId is undefined', () => {
    const { result } = renderHook(() =>
      useFirestoreSession(undefined, 'session-1'),
    );
    expect(snapshotCallback).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('resubscribes when sessionId changes', () => {
    let sessionId = 'session-1';
    const { rerender } = renderHook(() =>
      useFirestoreSession('user-1', sessionId),
    );
    expect(mockUnsubscribe).not.toHaveBeenCalled();

    sessionId = 'session-2';
    rerender();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('clears error on new successful snapshot', () => {
    const { result } = renderHook(() =>
      useFirestoreSession('user-1', 'session-1'),
    );
    act(() => {
      snapshotErrorCallback!(new Error('Transient error'));
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      snapshotCallback!(makeSession());
    });
    expect(result.current.error).toBeNull();
  });
});
