'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getTimer } from '@/lib/firebase/timers';
import type { TimerTemplate } from '@/types/timer';
import { TimerForm } from '@/components/timer/timer-form';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function EditTimerPage() {
  const params = useParams<{ timerId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [timer, setTimer] = useState<TimerTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !params.timerId) return;

    async function fetchTimer() {
      const { data, error } = await getTimer(user!.uid, params.timerId);
      if (error || !data) {
        toast.error(error ?? 'Timer not found');
        router.push('/app');
        return;
      }
      setTimer(data);
      setLoading(false);
    }

    fetchTimer();
  }, [user, params.timerId, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!timer) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Edit Timer</h1>
      <TimerForm initialTimer={timer} />
    </div>
  );
}
