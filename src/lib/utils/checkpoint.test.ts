import { describe, it, expect } from 'vitest';
import {
  parseTargetTime,
  getCheckpointStatus,
  formatClockTime,
} from './checkpoint';
import type { ParsedTime, CheckpointStatusResult } from './checkpoint';

// ========================================
// parseTargetTime
// ========================================

describe('parseTargetTime', () => {
  it('parses "07:30" → { hours: 7, minutes: 30 }', () => {
    expect(parseTargetTime('07:30')).toEqual({ hours: 7, minutes: 30 });
  });

  it('parses "7:30" → { hours: 7, minutes: 30 } (flexible)', () => {
    expect(parseTargetTime('7:30')).toEqual({ hours: 7, minutes: 30 });
  });

  it('parses "0730" → { hours: 7, minutes: 30 } (no colon)', () => {
    expect(parseTargetTime('0730')).toEqual({ hours: 7, minutes: 30 });
  });

  it('parses "23:59" → { hours: 23, minutes: 59 }', () => {
    expect(parseTargetTime('23:59')).toEqual({ hours: 23, minutes: 59 });
  });

  it('parses "00:00" → { hours: 0, minutes: 0 }', () => {
    expect(parseTargetTime('00:00')).toEqual({ hours: 0, minutes: 0 });
  });

  it('returns null for "25:00" (invalid hours)', () => {
    expect(parseTargetTime('25:00')).toBeNull();
  });

  it('returns null for "12:60" (invalid minutes)', () => {
    expect(parseTargetTime('12:60')).toBeNull();
  });

  it('returns null for "" (empty string)', () => {
    expect(parseTargetTime('')).toBeNull();
  });

  it('returns null for "abc" (non-numeric)', () => {
    expect(parseTargetTime('abc')).toBeNull();
  });

  it('returns null for "7" (no minutes)', () => {
    expect(parseTargetTime('7')).toBeNull();
  });

  it('parses "12:00" → { hours: 12, minutes: 0 } (noon)', () => {
    expect(parseTargetTime('12:00')).toEqual({ hours: 12, minutes: 0 });
  });

  it('parses "0:00" → { hours: 0, minutes: 0 } (midnight, single digit)', () => {
    expect(parseTargetTime('0:00')).toEqual({ hours: 0, minutes: 0 });
  });

  it('trims whitespace', () => {
    expect(parseTargetTime('  07:30  ')).toEqual({ hours: 7, minutes: 30 });
  });

  it('returns null for "24:00" (24 is out of range)', () => {
    expect(parseTargetTime('24:00')).toBeNull();
  });

  it('returns null for negative numbers like "-1:30"', () => {
    expect(parseTargetTime('-1:30')).toBeNull();
  });
});

// ========================================
// getCheckpointStatus
// ========================================

