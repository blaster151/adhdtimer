'use client';

import { useEffect, useState } from 'react';
import type { PaceStatus } from '@/lib/utils/pace';

interface TransitionOverlayProps {
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  paceMessage: string;
  paceStatus: PaceStatus;
  visible: boolean;
}

function paceColorClass(status: PaceStatus): string {
  switch (status) {
    case 'ahead':
      return 'text-[var(--ahead)]';
    case 'on-track':
      return 'text-[var(--on-track)]';
    case 'behind':
      return 'text-[var(--behind)]';
  }
}

export function TransitionOverlay({
  stepName,
  stepNumber,
  totalSteps,
  paceMessage,
  paceStatus,
  visible,
}: TransitionOverlayProps) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      setFadeOut(false);

      // Start fade-out after 3.5 seconds
      const fadeTimer = setTimeout(() => {
        setFadeOut(true);
      }, 3500);

      // Remove after fade-out completes (500ms transition)
      const hideTimer = setTimeout(() => {
        setShow(false);
        setFadeOut(false);
      }, 4000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShow(false);
      setFadeOut(false);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div
      className={`
        pointer-events-none fixed inset-0 z-50
        flex items-center justify-center
        bg-black/40 backdrop-blur-sm
        transition-opacity duration-500
        motion-reduce:transition-none
        ${fadeOut ? 'opacity-0' : 'opacity-100'}
      `}
      data-testid="transition-overlay"
    >
      <div
        className="pointer-events-none rounded-2xl bg-surface/95 px-8 py-6 text-center shadow-lg"
        aria-live="polite"
        role="status"
      >
        <p className="text-sm text-muted-foreground">
          Step {stepNumber} of {totalSteps}
        </p>
        <p className="mt-2 text-xl font-semibold text-foreground">
          Time to start {stepName}
        </p>
        <p className={`mt-2 text-sm font-medium ${paceColorClass(paceStatus)}`}>
          {paceMessage}
        </p>
      </div>
    </div>
  );
}
