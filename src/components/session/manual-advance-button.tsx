'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ManualAdvanceButtonProps {
  nextStepName: string;
  onStart: () => void;
  onSkip: () => void;
  onStop: () => void;
}

export function ManualAdvanceButton({
  nextStepName,
  onStart,
  onSkip,
  onStop,
}: ManualAdvanceButtonProps) {
  const startButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the Start button on mount
  useEffect(() => {
    startButtonRef.current?.focus();
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-4"
      role="region"
      aria-label="Deferred step resolution"
      data-testid="manual-advance"
    >
      {/* ARIA announcement */}
      <div className="sr-only" aria-live="assertive">
        Step complete. Next step: {nextStepName}. Activate Start button to begin.
      </div>

      {/* Primary action */}
      <Button
        ref={startButtonRef}
        size="lg"
        className="w-full min-h-[48px] text-base"
        onClick={onStart}
        aria-label={`Start ${nextStepName}`}
        data-testid="manual-advance-start"
      >
        ▶ Start {nextStepName}
      </Button>

      {/* Secondary actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          aria-label="Skip step"
          data-testid="manual-advance-skip"
        >
          ⏭ Skip
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onStop}
          aria-label="Stop timer"
          data-testid="manual-advance-stop"
        >
          ⏹ Stop
        </Button>
      </div>
    </div>
  );
}
