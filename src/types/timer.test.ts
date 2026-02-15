import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { TimerTemplate, Step, CreateTimerInput, WithId } from './timer';
import type { RunSession, SessionStep, SessionStatus, StepStatus } from './session';

/**
 * Type-level smoke tests — these ensure the interfaces compile correctly
 * and sample objects satisfy the type constraints.
 */

describe('TimerTemplate type', () => {
  it('accepts a valid timer template', () => {
    const step: Step = {
      id: 'step-1',
      name: 'Focus',
      plannedDuration: 1500, // 25 min in seconds
    };

    const timer: TimerTemplate = {
      id: 'timer-1',
      name: 'Pomodoro',
      description: 'A standard pomodoro timer',
      totalPlannedDuration: 1500,
      countdownMode: false,
      steps: [step],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    expect(timer.id).toBe('timer-1');
    expect(timer.steps).toHaveLength(1);
    expect(timer.steps[0].plannedDuration).toBe(1500);
  });

  it('allows optional fields to be omitted', () => {
    const timer: TimerTemplate = {
      id: 'timer-2',
      name: 'Simple',
      totalPlannedDuration: 300,
      countdownMode: true,
      steps: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    expect(timer.description).toBeUndefined();
    expect(timer.lastUsedAt).toBeUndefined();
  });

  it('CreateTimerInput omits server-managed fields', () => {
    const input: CreateTimerInput = {
      name: 'New Timer',
      totalPlannedDuration: 600,
      countdownMode: false,
      steps: [{ id: 's1', name: 'Work', plannedDuration: 600 }],
    };

    expect(input.name).toBe('New Timer');
    // @ts-expect-error — id should not be on CreateTimerInput
    expect(input.id).toBeUndefined();
  });

  it('WithId adds id to a type', () => {
    type TestType = { name: string };
    const item: WithId<TestType> = { id: '123', name: 'Test' };
    expect(item.id).toBe('123');
  });
});

describe('Session types', () => {
  it('SessionStatus is a valid union type', () => {
    const statuses: SessionStatus[] = ['idle', 'running', 'paused', 'completed'];
    expect(statuses).toHaveLength(4);
  });

  it('StepStatus is a valid union type', () => {
    const statuses: StepStatus[] = ['pending', 'running', 'paused', 'completed', 'skipped'];
    expect(statuses).toHaveLength(5);
  });

  it('accepts a valid RunSession', () => {
    const sessionStep: SessionStep = {
      id: 'step-1',
      name: 'Focus',
      plannedDuration: 1500,
      originalPlannedDuration: 1500,
      elapsedTime: 0,
      status: 'pending',
    };

    const session: RunSession = {
      id: 'session-1',
      timerId: 'timer-1',
      timerName: 'Pomodoro',
      status: 'idle',
      currentStepIndex: 0,
      startedAt: Timestamp.now(),
      activeDeviceId: 'device-abc',
      totalElapsedTime: 0,
      steps: [sessionStep],
    };

    expect(session.id).toBe('session-1');
    expect(session.status).toBe('idle');
    expect(session.steps[0].status).toBe('pending');
    expect(session.steps[0].originalPlannedDuration).toBe(1500);
  });

  it('allows optional session fields', () => {
    const session: RunSession = {
      id: 'session-2',
      timerId: 'timer-1',
      timerName: 'Test',
      status: 'completed',
      currentStepIndex: 0,
      startedAt: Timestamp.now(),
      activeDeviceId: 'device-1',
      totalElapsedTime: 300,
      steps: [],
    };

    expect(session.pausedAt).toBeUndefined();
    expect(session.completedAt).toBeUndefined();
  });

  it('durations are stored as integer seconds', () => {
    const step: SessionStep = {
      id: 'step-1',
      name: 'Focus',
      plannedDuration: 1500,
      originalPlannedDuration: 1500,
      elapsedTime: 750,
      status: 'running',
    };

    // All duration fields should be numbers (seconds)
    expect(typeof step.plannedDuration).toBe('number');
    expect(typeof step.originalPlannedDuration).toBe('number');
    expect(typeof step.elapsedTime).toBe('number');
    expect(step.plannedDuration).toBe(1500); // 25 min
  });
});
