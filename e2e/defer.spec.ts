import { test, expect, globalTestSetup, perTestCleanup } from './fixtures';
import { signInViaUI } from './helpers/auth';
import { createTimerViaUI, playTimerFromLibrary } from './helpers/timer';

test.describe('Defer Flow', () => {
  test.beforeAll(async () => {
    await globalTestSetup();
  });

  test.beforeEach(async () => {
    await perTestCleanup();
  });

  test('defer a step — badge appears, next step starts', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Defer Test', [
      { name: 'Step A', durationMinutes: 1 },
      { name: 'Step B', durationMinutes: 1 },
      { name: 'Step C', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Defer Test');

    // Wait for running
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10_000 });

    // Defer current step
    await page.getByRole('button', { name: /defer/i }).click();

    // Badge should appear showing "1 deferred"
    await expect(page.getByText(/1 deferred/i)).toBeVisible({ timeout: 5_000 });

    // Next step should be running
    await expect(page.getByText('Step B')).toBeVisible({ timeout: 5_000 });
  });

  test('resolve deferred step — start it', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Resolve Defer Test', [
      { name: 'Deferred Step', durationMinutes: 1 },
      { name: 'Normal Step', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Resolve Defer Test');

    // Wait for running
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10_000 });

    // Defer step A
    await page.getByRole('button', { name: /defer/i }).click();

    // Now on step B — skip it to trigger deferred resolution
    await page.getByRole('button', { name: /skip step/i }).click();

    // Deferred resolution should appear
    await expect(page.locator('[data-testid="deferred-resolution"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/↩ Deferred Step/i)).toBeVisible();

    // Start the deferred step
    await page.locator('[data-testid="deferred-start"]').click();

    // The step should now be running (pause button visible)
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5_000 });
  });

  test('skip deferred step during resolution', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Skip Defer Test', [
      { name: 'Will Defer', durationMinutes: 1 },
      { name: 'Normal', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Skip Defer Test');

    // Defer step 1
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /defer/i }).click();

    // Skip step 2 → deferred resolution
    await page.getByRole('button', { name: /skip step/i }).click();

    // Deferred resolution
    await expect(page.locator('[data-testid="deferred-resolution"]')).toBeVisible({ timeout: 5_000 });

    // Skip the deferred step
    await page.getByRole('button', { name: /skip/i }).last().click();

    // Should complete (completion view)
    await expect(page.locator('[data-testid="completion-view"]')).toBeVisible({ timeout: 10_000 });
  });

  test('defer again during resolution — re-queued', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Defer Again Test', [
      { name: 'Step 1', durationMinutes: 1 },
      { name: 'Step 2', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Defer Again Test');

    // Defer step 1
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /defer/i }).click();

    // Skip step 2 → resolution
    await page.getByRole('button', { name: /skip step/i }).click();
    await expect(page.locator('[data-testid="deferred-resolution"]')).toBeVisible({ timeout: 5_000 });

    // Defer again
    await page.getByRole('button', { name: /defer again/i }).click();

    // Should present the same step again (only deferred step)
    await expect(page.locator('[data-testid="deferred-resolution"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/↩ Step 1/i)).toBeVisible();

    // Now skip it to finish
    await page.getByRole('button', { name: /skip/i }).last().click();
    await expect(page.locator('[data-testid="completion-view"]')).toBeVisible({ timeout: 10_000 });
  });

  test('completion view shows deferred summary', async ({ page }) => {
    await signInViaUI(page);
    await createTimerViaUI(page, 'Defer Summary Test', [
      { name: 'Deferred One', durationMinutes: 1 },
      { name: 'Normal One', durationMinutes: 1 },
    ]);
    await playTimerFromLibrary(page, 'Defer Summary Test');

    // Defer step 1
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /defer/i }).click();

    // Skip step 2
    await page.getByRole('button', { name: /skip step/i }).click();

    // Resolution — skip the deferred step
    await expect(page.locator('[data-testid="deferred-resolution"]')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /skip/i }).last().click();

    // Completion view — should mention deferred stats
    await expect(page.locator('[data-testid="completion-view"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/deferred/i)).toBeVisible();
  });
});
