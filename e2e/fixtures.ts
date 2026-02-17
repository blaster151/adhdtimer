import { test as base } from '@playwright/test';
import {
  createTestUser,
  clearFirestoreData,
  clearAuthUsers,
} from './helpers/firebase-emulator';
import { TEST_USER, signInViaUI } from './helpers/auth';

/**
 * Custom Playwright fixture that:
 * - Creates a test user in the Firebase Auth emulator (once)
 * - Clears Firestore data before each test (clean slate)
 * - Signs in the test user before each test
 */
export const test = base.extend<{ authedPage: typeof base }>({
  // eslint-disable-next-line no-empty-pattern
  authedPage: [async ({ page }, use) => {
    // Sign in
    await signInViaUI(page);

    // Use the page in the test
    await use(page as never);
  }, { auto: false }],
});

/**
 * Global setup: create test user + clear data.
 * Called from beforeAll in test files.
 */
export async function globalTestSetup(): Promise<void> {
  await clearAuthUsers().catch(() => {
    // Auth emulator may not support DELETE on all versions — ignore
  });
  await createTestUser(TEST_USER.email, TEST_USER.password);
  await clearFirestoreData();
}

/**
 * Per-test cleanup: clear Firestore for isolation.
 */
export async function perTestCleanup(): Promise<void> {
  await clearFirestoreData();
}

export { expect } from '@playwright/test';
