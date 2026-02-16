'use client';

import { Button } from '@/components/ui/button';
import { DeferButton } from '@/components/session/defer-button';
import type { StepType } from '@/types/timer';

interface PlaybackControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isLastStep: boolean;
  disabled?: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
  onExtend?: (seconds: number) => void;
  onDefer?: () => void;
  currentStepType?: StepType;
}

export function PlaybackControls({
  isRunning,
  isPaused,
  isCompleted,
  isLastStep,
  disabled = false,
  onPause,
  onResume,
  onSkip,
  onStop,
  onExtend,
  onDefer,
  currentStepType,
}: PlaybackControlsProps) {
  if (isCompleted) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Primary controls */}
      <div className="flex items-center gap-3">
        {/* Pause / Resume */}
        {isRunning && (
          <Button
            size="lg"
            onClick={onPause}
            aria-label="Pause"
            className="min-w-[120px]"
            disabled={disabled}
          >
            ⏸ Pause
          </Button>
        )}
        {isPaused && (
          <Button
            size="lg"
            onClick={onResume}
            aria-label="Resume"
            className="min-w-[120px]"
            disabled={disabled}
          >
            ▶ Resume
          </Button>
        )}

        {/* Skip */}
        <Button
          variant="outline"
          size="lg"
          onClick={onSkip}
          aria-label="Skip step"
          disabled={isCompleted || disabled}
        >
          ⏭ Skip
        </Button>

        {/* Stop */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onStop}
          aria-label="Stop timer"
          disabled={disabled}
        >
          ⏹ Stop
        </Button>
      </div>

      {/* Extension buttons */}
      {onExtend && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExtend(60)}
            aria-label="Add 1 minute"
            disabled={disabled}
          >
            +1 min
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExtend(300)}
            aria-label="Add 5 minutes"
            disabled={disabled}
          >
            +5 min
          </Button>
          {onDefer && (
            <DeferButton
              onDefer={onDefer}
              disabled={disabled || currentStepType === 'checkpoint'}
            />
          )}
        </div>
      )}
    </div>
  );
}
