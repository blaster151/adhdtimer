import { LandingCTA } from '@/components/auth/landing-cta';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Zen Ring placeholder */}
      <div className="mb-8 flex h-48 w-48 items-center justify-center rounded-full border-4 border-primary/30 shadow-[0_0_40px_var(--ring-glow)]">
        <span className="text-4xl font-bold text-primary">25:00</span>
      </div>

      <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">ADHD Timer</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Calm focus for neurodivergent minds. Gentle nudges, smart planning, and a soothing Deep
        Forest experience.
      </p>

      <LandingCTA />

      <footer className="mt-16 text-xs text-muted-foreground">
        Built with 🌲 for ADHD brains
      </footer>
    </div>
  );
}
