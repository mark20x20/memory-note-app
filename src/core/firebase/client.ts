import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/utils/env';

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  ...(ENV.FIREBASE_MEASUREMENT_ID ? { measurementId: ENV.FIREBASE_MEASUREMENT_ID } : {}),
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

function getOrInitApp(): FirebaseApp | null {
  if (!isConfigured) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getOrInitAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (hot reload)
    return getAuth(app);
  }
}

export const firebaseApp: FirebaseApp | null = getOrInitApp();
export const auth: Auth | null = firebaseApp ? getOrInitAuth(firebaseApp) : null;
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage: FirebaseStorage | null = firebaseApp ? getStorage(firebaseApp) : null;
export const functions: Functions | null = firebaseApp
  ? getFunctions(firebaseApp, ENV.FIREBASE_FUNCTIONS_REGION)
  : null;
