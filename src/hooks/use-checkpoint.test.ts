import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckpoint } from './use-checkpoint';

// Mock the checkpoint utility
vi.mock('@/lib/utils/checkpoint', () => ({
  getCheckpointStatus: vi.fn(() => ({
    status: 'ahead',
    diffMinutes: 5,
    message: '5 min early',
  })),
}));

describe('useCheckpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when isActive is false', () => {
    const { result } = renderHook(() =>
      useCheckpoint({ targetTime: '07:30', isActive: false }),
    );
    expect(result.current.status).toBeNull();
  });

  it('returns null when targetTime is undefined', () => {
    const { result } = renderHook(() =>
      useCheckpoint({ targetTime: undefined, isActive: true }),
    );
    expect(result.current.status).toBeNull();
  });

  it('returns CheckpointStatusResult when active with valid targetTime', () => {
    const { result } = renderHook(() =>
      useCheckpoint({ targetTime: '07:30', isActive: true }),
    );
    expect(result.current.status).not.toBeNull();
    expect(result.current.status?.status).toBe('ahead');
    expect(result.current.status?.diffMinutes).toBe(5);
    expect(result.current.status?.message).toBe('5 min early');
  });

  it('cleans up interval on unmount', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() =>
      useCheckpoint({ targetTime: '07:30', isActive: true }),
    );

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('clears status when isActive changes to false', () => {
    const { result, rerender } = renderHook(
      ({ isActive }) => useCheckpoint({ targetTime: '07:30', isActive }),
      { initialProps: { isActive: true } },
    );

    expect(result.current.status).not.toBeNull();

    rerender({ isActive: false });
    expect(result.current.status).toBeNull();
  });
});
