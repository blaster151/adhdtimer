import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletionView } from './completion-view';
import type { RunSession } from '@/types/session';

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

const now = Date.now();
const ts = {
  toDate: () => new Date(now),
  toMillis: () => now,
} as never;

function makeSession(overrides: Partial<RunSession> = {}): RunSession {
  return {
    id: 'session-1',
    timerId: 'timer-1',
    timerName: 'Morning Routine',
    status: 'completed',
    currentStepIndex: 2,
    startedAt: ts,
    completedAt: ts,
    activeDeviceId: 'dev-1',
    totalElapsedTime: 1035,
    steps: [
      {
        id: 's1',
        name: 'Shower',
        plannedDuration: 480,
        originalPlannedDuration: 480,
        elapsedTime: 503,
        status: 'completed',
      },
      {
        id: 's2',
        name: 'Get Dressed',
        plannedDuration: 300,
        originalPlannedDuration: 300,
        elapsedTime: 312,
        status: 'completed',
      },
      {
        id: 's3',
        name: 'Breakfast',
        plannedDuration: 600,
        originalPlannedDuration: 600,
        elapsedTime: 220,
        status: 'completed',
      },
    ],
    ...overrides,
  };
}

describe('CompletionView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Done!" heading', () => {
    render(<CompletionView session={makeSession()} />);
    expect(screen.getByTestId('completion-heading')).toHaveTextContent('Done!');
  });

  it('renders coffee emoji', () => {
    render(<CompletionView session={makeSession()} />);
    expect(screen.getByText('☕')).toBeInTheDocument();
  });

  it('shows total actual time', () => {
    // 503 + 312 + 220 = 1035 seconds = 17:15
    render(<CompletionView session={makeSession()} />);
    expect(screen.getByTestId('completion-total-time')).toHaveTextContent('17:15');
  });

  it('shows total planned time', () => {
    // 480 + 300 + 600 = 1380 = 23:00
    render(<CompletionView session={makeSession()} />);
    expect(screen.getByText(/of 23:00 planned/)).toBeInTheDocument();
  });

  it('shows steps completed count', () => {
    render(<CompletionView session={makeSession()} />);
    expect(screen.getByTestId('steps-completed')).toHaveTextContent('3 steps completed');
  });

  it('shows ahead pace message with warm language', () => {
    // Planned 1380, actual 1035 → delta 345s → 6 min ahead
    render(<CompletionView session={makeSession()} />);
    expect(screen.getByTestId('completion-pace')).toHaveTextContent(
      '6 minutes ahead — nice pace',
    );
  });

  it('shows "Right on time" when within 1 minute', () => {
    const session = makeSession({
      steps: [
        {
          id: 's1',
          name: 'Shower',
          plannedDuration: 480,
          originalPlannedDuration: 480,
          elapsedTime: 500,
          status: 'completed',
        },
      ],
    });
    render(<CompletionView session={session} />);
    expect(screen.getByTestId('completion-pace')).toHaveTextContent('Right on time');
  });

  it('shows behind pace message with neutral language (no judgment)', () => {
    const session = makeSession({
      steps: [
        {
          id: 's1',
          name: 'Shower',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 600,
          status: 'completed',
        },
      ],
    });
    // Planned 300, actual 600 → delta -300s → 5 min behind
    render(<CompletionView session={session} />);
    expect(screen.getByTestId('completion-pace')).toHaveTextContent(
      '5 minutes longer than planned',
    );
  });

  it('shows singular minute in behind message', () => {
    const session = makeSession({
      steps: [
        {
          id: 's1',
          name: 'Shower',
          plannedDuration: 300,
          originalPlannedDuration: 300,
          elapsedTime: 390,
          status: 'completed',
        },
      ],
    });
    render(<CompletionView session={session} />);
    expect(screen.getByTestId('completion-pace')).toHaveTextContent(
      '2 minutes longer than planned',
    );
  });

  it('shows step breakdown with actual vs planned times', () => {
    render(<CompletionView session={makeSession()} />);
    const step1 = screen.getByTestId('completion-step-s1');
    expect(step1).toHaveTextContent('Shower');
    expect(step1).toHaveTextContent('8:23');
    expect(step1).toHaveTextContent('8:00');
  });

  it('highlights overrun steps (> 60s over) with (+M:SS)', () => {
    const session = makeSession({
      steps: [
        {
          id: 's1',
          name: 'Shower',
          plannedDuration: 480,
          originalPlannedDuration: 480,
          elapsedTime: 600,
          status: 'completed',
        },
      ],
    });
    // 600 - 480 = 120s overrun > 60s → should show (+2:00)
    render(<CompletionView session={session} />);
    expect(screen.getByTestId('overrun-s1')).toHaveTextContent('(+2:00)');
  });

  it('does not highlight steps with small overrun (<= 60s)', () => {
    const session = makeSession({
      steps: [
        {
          id: 's1',
          name: 'Shower',
          plannedDuration: 480,
          originalPlannedDuration: 480,
          elapsedTime: 510,
          status: 'completed',
        },
      ],
    });
    // 510 - 480 = 30s overrun <= 60s → no overrun indicator
    render(<CompletionView session={session} />);
    expect(screen.queryByTestId('overrun-s1')).not.toBeInTheDocument();
  });

  it('shows skipped steps with ⊘ icon and "skipped" label', () => {
    const session = makeSession({
      steps: [
        {
          id: 's1',
          name: 'Shower',
          plannedDuration: 480,
          originalPlannedDuration: 480,
          elapsedTime: 480,
          status: 'completed',
        },
        {
          id: 's2',
          name: 'Breakfast',
          plannedDuration: 600,
          originalPlannedDuration: 600,
          elapsedTime: 0,
          status: 'skipped',
        },
      ],
    });
    render(<CompletionView session={session} />);
    const skippedStep = screen.getByTestId('completion-step-s2');
    expect(skippedStep).toHaveTextContent('⊘');
    expect(skippedStep).toHaveTextContent('skipped');
    expect(screen.getByTestId('steps-skipped')).toHaveTextContent('1 skipped');
  });

  it('does not show skipped count when no steps are skipped', () => {
    render(<CompletionView session={makeSession()} />);
    expect(screen.queryByTestId('steps-skipped')).not.toBeInTheDocument();
  });

  it('"Back to Library" button navigates to /app', () => {
    render(<CompletionView session={makeSession()} />);
    const doneButton = screen.getByTestId('completion-done-button');
    expect(doneButton).toHaveTextContent('Back to Library');
    fireEvent.click(doneButton);
    expect(mockPush).toHaveBeenCalledWith('/app');
  });

  it('has accessible step breakdown list', () => {
    render(<CompletionView session={makeSession()} />);
    expect(screen.getByRole('list', { name: 'Step breakdown' })).toBeInTheDocument();
  });

  it('shows singular step count', () => {
    const session = makeSession({
      steps: [
        {
          id: 's1',
          name: 'Shower',
          plannedDuration: 480,
          originalPlannedDuration: 480,
          elapsedTime: 480,
          status: 'completed',
        },
      ],
    });
    render(<CompletionView session={session} />);
    expect(screen.getByTestId('steps-completed')).toHaveTextContent('1 step completed');
  });
});
