// lib/firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Firebase Authentication
let auth: Auth;
try {
  auth = getAuth(app);
  // Uncomment the following line if you want to use the auth emulator
  // connectAuthEmulator(auth, 'http://localhost:9099');
} catch (error) {
  console.error('Error initializing Firebase Auth:', error);
  throw error;
}

// Initialize Cloud Firestore
let db: Firestore;
try {
  db = getFirestore(app);
  // Uncomment the following line if you want to use the Firestore emulator
  // connectFirestoreEmulator(db, 'localhost', 8080);
} catch (error) {
  console.error('Error initializing Firestore:', error);
  throw error;
}

export { app, auth, db };
