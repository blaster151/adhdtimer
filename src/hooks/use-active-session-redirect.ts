'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { onActiveSessionsSnapshot } from '@/lib/firebase/sessions';
import type { RunSession } from '@/types/session';

/**
 * Subscribes to ALL active (running/paused) sessions in real time.
 *
 * Returns `{ checking, activeSessions }`.
 * - `checking` is true while the initial snapshot is pending.
 * - `activeSessions` is the full list of running/paused sessions.
 */
export function useActiveSessions(): {
  checking: boolean;
  activeSessions: RunSession[];
} {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [activeSessions, setActiveSessions] = useState<RunSession[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }

    const unsubscribe = onActiveSessionsSnapshot(
      user.uid,
      (sessions) => {
        setActiveSessions(sessions);
        setChecking(false);
      },
      (error) => {
        console.error('Active sessions query failed:', error);
        // Don't hang on skeleton forever — show the library even if query fails
        setChecking(false);
      },
    );

    return unsubscribe;
  }, [user, authLoading]);

  return { checking, activeSessions };
}
