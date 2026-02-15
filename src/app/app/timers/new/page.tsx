'use client';

import { TimerForm } from '@/components/timer/timer-form';

export default function NewTimerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-semibold text-foreground">Create Timer</h2>
      <TimerForm />
    </div>
  );
}
