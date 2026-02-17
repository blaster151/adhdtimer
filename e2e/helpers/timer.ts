import type { Page } from '@playwright/test';

export interface TestStep {
  name: string;
  /** Duration in minutes, e.g. 5 for "5:00". Used to calculate seconds. */
  durationMinutes: number;
  /** Step type — defaults to 'active' if not specified */
  type?: 'active' | 'wait' | 'checkpoint';
}

/**
 * Create a timer via the UI.
 * Assumes the user is already signed in and on /app.
 *
 * @returns void — after saving, the page navigates back to /app
 */
export async function createTimerViaUI(
  page: Page,
  timerName: string,
  steps: TestStep[],
  options?: {
    pauseBetweenSteps?: boolean;
    countdownMode?: boolean;
  },
): Promise<void> {
  // Navigate to create form
  // Try the library "New Timer" button first, fall back to empty state "Create Timer"
  const newTimerLink = page.getByRole('link', { name: /new timer|create timer/i });
  await newTimerLink.click();
  await page.waitForURL('**/timers/new');

  // Fill timer name
  await page.getByLabel('Timer Name').fill(timerName);

  // The form starts with one empty step. Fill it, then add more.
  for (let i = 0; i < steps.length; i++) {
    if (i > 0) {
      // Add a new step
      await page.getByRole('button', { name: /add step/i }).click();
    }

    const stepRow = page.locator('[data-testid="step-editor"]').nth(i);

    // Fill step name — aria-label is "Step N name"
    await stepRow.getByLabel(`Step ${i + 1} name`).fill(steps[i].name);

    // Duration: click the duration display to enter edit mode, then type value
    // For checkpoint type, duration is handled differently (no duration input)
    if (steps[i].type !== 'checkpoint') {
      const durationButton = stepRow.getByLabel(`Step ${i + 1} duration`);
      await durationButton.click();
      // Now the input appears
      const durationInput = stepRow.getByLabel(`Step ${i + 1} duration input`);
      await durationInput.fill(String(steps[i].durationMinutes));
      await durationInput.press('Enter');
    }

    // Set step type if not active (default)
    if (steps[i].type && steps[i].type !== 'active') {
      // StepTypeSelector is a DropdownMenu — trigger button has aria-label "Step type for {name}"
      const typeButton = stepRow.getByRole('button', { name: /step type for/i });
      await typeButton.click();
      // Menu items are labeled "Active", "Wait", "Check"
      const menuLabel = steps[i].type === 'wait' ? 'Wait' : 'Check';
      await page.getByRole('menuitem', { name: menuLabel }).click();
    }
  }

  // Toggle options
  if (options?.pauseBetweenSteps) {
    await page.getByLabel('Pause between steps').click();
  }
  if (options?.countdownMode) {
    await page.getByLabel('Countdown mode').click();
  }

  // Save
  await page.getByRole('button', { name: /save timer/i }).click();

  // Wait for redirect back to library
  await page.waitForURL('**/app', { timeout: 10_000 });
}

/**
 * Start playing a timer from the library by clicking its play button.
 * Assumes we're on /app with the timer visible.
 */
export async function playTimerFromLibrary(page: Page, timerName: string): Promise<void> {
  const timerCard = page.locator('[data-testid="timer-card"]').filter({ hasText: timerName });
  await timerCard.getByRole('button', { name: new RegExp(`Play ${timerName}`, 'i') }).click();
  await page.waitForURL('**/sessions/**', { timeout: 10_000 });
}

/**
 * Skip through all remaining steps to quickly reach the completion view.
 */
export async function skipToCompletion(page: Page, maxSteps = 20): Promise<void> {
  for (let i = 0; i < maxSteps; i++) {
    const skipButton = page.getByRole('button', { name: /skip step/i });
    if (!(await skipButton.isVisible({ timeout: 2_000 }).catch(() => false))) {
      // No skip button visible — might be in manual advance, deferred resolution, or completed
      const manualSkip = page.locator('[data-testid="manual-advance-skip"]');
      if (await manualSkip.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await manualSkip.click();
        continue;
      }
      // Check if completed
      const completionView = page.locator('[data-testid="completion-view"]');
      if (await completionView.isVisible({ timeout: 1_000 }).catch(() => false)) {
        return; // We're done
      }
      break;
    }
    await skipButton.click();
    // Brief wait for state update
    await page.waitForTimeout(300);
  }
}
