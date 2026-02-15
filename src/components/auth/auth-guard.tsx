'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded" />
        <Skeleton className="h-4 w-56 rounded" />
      </div>
    );
  }

  if (!user) {
    // Will redirect via useEffect — render nothing to prevent flash
    return null;
  }

  return <>{children}</>;
}
