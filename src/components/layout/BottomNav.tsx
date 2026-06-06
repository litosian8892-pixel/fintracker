"use client";
import { useState, useEffect } from "react";
import { Home, PieChart, Wallet, Settings, BookUser } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: "home" | "reports" | "assets" | "settings" | "debts") => void;
}

// PEMETAAN SEMANTIK WARNA AKSEN NAVIGASI BAWAH (100% Standar Tailwind v4 & Kontras Tinggi)
const themeMap = {
  blue: {
    activeBg: "bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm",
    hoverBg: "hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
    activeText: "text-blue-600 dark:text-blue-400",
    fillColor: "fill-blue-600/20 dark:fill-blue-400/20",
  },
  emerald: {
    activeBg: "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shadow-sm",
    hoverBg: "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20",
    activeText: "text-emerald-600 dark:text-emerald-400",
    fillColor: "fill-emerald-600/20 dark:fill-emerald-400/20",
  },
  purple: {
    activeBg: "bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shadow-sm",
    hoverBg: "hover:bg-purple-50/50 dark:hover:bg-purple-900/20",
    activeText: "text-purple-600 dark:text-purple-400",
    fillColor: "fill-purple-600/20 dark:fill-purple-400/20",
  },
  amber: {
    activeBg: "bg-amber-100/80 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shadow-sm",
    hoverBg: "hover:bg-amber-50/50 dark:hover:bg-amber-900/20",
    activeText: "text-amber-600 dark:text-amber-400",
    fillColor: "fill-amber-600/20 dark:fill-amber-400/20",
  },
  rose: {
    activeBg: "bg-rose-100/80 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shadow-sm",
    hoverBg: "hover:bg-rose-50/50 dark:hover:bg-rose-900/20",
    activeText: "text-rose-600 dark:text-rose-400",
    fillColor: "fill-rose-600/20 dark:fill-rose-400/20",
  }
} as const;

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const [accent, setAccent] = useState<keyof typeof themeMap>("blue");

  // Dengarkan perubahan warna aksen secara real-time dari SettingsTab [1]
  useEffect(() => {
    const updateAccent = () => {
      const stored = localStorage.getItem("fintracker_accent") as any;
      if (stored && ["blue", "emerald", "purple", "amber", "rose"].includes(stored)) {
        setAccent(stored);
      }
    };
    updateAccent();
    window.addEventListener("accent_color_changed", updateAccent);
    return () => window.removeEventListener("accent_color_changed", updateAccent);
  }, []);

  const navItems = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "reports", label: "Laporan", icon: PieChart },
    { id: "debts", label: "Utang/Tagihan", icon: BookUser },
    { id: "assets", label: "Aset", icon: Wallet },
    { id: "settings", label: "Setting", icon: Settings },
  ] as const;

  const currentTheme = themeMap[accent];

  return (
    <div className="md:hidden fixed bottom-5 left-4 right-4 z-50 print:hidden">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 px-2 py-2 flex justify-between items-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-[28px]">
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)} 
              className="relative flex flex-col items-center justify-center flex-1 gap-1 py-1 transition-all duration-300 cursor-pointer active:scale-90"
            >
              <div className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                isActive 
                  ? currentTheme.activeBg 
                  : `text-slate-400 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 ${currentTheme.hoverBg}`
              }`}>
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? currentTheme.fillColor : ""} 
                />
              </div>
              
              <span className={`text-[9px] tracking-tight transition-all duration-300 ${
                isActive 
                  ? `font-black ${currentTheme.activeText}` 
                  : "font-bold text-slate-400 dark:text-slate-500"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}