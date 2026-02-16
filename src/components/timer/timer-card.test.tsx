import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerCard } from './timer-card';
import type { TimerTemplate } from '@/types/timer';
import type { RunSession } from '@/types/session';
import { Timestamp } from 'firebase/firestore';

// Mock firebase modules
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
  Timestamp: {
    now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
    fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }),
    fromMillis: (ms: number) => ({ toDate: () => new Date(ms), toMillis: () => ms }),
  },
}));

const mockTimer: TimerTemplate = {
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
};

const mockActiveSession: RunSession = {
  id: 'session-1',
  timerId: 'timer-1',
  timerName: 'Morning Routine',
  status: 'running',
  currentStepIndex: 0,
  startedAt: Timestamp.fromDate(new Date()),
  activeDeviceId: 'device-1',
  totalElapsedTime: 60,
  steps: [],
} as unknown as RunSession;

describe('TimerCard', () => {
  it('renders timer name', () => {
    render(<TimerCard timer={mockTimer} />);
    expect(screen.getByText('Morning Routine')).toBeInTheDocument();
  });

  it('renders formatted duration', () => {
    render(<TimerCard timer={mockTimer} />);
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('renders step count', () => {
    render(<TimerCard timer={mockTimer} />);
    expect(screen.getByText('2 steps')).toBeInTheDocument();
  });

  it('renders "Never" for unused timer', () => {
    render(<TimerCard timer={mockTimer} />);
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('calls onPlay when Play is clicked', () => {
    const onPlay = vi.fn();
    render(<TimerCard timer={mockTimer} onPlay={onPlay} />);
    fireEvent.click(screen.getByLabelText('Play Morning Routine'));
    expect(onPlay).toHaveBeenCalledWith(mockTimer);
  });

  it('calls onEdit from kebab menu', async () => {
    const onEdit = vi.fn();
    render(<TimerCard timer={mockTimer} onEdit={onEdit} />);
    // Open dropdown
    const trigger = screen.getByLabelText('More options for Morning Routine');
    fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
    await vi.waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(mockTimer);
  });

  it('renders singular step count', () => {
    const singleStepTimer = { ...mockTimer, steps: [mockTimer.steps[0]] };
    render(<TimerCard timer={singleStepTimer} />);
    expect(screen.getByText('1 step')).toBeInTheDocument();
  });

  it('shows "Running" badge when activeSession is running', () => {
    render(<TimerCard timer={mockTimer} activeSession={mockActiveSession} />);
    expect(screen.getByTestId('active-badge')).toHaveTextContent('Running');
  });

  it('shows "Paused" badge when activeSession is paused', () => {
    const pausedSession = { ...mockActiveSession, status: 'paused' as const };
    render(<TimerCard timer={mockTimer} activeSession={pausedSession} />);
    expect(screen.getByTestId('active-badge')).toHaveTextContent('Paused');
  });

  it('shows "Open" link instead of Play button when session is active', () => {
    render(<TimerCard timer={mockTimer} activeSession={mockActiveSession} />);
    expect(screen.queryByLabelText('Play Morning Routine')).not.toBeInTheDocument();
    const openLink = screen.getByLabelText('Go to Morning Routine session');
    expect(openLink).toBeInTheDocument();
    expect(openLink.closest('a')).toHaveAttribute('href', '/app/sessions/session-1');
  });

  it('shows Play button when no active session', () => {
    render(<TimerCard timer={mockTimer} />);
    expect(screen.getByLabelText('Play Morning Routine')).toBeInTheDocument();
    expect(screen.queryByTestId('active-badge')).not.toBeInTheDocument();
  });
});
