'use client';

import { useAuth } from '@/hooks/use-auth';

export default function TimerLibraryPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-2 text-2xl font-semibold text-foreground">Timer Library</h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Welcome, {user?.displayName || user?.email || 'friend'}!
      </p>

      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-12 text-center">
        <p className="text-lg text-muted-foreground">No timers yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Coming in Story 1.4 — Create your first timer!
        </p>
      </div>
    </div>
  );
}
