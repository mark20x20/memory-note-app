import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectStorageEmulator } from 'firebase/storage';
import { connectFunctionsEmulator } from 'firebase/functions';
import { auth, db, storage, functions } from './client';
import { ENV } from '@/utils/env';

// Guard against repeated calls (e.g. during hot reload)
let emulatorsConnected = false;

export function connectToEmulators(): void {
  if (ENV.USE_FIREBASE_EMULATOR !== 'true') return;
  if (emulatorsConnected) return;
  if (!auth || !db || !storage || !functions) return;

  const host = ENV.FIREBASE_EMULATOR_HOST;
  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    connectStorageEmulator(storage, host, 9199);
    connectFunctionsEmulator(functions, host, 5001);
    emulatorsConnected = true;
  } catch {
    // Already connected (possible on hot reload)
  }
}
