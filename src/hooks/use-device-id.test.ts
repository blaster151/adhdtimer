import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDeviceId, getDeviceId } from './use-device-id';

describe('useDeviceId', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns a string', () => {
    const { result } = renderHook(() => useDeviceId());
    expect(typeof result.current).toBe('string');
  });

  it('generates a UUID format device ID', () => {
    const { result } = renderHook(() => useDeviceId());
    // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(result.current).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('persists device ID in sessionStorage', () => {
    const { result } = renderHook(() => useDeviceId());
    expect(sessionStorage.getItem('adhd-timer-device-id')).toBe(result.current);
  });

  it('returns same ID on subsequent calls', () => {
    const { result: first } = renderHook(() => useDeviceId());
    const { result: second } = renderHook(() => useDeviceId());
    expect(first.current).toBe(second.current);
  });

  it('reads existing device ID from sessionStorage', () => {
    sessionStorage.setItem('adhd-timer-device-id', 'existing-id-123');
    const { result } = renderHook(() => useDeviceId());
    expect(result.current).toBe('existing-id-123');
  });
});

describe('getDeviceId', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns a string', () => {
    expect(typeof getDeviceId()).toBe('string');
  });

  it('persists in sessionStorage', () => {
    const id = getDeviceId();
    expect(sessionStorage.getItem('adhd-timer-device-id')).toBe(id);
  });

  it('returns same value on subsequent calls', () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(first).toBe(second);
  });
});
