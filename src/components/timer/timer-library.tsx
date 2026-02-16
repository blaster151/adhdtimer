'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getDeviceId } from '@/hooks/use-device-id';
import { getTimers, deleteTimer, duplicateTimer, updateTimer } from '@/lib/firebase/timers';
import { createSession } from '@/lib/firebase/sessions';
import { Timestamp } from 'firebase/firestore';
import type { TimerTemplate } from '@/types/timer';
import type { RunSession } from '@/types/session';
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

interface TimerLibraryProps {
  activeSessions?: RunSession[];
}

export function TimerLibrary({ activeSessions = [] }: TimerLibraryProps) {
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

  async function handlePlay(timer: TimerTemplate) {
    if (!user) return;

    // Block new session creation when offline
    if (!navigator.onLine) {
      toast.error('Connect to internet to start a timer');
      return;
    }

    const deviceId = getDeviceId();
    const { data: session, error } = await createSession(user.uid, timer, deviceId);
    if (error || !session) {
      toast.error(error ?? 'Failed to start timer');
      return;
    }

    // Update lastUsedAt
    await updateTimer(user.uid, timer.id, { lastUsedAt: Timestamp.fromDate(new Date()) });

    router.push(`/app/sessions/${session.id}`);
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
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

      <div className="grid grid-cols-1 gap-3">
        {sorted.map((timer) => (
          <TimerCard
            key={timer.id}
            timer={timer}
            activeSession={activeSessions.find((s) => s.timerId === timer.id)}
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
