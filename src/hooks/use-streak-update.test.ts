import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreakUpdate, consumeStreakMilestone } from './use-streak-update';
import type { TimerTemplate, Schedule, Streak } from '@/types/timer';

// ========================================
// Mocks
// ========================================

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid', email: 'test@example.com' },
    loading: false,
  }),
}));

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
  updateDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(),
  Timestamp: {
    now: () => ({
      toDate: () => new Date(),
      toMillis: () => Date.now(),
    }),
    fromDate: (d: Date) => ({
      toDate: () => d,
      toMillis: () => d.getTime(),
    }),
  },
}));

const mockGetTimer = vi.fn();
const mockUpdateTimer = vi.fn().mockResolvedValue({ data: undefined, error: null });

vi.mock('@/lib/firebase/timers', () => ({
  getTimer: (...args: unknown[]) => mockGetTimer(...args),
  updateTimer: (...args: unknown[]) => mockUpdateTimer(...args),
}));

// ========================================
// Helpers
// ========================================

function makeTimer(overrides: Partial<TimerTemplate> = {}): TimerTemplate {
  const { Timestamp } = require('firebase/firestore');
  return {
    id: 'timer-1',
    name: 'Morning Routine',
    totalPlannedDuration: 600,
    countdownMode: false,
    steps: [{ id: 's1', name: 'Step 1', plannedDuration: 300 }],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    schedule: {
      enabled: true,
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      timeOfDay: 'morning' as const,
    },
    streak: {
      currentCount: 3,
      lastCompletedDate: '2026-02-16', // Monday (previous day)
      startDate: '2026-02-12',
    },
    ...overrides,
  };
}

// ========================================
// Tests
// ========================================

