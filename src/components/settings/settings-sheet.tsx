'use client';

import { useSettings } from '@/hooks/use-settings';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SettingsSheetProps {
  children: React.ReactNode; // trigger element
}

export function SettingsSheet({ children }: SettingsSheetProps) {
  const { showStreaks, setShowStreaks } = useSettings();

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>Customize your timer experience.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Library section */}
          <section>
            <h3 className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase mb-4">
              Library
            </h3>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-streaks" className="text-sm font-medium">
                  Show streaks
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display streak badges for scheduled routines
                </p>
              </div>
              <Switch
                id="show-streaks"
                checked={showStreaks}
                onCheckedChange={setShowStreaks}
                aria-label="Show streaks"
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
