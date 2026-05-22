"use client";
import { Home, PieChart, Wallet, Settings } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: "home" | "reports" | "assets" | "settings") => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 pb-safe shadow-lg">
      <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-blue-600" : "text-slate-400"}`}>
        <Home size={22} className={activeTab === "home" ? "fill-blue-100" : ""} />
        <span className="text-[10px] font-bold">Beranda</span>
      </button>
      <button onClick={() => setActiveTab("reports")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "reports" ? "text-blue-600" : "text-slate-400"}`}>
        <PieChart size={22} className={activeTab === "reports" ? "fill-blue-100" : ""} />
        <span className="text-[10px] font-bold">Laporan</span>
      </button>
      <button onClick={() => setActiveTab("assets")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "assets" ? "text-blue-600" : "text-slate-400"}`}>
        <Wallet size={22} className={activeTab === "assets" ? "fill-blue-100" : ""} />
        <span className="text-[10px] font-bold">Aset</span>
      </button>
      <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "settings" ? "text-blue-600" : "text-slate-400"}`}>
        <Settings size={22} className={activeTab === "settings" ? "fill-blue-100" : ""} />
        <span className="text-[10px] font-bold">Setting</span>
      </button>
    </nav>
  );
}