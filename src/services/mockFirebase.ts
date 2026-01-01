// Mock Firebase services for demo/testing without real Firebase project
import { User } from 'firebase/auth';

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
    advancePayment: 3500000,
    price: 3500000,
    tax: 0,
    duty: 0,
    totalAmount: 3500000,
    status: 'available',
    images: ['https://via.placeholder.com/400x300?text=Toyota+Prius'],
    addedBy: 'demo-user',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

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

export const mockAuth = {
  signInWithEmailAndPassword: async (email: string, password: string) => {
    if (email === 'admin@carsale.com' && password === 'admin123456') {
      currentUser = mockUsers[0];
      return { user: currentUser };
    }
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
    setTimeout(() => callback(currentUser), 100);
    return () => {}; // unsubscribe function
  },

  currentUser
};

export type MockFirestoreSnapshot = {
  exists: () => boolean;
  data: () => any;
  id: string;
};

export type MockQuerySnapshot = {
  docs: MockFirestoreSnapshot[];
  empty: boolean;
  forEach: (callback: (doc: MockFirestoreSnapshot) => void) => void;
};

export type MockDocumentReference = {
  set: (data: any) => Promise<void>;
  get: () => Promise<MockFirestoreSnapshot>;
  update: (data: any) => Promise<void>;
  delete: () => Promise<void>;
};

export type MockCollectionReference = {
  add: (data: any) => Promise<{id: string}>;
  get: () => Promise<MockQuerySnapshot>;
  where: (field: string, operator: string, value: any) => MockCollectionReference;
  doc: (id: string) => MockDocumentReference;
};

export class MockFirestore {
  constructor() {}

  collection(path: string): MockCollectionReference {
    return {
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
              data: () => vehicle,
              exists: () => true
            })),
            empty: mockVehicles.length === 0,
            forEach: (callback: (doc: MockFirestoreSnapshot) => void) => {
              mockVehicles.forEach(vehicle => {
                callback({
                  id: vehicle.id,
                  data: () => vehicle,
                  exists: () => true
                });
              });
            }
          };
        }
        return {
          docs: [],
          empty: true,
          forEach: () => {} 
        };
      },
      where: (field: string, operator: string, value: any): MockCollectionReference => {
        return {
          add: async () => ({ id: 'mock-' + Date.now() }),
          get: async () => {
            if (path === 'vehicles') {
              return {
                docs: mockVehicles
                  .filter(vehicle => {
                    if (operator === '==') {
                      return vehicle[field as keyof typeof vehicle] === value;
                    }
                    return false;
                  })
                  .map(vehicle => ({
                    id: vehicle.id,
                    data: () => vehicle,
                    exists: () => true
                  })),
                empty: mockVehicles.length === 0,
                forEach: () => {}
              };
            }
            return {
              docs: [],
              empty: true,
              forEach: () => {}
            };
          },
          where: (field: string, operator: string, value: any) => 
            this.collection(path).where(field, operator, value),
          doc: (id: string) => this.doc(`${path}/${id}`)
        };
      },
      doc: (id: string) => this.doc(`${path}/${id}`) 
    };
  }

  doc(path: string): MockDocumentReference {
    return {
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
          data: () => null,
          id: 'not-found'
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
    };
  }
}

export const mockDb = new MockFirestore();

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