'use client';

import { useRef, useCallback, useState, type PointerEvent } from 'react';

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
  /** True while a swipe gesture is active (moved past dead-zone) */
  isSwiping: boolean;
}

/** Dead-zone in pixels — must drag at least this far to count as a swipe */
const DEAD_ZONE = 6;

/**
 * Hook that provides pointer event handlers for swipe-to-adjust duration.
 * Horizontal drag changes duration: right = increase, left = decrease.
 * Fires haptic feedback on each minute-threshold crossing.
 *
 * A 6px dead-zone distinguishes taps from swipes.  `isSwiping` is true
 * only after the dead-zone is crossed, so the consumer can gate tap
 * behaviour on `!isSwiping`.
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
  const activeRef = useRef(false); // pointer is down
  const swipedRef = useRef(false); // moved past dead-zone
  const pointerIdRef = useRef<number | null>(null);

  // React state so the component re-renders and the tap guard sees the truth
  const [isSwiping, setIsSwiping] = useState(false);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return;
      activeRef.current = true;
      swipedRef.current = false;
      pointerIdRef.current = e.pointerId;
      startXRef.current = e.clientX;
      startValueRef.current = value;
      lastStepRef.current = 0;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [value],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeRef.current || e.pointerId !== pointerIdRef.current) return;

      const deltaX = e.clientX - startXRef.current;

      // Still inside dead-zone — don't treat as swipe yet
      if (!swipedRef.current) {
        if (Math.abs(deltaX) < DEAD_ZONE) return;
        // Crossed dead-zone — commit to swiping
        swipedRef.current = true;
        setIsSwiping(true);
      }

      // Prevent text selection in neighbouring elements while dragging
      e.preventDefault();

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

    const wasSwiping = swipedRef.current;
    activeRef.current = false;
    swipedRef.current = false;
    pointerIdRef.current = null;

    if (wasSwiping) {
      // Reset isSwiping on next micro-tick so the click handler
      // that fires synchronously after pointerup still sees true.
      setTimeout(() => setIsSwiping(false), 0);
    }
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    onPointerCancel: handlePointerEnd,
    isSwiping,
  };
}
