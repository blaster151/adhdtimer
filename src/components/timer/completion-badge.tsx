interface CompletionBadgeProps {
  className?: string;
}

/**
 * "✓ Done" badge for routines already completed today.
 */
export function CompletionBadge({ className }: CompletionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-on-track/20 px-2 py-0.5 text-xs font-semibold text-on-track ${className ?? ''}`}
      aria-label="Completed today"
    >
      ✓ Done
    </span>
  );
}
