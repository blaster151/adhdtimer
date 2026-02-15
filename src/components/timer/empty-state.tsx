'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-12 text-center">
      <div className="mb-4 text-5xl">🌲</div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">Create your first timer</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Build a routine with named steps and durations. Perfect for morning routines, work sprints,
        or anything that needs gentle structure.
      </p>
      <Button asChild>
        <Link href="/app/timers/new">Create Timer</Link>
      </Button>
    </div>
  );
}
