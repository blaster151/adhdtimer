'use client';

import { TimerLibrary } from '@/components/timer/timer-library';
import { useActiveSessions } from '@/hooks/use-active-session-redirect';
import { Skeleton } from '@/components/ui/skeleton';

export default function TimerLibraryPage() {
  const { checking, activeSessions } = useActiveSessions();

  if (checking) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-24">
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <TimerLibrary activeSessions={activeSessions} />
    </div>
  );
}
