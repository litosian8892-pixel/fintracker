"use client";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Home, PieChart, Wallet, Settings, LogOut, BookUser, Eye, EyeOff } from "lucide-react";

interface SidebarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: "home" | "reports" | "assets" | "settings" | "debts") => void;
  onLogout: () => void;
  isPrivacyMode?: boolean;
  togglePrivacyMode?: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, isPrivacyMode, togglePrivacyMode }: SidebarProps) {
  const [greeting, setGreeting] = useState({ text: "Halo", icon: "👋" });

  // Efek Sapaan Cerdas Berdasarkan Waktu
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setGreeting({ text: "Pagi", icon: "☀️" });
    else if (hour >= 11 && hour < 15) setGreeting({ text: "Siang", icon: "🌤️" });
    else if (hour >= 15 && hour < 18) setGreeting({ text: "Sore", icon: "⛅" });
    else setGreeting({ text: "Malam", icon: "🌙" });
  }, []);

  const firstName = user?.displayName?.split(" ")[0] || "Pengguna";
  const triggerHaptic = () => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); };

  const navItems = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "reports", label: "Laporan", icon: PieChart },
    { id: "debts", label: "Utang & Tagihan", icon: BookUser },
    { id: "assets", label: "Aset & Akun", icon: Wallet },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ] as const;

  return (
    // Panel Sidebar dengan efek Glassmorphism (Backdrop Blur)
    <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 fixed h-full z-40 justify-between p-6 shadow-[4px_0_24px_rgb(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgb(0,0,0,0.2)] transition-colors duration-300 print:hidden">
      
      <div className="space-y-10">
        {/* BRANDING LOGO */}
        <div className="flex items-center gap-3 select-none px-2 mt-2">
          <img 
            src="/android-chrome-192x192.png?v=4" 
            alt="Fintracker Logo" 
            className="w-9 h-9 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 bg-white" 
          />
          <div className="text-2xl font-black tracking-tighter italic mt-0.5">
            <span className="text-slate-800 dark:text-white">FIN</span>
            <span className="text-blue-600 dark:text-blue-500">TRACKER</span>
          </div>
        </div>

        {/* MENU NAVIGASI */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => { triggerHaptic(); setActiveTab(item.id); }} 
                className={`group flex items-center gap-4 p-4 rounded-2xl text-xs font-black tracking-wide transition-all duration-300 cursor-pointer active:scale-95 ${
                  isActive 
                    ? "bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm border border-white/50 dark:border-blue-800/30" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-100 border border-transparent"
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* PROFIL & AKSI BAWAH */}
      <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-5 pb-2 flex items-center justify-between">
        
        {/* AVATAR & SAPAAN DINAMIS */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img 
              src={user?.photoURL || ""} 
              className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover bg-slate-100 dark:bg-slate-800" 
              alt="Avatar"
            />
            {/* Indikator Online Premium */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none mb-1">
              <span>{greeting.icon}</span> Selamat {greeting.text}
            </span>
            <span className="text-sm font-black text-slate-800 dark:text-white leading-none truncate max-w-[90px]">
              {firstName}
            </span>
          </div>
        </div>
        
        {/* TOMBOL AKSI (PRIVASI & LOGOUT) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => { triggerHaptic(); togglePrivacyMode?.(); }} 
            className={`p-2 rounded-xl transition-all duration-300 active:scale-90 cursor-pointer flex items-center justify-center ${
              isPrivacyMode 
                ? 'bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow-inner' 
                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Sembunyikan Saldo"
          >
            {isPrivacyMode ? <EyeOff size={18} strokeWidth={2.5}/> : <Eye size={18} strokeWidth={2.5}/>}
          </button>

          <button 
            onClick={() => { triggerHaptic(); onLogout(); }} 
            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-red-50/80 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 active:scale-90 cursor-pointer flex items-center justify-center"
            title="Keluar"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
        
      </div>
    </aside>
  );
}