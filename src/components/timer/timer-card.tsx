'use client';

import type { TimerTemplate } from '@/types/timer';
import { formatDuration, formatRelativeDate } from '@/lib/utils/time';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimerCardProps {
  timer: TimerTemplate;
  onPlay?: (timer: TimerTemplate) => void;
  onEdit?: (timer: TimerTemplate) => void;
  onDelete?: (timer: TimerTemplate) => void;
  onDuplicate?: (timer: TimerTemplate) => void;
}

export function TimerCard({ timer, onPlay, onEdit, onDelete, onDuplicate }: TimerCardProps) {
  const lastUsed = timer.lastUsedAt ? formatRelativeDate(timer.lastUsedAt.toDate()) : 'Never';

  return (
    <Card className="border-border bg-surface transition-colors hover:bg-elevated">
      <CardContent className="flex items-center justify-between p-4">
        {/* Timer info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-foreground">{timer.name}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{formatDuration(timer.totalPlannedDuration)}</span>
            <span>·</span>
            <span>
              {timer.steps.length} step{timer.steps.length !== 1 ? 's' : ''}
            </span>
            <span>·</span>
            <span>{lastUsed}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-3 flex shrink-0 items-center gap-1">
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full text-lg"
            onClick={() => onPlay?.(timer)}
            aria-label={`Play ${timer.name}`}
          >
            ▶
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={`More options for ${timer.name}`}>
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(timer)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(timer)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(timer)}
                className="text-warning focus:text-warning"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
