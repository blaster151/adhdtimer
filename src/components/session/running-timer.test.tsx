import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock useWakeLock
vi.mock('@/hooks/use-wake-lock', () => ({
  useWakeLock: () => ({
    isSupported: true,
    isActive: false,
    request: vi.fn(),
    release: vi.fn(),
  }),
}));

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock useDeviceId
let mockDeviceId = 'my-device-id';
vi.mock('@/hooks/use-device-id', () => ({
  useDeviceId: () => mockDeviceId,
  getDeviceId: () => mockDeviceId,
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
  onSnapshot: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
    fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }),
    fromMillis: (ms: number) => ({ toDate: () => new Date(ms), toMillis: () => ms }),
  },
}));

// Mock useFirestoreSession
const mockFirestoreSession = {
  session: null as unknown,
  loading: true,
  error: null as Error | null,
};
vi.mock('@/hooks/use-firestore-session', () => ({
  useFirestoreSession: () => mockFirestoreSession,
}));

const mockUpdateSession = vi.fn().mockResolvedValue({ data: undefined, error: null });
vi.mock('@/lib/firebase/sessions', () => ({
  subscribeToSession: vi.fn(() => vi.fn()),
  createSession: vi.fn(),
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}));

vi.mock('@/lib/firebase/timers', () => ({
  updateTimer: vi.fn().mockResolvedValue({ data: undefined, error: null }),
}));

function makeSessionData(overrides = {}) {
  const now = Date.now();
  return {
    id: 'session-1',
    timerId: 'timer-1',
    timerName: 'Morning Routine',
    status: 'idle',
    currentStepIndex: 0,
    startedAt: { toDate: () => new Date(now), toMillis: () => now },
    activeDeviceId: 'my-device-id',
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
    ...overrides,
  };
}

describe('RunningTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirestoreSession.session = null;
    mockFirestoreSession.loading = true;
    mockFirestoreSession.error = null;
    mockDeviceId = 'my-device-id';
  });

  it('shows loading skeleton while session loads', () => {
    mockFirestoreSession.loading = true;
    mockFirestoreSession.session = null;
    render(<RunningTimer sessionId="session-1" />);
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('redirects to /app if session has error', async () => {
    mockFirestoreSession.loading = false;
    mockFirestoreSession.error = new Error('Session not found');
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app');
    });
  });

  it('redirects to /app if session is already completed', async () => {
    mockFirestoreSession.loading = false;
    mockFirestoreSession.session = {
      id: 'session-1',
      status: 'completed',
      steps: [],
      currentStepIndex: 0,
    };
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/app');
    });
  });

  it('renders session data after loading', async () => {
    mockFirestoreSession.loading = false;
    mockFirestoreSession.session = makeSessionData();
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    expect(screen.getByTestId('ring-step-name')).toHaveTextContent('Shower');
    expect(screen.getAllByText('Breakfast').length).toBeGreaterThan(0);
  });

  it('shows controls enabled regardless of activeDeviceId', async () => {
    mockDeviceId = 'my-device-id';
    mockFirestoreSession.loading = false;
    mockFirestoreSession.session = makeSessionData({ activeDeviceId: 'other-device' });
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    // No observer banner — all devices are equal
    expect(screen.queryByTestId('observer-banner')).not.toBeInTheDocument();
    // Controls should be enabled even when activeDeviceId differs
    expect(screen.getByLabelText('Skip step')).not.toBeDisabled();
    expect(screen.getByLabelText('Stop timer')).not.toBeDisabled();
  });

  it('shows "All Timers" back link', async () => {
    mockFirestoreSession.loading = false;
    mockFirestoreSession.session = makeSessionData();
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    const backLink = screen.getByRole('link', { name: /all timers/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/app');
  });

  it('shows count-up display by default (no countdownMode)', async () => {
    mockFirestoreSession.loading = false;
    mockFirestoreSession.session = makeSessionData();
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    // Default: elapsed display should show "0:00" (count-up from zero)
    expect(screen.getByTestId('ring-time-display')).toHaveTextContent('0:00');
  });

  it('shows countdown display when countdownMode is true', async () => {
    mockFirestoreSession.loading = false;
    mockFirestoreSession.session = makeSessionData({ countdownMode: true });
    render(<RunningTimer sessionId="session-1" />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    // Countdown: should show remaining time "10:00" (600s planned for first step)
    expect(screen.getByTestId('ring-time-display')).toHaveTextContent('10:00');
  });
});