describe('useStreakUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('updateStreakOnCompletion', () => {
    it('increments streak on consecutive scheduled day (AC13)', async () => {
      const timer = makeTimer();
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());

      // Tuesday Feb 17 — consecutive after Monday Feb 16
      const completionDate = new Date(2026, 1, 17); // Feb 17, 2026 (Tue)

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', completionDate);
      });

      expect(mockGetTimer).toHaveBeenCalledWith('test-uid', 'timer-1');
      expect(mockUpdateTimer).toHaveBeenCalledWith('test-uid', 'timer-1', {
        streak: {
          currentCount: 4,
          lastCompletedDate: '2026-02-17',
          startDate: '2026-02-12', // preserved
        },
      });
    });

    it('resets streak on missed scheduled day (AC19-AC21)', async () => {
      // Last completed Monday, now Wednesday — missed Tuesday
      const timer = makeTimer({
        streak: {
          currentCount: 5,
          lastCompletedDate: '2026-02-16', // Monday
          startDate: '2026-02-09',
        },
      });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const wednesday = new Date(2026, 1, 18); // Feb 18, 2026 (Wed)

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', wednesday);
      });

      expect(mockUpdateTimer).toHaveBeenCalledWith('test-uid', 'timer-1', {
        streak: {
          currentCount: 1,
          lastCompletedDate: '2026-02-18',
          startDate: '2026-02-18',
        },
      });
    });

    it('handles weekend gap on Mon-Fri schedule without reset (AC17-AC18)', async () => {
      // Last completed Friday, now Monday — weekend gap is fine
      const timer = makeTimer({
        streak: {
          currentCount: 5,
          lastCompletedDate: '2026-02-13', // Friday
          startDate: '2026-02-09',
        },
      });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const monday = new Date(2026, 1, 16); // Feb 16, 2026 (Mon)

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', monday);
      });

      expect(mockUpdateTimer).toHaveBeenCalledWith('test-uid', 'timer-1', {
        streak: {
          currentCount: 6,
          lastCompletedDate: '2026-02-16',
          startDate: '2026-02-09', // preserved
        },
      });
    });

    it('starts streak at 1 on first completion (AC13 first)', async () => {
      const timer = makeTimer({
        streak: {
          currentCount: 0,
          lastCompletedDate: '',
          startDate: '',
        },
      });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const date = new Date(2026, 1, 17);

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', date);
      });

      expect(mockUpdateTimer).toHaveBeenCalledWith('test-uid', 'timer-1', {
        streak: {
          currentCount: 1,
          lastCompletedDate: '2026-02-17',
          startDate: '2026-02-17',
        },
      });
    });

    it('does not double-increment on same-day completion (AC34)', async () => {
      const timer = makeTimer({
        streak: {
          currentCount: 3,
          lastCompletedDate: '2026-02-17',
          startDate: '2026-02-12',
        },
      });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const sameDay = new Date(2026, 1, 17);

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', sameDay);
      });

      // Should still write, but count stays same
      expect(mockUpdateTimer).toHaveBeenCalledWith('test-uid', 'timer-1', {
        streak: {
          currentCount: 3,
          lastCompletedDate: '2026-02-17',
          startDate: '2026-02-12',
        },
      });
    });

    it('skips update when timer has no schedule (AC22-AC24)', async () => {
      const timer = makeTimer({ schedule: undefined });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', new Date(2026, 1, 17));
      });

      expect(mockUpdateTimer).not.toHaveBeenCalled();
    });

    it('skips update when schedule is disabled (AC22-AC24)', async () => {
      const timer = makeTimer({
        schedule: { enabled: false, days: ['mon'], timeOfDay: 'morning' },
      });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', new Date(2026, 1, 17));
      });

      expect(mockUpdateTimer).not.toHaveBeenCalled();
    });

    it('skips update when streak tracking is not enabled (AC25-AC26)', async () => {
      const timer = makeTimer({ streak: undefined });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', new Date(2026, 1, 17));
      });

      expect(mockUpdateTimer).not.toHaveBeenCalled();
    });

    it('skips update on non-scheduled day (AC35)', async () => {
      // Saturday is not in Mon-Fri schedule
      const timer = makeTimer();
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const saturday = new Date(2026, 1, 14); // Feb 14, 2026 (Sat)

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', saturday);
      });

      expect(mockUpdateTimer).not.toHaveBeenCalled();
    });

    it('prevents duplicate calls for same timer on same day', async () => {
      const timer = makeTimer();
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const date = new Date(2026, 1, 17);

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', date);
      });

      // Second call with same timer+date
      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', date);
      });

      // getTimer should only have been called once
      expect(mockGetTimer).toHaveBeenCalledTimes(1);
    });

    it('stores milestone in sessionStorage when hit (AC27-AC28)', async () => {
      // Day 6 → Day 7 = milestone
      const timer = makeTimer({
        streak: {
          currentCount: 6,
          lastCompletedDate: '2026-02-16', // Monday
          startDate: '2026-02-10',
        },
      });
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const tuesday = new Date(2026, 1, 17);

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', tuesday);
      });

      // Verify milestone stored
      const milestone = consumeStreakMilestone();
      expect(milestone).not.toBeNull();
      expect(milestone!.count).toBe(7);
      expect(milestone!.message).toBe('One week ☕');
      expect(milestone!.timerName).toBe('Morning Routine');
    });

    it('does not store milestone for non-milestone counts', async () => {
      const timer = makeTimer(); // currentCount 3 → 4
      mockGetTimer.mockResolvedValue({ data: timer, error: null });

      const { result } = renderHook(() => useStreakUpdate());
      const date = new Date(2026, 1, 17);

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', date);
      });

      expect(consumeStreakMilestone()).toBeNull();
    });

    it('handles Firestore write failure gracefully (AC32)', async () => {
      const timer = makeTimer();
      mockGetTimer.mockResolvedValue({ data: timer, error: null });
      mockUpdateTimer.mockResolvedValueOnce({ data: null, error: 'Network error' });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useStreakUpdate());

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', new Date(2026, 1, 17));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Streak update failed:', 'Network error');
      consoleSpy.mockRestore();
    });

    it('handles getTimer failure gracefully', async () => {
      mockGetTimer.mockResolvedValue({ data: null, error: 'Not found' });

      const { result } = renderHook(() => useStreakUpdate());

      await act(async () => {
        await result.current.updateStreakOnCompletion('timer-1', new Date(2026, 1, 17));
      });

      expect(mockUpdateTimer).not.toHaveBeenCalled();
    });
  });

  describe('consumeStreakMilestone', () => {
    it('returns null when no milestone stored', () => {
      expect(consumeStreakMilestone()).toBeNull();
    });

    it('returns stored milestone and clears it', () => {
      sessionStorage.setItem(
        'streak-milestone',
        JSON.stringify({
          timerId: 't1',
          timerName: 'Test',
          count: 7,
          message: 'One week ☕',
        }),
      );

      const milestone = consumeStreakMilestone();
      expect(milestone).not.toBeNull();
      expect(milestone!.count).toBe(7);

      // Second call should return null (consumed)
      expect(consumeStreakMilestone()).toBeNull();
    });

    it('handles invalid JSON gracefully', () => {
      sessionStorage.setItem('streak-milestone', 'not-json');
      expect(consumeStreakMilestone()).toBeNull();
    });
  });
});
