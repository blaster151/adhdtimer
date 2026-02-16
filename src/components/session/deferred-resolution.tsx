'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils/time';

interface DeferredResolutionProps {
  stepName: string;
  plannedDuration: number; // seconds
  onStart: () => void;
  onSkip: () => void;
  onDeferAgain: () => void;
}

export function DeferredResolution({
  stepName,
  plannedDuration,
  onStart,
  onSkip,
  onDeferAgain,
}: DeferredResolutionProps) {
  const startRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the Start button on mount
  useEffect(() => {
    startRef.current?.focus();
  }, []);

  return (
    <div
      role="region"
      aria-label="Deferred step resolution"
      className="space-y-4"
      data-testid="deferred-resolution"
    >
      {/* Step name with ↩ prefix */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground" data-testid="deferred-step-name">
          ↩ {stepName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="deferred-step-duration">
          {formatDuration(plannedDuration)}
        </p>
      </div>

      {/* ARIA live announcement */}
      <div className="sr-only" aria-live="polite">
        Deferred step: {stepName}. {formatDuration(plannedDuration)}. Activate Start button to begin.
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <Button
          ref={startRef}
          onClick={onStart}
          size="lg"
          className="w-full"
          data-testid="deferred-start"
        >
          ▶ Start
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="flex-1"
            data-testid="deferred-skip"
          >
            ⏭ Skip
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeferAgain}
            className="flex-1"
            data-testid="deferred-defer-again"
          >
            ↩ Defer again
          </Button>
        </div>
      </div>
    </div>
  );
}
