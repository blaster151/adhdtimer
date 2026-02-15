'use client';

import { useAuth } from '@/hooks/use-auth';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function AppHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error(error);
      return;
    }
    router.replace('/');
  }

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <h1 className="text-lg font-semibold text-foreground">🌲 ADHD Timer</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {user?.displayName || user?.email}
        </span>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}
