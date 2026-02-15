'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { createSession, updateSession } from '@/lib/firebase/sessions';
import { updateTimer } from '@/lib/firebase/timers';
import type { RunSession, SessionStep, StepStatus } from '@/types/session';
import type { TimerTemplate } from '@/types/timer';

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem('adhdtimer-device-id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('adhdtimer-device-id', id);
  }
  return id;
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
  start: (template: TimerTemplate) => Promise<void>;
  startFromSession: (existingSession: RunSession) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skip: () => Promise<void>;
  extend: (seconds: number) => Promise<void>;
  stop: () => Promise<void>;
}

export function useTimerEngine(): UseTimerEngineReturn {
  const { user } = useAuth();
  const [session, setSession] = useState<RunSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);
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

    const updatedSession: RunSession = {
      ...sess,
      steps,
      currentStepIndex: nextIdx,
      totalElapsedTime: steps.reduce((sum, s) => sum + s.elapsedTime, 0),
    };

    setSession(updatedSession);
    setElapsedTime(0);
    setTotalElapsedTime(updatedSession.totalElapsedTime);
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
    // Set first step to running and session status to running
    const steps = existingSession.steps.map((s, i) =>
      i === 0 && s.status === 'pending'
        ? { ...s, status: 'running' as StepStatus, startedAt: now }
        : s,
    );

    const runningSession: RunSession = {
      ...existingSession,
      steps,
      status: existingSession.status === 'idle' ? 'running' : existingSession.status,
    };

    setSession(runningSession);
    setElapsedTime(0);
    setTotalElapsedTime(0);
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

  return {
    session,
    currentStep,
    currentStepIndex: session?.currentStepIndex ?? 0,
    elapsedTime,
    totalElapsedTime,
    isRunning: session?.status === 'running',
    isPaused: session?.status === 'paused',
    isCompleted: session?.status === 'completed',
    start,
    startFromSession,
    pause,
    resume,
    skip,
    extend,
    stop,
  };
}
