'use client';

import { useAuth } from '@/hooks/use-auth';
import { AuthGuard } from '@/components/auth/auth-guard';
import { SettingsSheet } from '@/components/settings/settings-sheet';
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
        <SettingsSheet>
          <Button variant="ghost" size="sm" aria-label="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </Button>
        </SettingsSheet>
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
