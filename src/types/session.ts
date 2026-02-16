import { Timestamp } from 'firebase/firestore';
import type { StepType } from './timer';

// ========================================
// Session — stored at users/{userId}/sessions/{sessionId}
// ========================================

/** Union type per ADR-5 — no enums */
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'waiting-for-advance';

/** Union type per ADR-5 — no enums */
export type StepStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped' | 'deferred';

export interface SessionStep {
  id: string;
  name: string;
  plannedDuration: number; // seconds (may increase via extensions)
  originalPlannedDuration: number; // seconds (before extensions)
  elapsedTime: number; // seconds
  status: StepStatus;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  type?: StepType;          // v2 — mirrors Step.type from template
  targetTime?: string;      // v2 — HH:MM for checkpoint steps
}

export interface RunSession {
  id: string;
  timerId: string;
  timerName: string;
  status: SessionStatus;
  currentStepIndex: number;
  startedAt: Timestamp;
  pausedAt?: Timestamp;
  completedAt?: Timestamp;
  activeDeviceId: string;
  totalElapsedTime: number; // seconds
  countdownMode?: boolean; // display countdown instead of elapsed (default false)
  steps: SessionStep[];
  deferredSteps?: string[];      // v2 — step IDs deferred for later
  pauseBetweenSteps?: boolean;   // v2 — mirrors TimerTemplate.pauseBetweenSteps
}

// ========================================
// Utility types
// ========================================

/** For creating a new session — omit server-managed fields */
export type CreateSessionInput = Omit<RunSession, 'id'>;
