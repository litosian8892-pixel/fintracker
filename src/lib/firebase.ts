import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBx2uPsPJXqj4iaknqtPA0QwDNZGrXcyQ",
  authDomain: "fintrackcer.firebaseapp.com",
  projectId: "fintrackcer",
  storageBucket: "fintrackcer.firebasestorage.app",
  messagingSenderId: "885698662774",
  appId: "1:885698662774:web:27bb9c724b3ead014c2a57",
  measurementId: "G-84CSRWRDED"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();