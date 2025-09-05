import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Demo Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyDZt974FbKhjcsj_rXUnrXhDiHT7rLInC4",
  authDomain: "carsale-5904d.firebaseapp.com",
  projectId: "carsale-5904d",
  storageBucket: "carsale-5904d.firebasestorage.app",
  messagingSenderId: "142438520030",
  appId: "1:142438520030:web:f629deb2fbe1f312361e4f",
  measurementId: "G-LCRGD7Q1VW"
};


// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Disable emulators since we're using a real Firebase project
// if (process.env.NODE_ENV === 'development') {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     connectStorageEmulator(storage, 'localhost', 9199);
//     console.log('Firebase emulators connected');
//   } catch (error) {
//     console.warn('Firebase emulators not available, using demo mode');
//   }
// }

export default app;
