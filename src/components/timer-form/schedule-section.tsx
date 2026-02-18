'use client';

import { useState, useEffect } from 'react';
import type { Schedule, DayOfWeek, TimeOfDay } from '@/types/timer';
import { DayPicker } from './day-picker';
import { TimeOfDayControl } from './time-of-day-control';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ScheduleSectionProps {
  schedule: Schedule | undefined;
  onScheduleChange: (schedule: Schedule | undefined) => void;
  streakEnabled: boolean;
  onStreakEnabledChange: (enabled: boolean) => void;
}

const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_ABBR: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const WEEKDAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const WEEKENDS: DayOfWeek[] = ['sat', 'sun'];

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function appendTime(summary: string, timeOfDay: TimeOfDay): string {
  return timeOfDay !== 'anytime'
    ? `${summary}, ${capitalize(timeOfDay)}`
    : summary;
}

function formatSummary(schedule: Schedule): string {
  if (!schedule.days || schedule.days.length === 0) return 'No schedule';

  const sorted = [...schedule.days].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );

  // Special cases
  if (sorted.length === 7) return appendTime('Every day', schedule.timeOfDay);

  if (
    sorted.length === 5 &&
    WEEKDAYS.every((d) => sorted.includes(d))
  ) {
    return appendTime('Weekdays', schedule.timeOfDay);
  }

  if (
    sorted.length === 2 &&
    WEEKENDS.every((d) => sorted.includes(d))
  ) {
    return appendTime('Weekends', schedule.timeOfDay);
  }

  // Build consecutive ranges from sorted index list
  const indices = sorted.map((d) => DAY_ORDER.indexOf(d));
  const ranges: [number, number][] = [];

  let start = indices[0];
  let end = indices[0];

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === end + 1) {
      end = indices[i];
    } else {
      ranges.push([start, end]);
      start = indices[i];
      end = indices[i];
    }
  }
  ranges.push([start, end]);

  const parts = ranges.map(([s, e]) =>
    s === e
      ? DAY_ABBR[DAY_ORDER[s]]
      : `${DAY_ABBR[DAY_ORDER[s]]}–${DAY_ABBR[DAY_ORDER[e]]}`
  );

  return appendTime(parts.join(', '), schedule.timeOfDay);
}

export function ScheduleSection({
  schedule,
  onScheduleChange,
  streakEnabled,
  onStreakEnabledChange,
}: ScheduleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(schedule?.days ?? []);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(schedule?.timeOfDay ?? 'anytime');

  // Auto-expand if schedule has data on mount
  useEffect(() => {
    if (schedule?.days && schedule.days.length > 0) {
      setIsExpanded(true);
    }
  }, []); // Only run on mount

  const handleDaysChange = (days: DayOfWeek[]) => {
    setSelectedDays(days);
    if (days.length > 0) {
      onScheduleChange({
        enabled: true,
        days,
        timeOfDay,
      });
    } else {
      onScheduleChange(undefined);
    }
  };

  const handleTimeChange = (newTime: TimeOfDay) => {
    setTimeOfDay(newTime);
    if (selectedDays.length > 0) {
      onScheduleChange({
        enabled: true,
        days: selectedDays,
        timeOfDay: newTime,
      });
    }
  };

  const summary = schedule ? formatSummary(schedule) : null;

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface px-4 py-3">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isExpanded ? '▾' : '▸'}
          </span>
          <Label className="cursor-pointer">
            Schedule <span className="text-muted-foreground">(optional)</span>
          </Label>
        </div>
        {!isExpanded && summary && (
          <span className="text-sm text-muted-foreground">{summary}</span>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Day Picker */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Days of the week</Label>
            <DayPicker selectedDays={selectedDays} onChange={handleDaysChange} />
          </div>

          {/* Time of Day Control */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Time of day</Label>
            <TimeOfDayControl value={timeOfDay} onChange={handleTimeChange} />
          </div>

          {/* Track Streak Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label htmlFor="track-streak">Track streak</Label>
              <p className="text-xs text-muted-foreground">
                Count consecutive completions on scheduled days
              </p>
            </div>
            <Switch
              id="track-streak"
              checked={streakEnabled}
              onCheckedChange={onStreakEnabledChange}
              aria-label="Track streak"
            />
          </div>

          {/* Inline nudge if streak enabled but no days selected */}
          {streakEnabled && selectedDays.length === 0 && (
            <p className="text-xs text-warning">
              Select days to track streak
            </p>
          )}
        </div>
      )}
    </div>
  );
}
