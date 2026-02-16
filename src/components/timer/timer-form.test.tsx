import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerForm } from './timer-form';
import type { TimerTemplate } from '@/types/timer';
import { Timestamp } from 'firebase/firestore';

// Polyfill ResizeObserver for Radix Switch
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).slice(2),
});

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    replace: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', email: 'test@example.com', getIdToken: () => Promise.resolve('mock-token') },
    loading: false,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock timer functions
const mockCreateTimer = vi.fn().mockResolvedValue({ data: { id: 'new-timer' }, error: null });
const mockUpdateTimer = vi.fn().mockResolvedValue({ data: undefined, error: null });
vi.mock('@/lib/firebase/timers', () => ({
  createTimer: (...args: unknown[]) => mockCreateTimer(...args),
  updateTimer: (...args: unknown[]) => mockUpdateTimer(...args),
}));

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
  collection: vi.fn(),
  addDoc: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
    fromDate: (d: Date) => ({ toDate: () => d, toMillis: () => d.getTime() }),
  },
}));

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  closestCenter: vi.fn(),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  arrayMove: vi.fn(),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

const mockTimer: TimerTemplate = {
  id: 'timer-123',
  name: 'Morning Routine',
  description: 'My morning routine',
  totalPlannedDuration: 1800,
  countdownMode: false,
  steps: [
    { id: 's1', name: 'Shower', plannedDuration: 600 },
    { id: 's2', name: 'Breakfast', plannedDuration: 1200 },
  ],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

describe('TimerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders timer name input', () => {
    render(<TimerForm />);
    expect(screen.getByLabelText('Timer Name')).toBeInTheDocument();
  });

  it('renders description input', () => {
    render(<TimerForm />);
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
  });

  it('starts with one default step', () => {
    render(<TimerForm />);
    expect(screen.getByLabelText('Step 1 name')).toBeInTheDocument();
  });

  it('shows total duration', () => {
    render(<TimerForm />);
    // Default step is 5 min = 300s = "5:00"
    expect(screen.getByTestId('total-duration')).toHaveTextContent('5:00');
  });

  it('updates total duration when step duration changes', () => {
    render(<TimerForm />);
    // Click the duration to open tap-to-type editor
    fireEvent.click(screen.getByLabelText('Step 1 duration'));
    const input = screen.getByLabelText('Step 1 duration input');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('total-duration')).toHaveTextContent('10:00');
  });

  it('shows validation error for empty name', async () => {
    const { toast } = await import('sonner');
    render(<TimerForm />);
    // Set step name but leave timer name empty
    fireEvent.change(screen.getByLabelText('Step 1 name'), { target: { value: 'Work' } });
    // Submit the form directly to bypass HTML5 required validation
    const form = screen.getByText('Save Timer').closest('form')!;
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalledWith('Timer name is required.');
  });

  it('shows validation error for nameless step', async () => {
    const { toast } = await import('sonner');
    render(<TimerForm />);
    fireEvent.change(screen.getByLabelText('Timer Name'), { target: { value: 'Test Timer' } });
    // Leave step name empty and submit the form directly
    const form = screen.getByText('Save Timer').closest('form')!;
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalledWith('Step 1 needs a name.');
  });

  it('shows validation error when all steps removed', async () => {
    const { toast } = await import('sonner');
    render(<TimerForm />);
    fireEvent.change(screen.getByLabelText('Timer Name'), { target: { value: 'Test Timer' } });
    fireEvent.click(screen.getByLabelText('Remove step 1'));
    fireEvent.click(screen.getByText('Save Timer'));
    expect(toast.error).toHaveBeenCalledWith('Add at least one step.');
  });

  it('calls createTimer on valid submit', async () => {
    render(<TimerForm />);
    fireEvent.change(screen.getByLabelText('Timer Name'), { target: { value: 'Test Timer' } });
    fireEvent.change(screen.getByLabelText('Step 1 name'), { target: { value: 'Work' } });
    fireEvent.click(screen.getByText('Save Timer'));

    await vi.waitFor(() => {
      expect(mockCreateTimer).toHaveBeenCalledOnce();
    });

    expect(mockCreateTimer).toHaveBeenCalledWith('test-uid', expect.objectContaining({
      name: 'Test Timer',
      steps: expect.arrayContaining([
        expect.objectContaining({ name: 'Work', plannedDuration: 300 }),
      ]),
    }));
  });

  it('navigates to /app on cancel', () => {
    render(<TimerForm />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockPush).toHaveBeenCalledWith('/app');
  });

  // ---- Edit mode tests ----

  it('pre-populates fields in edit mode', () => {
    render(<TimerForm initialTimer={mockTimer} />);
    expect(screen.getByLabelText('Timer Name')).toHaveValue('Morning Routine');
    expect(screen.getByLabelText(/Description/)).toHaveValue('My morning routine');
    expect(screen.getByLabelText('Step 1 name')).toHaveValue('Shower');
    expect(screen.getByLabelText('Step 2 name')).toHaveValue('Breakfast');
  });

  it('shows "Update Timer" button in edit mode', () => {
    render(<TimerForm initialTimer={mockTimer} />);
    expect(screen.getByText('Update Timer')).toBeInTheDocument();
  });

  it('calls updateTimer instead of createTimer in edit mode', async () => {
    render(<TimerForm initialTimer={mockTimer} />);
    fireEvent.change(screen.getByLabelText('Timer Name'), { target: { value: 'Updated Routine' } });
    fireEvent.click(screen.getByText('Update Timer'));

    await vi.waitFor(() => {
      expect(mockUpdateTimer).toHaveBeenCalledOnce();
    });

    expect(mockUpdateTimer).toHaveBeenCalledWith(
      'test-uid',
      'timer-123',
      expect.objectContaining({ name: 'Updated Routine' }),
    );
    expect(mockCreateTimer).not.toHaveBeenCalled();
  });

  it('shows success toast on update', async () => {
    const { toast } = await import('sonner');
    render(<TimerForm initialTimer={mockTimer} />);
    fireEvent.click(screen.getByText('Update Timer'));

    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Timer updated!');
    });
  });

  // ---- Countdown mode tests ----

  it('renders countdown mode toggle', () => {
    render(<TimerForm />);
    expect(screen.getByLabelText('Countdown mode')).toBeInTheDocument();
    expect(screen.getByText('Show remaining time instead of elapsed')).toBeInTheDocument();
  });

  it('countdown toggle defaults to off', () => {
    render(<TimerForm />);
    const toggle = screen.getByLabelText('Countdown mode');
    expect(toggle).toHaveAttribute('data-state', 'unchecked');
  });

  it('pre-populates countdown toggle from initialTimer', () => {
    const timerWithCountdown = { ...mockTimer, countdownMode: true };
    render(<TimerForm initialTimer={timerWithCountdown} />);
    const toggle = screen.getByLabelText('Countdown mode');
    expect(toggle).toHaveAttribute('data-state', 'checked');
  });

  it('saves countdownMode when creating timer', async () => {
    render(<TimerForm />);
    fireEvent.change(screen.getByLabelText('Timer Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Step 1 name'), { target: { value: 'Work' } });
    // Toggle countdown on
    fireEvent.click(screen.getByLabelText('Countdown mode'));
    fireEvent.click(screen.getByText('Save Timer'));

    await vi.waitFor(() => {
      expect(mockCreateTimer).toHaveBeenCalledOnce();
    });
    expect(mockCreateTimer).toHaveBeenCalledWith(
      'test-uid',
      expect.objectContaining({ countdownMode: true }),
    );
  });

  // ---- AI integration tests ----

  it('shows AI breakdown panel in create mode', () => {
    render(<TimerForm />);
    expect(screen.getByText('AI Task Breakdown')).toBeInTheDocument();
  });

  it('does not show AI breakdown panel in edit mode', () => {
    render(<TimerForm initialTimer={mockTimer} />);
    expect(screen.queryByText('AI Task Breakdown')).not.toBeInTheDocument();
  });

  it('populates form with AI-generated steps', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timerName: 'Do Laundry',
        steps: [
          { name: 'Sort clothes', durationMinutes: 5 },
          { name: 'Load washer', durationMinutes: 3 },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<TimerForm />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByLabelText('Timer Name')).toHaveValue('Do Laundry');
    });

    // Steps populated
    expect(screen.getByLabelText('Step 1 name')).toHaveValue('Sort clothes');
    expect(screen.getByLabelText('Step 2 name')).toHaveValue('Load washer');
  });

  it('does not overwrite manually typed name on AI generation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timerName: 'Do Laundry',
        steps: [{ name: 'Sort clothes', durationMinutes: 5 }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<TimerForm />);
    // User manually types a name first
    fireEvent.change(screen.getByLabelText('Timer Name'), { target: { value: 'My Custom Name' } });

    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByLabelText('Step 1 name')).toHaveValue('Sort clothes');
    });

    // Name was NOT overwritten
    expect(screen.getByLabelText('Timer Name')).toHaveValue('My Custom Name');
  });

  it('saves AI-generated timer identically to manual creation', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        timerName: 'Do Laundry',
        steps: [{ name: 'Sort clothes', durationMinutes: 5 }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<TimerForm />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByLabelText('Timer Name')).toHaveValue('Do Laundry');
    });

    fireEvent.click(screen.getByText('Save Timer'));

    await vi.waitFor(() => {
      expect(mockCreateTimer).toHaveBeenCalledOnce();
    });

    expect(mockCreateTimer).toHaveBeenCalledWith(
      'test-uid',
      expect.objectContaining({
        name: 'Do Laundry',
        steps: expect.arrayContaining([
          expect.objectContaining({ name: 'Sort clothes', plannedDuration: 300 }),
        ]),
      }),
    );
  });

  // ---- Pause between steps tests ----

  it('renders pause between steps toggle', () => {
    render(<TimerForm />);
    expect(screen.getByLabelText('Pause between steps')).toBeInTheDocument();
    expect(screen.getByText('Timer pauses at each step transition. Tap to start the next step.')).toBeInTheDocument();
  });

  it('pause between steps toggle defaults to off', () => {
    render(<TimerForm />);
    const toggle = screen.getByLabelText('Pause between steps');
    expect(toggle).toHaveAttribute('data-state', 'unchecked');
  });

  it('pre-populates pause toggle from initialTimer', () => {
    const timerWithPause = { ...mockTimer, pauseBetweenSteps: true };
    render(<TimerForm initialTimer={timerWithPause} />);
    const toggle = screen.getByLabelText('Pause between steps');
    expect(toggle).toHaveAttribute('data-state', 'checked');
  });

  it('saves pauseBetweenSteps when creating timer', async () => {
    render(<TimerForm />);
    fireEvent.change(screen.getByLabelText('Timer Name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Step 1 name'), { target: { value: 'Work' } });
    fireEvent.click(screen.getByLabelText('Pause between steps'));
    fireEvent.click(screen.getByText('Save Timer'));

    await vi.waitFor(() => {
      expect(mockCreateTimer).toHaveBeenCalledOnce();
    });
    expect(mockCreateTimer).toHaveBeenCalledWith(
      'test-uid',
      expect.objectContaining({ pauseBetweenSteps: true }),
    );
  });
});
