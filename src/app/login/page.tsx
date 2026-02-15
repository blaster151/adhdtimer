'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/app');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    );
  }

  if (user) {
    // Will redirect via useEffect
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to access your timers</p>
      </div>

      <SignInForm />

      <footer className="mt-12 text-xs text-muted-foreground">
        Built with 🌲 for ADHD brains
      </footer>
    </div>
  );
}
