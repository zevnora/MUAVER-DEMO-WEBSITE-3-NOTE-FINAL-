import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with force long polling for reliable connectivity in iframe/proxy environments
function createFirestoreInstance() {
  const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? config.firestoreDatabaseId
    : undefined;

  const baseSettings = {
    ignoreUndefinedProperties: true,
    experimentalForceLongPolling: true,
  };

  try {
    const firestoreSettings = {
      ...baseSettings,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    };
    if (dbId) {
      return initializeFirestore(app, firestoreSettings, dbId);
    }
    return initializeFirestore(app, firestoreSettings);
  } catch (_cacheErr) {
    try {
      if (dbId) {
        return initializeFirestore(app, baseSettings, dbId);
      }
      return initializeFirestore(app, baseSettings);
    } catch (_initErr) {
      // Fallback if already initialized or in strict isolation mode
      return dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
  }
}

export const db = createFirestoreInstance();
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
