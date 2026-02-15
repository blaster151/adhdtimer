'use client';

import type { PaceStatus } from '@/lib/utils/pace';

interface ProgressRingProps {
  stepProgress: number; // 0–1 (clamped to 1 when overrunning)
  totalProgress: number; // 0–1
  stepName: string;
  elapsedDisplay: string; // formatted time string (countdown or elapsed)
  paceMessage: string;
  paceStatus: PaceStatus;
  isOverrun: boolean;
  isPaused: boolean;
  stepNumber: number;
  totalSteps: number;
  timerName: string;
  ariaElapsedLabel: string; // e.g. "5 minutes 23 seconds elapsed"
}

// Radii from tech spec
const OUTER_RADIUS = 130;
const INNER_RADIUS = 108;
const CENTER = 140;
const VIEWBOX = '0 0 280 280';

const OUTER_CIRCUMFERENCE = 2 * Math.PI * OUTER_RADIUS;
const INNER_CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS;

function paceColor(status: PaceStatus): string {
  switch (status) {
    case 'ahead':
      return 'var(--ahead)';
    case 'on-track':
      return 'var(--on-track)';
    case 'behind':
      return 'var(--behind)';
  }
}

export function ProgressRing({
  stepProgress,
  totalProgress,
  stepName,
  elapsedDisplay,
  paceMessage,
  paceStatus,
  isOverrun,
  isPaused,
  stepNumber,
  totalSteps,
  timerName,
  ariaElapsedLabel,
}: ProgressRingProps) {
  const color = paceColor(isOverrun ? 'behind' : paceStatus);

  // Clamp progress 0–1
  const clampedStep = Math.min(Math.max(stepProgress, 0), 1);
  const clampedTotal = Math.min(Math.max(totalProgress, 0), 1);

  const outerOffset = OUTER_CIRCUMFERENCE * (1 - clampedTotal);
  const innerOffset = INNER_CIRCUMFERENCE * (1 - clampedStep);

  const ariaLabel = `${timerName} progress: step ${stepNumber} of ${totalSteps}, ${stepName}, ${ariaElapsedLabel}, ${paceMessage}`;

  return (
    <div
      className="mx-auto w-[260px] sm:w-[280px] lg:w-[300px]"
      data-testid="progress-ring-container"
    >
      <svg
        viewBox={VIEWBOX}
        role="img"
        aria-label={ariaLabel}
        data-testid="progress-ring"
        className="w-full h-full"
      >
        {/* Outer ring track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          stroke="var(--border)"
          strokeWidth="8"
          fill="none"
          data-testid="outer-track"
        />
        {/* Outer ring progress (total timer) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={OUTER_CIRCUMFERENCE}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          className="ring-progress"
          style={{ willChange: 'stroke-dashoffset' }}
          data-testid="outer-progress"
        />
        {/* Inner ring track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          stroke="var(--border)"
          strokeWidth="10"
          fill="none"
          data-testid="inner-track"
        />
        {/* Inner ring progress (current step) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={INNER_CIRCUMFERENCE}
          strokeDashoffset={innerOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          className="ring-progress"
          style={{ willChange: 'stroke-dashoffset' }}
          data-testid="inner-progress"
        />
        {/* Center text */}
        <text textAnchor="middle" dominantBaseline="central">
          <tspan
            x={CENTER}
            y={isPaused ? 115 : 120}
            className="fill-foreground text-[1rem] font-medium"
            data-testid="ring-step-name"
          >
            {stepName}
          </tspan>
          <tspan
            x={CENTER}
            y={isPaused ? 148 : 155}
            className={`text-[2.8rem] font-light tabular-nums ${isOverrun ? 'fill-[var(--behind)]' : 'fill-foreground'}`}
            data-testid="ring-time-display"
          >
            {elapsedDisplay}
          </tspan>
          <tspan
            x={CENTER}
            y={isPaused ? 175 : 180}
            className="text-[0.75rem]"
            fill={color}
            data-testid="ring-pace-message"
          >
            {paceMessage}
          </tspan>
          {isPaused && (
            <tspan
              x={CENTER}
              y={198}
              className="fill-muted-foreground text-[0.7rem] font-medium tracking-widest"
              data-testid="ring-paused-label"
            >
              PAUSED
            </tspan>
          )}
        </text>
      </svg>
    </div>
  );
}
