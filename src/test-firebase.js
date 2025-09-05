// Temporary test file to verify Firebase configuration
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyCEj4KSnqFt63Y-oT6rnwy7NbQ7NuYEr9c",
  authDomain: "carsaleayya.firebaseapp.com",
  projectId: "carsaleayya",
  storageBucket: "carsaleayya.firebasestorage.app",
  messagingSenderId: "314873456294",
  appId: "1:314873456294:web:e077013ea99283015c3667",
  measurementId: "G-PSQ86JR2C1"
};

try {
  const app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully:', app.name);
} catch (error) {
  console.error('Firebase initialization error:', error);
}
