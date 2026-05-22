"use client";
import { User } from "firebase/auth";
import { LogOut } from "lucide-react";

interface MobileHeaderProps {
  user: User | null;
  onLogout: () => void;
}

export default function MobileHeader({ user, onLogout }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white p-6 flex justify-between items-center shadow-sm border-b sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <img src={user?.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-blue-500" alt="Avatar"/>
        <p className="font-bold text-sm">Halo, {user?.displayName?.split(' ')[0]}!</p>
      </div>
      <button onClick={onLogout} className="text-slate-300 hover:text-red-500">
        <LogOut size={20}/>
      </button>
    </div>
  );
}