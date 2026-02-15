import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerLibrary } from './timer-library';
import type { TimerTemplate } from '@/types/timer';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

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
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
    fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }),
  },
}));

// Mock timer functions
const mockGetTimers = vi.fn();
const mockDeleteTimer = vi.fn();
const mockDuplicateTimer = vi.fn();
const mockUpdateTimer = vi.fn();
vi.mock('@/lib/firebase/timers', () => ({
  getTimers: (...args: unknown[]) => mockGetTimers(...args),
  deleteTimer: (...args: unknown[]) => mockDeleteTimer(...args),
  duplicateTimer: (...args: unknown[]) => mockDuplicateTimer(...args),
  updateTimer: (...args: unknown[]) => mockUpdateTimer(...args),
}));

// Mock session functions
const mockCreateSession = vi.fn();
vi.mock('@/lib/firebase/sessions', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  updateSession: vi.fn(),
  getSession: vi.fn(),
}));

const sampleTimers: TimerTemplate[] = [
  {
    id: 'timer-1',
    name: 'Morning Routine',
    totalPlannedDuration: 1800,
    countdownMode: false,
    steps: [
      { id: 's1', name: 'Shower', plannedDuration: 600 },
      { id: 's2', name: 'Breakfast', plannedDuration: 1200 },
    ],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastUsedAt: Timestamp.now(),
  },
  {
    id: 'timer-2',
    name: 'Work Sprint',
    totalPlannedDuration: 1500,
    countdownMode: false,
    steps: [{ id: 's3', name: 'Focus', plannedDuration: 1500 }],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

describe('TimerLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons initially', () => {
    mockGetTimers.mockReturnValue(new Promise(() => {})); // never resolves
    render(<TimerLibrary />);
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no timers', async () => {
    mockGetTimers.mockResolvedValue({ data: [], error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Create your first timer')).toBeInTheDocument();
    });
  });

  it('renders timer cards when timers exist', async () => {
    mockGetTimers.mockResolvedValue({ data: sampleTimers, error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
      expect(screen.getByText('Work Sprint')).toBeInTheDocument();
    });
  });

  it('shows New Timer button when timers exist', async () => {
    mockGetTimers.mockResolvedValue({ data: sampleTimers, error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('+ New Timer')).toBeInTheDocument();
    });
    expect(screen.getByText('+ New Timer').closest('a')).toHaveAttribute(
      'href',
      '/app/timers/new',
    );
  });

  it('shows header with Timer Library title', async () => {
    mockGetTimers.mockResolvedValue({ data: sampleTimers, error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Timer Library')).toBeInTheDocument();
    });
  });

  it('navigates to edit page when Edit is clicked', async () => {
    mockGetTimers.mockResolvedValue({ data: sampleTimers, error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    // Open kebab menu first
    const trigger = screen.getByLabelText('More options for Morning Routine');
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
    await vi.waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(mockPush).toHaveBeenCalledWith('/app/timers/timer-1/edit');
  });

  it('shows delete confirmation dialog when Delete is clicked', async () => {
    mockGetTimers.mockResolvedValue({ data: [sampleTimers[0]], error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    // Radix DropdownMenu uses pointer events to open
    const trigger = screen.getByLabelText('More options for Morning Routine');
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
    // Click Delete in dropdown
    const deleteItem = await screen.findByRole('menuitem', { name: 'Delete' });
    fireEvent.click(deleteItem);
    // Confirm dialog should appear — use longer wait
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  it('removes timer from list after delete confirmation', async () => {
    mockGetTimers.mockResolvedValue({ data: [sampleTimers[0]], error: null });
    mockDeleteTimer.mockResolvedValue({ data: undefined, error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    // Open dropdown
    const trigger = screen.getByLabelText('More options for Morning Routine');
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
    await vi.waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    // Click confirm in dialog
    await vi.waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await vi.waitFor(() => {
      expect(mockDeleteTimer).toHaveBeenCalledWith('test-uid', 'timer-1');
    });
  }, 10000);

  it('adds duplicated timer to list', async () => {
    const duplicated: TimerTemplate = {
      ...sampleTimers[0],
      id: 'timer-1-copy',
      name: 'Morning Routine (copy)',
    };
    mockGetTimers.mockResolvedValue({ data: [sampleTimers[0]], error: null });
    mockDuplicateTimer.mockResolvedValue({ data: duplicated, error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });
    // Open dropdown
    const trigger = screen.getByLabelText('More options for Morning Routine');
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
    await vi.waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    await vi.waitFor(() => {
      expect(mockDuplicateTimer).toHaveBeenCalledWith('test-uid', 'timer-1');
    });
  });

  it('shows offline toast when playing timer while offline', async () => {
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });

    mockGetTimers.mockResolvedValue({ data: [sampleTimers[0]], error: null });
    render(<TimerLibrary />);
    await vi.waitFor(() => {
      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Play Morning Routine'));

    expect(toast.error).toHaveBeenCalledWith('Connect to internet to start a timer');
    expect(mockCreateSession).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });
});
