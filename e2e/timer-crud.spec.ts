import { test, expect, globalTestSetup, perTestCleanup } from './fixtures';
import { signInViaUI } from './helpers/auth';
import { createTimerViaUI } from './helpers/timer';

test.describe('Timer CRUD', () => {
  test.beforeAll(async () => {
    await globalTestSetup();
  });

  test.beforeEach(async () => {
    await perTestCleanup();
  });

  test('create a timer with 3 steps — appears in library', async ({ page }) => {
    await signInViaUI(page);

    await createTimerViaUI(page, 'Morning Routine', [
      { name: 'Shower', durationMinutes: 5 },
      { name: 'Get dressed', durationMinutes: 3 },
      { name: 'Breakfast', durationMinutes: 10 },
    ]);

    // Timer should appear in library
    const timerCard = page.locator('[data-testid="timer-card"]').filter({ hasText: 'Morning Routine' });
    await expect(timerCard).toBeVisible();
    await expect(timerCard).toContainText('3 steps');
  });

  test('edit a timer — rename and save', async ({ page }) => {
    await signInViaUI(page);

    // Create first
    await createTimerViaUI(page, 'Old Name', [
      { name: 'Step A', durationMinutes: 2 },
    ]);

    // Click timer to edit
    const timerCard = page.locator('[data-testid="timer-card"]').filter({ hasText: 'Old Name' });
    await timerCard.getByRole('button', { name: /open old name/i }).click();
    await page.waitForURL('**/edit');

    // Change name
    const nameInput = page.getByLabel('Timer Name');
    await nameInput.clear();
    await nameInput.fill('New Name');

    // Save
    await page.getByRole('button', { name: /update timer/i }).click();
    await page.waitForURL('**/app', { timeout: 10_000 });

    // Verify updated
    await expect(page.locator('[data-testid="timer-card"]').filter({ hasText: 'New Name' })).toBeVisible();
    await expect(page.locator('[data-testid="timer-card"]').filter({ hasText: 'Old Name' })).not.toBeVisible();
  });

  test('duplicate a timer — copy appears in library', async ({ page }) => {
    await signInViaUI(page);

    await createTimerViaUI(page, 'Original Timer', [
      { name: 'Step 1', durationMinutes: 1 },
    ]);

    // Open dropdown menu
    const timerCard = page.locator('[data-testid="timer-card"]').filter({ hasText: 'Original Timer' });
    await timerCard.getByRole('button', { name: /more options/i }).click();

    // Click Duplicate
    await page.getByRole('menuitem', { name: /duplicate/i }).click();

    // Wait for duplicate to appear (toast + new card)
    await expect(page.locator('[data-testid="timer-card"]')).toHaveCount(2, { timeout: 5_000 });
  });

  test('delete a timer — removed from library', async ({ page }) => {
    await signInViaUI(page);

    await createTimerViaUI(page, 'Timer To Delete', [
      { name: 'Step 1', durationMinutes: 1 },
    ]);

    // Verify it exists
    await expect(page.locator('[data-testid="timer-card"]').filter({ hasText: 'Timer To Delete' })).toBeVisible();

    // Open dropdown menu
    const timerCard = page.locator('[data-testid="timer-card"]').filter({ hasText: 'Timer To Delete' });
    await timerCard.getByRole('button', { name: /more options/i }).click();

    // Click Delete
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm in dialog
    await page.getByRole('button', { name: 'Delete' }).click();

    // Timer should be gone — empty state should show
    await expect(page.locator('[data-testid="timer-card"]').filter({ hasText: 'Timer To Delete' })).not.toBeVisible({ timeout: 5_000 });
  });

  test('create a timer with mixed step types', async ({ page }) => {
    await signInViaUI(page);

    await createTimerViaUI(page, 'Mixed Steps Timer', [
      { name: 'Work', durationMinutes: 5, type: 'active' },
      { name: 'Wait for water', durationMinutes: 2, type: 'wait' },
      { name: 'Checkpoint', durationMinutes: 0, type: 'checkpoint' },
    ]);

    const timerCard = page.locator('[data-testid="timer-card"]').filter({ hasText: 'Mixed Steps Timer' });
    await expect(timerCard).toBeVisible();
    await expect(timerCard).toContainText('3 steps');
  });
});
