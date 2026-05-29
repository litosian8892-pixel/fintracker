"use client";
import { Home, PieChart, Wallet, Settings, BookUser } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: "home" | "reports" | "assets" | "settings" | "debts") => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center z-50 pb-safe shadow-lg transition-colors duration-200">
      <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === "home" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
        <Home size={20} className={activeTab === "home" ? "fill-blue-100 dark:fill-blue-950/40" : ""} />
        <span className="text-[9px] font-bold">Beranda</span>
      </button>
      <button onClick={() => setActiveTab("reports")} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === "reports" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
        <PieChart size={20} className={activeTab === "reports" ? "fill-blue-100 dark:fill-blue-950/40" : ""} />
        <span className="text-[9px] font-bold">Laporan</span>
      </button>
      <button onClick={() => setActiveTab("debts")} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === "debts" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
        <BookUser size={20} className={activeTab === "debts" ? "fill-blue-100 dark:fill-blue-950/40" : ""} />
        <span className="text-[9px] font-bold">Utang</span>
      </button>
      <button onClick={() => setActiveTab("assets")} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === "assets" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
        <Wallet size={20} className={activeTab === "assets" ? "fill-blue-100 dark:fill-blue-950/40" : ""} />
        <span className="text-[9px] font-bold">Aset</span>
      </button>
      <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${activeTab === "settings" ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
        <Settings size={20} className={activeTab === "settings" ? "fill-blue-100 dark:fill-blue-950/40" : ""} />
        <span className="text-[9px] font-bold">Setting</span>
      </button>
    </nav>
  );
}