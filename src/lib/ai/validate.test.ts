import { describe, it, expect } from 'vitest';
import { validateBreakdownResponse } from '@/lib/ai/validate';

describe('validateBreakdownResponse', () => {
  const validResponse = {
    timerName: 'Do Laundry',
    steps: [
      { name: 'Sort clothes', durationMinutes: 5 },
      { name: 'Load washer', durationMinutes: 3 },
      { name: 'Start wash cycle', durationMinutes: 1 },
    ],
  };

  it('accepts a valid response', () => {
    const { data, error } = validateBreakdownResponse(validResponse);
    expect(error).toBeNull();
    expect(data).toEqual(validResponse);
  });

  it('rejects null', () => {
    const { data, error } = validateBreakdownResponse(null);
    expect(data).toBeNull();
    expect(error).toBe('Response is not an object');
  });

  it('rejects a string', () => {
    const { data, error } = validateBreakdownResponse('not json');
    expect(data).toBeNull();
    expect(error).toBe('Response is not an object');
  });

  it('rejects missing timerName', () => {
    const { data, error } = validateBreakdownResponse({ steps: [{ name: 'a', durationMinutes: 1 }] });
    expect(data).toBeNull();
    expect(error).toBe('Missing or invalid timerName');
  });

  it('rejects empty timerName', () => {
    const { data, error } = validateBreakdownResponse({ timerName: '  ', steps: [{ name: 'a', durationMinutes: 1 }] });
    expect(data).toBeNull();
    expect(error).toBe('Missing or invalid timerName');
  });

  it('rejects missing steps', () => {
    const { data, error } = validateBreakdownResponse({ timerName: 'Test' });
    expect(data).toBeNull();
    expect(error).toBe('Missing or empty steps array');
  });

  it('rejects empty steps array', () => {
    const { data, error } = validateBreakdownResponse({ timerName: 'Test', steps: [] });
    expect(data).toBeNull();
    expect(error).toBe('Missing or empty steps array');
  });

  it('rejects more than 12 steps', () => {
    const steps = Array.from({ length: 13 }, (_, i) => ({ name: `Step ${i}`, durationMinutes: 1 }));
    const { data, error } = validateBreakdownResponse({ timerName: 'Test', steps });
    expect(data).toBeNull();
    expect(error).toBe('Too many steps (max 12)');
  });

  it('rejects step with missing name', () => {
    const { data, error } = validateBreakdownResponse({
      timerName: 'Test',
      steps: [{ durationMinutes: 5 }],
    });
    expect(data).toBeNull();
    expect(error).toContain('missing or invalid name');
  });

  it('rejects step with non-numeric duration', () => {
    const { data, error } = validateBreakdownResponse({
      timerName: 'Test',
      steps: [{ name: 'Step', durationMinutes: 'five' }],
    });
    expect(data).toBeNull();
    expect(error).toContain('missing or invalid durationMinutes');
  });

  it('clamps duration below 1 to 1', () => {
    const { data } = validateBreakdownResponse({
      timerName: 'Test',
      steps: [{ name: 'Quick step', durationMinutes: 0.3 }],
    });
    expect(data!.steps[0].durationMinutes).toBe(1);
  });

  it('clamps duration above 120 to 120', () => {
    const { data } = validateBreakdownResponse({
      timerName: 'Test',
      steps: [{ name: 'Long step', durationMinutes: 200 }],
    });
    expect(data!.steps[0].durationMinutes).toBe(120);
  });

  it('rounds fractional durations', () => {
    const { data } = validateBreakdownResponse({
      timerName: 'Test',
      steps: [{ name: 'Step', durationMinutes: 5.7 }],
    });
    expect(data!.steps[0].durationMinutes).toBe(6);
  });

  it('trims whitespace from names', () => {
    const { data } = validateBreakdownResponse({
      timerName: '  Do Laundry  ',
      steps: [{ name: '  Sort clothes  ', durationMinutes: 5 }],
    });
    expect(data!.timerName).toBe('Do Laundry');
    expect(data!.steps[0].name).toBe('Sort clothes');
  });

  it('rejects step that is not an object', () => {
    const { data, error } = validateBreakdownResponse({
      timerName: 'Test',
      steps: ['not a step'],
    });
    expect(data).toBeNull();
    expect(error).toContain('not an object');
  });
});
