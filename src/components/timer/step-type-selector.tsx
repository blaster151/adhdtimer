'use client';

import type { StepType } from '@/types/timer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface StepTypeSelectorProps {
  value: StepType | undefined;
  onChange: (type: StepType) => void;
  stepName: string;
}

const STEP_TYPE_OPTIONS: { value: StepType; icon: string; label: string }[] = [
  { value: 'active', icon: '▶', label: 'Active' },
  { value: 'wait', icon: '⏳', label: 'Wait' },
  { value: 'checkpoint', icon: '🎯', label: 'Check' },
];

function getIcon(type: StepType | undefined): string {
  const option = STEP_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.icon ?? '▶';
}

export function StepTypeSelector({ value, onChange, stepName }: StepTypeSelectorProps) {
  const effectiveType = value ?? 'active';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 shrink-0 p-0 text-base"
          aria-label={`Step type for ${stepName || 'unnamed step'}`}
        >
          {getIcon(effectiveType)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {STEP_TYPE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={effectiveType === option.value ? 'bg-accent' : ''}
          >
            <span className="mr-2">{option.icon}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
