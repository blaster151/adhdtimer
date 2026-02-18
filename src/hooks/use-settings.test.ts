import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './use-settings';

const SHOW_STREAKS_KEY = 'adhd-timer-show-streaks';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns showStreaks as true by default (no localStorage value)', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.showStreaks).toBe(true);
  });

  it('reads showStreaks from localStorage when set to false', () => {
    localStorage.setItem(SHOW_STREAKS_KEY, 'false');
    const { result } = renderHook(() => useSettings());
    expect(result.current.showStreaks).toBe(false);
  });

  it('reads showStreaks from localStorage when set to true', () => {
    localStorage.setItem(SHOW_STREAKS_KEY, 'true');
    const { result } = renderHook(() => useSettings());
    expect(result.current.showStreaks).toBe(true);
  });

  it('setShowStreaks persists to localStorage', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.setShowStreaks(false);
    });

    expect(localStorage.getItem(SHOW_STREAKS_KEY)).toBe('false');
    expect(result.current.showStreaks).toBe(false);
  });

  it('setShowStreaks(true) after false updates correctly', () => {
    localStorage.setItem(SHOW_STREAKS_KEY, 'false');
    const { result } = renderHook(() => useSettings());

    expect(result.current.showStreaks).toBe(false);

    act(() => {
      result.current.setShowStreaks(true);
    });

    expect(localStorage.getItem(SHOW_STREAKS_KEY)).toBe('true');
    expect(result.current.showStreaks).toBe(true);
  });

  it('syncs across multiple hook instances', () => {
    const { result: a } = renderHook(() => useSettings());
    const { result: b } = renderHook(() => useSettings());

    act(() => {
      a.current.setShowStreaks(false);
    });

    // Both should see the updated value
    expect(a.current.showStreaks).toBe(false);
    expect(b.current.showStreaks).toBe(false);
  });
});
