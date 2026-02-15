import { describe, it, expect } from 'vitest';
import { calculatePace } from './pace';
import type { SessionStep } from '@/types/session';

function makeStep(overrides: Partial<SessionStep> = {}): SessionStep {
  return {
    id: 'step-1',
    name: 'Test Step',
    plannedDuration: 300,
    originalPlannedDuration: 300,
    elapsedTime: 0,
    status: 'pending',
    ...overrides,
  };
}

describe('calculatePace', () => {
  it('returns on-track when exactly on time', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    const result = calculatePace(steps, 0, 300);
    expect(result.status).toBe('on-track');
    expect(result.message).toBe('Right on track');
    expect(result.deltaSeconds).toBe(0);
  });

  it('returns on-track within 30 seconds threshold', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    // 20 seconds behind (280 elapsed vs 300 planned) → still on track
    const result = calculatePace(steps, 0, 280);
    expect(result.status).toBe('on-track');
    expect(result.message).toBe('Right on track');
    expect(result.deltaSeconds).toBe(20);
  });

  it('returns on-track when 30 seconds behind', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    const result = calculatePace(steps, 0, 330);
    expect(result.status).toBe('on-track');
    expect(result.message).toBe('Right on track');
    expect(result.deltaSeconds).toBe(-30);
  });

  it('returns 1 min ahead when ahead by ~60s', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    // Elapsed 240 vs planned 300 → 60s ahead
    const result = calculatePace(steps, 0, 240);
    expect(result.status).toBe('ahead');
    expect(result.message).toBe('1 min ahead');
    expect(result.deltaSeconds).toBe(60);
  });

  it('returns 2 min ahead with nice pace message', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    // Elapsed 180 vs planned 300 → 120s ahead
    const result = calculatePace(steps, 0, 180);
    expect(result.status).toBe('ahead');
    expect(result.message).toBe('2 min ahead — nice pace');
    expect(result.deltaSeconds).toBe(120);
  });

  it('returns 1 min behind', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    // Elapsed 360 vs planned 300 → 60s behind
    const result = calculatePace(steps, 0, 360);
    expect(result.status).toBe('behind');
    expect(result.message).toBe('1 min behind');
    expect(result.deltaSeconds).toBe(-60);
  });

  it('returns 3 min behind', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    // Elapsed 480 vs planned 300 → 180s behind
    const result = calculatePace(steps, 0, 480);
    expect(result.status).toBe('behind');
    expect(result.message).toBe('3 min behind');
    expect(result.deltaSeconds).toBe(-180);
  });

  it('calculates cumulative pace across completed steps', () => {
    const steps = [
      makeStep({
        id: 'step-1',
        name: 'Step 1',
        plannedDuration: 300,
        elapsedTime: 240,
        status: 'completed',
      }),
      makeStep({
        id: 'step-2',
        name: 'Step 2',
        plannedDuration: 300,
        elapsedTime: 0,
        status: 'running',
      }),
    ];
    // Step 1: planned 300, actual 240 → 60s ahead
    // Step 2: planned 300, current elapsed 300 → on time
    // Cumulative: planned 600, actual 540 → 60s ahead
    const result = calculatePace(steps, 1, 300);
    expect(result.status).toBe('ahead');
    expect(result.message).toBe('1 min ahead');
    expect(result.deltaSeconds).toBe(60);
  });

  it('calculates cumulative behind across completed steps', () => {
    const steps = [
      makeStep({
        id: 'step-1',
        name: 'Step 1',
        plannedDuration: 300,
        elapsedTime: 420,
        status: 'completed',
      }),
      makeStep({
        id: 'step-2',
        name: 'Step 2',
        plannedDuration: 300,
        elapsedTime: 0,
        status: 'running',
      }),
    ];
    // Step 1: planned 300, actual 420 → 120s behind
    // Step 2: planned 300, current elapsed 300 → on time
    // Cumulative: planned 600, actual 720 → 120s behind
    const result = calculatePace(steps, 1, 300);
    expect(result.status).toBe('behind');
    expect(result.message).toBe('2 min behind');
    expect(result.deltaSeconds).toBe(-120);
  });

  it('handles first step with no completed steps', () => {
    const steps = [
      makeStep({ plannedDuration: 600, elapsedTime: 0, status: 'running' }),
      makeStep({ id: 'step-2', name: 'Step 2', plannedDuration: 300, status: 'pending' }),
    ];
    // First step, 10 seconds in → 590s ahead
    const result = calculatePace(steps, 0, 10);
    expect(result.status).toBe('ahead');
    expect(result.deltaSeconds).toBe(590);
  });

  it('rounds minutes correctly', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    // Elapsed 210 vs planned 300 → 90s ahead → rounds to 2 min
    const result = calculatePace(steps, 0, 210);
    expect(result.status).toBe('ahead');
    expect(result.message).toBe('2 min ahead — nice pace');
  });

  it('uses gentle factual language for behind (no alarms)', () => {
    const steps = [makeStep({ plannedDuration: 300, elapsedTime: 0, status: 'running' })];
    const result = calculatePace(steps, 0, 600);
    expect(result.status).toBe('behind');
    expect(result.message).toBe('5 min behind');
    // Verify no alarming language
    expect(result.message).not.toContain('!');
    expect(result.message).not.toContain('warning');
    expect(result.message).not.toContain('late');
    expect(result.message).not.toContain('over');
  });
});
