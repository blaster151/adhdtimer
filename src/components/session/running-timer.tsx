'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useFirestoreSession } from '@/hooks/use-firestore-session';
import { useTimerEngine } from '@/hooks/use-timer-engine';
import { useTTS } from '@/hooks/use-tts';
import { useWakeLock } from '@/hooks/use-wake-lock';

import { PlaybackControls } from '@/components/session/playback-controls';
import { TransitionOverlay } from '@/components/session/transition-overlay';
import { ProgressRing } from '@/components/session/progress-ring';
import { StepDots } from '@/components/session/step-dots';
import { CompletionView } from '@/components/session/completion-view';
import { calculatePace } from '@/lib/utils/pace';
import { formatDuration, formatDurationSpeech, formatCountdown } from '@/lib/utils/time';
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
  const firestoreSession = useFirestoreSession(user?.uid, sessionId);
  const tts = useTTS();
  const wakeLock = useWakeLock();
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const lastTransitionTimestamp = useRef<number>(0);
  const hasAnnouncedFirstStep = useRef(false);
  const hasStartedEngine = useRef(false);

  // Pre-load chime audio on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/chime.mp3');
      audio.volume = 0.3;
      chimeRef.current = audio;
    }
  }, []);

  // React to step transitions — play chime, speak TTS, and show overlay
  useEffect(() => {
    if (
      engine.lastTransition &&
      engine.lastTransition.timestamp !== lastTransitionTimestamp.current
    ) {
      lastTransitionTimestamp.current = engine.lastTransition.timestamp;

      // Play chime
      if (chimeRef.current) {
        chimeRef.current.currentTime = 0;
        chimeRef.current.play()?.catch(() => {
          /* Audio play may be blocked by browser policy — ignore silently */
        });
      }

      // TTS after 50ms gap (chime alerts attention, TTS delivers content)
      const step = engine.session?.steps[engine.session.currentStepIndex];
      if (step) {
        const ttsTimer = setTimeout(() => {
          tts.speak(`${step.name}. ${formatDurationSpeech(step.plannedDuration)}.`);
        }, 50);
        // Clean up TTS timer on unmount
        const overlayTimer = setTimeout(() => {
          setOverlayVisible(false);
          engine.clearTransition();
        }, 4000);

        setOverlayVisible(true);
        return () => {
          clearTimeout(ttsTimer);
          clearTimeout(overlayTimer);
        };
      }

      // Show overlay
      setOverlayVisible(true);
      const timer = setTimeout(() => {
        setOverlayVisible(false);
        engine.clearTransition();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [engine.lastTransition, engine.clearTransition, engine.session, tts]);

  // Announce first step via TTS on session start
  useEffect(() => {
    if (
      engine.session &&
      engine.isRunning &&
      !hasAnnouncedFirstStep.current &&
      engine.currentStep
    ) {
      hasAnnouncedFirstStep.current = true;
      // Play chime + TTS for first step
      if (chimeRef.current) {
        chimeRef.current.currentTime = 0;
        chimeRef.current.play()?.catch(() => {});
      }
      setTimeout(() => {
        tts.speak(
          `${engine.currentStep!.name}. ${formatDurationSpeech(engine.currentStep!.plannedDuration)}.`,
        );
      }, 50);
    }
  }, [engine.session, engine.isRunning, engine.currentStep, tts]);

  // Handle real-time session data from Firestore listener
  useEffect(() => {
    if (firestoreSession.error) {
      toast.error(firestoreSession.error.message ?? 'Session not found');
      router.push('/app');
      return;
    }

    const data = firestoreSession.session;
    if (!data) return;

    // If session is already completed, redirect
    if (data.status === 'completed' && !engine.session) {
      router.push('/app');
      return;
    }

    // First load: start the engine from the session data
    if (!hasStartedEngine.current) {
      hasStartedEngine.current = true;
      engine.startFromSession(data);
      return;
    }

    // Subsequent snapshots: forward to engine for observer mode updates
    engine.updateFromSnapshot(data);
  }, [firestoreSession.session, firestoreSession.error, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cancel TTS on completion
  useEffect(() => {
    if (engine.isCompleted) {
      tts.cancel();
    }
  }, [engine.isCompleted, tts]);

  // Wake lock lifecycle: acquire when running, release when paused/completed
  useEffect(() => {
    if (engine.isRunning && !engine.isPaused && !engine.isCompleted) {
      wakeLock.request();
    } else {
      wakeLock.release();
    }
  }, [engine.isRunning, engine.isPaused, engine.isCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-acquire wake lock on visibility change (tab returns to foreground)
  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState === 'visible' &&
        engine.isRunning &&
        !engine.isPaused &&
        !engine.isCompleted
      ) {
        wakeLock.request();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [engine.isRunning, engine.isPaused, engine.isCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Show completion view when session is done
  if (isCompleted) {
    return <CompletionView session={session} />;
  }

  const isLastStep = session.currentStepIndex >= session.steps.length - 1;
  const totalPlannedDuration = session.steps.reduce((sum, s) => sum + s.plannedDuration, 0);

  // Calculate pace for ring coloring
  const pace = calculatePace(session.steps, session.currentStepIndex, elapsedTime);

  // Step progress (inner ring) — capped at 1.0 when overrunning
  const stepProgress = currentStep
    ? Math.min(elapsedTime / currentStep.plannedDuration, 1.0)
    : 0;

  // Total progress (outer ring) — cumulative elapsed / total planned
  const completedStepsDuration = session.steps
    .slice(0, session.currentStepIndex)
    .reduce((sum, s) => sum + s.elapsedTime, 0);
  const totalProgress = totalPlannedDuration > 0
    ? Math.min((completedStepsDuration + elapsedTime) / totalPlannedDuration, 1.0)
    : 0;

  const isOverrun = currentStep ? elapsedTime > currentStep.plannedDuration : false;
  const countdownMode = session.countdownMode ?? false;

  // Elapsed display for ring center
  const elapsedDisplay = currentStep
    ? countdownMode
      ? formatCountdown(currentStep.plannedDuration, elapsedTime)
      : formatDuration(elapsedTime)
    : formatDuration(elapsedTime);

  // Aria elapsed label for screen readers
  const ariaMinutes = Math.floor(elapsedTime / 60);
  const ariaSeconds = elapsedTime % 60;
  const ariaElapsedLabel = ariaMinutes > 0
    ? `${ariaMinutes} minute${ariaMinutes === 1 ? '' : 's'} ${ariaSeconds} second${ariaSeconds === 1 ? '' : 's'} elapsed`
    : `${ariaSeconds} second${ariaSeconds === 1 ? '' : 's'} elapsed`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Back to Timers nav */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All Timers
      </Link>

      {/* Header */}
      <div className="text-center relative">
        <h1 className="text-xl font-semibold text-foreground">{session.timerName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {session.currentStepIndex + 1} of {session.steps.length}
        </p>
        {/* TTS toggle */}
        <button
          type="button"
          onClick={() => tts.setEnabled(!tts.isEnabled)}
          className="absolute right-0 top-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={tts.isEnabled ? 'Text-to-speech enabled' : 'Text-to-speech disabled'}
          data-testid="tts-toggle"
        >
          {tts.isEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
      </div>

      {/* Zen Ring — hero visual */}
      {currentStep && (
        <ProgressRing
          stepProgress={stepProgress}
          totalProgress={totalProgress}
          stepName={currentStep.name}
          elapsedDisplay={elapsedDisplay}
          paceMessage={pace.message}
          paceStatus={pace.status}
          isOverrun={isOverrun}
          isPaused={isPaused}
          stepNumber={session.currentStepIndex + 1}
          totalSteps={session.steps.length}
          timerName={session.timerName}
          ariaElapsedLabel={ariaElapsedLabel}
        />
      )}

      {/* Step dots */}
      <StepDots steps={session.steps} currentIndex={session.currentStepIndex} />

      {/* Transition overlay */}
      {engine.lastTransition && (() => {
        const transitionPace = calculatePace(
          session.steps,
          session.currentStepIndex,
          elapsedTime,
        );
        return (
          <TransitionOverlay
            stepName={engine.lastTransition.stepName}
            stepNumber={engine.lastTransition.stepNumber}
            totalSteps={engine.lastTransition.totalSteps}
            paceMessage={transitionPace.message}
            paceStatus={transitionPace.status}
            visible={overlayVisible}
          />
        );
      })()}

      {/* Playback controls */}
      <PlaybackControls
        isRunning={isRunning}
        isPaused={isPaused}
        isCompleted={false}
        isLastStep={isLastStep}
        onPause={engine.pause}
        onResume={engine.resume}
        onSkip={engine.skip}
        onStop={engine.stop}
        onExtend={engine.extend}
      />

      {/* Step list — only show when there are multiple steps */}
      {session.steps.length > 1 && (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Steps</h3>
        <ul className="space-y-1">
          {session.steps.map((step, i) => (
            <li
              key={step.id}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                i === session.currentStepIndex
                  ? 'bg-elevated'
                  : ''
              } ${stepStatusClass(step.status)}`}
            >
              <span className="w-5 text-center">{stepStatusIcon(step.status)}</span>
              <span className="flex-1">{step.name}</span>
              <span className={`text-xs tabular-nums transition-colors duration-300 ${
                countdownMode &&
                ((step.status === 'running' && elapsedTime > step.plannedDuration) ||
                 (step.elapsedTime > step.plannedDuration))
                  ? 'text-warning'
                  : ''
              }`}>
                {step.status === 'running' || i === session.currentStepIndex
                  ? countdownMode
                    ? formatCountdown(step.plannedDuration, elapsedTime)
                    : `${formatDuration(elapsedTime)} / ${formatDuration(step.plannedDuration)}`
                  : step.elapsedTime > 0
                    ? countdownMode
                      ? formatCountdown(step.plannedDuration, step.elapsedTime)
                      : `${formatDuration(step.elapsedTime)} / ${formatDuration(step.plannedDuration)}`
                    : formatDuration(step.plannedDuration)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      )}

      {/* Total progress */}
      <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className={`text-sm font-medium tabular-nums transition-colors duration-300 ${
          countdownMode && totalElapsedTime > totalPlannedDuration
            ? 'text-warning'
            : 'text-foreground'
        }`}>
          {countdownMode
            ? formatCountdown(totalPlannedDuration, totalElapsedTime)
            : `${formatDuration(totalElapsedTime)} / ${formatDuration(totalPlannedDuration)}`}
        </span>
      </div>
    </div>
  );
}
