"use client";

// Perhatikan bagian "from" di bawah ini, menggunakan ../../ untuk mundur ke folder src
import { auth, googleProvider } from "../../lib/firebase"; 
import { signInWithPopup } from "firebase/auth";

export default function AuthScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <button 
        onClick={() => signInWithPopup(auth, googleProvider)} 
        className="bg-white py-4 px-8 rounded-2xl font-bold flex gap-3 items-center"
      >
        <img 
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
          className="w-5 h-5" 
          alt="Google Logo"
        /> 
        Masuk Google
      </button>
    </div>
  );
}