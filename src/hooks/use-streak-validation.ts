'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updateTimer } from '@/lib/firebase/timers';
import { validateStreak } from '@/lib/utils/streaks';
import type { TimerTemplate } from '@/types/timer';

/**
 * On mount, validates all timer streaks against their schedules.
 * If a streak is stale (missed scheduled days), silently resets it
 * in Firestore. Runs once per mount — no user notification.
 *
 * `onTimerUpdate` callback lets the parent update its local state
 * after a Firestore write, avoiding a full refetch.
 */
export function useStreakValidation(
  timers: TimerTemplate[],
  onTimerUpdate?: (timerId: string, updates: Partial<TimerTemplate>) => void,
) {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || timers.length === 0 || hasRun.current) return;
    hasRun.current = true;

    async function validate() {
      const today = new Date();

      for (const timer of timers) {
        if (!timer.streak || !timer.schedule || timer.streak.currentCount === 0) continue;

        const resetStreak = validateStreak(timer.streak, timer.schedule, today);
        if (resetStreak) {
          // Stale streak — reset in Firestore
          await updateTimer(user!.uid, timer.id, { streak: resetStreak });
          onTimerUpdate?.(timer.id, { streak: resetStreak });
        }
      }
    }

    validate();
  }, [user, timers, onTimerUpdate]);
}
