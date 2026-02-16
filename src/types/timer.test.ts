import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type {
  TimerTemplate, Step, CreateTimerInput, WithId,
  StepType, DayOfWeek, TimeOfDay, Schedule, Streak,
} from './timer';
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

describe('V2 timer types', () => {
  it('StepType union accepts all three values', () => {
    const types: StepType[] = ['active', 'wait', 'checkpoint'];
    expect(types).toHaveLength(3);
  });

  it('DayOfWeek accepts all seven days', () => {
    const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    expect(days).toHaveLength(7);
  });

  it('TimeOfDay accepts all four values', () => {
    const times: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];
    expect(times).toHaveLength(4);
  });

  it('Schedule interface accepts valid values', () => {
    const schedule: Schedule = {
      enabled: true,
      days: ['mon', 'wed', 'fri'],
      timeOfDay: 'morning',
    };
    expect(schedule.enabled).toBe(true);
    expect(schedule.days).toHaveLength(3);
    expect(schedule.timeOfDay).toBe('morning');
  });

  it('Streak interface accepts valid values', () => {
    const streak: Streak = {
      currentCount: 5,
      lastCompletedDate: '2026-02-15',
      startDate: '2026-02-10',
    };
    expect(streak.currentCount).toBe(5);
    expect(streak.lastCompletedDate).toBe('2026-02-15');
  });

  it('Step with checkpoint type and targetTime compiles', () => {
    const step: Step = {
      id: 'cp-1',
      name: 'Morning check',
      plannedDuration: 0,
      type: 'checkpoint',
      targetTime: '07:30',
    };
    expect(step.type).toBe('checkpoint');
    expect(step.targetTime).toBe('07:30');
  });

  it('Step without type compiles (backward compatible)', () => {
    const step: Step = {
      id: 'step-1',
      name: 'Focus',
      plannedDuration: 1500,
    };
    expect(step.type).toBeUndefined();
    expect(step.targetTime).toBeUndefined();
  });

  it('TimerTemplate with v2 fields compiles', () => {
    const timer: TimerTemplate = {
      id: 'timer-v2',
      name: 'Morning Routine',
      totalPlannedDuration: 1800,
      countdownMode: false,
      steps: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      pauseBetweenSteps: true,
      schedule: {
        enabled: true,
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        timeOfDay: 'morning',
      },
      streak: {
        currentCount: 3,
        lastCompletedDate: '2026-02-15',
        startDate: '2026-02-12',
      },
    };
    expect(timer.pauseBetweenSteps).toBe(true);
    expect(timer.schedule?.enabled).toBe(true);
    expect(timer.streak?.currentCount).toBe(3);
  });

  it('TimerTemplate without v2 fields compiles (backward compatible)', () => {
    const timer: TimerTemplate = {
      id: 'timer-v1',
      name: 'Simple',
      totalPlannedDuration: 300,
      countdownMode: true,
      steps: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    expect(timer.pauseBetweenSteps).toBeUndefined();
    expect(timer.schedule).toBeUndefined();
    expect(timer.streak).toBeUndefined();
  });

  it('CreateTimerInput flows through v2 optional fields', () => {
    const input: CreateTimerInput = {
      name: 'V2 Timer',
      totalPlannedDuration: 600,
      countdownMode: false,
      steps: [{ id: 's1', name: 'Work', plannedDuration: 600, type: 'active' }],
      pauseBetweenSteps: true,
    };
    expect(input.pauseBetweenSteps).toBe(true);
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

describe('V2 session types', () => {
  it('SessionStatus includes waiting-for-advance (6 values)', () => {
    const statuses: SessionStatus[] = [
      'idle', 'running', 'paused', 'completed', 'waiting-for-advance',
    ];
    expect(statuses).toHaveLength(5);
  });

  it('StepStatus includes deferred (6 values)', () => {
    const statuses: StepStatus[] = [
      'pending', 'running', 'paused', 'completed', 'skipped', 'deferred',
    ];
    expect(statuses).toHaveLength(6);
  });

  it('SessionStep with wait type compiles', () => {
    const step: SessionStep = {
      id: 'wait-1',
      name: 'Transition',
      plannedDuration: 60,
      originalPlannedDuration: 60,
      elapsedTime: 0,
      status: 'pending',
      type: 'wait',
    };
    expect(step.type).toBe('wait');
  });

  it('RunSession with v2 fields compiles', () => {
    const session: RunSession = {
      id: 'session-v2',
      timerId: 'timer-1',
      timerName: 'Routine',
      status: 'waiting-for-advance',
      currentStepIndex: 2,
      startedAt: Timestamp.now(),
      activeDeviceId: 'device-1',
      totalElapsedTime: 300,
      steps: [],
      deferredSteps: ['step-2', 'step-4'],
      pauseBetweenSteps: true,
    };
    expect(session.deferredSteps).toHaveLength(2);
    expect(session.pauseBetweenSteps).toBe(true);
    expect(session.status).toBe('waiting-for-advance');
  });

  it('RunSession without v2 fields compiles (backward compatible)', () => {
    const session: RunSession = {
      id: 'session-v1',
      timerId: 'timer-1',
      timerName: 'Test',
      status: 'running',
      currentStepIndex: 0,
      startedAt: Timestamp.now(),
      activeDeviceId: 'device-1',
      totalElapsedTime: 0,
      steps: [],
    };
    expect(session.deferredSteps).toBeUndefined();
    expect(session.pauseBetweenSteps).toBeUndefined();
  });
});
