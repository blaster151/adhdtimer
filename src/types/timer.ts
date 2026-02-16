import { Timestamp } from 'firebase/firestore';

// ========================================
// V2 Step & Schedule Types
// ========================================

/** Step type — defaults to 'active' when missing (backward compatible) */
export type StepType = 'active' | 'wait' | 'checkpoint';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Schedule {
  enabled: boolean;
  days: DayOfWeek[];
  timeOfDay: TimeOfDay;
}

export interface Streak {
  currentCount: number;
  lastCompletedDate: string;  // YYYY-MM-DD
  startDate: string;          // YYYY-MM-DD
}

// ========================================
// Timer Template — stored at users/{userId}/timers/{timerId}
// ========================================

export interface Step {
  id: string;
  name: string;
  plannedDuration: number; // seconds
  notes?: string;
  type?: StepType;         // v2 — defaults to 'active' when missing
  targetTime?: string;     // v2 — HH:MM, for checkpoint steps only
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
  pauseBetweenSteps?: boolean; // v2 — defaults to false when missing
  schedule?: Schedule;         // v2 — omitted means not scheduled
  streak?: Streak;             // v2 — omitted means no streak tracking
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
