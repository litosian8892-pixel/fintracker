import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Konfigurasi asli Fintracker Anda
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

// INISIALISASI FIRESTORE DENGAN OFFLINE PERSISTENCE (PWA)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { app, auth, googleProvider, db };