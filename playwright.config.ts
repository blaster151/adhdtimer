import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Point the dev server at Firebase emulators
      NEXT_PUBLIC_FIREBASE_API_KEY: 'fake-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-adhdtimer',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-adhdtimer.appspot.com',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:fake',
      NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
      NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: 'localhost:8080',
    },
  },
});
