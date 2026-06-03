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
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full z-30 justify-between p-6 shadow-sm transition-colors duration-200">
      <div className="space-y-8">
        <div className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter italic select-none">FINTRACKER</div>
        <nav className="flex flex-col gap-2">
          {/* SINKRONISASI KELAS HOVER BEBAS DARI ERROR KUSTOM WEIGHTS 850 */}
          <button 
            onClick={() => setActiveTab("home")} 
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer ${
              activeTab === "home" 
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-900/30" 
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            <Home size={18} />
            <span>Beranda</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("reports")} 
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer ${
              activeTab === "reports" 
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-900/30" 
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            <PieChart size={18} />
            <span>Laporan</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("debts")} 
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer ${
              activeTab === "debts" 
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-900/30" 
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            <BookUser size={18} />
            {/* --- BERUBAH: DARI "Utang Piutang" MENJADI "Utang & Tagihan" --- */}
            <span>Utang & Tagihan</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("assets")} 
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer ${
              activeTab === "assets" 
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-900/30" 
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            <Wallet size={18} />
            <span>Aset & Akun</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("settings")} 
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all cursor-pointer ${
              activeTab === "settings" 
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-900/30" 
                : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-white"
            }`}
          >
            <Settings size={18} />
            <span>Setting</span>
          </button>
        </nav>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={user?.photoURL || ""} className="w-8 h-8 rounded-full border border-blue-500 shadow-sm" alt="Avatar"/>
          <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[110px]">{user?.displayName?.split(" ")[0]}</p>
        </div>
        <button onClick={onLogout} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/35 transition-colors cursor-pointer"><LogOut size={16} /></button>
      </div>
    </aside>
  );
}