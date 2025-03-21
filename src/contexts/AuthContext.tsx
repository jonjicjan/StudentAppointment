import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile,
  AuthError,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, FirestoreError } from 'firebase/firestore';
import { app } from '../lib/firebase';

// Interfaces for different user types
interface BaseUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: 'admin' | 'teacher' | 'student';
}

interface Teacher extends BaseUser {
  department: string;
  subjects: string[];
  availability: {
    [key: string]: {
      start: string;
      end: string;
    }[];
  };
}

interface Student extends BaseUser {
  enrolledClasses: string[];
  appointments: string[];
}

interface Admin extends BaseUser {
  permissions: string[];
}

type User = BaseUser | Teacher | Student | Admin;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<string | undefined>;
  signUp: (email: string, password: string, role: string, userData: any) => Promise<string | undefined>;
  signOut: () => Promise<void>;
  getRoleBasedRedirect: (role?: string) => string;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  const getRoleBasedRedirect = (role?: string): string => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError('You are currently offline. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const docRef = doc(firestore, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: userData.role,
              ...userData
            });
          } else {
            setError('User profile not found');
          }
        } else {
          setUser(null);
        }
        setError(null);
      } catch (err) {
        const firestoreError = err as FirestoreError;
        console.error('Error in auth state change:', firestoreError);
        setError(`Error fetching user data: ${firestoreError.message}`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  async function signIn(email: string, password: string): Promise<string | undefined> {
    try {
      if (!isOnline) {
        throw new Error('You are currently offline. Please check your internet connection.');
      }

      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const docRef = doc(firestore, 'users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        return userData.role;
      }
      
      setError('User profile not found');
      return undefined;
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'Failed to sign in. ';
      
      switch (authError.code) {
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage += 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage += 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage += 'Incorrect password.';
          break;
        default:
          errorMessage += authError.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function signUp(email: string, password: string, role: string, userData: any): Promise<string | undefined> {
    try {
      if (!isOnline) {
        throw new Error('You are currently offline. Please check your internet connection.');
      }

      setError(null);
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: userData.name });
        
        // Create user document with role-specific data
        const userDoc = {
          email,
          name: userData.name,
          role,
          createdAt: new Date().toISOString(),
          ...(role === 'teacher' && {
            department: userData.department,
            subjects: userData.subjects || [],
            availability: userData.availability || {}
          }),
          ...(role === 'student' && {
            enrolledClasses: [],
            appointments: []
          }),
          ...(role === 'admin' && {
            permissions: ['manage_teachers', 'manage_students', 'manage_appointments']
          })
        };

        await setDoc(doc(firestore, 'users', userCredential.user.uid), userDoc);
        return role;
      }
      return undefined;
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = 'Failed to create account. ';
      
      switch (authError.code) {
        case 'auth/email-already-in-use':
          errorMessage += 'Email is already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage += 'Email/password accounts are not enabled.';
          break;
        case 'auth/weak-password':
          errorMessage += 'Password is too weak.';
          break;
        default:
          errorMessage += authError.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function signOut() {
    try {
      if (!isOnline) {
        throw new Error('You are currently offline. Please check your internet connection.');
      }

      setError(null);
      await firebaseSignOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw new Error(authError.message);
    }
  }

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    getRoleBasedRedirect,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
