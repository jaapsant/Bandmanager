import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Mock Firebase Auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(() => vi.fn()),
};

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'mock-doc-ref'),
  setDoc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ data: () => null })),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Test component that uses AuthContext
const TestComponent = () => {
  const { user, loading, signUp, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user-status">
        {user ? `Logged in: ${user.email}` : 'Not logged in'}
      </div>
      <div data-testid="email-verified">
        {user ? (user.emailVerified ? 'Verified' : 'Not verified') : 'N/A'}
      </div>
      <button onClick={() => signUp('test@example.com', 'password', 'Test User')}>
        Sign Up
      </button>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
};

// Custom render for these specific tests
const renderWithAuthProvider = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = null;
    mockAuth.onAuthStateChanged.mockReturnValue(vi.fn());
  });

  it('should provide initial loading state', () => {
    renderWithAuthProvider(<TestComponent />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render not logged in state when no user', async () => {
    // Mock onAuthStateChanged to immediately call the callback with null
    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return vi.fn(); // unsubscribe function
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
    });
  });

  it('should render logged in state when user exists', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
    };

    // Mock onAuthStateChanged to call callback with user
    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return vi.fn();
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in: test@example.com');
      expect(screen.getByTestId('email-verified')).toHaveTextContent('Verified');
    });
  });

  it('should handle sign up method call', async () => {
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth');
    const { setDoc } = await import('firebase/firestore');
    
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: null,
      emailVerified: false,
    };

    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });
    
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user: mockUser } as any);
    vi.mocked(updateProfile).mockResolvedValue(undefined);
    vi.mocked(sendEmailVerification).mockResolvedValue(undefined);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const signUpButton = screen.getByText('Sign Up');
    fireEvent.click(signUpButton);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password'
      );
    });
  });

  it('should handle sign in method call', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    
    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });
    
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({} as any);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const signInButton = screen.getByText('Sign In');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password'
      );
    });
  });

  it('should handle sign out method call', async () => {
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    
    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });
    
    vi.mocked(firebaseSignOut).mockResolvedValue(undefined);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const signOutButton = screen.getByText('Sign Out');
    fireEvent.click(signOutButton);

    await waitFor(() => {
      expect(firebaseSignOut).toHaveBeenCalledWith(mockAuth);
    });
  });

  it('should provide correct context interface', async () => {
    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      // All buttons should be rendered, indicating context methods are available
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });
  });

  it('should handle user state changes from firebase auth', async () => {
    let authStateCallback: any;
    
    // Capture the callback so we can call it manually
    mockAuth.onAuthStateChanged.mockImplementation((callback) => {
      authStateCallback = callback;
      return vi.fn();
    });

    renderWithAuthProvider(<TestComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate user logged in
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
    };

    act(() => {
      authStateCallback(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in: test@example.com');
      expect(screen.getByTestId('email-verified')).toHaveTextContent('Verified');
    });

    // Simulate user logged out
    act(() => {
      authStateCallback(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in');
      expect(screen.getByTestId('email-verified')).toHaveTextContent('N/A');
    });
  });
});