import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerForm } from './timer-form';
import type { TimerTemplate } from '@/types/timer';
import { Timestamp } from 'firebase/firestore';

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
    user: { uid: 'test-uid', email: 'test@example.com' },
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
    fireEvent.change(screen.getByLabelText('Step 1 duration'), { target: { value: '10' } });
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
});
