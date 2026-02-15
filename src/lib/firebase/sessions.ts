import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { RunSession } from '@/types/session';
import type { TimerTemplate } from '@/types/timer';
import type { SessionStep } from '@/types/session';

function sessionsCollection(userId: string) {
  return collection(db, 'users', userId, 'sessions');
}

function sessionDoc(userId: string, sessionId: string) {
  return doc(db, 'users', userId, 'sessions', sessionId);
}

export async function createSession(
  userId: string,
  template: TimerTemplate,
  deviceId: string,
): Promise<{ data: RunSession | null; error: string | null }> {
  try {
    const now = Timestamp.now();

    const steps: SessionStep[] = template.steps.map((step) => ({
      id: step.id,
      name: step.name,
      plannedDuration: step.plannedDuration,
      originalPlannedDuration: step.plannedDuration,
      elapsedTime: 0,
      status: 'pending',
    }));

    const sessionData: Omit<RunSession, 'id'> = {
      timerId: template.id,
      timerName: template.name,
      status: 'idle',
      currentStepIndex: 0,
      startedAt: now,
      activeDeviceId: deviceId,
      totalElapsedTime: 0,
      steps,
    };

    const docRef = await addDoc(sessionsCollection(userId), sessionData);
    return {
      data: { ...sessionData, id: docRef.id } as RunSession,
      error: null,
    };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function updateSession(
  userId: string,
  sessionId: string,
  data: Partial<RunSession>,
): Promise<{ data: void | null; error: string | null }> {
  try {
    await updateDoc(sessionDoc(userId, sessionId), { ...data });
    return { data: undefined, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function getSession(
  userId: string,
  sessionId: string,
): Promise<{ data: RunSession | null; error: string | null }> {
  try {
    const snap = await getDoc(sessionDoc(userId, sessionId));
    if (!snap.exists()) {
      return { data: null, error: 'Session not found' };
    }
    return { data: { ...snap.data(), id: snap.id } as RunSession, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

/**
 * Subscribe to real-time updates for a session document.
 * Returns an unsubscribe function.
 */
export function subscribeToSession(
  userId: string,
  sessionId: string,
  onData: (session: RunSession) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    sessionDoc(userId, sessionId),
    (snap) => {
      if (snap.exists()) {
        onData({ ...snap.data(), id: snap.id } as RunSession);
      } else {
        onError(new Error('Session not found'));
      }
    },
    (err) => {
      onError(err);
    },
  );
}
