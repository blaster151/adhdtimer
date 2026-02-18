import type { TimeOfDay } from '@/types/timer';

const ICONS: Record<TimeOfDay, { emoji: string; label: string } | null> = {
  morning: { emoji: '☀️', label: 'Morning routine' },
  afternoon: { emoji: '🌤️', label: 'Afternoon routine' },
  evening: { emoji: '🌙', label: 'Evening routine' },
  anytime: null,
};

interface TimeOfDayIconProps {
  timeOfDay: TimeOfDay;
  className?: string;
}

/**
 * Small emoji indicator for the schedule's time-of-day bucket.
 * Returns null for 'anytime' (no icon needed).
 */
export function TimeOfDayIcon({ timeOfDay, className }: TimeOfDayIconProps) {
  const config = ICONS[timeOfDay];
  if (!config) return null;

  return (
    <span
      className={className}
      role="img"
      aria-label={config.label}
    >
      {config.emoji}
    </span>
  );
}
