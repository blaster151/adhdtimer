'use client';

import { useState, useEffect } from 'react';
import { subscribeToSession } from '@/lib/firebase/sessions';
import type { RunSession } from '@/types/session';

export interface UseFirestoreSessionReturn {
  session: RunSession | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribe to real-time updates on a Firestore session document.
 * Returns { session, loading, error } and auto-unsubscribes on unmount.
 */
export function useFirestoreSession(
  userId: string | undefined,
  sessionId: string,
): UseFirestoreSessionReturn {
  const [session, setSession] = useState<RunSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToSession(
      userId,
      sessionId,
      (data) => {
        setSession(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [userId, sessionId]);

  return { session, loading, error };
}
