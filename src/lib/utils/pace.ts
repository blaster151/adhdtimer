import type { SessionStep } from '@/types/session';

export type PaceStatus = 'ahead' | 'on-track' | 'behind';

export interface PaceResult {
  deltaSeconds: number; // positive = ahead, negative = behind
  status: PaceStatus;
  message: string; // Human-readable pace message
}

/**
 * Calculate cumulative pace (ahead/behind/on-track).
 * Compares cumulative planned duration vs cumulative actual time
 * through the current step.
 *
 * @param steps - All session steps
 * @param currentStepIndex - Index of the currently active step
 * @param currentStepElapsed - Elapsed seconds for the current step
 * @returns PaceResult with delta, status, and human-readable message
 */
export function calculatePace(
  steps: SessionStep[],
  currentStepIndex: number,
  currentStepElapsed: number,
): PaceResult {
  let cumulativePlanned = 0;
  let cumulativeActual = 0;

  for (let i = 0; i < currentStepIndex; i++) {
    cumulativePlanned += steps[i].plannedDuration;
    cumulativeActual += steps[i].elapsedTime;
  }

  // Add current step
  cumulativePlanned += steps[currentStepIndex].plannedDuration;
  cumulativeActual += currentStepElapsed;

  const delta = cumulativePlanned - cumulativeActual; // positive = ahead

  if (Math.abs(delta) <= 30) {
    return { deltaSeconds: delta, status: 'on-track', message: 'Right on track' };
  }

  const minutes = Math.round(Math.abs(delta) / 60);

  if (delta > 0) {
    return {
      deltaSeconds: delta,
      status: 'ahead',
      message: minutes >= 2 ? `${minutes} min ahead — nice pace` : '1 min ahead',
    };
  }

  return {
    deltaSeconds: delta,
    status: 'behind',
    message: minutes >= 2 ? `${minutes} min behind` : '1 min behind',
  };
}
