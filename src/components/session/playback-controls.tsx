'use client';

import { Button } from '@/components/ui/button';

interface PlaybackControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isLastStep: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
  onExtend?: (seconds: number) => void;
}

export function PlaybackControls({
  isRunning,
  isPaused,
  isCompleted,
  isLastStep,
  onPause,
  onResume,
  onSkip,
  onStop,
  onExtend,
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
          disabled={isCompleted}
        >
          ⏭ Skip
        </Button>

        {/* Stop */}
        <Button
          variant="destructive"
          size="lg"
          onClick={onStop}
          aria-label="Stop timer"
        >
          ⏹ Stop
        </Button>
      </div>

      {/* Extension buttons — wired in Story 1.7 */}
      {onExtend && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExtend(60)}
            aria-label="Add 1 minute"
          >
            +1 min
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExtend(300)}
            aria-label="Add 5 minutes"
          >
            +5 min
          </Button>
        </div>
      )}
    </div>
  );
}
