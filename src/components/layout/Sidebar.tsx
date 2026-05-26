"use client";
import { User } from "firebase/auth";
import { Home, PieChart, Wallet, Settings, LogOut, BookUser } from "lucide-react";

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: "home" | "reports" | "assets" | "settings" | "debts") => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-30 justify-between p-6 shadow-sm">
      <div className="space-y-8">
        <div className="text-2xl font-black text-blue-600 tracking-tighter italic">FINTRACKER</div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab("home")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "home" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}><Home size={18} /><span>Beranda</span></button>
          <button onClick={() => setActiveTab("reports")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "reports" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}><PieChart size={18} /><span>Laporan</span></button>
          <button onClick={() => setActiveTab("debts")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "debts" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}><BookUser size={18} /><span>Utang Piutang</span></button>
          <button onClick={() => setActiveTab("assets")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "assets" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}><Wallet size={18} /><span>Aset & Akun</span></button>
          <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "settings" ? "bg-blue-50 text-blue-600 animate-in" : "text-slate-400 hover:bg-slate-50"}`}><Settings size={18} /><span>Setting</span></button>
        </nav>
      </div>
      <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={user?.photoURL || ""} className="w-8 h-8 rounded-full border border-blue-500 shadow-sm" alt="Avatar"/>
          <p className="text-xs font-black text-slate-800 truncate max-w-[110px]">{user?.displayName?.split(" ")[0]}</p>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50"><LogOut size={16} /></button>
      </div>
    </aside>
  );
}