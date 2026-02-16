'use client';

import { useState, useEffect, useRef } from 'react';
import { getCheckpointStatus } from '@/lib/utils/checkpoint';
import type { CheckpointStatusResult } from '@/lib/utils/checkpoint';

interface UseCheckpointOptions {
  targetTime: string | undefined;
  isActive: boolean;
}

interface UseCheckpointReturn {
  status: CheckpointStatusResult | null;
}

/**
 * Reactive checkpoint status — re-computes every second while active.
 * Returns the ahead/on-time/behind status for a checkpoint's target time.
 */
export function useCheckpoint({ targetTime, isActive }: UseCheckpointOptions): UseCheckpointReturn {
  const [status, setStatus] = useState<CheckpointStatusResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive || !targetTime) {
      setStatus(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Compute immediately
    setStatus(getCheckpointStatus(targetTime));

    // Re-compute every second
    intervalRef.current = setInterval(() => {
      setStatus(getCheckpointStatus(targetTime));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetTime, isActive]);

  return { status };
}
