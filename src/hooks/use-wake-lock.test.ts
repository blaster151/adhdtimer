import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from './use-wake-lock';

describe('useWakeLock', () => {
  let mockSentinel: {
    release: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSentinel = {
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects wake lock support', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isSupported).toBe(true);
  });

  it('starts with isActive = false', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isActive).toBe(false);
  });

  it('request() acquires wake lock and sets isActive = true', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });

    expect(mockRequest).toHaveBeenCalledWith('screen');
    expect(result.current.isActive).toBe(true);
  });

  it('release() releases wake lock and sets isActive = false', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });
    expect(result.current.isActive).toBe(true);

    await act(async () => {
      await result.current.release();
    });
    expect(mockSentinel.release).toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);
  });

  it('release() is a no-op when no lock is held', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.release();
    });
    // Should not throw
    expect(result.current.isActive).toBe(false);
  });

  it('request() releases existing lock before acquiring new one', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });

    const secondSentinel = {
      release: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockRequest.mockResolvedValueOnce(secondSentinel);

    await act(async () => {
      await result.current.request();
    });

    expect(mockSentinel.release).toHaveBeenCalled();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it('handles request() failure gracefully', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Low battery'));

    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });

    // Should not throw, isActive stays false
    expect(result.current.isActive).toBe(false);
  });

  it('handles release() failure gracefully', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });

    mockSentinel.release.mockRejectedValueOnce(new Error('Release failed'));

    await act(async () => {
      await result.current.release();
    });

    // Should not throw, isActive resets to false
    expect(result.current.isActive).toBe(false);
  });

  it('releases lock on unmount', async () => {
    const { result, unmount } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });

    unmount();
    expect(mockSentinel.release).toHaveBeenCalled();
  });

  it('registers release event listener on sentinel', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });

    expect(mockSentinel.addEventListener).toHaveBeenCalledWith(
      'release',
      expect.any(Function),
    );
  });

  it('updates isActive to false when sentinel fires release event', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });
    expect(result.current.isActive).toBe(true);

    // Simulate the browser releasing the wake lock (e.g., tab hidden)
    const releaseHandler = mockSentinel.addEventListener.mock.calls.find(
      (call) => call[0] === 'release',
    )?.[1];

    await act(async () => {
      releaseHandler?.();
    });

    expect(result.current.isActive).toBe(false);
  });
});

describe('useWakeLock (unsupported browser)', () => {
  let originalWakeLock: unknown;

  beforeEach(() => {
    // Save and remove wakeLock from navigator
    originalWakeLock = Object.getOwnPropertyDescriptor(navigator, 'wakeLock');
    // @ts-expect-error - deleting for test
    delete (navigator as Record<string, unknown>).wakeLock;
  });

  afterEach(() => {
    // Restore wakeLock
    if (originalWakeLock) {
      Object.defineProperty(navigator, 'wakeLock', originalWakeLock as PropertyDescriptor);
    }
  });

  it('isSupported is false when API is not available', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isSupported).toBe(false);
  });

  it('request() is a no-op in unsupported browser', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.request();
    });

    // Should not throw, isActive stays false
    expect(result.current.isActive).toBe(false);
  });

  it('release() is a no-op in unsupported browser', async () => {
    const { result } = renderHook(() => useWakeLock());

    await act(async () => {
      await result.current.release();
    });

    expect(result.current.isActive).toBe(false);
  });
});
