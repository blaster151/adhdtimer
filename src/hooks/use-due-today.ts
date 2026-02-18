'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCompletedTodayIds } from '@/lib/firebase/sessions';
import { sortTimersForLibrary, type SortedTimers } from '@/lib/utils/schedule';
import type { TimerTemplate } from '@/types/timer';

interface UseDueTodayResult {
  /** Timers scheduled for today that haven't been completed yet */
  dueToday: TimerTemplate[];
  /** All other timers (no schedule, wrong day, or completed today) */
  rest: TimerTemplate[];
  /** Set of timer IDs completed today — used for badge rendering */
  completedTodayIds: Set<string>;
  /** True while the completed-today query is in flight */
  loading: boolean;
}

/**
 * Splits a list of timers into "due today" and "rest" groups.
 *
 * - Fetches today's completed session timer IDs from Firestore
 * - Uses `sortTimersForLibrary()` for the split logic
 * - Completed timers stay in dueToday (with completion badge) per AC34/AC35
 *
 * Note: AC34 says completed timers still appear in DUE TODAY. We handle
 * this by running the sort WITHOUT completedTodayIds (so they stay in
 * dueToday), and pass completedTodayIds separately for badge rendering.
 */
export function useDueToday(timers: TimerTemplate[]): UseDueTodayResult {
  const { user } = useAuth();
  const [completedTodayIds, setCompletedTodayIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchCompletedToday() {
      const { data } = await getCompletedTodayIds(user!.uid);
      setCompletedTodayIds(data);
      setLoading(false);
    }

    fetchCompletedToday();
  }, [user]);

  // Per AC34/AC35: completed timers still appear in DUE TODAY (with badge).
  // So we pass an empty completedTodayIds to sortTimersForLibrary — all
  // scheduled-for-today timers land in dueToday regardless of completion.
  const sorted: SortedTimers = useMemo(
    () => sortTimersForLibrary(timers, [], new Date()),
    [timers],
  );

  return {
    dueToday: sorted.dueToday,
    rest: sorted.rest,
    completedTodayIds,
    loading,
  };
}
