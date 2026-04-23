import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Fallback config for development if the tool fails to generate the file
const firebaseConfig = {
  apiKey: "AIzaSyDummyKey",
  authDomain: "polyp-guardian.firebaseapp.com",
  projectId: "polyp-guardian",
  storageBucket: "polyp-guardian.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Check if this is a real configuration or just a placeholder
export const isFirebaseConfigured = firebaseConfig.apiKey !== "AIzaSyDummyKey";

// Enable persistence for offline support
if (isFirebaseConfigured) {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser doesn\'t support all of the features required to enable persistence');
      }
    });
  } catch (e) {
    console.error('Error enabling persistence:', e);
  }
}
