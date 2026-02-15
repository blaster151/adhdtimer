import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatOverrun,
  formatRelativeDate,
  parseDurationInput,
} from './time';

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats seconds under a minute', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(300)).toBe('5:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1:30');
  });

  it('formats hours', () => {
    expect(formatDuration(5400)).toBe('1:30:00');
  });

  it('formats hours with seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('pads minutes and seconds in hour format', () => {
    expect(formatDuration(3605)).toBe('1:00:05');
  });

  it('handles large values', () => {
    expect(formatDuration(86400)).toBe('24:00:00');
  });

  it('handles negative values as absolute', () => {
    expect(formatDuration(-300)).toBe('5:00');
  });

  it('floors fractional seconds', () => {
    expect(formatDuration(90.7)).toBe('1:30');
  });
});

describe('formatOverrun', () => {
  it('adds + prefix', () => {
    expect(formatOverrun(135)).toBe('+2:15');
  });

  it('formats zero overrun', () => {
    expect(formatOverrun(0)).toBe('+0:00');
  });

  it('formats large overrun', () => {
    expect(formatOverrun(3600)).toBe('+1:00:00');
  });
});

describe('formatRelativeDate', () => {
  it('returns "Never" for null', () => {
    expect(formatRelativeDate(null)).toBe('Never');
  });

  it('returns "Never" for undefined', () => {
    expect(formatRelativeDate(undefined)).toBe('Never');
  });

  it('returns "just now" for recent dates', () => {
    expect(formatRelativeDate(new Date())).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeDate(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('handles singular minute', () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    expect(formatRelativeDate(oneMinAgo)).toBe('1 minute ago');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    expect(formatRelativeDate(twoHoursAgo)).toBe('2 hours ago');
  });

  it('handles singular hour', () => {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    expect(formatRelativeDate(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000);
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
  });

  it('handles singular day', () => {
    const oneDayAgo = new Date(Date.now() - 86400 * 1000);
    expect(formatRelativeDate(oneDayAgo)).toBe('1 day ago');
  });

  it('returns months ago', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 86400 * 1000);
    expect(formatRelativeDate(twoMonthsAgo)).toBe('2 months ago');
  });

  it('returns years ago', () => {
    const twoYearsAgo = new Date(Date.now() - 730 * 86400 * 1000);
    expect(formatRelativeDate(twoYearsAgo)).toBe('2 years ago');
  });
});

describe('parseDurationInput', () => {
  it('converts minutes to seconds', () => {
    expect(parseDurationInput(5)).toBe(300);
  });

  it('handles zero', () => {
    expect(parseDurationInput(0)).toBe(0);
  });

  it('handles fractional minutes', () => {
    expect(parseDurationInput(1.5)).toBe(90);
  });

  it('rounds to nearest second', () => {
    expect(parseDurationInput(1.01)).toBe(61);
  });
});
