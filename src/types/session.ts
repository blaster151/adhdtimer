import { Timestamp } from 'firebase/firestore';

// ========================================
// Session — stored at users/{userId}/sessions/{sessionId}
// ========================================

/** Union type per ADR-5 — no enums */
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

/** Union type per ADR-5 — no enums */
export type StepStatus = 'pending' | 'running' | 'paused' | 'completed' | 'skipped';

export interface SessionStep {
  id: string;
  name: string;
  plannedDuration: number; // seconds (may increase via extensions)
  originalPlannedDuration: number; // seconds (before extensions)
  elapsedTime: number; // seconds
  status: StepStatus;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
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
  steps: SessionStep[];
}

// ========================================
// Utility types
// ========================================

/** For creating a new session — omit server-managed fields */
export type CreateSessionInput = Omit<RunSession, 'id'>;
