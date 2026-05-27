import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Ganti persistentMultipleTabManager dengan persistentSingleTabManager untuk kestabilan HP
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";

// Konfigurasi Fintracker Anda
const firebaseConfig = {
  apiKey: "AIzaSyBBx2uPsPJXqj4iaknqtPA0QwDNZGrXcyQ",
  authDomain: "fintrackcer.firebaseapp.com",
  projectId: "fintrackcer",
  storageBucket: "fintrackcer.firebasestorage.app",
  messagingSenderId: "885698662774",
  appId: "1:885698662774:web:27bb9c724b3ead014c2a57",
  measurementId: "G-84CSRWRDED"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// INISIALISASI FIRESTORE DENGAN SINGLE TAB PERSISTENCE (Solusi Anti-Freeze / Hang di HP)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
});

export { app, auth, googleProvider, db };