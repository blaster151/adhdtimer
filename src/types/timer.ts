import { Timestamp } from 'firebase/firestore';

// ========================================
// Timer Template — stored at users/{userId}/timers/{timerId}
// ========================================

export interface Step {
  id: string;
  name: string;
  plannedDuration: number; // seconds
  notes?: string;
}

export interface TimerTemplate {
  id: string;
  name: string;
  description?: string;
  totalPlannedDuration: number; // seconds
  countdownMode: boolean; // default false
  steps: Step[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsedAt?: Timestamp;
}

// ========================================
// Utility types
// ========================================

/** Adds Firestore document ID to a type */
export type WithId<T> = T & { id: string };

/** For creating a new timer — omit server-managed fields */
export type CreateTimerInput = Omit<TimerTemplate, 'id' | 'createdAt' | 'updatedAt'>;

/** For updating a timer — all fields optional except steps array structure */
export type UpdateTimerInput = Partial<Omit<TimerTemplate, 'id' | 'createdAt'>>;
