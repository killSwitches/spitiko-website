import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const configuredEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(configuredEnv)
  .filter(([, value]) => !value || /^your[-_]/i.test(value))
  .map(([key]) => key);

export const firebaseConfigError = missing.length
  ? `Set these Firebase values in .env: ${missing.map((key) => `EXPO_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`).join(', ')}`
  : '';

const app = getApps().length ? getApp() : initializeApp({
  apiKey: configuredEnv.apiKey || 'missing-firebase-api-key',
  authDomain: configuredEnv.authDomain || 'missing-firebase-auth-domain',
  projectId: configuredEnv.projectId || 'missing-firebase-project-id',
  storageBucket: configuredEnv.storageBucket || 'missing-firebase-storage-bucket',
  messagingSenderId: configuredEnv.messagingSenderId || 'missing-firebase-sender-id',
  appId: configuredEnv.appId || 'missing-firebase-app-id',
});
export const auth = getAuth(app);
export const db = getFirestore(app);

if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || '127.0.0.1';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
}
