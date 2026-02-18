import { formatStreakBadge, getMilestone } from '@/lib/utils/streaks';

interface StreakBadgeProps {
  count: number;
  className?: string;
}

/**
 * Streak badge overlay showing "Day N 🔥" with optional milestone text.
 * Returns null when count is 0 (no streak to display).
 */
export function StreakBadge({ count, className }: StreakBadgeProps) {
  const badge = formatStreakBadge(count);
  if (!badge) return null;

  const milestone = getMilestone(count);

  // Milestone text: "Day 7 — one week ☕" etc.
  const displayText = milestone ? `Day ${count} — ${milestone}` : badge;

  return (
    <span
      className={`inline-flex items-center rounded-full bg-streak/20 px-2 py-0.5 text-xs font-medium text-streak ${className ?? ''}`}
      aria-label={`Current streak: ${count} days`}
    >
      {displayText}
    </span>
  );
}
