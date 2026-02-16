'use client';

import type { SessionStep } from '@/types/session';

interface StepDotsProps {
  steps: SessionStep[];
  currentIndex: number;
}

export function StepDots({ steps, currentIndex }: StepDotsProps) {
  return (
    <div
      role="list"
      aria-label={`Timer progress: step ${currentIndex + 1} of ${steps.length}`}
      className="flex items-center justify-center gap-2"
      data-testid="step-dots"
    >
      {steps.map((step, i) => {
        let dotClass: string;
        let label: string;
        const isCheckpoint = step.type === 'checkpoint';

        if (step.status === 'completed') {
          const isWaitStep = step.type === 'wait';
          const colorClass = isCheckpoint ? 'bg-[var(--checkpoint)]' : isWaitStep ? 'bg-[var(--wait)]' : 'bg-primary';
          dotClass = `h-2.5 w-2.5 ${isCheckpoint ? 'rotate-45 rounded-[1px]' : 'rounded-full'} ${colorClass}`;
          label = `Step ${i + 1}: ${step.name} (completed)`;
        } else if (step.status === 'skipped') {
          dotClass = `h-2.5 w-2.5 ${isCheckpoint ? 'rotate-45 rounded-[1px]' : 'rounded-full'} bg-muted-foreground opacity-50`;
          label = `Step ${i + 1}: ${step.name} (skipped)`;
        } else if (i === currentIndex) {
          const isWaitStep = step.type === 'wait';
          const borderClass = isCheckpoint ? 'border-[var(--checkpoint)]' : isWaitStep ? 'border-[var(--wait)]' : 'border-primary';
          dotClass = `h-3 w-3 ${isCheckpoint ? 'rotate-45 rounded-[1px]' : 'rounded-full'} border-2 ${borderClass} bg-transparent`;
          label = `Step ${i + 1}: ${step.name} (current)`;
        } else {
          dotClass = `h-2.5 w-2.5 ${isCheckpoint ? 'rotate-45 rounded-[1px]' : 'rounded-full'} bg-muted-foreground/30`;
          label = `Step ${i + 1}: ${step.name} (upcoming)`;
        }

        return (
          <div
            key={step.id}
            role="listitem"
            aria-label={label}
            className={dotClass}
            data-testid={`step-dot-${i}`}
          />
        );
      })}
    </div>
  );
}
