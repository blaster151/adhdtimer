'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export interface AIBreakdownStep {
  name: string;
  durationMinutes: number;
}

interface AIBreakdownPanelProps {
  onStepsGenerated: (timerName: string, steps: AIBreakdownStep[]) => void;
}

export function AIBreakdownPanel({ onStepsGenerated }: AIBreakdownPanelProps) {
  const [taskName, setTaskName] = useState('');
  const [lastTaskName, setLastTaskName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputTouched, setInputTouched] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const showInputError = inputTouched && taskName.trim() === '';

  async function callAPI(task: string) {
    setLoading(true);
    setError(null);
    setRateLimited(false);

    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError('Please sign in to use AI breakdown.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskName: task }),
      });

      const body = await res.json();

      if (!res.ok) {
        if (res.status === 429) setRateLimited(true);
        setError(body.error ?? "Couldn't generate steps — try again or create manually.");
        setLoading(false);
        return;
      }

      onStepsGenerated(body.timerName, body.steps);
      setLastTaskName(task);
      setHasGenerated(true);
      setTaskName('');
    } catch {
      setError("Couldn't generate steps — try again or create manually.");
    } finally {
      setLoading(false);
    }
  }

  function handleBreakdown() {
    if (taskName.trim() === '') {
      setInputTouched(true);
      inputRef.current?.focus();
      return;
    }
    callAPI(taskName.trim());
  }

  function handleRegenerate() {
    if (lastTaskName) {
      callAPI(lastTaskName);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">AI Task Breakdown</p>
        <p className="text-xs text-muted-foreground">
          Describe what you need to do and let AI create the steps for you.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Describe your task..."
          value={taskName}
          onChange={(e) => {
            setTaskName(e.target.value);
            if (e.target.value.trim() !== '') setInputTouched(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleBreakdown();
            }
          }}
          disabled={loading}
          aria-label="Task description"
          aria-invalid={showInputError}
          className={showInputError ? 'border-warning' : ''}
        />
        <Button
          type="button"
          onClick={handleBreakdown}
          disabled={loading}
          className="shrink-0 whitespace-nowrap"
        >
          {loading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Breaking it down…
            </>
          ) : (
            'Break it down ✨'
          )}
        </Button>
      </div>

      {hasGenerated && !loading && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={loading || rateLimited}
          >
            Regenerate
          </Button>
          {rateLimited && (
            <span className="text-xs text-muted-foreground">20/20 used today</span>
          )}
        </div>
      )}

      {showInputError && (
        <p className="text-xs text-warning">Please describe a task first.</p>
      )}

      {error && (
        <p className="text-sm text-warning" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <div className="space-y-2" aria-label="Loading AI breakdown">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
