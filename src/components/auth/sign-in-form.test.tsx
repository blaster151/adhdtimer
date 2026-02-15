import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInForm } from './sign-in-form';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockSignInWithGoogle = vi.fn().mockResolvedValue({ data: { uid: '1' }, error: null });
const mockSignInWithEmail = vi.fn().mockResolvedValue({ data: { uid: '1' }, error: null });
const mockSignUpWithEmail = vi.fn().mockResolvedValue({ data: { uid: '1' }, error: null });

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
    signUpWithEmail: mockSignUpWithEmail,
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

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google sign-in button', () => {
    render(<SignInForm />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    render(<SignInForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders sign-in button by default', () => {
    render(<SignInForm />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('toggles to create account mode', () => {
    render(<SignInForm />);
    fireEvent.click(screen.getByText('Create one'));
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    render(<SignInForm />);
    await fireEvent.click(screen.getByText('Sign in with Google'));
    await vi.waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
    });
  });

  it('displays error toast on Google sign-in failure', async () => {
    const { toast } = await import('sonner');
    mockSignInWithGoogle.mockResolvedValueOnce({ data: null, error: 'Popup closed' });

    render(<SignInForm />);
    await fireEvent.click(screen.getByText('Sign in with Google'));

    // Wait for async handler
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Popup closed');
    });
  });
});
