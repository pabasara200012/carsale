// Mock Firebase services for demo/testing without real Firebase project
// Use this if you want to test the app without setting up Firebase

import { User } from 'firebase/auth';

// Mock vehicle data for demo
const mockVehicles = [
  {
    id: 'demo-1',
    chassisNumber: 'DEMO001',
    brand: 'Toyota',
    model: 'Prius',
    year: 2020,
    grade: 'S',
    country: 'Japan',
    purchasePrice: 2500000,
    cifValue: 2800000,
    lcValue: 3000000,
    sellingPrice: 3500000,
    netProfit: 500000,
    restPayment: 0,
    status: 'available',
    images: ['https://via.placeholder.com/400x300?text=Toyota+Prius'],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo-user'
  },
  {
    id: 'demo-2',
    chassisNumber: 'DEMO002',
    brand: 'Honda',
    model: 'Civic',
    year: 2019,
    grade: 'EX',
    country: 'Japan',
    purchasePrice: 2200000,
    cifValue: 2500000,
    lcValue: 2700000,
    sellingPrice: 3200000,
    netProfit: 500000,
    restPayment: 200000,
    status: 'sold',
    images: ['https://via.placeholder.com/400x300?text=Honda+Civic'],
    purchaserName: 'John Doe',
    purchaserPhone: '+94771234567',
    purchaserEmail: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo-user'
  },
  {
    id: 'demo-3',
    chassisNumber: 'DEMO003',
    brand: 'Nissan',
    model: 'Note',
    year: 2021,
    grade: 'X',
    country: 'Japan',
    purchasePrice: 1800000,
    cifValue: 2100000,
    lcValue: 2300000,
    sellingPrice: 2800000,
    netProfit: 500000,
    restPayment: 100000,
    status: 'pending',
    images: ['https://via.placeholder.com/400x300?text=Nissan+Note'],
    shippingCompany: 'Ocean Logistics',
    shippingDate: new Date('2025-08-15'),
    arrivalDate: new Date('2025-09-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo-user'
  }
];

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
      if (path === 'vehicles') {
        const newVehicle = {
          ...data,
          id: 'demo-' + Date.now(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockVehicles.push(newVehicle);
        return { id: newVehicle.id };
      }
      return { id: 'mock-doc-' + Date.now() };
    },
    get: async () => {
      if (path === 'vehicles') {
        return {
          docs: mockVehicles.map(vehicle => ({
            id: vehicle.id,
            data: () => vehicle
          })),
          forEach: (callback: any) => {
            mockVehicles.forEach(vehicle => {
              callback({
                id: vehicle.id,
                data: () => vehicle
              });
            });
          }
        };
      }
      return {
        docs: [],
        forEach: () => {}
      };
    },
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
    get: async () => {
      const [collectionName, docId] = path.split('/');
      if (collectionName === 'vehicles') {
        const vehicle = mockVehicles.find(v => v.id === docId);
        return {
          exists: () => !!vehicle,
          data: () => vehicle,
          id: docId
        };
      }
      return {
        exists: () => false,
        data: () => null
      };
    },
    update: async (data: any) => {
      const [collectionName, docId] = path.split('/');
      if (collectionName === 'vehicles') {
        const index = mockVehicles.findIndex(v => v.id === docId);
        if (index !== -1) {
          mockVehicles[index] = { 
            ...mockVehicles[index], 
            ...data, 
            updatedAt: new Date() 
          };
        }
      }
      console.log('Mock Firestore update:', path, data);
    },
    delete: async () => {
      const [collectionName, docId] = path.split('/');
      if (collectionName === 'vehicles') {
        const index = mockVehicles.findIndex(v => v.id === docId);
        if (index !== -1) {
          mockVehicles.splice(index, 1);
        }
      }
      console.log('Mock Firestore delete:', path);
    }
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
