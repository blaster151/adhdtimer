'use client';

import { Button } from '@/components/ui/button';

interface ObserverBannerProps {
  onTakeControl: () => void;
}

export function ObserverBanner({ onTakeControl }: ObserverBannerProps) {
  return (
    <div
      className="flex items-center justify-between rounded-md border border-info/30 bg-info/10 px-4 py-3"
      role="status"
      data-testid="observer-banner"
    >
      <span className="text-sm text-muted-foreground">
        Controlled from another device
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onTakeControl}
      >
        Take Control
      </Button>
    </div>
  );
}
