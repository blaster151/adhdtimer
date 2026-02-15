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

        if (step.status === 'completed') {
          dotClass = 'h-2.5 w-2.5 rounded-full bg-primary';
          label = `Step ${i + 1}: ${step.name} (completed)`;
        } else if (step.status === 'skipped') {
          dotClass = 'h-2.5 w-2.5 rounded-full bg-muted-foreground opacity-50';
          label = `Step ${i + 1}: ${step.name} (skipped)`;
        } else if (i === currentIndex) {
          dotClass =
            'h-3 w-3 rounded-full border-2 border-primary bg-transparent';
          label = `Step ${i + 1}: ${step.name} (current)`;
        } else {
          dotClass = 'h-2.5 w-2.5 rounded-full bg-muted-foreground/30';
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
