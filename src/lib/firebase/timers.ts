import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './config';
import type { TimerTemplate, CreateTimerInput, UpdateTimerInput, Step } from '@/types/timer';

function timersCollection(userId: string) {
  return collection(db, 'users', userId, 'timers');
}

function timerDoc(userId: string, timerId: string) {
  return doc(db, 'users', userId, 'timers', timerId);
}

export async function createTimer(
  userId: string,
  input: CreateTimerInput,
): Promise<{ data: TimerTemplate | null; error: string | null }> {
  try {
    const now = Timestamp.now();
    const docData = {
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(timersCollection(userId), docData);
    return {
      data: { ...docData, id: docRef.id } as TimerTemplate,
      error: null,
    };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function getTimers(
  userId: string,
): Promise<{ data: TimerTemplate[]; error: string | null }> {
  try {
    const q = query(timersCollection(userId), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const timers = snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as TimerTemplate[];
    return { data: timers, error: null };
  } catch (err) {
    return { data: [], error: (err as Error).message };
  }
}

export async function getTimer(
  userId: string,
  timerId: string,
): Promise<{ data: TimerTemplate | null; error: string | null }> {
  try {
    const snap = await getDoc(timerDoc(userId, timerId));
    if (!snap.exists()) {
      return { data: null, error: 'Timer not found' };
    }
    return { data: { ...snap.data(), id: snap.id } as TimerTemplate, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function updateTimer(
  userId: string,
  timerId: string,
  data: UpdateTimerInput,
): Promise<{ data: void | null; error: string | null }> {
  try {
    await updateDoc(timerDoc(userId, timerId), {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { data: undefined, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function deleteTimer(
  userId: string,
  timerId: string,
): Promise<{ data: void | null; error: string | null }> {
  try {
    await deleteDoc(timerDoc(userId, timerId));
    return { data: undefined, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

export async function duplicateTimer(
  userId: string,
  timerId: string,
): Promise<{ data: TimerTemplate | null; error: string | null }> {
  try {
    const { data: original, error } = await getTimer(userId, timerId);
    if (error || !original) {
      return { data: null, error: error ?? 'Timer not found' };
    }

    const duplicateInput: CreateTimerInput = {
      name: `${original.name} (copy)`,
      description: original.description,
      totalPlannedDuration: original.totalPlannedDuration,
      countdownMode: original.countdownMode,
      steps: original.steps.map((step: Step) => ({
        ...step,
        id: crypto.randomUUID(),
      })),
    };

    return createTimer(userId, duplicateInput);
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}
