import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from './auth-guard';

// Track the mock router
const mockReplace = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Default mock values — will be overridden per test
let mockUser: { uid: string; email: string } | null = null;
let mockLoading = false;

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    signInWithGoogle: vi.fn(),
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock firebase modules to prevent initialization
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/app', () => ({
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
  initializeApp: vi.fn(() => ({})),
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockLoading = false;
  });

  it('shows skeleton loader when loading', () => {
    mockLoading = true;
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    // Should show skeleton, not content
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    // Skeleton divs should be present
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('redirects to /login when no user', () => {
    mockUser = null;
    mockLoading = false;
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('renders children when user is authenticated', () => {
    mockUser = { uid: 'test-uid', email: 'test@example.com' };
    mockLoading = false;
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
