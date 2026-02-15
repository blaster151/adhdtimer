'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Step } from '@/types/timer';
import { SortableStepRow } from '@/components/timer/sortable-step-row';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface StepListEditorProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
}

export function StepListEditor({ steps, onChange }: StepListEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleMove = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const oldIndex = steps.findIndex((s) => s.id === id);
      if (oldIndex === -1) return;
      const newIndex = direction === 'up' ? oldIndex - 1 : oldIndex + 1;
      if (newIndex < 0 || newIndex >= steps.length) return;
      onChange(arrayMove(steps, oldIndex, newIndex));
    },
    [steps, onChange],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(steps, oldIndex, newIndex));
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {steps.map((step, index) => (
              <SortableStepRow
                key={step.id}
                step={step}
                index={index}
                onUpdate={updateStep}
                onRemove={removeStep}
                totalSteps={steps.length}
                onMove={handleMove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
