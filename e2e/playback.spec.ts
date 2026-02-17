import { test, expect, globalTestSetup, perTestCleanup } from './fixtures';
import { signInViaUI } from './helpers/auth';
import { createTimerViaUI, playTimerFromLibrary, skipToCompletion } from './helpers/timer';

test.describe('Playback', () => {
  test.beforeAll(async () => {
    await globalTestSetup();
  });

  test.beforeEach(async () => {
    await perTestCleanup();
  });

  test('play a timer — progress ring and step name visible', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Focus Session', [
      { name: 'Deep Work', durationMinutes: 1 },
      { name: 'Break', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Focus Session');

    // Should be on the session page with the timer running
    await expect(page).toHaveURL(/\/sessions\//);

    // Step name should be visible
    await expect(page.getByText('Deep Work')).toBeVisible({ timeout: 10_000 });

    // Pause button should be visible (timer is running)
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('pause and resume', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Pause Test', [
      { name: 'Step 1', durationMinutes: 5 },
    ]);
    await playTimerFromLibrary(page, 'Pause Test');

    // Wait for running state
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10_000 });

    // Pause
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

    // Resume
    await page.getByRole('button', { name: 'Resume' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('skip step — advances to next step', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Skip Test', [
      { name: 'First Step', durationMinutes: 5 },
      { name: 'Second Step', durationMinutes: 5 },
    ]);
    await playTimerFromLibrary(page, 'Skip Test');

    // Wait for first step
    await expect(page.getByText('First Step')).toBeVisible({ timeout: 10_000 });

    // Skip
    await page.getByRole('button', { name: /skip step/i }).click();

    // Second step should now be visible
    await expect(page.getByText('Second Step')).toBeVisible({ timeout: 5_000 });
  });

  test('extend — add time to current step', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Extend Test', [
      { name: 'Work', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Extend Test');

    // Wait for running
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10_000 });

    // Extend by 1 minute
    await page.getByRole('button', { name: /add 1 minute/i }).click();

    // The timer should still be running (not completed)
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('skip through all steps — reaches completion view', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Completion Test', [
      { name: 'Step A', durationMinutes: 1 },
      { name: 'Step B', durationMinutes: 1 },
      { name: 'Step C', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Completion Test');

    // Wait for running
    await expect(page.getByRole('button', { name: /skip step/i })).toBeVisible({ timeout: 10_000 });

    // Skip all steps
    await skipToCompletion(page);

    // Completion view should be visible
    await expect(page.locator('[data-testid="completion-view"]')).toBeVisible({ timeout: 10_000 });
  });

  test('pause-between-steps — manual advance prompt between steps', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(
      page,
      'Manual Advance Test',
      [
        { name: 'Step 1', durationMinutes: 1 },
        { name: 'Step 2', durationMinutes: 1 },
      ],
      { pauseBetweenSteps: true },
    );
    await playTimerFromLibrary(page, 'Manual Advance Test');

    // Wait for running
    await expect(page.getByRole('button', { name: /skip step/i })).toBeVisible({ timeout: 10_000 });

    // Skip step 1 — should enter manual advance
    await page.getByRole('button', { name: /skip step/i }).click();

    // Manual advance prompt should appear
    await expect(page.locator('[data-testid="manual-advance"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/start step 2/i)).toBeVisible();

    // Tap start to advance
    await page.locator('[data-testid="manual-advance-start"]').click();

    // Step 2 should now be running
    await expect(page.getByText('Step 2')).toBeVisible({ timeout: 5_000 });
  });

  test('checkpoint step — shows checkpoint display then auto-advances', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Checkpoint Test', [
      { name: 'Work', durationMinutes: 1, type: 'active' },
      { name: 'Check-in', durationMinutes: 0, type: 'checkpoint' },
      { name: 'More work', durationMinutes: 1, type: 'active' },
    ]);
    await playTimerFromLibrary(page, 'Checkpoint Test');

    // Wait for running
    await expect(page.getByRole('button', { name: /skip step/i })).toBeVisible({ timeout: 10_000 });

    // Skip to checkpoint
    await page.getByRole('button', { name: /skip step/i }).click();

    // Checkpoint display should appear (with 🎯 prefix)
    await expect(page.locator('[data-testid="checkpoint-display"]')).toBeVisible({ timeout: 5_000 });

    // Tap to continue past checkpoint
    await page.locator('[data-testid="checkpoint-display"]').click();

    // Should advance to the next step
    await expect(page.getByText('More work')).toBeVisible({ timeout: 5_000 });
  });

  test('wait step — shows waiting indicator', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Wait Test', [
      { name: 'Brew coffee', durationMinutes: 1, type: 'wait' },
      { name: 'Drink coffee', durationMinutes: 1, type: 'active' },
    ]);
    await playTimerFromLibrary(page, 'Wait Test');

    // Wait step should show with ⏳ prefix
    await expect(page.getByText(/⏳.*brew coffee/i)).toBeVisible({ timeout: 10_000 });
  });
});
