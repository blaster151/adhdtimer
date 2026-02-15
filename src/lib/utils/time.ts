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
