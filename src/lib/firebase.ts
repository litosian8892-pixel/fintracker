import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Import single tab manager untuk kestabilan di HP
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";

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

import { getFirestore } from "firebase/firestore";

// INISIALISASI FIRESTORE DENGAN PROTEKSI NEXT.JS SSR (Server-Side Rendering)
let db: ReturnType<typeof getFirestore>;

if (typeof window !== "undefined") {
  // Mode Client / PWA HP: Aktifkan Offline-First IndexedDB
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({ forceOwnership: true }) })
    });
  } catch (error) {
    // Fallback jika tab manager sudah terinisialisasi sebelumnya (Hot-Reload React)
    db = getFirestore(app);
  }
} else {
  // Mode Server / Vercel Build: Gunakan Firestore standar tanpa memori offline
  db = getFirestore(app);
}

export { app, auth, googleProvider, db };