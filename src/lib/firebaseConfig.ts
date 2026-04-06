import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db: Firestore = getFirestore(app);

let auth: Auth;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

export const getClientAuth = (): Auth => {
  if (typeof window === 'undefined') {
    return getAuth(app); 
  }
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const getClientStorage = (): FirebaseStorage => {
  if (typeof window === 'undefined') {
    return getStorage(app); 
  }
  if (!storageInstance) {
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

export const getClientAnalytics = (): Analytics | null => {
  if (typeof window !== 'undefined') {
    if (!analyticsInstance) {
      isSupported().then((supported) => {
        if (supported) {
          analyticsInstance = getAnalytics(app);
        }
      });
    }
    return analyticsInstance;
  }
  return null;
};

auth = getAuth(app);

export { app, db, auth };

