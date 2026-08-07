import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

let firebaseApp: FirebaseApp | null = null
let firestore: Firestore | null = null

if (isFirebaseConfigured && import.meta.env.VITE_DATA_MODE === 'firebase') {
  firebaseApp = getApps()[0] ?? initializeApp(firebaseConfig)
  firestore = getFirestore(firebaseApp)
}

export { firebaseApp, firestore }

/**
 * The visual prototype defaults to localStorage so it can be reviewed immediately.
 * Once the Firebase project is ready, set VITE_DATA_MODE=firebase and connect the
 * repository layer to the Firestore instance exported here.
 */
