"use client";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { LogOut, Eye, EyeOff } from "lucide-react";

interface MobileHeaderProps {
  user: User | null;
  onLogout: () => void;
  isPrivacyMode?: boolean;
  togglePrivacyMode?: () => void;
}

export default function MobileHeader({ user, onLogout, isPrivacyMode, togglePrivacyMode }: MobileHeaderProps) {
  const [greeting, setGreeting] = useState({ text: "Halo", icon: "👋" });
  const [isOnline, setIsOnline] = useState(true);

  // Efek untuk menentukan sapaan berdasarkan jam lokal pengguna (Anti UTC Bug)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setGreeting({ text: "Selamat Pagi", icon: "☀️" });
    else if (hour >= 11 && hour < 15) setGreeting({ text: "Selamat Siang", icon: "🌤️" });
    else if (hour >= 15 && hour < 18) setGreeting({ text: "Selamat Sore", icon: "⛅" });
    else setGreeting({ text: "Selamat Malam", icon: "🌙" });
  }, []);

  // Efek untuk memantau status Sinkronisasi PWA (Offline/Online)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Set initial status
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Mengambil kata pertama dari nama pengguna untuk sapaan
  const firstName = user?.displayName?.split(" ")[0] || "Pengguna";

  const triggerHaptic = () => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); };

  return (
    // Header melayang (Sticky) dengan efek Glassmorphism (Backdrop Blur)
    <header className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 pt-4 pb-3 transition-colors duration-300 print:hidden shadow-sm">
      <div className="flex items-center justify-between">
        
        {/* SISI KIRI: AVATAR & SAPAAN DINAMIS */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" title={isOnline ? "Online (Tersinkronisasi)" : "Offline (Data Lokal)"}>
            <img 
              src={user?.photoURL || ""} 
              className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover bg-slate-100 dark:bg-slate-800" 
              alt="Avatar"
            />
            {/* Indikator Online/Offline Premium (Discord Style) */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full transition-colors duration-500 z-10 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></div>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-transparent rounded-full animate-ping bg-emerald-500/60 z-0"></div>
            )}
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none mb-1">
              <span>{greeting.icon}</span> {greeting.text},
            </span>
            <span className="text-sm font-black text-slate-800 dark:text-white leading-none truncate max-w-[140px]">
              {firstName}
            </span>
          </div>
        </div>

        {/* SISI KANAN: AKSI (PRIVASI & LOGOUT) */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Tombol Privasi */}
          <button 
            onClick={() => { triggerHaptic(); togglePrivacyMode?.(); }} 
            className={`p-2.5 rounded-full transition-all duration-300 active:scale-90 cursor-pointer flex items-center justify-center ${
              isPrivacyMode 
                ? 'bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-inner' 
                : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80'
            }`}
            title="Sembunyikan Saldo"
          >
            {isPrivacyMode ? <EyeOff size={18} strokeWidth={2.5}/> : <Eye size={18} strokeWidth={2.5}/>}
          </button>
          
          {/* Tombol Logout */}
          <button 
            onClick={() => { triggerHaptic(); onLogout(); }} 
            className="p-2.5 rounded-full bg-red-50/80 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-300 active:scale-90 cursor-pointer flex items-center justify-center"
            title="Keluar"
          >
            <LogOut size={18} strokeWidth={2.5}/>
          </button>
        </div>

      </div>
    </header>
  );
}