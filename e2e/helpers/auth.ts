import type { Page } from '@playwright/test';

export const TEST_USER = {
  email: 'test@adhdtimer.test',
  password: 'testpassword123',
};

/**
 * Sign in the test user via the app's login page.
 * Waits until redirected to /app (timer library).
 */
export async function signInViaUI(page: Page): Promise<void> {
  await page.goto('/login');

  // Fill the email/password form
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);

  // Submit
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to the app (timer library)
  await page.waitForURL('**/app', { timeout: 15_000 });
}
