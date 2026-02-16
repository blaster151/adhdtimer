'use client';

interface DeferredBadgeProps {
  count: number;
}

export function DeferredBadge({ count }: DeferredBadgeProps) {
  if (count === 0) return null;

  return (
    <div
      className="flex items-center justify-center"
      data-testid="deferred-badge"
    >
      <span
        className="rounded-full px-3 py-0.5 text-xs font-medium"
        style={{ color: 'var(--deferred)' }}
      >
        {count} deferred ↩
      </span>
    </div>
  );
}
