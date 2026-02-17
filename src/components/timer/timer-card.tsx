'use client';

import Link from 'next/link';
import type { TimerTemplate } from '@/types/timer';
import type { RunSession } from '@/types/session';
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
  activeSession?: RunSession;
  onPlay?: (timer: TimerTemplate) => void;
  onEdit?: (timer: TimerTemplate) => void;
  onDelete?: (timer: TimerTemplate) => void;
  onDuplicate?: (timer: TimerTemplate) => void;
}

export function TimerCard({ timer, activeSession, onPlay, onEdit, onDelete, onDuplicate }: TimerCardProps) {
  const lastUsed = timer.lastUsedAt ? formatRelativeDate(timer.lastUsedAt.toDate()) : 'Never';
  const isActive = !!activeSession;

  return (
    <Card
      className={`border-border bg-surface transition-colors hover:bg-elevated ${
        isActive ? 'ring-1 ring-primary/40' : ''
      }`}
      data-testid="timer-card"
    >
      <CardContent className="flex items-center gap-3 p-4">
        {/* Timer info — clickable to open/edit */}
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer text-left"
          onClick={() => onEdit?.(timer)}
          aria-label={`Open ${timer.name}`}
        >
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-medium text-foreground">{timer.name}</h3>
            {isActive && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary"
                data-testid="active-badge"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {activeSession.status === 'paused' ? 'Paused' : 'Running'}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>{formatDuration(timer.totalPlannedDuration)}</span>
            <span>·</span>
            <span>
              {timer.steps.length} step{timer.steps.length !== 1 ? 's' : ''}
            </span>
            <span>·</span>
            <span>{lastUsed}</span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
              asChild
            >
              <Link
                href={`/app/sessions/${activeSession.id}`}
                aria-label={`Go to ${timer.name} session`}
              >
                ▶ Open
              </Link>
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full text-lg"
              onClick={() => onPlay?.(timer)}
              aria-label={`Play ${timer.name}`}
            >
              ▶
            </Button>
          )}

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
