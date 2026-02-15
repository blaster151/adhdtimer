'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { createTimer, updateTimer } from '@/lib/firebase/timers';
import { formatDuration } from '@/lib/utils/time';
import type { Step, TimerTemplate } from '@/types/timer';
import { StepListEditor } from '@/components/timer/step-list-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimerFormProps {
  initialTimer?: TimerTemplate;
}

export function TimerForm({ initialTimer }: TimerFormProps) {
  const isEditMode = !!initialTimer;
  const [name, setName] = useState(initialTimer?.name ?? '');
  const [description, setDescription] = useState(initialTimer?.description ?? '');
  const [steps, setSteps] = useState<Step[]>(
    initialTimer?.steps ?? [
      { id: crypto.randomUUID(), name: '', plannedDuration: 300 },
    ],
  );
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const totalDuration = steps.reduce((sum, s) => sum + s.plannedDuration, 0);

  function validate(): string | null {
    if (!name.trim()) return 'Timer name is required.';
    if (steps.length === 0) return 'Add at least one step.';
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].name.trim()) return `Step ${i + 1} needs a name.`;
      if (steps[i].plannedDuration <= 0) return `Step ${i + 1} needs a duration greater than 0.`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!user) {
      toast.error('You must be signed in.');
      return;
    }

    setIsSaving(true);

    const timerData = {
      name: name.trim(),
      description: description.trim() || undefined,
      totalPlannedDuration: totalDuration,
      countdownMode: initialTimer?.countdownMode ?? false,
      steps: steps.map((s) => ({
        ...s,
        name: s.name.trim(),
      })),
    };

    const { error } = isEditMode
      ? await updateTimer(user.uid, initialTimer.id, timerData)
      : await createTimer(user.uid, timerData);

    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(isEditMode ? 'Timer updated!' : 'Timer created!');
    router.push('/app');
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      {/* Timer Name */}
      <div className="space-y-2">
        <Label htmlFor="timer-name">Timer Name</Label>
        <Input
          id="timer-name"
          placeholder="e.g., Morning Routine"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSaving}
        />
      </div>

      {/* Description (optional) */}
      <div className="space-y-2">
        <Label htmlFor="timer-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="timer-description"
          placeholder="A brief description of this timer"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSaving}
        />
      </div>

      {/* Steps */}
      <StepListEditor steps={steps} onChange={setSteps} />

      {/* Total Duration */}
      <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3">
        <span className="text-sm text-muted-foreground">Total Duration</span>
        <span className="text-lg font-semibold text-primary" data-testid="total-duration">
          {formatDuration(totalDuration)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isSaving}>
          {isSaving ? 'Saving…' : isEditMode ? 'Update Timer' : 'Save Timer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/app')}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
