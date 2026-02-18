# Story 9.3: Gentle Step Reminder

## Status: backlog

## Story

As a **user**,
I want a subtle reminder during long steps to keep me grounded,
So that I don't lose track of what I'm doing.

## Background

This story introduces **gentle step reminders** — a non-intrusive nudge during long Active steps to help users stay focused. ADHD brains can drift during extended tasks, so a midpoint reminder ("You're working on Shower") serves as a gentle anchor without being prescriptive about time.

Reminders trigger:
- At the **midpoint** of an Active step (if duration ≥ reminder threshold, default 5 minutes)
- Every **3 minutes during overrun** (if the step exceeds its planned duration)

Wait and Checkpoint steps are **excluded** (Wait steps are passive; Checkpoints are instantaneous).

Reminders are **opt-in** via settings (default ON) with configurable threshold (3, 5, 10, 15 minutes).

## Acceptance Criteria

### Midpoint Reminder

**Given** an Active step is running with planned duration ≥ reminder threshold (default 5 min = 300s)
**When** the step reaches its midpoint
**Then:**

1. **AC1:** A brief text overlay appears above the ring: "You're working on [Step Name]"
2. **AC2:** Overlay fades in (0.5s), holds (2s), fades out (0.5s) — total 3s
3. **AC3:** TTS speaks: "You're working on [Step Name]" (if TTS enabled in settings)
4. **AC4:** No time information in the reminder — just the step name
5. **AC5:** Overlay style: `--text` on semi-transparent `--surface` background, rounded pill (12px border-radius)
6. **AC6:** Overlay position: centered horizontally, 20% from top of viewport
7. **AC7:** Overlay z-index: above ring, below controls (z-index: 10)
8. **AC8:** Reminder does NOT interrupt playback (timer continues running)

### Overrun Reminder

**Given** an Active step has exceeded its planned duration (elapsed > planned)
**When** every 3 minutes of overrun (180s intervals)
**Then:**

9. **AC9:** The same reminder fires again: "You're working on [Step Name]"
10. **AC10:** Visual and voice reminder identical to midpoint reminder
11. **AC11:** Reminder repeats every 3 minutes (at +3:00, +6:00, +9:00, etc. from overrun start)
12. **AC12:** Reminder stops when step is completed, skipped, or paused

### Step Type Exclusions

**Given** a Wait or Checkpoint step is active
**When** the step is running
**Then:**

13. **AC13:** No reminder fires for Wait steps (Wait steps are passive waiting periods)
14. **AC14:** No reminder fires for Checkpoint steps (Checkpoints complete instantly)
15. **AC15:** Reminder logic only applies to Active steps (`step.type === 'active'` or `step.type === undefined`)

### Settings — Reminder Toggle

**Given** the settings sheet
**When** I view settings
**Then:**

16. **AC16:** "Step reminders" toggle exists in "Playback" section
17. **AC17:** Toggle is ON by default for new users
18. **AC18:** Help text below toggle: "Gentle nudges during long steps"
19. **AC19:** Setting persists in localStorage: `adhd-timer-reminder-enabled` (boolean)

**Given** I disable "Step reminders"
**When** I run a timer
**Then:**

20. **AC20:** No reminders fire at all (midpoint or overrun)
21. **AC21:** TTS remains silent (no reminder announcements)

### Settings — Reminder Threshold

**Given** "Step reminders" toggle is ON
**When** I view the threshold setting
**Then:**

22. **AC22:** Threshold stepper control appears below the toggle (only when enabled)
23. **AC23:** Options: 3 min, 5 min, 10 min, 15 min (single-select)
24. **AC24:** Default: 5 min
25. **AC25:** Label: "Minimum step duration for reminders"
26. **AC26:** Setting persists in localStorage: `adhd-timer-reminder-threshold` (number, in seconds: 180, 300, 600, 900)

**Given** threshold is set to 10 min
**When** I run a 7-minute Active step
**Then:**

27. **AC27:** No reminder fires (step duration < threshold)

