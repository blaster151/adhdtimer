'use client';

import { useParams } from 'next/navigation';
import { RunningTimer } from '@/components/session/running-timer';

export default function SessionPage() {
  const params = useParams<{ sessionId: string }>();

  return (
    <div className="py-4">
      <RunningTimer sessionId={params.sessionId} />
    </div>
  );
}
