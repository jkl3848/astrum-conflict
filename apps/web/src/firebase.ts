import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, signInAnonymously, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseConfigured = Boolean(config.apiKey && config.projectId)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let functions: Functions | null = null
let appCheck: AppCheck | null = null
let emulatorsConnected = false

export function getFirebaseApp(): FirebaseApp {
  if (!firebaseConfigured) {
    throw new Error('Firebase is not configured. Copy .env.example to apps/web/.env.local')
  }
  if (!app) app = initializeApp(config)
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    maybeConnectEmulators()
  }
  return auth
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
    maybeConnectEmulators()
  }
  return db
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
    maybeConnectEmulators()
  }
  return storage
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp())
    maybeConnectEmulators()
  }
  return functions
}

function maybeConnectEmulators() {
  if (emulatorsConnected) return
  if (import.meta.env.VITE_USE_EMULATORS !== 'true') return
  emulatorsConnected = true
  if (auth) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  if (db) connectFirestoreEmulator(db, '127.0.0.1', 8080)
  if (storage) connectStorageEmulator(storage, '127.0.0.1', 9199)
  if (functions) connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}

export function initAppCheck() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (!siteKey || !firebaseConfigured) return null
  if (appCheck) return appCheck
  appCheck = initializeAppCheck(getFirebaseApp(), {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  })
  return appCheck
}

export async function ensureSignedIn() {
  if (!firebaseConfigured) return null
  const a = getFirebaseAuth()
  if (a.currentUser) return a.currentUser
  const cred = await signInAnonymously(a)
  return cred.user
}