**Given** threshold is set to 3 min
**When** I run a 10-minute Active step
**Then:**

28. **AC28:** Reminder fires at 5-minute mark (midpoint)

### Reduced Motion Support

**Given** `prefers-reduced-motion` is active in system settings
**When** a reminder triggers
**Then:**

29. **AC29:** Overlay appears/disappears instantly (no fade animation)
30. **AC30:** TTS still announces (voice is not motion)

### Pause and Resume Behavior

**Given** a reminder timer is active (counting toward midpoint or overrun interval)
**When** I pause the session
**Then:**

31. **AC31:** Reminder timer pauses (does NOT fire during pause)
32. **AC32:** On resume, reminder timer resumes from where it paused

**Given** a step completes or is skipped
**When** the next step begins
**Then:**

33. **AC33:** All previous step's reminder timers are cleared (no orphaned timers)
34. **AC34:** New step's reminder timer starts fresh

### Manual Advance (Pause-Between-Steps)

**Given** a timer has `pauseBetweenSteps: true`
**When** the session enters `waiting-for-advance` state
**Then:**

35. **AC35:** All reminder timers pause (no reminders during manual advance wait)
36. **AC36:** On "Start next step" tap, reminder timers resume for the new step

### Edge Cases

37. **AC37:** If a step has duration < threshold, no midpoint reminder fires (but overrun reminders can still fire if enabled)
38. **AC38:** If a step completes exactly at midpoint, reminder fires before completion
39. **AC39:** Overrun reminders do NOT fire if step duration was <threshold initially (only apply threshold to midpoint check)
40. **AC40:** Multiple reminders for the same step do NOT stack (only one visible at a time)

## Technical Notes

### New Hook
- `src/hooks/use-reminder.ts`
  - `useReminder(currentStep: SessionStep | null, elapsedTime: number, isRunning: boolean, settings: ReminderSettings)`
  - Manages `setTimeout` for midpoint reminder
  - Manages `setInterval` for overrun reminders (every 3 minutes)
  - Returns: `showReminder: boolean`, `reminderText: string`
  - Clears all timers on step change, pause, or unmount

### New Component
- `src/components/running/reminder-overlay.tsx`
  - Positioned absolutely above the ring
  - Fade in/hold/fade out animation
  - `prefers-reduced-motion` support (instant show/hide)

### Modifications
- `src/components/settings/settings-sheet.tsx`
  - Add "Step reminders" toggle in "Playback" section
  - Add threshold stepper (conditional: only show when toggle is ON)
- `src/components/running/running-timer.tsx`
  - Integrate `useReminder` hook
  - Render `ReminderOverlay` conditionally when `showReminder === true`
  - Pass `reminderText` to TTS (if enabled)

### Hook Implementation Outline

