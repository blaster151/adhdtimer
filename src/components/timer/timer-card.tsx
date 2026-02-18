'use client';

import Link from 'next/link';
import type { TimerTemplate, TimeOfDay } from '@/types/timer';
import type { RunSession } from '@/types/session';
import { formatDuration, formatRelativeDate } from '@/lib/utils/time';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimeOfDayIcon } from '@/components/timer/time-of-day-icon';
import { StreakBadge } from '@/components/timer/streak-badge';
import { CompletionBadge } from '@/components/timer/completion-badge';
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
  /** Timer was completed today — shows ✓ Done badge and dims card */
  completedToday?: boolean;
  /** Active streak count — shows streak badge when > 0 and showStreak is true */
  streakCount?: number;
  /** Time-of-day from schedule — shows icon in top-right */
  timeOfDay?: TimeOfDay;
  /** Whether to show streak badges (user setting) */
  showStreak?: boolean;
}

export function TimerCard({ timer, activeSession, onPlay, onEdit, onDelete, onDuplicate, completedToday, streakCount, timeOfDay, showStreak }: TimerCardProps) {
  const lastUsed = timer.lastUsedAt ? formatRelativeDate(timer.lastUsedAt.toDate()) : 'Never';
  const isActive = !!activeSession;

  return (
    <Card
      className={`relative border-border bg-surface transition-colors hover:bg-elevated ${
        isActive ? 'ring-1 ring-primary/40' : ''
      } ${completedToday ? 'opacity-80' : ''}`}
      data-testid="timer-card"
    >
      <CardContent className="flex items-center gap-3 p-4">
        {/* Completion badge — top-left */}
        {completedToday && (
          <div className="absolute top-2 left-3">
            <CompletionBadge />
          </div>
        )}
        {/* Time-of-day icon — top-right */}
        {timeOfDay && (
          <div className="absolute top-2 right-3">
            <TimeOfDayIcon timeOfDay={timeOfDay} />
          </div>
        )}
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
          {completedToday ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-on-track/15 text-lg text-on-track" aria-label={`${timer.name} completed`}>
              ✓
            </span>
          ) : isActive ? (
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

        {/* Streak badge — bottom-right */}
        {showStreak && streakCount && streakCount > 0 && (
          <div className="absolute right-3 bottom-2">
            <StreakBadge count={streakCount} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
