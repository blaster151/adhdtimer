import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useActiveSessions } from './use-active-session-redirect';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

let mockUser: { uid: string } | null = { uid: 'test-uid' };
let mockAuthLoading = false;

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
  }),
}));

const mockUnsubscribe = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockOnActiveSessionsSnapshot = vi.fn((..._args: any[]) => mockUnsubscribe);

vi.mock('@/lib/firebase/sessions', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onActiveSessionsSnapshot: (...args: any[]) => mockOnActiveSessionsSnapshot(...args),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})),
  persistentMultipleTabManager: vi.fn(() => ({})),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

/** Simulate the snapshot callback firing with sessions. */
function fireSnapshot(sessions: { id: string; status: string }[]) {
  const callback = mockOnActiveSessionsSnapshot.mock.calls[0]?.[1];
  if (callback) {
    act(() => callback(sessions));
  }
}

describe('useActiveSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { uid: 'test-uid' };
    mockAuthLoading = false;
  });

  it('returns activeSessions when running sessions are found', async () => {
    const { result } = renderHook(() => useActiveSessions());

    fireSnapshot([
      { id: 'session-123', status: 'running' },
      { id: 'session-456', status: 'paused' },
    ]);

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
      expect(result.current.activeSessions).toHaveLength(2);
      expect(result.current.activeSessions[0]).toEqual({ id: 'session-123', status: 'running' });
    });
    expect(mockOnActiveSessionsSnapshot).toHaveBeenCalledWith('test-uid', expect.any(Function));
  });

  it('sets checking to false and activeSessions to empty when no active sessions', async () => {
    const { result } = renderHook(() => useActiveSessions());

    fireSnapshot([]);

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
      expect(result.current.activeSessions).toEqual([]);
    });
  });

  it('sets checking to false when user is not authenticated', async () => {
    mockUser = null;

    const { result } = renderHook(() => useActiveSessions());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
      expect(result.current.activeSessions).toEqual([]);
    });
    expect(mockOnActiveSessionsSnapshot).not.toHaveBeenCalled();
  });

  it('waits for auth to finish loading before subscribing', async () => {
    mockAuthLoading = true;

    const { result } = renderHook(() => useActiveSessions());

    expect(result.current.checking).toBe(true);
    expect(mockOnActiveSessionsSnapshot).not.toHaveBeenCalled();
  });

  it('returns paused sessions in activeSessions', async () => {
    const { result } = renderHook(() => useActiveSessions());

    fireSnapshot([{ id: 'paused-session', status: 'paused' }]);

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
      expect(result.current.activeSessions).toEqual([{ id: 'paused-session', status: 'paused' }]);
    });
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useActiveSessions());

    expect(mockOnActiveSessionsSnapshot).toHaveBeenCalled();

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('clears activeSessions when all sessions end', async () => {
    const { result } = renderHook(() => useActiveSessions());

    fireSnapshot([{ id: 'session-123', status: 'running' }]);

    await waitFor(() => {
      expect(result.current.activeSessions).toHaveLength(1);
    });

    fireSnapshot([]);

    await waitFor(() => {
      expect(result.current.activeSessions).toEqual([]);
    });
  });
});
