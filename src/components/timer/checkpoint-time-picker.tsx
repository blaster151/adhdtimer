'use client';

import { useState } from 'react';
import { parseTargetTime, formatClockTime } from '@/lib/utils/checkpoint';
import { Input } from '@/components/ui/input';

interface CheckpointTimePickerProps {
  value: string | undefined;
  onChange: (targetTime: string) => void;
  stepIndex: number;
}

/**
 * Normalize raw input to HH:MM format.
 * Accepts "730", "7:30", "07:30" → "07:30"
 */
function normalizeTimeInput(raw: string): string | null {
  const parsed = parseTargetTime(raw);
  if (!parsed) return null;
  const hh = String(parsed.hours).padStart(2, '0');
  const mm = String(parsed.minutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function CheckpointTimePicker({ value, onChange, stepIndex }: CheckpointTimePickerProps) {
  const [editValue, setEditValue] = useState(value ?? '');
  const [hasError, setHasError] = useState(false);

  function handleBlur() {
    if (!editValue.trim()) {
      setHasError(false);
      return;
    }
    const normalized = normalizeTimeInput(editValue);
    if (normalized) {
      onChange(normalized);
      setEditValue(normalized);
      setHasError(false);
    } else {
      setHasError(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  }

  // Show formatted display text when value is valid
  const displayHint = value ? formatClockTime(value) : '';

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="HH:MM"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            setHasError(false);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-20 text-center ${hasError ? 'border-warning' : ''}`}
          aria-label={`Step ${stepIndex + 1} checkpoint time`}
        />
        <span className="text-xs text-muted-foreground">time</span>
      </div>
      {hasError && (
        <span className="text-[10px] text-warning">Invalid time</span>
      )}
      {displayHint && !hasError && (
        <span className="text-[10px] text-muted-foreground">{displayHint}</span>
      )}
    </div>
  );
}
