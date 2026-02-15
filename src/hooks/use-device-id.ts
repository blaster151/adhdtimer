'use client';

import { useMemo } from 'react';

const STORAGE_KEY = 'adhd-timer-device-id';

/**
 * Returns a unique device ID for this browser tab session.
 * Persisted in sessionStorage — survives refresh, new tab = new ID.
 */
export function useDeviceId(): string {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'server';
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }, []);
}

/**
 * Standalone function for use outside React components.
 * Used by useTimerEngine which calls it in callbacks.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
