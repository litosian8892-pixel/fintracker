"use client";
import { User } from "firebase/auth";
import { LogOut } from "lucide-react";

interface MobileHeaderProps {
  user: User | null;
  onLogout: () => void;
}

export default function MobileHeader({ user, onLogout }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white dark:bg-slate-900 p-6 flex justify-between items-center shadow-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <img src={user?.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-blue-500" alt="Avatar"/>
        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">Halo, {user?.displayName?.split(' ')[0]}!</p>
      </div>
      <button onClick={onLogout} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-450 transition-colors cursor-pointer">
        <LogOut size={20}/>
      </button>
    </div>
  );
}