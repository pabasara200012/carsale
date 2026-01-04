import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { User, LoginFormData, RegisterFormData } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string }) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'dayaauto@gmail.com',
  password: 'daya123789'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (data: LoginFormData): Promise<void> => {
    try {
      console.log('Using Firebase authentication');
      const result = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = result.user;
      
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        role: data.email === ADMIN_CREDENTIALS.email ? 'admin' : 'user',
        createdAt: new Date(firebaseUser.metadata.creationTime || Date.now())
      };
      
      setCurrentUser(userData);
    } catch (error) {
      console.error('Login error code:', (error as any)?.code, error);
      // Provide a clearer message for common credential issues
      if ((error as any)?.code === 'auth/invalid-credential') {
        throw new Error('Invalid credential provided. Check your Firebase config, provider tokens, and ensure Email/Password sign-in is enabled.');
      }
      throw error;
    }
  };

  const register = async (data: RegisterFormData): Promise<void> => {
    try {
      console.log('Using Firebase registration');
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = result.user;
      
      // Update display name
      await updateProfile(firebaseUser, { displayName: data.displayName });
      
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: data.displayName,
        role: 'user',
        createdAt: new Date(firebaseUser.metadata.creationTime || Date.now())
      };
      
      setCurrentUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string }): Promise<void> => {
    if (!currentUser || !auth.currentUser) {
      throw new Error('No user is currently logged in');
    }
    await updateProfile(auth.currentUser, data);
    setCurrentUser({ ...currentUser, ...data });
  };

  const updateUserEmail = async (email: string): Promise<void> => {
    if (!currentUser || !auth.currentUser) {
      throw new Error('No user is currently logged in');
    }
    await updateEmail(auth.currentUser, email);
    setCurrentUser({ ...currentUser, email });
  };

  const updateUserPassword = async (password: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user is currently logged in');
    }
    await updatePassword(auth.currentUser, password);
  };

  useEffect(() => {
    // Check localStorage first
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          role: firebaseUser.email === ADMIN_CREDENTIALS.email ? 'admin' : 'user',
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now())
        };
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    register,
    logout,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    loading,
    isAdmin: currentUser?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
