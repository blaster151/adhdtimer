import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
} from './auth';

// Mock firebase/auth
vi.mock('firebase/auth', () => {
  const mockUser = { uid: 'test-uid', email: 'test@example.com', displayName: 'Test User' };
  return {
    signInWithPopup: vi.fn().mockResolvedValue({ user: mockUser }),
    signInWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
    createUserWithEmailAndPassword: vi.fn().mockResolvedValue({ user: mockUser }),
    signOut: vi.fn().mockResolvedValue(undefined),
    GoogleAuthProvider: vi.fn(),
    getAuth: vi.fn(() => ({})),
    getApps: vi.fn(() => []),
    getApp: vi.fn(),
    initializeApp: vi.fn(() => ({})),
    onAuthStateChanged: vi.fn(),
  };
});

// Mock firebase config
vi.mock('./config', () => ({
  auth: {},
}));

// Import the mocked functions to manipulate them
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

describe('Firebase Auth Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('returns user data on success', async () => {
      const result = await signInWithGoogle();
      expect(result.data).toEqual({ uid: 'test-uid', email: 'test@example.com', displayName: 'Test User' });
      expect(result.error).toBeNull();
      expect(signInWithPopup).toHaveBeenCalledOnce();
    });

    it('returns error message on failure', async () => {
      vi.mocked(signInWithPopup).mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
      const result = await signInWithGoogle();
      expect(result.data).toBeNull();
      expect(result.error).toBe('Sign-in was cancelled. Please try again.');
    });
  });

  describe('signInWithEmail', () => {
    it('returns user data on success', async () => {
      const result = await signInWithEmail('test@example.com', 'password123');
      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(signInWithEmailAndPassword).toHaveBeenCalledOnce();
    });

    it('returns error for wrong password', async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({ code: 'auth/wrong-password' });
      const result = await signInWithEmail('test@example.com', 'wrong');
      expect(result.data).toBeNull();
      expect(result.error).toBe('Incorrect password. Please try again.');
    });

    it('returns error for invalid credentials', async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({ code: 'auth/invalid-credential' });
      const result = await signInWithEmail('test@example.com', 'wrong');
      expect(result.data).toBeNull();
      expect(result.error).toBe('Invalid email or password. Please try again.');
    });
  });

  describe('signUpWithEmail', () => {
    it('returns user data on success', async () => {
      const result = await signUpWithEmail('new@example.com', 'password123');
      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(createUserWithEmailAndPassword).toHaveBeenCalledOnce();
    });

    it('returns error for existing email', async () => {
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValueOnce({
        code: 'auth/email-already-in-use',
      });
      const result = await signUpWithEmail('existing@example.com', 'password123');
      expect(result.data).toBeNull();
      expect(result.error).toBe('An account with this email already exists. Try signing in instead.');
    });

    it('returns error for weak password', async () => {
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValueOnce({
        code: 'auth/weak-password',
      });
      const result = await signUpWithEmail('new@example.com', '123');
      expect(result.data).toBeNull();
      expect(result.error).toBe('Password should be at least 6 characters.');
    });
  });

  describe('signOutUser', () => {
    it('returns no error on success', async () => {
      const result = await signOutUser();
      expect(result.error).toBeNull();
      expect(signOut).toHaveBeenCalledOnce();
    });

    it('returns error message on failure', async () => {
      vi.mocked(signOut).mockRejectedValueOnce({ code: 'auth/network-request-failed' });
      const result = await signOutUser();
      expect(result.error).toBe('Network error. Please check your connection and try again.');
    });
  });
});