describe('getCheckpointStatus', () => {
  /** Helper: create a Date with specific hours and minutes */
  function makeTime(hours: number, minutes: number): Date {
    return new Date(2026, 1, 16, hours, minutes, 0);
  }

  it('returns ahead when current time is before target', () => {
    const result = getCheckpointStatus('07:30', makeTime(7, 26));
    expect(result.status).toBe('ahead');
    expect(result.diffMinutes).toBe(4);
    expect(result.message).toBe('4 min early');
  });

  it('returns behind when current time is after target', () => {
    const result = getCheckpointStatus('07:30', makeTime(7, 33));
    expect(result.status).toBe('behind');
    expect(result.diffMinutes).toBe(3);
    expect(result.message).toBe('3 min past');
  });

  it('returns on-time when current time matches target exactly', () => {
    const result = getCheckpointStatus('07:30', makeTime(7, 30));
    expect(result.status).toBe('on-time');
    expect(result.diffMinutes).toBe(0);
    expect(result.message).toBe('right on time');
  });

  it('returns on-time when 1 min past (within threshold)', () => {
    const result = getCheckpointStatus('07:30', makeTime(7, 31));
    expect(result.status).toBe('on-time');
    expect(result.message).toBe('right on time');
  });

  it('returns on-time when 1 min early (within threshold)', () => {
    const result = getCheckpointStatus('07:30', makeTime(7, 29));
    expect(result.status).toBe('on-time');
    expect(result.message).toBe('right on time');
  });

  it('returns behind when 2 min past (outside threshold)', () => {
    const result = getCheckpointStatus('07:30', makeTime(7, 32));
    expect(result.status).toBe('behind');
    expect(result.diffMinutes).toBe(2);
    expect(result.message).toBe('2 min past');
  });

  it('returns on-time at noon when target is 12:00', () => {
    const result = getCheckpointStatus('12:00', makeTime(12, 0));
    expect(result.status).toBe('on-time');
  });

  it('handles midnight crossing — 23:50 vs target 00:15 = ahead', () => {
    // At 23:50, target is 00:15 — user has 25 min left (ahead)
    const result = getCheckpointStatus('00:15', makeTime(23, 50));
    expect(result.status).toBe('ahead');
    expect(result.diffMinutes).toBe(25);
    expect(result.message).toBe('25 min early');
  });

  it('handles midnight crossing — 00:30 vs target 23:45 = behind', () => {
    // At 00:30, target was 23:45 — user is 45 min late
    const result = getCheckpointStatus('23:45', makeTime(0, 30));
    expect(result.status).toBe('behind');
    expect(result.diffMinutes).toBe(45);
    expect(result.message).toBe('45 min past');
  });

  it('handles large ahead value — 06:00 vs target 08:00', () => {
    const result = getCheckpointStatus('08:00', makeTime(6, 0));
    expect(result.status).toBe('ahead');
    expect(result.diffMinutes).toBe(120);
    expect(result.message).toBe('120 min early');
  });

  it('returns on-time for invalid target (graceful handling)', () => {
    const result = getCheckpointStatus('invalid', makeTime(7, 30));
    expect(result.status).toBe('on-time');
    expect(result.diffMinutes).toBe(0);
    expect(result.message).toBe('right on time');
  });

  it('uses current time when now is not provided', () => {
    // Just verify it doesn't throw — result depends on actual clock
    const result = getCheckpointStatus('12:00');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('diffMinutes');
    expect(result).toHaveProperty('message');
  });
});

// ========================================
// formatClockTime
// ========================================

describe('formatClockTime', () => {
  it('formats "07:30" in en-US → "7:30 AM"', () => {
    const result = formatClockTime('07:30', 'en-US');
    expect(result).toContain('7:30');
    expect(result).toMatch(/AM/i);
  });

  it('formats "15:00" in en-US → "3:00 PM"', () => {
    const result = formatClockTime('15:00', 'en-US');
    expect(result).toContain('3:00');
    expect(result).toMatch(/PM/i);
  });

  it('formats "00:00" in en-US → "12:00 AM"', () => {
    const result = formatClockTime('00:00', 'en-US');
    expect(result).toContain('12:00');
    expect(result).toMatch(/AM/i);
  });

  it('formats "12:00" in en-US → "12:00 PM"', () => {
    const result = formatClockTime('12:00', 'en-US');
    expect(result).toContain('12:00');
    expect(result).toMatch(/PM/i);
  });

  it('returns empty string for invalid input', () => {
    expect(formatClockTime('invalid')).toBe('');
    expect(formatClockTime('')).toBe('');
    expect(formatClockTime('25:00')).toBe('');
  });

  it('uses browser default locale when none specified', () => {
    // Just verify it returns a non-empty string for valid input
    const result = formatClockTime('14:30');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ========================================
// Type-level checks
// ========================================

describe('Checkpoint type exports', () => {
  it('ParsedTime interface is correctly typed', () => {
    const parsed: ParsedTime = { hours: 7, minutes: 30 };
    expect(parsed.hours).toBe(7);
    expect(parsed.minutes).toBe(30);
  });

  it('CheckpointStatusResult interface is correctly typed', () => {
    const result: CheckpointStatusResult = {
      status: 'ahead',
      diffMinutes: 5,
      message: '5 min early',
    };
    expect(result.status).toBe('ahead');
    expect(result.diffMinutes).toBe(5);
  });
});
