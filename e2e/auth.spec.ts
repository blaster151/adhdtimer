import { test, expect, globalTestSetup, perTestCleanup } from './fixtures';
import { signInViaUI, TEST_USER } from './helpers/auth';

test.describe('Auth & Navigation', () => {
  test.beforeAll(async () => {
    await globalTestSetup();
  });

  test.beforeEach(async () => {
    await perTestCleanup();
  });

  test('unauthenticated user visiting /app is redirected to /login', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('sign in with valid credentials redirects to /app', async ({ page }) => {
    await signInViaUI(page);
    await expect(page).toHaveURL(/\/app$/);
    // Timer library heading should be visible (either "Timer Library" or empty state)
    await expect(
      page.getByText(/timer library|no timers/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('sign in with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@email.test');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should stay on login and show an error toast
    await expect(page).toHaveURL(/\/login/);
    // Sonner toast with error message
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('empty library shows empty state', async ({ page }) => {
    await signInViaUI(page);
    // With no timers, the empty state CTA should be visible
    await expect(
      page.getByRole('link', { name: /new timer|create/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
