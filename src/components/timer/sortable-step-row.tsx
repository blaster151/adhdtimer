'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Step } from '@/types/timer';
import { parseDuration, formatDuration } from '@/lib/utils/time';
import { useSwipeAdjust } from '@/hooks/use-swipe-adjust';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SortableStepRowProps {
  step: Step;
  index: number;
  onUpdate: (id: string, field: keyof Step, value: string | number) => void;
  onRemove: (id: string) => void;
  /** Total number of steps (for move bounds) */
  totalSteps: number;
  /** Move step up/down by keyboard */
  onMove: (id: string, direction: 'up' | 'down') => void;
}

export function SortableStepRow({
  step,
  index,
  onUpdate,
  onRemove,
  totalSteps,
  onMove,
}: SortableStepRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const swipe = useSwipeAdjust({
    value: step.plannedDuration,
    onChange: (seconds) => onUpdate(step.id, 'plannedDuration', seconds),
  });

  function handleDurationTap() {
    if (swipe.isSwiping) return;
    setEditValue(String(step.plannedDuration / 60));
    setIsEditing(true);
    // Focus will happen on next render via autoFocus
  }

  function commitEdit() {
    const parsed = parseDuration(editValue);
    if (parsed !== null) {
      onUpdate(step.id, 'plannedDuration', parsed);
    }
    setIsEditing(false);
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }

  function handleDragHandleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      onMove(step.id, 'up');
    } else if (e.key === 'ArrowDown' && index < totalSteps - 1) {
      e.preventDefault();
      onMove(step.id, 'down');
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border border-border bg-surface p-2 ${
        isDragging ? 'z-10 scale-[1.02] opacity-90 shadow-lg' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="flex shrink-0 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Reorder step ${index + 1}`}
        onKeyDown={handleDragHandleKeyDown}
        {...attributes}
        {...listeners}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Step number */}
      <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
        {index + 1}
      </span>

      {/* Step name */}
      <Input
        placeholder="Step name"
        value={step.name}
        onChange={(e) => onUpdate(step.id, 'name', e.target.value)}
        className="flex-1"
        aria-label={`Step ${index + 1} name`}
        required
      />

      {/* Duration — swipeable or editable */}
      <div className="flex shrink-0 items-center gap-1">
        {isEditing ? (
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKeyDown}
            className="w-20 text-center"
            aria-label={`Step ${index + 1} duration input`}
            autoFocus
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            className="flex h-9 w-20 cursor-grab select-none items-center justify-center rounded-md border border-input bg-background text-sm active:cursor-grabbing"
            aria-label={`Step ${index + 1} duration`}
            onClick={handleDurationTap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDurationTap();
              }
            }}
            onPointerDown={swipe.onPointerDown}
            onPointerMove={swipe.onPointerMove}
            onPointerUp={swipe.onPointerUp}
            onPointerCancel={swipe.onPointerCancel}
            style={{ touchAction: 'none' }}
          >
            {formatDuration(step.plannedDuration)}
          </div>
        )}
        <span className="text-xs text-muted-foreground">min</span>
      </div>

      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(step.id)}
        aria-label={`Remove step ${index + 1}`}
        className="shrink-0 text-muted-foreground hover:text-warning"
      >
        ✕
      </Button>
    </div>
  );
}
