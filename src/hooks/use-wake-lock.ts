'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

/**
 * Hook for the Screen Wake Lock API.
 * Keeps the screen awake while a timer is running.
 * Graceful degradation: if unsupported, all calls are no-ops.
 */
export function useWakeLock(): UseWakeLockReturn {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);

  const isSupported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      // Release existing lock before requesting new one
      if (sentinelRef.current) {
        await sentinelRef.current.release();
        sentinelRef.current = null;
      }
      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);

      // Listen for release events (e.g., tab becomes hidden)
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
          setIsActive(false);
        }
      });
    } catch {
      // Wake lock request can fail (e.g., low battery, permissions)
      // Silently degrade — never throw to consumer
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (!sentinelRef.current) return;
    try {
      await sentinelRef.current.release();
      sentinelRef.current = null;
      setIsActive(false);
    } catch {
      // Silently handle release errors
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, []);

  return { isSupported, isActive, request, release };
}
