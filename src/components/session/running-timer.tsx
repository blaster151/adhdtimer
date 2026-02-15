'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getSession } from '@/lib/firebase/sessions';
import { useTimerEngine } from '@/hooks/use-timer-engine';
import { PlaybackControls } from '@/components/session/playback-controls';
import { TransitionOverlay } from '@/components/session/transition-overlay';
import { calculatePace } from '@/lib/utils/pace';
import { formatDuration } from '@/lib/utils/time';
import type { SessionStep, StepStatus } from '@/types/session';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface RunningTimerProps {
  sessionId: string;
}

function stepStatusIcon(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return '✓';
    case 'running':
      return '▶';
    case 'paused':
      return '⏸';
    case 'skipped':
      return '⊘';
    case 'pending':
    default:
      return '○';
  }
}

function stepStatusClass(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return 'text-primary';
    case 'running':
      return 'text-accent font-semibold';
    case 'paused':
      return 'text-muted-foreground font-semibold';
    case 'skipped':
      return 'text-muted-foreground line-through';
    case 'pending':
    default:
      return 'text-muted-foreground';
  }
}

export function RunningTimer({ sessionId }: RunningTimerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const engine = useTimerEngine();
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const lastTransitionTimestamp = useRef<number>(0);

  // Pre-load chime audio on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/chime.mp3');
      audio.volume = 0.3;
      chimeRef.current = audio;
    }
  }, []);

  // React to step transitions — play chime and show overlay
  useEffect(() => {
    if (
      engine.lastTransition &&
      engine.lastTransition.timestamp !== lastTransitionTimestamp.current
    ) {
      lastTransitionTimestamp.current = engine.lastTransition.timestamp;

      // Play chime
      if (chimeRef.current) {
        chimeRef.current.currentTime = 0;
        chimeRef.current.play().catch(() => {
          /* Audio play may be blocked by browser policy — ignore silently */
        });
      }

      // Show overlay
      setOverlayVisible(true);
      const timer = setTimeout(() => {
        setOverlayVisible(false);
        engine.clearTransition();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [engine.lastTransition, engine.clearTransition]);

  // Load session on mount
  useEffect(() => {
    if (!user || engine.session) return;

    async function loadSession() {
      const { data, error } = await getSession(user!.uid, sessionId);
      if (error || !data) {
        toast.error(error ?? 'Session not found');
        router.push('/app');
        return;
      }

      // If session is already completed, redirect
      if (data.status === 'completed') {
        router.push('/app');
        return;
      }

      // Start the engine from the loaded session
      await engine.startFromSession(data);
    }

    loadSession();
  }, [user, sessionId, engine.session, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect on completion
  useEffect(() => {
    if (engine.isCompleted) {
      toast.success('Timer completed!');
      const timer = setTimeout(() => router.push('/app'), 2000);
      return () => clearTimeout(timer);
    }
  }, [engine.isCompleted, router]);

  if (!engine.session) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mx-auto h-32 w-32 rounded-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const { session, currentStep, elapsedTime, totalElapsedTime, isRunning, isPaused, isCompleted } =
    engine;
  const isLastStep = session.currentStepIndex >= session.steps.length - 1;
  const totalPlannedDuration = session.steps.reduce((sum, s) => sum + s.plannedDuration, 0);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">{session.timerName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {session.currentStepIndex + 1} of {session.steps.length}
        </p>
      </div>

      {/* Current step display */}
      {currentStep && !isCompleted && (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">Current Step</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground" data-testid="current-step-name">
            {currentStep.name}
          </h2>

          {/* Elapsed time — large display */}
          <div className="mt-4">
            <span
              className="text-5xl font-mono font-bold tabular-nums text-primary"
              data-testid="step-elapsed"
            >
              {formatDuration(elapsedTime)}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              of {formatDuration(currentStep.plannedDuration)}
            </p>
          </div>

          {/* Overrun indicator */}
          {elapsedTime > currentStep.plannedDuration && (
            <p className="mt-2 text-sm font-medium text-warning" data-testid="overrun-indicator">
              +{formatDuration(elapsedTime - currentStep.plannedDuration)} over
            </p>
          )}
        </div>
      )}

      {/* Completion display */}
      {isCompleted && (
        <div className="rounded-xl border border-primary bg-surface p-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Timer Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            Total time: {formatDuration(totalElapsedTime)} / {formatDuration(totalPlannedDuration)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Redirecting to library…</p>
        </div>
      )}

      {/* Transition overlay */}
      {engine.lastTransition && (() => {
        const pace = calculatePace(
          session.steps,
          session.currentStepIndex,
          elapsedTime,
        );
        return (
          <TransitionOverlay
            stepName={engine.lastTransition.stepName}
            stepNumber={engine.lastTransition.stepNumber}
            totalSteps={engine.lastTransition.totalSteps}
            paceMessage={pace.message}
            paceStatus={pace.status}
            visible={overlayVisible}
          />
        );
      })()}

      {/* Playback controls */}
      <PlaybackControls
        isRunning={isRunning}
        isPaused={isPaused}
        isCompleted={isCompleted}
        isLastStep={isLastStep}
        onPause={engine.pause}
        onResume={engine.resume}
        onSkip={engine.skip}
        onStop={engine.stop}
        onExtend={engine.extend}
      />

      {/* Step list */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Steps</h3>
        <ul className="space-y-1">
          {session.steps.map((step, i) => (
            <li
              key={step.id}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                i === session.currentStepIndex && !isCompleted
                  ? 'bg-elevated'
                  : ''
              } ${stepStatusClass(step.status)}`}
            >
              <span className="w-5 text-center">{stepStatusIcon(step.status)}</span>
              <span className="flex-1">{step.name}</span>
              <span className="text-xs tabular-nums">
                {step.status === 'running' || (i === session.currentStepIndex && !isCompleted)
                  ? `${formatDuration(elapsedTime)} / ${formatDuration(step.plannedDuration)}`
                  : step.elapsedTime > 0
                    ? `${formatDuration(step.elapsedTime)} / ${formatDuration(step.plannedDuration)}`
                    : formatDuration(step.plannedDuration)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Total progress */}
      <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-sm font-medium tabular-nums text-foreground">
          {formatDuration(totalElapsedTime)} / {formatDuration(totalPlannedDuration)}
        </span>
      </div>
    </div>
  );
}
