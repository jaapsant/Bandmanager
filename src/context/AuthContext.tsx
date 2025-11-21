import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAuthErrorMessage(error: AuthError, t: (key: string) => string): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return t('auth.errors.emailInUse');
    case 'auth/invalid-email':
      return t('auth.errors.invalidEmail');
    case 'auth/operation-not-allowed':
      return t('auth.errors.emailPasswordDisabled');
    case 'auth/weak-password':
      return t('auth.errors.weakPassword');
    case 'auth/invalid-credential':
      return t('auth.errors.invalidCredentials');
    case 'auth/user-disabled':
      return t('auth.errors.accountDisabled');
    case 'auth/user-not-found':
      return t('auth.errors.userNotFound');
    case 'auth/wrong-password':
      return t('auth.errors.invalidCredentials');
    case 'auth/too-many-requests':
      return t('auth.errors.tooManyRequests');
    case 'auth/network-request-failed':
      return t('auth.errors.networkError');
    default:
      console.error('Unhandled auth error:', error);
      return t('auth.errors.unexpected');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile
      await updateProfile(firebaseUser, {
        displayName: name
      });

      // Create user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        displayName: name,
        createdAt: new Date().toISOString(),
      });

      // Create roles document
      await setDoc(doc(db, 'roles', firebaseUser.uid), {
        admin: false,
        bandManager: false,
        bandMember: false
      });

      // Send verification email
      await sendEmailVerification(firebaseUser);
    } catch (error) {
      console.error('Error during sign up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw new Error(getAuthErrorMessage(error as AuthError, t));
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      throw new Error(t('auth.errors.notSignedIn'));
    }

    if (auth.currentUser.emailVerified) {
      throw new Error(t('auth.errors.alreadyVerified'));
    }

    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error('Error sending verification email:', error);
      if ((error as AuthError).code === 'auth/too-many-requests') {
        throw new Error(t('auth.errors.verificationEmailLimit'));
      }
      throw new Error(t('auth.errors.verificationEmailFailed'));
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!auth.currentUser) {
      throw new Error(t('auth.errors.signInRequired'));
    }

    try {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser(prev => prev ? { ...prev, displayName: name } : null);
    } catch (error) {
      console.error('Error updating display name:', error);
      throw new Error(t('auth.errors.updateDisplayNameFailed'));
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    sendVerificationEmail,
    updateDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  const { t } = useTranslation();

  if (context === undefined) {
    throw new Error(t('auth.errors.useAuthHook'));
  }
  return context;
}