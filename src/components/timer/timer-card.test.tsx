import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerCard } from './timer-card';
import type { TimerTemplate } from '@/types/timer';
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

  it('calls onEdit when Edit is clicked', () => {
    const onEdit = vi.fn();
    render(<TimerCard timer={mockTimer} onEdit={onEdit} />);
    fireEvent.click(screen.getByLabelText('Edit Morning Routine'));
    expect(onEdit).toHaveBeenCalledWith(mockTimer);
  });

  it('renders singular step count', () => {
    const singleStepTimer = { ...mockTimer, steps: [mockTimer.steps[0]] };
    render(<TimerCard timer={singleStepTimer} />);
    expect(screen.getByText('1 step')).toBeInTheDocument();
  });
});
