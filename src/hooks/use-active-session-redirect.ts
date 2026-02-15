'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getActiveSession } from '@/lib/firebase/sessions';

/**
 * Checks for an active (running/paused) session after auth is confirmed.
 * Redirects to the running timer view if found.
 *
 * Returns `{ checking }` — true while the active session query is in flight.
 */
export function useActiveSessionRedirect(): { checking: boolean } {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    async function check() {
      const { data: session } = await getActiveSession(user!.uid);
      if (cancelled) return;
      if (session) {
        router.replace(`/app/sessions/${session.id}`);
      } else {
        setChecking(false);
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  return { checking };
}
