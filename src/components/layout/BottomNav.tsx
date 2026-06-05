"use client";
import { Home, PieChart, Wallet, Settings, BookUser } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: "home" | "reports" | "assets" | "settings" | "debts") => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const navItems = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "reports", label: "Laporan", icon: PieChart },
    { id: "debts", label: "Utang/Tagihan", icon: BookUser },
    { id: "assets", label: "Aset", icon: Wallet },
    { id: "settings", label: "Setting", icon: Settings },
  ] as const;

  return (
    // Wrapper fixed untuk menciptakan ruang (margin) di kiri, kanan, dan bawah agar melayang
    <div className="md:hidden fixed bottom-5 left-4 right-4 z-50 print:hidden">
      
      {/* Kontainer bergaya Glassmorphism dengan Blur tebal */}
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
              {/* Latar belakang indikator aktif berbentuk pil/bulat melengkung */}
              <div className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                isActive 
                  ? "bg-blue-100/80 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
              }`}>
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={isActive ? "fill-blue-600/20 dark:fill-blue-400/20" : ""} 
                />
              </div>
              
              <span className={`text-[9px] tracking-tight transition-all duration-300 ${
                isActive 
                  ? "font-black text-blue-600 dark:text-blue-400" 
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