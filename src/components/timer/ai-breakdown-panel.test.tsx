import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIBreakdownPanel } from './ai-breakdown-panel';

// Mock useAuth
const mockGetIdToken = vi.fn().mockResolvedValue('mock-token');
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', getIdToken: mockGetIdToken },
    loading: false,
  }),
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
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('AIBreakdownPanel', () => {
  const onStepsGenerated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input and button in idle state', () => {
    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    expect(screen.getByLabelText('Task description')).toBeInTheDocument();
    expect(screen.getByText('Break it down ✨')).toBeInTheDocument();
  });

  it('renders AI section heading', () => {
    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    expect(screen.getByText('AI Task Breakdown')).toBeInTheDocument();
  });

  it('prevents API call when input is empty', () => {
    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.click(screen.getByText('Break it down ✨'));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText('Please describe a task first.')).toBeInTheDocument();
  });

  it('shows input error styling when empty and submitted', () => {
    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.click(screen.getByText('Break it down ✨'));
    expect(screen.getByLabelText('Task description')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows loading state with spinner and skeletons', async () => {
    // Make fetch hang
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);

    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByText('Breaking it down…')).toBeInTheDocument();
    });

    // Button disabled during loading
    expect(screen.getByText('Breaking it down…').closest('button')).toBeDisabled();
    // Input disabled during loading
    expect(screen.getByLabelText('Task description')).toBeDisabled();
    // Skeleton rows shown
    expect(screen.getByLabelText('Loading AI breakdown')).toBeInTheDocument();
  });

  it('calls onStepsGenerated on successful response', async () => {
    const mockResponse = {
      timerName: 'Do Laundry',
      steps: [
        { name: 'Sort clothes', durationMinutes: 5 },
        { name: 'Load washer', durationMinutes: 3 },
      ],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(onStepsGenerated).toHaveBeenCalledWith('Do Laundry', mockResponse.steps);
    });
  });

  it('sends correct request to API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ timerName: 'Test', steps: [{ name: 'A', durationMinutes: 1 }] }),
    });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'clean kitchen' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/ai/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
        body: JSON.stringify({ taskName: 'clean kitchen' }),
      });
    });
  });

  it('shows error message on API failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Couldn't generate steps right now." }),
    });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("Couldn't generate steps right now.");
    });

    // Button re-enabled
    expect(screen.getByText('Break it down ✨')).not.toBeDisabled();
  });

  it('shows rate limit message on 429', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "You've used all 20 AI breakdowns today. Try again tomorrow!" }),
    });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('20 AI breakdowns today');
    });
  });

  it('shows generic error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        "Couldn't generate steps — try again or create manually.",
      );
    });
  });

  it('clears input after successful generation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        timerName: 'Test',
        steps: [{ name: 'Step', durationMinutes: 1 }],
      }),
    });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(onStepsGenerated).toHaveBeenCalled();
    });
    expect(screen.getByLabelText('Task description')).toHaveValue('');
  });

  it('triggers breakdown on Enter key', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        timerName: 'Test',
        steps: [{ name: 'Step', durationMinutes: 1 }],
      }),
    });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    const input = screen.getByLabelText('Task description');
    fireEvent.change(input, { target: { value: 'do laundry' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // ---- Regenerate tests ----

  it('shows Regenerate button after successful generation', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        timerName: 'Test',
        steps: [{ name: 'Step', durationMinutes: 1 }],
      }),
    });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByText('Regenerate')).toBeInTheDocument();
    });
  });

  it('does not show Regenerate button before generation', () => {
    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
  });

  it('calls API with same task name on Regenerate', async () => {
    const firstResponse = {
      ok: true,
      json: async () => ({
        timerName: 'Do Laundry',
        steps: [{ name: 'Sort', durationMinutes: 5 }],
      }),
    };
    const secondResponse = {
      ok: true,
      json: async () => ({
        timerName: 'Do Laundry V2',
        steps: [{ name: 'Sort better', durationMinutes: 3 }],
      }),
    };
    mockFetch.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByText('Regenerate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Regenerate'));

    await vi.waitFor(() => {
      expect(onStepsGenerated).toHaveBeenCalledTimes(2);
    });

    // Both calls used same task name
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const firstCall = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    const secondCall = JSON.parse((mockFetch.mock.calls[1] as [string, RequestInit])[1].body as string);
    expect(firstCall.taskName).toBe('do laundry');
    expect(secondCall.taskName).toBe('do laundry');
  });

  it('disables Regenerate button and shows hint on rate limit', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          timerName: 'Test',
          steps: [{ name: 'Step', durationMinutes: 1 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "You've used all 20 AI breakdowns today. Try again tomorrow!" }),
      });

    render(<AIBreakdownPanel onStepsGenerated={onStepsGenerated} />);
    fireEvent.change(screen.getByLabelText('Task description'), {
      target: { value: 'do laundry' },
    });
    fireEvent.click(screen.getByText('Break it down ✨'));

    await vi.waitFor(() => {
      expect(screen.getByText('Regenerate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Regenerate'));

    await vi.waitFor(() => {
      expect(screen.getByText('20/20 used today')).toBeInTheDocument();
    });
    expect(screen.getByText('Regenerate')).toBeDisabled();
  });
});
