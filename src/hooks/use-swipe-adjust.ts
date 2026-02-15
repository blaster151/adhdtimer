'use client';

import { useRef, useCallback, type PointerEvent } from 'react';

interface UseSwipeAdjustOptions {
  /** Current duration in seconds */
  value: number;
  /** Called with new duration in seconds on each threshold crossing */
  onChange: (seconds: number) => void;
  /** Minimum duration in seconds (default 60) */
  min?: number;
  /** Pixels per 1-minute increment (default 30) */
  pixelsPerStep?: number;
  /** Seconds per step (default 60) */
  secondsPerStep?: number;
}

interface SwipeHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onPointerCancel: (e: PointerEvent) => void;
  /** True while a swipe gesture is active */
  isSwiping: boolean;
}

/**
 * Hook that provides pointer event handlers for swipe-to-adjust duration.
 * Horizontal drag changes duration: right = increase, left = decrease.
 * Fires haptic feedback on each minute-threshold crossing.
 */
export function useSwipeAdjust({
  value,
  onChange,
  min = 60,
  pixelsPerStep = 30,
  secondsPerStep = 60,
}: UseSwipeAdjustOptions): SwipeHandlers {
  const startXRef = useRef(0);
  const startValueRef = useRef(0);
  const lastStepRef = useRef(0);
  const swipingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Only primary button
      if (e.button !== 0) return;
      swipingRef.current = true;
      pointerIdRef.current = e.pointerId;
      startXRef.current = e.clientX;
      startValueRef.current = value;
      lastStepRef.current = 0;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [value],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!swipingRef.current || e.pointerId !== pointerIdRef.current) return;
      const deltaX = e.clientX - startXRef.current;
      const steps = Math.round(deltaX / pixelsPerStep);

      if (steps !== lastStepRef.current) {
        const newValue = Math.max(
          min,
          startValueRef.current + steps * secondsPerStep,
        );
        onChange(newValue);

        // Haptic feedback on each threshold crossing
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }

        lastStepRef.current = steps;
      }
    },
    [onChange, min, pixelsPerStep, secondsPerStep],
  );

  const handlePointerEnd = useCallback((e: PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return;
    swipingRef.current = false;
    pointerIdRef.current = null;
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    isSwiping: swipingRef.current,
  };
}
