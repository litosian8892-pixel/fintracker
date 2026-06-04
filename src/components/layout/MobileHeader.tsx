"use client";
import { User } from "firebase/auth";
import { LogOut } from "lucide-react";

interface MobileHeaderProps {
  user: User | null;
  onLogout: () => void;
}

export default function MobileHeader({ user, onLogout }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white dark:bg-slate-900 px-5 py-4 flex justify-between items-center shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors duration-200">
      
      {/* SISI KIRI: BRANDING LOGO & NAMA APLIKASI */}
      <div className="flex items-center gap-2.5 select-none">
        <img 
          src="/android-chrome-192x192.png?v=4" 
          alt="Fintracker Logo" 
          className="w-8 h-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800" 
        />
        <div className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tighter italic mt-0.5">
          FINTRACKER
        </div>
      </div>

      {/* SISI KANAN: FOTO PROFIL & TOMBOL LOGOUT */}
      <div className="flex items-center gap-3">
        <img 
          src={user?.photoURL || ""} 
          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm object-cover" 
          alt="Avatar"
        />
        
        {/* Garis Pembatas (Divider) */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700"></div> 
        
        <button 
          onClick={onLogout} 
          className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut size={18}/>
        </button>
      </div>

    </div>
  );
}