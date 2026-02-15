'use client';

import type { Step } from '@/types/timer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StepListEditorProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

export function StepListEditor({ steps, onChange }: StepListEditorProps) {
  function addStep() {
    const newStep: Step = {
      id: crypto.randomUUID(),
      name: '',
      plannedDuration: 300, // 5 minutes default (in seconds)
    };
    onChange([...steps, newStep]);
  }

  function removeStep(id: string) {
    onChange(steps.filter((s) => s.id !== id));
  }

  function updateStep(id: string, field: keyof Step, value: string | number) {
    onChange(
      steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  }

  function handleDurationChange(id: string, minutesStr: string) {
    const minutes = parseFloat(minutesStr) || 0;
    updateStep(id, 'plannedDuration', Math.round(minutes * 60));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Steps</Label>
        <Button type="button" variant="ghost" size="sm" onClick={addStep}>
          + Add Step
        </Button>
      </div>

      {steps.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No steps yet. Add at least one step to save.
        </p>
      )}

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex items-center gap-2 rounded-md border border-border bg-surface p-2"
          >
            <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
              {index + 1}
            </span>

            <Input
              placeholder="Step name"
              value={step.name}
              onChange={(e) => updateStep(step.id, 'name', e.target.value)}
              className="flex-1"
              aria-label={`Step ${index + 1} name`}
              required
            />

            <div className="flex shrink-0 items-center gap-1">
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={step.plannedDuration / 60}
                onChange={(e) => handleDurationChange(step.id, e.target.value)}
                className="w-20 text-center"
                aria-label={`Step ${index + 1} duration`}
                required
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => removeStep(step.id)}
              aria-label={`Remove step ${index + 1}`}
              className="shrink-0 text-muted-foreground hover:text-warning"
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
