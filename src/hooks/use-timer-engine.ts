'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { getDeviceId } from '@/hooks/use-device-id';
import { createSession, updateSession } from '@/lib/firebase/sessions';
import { updateTimer } from '@/lib/firebase/timers';
import type { RunSession, SessionStep, StepStatus } from '@/types/session';
import type { TimerTemplate } from '@/types/timer';

export interface TransitionEvent {
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  timestamp: number;
}

export interface UseTimerEngineReturn {
  session: RunSession | null;
  currentStep: SessionStep | null;
  currentStepIndex: number;
  elapsedTime: number;
  totalElapsedTime: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  lastTransition: TransitionEvent | null;
  clearTransition: () => void;
  checkpointDisplayIndex: number | null; // v2 — index of checkpoint being displayed
  advanceFromCheckpoint: () => Promise<void>; // v2 — UI calls after 3.5s display
  start: (template: TimerTemplate) => Promise<void>;
  startFromSession: (existingSession: RunSession) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skip: () => Promise<void>;
  extend: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
  updateFromSnapshot: (snapshot: RunSession) => void;
}

export function useTimerEngine(): UseTimerEngineReturn {
  const { user } = useAuth();
  const [session, setSession] = useState<RunSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
  const [lastTransition, setLastTransition] = useState<TransitionEvent | null>(null);
  const [checkpointDisplayIndex, setCheckpointDisplayIndex] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<RunSession | null>(null);

  // Keep sessionRef in sync
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTick();
  }, [clearTick]);

  const calcStepElapsed = useCallback((step: SessionStep): number => {
    if (!step.startedAt) return step.elapsedTime;
    if (step.status === 'running') {
      return Math.floor((Date.now() - step.startedAt.toMillis()) / 1000);
    }
    return step.elapsedTime;
  }, []);

  const calcTotalElapsed = useCallback((sess: RunSession): number => {
    return sess.steps.reduce((sum, step, i) => {
      if (i === sess.currentStepIndex && step.status === 'running') {
        return sum + calcStepElapsed(step);
      }
      return sum + step.elapsedTime;
    }, 0);
  }, [calcStepElapsed]);

  const persistSession = useCallback(async (sess: RunSession) => {
    if (!user) return;
    // Strip the 'id' field for the update
    const { id, ...data } = sess;
    await updateSession(user.uid, id, data);
  }, [user]);

  // Refs to break circular dependency between advanceStep ↔ startTickStable
  const advanceStepRef = useRef<((sess: RunSession, stepStatus: StepStatus) => Promise<void>) | null>(null);
  const startTickRef = useRef<(() => void) | null>(null);

  const advanceStep = useCallback(async (sess: RunSession, stepStatus: StepStatus) => {
    clearTick();
    const now = Timestamp.fromDate(new Date());
    const steps = [...sess.steps.map((s) => ({ ...s }))];
    const currentIdx = sess.currentStepIndex;

    // Complete/skip current step
    const currentStep = steps[currentIdx];
    currentStep.status = stepStatus;
    currentStep.completedAt = now;
    currentStep.elapsedTime = calcStepElapsed(currentStep);

    const nextIdx = currentIdx + 1;

    if (nextIdx >= steps.length) {
      // All steps done → session complete
      const completedSession: RunSession = {
        ...sess,
        steps,
        status: 'completed',
        completedAt: now,
        totalElapsedTime: steps.reduce((sum, s) => sum + s.elapsedTime, 0),
      };
      setSession(completedSession);
      setElapsedTime(0);
      setTotalElapsedTime(completedSession.totalElapsedTime);
      await persistSession(completedSession);
      return;
    }

    // Start next step
    steps[nextIdx] = {
      ...steps[nextIdx],
      status: 'running',
      startedAt: now,
    };

    // v2: If next step is a checkpoint, instantly complete it and pause for display
    if (steps[nextIdx].type === 'checkpoint') {
      steps[nextIdx] = {
        ...steps[nextIdx],
        status: 'completed',
        completedAt: now,
        elapsedTime: 0,
      };

      const checkpointSession: RunSession = {
        ...sess,
        steps,
        currentStepIndex: nextIdx,
        totalElapsedTime: steps.reduce((sum, s) => sum + s.elapsedTime, 0),
      };

      setSession(checkpointSession);
      setElapsedTime(0);
      setTotalElapsedTime(checkpointSession.totalElapsedTime);
      setCheckpointDisplayIndex(nextIdx);

      // Fire transition for chime/overlay
      setLastTransition({
        stepName: steps[nextIdx].name,
        stepNumber: nextIdx + 1,
        totalSteps: steps.length,
        timestamp: Date.now(),
      });

      await persistSession(checkpointSession);
      // Don't start tick — UI will call advanceFromCheckpoint after display
      return;
    }

    const updatedSession: RunSession = {
      ...sess,
      steps,
      currentStepIndex: nextIdx,
      totalElapsedTime: steps.reduce((sum, s) => sum + s.elapsedTime, 0),
    };

    setSession(updatedSession);
    setElapsedTime(0);
    setTotalElapsedTime(updatedSession.totalElapsedTime);

    // Fire transition event for overlay/chime
    setLastTransition({
      stepName: steps[nextIdx].name,
      stepNumber: nextIdx + 1,
      totalSteps: steps.length,
      timestamp: Date.now(),
    });

    await persistSession(updatedSession);
    startTickRef.current?.();
  }, [clearTick, calcStepElapsed, persistSession]);

  const startTickStable = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(() => {
      const sess = sessionRef.current;
      if (!sess || sess.status !== 'running') return;

      const step = sess.steps[sess.currentStepIndex];
      if (!step || step.status !== 'running') return;

      const elapsed = calcStepElapsed(step);
      setElapsedTime(elapsed);
      setTotalElapsedTime(calcTotalElapsed(sess));

      // Auto-advance when step duration is reached
      if (elapsed >= step.plannedDuration) {
        advanceStepRef.current?.(sess, 'completed');
      }
    }, 1000);
  }, [clearTick, calcStepElapsed, calcTotalElapsed]);

  // Keep refs in sync
  useEffect(() => {
    advanceStepRef.current = advanceStep;
  }, [advanceStep]);
  useEffect(() => {
    startTickRef.current = startTickStable;
  }, [startTickStable]);

  const start = useCallback(async (template: TimerTemplate) => {
    if (!user) return;
    const deviceId = getDeviceId();
    const { data: newSession, error } = await createSession(user.uid, template, deviceId);
    if (error || !newSession) return;

    // Update lastUsedAt on the template
    await updateTimer(user.uid, template.id, { lastUsedAt: Timestamp.fromDate(new Date()) });

    const now = Timestamp.fromDate(new Date());
    // Set first step to running and session status to running
    const steps = newSession.steps.map((s, i) =>
      i === 0 ? { ...s, status: 'running' as StepStatus, startedAt: now } : s,
    );

    const runningSession: RunSession = {
      ...newSession,
      steps,
      status: 'running',
    };

    setSession(runningSession);
    setElapsedTime(0);
    setTotalElapsedTime(0);
    await persistSession(runningSession);
    startTickStable();
  }, [user, persistSession, startTickStable]);

  const startFromSession = useCallback(async (existingSession: RunSession) => {
    const now = Timestamp.fromDate(new Date());

    // Fresh/idle session: just start normally
    if (existingSession.status === 'idle') {
      const steps = existingSession.steps.map((s, i) =>
        i === 0 && s.status === 'pending'
          ? { ...s, status: 'running' as StepStatus, startedAt: now }
          : s,
      );
      const runningSession: RunSession = {
        ...existingSession,
        steps,
        status: 'running',
      };
      setSession(runningSession);
      setElapsedTime(0);
      setTotalElapsedTime(0);
      await persistSession(runningSession);
      startTickStable();
      return;
    }

    // Paused session: hydrate as-is
    if (existingSession.status === 'paused') {
      const step = existingSession.steps[existingSession.currentStepIndex];
      setSession(existingSession);
      setElapsedTime(step?.elapsedTime ?? 0);
      setTotalElapsedTime(existingSession.totalElapsedTime);
      return;
    }

    // Running session: catch up through any overdue steps
    const steps = existingSession.steps.map((s) => ({ ...s }));
    let currentIdx = existingSession.currentStepIndex;

    // Fast-forward through steps whose planned duration has been exceeded
    while (currentIdx < steps.length) {
      const step = steps[currentIdx];
      if (step.status !== 'running') break;

      const elapsed = step.startedAt
        ? Math.floor((now.toMillis() - step.startedAt.toMillis()) / 1000)
        : step.elapsedTime;

      if (elapsed < step.plannedDuration) {
        // This step is still in progress — stop catching up
        break;
      }

      // Step overdue → mark completed
      step.status = 'completed';
      step.elapsedTime = elapsed;
      step.completedAt = now;

      const nextIdx = currentIdx + 1;
      if (nextIdx >= steps.length) {
        // All steps done → complete the session
        const completedSession: RunSession = {
          ...existingSession,
          steps,
          currentStepIndex: currentIdx,
          status: 'completed',
          completedAt: now,
          totalElapsedTime: steps.reduce((sum, s) => sum + s.elapsedTime, 0),
        };
        setSession(completedSession);
        setElapsedTime(0);
        setTotalElapsedTime(completedSession.totalElapsedTime);
        await persistSession(completedSession);
        return;
      }

      // Start the next step — its startedAt is set to the moment the
      // previous step *should* have ended, so elapsed calculation stays accurate
      const prevStepEnd = step.startedAt
        ? Timestamp.fromMillis(step.startedAt.toMillis() + step.plannedDuration * 1000)
        : now;
      steps[nextIdx] = {
        ...steps[nextIdx],
        status: 'running',
        startedAt: prevStepEnd,
      };
      currentIdx = nextIdx;
    }

    const currentStep = steps[currentIdx];
    const stepElapsed = currentStep?.startedAt && currentStep.status === 'running'
      ? Math.floor((now.toMillis() - currentStep.startedAt.toMillis()) / 1000)
      : currentStep?.elapsedTime ?? 0;

    const runningSession: RunSession = {
      ...existingSession,
      steps,
      currentStepIndex: currentIdx,
      totalElapsedTime: steps.reduce((sum, s, i) => {
        if (i === currentIdx && s.status === 'running') return sum + stepElapsed;
        return sum + s.elapsedTime;
      }, 0),
    };

    setSession(runningSession);
    setElapsedTime(stepElapsed);
    setTotalElapsedTime(runningSession.totalElapsedTime);
    await persistSession(runningSession);
    if (runningSession.status === 'running') {
      startTickStable();
    }
  }, [persistSession, startTickStable]);

  const pause = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || sess.status !== 'running') return;

    clearTick();
    const now = Timestamp.fromDate(new Date());
    const steps = sess.steps.map((s, i) => {
      if (i === sess.currentStepIndex && s.status === 'running') {
        return {
          ...s,
          status: 'paused' as StepStatus,
          elapsedTime: calcStepElapsed(s),
        };
      }
      return s;
    });

    const pausedSession: RunSession = {
      ...sess,
      steps,
      status: 'paused',
      pausedAt: now,
      totalElapsedTime: calcTotalElapsed(sess),
    };

    setSession(pausedSession);
    setElapsedTime(pausedSession.steps[pausedSession.currentStepIndex].elapsedTime);
    setTotalElapsedTime(pausedSession.totalElapsedTime);
    await persistSession(pausedSession);
  }, [clearTick, calcStepElapsed, calcTotalElapsed, persistSession]);

  const resume = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || sess.status !== 'paused' || !sess.pausedAt) return;

    const now = Date.now();
    const pauseDuration = now - sess.pausedAt.toMillis();
    const steps = sess.steps.map((s, i) => {
      if (i === sess.currentStepIndex && s.status === 'paused') {
        // Shift startedAt forward by pause duration so elapsed calc is correct
        const newStartedAt = Timestamp.fromMillis(
          (s.startedAt?.toMillis() ?? now) + pauseDuration,
        );
        return {
          ...s,
          status: 'running' as StepStatus,
          startedAt: newStartedAt,
        };
      }
      return s;
    });

    const resumedSession: RunSession = {
      ...sess,
      steps,
      status: 'running',
      pausedAt: undefined,
    };

    setSession(resumedSession);
    await persistSession(resumedSession);
    startTickStable();
  }, [persistSession, startTickStable]);

  const skip = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || (sess.status !== 'running' && sess.status !== 'paused')) return;
    await advanceStepRef.current?.(sess, 'skipped');
  }, []);

  // v2: Advance past a checkpoint display — called by UI after 3.5s or on tap
  const advanceFromCheckpoint = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess || checkpointDisplayIndex === null) return;

    setCheckpointDisplayIndex(null);

    // The checkpoint step is already completed — advance to the next step
    await advanceStepRef.current?.(sess, 'completed');
  }, [checkpointDisplayIndex]);

  const extend = useCallback(async (seconds: number) => {
    const sess = sessionRef.current;
    if (!sess) return;

    const steps = sess.steps.map((s, i) => {
      if (i === sess.currentStepIndex) {
        return { ...s, plannedDuration: s.plannedDuration + seconds };
      }
      return s;
    });

    const updatedSession: RunSession = { ...sess, steps };
    setSession(updatedSession);
    await persistSession(updatedSession);
  }, [persistSession]);

  const stop = useCallback(async () => {
    const sess = sessionRef.current;
    if (!sess) return;

    clearTick();
    const now = Timestamp.fromDate(new Date());
    const steps = sess.steps.map((s, i) => {
      if (i === sess.currentStepIndex && (s.status === 'running' || s.status === 'paused')) {
        return {
          ...s,
          status: 'completed' as StepStatus,
          completedAt: now,
          elapsedTime: calcStepElapsed(s),
        };
      }
      return s;
    });

    const completedSession: RunSession = {
      ...sess,
      steps,
      status: 'completed',
      completedAt: now,
      totalElapsedTime: steps.reduce((sum, s) => sum + s.elapsedTime, 0),
    };

    setSession(completedSession);
    setTotalElapsedTime(completedSession.totalElapsedTime);
    await persistSession(completedSession);
  }, [clearTick, calcStepElapsed, persistSession]);

  const currentStep = session ? session.steps[session.currentStepIndex] ?? null : null;

  const clearTransition = useCallback(() => {
    setLastTransition(null);
  }, []);

  /**
   * Update engine state from a Firestore snapshot.
   * When another device changes the session (pause, skip, stop, etc.),
   * this adopts the new state so all devices stay in sync.
   *
   * We compare key fields to avoid re-processing our own echoed writes.
   */
  const updateFromSnapshot = useCallback((snapshot: RunSession) => {
    const local = sessionRef.current;

    // If no local session yet, skip (startFromSession handles initial load)
    if (!local) return;

    // Detect whether this snapshot differs from our local state.
    // If it matches, it's likely our own write echoing back — skip it.
    const sameStatus = local.status === snapshot.status;
    const sameStep = local.currentStepIndex === snapshot.currentStepIndex;
    const sameStepStatuses = local.steps.every(
      (s, i) => snapshot.steps[i] && s.status === snapshot.steps[i].status,
    );
    if (sameStatus && sameStep && sameStepStatuses) return;

    // Snapshot has meaningful changes from another device — adopt it
    clearTick();
    setSession(snapshot);

    if (snapshot.status === 'completed') {
      setElapsedTime(0);
      setTotalElapsedTime(snapshot.totalElapsedTime);
      return;
    }

    const step = snapshot.steps[snapshot.currentStepIndex];
    if (step) {
      const stepElapsed = calcStepElapsed(step);
      setElapsedTime(stepElapsed);
    }
    setTotalElapsedTime(calcTotalElapsed(snapshot));

    // Restart local tick if the session is still running
    if (snapshot.status === 'running') {
      startTickStable();
    }
  }, [clearTick, calcStepElapsed, calcTotalElapsed, startTickStable]);

  return {
    session,
    currentStep,
    currentStepIndex: session?.currentStepIndex ?? 0,
    elapsedTime,
    totalElapsedTime,
    isRunning: session?.status === 'running',
    isPaused: session?.status === 'paused',
    isCompleted: session?.status === 'completed',
    lastTransition,
    clearTransition,
    checkpointDisplayIndex,
    start,
    startFromSession,
    pause,
    resume,
    skip,
    advanceFromCheckpoint,
    extend,
    stop,
    updateFromSnapshot,
  };
}
