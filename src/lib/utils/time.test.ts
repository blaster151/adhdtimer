import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatOverrun,
  formatRelativeDate,
  parseDurationInput,
  formatDurationSpeech,
  formatCountdown,
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

describe('formatDurationSpeech', () => {
  it('formats exact minutes', () => {
    expect(formatDurationSpeech(300)).toBe('5 minutes');
  });

  it('formats 1 minute singular', () => {
    expect(formatDurationSpeech(60)).toBe('1 minute');
  });

  it('formats half minutes', () => {
    expect(formatDurationSpeech(90)).toBe('1 and a half minute');
  });

  it('formats multiple half minutes', () => {
    expect(formatDurationSpeech(150)).toBe('2 and a half minutes');
  });

  it('formats seconds only', () => {
    expect(formatDurationSpeech(30)).toBe('30 seconds');
  });

  it('formats 1 second singular', () => {
    expect(formatDurationSpeech(1)).toBe('1 second');
  });

  it('rounds up non-round durations', () => {
    expect(formatDurationSpeech(310)).toBe('6 minutes');
  });

  it('formats 8 minutes for TTS example', () => {
    expect(formatDurationSpeech(480)).toBe('8 minutes');
  });
});

describe('formatCountdown', () => {
  it('shows remaining time when not overrunning', () => {
    expect(formatCountdown(600, 300)).toBe('5:00');
  });

  it('shows 0:00 at exactly planned duration', () => {
    expect(formatCountdown(600, 600)).toBe('+0:00 over');
  });

  it('shows overrun with + prefix and "over" suffix', () => {
    expect(formatCountdown(600, 735)).toBe('+2:15 over');
  });

  it('shows full remaining time from start', () => {
    expect(formatCountdown(600, 0)).toBe('10:00');
  });

  it('handles 1 second remaining', () => {
    expect(formatCountdown(600, 599)).toBe('0:01');
  });

  it('handles large overrun', () => {
    expect(formatCountdown(300, 3900)).toBe('+1:00:00 over');
  });
});
