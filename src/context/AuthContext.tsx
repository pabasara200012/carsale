import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
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

// Check if we're on GitHub Pages
const isGitHubPages = window.location.hostname === 'pabasara200012.github.io';

// Admin credentials (hardcoded as requested)
const ADMIN_CREDENTIALS = {
  email: 'admin@carsale.com',
  password: 'admin123456'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (data: LoginFormData): Promise<void> => {
    try {
      if (isGitHubPages) {
        // Use mock authentication for GitHub Pages demo
        console.log('Using mock authentication for GitHub Pages demo');
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
        return;
      }
      // Special handling for admin login - create admin user if doesn't exist
      if (data.email === ADMIN_CREDENTIALS.email && data.password === ADMIN_CREDENTIALS.password) {
        try {
          // Try to sign in first
          const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
          const firebaseUser = userCredential.user;
          
          // Get or create admin user document
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData: User;
          
          if (userDoc.exists()) {
            userData = userDoc.data() as User;
            // Ensure admin role
            if (userData.role !== 'admin') {
              userData.role = 'admin';
              await setDoc(userDocRef, userData);
            }
          } else {
            // Create admin user document
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: 'Admin User',
              role: 'admin',
              createdAt: new Date()
            };
            await setDoc(userDocRef, userData);
          }
          
          setCurrentUser(userData);
          return;
        } catch (signInError: any) {
          // If admin user doesn't exist, create it
          if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
            console.log('Creating admin user...');
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const firebaseUser = userCredential.user;
            
            // Update display name
            await updateProfile(firebaseUser, {
              displayName: 'Admin User'
            });
            
            // Create admin user document
            const userData: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: 'Admin User',
              role: 'admin',
              createdAt: new Date()
            };
            
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, userData);
            
            // Create initial tax/duty configuration for new admin
            const taxDutyConfigRef = doc(db, 'config', 'taxDuty');
            const taxDutyDoc = await getDoc(taxDutyConfigRef);
            
            if (!taxDutyDoc.exists()) {
              await setDoc(taxDutyConfigRef, {
                taxPercentage: 15,
                dutyPercentage: 10,
                updatedAt: new Date(),
                updatedBy: firebaseUser.uid
              });
              console.log('Initial tax/duty configuration created');
            }
            
            setCurrentUser(userData);
            return;
          } else {
            throw signInError;
          }
        }
      }
      
      // Regular user login
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      // Get user document
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData: User;
      
      if (userDoc.exists()) {
        userData = userDoc.data() as User;
      } else {
        // Create new user document for existing Firebase user
        userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'User',
          role: 'user',
          createdAt: new Date()
        };
        await setDoc(userDocRef, userData);
      }
      
      setCurrentUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterFormData): Promise<void> => {
    try {
      if (isGitHubPages) {
        // Use mock authentication for GitHub Pages demo
        console.log('Using mock registration for GitHub Pages demo');
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
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      // Update profile
      await updateProfile(firebaseUser, {
        displayName: data.displayName
      });
      
      // Create user document
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: data.displayName,
        role: 'user',
        createdAt: new Date()
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      setCurrentUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (isGitHubPages) {
        await mockAuth.signOut();
        setCurrentUser(null);
        return;
      }
      
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string }): Promise<void> => {
    if (!auth.currentUser || !currentUser) {
      throw new Error('No user is currently logged in');
    }

    try {
      // Update Firebase Auth profile
      if (data.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: data.displayName
        });
      }

      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: new Date()
      });

      // Update local state
      setCurrentUser({
        ...currentUser,
        ...data
      });
    } catch (error) {
      throw error;
    }
  };

  const updateUserEmail = async (email: string): Promise<void> => {
    if (!auth.currentUser || !currentUser) {
      throw new Error('No user is currently logged in');
    }

    try {
      // Update Firebase Auth email
      await updateEmail(auth.currentUser, email);

      // Update Firestore user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        email: email,
        updatedAt: new Date()
      });

      // Update local state
      setCurrentUser({
        ...currentUser,
        email: email
      });
    } catch (error) {
      throw error;
    }
  };

  const updateUserPassword = async (password: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user is currently logged in');
    }

    try {
      await updatePassword(auth.currentUser, password);
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (isGitHubPages) {
      // Use mock authentication state for GitHub Pages
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
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        } else {
          // Create user document if it doesn't exist
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'User',
            role: 'user',
            createdAt: new Date()
          };
          await setDoc(userDocRef, userData);
          setCurrentUser(userData);
        }
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
