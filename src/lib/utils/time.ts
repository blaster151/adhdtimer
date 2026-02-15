/**
 * Time utility functions.
 * All durations are stored as integer seconds in Firestore.
 * These helpers convert between seconds and human-readable strings.
 */

/**
 * Format a duration in seconds to a human-readable string.
 * @example formatDuration(300) → "5:00"
 * @example formatDuration(5400) → "1:30:00"
 * @example formatDuration(0) → "0:00"
 */
export function formatDuration(seconds: number): string {
  const absSeconds = Math.abs(Math.floor(seconds));
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const s = absSeconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format an overrun (time beyond planned duration) with a "+" prefix.
 * @example formatOverrun(135) → "+2:15"
 * @example formatOverrun(0) → "+0:00"
 */
export function formatOverrun(seconds: number): string {
  return `+${formatDuration(seconds)}`;
}

/**
 * Format a date relative to now.
 * @example formatRelativeDate(new Date()) → "just now"
 * @example formatRelativeDate(null) → "Never"
 */
export function formatRelativeDate(date: Date | null | undefined): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  }
  if (diffSeconds < 86400) {
    const hrs = Math.floor(diffSeconds / 3600);
    return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * Convert minutes input to seconds for Firestore storage.
 * @example parseDurationInput(5) → 300
 */
export function parseDurationInput(minutes: number): number {
  return Math.round(minutes * 60);
}

/**
 * Format a duration in seconds to a spoken string for TTS.
 * @example formatDurationSpeech(480) → "8 minutes"
 * @example formatDurationSpeech(60) → "1 minute"
 * @example formatDurationSpeech(90) → "1 and a half minutes"
 * @example formatDurationSpeech(30) → "30 seconds"
 */
export function formatDurationSpeech(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (totalMinutes === 0) {
    return `${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
  }

  if (remainingSeconds === 0) {
    return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
  }

  if (remainingSeconds === 30) {
    if (totalMinutes === 0) return '30 seconds';
    return `${totalMinutes} and a half minute${totalMinutes === 1 ? '' : 's'}`;
  }

  // For non-round durations, just use minutes (round up)
  const roundedMinutes = Math.ceil(seconds / 60);
  return `${roundedMinutes} minute${roundedMinutes === 1 ? '' : 's'}`;
}

/**
 * Format a countdown display: shows remaining time, or "+M:SS over" when overrunning.
 * @example formatCountdown(600, 300) → "5:00"  (5 min remaining)
 * @example formatCountdown(600, 600) → "0:00"
 * @example formatCountdown(600, 735) → "+2:15 over"
 */
export function formatCountdown(plannedDuration: number, elapsedTime: number): string {
  if (elapsedTime >= plannedDuration) {
    const overrun = elapsedTime - plannedDuration;
    return `+${formatDuration(overrun)} over`;
  }
  return formatDuration(plannedDuration - elapsedTime);
}

/**
 * Parse a user-entered duration string into seconds.
 * Supports formats: "5m", "5:00", "5", "300s", "1h30m", "1:30:00"
 * Returns null for invalid input or durations below 60 seconds (1 minute minimum).
 *
 * @example parseDuration("5m") → 300
 * @example parseDuration("5:00") → 300
 * @example parseDuration("5") → 300
 * @example parseDuration("300s") → 300
 * @example parseDuration("1h30m") → 5400
 * @example parseDuration("abc") → null
 * @example parseDuration("0") → null
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try "XhYm" format (e.g. "1h30m", "2h", "45m")
  const hmMatch = trimmed.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i);
  if (hmMatch && (hmMatch[1] || hmMatch[2])) {
    const hours = parseInt(hmMatch[1] || '0', 10);
    const minutes = parseInt(hmMatch[2] || '0', 10);
    const total = hours * 3600 + minutes * 60;
    return total >= 60 ? total : null;
  }

  // Try "Xs" format (e.g. "300s")
  const sMatch = trimmed.match(/^(\d+)\s*s$/i);
  if (sMatch) {
    const seconds = parseInt(sMatch[1], 10);
    return seconds >= 60 ? seconds : null;
  }

  // Try "H:MM:SS" or "M:SS" format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (colonMatch) {
    if (colonMatch[3] !== undefined) {
      // H:MM:SS
      const h = parseInt(colonMatch[1], 10);
      const m = parseInt(colonMatch[2], 10);
      const s = parseInt(colonMatch[3], 10);
      if (m > 59 || s > 59) return null;
      const total = h * 3600 + m * 60 + s;
      return total >= 60 ? total : null;
    } else {
      // M:SS
      const m = parseInt(colonMatch[1], 10);
      const s = parseInt(colonMatch[2], 10);
      if (s > 59) return null;
      const total = m * 60 + s;
      return total >= 60 ? total : null;
    }
  }

  // Try plain number (treated as minutes)
  const num = parseFloat(trimmed);
  if (!isNaN(num) && num > 0 && /^\d+(\.\d+)?$/.test(trimmed)) {
    const seconds = Math.round(num * 60);
    return seconds >= 60 ? seconds : null;
  }

  return null;
}
