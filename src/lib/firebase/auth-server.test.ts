import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jose before importing the module under test
const mockJwtVerify = vi.fn();
vi.mock('jose', () => ({
  createRemoteJWKSet: () => 'mock-jwks',
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));

// Ensure the Firebase project ID env var is set for tests
vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');

// Must import after mocks are set up
const { verifyFirebaseToken } = await import('@/lib/firebase/auth-server');

describe('verifyFirebaseToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns uid on valid token', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'user-123' } });
    const { data, error } = await verifyFirebaseToken('valid-token');
    expect(error).toBeNull();
    expect(data).toEqual({ uid: 'user-123' });
  });

  it('passes correct verification options', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'user-123' } });
    await verifyFirebaseToken('my-token');
    expect(mockJwtVerify).toHaveBeenCalledWith('my-token', 'mock-jwks', {
      issuer: expect.stringContaining('securetoken.google.com/'),
      audience: expect.any(String),
    });
  });

  it('returns error on verification failure', async () => {
    mockJwtVerify.mockRejectedValue(new Error('expired'));
    const { data, error } = await verifyFirebaseToken('bad-token');
    expect(data).toBeNull();
    expect(error).toBe('Invalid or expired token');
  });

  it('returns error when sub claim is missing', async () => {
    mockJwtVerify.mockResolvedValue({ payload: {} });
    const { data, error } = await verifyFirebaseToken('no-sub-token');
    expect(data).toBeNull();
    expect(error).toBe('Token missing sub claim');
  });
});
