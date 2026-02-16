'use client';

import { useRouter } from 'next/navigation';
import type { RunSession } from '@/types/session';
import { formatDuration } from '@/lib/utils/time';
import { Button } from '@/components/ui/button';

interface CompletionViewProps {
  session: RunSession;
}

interface CompletionStats {
  totalActualTime: number;
  totalPlannedTime: number;
  stepsCompleted: number;
  stepsSkipped: number;
  deltaSeconds: number; // positive = ahead, negative = behind
  paceMessage: string;
  deferredCount: number;       // steps that were deferred at any point
  deferredCompleted: number;   // deferred steps eventually completed
  deferredSkipped: number;     // deferred steps skipped during resolution
}

function calculateCompletionStats(session: RunSession): CompletionStats {
  let totalActualTime = 0;
  let totalPlannedTime = 0;
  let stepsCompleted = 0;
  let stepsSkipped = 0;
  let deferredCount = 0;
  let deferredCompleted = 0;
  let deferredSkipped = 0;

  for (const step of session.steps) {
    totalPlannedTime += step.originalPlannedDuration;
    if (step.status === 'completed') {
      totalActualTime += step.elapsedTime;
      stepsCompleted++;
    } else if (step.status === 'skipped') {
      stepsSkipped++;
    }

    // Track deferred steps via wasDeferred flag
    if (step.wasDeferred) {
      deferredCount++;
      if (step.status === 'completed') {
        deferredCompleted++;
      } else if (step.status === 'skipped') {
        deferredSkipped++;
      }
    }
  }

  const delta = totalPlannedTime - totalActualTime; // positive = ahead
  const absDeltaMinutes = Math.round(Math.abs(delta) / 60);

  let paceMessage: string;
  if (Math.abs(delta) <= 60) {
    paceMessage = 'Right on time';
  } else if (delta > 0) {
    paceMessage =
      absDeltaMinutes === 1
        ? '1 minute ahead — nice pace'
        : `${absDeltaMinutes} minutes ahead — nice pace`;
  } else {
    paceMessage =
      absDeltaMinutes === 1
        ? '1 minute longer than planned'
        : `${absDeltaMinutes} minutes longer than planned`;
  }

  return {
    totalActualTime,
    totalPlannedTime,
    stepsCompleted,
    stepsSkipped,
    deltaSeconds: delta,
    paceMessage,
    deferredCount,
    deferredCompleted,
    deferredSkipped,
  };
}

export function CompletionView({ session }: CompletionViewProps) {
  const router = useRouter();
  const stats = calculateCompletionStats(session);

  return (
    <div className="mx-auto max-w-lg space-y-6" data-testid="completion-view">
      {/* Hero heading */}
      <div className="text-center">
        <p className="text-5xl" role="img" aria-label="coffee">
          ☕
        </p>
        <h1 className="mt-3 text-3xl font-bold text-primary" data-testid="completion-heading">
          Done!
        </h1>
      </div>

      {/* Total time — large display */}
      <div className="text-center">
        <p
          className="text-4xl font-mono font-bold tabular-nums text-foreground"
          data-testid="completion-total-time"
        >
          {formatDuration(stats.totalActualTime)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          of {formatDuration(stats.totalPlannedTime)} planned
        </p>
      </div>

      {/* Pace summary */}
      <p
        className={`text-center text-lg font-medium ${
          stats.deltaSeconds > 60
            ? 'text-[var(--ahead)]'
            : stats.deltaSeconds < -60
              ? 'text-[var(--behind)]'
              : 'text-[var(--on-track)]'
        }`}
        data-testid="completion-pace"
      >
        {stats.paceMessage}
      </p>

      {/* Stats row */}
      <div className="flex justify-center gap-8 text-sm text-muted-foreground">
        <span data-testid="steps-completed">
          {stats.stepsCompleted} step{stats.stepsCompleted === 1 ? '' : 's'} completed
        </span>
        {stats.stepsSkipped > 0 && (
          <span data-testid="steps-skipped">
            {stats.stepsSkipped} skipped
          </span>
        )}
      </div>

      {/* Deferred summary — only shown when steps were deferred */}
      {stats.deferredCount > 0 && (
        <p
          className="text-center text-xs text-muted-foreground"
          data-testid="deferred-summary"
        >
          {stats.deferredCount} step{stats.deferredCount === 1 ? '' : 's'} deferred
          {stats.deferredCompleted > 0 && `, ${stats.deferredCompleted} completed later`}
          {stats.deferredSkipped > 0 && `, ${stats.deferredSkipped} skipped`}
        </p>
      )}

      {/* Step breakdown */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Steps</h2>
        <ul className="space-y-2" aria-label="Step breakdown">
          {session.steps.map((step) => {
            const isStepOverrun =
              step.status === 'completed' &&
              step.elapsedTime - step.originalPlannedDuration > 60;
            const overrunAmount = step.elapsedTime - step.originalPlannedDuration;

            return (
              <li
                key={step.id}
                className="flex items-center gap-2 text-sm"
                data-testid={`completion-step-${step.id}`}
              >
                {/* Status icon */}
                <span className="w-5 text-center">
                  {step.status === 'skipped' ? (
                    <span className="text-muted-foreground">⊘</span>
                  ) : step.status === 'deferred' ? (
                    <span className="text-muted-foreground">↩</span>
                  ) : (
                    <span className="text-primary">✓</span>
                  )}
                </span>

                {/* Step name */}
                <span
                  className={`flex-1 ${step.status === 'skipped' || step.status === 'deferred' ? 'text-muted-foreground' : 'text-foreground'}`}
                >
                  {step.wasDeferred ? `↩ ${step.name}` : step.name}
                </span>

                {/* Time info */}
                <span className="text-xs tabular-nums text-muted-foreground">
                  {step.status === 'skipped' ? (
                    <span className="italic">skipped</span>
                  ) : step.status === 'deferred' ? (
                    <span className="italic">deferred</span>
                  ) : (
                    <>
                      {formatDuration(step.elapsedTime)} / {formatDuration(step.originalPlannedDuration)}
                      {isStepOverrun && (
                        <span
                          className="ml-1 text-[var(--behind)]"
                          data-testid={`overrun-${step.id}`}
                        >
                          (+{formatDuration(overrunAmount)})
                        </span>
                      )}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Done button */}
      <div className="text-center">
        <Button
          onClick={() => router.push('/app')}
          size="lg"
          className="w-full sm:w-auto"
          data-testid="completion-done-button"
        >
          Back to Library
        </Button>
      </div>
    </div>
  );
}
