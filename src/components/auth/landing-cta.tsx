'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function LandingCTA() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mt-10 flex gap-4">
        <Button size="lg" disabled>
          Loading…
        </Button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="mt-10 flex gap-4">
        <Button size="lg" asChild>
          <Link href="/app">Go to Timers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 flex gap-4">
      <Button size="lg" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="/login">Create Account</Link>
      </Button>
    </div>
  );
}
