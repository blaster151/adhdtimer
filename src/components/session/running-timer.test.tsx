import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RunningTimer } from './running-timer';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

// Mock useTTS
vi.mock('@/hooks/use-tts', () => ({
  useTTS: () => ({
    speak: vi.fn(),
    cancel: vi.fn(),
    isSupported: true,
    isEnabled: true,
    setEnabled: vi.fn(),
  }),
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
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
    fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }),
    fromMillis: (ms: number) => ({ toDate: () => new Date(ms), toMillis: () => ms }),
  },
}));

// Mock getSession
const mockGetSession = vi.fn();
vi.mock('@/lib/firebase/sessions', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
  createSession: vi.fn(),
  updateSession: vi.fn().mockResolvedValue({ data: undefined, error: null }),
}));

vi.mock('@/lib/firebase/timers', () => ({
  updateTimer: vi.fn().mockResolvedValue({ data: undefined, error: null }),
}));

describe('RunningTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while session loads', () => {
    mockGetSession.mockReturnValue(new Promise(() => {})); // never resolves
    render(<RunningTimer sessionId="session-1" />);
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('redirects to /app if session not found', async () => {
    mockGetSession.mockResolvedValue({ data: null, error: 'Session not found' });
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app');
    });
  });

  it('redirects to /app if session is already completed', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        id: 'session-1',
        status: 'completed',
        steps: [],
        currentStepIndex: 0,
      },
      error: null,
    });
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app');
    });
  });

  it('renders session data after loading', async () => {
    const now = Date.now();
    mockGetSession.mockResolvedValue({
      data: {
        id: 'session-1',
        timerId: 'timer-1',
        timerName: 'Morning Routine',
        status: 'idle',
        currentStepIndex: 0,
        startedAt: { toDate: () => new Date(now), toMillis: () => now },
        activeDeviceId: 'dev-1',
        totalElapsedTime: 0,
        steps: [
          {
            id: 's1',
            name: 'Shower',
            plannedDuration: 600,
            originalPlannedDuration: 600,
            elapsedTime: 0,
            status: 'pending',
          },
          {
            id: 's2',
            name: 'Breakfast',
            plannedDuration: 1200,
            originalPlannedDuration: 1200,
            elapsedTime: 0,
            status: 'pending',
          },
        ],
      },
      error: null,
    });
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    expect(screen.getByTestId('current-step-name')).toHaveTextContent('Shower');
    expect(screen.getAllByText('Breakfast').length).toBeGreaterThan(0);
  });
});
