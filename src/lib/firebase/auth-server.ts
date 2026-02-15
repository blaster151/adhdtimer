import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// jose caches JWKS internally — create once at module level
const jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

/**
 * Verifies a Firebase ID token (JWT) using Google's JWKS endpoint.
 * Returns the user's UID on success, or an error string on failure.
 * Never throws — follows project error tuple pattern.
 */
export async function verifyFirebaseToken(
  token: string,
): Promise<{ data: { uid: string } | null; error: string | null }> {
  if (!projectId) {
    return { data: null, error: 'Firebase project ID not configured' };
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid = payload.sub;
    if (!uid) {
      return { data: null, error: 'Token missing sub claim' };
    }

    return { data: { uid }, error: null };
  } catch {
    return { data: null, error: 'Invalid or expired token' };
  }
}
