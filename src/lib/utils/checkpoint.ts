// ========================================
// Checkpoint Utility Functions
// Pure functions for parsing and comparing checkpoint target times.
// ADR-7: Clock Time for Checkpoints — No Timezone Library
// ========================================

/** Parsed representation of an HH:MM time string */
export interface ParsedTime {
  hours: number;
  minutes: number;
}

/** Result of comparing current time against a checkpoint target */
export interface CheckpointStatusResult {
  status: 'ahead' | 'on-time' | 'behind';
  diffMinutes: number;
  message: string;
}

/**
 * Parse a target time string into hours and minutes.
 * Accepts formats: "07:30", "7:30", "0730"
 * Returns null for invalid input.
 */
export function parseTargetTime(timeStr: string): ParsedTime | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const trimmed = timeStr.trim();
  let hours: number;
  let minutes: number;

  // Try HH:MM or H:MM format
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    hours = parseInt(colonMatch[1], 10);
    minutes = parseInt(colonMatch[2], 10);
  } else {
    // Try HHMM format (exactly 4 digits, no colon)
    const noColonMatch = trimmed.match(/^(\d{2})(\d{2})$/);
    if (noColonMatch) {
      hours = parseInt(noColonMatch[1], 10);
      minutes = parseInt(noColonMatch[2], 10);
    } else {
      return null;
    }
  }

  // Validate ranges
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
}

/** On-time threshold in minutes (inclusive) */
const ON_TIME_THRESHOLD = 1;

/** Minutes in a full day */
const MINUTES_IN_DAY = 1440;

/** Half a day in minutes — used for midnight crossing detection */
const HALF_DAY = 720;

/**
 * Compare current clock time against a checkpoint target time.
 * Returns status (ahead/on-time/behind), absolute diff, and human-readable message.
 *
 * Positive diff = user is ahead (arrived early).
 * Negative diff = user is behind (running late).
 *
 * Midnight crossing: if absolute raw diff exceeds 12 hours,
 * the shorter-path direction is used (assumes ±12h window).
 */
export function getCheckpointStatus(
  targetTime: string,
  now?: Date,
): CheckpointStatusResult {
  const parsed = parseTargetTime(targetTime);
  if (!parsed) {
    return { status: 'on-time', diffMinutes: 0, message: 'right on time' };
  }

  const currentTime = now ?? new Date();
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const targetMinutes = parsed.hours * 60 + parsed.minutes;

  // Raw diff: positive = target is in the future (user is ahead/early)
  let diff = targetMinutes - nowMinutes;

  // Midnight crossing: pick the shorter path around the 24h clock
  if (diff > HALF_DAY) {
    diff -= MINUTES_IN_DAY;
  } else if (diff < -HALF_DAY) {
    diff += MINUTES_IN_DAY;
  }

  const absDiff = Math.abs(diff);

  if (absDiff <= ON_TIME_THRESHOLD) {
    return { status: 'on-time', diffMinutes: 0, message: 'right on time' };
  }

  if (diff > 0) {
    // Target is still in the future — user arrived early
    return { status: 'ahead', diffMinutes: absDiff, message: `${absDiff} min early` };
  }

  // Target is in the past — user is late
  return { status: 'behind', diffMinutes: absDiff, message: `${absDiff} min past` };
}

/**
 * Format a target time string for locale-aware display.
 * Uses Intl.DateTimeFormat per ADR-7.
 * Returns empty string for invalid input.
 */
export function formatClockTime(timeStr: string, locale?: string): string {
  const parsed = parseTargetTime(timeStr);
  if (!parsed) return '';

  // Use a fixed date (Jan 1 2000) — only hours/minutes matter
  const date = new Date(2000, 0, 1, parsed.hours, parsed.minutes);

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