```typescript
// src/hooks/use-reminder.ts
import { useEffect, useState } from 'react';

interface ReminderSettings {
  enabled: boolean;
  thresholdSeconds: number; // 180, 300, 600, 900
}

export function useReminder(
  currentStep: SessionStep | null,
  elapsedTime: number,
  isRunning: boolean,
  settings: ReminderSettings
) {
  const [showReminder, setShowReminder] = useState(false);
  const [reminderText, setReminderText] = useState('');

  useEffect(() => {
    if (!settings.enabled || !currentStep || currentStep.type !== 'active') return;
    if (currentStep.plannedDuration < settings.thresholdSeconds) return;

    const midpoint = Math.floor(currentStep.plannedDuration / 2);

    // Midpoint reminder
    if (isRunning && elapsedTime === midpoint) {
      triggerReminder(`You're working on ${currentStep.name}`);
    }

    // Overrun reminders (every 3 minutes)
    if (isRunning && elapsedTime > currentStep.plannedDuration) {
      const overrun = elapsedTime - currentStep.plannedDuration;
      if (overrun % 180 === 0) { // Every 3 minutes
        triggerReminder(`You're working on ${currentStep.name}`);
      }
    }
  }, [elapsedTime, isRunning, currentStep, settings]);

  function triggerReminder(text: string) {
    setReminderText(text);
    setShowReminder(true);
    setTimeout(() => setShowReminder(false), 3000); // 3s total (fade in + hold + fade out)
  }

  return { showReminder, reminderText };
}
```

### localStorage Keys
- `adhd-timer-reminder-enabled` (boolean, default: `true`)
- `adhd-timer-reminder-threshold` (number, default: `300` = 5 minutes)

### Settings Hook Integration
```typescript
// src/hooks/use-settings.ts (extend existing)
export function useSettings() {
  // ...existing settings (TTS, streaks, etc.)

  const [reminderEnabled, setReminderEnabled] = useState(() => {
    const saved = localStorage.getItem('adhd-timer-reminder-enabled');
    return saved === null ? true : saved === 'true';
  });

  const [reminderThreshold, setReminderThreshold] = useState(() => {
    const saved = localStorage.getItem('adhd-timer-reminder-threshold');
    return saved ? parseInt(saved, 10) : 300;
  });

  return { reminderEnabled, setReminderEnabled, reminderThreshold, setReminderThreshold };
}
```

### CSS — Reminder Overlay

```css
.reminder-overlay {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  background: hsl(var(--surface) / 0.95);
  color: hsl(var(--text));
  font-size: 16px;
  font-weight: 500;
  z-index: 10;
  animation: reminder-fade 3s ease-out forwards;
}

@keyframes reminder-fade {
  0% { opacity: 0; }
  16.67% { opacity: 1; } /* 0.5s fade in */
  83.33% { opacity: 1; } /* hold 2s */
  100% { opacity: 0; } /* 0.5s fade out */
}

@media (prefers-reduced-motion: reduce) {
  .reminder-overlay {
    animation: none;
    opacity: 1;
  }
}
```

### Accessibility
- Overlay has `role="status"` (ARIA live region for non-critical updates)
- `aria-live="polite"` (doesn't interrupt screen reader)
- TTS announcement is redundant with visual overlay but reinforces for audio users

### TTS Integration
```typescript
// In running-timer.tsx
const { showReminder, reminderText } = useReminder(currentStep, elapsedTime, isRunning, settings);

useEffect(() => {
  if (showReminder && settings.ttsEnabled) {
    speak(reminderText);
  }
}, [showReminder, reminderText, settings.ttsEnabled]);
```

## Prerequisites

Story 6.1 (Schema Evolution) must be complete — requires `Step`, `StepType` types.

Story 7.2 (Manual Advance Playback) recommended for `waiting-for-advance` integration, but not required.

## Testing Checklist

- [ ] Midpoint reminder fires at 50% of planned duration
- [ ] Overrun reminders fire every 3 minutes after planned duration
- [ ] No reminders for Wait or Checkpoint steps
- [ ] Reminder toggle disables all reminders
- [ ] Threshold setting filters steps correctly (e.g., 7-min step with 10-min threshold → no reminder)
- [ ] Fade animation works correctly (0.5s in, 2s hold, 0.5s out)
- [ ] `prefers-reduced-motion` disables animation
- [ ] Pause stops reminder timers, resume restarts them
- [ ] Step change clears previous step's timers
- [ ] TTS announces reminder text (if enabled)
- [ ] Accessibility: ARIA live region, screen reader support

## Definition of Done

- [ ] All ACs pass
- [ ] `use-reminder.ts` hook implemented with full timer logic
- [ ] `reminder-overlay.tsx` component created with animations
- [ ] Settings sheet updated with toggle + threshold stepper
- [ ] Integration with `running-timer.tsx` complete
- [ ] Unit tests for `use-reminder` hook (midpoint, overrun, edge cases)
- [ ] Integration test: run timer → verify midpoint reminder → extend past planned → verify overrun reminder
- [ ] Accessibility audit passed
- [ ] Code review approved
- [ ] Merged to main branch
