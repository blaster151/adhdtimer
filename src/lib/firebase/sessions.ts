import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { RunSession } from '@/types/session';
import type { TimerTemplate } from '@/types/timer';
import type { SessionStep } from '@/types/session';

/**
 * Recursively strip `undefined` values from a plain object / array
 * before sending it to Firestore.  Firestore's `updateDoc` rejects
 * `undefined` (unlike `setDoc`), so we need to either remove the
 * key entirely or replace it with `deleteField()`.
 *
 * Top-level `undefined` values are replaced with `deleteField()` so
 * the field is removed from the document.  Nested `undefined` values
 * (e.g. inside a step) are simply omitted from the object.
 */
function sanitizeForFirestore<T extends Record<string, unknown>>(
  obj: T,
  topLevel = true,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Top-level undefineds → deleteField() so Firestore removes them
      if (topLevel) {
        result[key] = deleteField();
      }
      // Nested undefineds → omit entirely
      continue;
    }
    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === 'object' && !(item instanceof Timestamp)
          ? sanitizeForFirestore(item as Record<string, unknown>, false)
          : item,
      );
    } else if (value !== null && typeof value === 'object' && !(value instanceof Timestamp)) {
      result[key] = sanitizeForFirestore(value as Record<string, unknown>, false);
    } else {
      result[key] = value;
    }
  }
  return result;
}

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
      ...(step.type && { type: step.type }),
      ...(step.targetTime && { targetTime: step.targetTime }),
    }));

    const sessionData: Omit<RunSession, 'id'> = {
      timerId: template.id,
      timerName: template.name,
      status: 'idle',
      currentStepIndex: 0,
      startedAt: now,
      activeDeviceId: deviceId,
      totalElapsedTime: 0,
      countdownMode: template.countdownMode ?? false,
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
    await updateDoc(sessionDoc(userId, sessionId), sanitizeForFirestore(data as Record<string, unknown>));
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

/**
 * Query for the most recent active (running or paused) session.
 * Returns the first match or null if none found.
 */
export async function getActiveSession(
  userId: string,
): Promise<{ data: RunSession | null; error: string | null }> {
  try {
    const q = query(
      sessionsCollection(userId),
      where('status', 'in', ['running', 'paused']),
      orderBy('startedAt', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { data: null, error: null };
    }
    const doc = snap.docs[0];
    return { data: { ...doc.data(), id: doc.id } as RunSession, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

/**
 * Real-time listener for active sessions. Calls `onSession` whenever
 * a running/paused session appears or disappears.
 * Returns an unsubscribe function.
 */
export function onActiveSessionSnapshot(
  userId: string,
  onSession: (session: RunSession | null) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    sessionsCollection(userId),
    where('status', 'in', ['running', 'paused']),
    orderBy('startedAt', 'desc'),
    limit(1),
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onSession(null);
      } else {
        const d = snap.docs[0];
        onSession({ ...d.data(), id: d.id } as RunSession);
      }
    },
    (err) => onError?.(err),
  );
}

/**
 * Real-time listener for ALL active sessions (running/paused).
 * Returns the full list on every change.
 */
export function onActiveSessionsSnapshot(
  userId: string,
  onSessions: (sessions: RunSession[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    sessionsCollection(userId),
    where('status', 'in', ['running', 'paused']),
    orderBy('startedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const sessions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as RunSession));
      onSessions(sessions);
    },
    (err) => onError?.(err),
  );
}
