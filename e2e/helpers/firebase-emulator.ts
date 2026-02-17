/**
 * Firebase Emulator helpers for e2e tests.
 *
 * Requires the Firebase Emulator Suite to be running:
 *   npx firebase emulators:start
 *
 * Auth emulator: http://localhost:9099
 * Firestore emulator: http://localhost:8080
 */

const AUTH_EMULATOR_HOST = 'localhost:9099';
const FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-adhdtimer';

export const EMULATOR_AUTH_URL = `http://${AUTH_EMULATOR_HOST}`;
export const EMULATOR_FIRESTORE_URL = `http://${FIRESTORE_EMULATOR_HOST}`;

/**
 * Create a test user in the Auth emulator via REST API.
 */
export async function createTestUser(email: string, password: string): Promise<{ localId: string }> {
  const res = await fetch(
    `${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    // If user already exists, that's fine — try signing in instead
    if (body.includes('EMAIL_EXISTS')) {
      return signInTestUser(email, password);
    }
    throw new Error(`Failed to create test user: ${res.status} ${body}`);
  }

  const data = await res.json();
  return { localId: data.localId };
}

/**
 * Sign in a test user via the Auth emulator REST API.
 * Returns the localId (uid).
 */
async function signInTestUser(email: string, password: string): Promise<{ localId: string }> {
  const res = await fetch(
    `${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to sign in test user: ${res.status} ${body}`);
  }

  const data = await res.json();
  return { localId: data.localId };
}

/**
 * Clear all data from the Firestore emulator.
 */
export async function clearFirestoreData(): Promise<void> {
  const res = await fetch(
    `${EMULATOR_FIRESTORE_URL}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to clear Firestore: ${res.status} ${body}`);
  }
}

/**
 * Clear all users from the Auth emulator.
 */
export async function clearAuthUsers(): Promise<void> {
  const res = await fetch(
    `${EMULATOR_AUTH_URL}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/accounts`,
    { method: 'DELETE' },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to clear auth users: ${res.status} ${body}`);
  }
}
