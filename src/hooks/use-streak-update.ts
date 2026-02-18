'use client';

import { useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getTimer, updateTimer } from '@/lib/firebase/timers';
import { calculateStreakUpdate, getMilestone, isScheduledDay } from '@/lib/utils/streaks';
import type { TimerTemplate, Streak } from '@/types/timer';

// ========================================
// Milestone storage (sessionStorage)
// ========================================

const MILESTONE_KEY = 'streak-milestone';

export interface StreakMilestone {
  timerId: string;
  timerName: string;
  count: number;
  message: string;
}

/**
 * Reads and clears the stored milestone (consumed by library on load).
 */
export function consumeStreakMilestone(): StreakMilestone | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(MILESTONE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(MILESTONE_KEY);
  try {
    return JSON.parse(raw) as StreakMilestone;
  } catch {
    return null;
  }
}

function storeStreakMilestone(milestone: StreakMilestone): void {
  sessionStorage.setItem(MILESTONE_KEY, JSON.stringify(milestone));
}

// ========================================
// Hook
// ========================================

/**
 * Returns a function that updates streaks on session completion.
 *
 * Called from the session UI when `isCompleted` becomes true.
 * Loads the timer template to get schedule + streak data,
 * runs `calculateStreakUpdate`, writes the result atomically,
 * and stores any milestone for toast display on library load.
 *
 * Guards:
 * - Skips if timer has no schedule or schedule is disabled
 * - Skips if timer has no streak tracking enabled
 * - Skips if completion is on a non-scheduled day (AC35)
 * - Prevents double-call via ref
 */
export function useStreakUpdate() {
  const { user } = useAuth();
  const hasRun = useRef<Set<string>>(new Set());

  const updateStreakOnCompletion = useCallback(
    async (timerId: string, completionDate: Date = new Date()): Promise<void> => {
      if (!user) return;

      // Prevent duplicate calls for the same session
      const key = `${timerId}:${completionDate.toDateString()}`;
      if (hasRun.current.has(key)) return;
      hasRun.current.add(key);

      try {
        // Load the timer to get current schedule + streak data
        const { data: timer, error } = await getTimer(user.uid, timerId);
        if (error || !timer) return;

        // Guard: no schedule or schedule disabled → AC22-AC24
        if (!timer.schedule?.enabled) return;

        // Guard: no streak tracking → AC25-AC26
        if (!timer.streak) return;

        // Guard: non-scheduled day → AC35
        if (!isScheduledDay(timer.schedule, completionDate)) return;

        // Calculate the updated streak
        const updatedStreak = calculateStreakUpdate(
          timer.streak,
          timer.schedule,
          completionDate,
        );

        // Atomic write → AC31, AC33
        const { error: writeError } = await updateTimer(user.uid, timerId, {
          streak: updatedStreak,
        });

        if (writeError) {
          // AC32: log but don't crash — streak will be retried on next completion
          console.error('Streak update failed:', writeError);
          hasRun.current.delete(key); // allow retry
          return;
        }

        // Check for milestone → AC27-AC30
        const milestone = getMilestone(updatedStreak.currentCount);
        if (milestone) {
          storeStreakMilestone({
            timerId,
            timerName: timer.name,
            count: updatedStreak.currentCount,
            message: milestone,
          });
        }
      } catch (err) {
        console.error('Streak update error:', err);
        hasRun.current.delete(key); // allow retry
      }
    },
    [user],
  );

  return { updateStreakOnCompletion };
}
