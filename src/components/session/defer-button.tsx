'use client';

import { Button } from '@/components/ui/button';

interface DeferButtonProps {
  onDefer: () => void;
  disabled?: boolean;
}

export function DeferButton({ onDefer, disabled = false }: DeferButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onDefer}
      disabled={disabled}
      aria-label="Defer step"
      data-testid="defer-button"
    >
      ↩ Defer
    </Button>
  );
}
