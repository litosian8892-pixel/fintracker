import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Import fungsi cache offline dari firestore
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// PASTE CONFIG FIREBASE ANDA DI SINI
const firebaseConfig = {
  apiKey: "AIzaSyB-XXXX...",
  authDomain: "fintracker-XXXX.firebaseapp.com",
  projectId: "fintracker-XXXX",
  storageBucket: "fintracker-XXXX.appspot.com",
  messagingSenderId: "XXXX",
  appId: "1:XXXX:web:XXXX"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// INISIALISASI FIRESTORE DENGAN OFFLINE PERSISTENCE
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { app, auth, googleProvider, db };