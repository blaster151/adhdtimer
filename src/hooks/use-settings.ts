'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';

// ========================================
// localStorage-backed settings hook
// ========================================

const SHOW_STREAKS_KEY = 'adhd-timer-show-streaks';

/**
 * Reads a boolean from localStorage with a fallback default.
 * Returns `defaultValue` if the key doesn't exist.
 */
function readBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored === null ? defaultValue : stored === 'true';
}

/**
 * Writes a boolean to localStorage.
 */
function writeBool(key: string, value: boolean): void {
  localStorage.setItem(key, String(value));
}

// ========================================
// External store for cross-component sync
// ========================================

type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getShowStreaksSnapshot(): boolean {
  return readBool(SHOW_STREAKS_KEY, true);
}

function getShowStreaksServerSnapshot(): boolean {
  return true; // SSR default
}

// ========================================
// Hook
// ========================================

/**
 * Central settings hook.
 *
 * Uses `useSyncExternalStore` so all components sharing this hook
 * stay in sync when the value changes (even across components).
 *
 * - `showStreaks`: Whether streak badges are visible (default: true)
 * - `setShowStreaks`: Update the value and persist to localStorage
 */
export function useSettings() {
  const showStreaks = useSyncExternalStore(
    subscribe,
    getShowStreaksSnapshot,
    getShowStreaksServerSnapshot,
  );

  const setShowStreaks = useCallback((value: boolean) => {
    writeBool(SHOW_STREAKS_KEY, value);
    emitChange();
  }, []);

  return { showStreaks, setShowStreaks } as const;
}
