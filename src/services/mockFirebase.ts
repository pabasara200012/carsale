// Mock Firebase services for demo/testing without real Firebase project
// Use this if you want to test the app without setting up Firebase

import { User } from 'firebase/auth';

// Mock user data
const mockUsers = [
  {
    uid: 'admin-123',
    email: 'admin@carsale.com', 
    displayName: 'Admin User',
    isAdmin: true
  },
  {
    uid: 'user-456',
    email: 'user@example.com',
    displayName: 'Test User', 
    isAdmin: false
  }
];

let currentUser: any = null;

// Mock authentication functions
export const mockAuth = {
  signInWithEmailAndPassword: async (email: string, password: string) => {
    // Simulate admin login
    if (email === 'admin@carsale.com' && password === 'admin123456') {
      currentUser = mockUsers[0];
      return { user: currentUser };
    }
    // Simulate regular user login  
    if (email === 'user@example.com' && password === 'password') {
      currentUser = mockUsers[1];
      return { user: currentUser };
    }
    throw new Error('Invalid credentials');
  },

  createUserWithEmailAndPassword: async (email: string, password: string) => {
    const newUser = {
      uid: 'user-' + Date.now(),
      email,
      displayName: email.split('@')[0],
      isAdmin: false
    };
    mockUsers.push(newUser);
    currentUser = newUser;
    return { user: newUser };
  },

  signOut: async () => {
    currentUser = null;
  },

  onAuthStateChanged: (callback: (user: any) => void) => {
    // Simulate auth state change
    setTimeout(() => callback(currentUser), 100);
    return () => {}; // unsubscribe function
  },

  currentUser
};

// Mock Firestore functions
export const mockDb = {
  collection: (path: string) => ({
    add: async (data: any) => {
      console.log('Mock Firestore add:', path, data);
      return { id: 'mock-doc-' + Date.now() };
    },
    get: async () => ({
      docs: [],
      forEach: () => {}
    }),
    where: () => ({
      get: async () => ({
        docs: [],
        forEach: () => {}  
      })
    })
  }),
  doc: (path: string) => ({
    set: async (data: any) => {
      console.log('Mock Firestore set:', path, data);
    },
    get: async () => ({
      exists: () => false,
      data: () => null
    })
  })
};

// Mock Storage functions  
export const mockStorage = {
  ref: (path: string) => ({
    put: async (file: File) => {
      console.log('Mock Storage upload:', path, file.name);
      return {
        ref: {
          getDownloadURL: async () => `https://mock-storage.com/${file.name}`
        }
      };
    }
  })
};

export { mockAuth as auth, mockDb as db, mockStorage as storage };
