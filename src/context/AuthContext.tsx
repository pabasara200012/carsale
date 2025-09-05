import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockAuth, MockUser } from '../services/mockAuth';
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
  email: 'admin@carsale.com',
  password: 'admin123456'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (data: LoginFormData): Promise<void> => {
    try {
      console.log('Using mock authentication');
      const result = await mockAuth.signInWithEmailAndPassword(data.email, data.password);
      const mockUser = result.user;
      
      const userData: User = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        role: data.email === ADMIN_CREDENTIALS.email ? 'admin' : 'user',
        createdAt: new Date()
      };
      
      setCurrentUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterFormData): Promise<void> => {
    try {
      console.log('Using mock registration');
      const result = await mockAuth.createUserWithEmailAndPassword(data.email, data.password);
      const mockUser = result.user;
      
      const userData: User = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: data.displayName,
        role: 'user',
        createdAt: new Date()
      };
      
      setCurrentUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await mockAuth.signOut();
      setCurrentUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string }): Promise<void> => {
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }
    setCurrentUser({ ...currentUser, ...data });
  };

  const updateUserEmail = async (email: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }
    setCurrentUser({ ...currentUser, email });
  };

  const updateUserPassword = async (password: string): Promise<void> => {
    console.log('Password update not supported in demo mode');
  };

  useEffect(() => {
    const unsubscribe = mockAuth.onAuthStateChanged((mockUser: MockUser | null) => {
      if (mockUser) {
        const userData: User = {
          uid: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
          role: mockUser.email === ADMIN_CREDENTIALS.email ? 'admin' : 'user',
          createdAt: new Date()
        };
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
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
