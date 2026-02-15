import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActiveSessionRedirect } from './use-active-session-redirect';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
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

const mockGetActiveSession = vi.fn();

vi.mock('@/lib/firebase/sessions', () => ({
  getActiveSession: (...args: unknown[]) => mockGetActiveSession(...args),
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

describe('useActiveSessionRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { uid: 'test-uid' };
    mockAuthLoading = false;
    mockGetActiveSession.mockResolvedValue({ data: null, error: null });
  });

  it('redirects to active session when one is found', async () => {
    mockGetActiveSession.mockResolvedValue({
      data: { id: 'session-123', status: 'running' },
      error: null,
    });

    const { result } = renderHook(() => useActiveSessionRedirect());

    expect(result.current.checking).toBe(true);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/app/sessions/session-123');
    });
    expect(mockGetActiveSession).toHaveBeenCalledWith('test-uid');
  });

  it('sets checking to false when no active session found', async () => {
    mockGetActiveSession.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useActiveSessionRedirect());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('sets checking to false when user is not authenticated', async () => {
    mockUser = null;

    const { result } = renderHook(() => useActiveSessionRedirect());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });
    expect(mockGetActiveSession).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('waits for auth to finish loading before checking', async () => {
    mockAuthLoading = true;

    const { result } = renderHook(() => useActiveSessionRedirect());

    // Should stay in checking state while auth loads
    expect(result.current.checking).toBe(true);
    expect(mockGetActiveSession).not.toHaveBeenCalled();
  });

  it('redirects to paused session', async () => {
    mockGetActiveSession.mockResolvedValue({
      data: { id: 'paused-session', status: 'paused' },
      error: null,
    });

    renderHook(() => useActiveSessionRedirect());

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/app/sessions/paused-session');
    });
  });

  it('does not redirect when query returns error', async () => {
    mockGetActiveSession.mockResolvedValue({
      data: null,
      error: 'Permission denied',
    });

    const { result } = renderHook(() => useActiveSessionRedirect());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
