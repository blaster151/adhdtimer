'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getTimers, deleteTimer, duplicateTimer } from '@/lib/firebase/timers';
import type { TimerTemplate } from '@/types/timer';
import { EmptyState } from '@/components/timer/empty-state';
import { TimerCard } from '@/components/timer/timer-card';
import { DeleteDialog } from '@/components/timer/delete-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

function sortTimers(timers: TimerTemplate[]): TimerTemplate[] {
  return [...timers].sort((a, b) => {
    // Never-used timers go to the end
    if (!a.lastUsedAt && !b.lastUsedAt) return 0;
    if (!a.lastUsedAt) return 1;
    if (!b.lastUsedAt) return -1;
    // Most recently used first
    return b.lastUsedAt.toMillis() - a.lastUsedAt.toMillis();
  });
}

export function TimerLibrary() {
  const { user } = useAuth();
  const router = useRouter();
  const [timers, setTimers] = useState<TimerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TimerTemplate | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchTimers() {
      const { data, error } = await getTimers(user!.uid);
      if (error) {
        toast.error('Failed to load timers.');
      }
      setTimers(data);
      setLoading(false);
    }

    fetchTimers();
  }, [user]);

  function handlePlay(timer: TimerTemplate) {
    toast.info(`Play "${timer.name}" — coming in Story 1.6!`);
  }

  function handleEdit(timer: TimerTemplate) {
    router.push(`/app/timers/${timer.id}/edit`);
  }

  function handleDeleteRequest(timer: TimerTemplate) {
    setDeleteTarget(timer);
  }

  async function handleDeleteConfirm() {
    if (!user || !deleteTarget) return;

    const { error } = await deleteTimer(user.uid, deleteTarget.id);
    if (error) {
      toast.error(error);
    } else {
      setTimers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success('Timer deleted');
    }
    setDeleteTarget(null);
  }

  async function handleDuplicate(timer: TimerTemplate) {
    if (!user) return;

    const { data, error } = await duplicateTimer(user.uid, timer.id);
    if (error) {
      toast.error(error);
      return;
    }
    if (data) {
      setTimers((prev) => [data, ...prev]);
      toast.success('Timer duplicated');
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (timers.length === 0) {
    return <EmptyState />;
  }

  const sorted = sortTimers(timers);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Timer Library</h2>
        <Button asChild>
          <Link href="/app/timers/new">+ New Timer</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.map((timer) => (
          <TimerCard
            key={timer.id}
            timer={timer}
            onPlay={handlePlay}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onDuplicate={handleDuplicate}
          />
        ))}
      </div>

      {deleteTarget && (
        <DeleteDialog
          open={!!deleteTarget}
          timerName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
