"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Upload, Check, X, ArrowUp, ArrowDown, Edit2, Trash2, CreditCard, Smartphone, Banknote, Wallet, Briefcase, Plus, ChevronLeft, TrendingDown, TrendingUp, ChevronRight, Activity, LayoutGrid, List, BarChart3, ArrowRightLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart as RePieChart, Pie, Cell } from "recharts";
import { AccountData, WalletTypeData, TransactionData } from "../../types";

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#0ea5e9', '#6366f1', '#d946ef', '#f43f5e'];

const themeMap = {
  blue: {
    activeBg: "bg-blue-900 text-white shadow-sm",
    text: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-100 dark:border-blue-900/40",
    activePill: "bg-blue-600 border-blue-600 text-white shadow-blue-500/10",
    fab: "bg-blue-900 text-white shadow-[0_10px_25px_rgba(30,58,138,0.5)] border-blue-800/30",
    progressActive: "bg-blue-900 dark:bg-blue-500",
    payAccSelected: "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-blue-500/5",
    auditBox: "bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30"
  },
  emerald: {
    activeBg: "bg-emerald-600 text-white shadow-sm",
    text: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-100 dark:border-emerald-900/40",
    activePill: "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/10",
    fab: "bg-emerald-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.5)] border-emerald-500/30",
    progressActive: "bg-emerald-600 dark:bg-emerald-500",
    payAccSelected: "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-emerald-500/5",
    auditBox: "bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
  },
  purple: {
    activeBg: "bg-purple-600 text-white shadow-sm",
    text: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-900/30",
    border: "border-purple-100 dark:border-purple-900/40",
    activePill: "bg-purple-600 border-purple-600 text-white shadow-purple-500/10",
    fab: "bg-purple-600 text-white shadow-[0_10px_25px_rgba(168,85,247,0.5)] border-purple-500/30",
    progressActive: "bg-purple-600 dark:bg-purple-500",
    payAccSelected: "border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 shadow-purple-500/5",
    auditBox: "bg-purple-50/50 dark:bg-purple-900/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30"
  },
  amber: {
    activeBg: "bg-amber-600 text-white shadow-sm",
    text: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-100 dark:border-amber-900/40",
    activePill: "bg-amber-600 border-amber-600 text-white shadow-amber-500/10",
    fab: "bg-amber-600 text-white shadow-[0_10px_25px_rgba(217,119,6,0.5)] border-amber-500/30",
    progressActive: "bg-amber-600 dark:bg-amber-500",
    payAccSelected: "border-amber-600 bg-amber-50/50 dark:bg-amber-900/20 shadow-amber-500/5",
    auditBox: "bg-amber-50/50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30"
  },
  rose: {
    activeBg: "bg-rose-600 text-white shadow-sm",
    text: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-50 dark:bg-rose-900/30",
    border: "border-rose-100 dark:border-rose-900/40",
    activePill: "bg-rose-600 border-rose-600 text-white shadow-rose-500/10",
    fab: "bg-rose-600 text-white shadow-[0_10px_25px_rgba(244,63,94,0.5)] border-rose-500/30",
    progressActive: "bg-rose-600 dark:bg-rose-500",
    payAccSelected: "border-rose-600 bg-rose-50/50 dark:bg-rose-900/20 shadow-rose-500/5",
    auditBox: "bg-rose-50/50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30"
  }
} as const;

const getCardDesign = (type: string, isInvest?: boolean) => {
  const t = type.toLowerCase();
  if (isInvest || t.includes("invest") || t.includes("crypto") || t.includes("saham")) {
    return { bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", icon: <BarChart3 size={18} className="text-amber-500 dark:text-amber-400" />, iconBg: "bg-amber-50 dark:bg-amber-900/50", chip: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", progressBar: "bg-amber-500" };
  } else if (t.includes("bank") || t.includes("kartu") || t.includes("credit") || t.includes("savings")) {
    return { bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", icon: <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />, iconBg: "bg-blue-50 dark:bg-blue-900/50", chip: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", progressBar: "bg-blue-500" };
  } else if (t.includes("wallet") || t.includes("gopay") || t.includes("ovo") || t.includes("dana") || t.includes("pay")) {
    return { bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", icon: <Smartphone size={18} className="text-purple-600 dark:text-purple-400" />, iconBg: "bg-purple-50 dark:bg-purple-900/50", chip: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400", progressBar: "bg-purple-500" };
  } else if (t.includes("cash") || t.includes("dompet") || t.includes("tunai")) {
    return { bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", icon: <Banknote size={18} className="text-emerald-600" />, iconBg: "bg-emerald-50 dark:bg-emerald-900/50", chip: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", progressBar: "bg-emerald-500" };
  } else {
    return { bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", icon: <Wallet size={18} className="text-slate-600 dark:text-slate-400" />, iconBg: "bg-slate-50 dark:bg-slate-800/50", chip: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400", progressBar: "bg-slate-500" };
  }
};

const getCurrencySymbol = (cur?: string) => {
  if (!cur) return "Rp";
  const up = cur.toUpperCase();
  switch (up) { 
    case "USD": return "$"; case "SGD": return "S$"; case "EUR": return "€"; 
    case "JPY": case "CNY": return "¥"; case "GBP": return "£"; case "AUD": return "A$"; 
    case "MYR": return "RM"; case "SAR": return "SR"; 
    case "BTC": return "₿"; case "ETH": return "⟠"; case "GOLD": case "GRAM": return "g"; case "LOT": return "Lot";
    default: return up === "IDR" ? "Rp" : up; 
  }
};

const formatCurrencyTerbaca = (val: string | number, currencyCode?: string) => {
  if (!val && val !== 0) return `${getCurrencySymbol(currencyCode)} 0`;
  const parsed = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(parsed)) return `${getCurrencySymbol(currencyCode)} 0`;
  const code = currencyCode || "IDR";
  if (["BTC", "ETH", "GRAM", "LOT"].includes(code.toUpperCase())) {
    return `${getCurrencySymbol(code)} ${parsed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })}`;
  }
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: code.toUpperCase() === "IDR" ? "IDR" : code.toUpperCase(), minimumFractionDigits: 0, maximumFractionDigits: code.toUpperCase() === "IDR" ? 0 : 2 }).format(parsed);
};

const safeEvaluate = (expr: string): number => {
  if (!expr) return 0;
  let sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return 0;
  sanitized = sanitized.replace(/[+\-*/(.]*$/, "");
  if (!sanitized) return 0;
  try {
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result === "number" && isFinite(result)) return result;
    return 0;
  } catch {
    const fallback = parseFloat(sanitized);
    return isNaN(fallback) ? 0 : fallback;
  }
};

const generateGradientStops = (data: any[], dataKey: string) => {
  if (!data || data.length < 2) return [];
  const stops = [];
  const totalPoints = data.length;
  for (let i = 1; i < totalPoints; i++) {
    const prevVal = data[i - 1][dataKey] || 0;
    const currVal = data[i][dataKey] || 0;
    const segmentColor = currVal >= prevVal ? "#10b981" : "#ef4444";
    const prevOffset = `${((i - 1) / (totalPoints - 1)) * 100}%`;
    const currOffset = `${(i / (totalPoints - 1)) * 100}%`;
    stops.push({ offset: prevOffset, color: segmentColor });
    stops.push({ offset: currOffset, color: segmentColor });
  }
  return stops;
};

interface AssetsTabProps {
  accounts: AccountData[]; walletTypes: WalletTypeData[];
  accType: string; setAccType: (val: string) => void; accName: string; setAccName: (val: string) => void; accBalance: string; setAccBalance: (val: string) => void;
  accLogo: string; handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit?: boolean) => void;
  accIsSavings: boolean; setAccIsSavings: (val: boolean) => void; accTargetBalance: string; setAccTargetBalance: (val: string) => void;
  accExcludeFromTotal: boolean; setAccExcludeFromTotal: (val: boolean) => void; editAccExcludeFromTotal: boolean; setEditAccExcludeFromTotal: (val: boolean) => void;
  accIsBusiness: boolean; setAccIsBusiness: (val: boolean) => void; editAccIsBusiness: boolean; setEditAccIsBusiness: (val: boolean) => void;
  handleCreateAccount: () => void; editingAccId: string | null; setEditingAccId: (val: string | null) => void;
  editAccName: string; setEditAccName: (val: string) => void; editAccBalance: string; setEditAccBalance: (val: string) => void; editAccLogo: string; setEditAccLogo: (val: string) => void;
  editAccIsSavings: boolean; setEditAccIsSavings: (val: boolean) => void; editAccTargetBalance: string; setEditAccTargetBalance: (val: string) => void;
  handleEditAccount: (id: string) => void; deleteAccount: (id: string, name: string) => void; moveAccountOrder: (index: number, direction: "up" | "down") => void;
  accSavingsGoalTitle: string; setAccSavingsGoalTitle: (val: string) => void; editAccSavingsGoalTitle: string; setEditAccSavingsGoalTitle: (val: string) => void;
  isPrivacyMode?: boolean; accCurrency?: string; setAccCurrency?: (val: string) => void; editAccCurrency?: string; setEditAccCurrency?: (val: string) => void;
  exchangeRates?: Record<string, number>; handleUpdateGlobalRates?: (rates: Record<string, number>) => void;
  reportTransactions?: TransactionData[]; reportMonth?: string; setReportMonth?: (val: string) => void;
  accIsInvestment?: boolean; setAccIsInvestment?: (val: boolean) => void; editAccIsInvestment?: boolean; setEditAccIsInvestment?: (val: boolean) => void;
  accAverageBuyPrice?: string; setAccAverageBuyPrice?: (val: string) => void; editAccAverageBuyPrice?: string; setEditAccAverageBuyPrice?: (val: string) => void;
  accLastExchangeRate?: string; setAccLastExchangeRate?: (val: string) => void; editAccLastExchangeRate?: string; setEditAccLastExchangeRate?: (val: string) => void;
  handleUpdateInvestmentRate?: (id: string, newRate: number) => void;
}

export default function AssetsTab({
  accounts, walletTypes, accType, setAccType, accName, setAccName, accBalance, setAccBalance, accLogo, handleLogoUpload,
  accIsSavings, setAccIsSavings, accTargetBalance, setAccTargetBalance, accExcludeFromTotal, setAccExcludeFromTotal, editAccExcludeFromTotal, setEditAccExcludeFromTotal,
  accIsBusiness, setAccIsBusiness, editAccIsBusiness, setEditAccIsBusiness, handleCreateAccount, editingAccId, setEditingAccId,
  editAccName, setEditAccName, editAccBalance, setEditAccBalance, editAccLogo, setEditAccLogo, editAccIsSavings, setEditAccIsSavings,
  editAccTargetBalance, setEditAccTargetBalance, handleEditAccount, deleteAccount, moveAccountOrder, accSavingsGoalTitle, setAccSavingsGoalTitle,
  editAccSavingsGoalTitle, setEditAccSavingsGoalTitle, isPrivacyMode = false, accCurrency, setAccCurrency, editAccCurrency, setEditAccCurrency,
  exchangeRates, handleUpdateGlobalRates, reportTransactions = [], reportMonth, setReportMonth,
  accIsInvestment, setAccIsInvestment, editAccIsInvestment, setEditAccIsInvestment, accAverageBuyPrice, setAccAverageBuyPrice, editAccAverageBuyPrice, setEditAccAverageBuyPrice,
  accLastExchangeRate, setAccLastExchangeRate, editAccLastExchangeRate, setEditAccLastExchangeRate, handleUpdateInvestmentRate
}: AssetsTabProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<"net_worth" | "akun" | "investasi" | "aset">("akun"); 
  const [detailAccId, setDetailAccId] = useState<string | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [walletGroup, setWalletGroup] = useState<"pribadi" | "bisnis">("pribadi");
  
  const [localAccCurrency, setLocalAccCurrency] = useState("IDR");
  const [localEditAccCurrency, setLocalEditAccCurrency] = useState("IDR");
  const [localAccIsInv, setLocalAccIsInv] = useState(false);
  const [localEditAccIsInv, setLocalEditAccIsInv] = useState(false);
  const [localAccAvgPrice, setLocalAccAvgPrice] = useState("");
  const [localEditAccAvgPrice, setLocalEditAccAvgPrice] = useState("");
  const [localAccLastRate, setLocalAccLastRate] = useState("");
  const [localEditAccLastRate, setLocalEditAccLastRate] = useState("");
  const [updatingRateAcc, setUpdatingRateAcc] = useState<AccountData | null>(null);
  const [newRateInput, setNewRateInput] = useState("");

  const [localBalanceOverride, setLocalBalanceOverride] = useState<Record<string, number>>({});
  const [localNameOverride, setLocalNameOverride] = useState<Record<string, string>>({});
  const [localInvRatesOverride, setLocalInvRatesOverride] = useState<Record<string, number>>({});

  const detailMonthScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const [accent, setAccent] = useState<keyof typeof themeMap>("blue");
  const [activeKeypad, setActiveKeypad] = useState<"balance" | "target" | "buyPrice" | "lastRate" | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 🔥 ENGINE SIHIR DRAG-AND-DROP TRANSFER 🔥
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    acc: AccountData | null;
    x: number;
    y: number;
    hoveredId: string | null;
  }>({ isDragging: false, acc: null, x: 0, y: 0, hoveredId: null });
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const startTouchPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, acc: AccountData) => {
    // Abaikan jika sedang milih detil
    if (detailAccId) return;
    
    startTouchPos.current = { x: e.clientX, y: e.clientY };
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    longPressTimer.current = setTimeout(() => {
      triggerHaptic();
      setDragState({
        isDragging: true,
        acc,
        x: e.clientX,
        y: e.clientY,
        hoveredId: null
      });
    }, 400); // 400ms tahan untuk memanggil Sihir Transfer
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.isDragging && longPressTimer.current) {
      // SENSOR JARI: Jika geser lebih dari 10px, batalkan niat klik/drag (Asumsi user sedang scroll)
      if (Math.abs(e.clientX - startTouchPos.current.x) > 10 || Math.abs(e.clientY - startTouchPos.current.y) > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent, acc: AccountData) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      
      // Jika diangkat sebelum 400ms (hanya sebuah Tap/Klik biasa)
      if (!dragState.isDragging) {
        // Double check: Pastikan jari tidak tergeser jauh sebelum dilepas
        if (Math.abs(e.clientX - startTouchPos.current.x) < 10 && Math.abs(e.clientY - startTouchPos.current.y) < 10) {
          triggerHaptic();
          setDetailAccId(acc.id);
        }
      }
    }
  };

  const handlePointerCancel = () => {
    // Dipanggil oleh HP ketika OS mengambil alih sentuhan (misal: mulai scroll cepat)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 🌍 Global Move/Up Listeners (Mencegah jari lari dari elemen)
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleGlobalMove = (e: PointerEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as PointerEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as PointerEvent).clientY;
      
      setDragState(prev => {
        if (!prev.isDragging) return prev;
        
        // Cek benturan elemen (Collision Detection)
        const elements = document.elementsFromPoint(clientX, clientY);
        const target = elements.find(el => el.getAttribute('data-acc-id') && el.getAttribute('data-acc-id') !== prev.acc?.id);
        const hoveredId = target ? target.getAttribute('data-acc-id') : null;
        
        // Haptic feedback kecil saat menabrak dompet tujuan yang sah
        if (hoveredId !== prev.hoveredId && hoveredId) triggerHaptic();
        
        return { ...prev, x: clientX, y: clientY, hoveredId };
      });
    };

    const handleGlobalUp = () => {
      setDragState(prev => {
        if (prev.isDragging && prev.hoveredId && prev.acc) {
          triggerHaptic();
          const targetAcc = accounts.find(a => a.id === prev.hoveredId);
          if (targetAcc) {
            setTimeout(() => {
              // SUNTIKKAN EVENT RAHASIA KE DALAM WINDOW (TANPA ALERT LAGI)
              window.dispatchEvent(new CustomEvent("fintracker_dnd_transfer", {
                detail: { sourceId: prev.acc!.id, destId: targetAcc.id }
              }));
            }, 100);
          }
        }
        return { isDragging: false, acc: null, x: 0, y: 0, hoveredId: null };
      });
    };

    // Kunci scroll layar saat menyeret agar mulus
    document.addEventListener('pointermove', handleGlobalMove, { passive: false });
    document.addEventListener('pointerup', handleGlobalUp);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalUp);
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.removeEventListener('pointermove', handleGlobalMove);
      document.removeEventListener('pointerup', handleGlobalUp);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalUp);
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [dragState.isDragging, accounts]);

  useEffect(() => { const handleResize = () => setIsMobile(window.innerWidth < 768); handleResize(); window.addEventListener("resize", handleResize); return () => window.removeEventListener("resize", handleResize); }, []);
  
  const handleKeypadPress = (key: string) => {
    triggerHaptic();
    let currentVal = ""; let setVal: any = null;
    if (activeKeypad === "balance") { currentVal = editingAccId ? editAccBalance : accBalance; setVal = editingAccId ? setEditAccBalance : setAccBalance; }
    else if (activeKeypad === "target") { currentVal = editingAccId ? editAccTargetBalance : accTargetBalance; setVal = editingAccId ? setEditAccTargetBalance : setAccTargetBalance; }
    else if (activeKeypad === "buyPrice") { currentVal = editingAccId ? (editAccAverageBuyPrice || "") : (accAverageBuyPrice || ""); setVal = editingAccId ? setEditAccAverageBuyPrice : setAccAverageBuyPrice; }
    else if (activeKeypad === "lastRate") { if (updatingRateAcc) { currentVal = newRateInput; setVal = setNewRateInput; } else { currentVal = editingAccId ? (editAccLastExchangeRate || "") : (accLastExchangeRate || ""); setVal = editingAccId ? setEditAccLastExchangeRate : setAccLastExchangeRate; } }
    if (!setVal) return;
    currentVal = currentVal?.toString() || "";
    if (key === "⌫") setVal(currentVal.slice(0, -1));
    else if (key === "C") setVal("");
    else if (key === "=") { const evaluated = safeEvaluate(currentVal); setVal(evaluated > 0 ? evaluated.toString() : ""); }
    else if (key === "Ya") { const evaluated = safeEvaluate(currentVal); if(currentVal) setVal(evaluated >= 0 ? evaluated.toString() : ""); setActiveKeypad(null); }
    else setVal(currentVal + key);
  };

  useEffect(() => { if (detailAccId) { const timer = setTimeout(() => { if (detailMonthScrollRef.current) detailMonthScrollRef.current.scrollLeft = detailMonthScrollRef.current.scrollWidth; }, 50); return () => clearTimeout(timer); } }, [detailAccId]);
  useEffect(() => { if (activeSubTab === "aset" || activeSubTab === "investasi") { const timer = setTimeout(() => { if (monthScrollRef.current) monthScrollRef.current.scrollLeft = monthScrollRef.current.scrollWidth; }, 50); return () => clearTimeout(timer); } }, [activeSubTab]);
  useEffect(() => { const updateAccent = () => { const stored = localStorage.getItem("fintracker_accent") as any; if (stored && ["blue", "emerald", "purple", "amber", "rose"].includes(stored)) setAccent(stored); }; updateAccent(); window.addEventListener("accent_color_changed", updateAccent); return () => window.removeEventListener("accent_color_changed", updateAccent); }, []);
  const triggerHaptic = () => { if (typeof window !== "undefined" && localStorage.getItem("fintracker_haptic") !== "false") { if (navigator.vibrate) navigator.vibrate(15); try { const AudioCtx = window.AudioContext || (window as any).webkitAudioContext; if (!AudioCtx) return; const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = "sine"; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05); gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05); } catch (e) {} } };

  const currency = accCurrency !== undefined ? accCurrency : localAccCurrency; const setCurrency = setAccCurrency !== undefined ? setAccCurrency : setLocalAccCurrency;
  const editCurrency = editAccCurrency !== undefined ? editAccCurrency : localEditAccCurrency; const setEditCurrency = setEditAccCurrency !== undefined ? setEditAccCurrency : setLocalEditAccCurrency;
  const isInv = accIsInvestment !== undefined ? accIsInvestment : localAccIsInv; const setIsInv = setAccIsInvestment !== undefined ? setAccIsInvestment : setLocalAccIsInv;
  const editIsInv = editAccIsInvestment !== undefined ? editAccIsInvestment : localEditAccIsInv; const setEditIsInv = setEditAccIsInvestment !== undefined ? setEditAccIsInvestment : setLocalEditAccIsInv;
  const avgPrice = accAverageBuyPrice !== undefined ? accAverageBuyPrice : localAccAvgPrice; const setAvgPrice = setAccAverageBuyPrice !== undefined ? setAccAverageBuyPrice : setLocalAccAvgPrice;
  const editAvgPrice = editAccAverageBuyPrice !== undefined ? editAccAverageBuyPrice : localEditAccAvgPrice; const setEditAvgPrice = setEditAccAverageBuyPrice !== undefined ? setEditAccAverageBuyPrice : setLocalEditAccAvgPrice;
  const lastRate = accLastExchangeRate !== undefined ? accLastExchangeRate : localAccLastRate; const setLastRate = setAccLastExchangeRate !== undefined ? setAccLastExchangeRate : setLocalAccLastRate;
  const editLastRate = editAccLastExchangeRate !== undefined ? editAccLastExchangeRate : localEditAccLastRate; const setEditLastRate = setEditAccLastExchangeRate !== undefined ? setEditAccLastExchangeRate : setLocalEditAccLastRate;

  useEffect(() => { if (editingAccId) setIsManageOpen(true); }, [editingAccId]);
  const getRate = (curCode?: string, historicalRate?: number, accountId?: string) => { if (accountId && localInvRatesOverride[accountId] !== undefined) return localInvRatesOverride[accountId]; if (historicalRate) return historicalRate; if (!curCode || curCode === "IDR") return 1; if (exchangeRates && exchangeRates[curCode] !== undefined) return exchangeRates[curCode]; return 1; };

  const renderAreaChart = (data: any[], defaultColor: string, dataKey: string) => {
    const strokeGradientId = `strokeGeom${dataKey}${defaultColor.replace('#', '')}`;
    const stops = generateGradientStops(data, dataKey);
    return (
      <div className="h-40 w-full relative z-10 -ml-2 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
                {stops.map((stop, index) => <stop key={index} offset={stop.offset} stopColor={stop.color} />)}
              </linearGradient>
              <linearGradient id={`areaNeutralGradient${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: "bold" }} tickLine={false} axisLine={false} minTickGap={30} dy={10} />
            <YAxis hide domain={['dataMin - 100000', 'dataMax + 100000']} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} formatter={(val: any) => `Rp ${Number(val).toLocaleString('id-ID')}`} />
            <Area type="monotone" dataKey={dataKey} stroke={`url(#${strokeGradientId})`} strokeWidth={3} fillOpacity={1} fill={`url(#areaNeutralGradient${dataKey})`} activeDot={{ r: 6, fill: "#ffffff", stroke: "#1e3a8a", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const updatedAccounts = accounts.map(a => { let balance = a.balance; let name = a.name; let overrideRate = a.lastExchangeRate; if (localBalanceOverride[a.id] !== undefined) balance = localBalanceOverride[a.id]; if (localNameOverride[a.id] !== undefined) name = localNameOverride[a.id]; if (localInvRatesOverride[a.id] !== undefined) overrideRate = localInvRatesOverride[a.id]; return { ...a, balance, name, lastExchangeRate: overrideRate }; });
  const personalActiveAccounts = updatedAccounts.filter(a => !a.isSavings && !a.isBusiness && !a.isInvestment);
  const businessActiveAccounts = updatedAccounts.filter(a => !a.isSavings && a.isBusiness && !a.isInvestment);
  const investmentAccounts = updatedAccounts.filter(a => a.isInvestment);
  const emergencyAccounts = updatedAccounts.filter(a => a.isSavings && !a.savingsGoalTitle && !a.isInvestment);
  const dreamGoals = updatedAccounts.filter(a => a.isSavings && a.savingsGoalTitle && !a.isInvestment);
  const detailAcc = useMemo(() => updatedAccounts.find(a => a.id === detailAccId), [updatedAccounts, detailAccId]);
  const totalPersonal = personalActiveAccounts.reduce((sum, curr) => curr.excludeFromTotal ? sum : sum + (curr.balance * getRate(curr.currency, curr.lastExchangeRate, curr.id)), 0);
  const totalBusiness = businessActiveAccounts.reduce((sum, curr) => sum + (curr.balance * getRate(curr.currency, curr.lastExchangeRate, curr.id)), 0);
  const totalInvestment = investmentAccounts.reduce((sum, curr) => sum + (curr.balance * getRate(curr.currency, curr.lastExchangeRate, curr.id)), 0);
  const totalAssets = emergencyAccounts.reduce((sum, curr) => sum + (curr.balance * getRate(curr.currency, curr.lastExchangeRate, curr.id)), 0) + dreamGoals.reduce((sum, curr) => sum + (curr.balance * getRate(curr.currency, curr.lastExchangeRate, curr.id)), 0);
  const totalActiveBalance = totalPersonal + totalBusiness;
  const activeAccountIds = useMemo(() => new Set(personalActiveAccounts.concat(businessActiveAccounts).map(a => a.id)), [personalActiveAccounts, businessActiveAccounts]);
  const assetAccountIds = useMemo(() => new Set(emergencyAccounts.concat(dreamGoals).map(a => a.id)), [emergencyAccounts, dreamGoals]);

  const historicalNetWorthData = useMemo(() => { let runningBalance = totalPersonal + totalBusiness + totalAssets + totalInvestment; const data = []; const today = new Date(); for (let i = 0; i < 30; i++) { const d = new Date(today); d.setDate(d.getDate() - i); const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const dateStr = `${year}-${month}-${day}`; const dayName = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); data.unshift({ name: dayName, dateStr, Balance: runningBalance }); const dayTxs = reportTransactions.filter(t => t.tDate === dateStr); const dayInc = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); const dayExp = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); const adminFees = dayTxs.filter(t => t.type === 'transfer' && t.adminFee).reduce((sum, t) => sum + t.adminFee!, 0); runningBalance = runningBalance - dayInc + dayExp + adminFees; } return data; }, [totalPersonal, totalBusiness, totalAssets, totalInvestment, reportTransactions]);
  const historicalAccountsData = useMemo(() => { let runningBalance = totalPersonal + totalBusiness; const data = []; const today = new Date(); for (let i = 0; i < 30; i++) { const d = new Date(today); d.setDate(d.getDate() - i); const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const dayName = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); data.unshift({ name: dayName, dateStr, Balance: runningBalance }); const dayTxs = reportTransactions.filter(t => t.tDate === dateStr); const dayInc = dayTxs.filter(t => t.type === 'income' && activeAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.amount, 0); const dayExp = dayTxs.filter(t => t.type === 'expense' && activeAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.amount, 0); const tToAst = dayTxs.filter(t => t.type === 'transfer' && activeAccountIds.has(t.accountId) && assetAccountIds.has(t.toAccountId || "")).reduce((sum, t) => sum + t.amount, 0); const tFromAst = dayTxs.filter(t => t.type === 'transfer' && assetAccountIds.has(t.accountId) && activeAccountIds.has(t.toAccountId || "")).reduce((sum, t) => sum + t.amount, 0); const adminFees = dayTxs.filter(t => t.type === 'transfer' && t.adminFee && activeAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.adminFee!, 0); runningBalance = runningBalance - dayInc + dayExp + tToAst - tFromAst + adminFees; } return data; }, [totalPersonal, totalBusiness, activeAccountIds, assetAccountIds, reportTransactions]);
  const historicalAssetsData = useMemo(() => { let runningBalance = totalAssets; const data = []; const today = new Date(); for (let i = 0; i < 30; i++) { const d = new Date(today); d.setDate(d.getDate() - i); const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const dateStr = `${year}-${month}-${day}`; const dayName = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); data.unshift({ name: dayName, dateStr, Balance: runningBalance }); const dayTxs = reportTransactions.filter(t => t.tDate === dateStr); const dayInc = dayTxs.filter(t => t.type === 'income' && assetAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.amount, 0); const dayExp = dayTxs.filter(t => t.type === 'expense' && assetAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.amount, 0); const transfersFromActive = dayTxs.filter(t => t.type === 'transfer' && activeAccountIds.has(t.accountId) && assetAccountIds.has(t.toAccountId || "")).reduce((sum, t) => sum + t.amount, 0); const transfersToActive = dayTxs.filter(t => t.type === 'transfer' && assetAccountIds.has(t.accountId) && activeAccountIds.has(t.toAccountId || "")).reduce((sum, t) => sum + t.amount, 0); runningBalance = runningBalance - dayInc + dayExp - transfersFromActive + transfersToActive; } return data; }, [totalAssets, activeAccountIds, assetAccountIds, reportTransactions]);
  const detailTxs = useMemo(() => {
    return reportTransactions.filter(t => t.tDate?.startsWith(reportMonth || "") && (t.accountId === detailAccId || t.toAccountId === detailAccId));
  }, [reportTransactions, reportMonth, detailAccId]);

  const detailInc = useMemo(() => { return detailTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); }, [detailTxs]);
  const detailExp = useMemo(() => { return detailTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); }, [detailTxs]);

  const detailPieData = useMemo(() => {
    const detailExpGrouped = detailTxs.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    return Object.keys(detailExpGrouped).map(k => ({ name: k, value: detailExpGrouped[k] })).sort((a,b) => b.value - a.value);
  }, [detailTxs]);

  const monthlySavingsSummary = useMemo(() => {
    let totalDeposit = 0; let totalWithdraw = 0;
    const monthlyTrans = reportTransactions.filter(t => t.tDate && t.tDate.startsWith(reportMonth || ""));
    monthlyTrans.filter(t => t.type === "transfer").forEach(t => {
      const sAcc = accounts.find(a => a.id === t.accountId);
      const dAcc = accounts.find(a => a.id === t.toAccountId);
      if (sAcc && dAcc) {
        if (!sAcc.isSavings && dAcc.isSavings) totalDeposit += t.amount;
        else if (sAcc.isSavings && !dAcc.isSavings) totalWithdraw += t.amount;
      }
    });
    return { totalDeposit, totalWithdraw };
  }, [reportTransactions, reportMonth, accounts]);

  const activeWalletsToRender = walletGroup === "pribadi" ? personalActiveAccounts : businessActiveAccounts;
  const currentTheme = themeMap[accent];
  
  return (
    <div className="space-y-6 animate-in fade-in pb-20 select-none">
      
      {/* 👻 GHOST CARD OVERLAY (MUNCUL SAAT DI-DRAG) */}
      {dragState.isDragging && dragState.acc && (
        <div 
          className="fixed z-[999] pointer-events-none opacity-90 scale-105 drop-shadow-2xl bg-white dark:bg-slate-800 p-4 rounded-3xl border-2 border-blue-500 shadow-blue-500/40 flex flex-col items-center justify-center"
          style={{ 
            left: dragState.x - 60, top: dragState.y - 60, width: '120px', height: '120px',
            transform: 'rotate(-5deg)' // Efek miring premium saat diangkat
          }}
        >
          {dragState.acc.logo ? ( <img src={dragState.acc.logo} className="w-10 h-10 rounded-xl object-cover mb-2" alt="logo" /> ) : ( <Wallet size={32} className="text-blue-500 mb-2" /> )}
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 text-center leading-none">{dragState.acc.name}</span>
          <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Tarik ke Tujuan</span>
        </div>
      )}

      {detailAccId && detailAcc ? (
        // VIEW A: DETAIL AKUN
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center px-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <button onClick={() => { triggerHaptic(); setDetailAccId(null); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"><ChevronLeft size={20} className="text-slate-800 dark:text-slate-200"/></button>
              <h2 className="font-black text-xl text-slate-800 dark:text-white">{detailAcc.name}</h2>
            </div>
            
            <button onClick={() => {
              triggerHaptic();
              const cleanNum = (num: number | undefined | null) => num ? Number(num.toFixed(4)).toString() : "";
              setEditingAccId(detailAcc.id); setEditAccName(detailAcc.name); setEditAccBalance(cleanNum(detailAcc.balance) || "0"); setEditAccLogo(detailAcc.logo || "");
              setEditAccIsSavings(!!detailAcc.isSavings); setEditAccIsBusiness(!!detailAcc.isBusiness); setEditAccTargetBalance(cleanNum(detailAcc.targetBalance));
              setEditAccExcludeFromTotal(!!detailAcc.excludeFromTotal); setEditAccSavingsGoalTitle(detailAcc.savingsGoalTitle || "");
              setEditCurrency(detailAcc.currency || "IDR"); setEditIsInv(!!detailAcc.isInvestment); setEditAvgPrice(cleanNum(detailAcc.averageBuyPrice)); setEditLastRate(cleanNum(detailAcc.lastExchangeRate));
              setIsManageOpen(true);
            }} className={`p-2.5 rounded-full cursor-pointer transition-colors active:scale-95 flex items-center justify-center ${currentTheme.bgLight} ${currentTheme.text}`}>
              <Edit2 size={16}/>
            </button>
          </div>

          <div ref={detailMonthScrollRef} className="flex overflow-x-auto gap-2 px-2 pb-2 -mx-2 snap-x scrollbar-thin scrollbar-track-transparent dark:scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 dark:[color-scheme:dark] scroll-smooth">
            {[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(i => {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              const isActive = mStr === reportMonth;
              return (
                <button key={mStr} onClick={() => { triggerHaptic(); setReportMonth?.(mStr); }} className={`snap-center shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${isActive ? `${currentTheme.activePill}` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </button>
              );
            })}
          </div>

          <div className="bg-[#1e3a8a] p-6 rounded-[30px] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><CreditCard size={100} /></div>
            <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">{detailAcc.isInvestment ? "Total Unit Kepemilikan" : "Total Saldo Dompet"}</p>
            <h2 className="text-3xl font-black mb-1">{isPrivacyMode ? `${getCurrencySymbol(detailAcc.currency)} ••••••` : formatCurrencyTerbaca(detailAcc.balance, detailAcc.currency)}</h2>
            {detailAcc.isInvestment && <p className="text-sm font-bold text-blue-200 mb-6">~ Rp {(detailAcc.balance * getRate(detailAcc.currency, detailAcc.lastExchangeRate, detailAcc.id)).toLocaleString('id-ID')}</p>}
            
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-emerald-300 font-bold mb-1 flex items-center gap-1"><TrendingUp size={12}/> Pemasukan</p>
                <p className="text-sm font-black text-white">Rp {detailInc.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-red-300 font-bold mb-1 flex items-center gap-1"><TrendingDown size={12}/> Pengeluaran</p>
                <p className="text-sm font-black text-white">Rp {detailExp.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
          
          {detailExp > 0 ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Pengeluaran</h3>
                <span className="font-black text-slate-800 dark:text-slate-100 text-lg">Rp {detailExp.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart><Pie data={detailPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">{detailPieData.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{borderRadius:'12px', fontSize:'10px', fontWeight:'bold', border:'none', backgroundColor:'#1e293b', color:'#fff'}} formatter={(v: any) => `Rp ${Number(v).toLocaleString('id-ID')}`} /></RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1">
                  {detailPieData.slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs w-full p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} /><span className="font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span></div>
                      <div className="flex items-center gap-3 shrink-0"><span className="font-black text-slate-800 dark:text-slate-200">{((item.value / detailExp) * 100).toFixed(0)}%</span><span className="font-bold text-slate-400">Rp {item.value.toLocaleString('id-ID')}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-10 text-slate-400 text-xs italic bg-white dark:bg-slate-900 rounded-[30px] border border-slate-100 dark:border-slate-800">Tidak ada pengeluaran di bulan ini.</p>
          )}
        </div>

      ) : (

        // VIEW B: DASHBOARD / LIST UTAMA
        <>
          <div className="text-center mb-2">
            <h2 className={`font-black text-2xl tracking-tight mb-4 ${currentTheme.text}`}>
              {activeSubTab === "investasi" ? "Portofolio" : "Akun"}
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner w-max mx-auto overflow-x-auto max-w-full no-scrollbar">
              {[ { id: "net_worth", label: "Nilai Bersih" }, { id: "akun", label: "Akun" }, { id: "investasi", label: "Investasi" }, { id: "aset", label: "Aset" } ].map(tab => (
                <button key={tab.id} onClick={() => { triggerHaptic(); setActiveSubTab(tab.id as any); }} className={`px-4 md:px-5 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer ${activeSubTab === tab.id ? `${currentTheme.activeBg}` : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeSubTab === "net_worth" && (
            <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1">Nilai Bersih</p>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center mb-6">{isPrivacyMode ? 'Rp •••••••' : `Rp ${(totalPersonal + totalBusiness + totalAssets + totalInvestment).toLocaleString('id-ID')}`}</h2>
                {renderAreaChart(historicalNetWorthData, "#ef4444", "Balance")}
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 p-4">
                <div className="text-center"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Dompet</p><p className="text-xs md:text-sm font-black text-blue-600 dark:text-blue-400">Rp {(totalPersonal + totalBusiness).toLocaleString('id-ID')}</p></div>
                <div className="text-center"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Investasi</p><p className="text-xs md:text-sm font-black text-amber-600 dark:text-amber-400">Rp {totalInvestment.toLocaleString('id-ID')}</p></div>
                <div className="text-center"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Aset & Impian</p><p className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">Rp {totalAssets.toLocaleString('id-ID')}</p></div>
              </div>
            </div>
          )}

          {activeSubTab === "akun" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center mb-1">{isPrivacyMode ? 'Rp •••••••' : `Rp ${(totalPersonal + totalBusiness).toLocaleString('id-ID')}`}</h2>
                <p className="text-[10px] font-bold text-slate-500 text-center mb-6">Total Saldo Tersedia • {personalActiveAccounts.length + businessActiveAccounts.length} Dompet Likuid</p>
                {renderAreaChart(historicalAccountsData, "#ef4444", "Balance")}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-4 gap-2 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{walletGroup === "pribadi" ? `Dompet Pribadi (${personalActiveAccounts.length})` : <><Briefcase size={12} className="text-amber-500 shrink-0 inline mr-1" /> Dompet Bisnis ({businessActiveAccounts.length})</>}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="flex bg-slate-200/50 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                      <button onClick={() => { triggerHaptic(); setWalletGroup("pribadi"); }} className={`px-3 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${walletGroup === "pribadi" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400"}`}>Pribadi</button>
                      <button onClick={() => { triggerHaptic(); setWalletGroup("bisnis"); }} className={`px-3 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${walletGroup === "bisnis" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"}`}>Bisnis</button>
                    </div>
                    <div className="flex bg-slate-200/50 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                      <button onClick={() => { triggerHaptic(); setViewMode("grid"); }} className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === "grid" ? `bg-white dark:bg-slate-800 shadow-sm ${currentTheme.text}` : "text-slate-400"}`}><LayoutGrid size={14} /></button>
                      <button onClick={() => { triggerHaptic(); setViewMode("list"); }} className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === "list" ? `bg-white dark:bg-slate-800 shadow-sm ${currentTheme.text}` : "text-slate-400"}`}><List size={14} /></button>
                    </div>
                  </div>
                </div>

                {activeWalletsToRender.length === 0 ? (
                  <div className="p-12 text-center animate-in fade-in duration-300"><p className="text-slate-400 dark:text-slate-500 text-xs italic">{walletGroup === "pribadi" ? "Belum ada dompet pribadi." : "Belum ada dompet bisnis."}</p></div>
                ) : viewMode === "grid" ? (
                  <div className="p-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 animate-in fade-in duration-300">
                    {activeWalletsToRender.map((acc) => {
                      const design = getCardDesign(acc.type);
                      const symbol = getCurrencySymbol(acc.currency);
                      const accRate = getRate(acc.currency, acc.lastExchangeRate, acc.id);
                      const accIdrBalance = acc.balance * accRate;
                      const pct = totalActiveBalance > 0 ? Math.round((accIdrBalance / totalActiveBalance) * 100) : 0;
                      
                      const isDragged = dragState.acc?.id === acc.id;
                      const isHovered = dragState.hoveredId === acc.id;
                      
                      return (
                        <div 
                          key={acc.id} 
                          data-acc-id={acc.id}
                          onPointerDown={(e) => handlePointerDown(e, acc)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={(e) => handlePointerUp(e, acc)}
                          onPointerCancel={handlePointerCancel}
                          className={`bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] text-left border relative
                            ${isDragged ? 'opacity-40 scale-95 border-blue-500/30' : 'border-slate-100 dark:border-slate-800'}
                            ${isHovered ? 'ring-4 ring-blue-500 scale-105 shadow-blue-500/40 z-20 border-transparent bg-blue-50/50 dark:bg-blue-900/20' : ''}
                          `}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              {acc.logo ? ( <img src={acc.logo} className="w-8 h-8 rounded-lg object-cover" alt="logo" /> ) : ( <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${design.iconBg}`}>{design.icon}</div> )}
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">{[1,2,3,4].map((block) => <div key={block} className={`w-3.5 h-1.5 rounded-sm ${pct >= block * 25 - 10 ? (walletGroup === 'pribadi' ? currentTheme.progressActive : 'bg-amber-600 dark:bg-amber-500') : 'bg-slate-100 dark:bg-slate-800'}`} />)}</div>
                                <span className="text-[10px] font-black text-slate-400">{pct}%</span>
                              </div>
                            </div>
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-3 truncate">{acc.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mt-0.5">{acc.currency || "IDR"} • {acc.type}</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none mt-1.5">{isPrivacyMode ? `${symbol} •••••••` : `${symbol} ${acc.balance.toLocaleString('id-ID')}`}</p>
                          </div>
                          {isHovered && <div className="absolute inset-0 bg-blue-500/10 rounded-3xl animate-pulse pointer-events-none"></div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-300">
                    {activeWalletsToRender.map((acc) => {
                      const design = getCardDesign(acc.type);
                      const symbol = getCurrencySymbol(acc.currency);
                      const isDragged = dragState.acc?.id === acc.id;
                      const isHovered = dragState.hoveredId === acc.id;
                      
                      return (
                        <div 
                          key={acc.id} 
                          data-acc-id={acc.id}
                          onPointerDown={(e) => handlePointerDown(e, acc)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={(e) => handlePointerUp(e, acc)}
                          onPointerCancel={handlePointerCancel}
                          className={`p-4 flex justify-between items-center cursor-pointer transition-all relative
                            ${isDragged ? 'opacity-40 bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                            ${isHovered ? 'ring-2 ring-inset ring-blue-500 bg-blue-50 dark:bg-blue-900/20 z-20' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {acc.logo ? ( <img src={acc.logo} className="w-10 h-10 rounded-xl object-cover" alt="logo" /> ) : ( <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${design.iconBg}`}>{design.icon}</div> )}
                            <div className="text-left"><p className="text-sm font-bold text-slate-800 dark:text-slate-100">{acc.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{acc.currency || "IDR"} • {acc.type}</p></div>
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{isPrivacyMode ? `${symbol} •••••••` : `${symbol} ${acc.balance.toLocaleString('id-ID')}`}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* HINT UNTUK PENGGUNA */}
                {activeWalletsToRender.length > 1 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 py-2 px-4 text-center border-t border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <span>💡</span> Tip: Tahan & Geser dompet untuk Transfer Instan!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === "investasi" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1">Total Valuasi Portofolio</p>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center">{isPrivacyMode ? 'Rp •••••••' : `Rp ${totalInvestment.toLocaleString('id-ID')}`}</h2>
              </div>

              {investmentAccounts.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4"><BarChart3 size={32} className="text-amber-500 dark:text-amber-400"/></div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1">Belum Ada Investasi</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Lacak Crypto, Saham, atau Emas Anda di sini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investmentAccounts.map((acc) => {
                    const design = getCardDesign(acc.type, true);
                    const currentRate = getRate(acc.currency, acc.lastExchangeRate, acc.id);
                    const avgPriceVal = acc.averageBuyPrice || currentRate;
                    const totalIdr = acc.balance * currentRate;
                    const isProfit = currentRate >= avgPriceVal;
                    const pnlVal = acc.balance * (currentRate - avgPriceVal);
                    const pnlPct = avgPriceVal > 0 ? ((currentRate - avgPriceVal) / avgPriceVal) * 100 : 0;

                    return (
                      <div key={acc.id} onClick={() => { triggerHaptic(); setDetailAccId(acc.id); }} className="bg-white dark:bg-slate-900 p-5 rounded-[24px] shadow-sm cursor-pointer hover:shadow-md transition-all group border border-slate-100 dark:border-slate-800 text-left relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          {acc.logo ? ( <img src={acc.logo} className="w-10 h-10 rounded-xl object-cover" alt="logo" /> ) : ( <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${design.iconBg}`}>{design.icon}</div> )}
                          <button onClick={(e) => { e.stopPropagation(); triggerHaptic(); setUpdatingRateAcc(acc); setNewRateInput(currentRate.toString()); }} className="text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700">
                            <ArrowRightLeft size={10}/> Update Harga
                          </button>
                        </div>
                        <div className="relative z-10">
                          <p className="text-[10px] font-black uppercase mb-0.5 text-slate-400">{acc.currency || "UNIT"} • {acc.type}</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{acc.name}</p>
                          <div className="flex flex-col gap-0.5 mt-2">
                            <p className="text-xl font-black text-slate-800 dark:text-slate-100">{isPrivacyMode ? `••••••` : formatCurrencyTerbaca(acc.balance, acc.currency)}</p>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">~ Rp {isPrivacyMode ? `••••••` : totalIdr.toLocaleString('id-ID')}</p>
                          </div>
                          
                          <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black ${isProfit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {isProfit ? <ArrowUp size={10} strokeWidth={3}/> : <ArrowDown size={10} strokeWidth={3}/>}
                            <span>{isProfit ? '+' : ''}Rp {Math.abs(pnlVal).toLocaleString('id-ID')} ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeSubTab === "aset" && setReportMonth && (
            <div ref={monthScrollRef} className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-track-transparent dark:scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 dark:[color-scheme:dark] scroll-smooth -mx-4 px-4 md:mx-0 md:px-0 animate-in fade-in duration-200">
              {[11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((i) => {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
                return (
                  <button key={value} type="button" onClick={() => { triggerHaptic(); setReportMonth(value); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                      reportMonth === value ? `${currentTheme.activePill}` : "bg-slate-100/70 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                    }`}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {activeSubTab === "aset" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center mb-1">{isPrivacyMode ? 'Rp •••••••' : `Rp ${totalAssets.toLocaleString('id-ID')}`}</h2>
                <p className="text-[10px] font-bold text-slate-500 text-center mb-6">Total Nilai Aset Tabungan Fisik & Impian</p>
                {renderAreaChart(historicalAssetsData, "#10b981", "Balance")}
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-r border-slate-200 dark:border-slate-800 pr-2">
                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Menabung ({reportMonth?.split("-")[1]})
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-white mt-1">Rp {monthlySavingsSummary.totalDeposit.toLocaleString('id-ID')}</p>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5">Disimpan ke Aset</span>
                  </div>
                  <div className="pl-2">
                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Penarikan ({reportMonth?.split("-")[1]})
                    </p>
                    <p className="text-sm font-black text-slate-800 dark:text-white mt-1">Rp {monthlySavingsSummary.totalWithdraw.toLocaleString('id-ID')}</p>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5">Ditarik ke Dompet</span>
                  </div>
                </div>
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${currentTheme.text}`}>Total Menabung Bersih</p>
                    <span className="text-[8px] text-slate-400 font-bold">(Menabung dikurangi Penarikan)</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-black ${monthlySavingsSummary.totalDeposit - monthlySavingsSummary.totalWithdraw >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                      Rp {(monthlySavingsSummary.totalDeposit - monthlySavingsSummary.totalWithdraw).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Riwayat Aktivitas Tabungan</h3>
                  <span className="text-[10px] font-bold text-slate-400">{reportMonth?.split("-")[1]}/{reportMonth?.split("-")[0]}</span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent dark:scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 dark:[color-scheme:dark]">
                  {(() => {
                    const monthlyTrans = reportTransactions.filter(t => t.tDate && t.tDate.startsWith(reportMonth || ""));
                    const savingsTxs = monthlyTrans.filter(t => t.type === "transfer").filter(t => {
                      const sAcc = accounts.find(a => a.id === t.accountId);
                      const dAcc = accounts.find(a => a.id === t.toAccountId);
                      return (sAcc && dAcc) && ((!sAcc.isSavings && dAcc.isSavings) || (sAcc.isSavings && !dAcc.isSavings));
                    }).sort((a,b) => new Date(b.tDate).getTime() - new Date(a.tDate).getTime());

                    if (savingsTxs.length === 0) {
                      return <p className="text-center text-xs text-slate-400 dark:text-slate-500 italic py-4">Belum ada aktivitas tabungan di bulan ini.</p>;
                    }

                    return savingsTxs.map(t => {
                      const sAcc = accounts.find(a => a.id === t.accountId);
                      const dAcc = accounts.find(a => a.id === t.toAccountId);
                      const isDeposit = !sAcc?.isSavings && dAcc?.isSavings;
                      const dateObj = new Date(t.tDate);
                      const dateLabel = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                      return (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDeposit ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                              {isDeposit ? <ArrowDown size={14} strokeWidth={3}/> : <ArrowUp size={14} strokeWidth={3}/>}
                            </div>
                            <div className="flex flex-col text-left min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{isDeposit ? `Menabung: ${dAcc?.name}` : `Penarikan: ${sAcc?.name}`}</span>
                              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{dateLabel} • {t.note || (isDeposit ? "Disimpan" : "Ditarik")}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`font-black text-xs ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {isDeposit ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      )
                    });
                  })()}
                </div>
              </div>

              {(emergencyAccounts.length === 0 && dreamGoals.length === 0) ? (
                <div className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4"><Activity size={32} className="text-emerald-500 dark:text-emerald-400"/></div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1">Belum Ada Aset</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Lacak investasi dan tabungan Anda dengan menekan tombol + di bawah.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...emergencyAccounts, ...dreamGoals].map((acc) => {
                    const design = getCardDesign(acc.type);
                    const symbol = getCurrencySymbol(acc.currency);
                    const hasTarget = acc.targetBalance && acc.targetBalance > 0;
                    const percentage = hasTarget ? Math.min((acc.balance / acc.targetBalance!) * 100, 100) : 0;
                    
                    return (
                      <div key={acc.id} onClick={() => { triggerHaptic(); setDetailAccId(acc.id); }} className="bg-white dark:bg-slate-900 p-5 rounded-[24px] shadow-sm cursor-pointer hover:shadow-md transition-all group border border-slate-100 dark:border-slate-800 text-left">
                        <div className="flex justify-between items-start mb-4">
                          {acc.logo ? ( <img src={acc.logo} className="w-10 h-10 rounded-xl object-cover" alt="logo" /> ) : ( <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${design.iconBg}`}>{design.icon}</div> )}
                          {hasTarget && <span className={`text-[10px] font-black px-2 py-1 rounded border border-transparent ${currentTheme.bgLight} ${currentTheme.text}`}>{percentage.toFixed(0)}%</span>}
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase mb-0.5 ${currentTheme.text}`}>{acc.savingsGoalTitle || "Dana Darurat"}</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{acc.name}</p>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-lg font-black text-slate-800 dark:text-slate-100">{isPrivacyMode ? `${symbol} •••••••` : formatCurrencyTerbaca(acc.balance, acc.currency)}</p>
                            {hasTarget && <p className="text-[10px] font-bold text-slate-400">/ {isPrivacyMode ? '•••••••' : acc.targetBalance!.toLocaleString('id-ID')}</p>}
                          </div>
                        </div>
                        {hasTarget && <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3"><div className={`h-full ${currentTheme.progressActive}`} style={{ width: `${percentage}%` }}></div></div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <button onClick={() => { triggerHaptic(); setIsManageOpen(true); }} className={`fixed bottom-24 md:bottom-10 right-6 w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer ${currentTheme.fab}`}>
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </>
      )}

      {isManageOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { setIsManageOpen(false); setEditingAccId(null); }}>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-t-[30px] sm:rounded-[30px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[85vh] border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden"><div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div></div>
            <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">{editingAccId ? "Edit Dompet" : "Buat Dompet Baru"}</h3>
              <button onClick={() => { setIsManageOpen(false); setEditingAccId(null); }} className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full cursor-pointer transition-colors"><X size={16}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 text-left animate-in zoom-in-95 duration-200">
                  <div className="flex gap-2 mb-2 p-1 bg-slate-200/50 dark:bg-slate-950 rounded-xl">
                     <button onClick={() => { if(editingAccId) setEditIsInv(false); else setIsInv(false); }} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${!(editingAccId ? editIsInv : isInv) ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}>Dompet Biasa</button>
                     <button onClick={() => { if(editingAccId) setEditIsInv(true); else setIsInv(true); }} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${(editingAccId ? editIsInv : isInv) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-400'}`}>Investasi Fluktuatif</button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama { (editingAccId ? editIsInv : isInv) ? 'Aset / Koin / Saham' : 'Dompet' }</label>
                    <input type="text" placeholder={(editingAccId ? editIsInv : isInv) ? 'Contoh: Bitcoin, Saham BBCA' : 'Contoh: BCA, Gopay'} className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100" value={editingAccId ? editAccName : accName} onChange={(e) => editingAccId ? setEditAccName(e.target.value) : setAccName(e.target.value)} />
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Satuan Mata Uang / Unit</label>
                    <select className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100 cursor-pointer" value={editingAccId ? editCurrency : currency} onChange={(e) => editingAccId ? setEditCurrency(e.target.value) : setCurrency(e.target.value)}>
                      <optgroup label="Mata Uang Fisik">
                        <option value="IDR">🇮🇩 Rupiah (IDR)</option><option value="USD">🇺🇸 Dollar (USD)</option><option value="SGD">🇸🇬 Dollar (SGD)</option><option value="EUR">🇪🇺 Euro (EUR)</option><option value="JPY">🇯🇵 Yen (JPY)</option><option value="GBP">🇬🇧 Pound (GBP)</option>
                      </optgroup>
                      {(editingAccId ? editIsInv : isInv) && (
                        <optgroup label="Unit Investasi (Kripto/Saham/Emas)">
                          <option value="BTC">₿ Bitcoin (BTC)</option><option value="ETH">⟠ Ethereum (ETH)</option><option value="LOT">Lembar/Lot Saham</option><option value="GRAM">Gram (Emas/Perak)</option>
                        </optgroup>
                      )}
                      <optgroup label="Kustom / Tambahan">
                        {exchangeRates && Object.keys(exchangeRates)
                          .filter(k => !["IDR", "USD", "SGD", "EUR", "JPY", "GBP", "AUD", "MYR", "SAR", "BTC", "ETH", "GRAM", "LOT"].includes(k))
                          .map(k => <option key={k} value={k}>{k}</option>)
                        }
                      </optgroup>
                    </select>
                  </div>

                  <div className={`space-y-1 p-3 rounded-xl border ${currentTheme.auditBox}`}>
                    <label className={`text-[9px] font-black uppercase tracking-widest ${currentTheme.text}`}>{ (editingAccId ? editIsInv : isInv) ? 'Jumlah Kepemilikan (Unit)' : 'Saldo Saat Ini' }</label>
                    <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveKeypad("balance"); }} data-1p-ignore="true" data-lpignore="true" autoComplete="off" placeholder="0" className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100" value={editingAccId ? editAccBalance : accBalance} onChange={(e) => { editingAccId ? setEditAccBalance(e.target.value) : setAccBalance(e.target.value); }} />
                    {(editingAccId ? editAccBalance : accBalance) && (
                      <div className="flex flex-col gap-0.5 mt-1 pl-1">
                        <p className="text-[10px] font-bold text-slate-400">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(editingAccId ? editAccBalance : accBalance, editingAccId ? editCurrency : currency)}</span></p>
                        {/* 💱 LIVE IDR CONVERTER (OFFLINE AI) */}
                        {(() => {
                          const activeCur = editingAccId ? editCurrency : currency;
                          const isInvestmentType = editingAccId ? editIsInv : isInv;
                          const balanceVal = safeEvaluate(editingAccId ? editAccBalance : accBalance);
                          
                          let currentRate = 1;
                          if (isInvestmentType) {
                            const rateVal = safeEvaluate(editingAccId ? editLastRate : lastRate);
                            currentRate = rateVal > 0 ? rateVal : 1;
                          } else {
                            if (activeCur && activeCur !== "IDR" && exchangeRates?.[activeCur]) {
                              currentRate = exchangeRates[activeCur];
                            }
                          }
                          
                          if (currentRate !== 1 && balanceVal > 0) {
                            return <p className="text-[9px] font-black text-emerald-500 dark:text-emerald-400">~ Setara: Rp {(balanceVal * currentRate).toLocaleString('id-ID')}</p>;
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>

                  {(editingAccId ? editIsInv : isInv) ? (
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Harga Beli / Modal (Per 1 Unit)</label>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-400 pl-1">Rp</span>
                           <input type="text" inputMode="decimal" data-1p-ignore="true" data-lpignore="true" autoComplete="off" placeholder="Contoh: 1000000000" className="flex-1 p-3 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100" value={editingAccId ? editAvgPrice : avgPrice} onChange={(e) => { const val = e.target.value.replace(/,/g, ".").replace(/[^0-9.-]/g, ""); editingAccId ? setEditAvgPrice(val) : setAvgPrice(val); }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest pl-1">Harga Pasar Saat Ini (Per 1 Unit)</label>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-amber-500 pl-1">Rp</span>
                           <input type="text" inputMode="decimal" data-1p-ignore="true" data-lpignore="true" autoComplete="off" placeholder="Bisa diupdate kapan saja nanti" className="flex-1 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl text-xs border border-amber-200 dark:border-amber-800/50 outline-none font-bold text-amber-700 dark:text-amber-400" value={editingAccId ? editLastRate : lastRate} onChange={(e) => { const val = e.target.value.replace(/,/g, ".").replace(/[^0-9.-]/g, ""); editingAccId ? setEditLastRate(val) : setLastRate(val); }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <input type="checkbox" checked={editingAccId ? editAccIsBusiness : accIsBusiness} onChange={() => editingAccId ? setEditAccIsBusiness(!editAccIsBusiness) : setAccIsBusiness(!accIsBusiness)} className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700" />
                        Jadikan Dompet Bisnis
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <input type="checkbox" checked={editingAccId ? editAccExcludeFromTotal : accExcludeFromTotal} onChange={() => editingAccId ? setEditAccExcludeFromTotal(!editAccExcludeFromTotal) : setAccExcludeFromTotal(!accExcludeFromTotal)} className="rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700" />
                        Sembunyikan dari "Total Uang Bisa Dipakai" (Pemisahan Saldo)
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <input type="checkbox" checked={editingAccId ? editAccIsSavings : accIsSavings} onChange={() => editingAccId ? setEditAccIsSavings(!editAccIsSavings) : setAccIsSavings(!accIsSavings)} className="rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700" />
                        Jadikan Aset Tabungan / Impian
                      </label>
                    </div>
                  )}

                  {(editingAccId ? editAccIsSavings : accIsSavings) && !(editingAccId ? editIsInv : isInv) && (
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Impian</label>
                        <input type="text" placeholder="Contoh: DP Rumah" className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-200" value={editingAccId ? editAccSavingsGoalTitle : accSavingsGoalTitle} onChange={(e) => editingAccId ? setEditAccSavingsGoalTitle(e.target.value) : setAccSavingsGoalTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Nominal Tabungan</label>
                        <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveKeypad("target"); }} data-1p-ignore="true" data-lpignore="true" autoComplete="off" placeholder="0" className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100" value={editingAccId ? editAccTargetBalance : accTargetBalance} onChange={(e) => { editingAccId ? setEditAccTargetBalance(e.target.value) : setAccTargetBalance(e.target.value); }} />
                        {(editingAccId ? editAccTargetBalance : accTargetBalance) && <p className="text-[10px] font-bold text-slate-400 pl-1 mt-1">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(editingAccId ? editAccTargetBalance : accTargetBalance, editingAccId ? editCurrency : currency)}</span></p>}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1 pt-1 text-left">
                    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Logo (Opsional)</label>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, !!editingAccId)} className="hidden" id="custom-logo-file" />
                      <label htmlFor="custom-logo-file" className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"><Upload size={14}/> Pilih</label>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{(editingAccId ? editAccLogo : accLogo) ? "Siap Diunggah ✅" : "Maks 500KB"}</span>
                      {(editingAccId ? editAccLogo : accLogo) && <button type="button" onClick={() => editingAccId ? setEditAccLogo("") : null} className="text-red-500 hover:text-red-700 text-[10px] font-bold cursor-pointer">Hapus</button>}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button onClick={async () => { 
                      triggerHaptic(); 
                      if (editingAccId) { 
                        setLocalBalanceOverride(p => ({ ...p, [editingAccId]: Number(editAccBalance) })); 
                        setLocalNameOverride(p => ({ ...p, [editingAccId]: editAccName }));
                        setLocalInvRatesOverride(p => ({ ...p, [editingAccId]: Number(editLastRate) }));
                        await handleEditAccount(editingAccId); 
                      } else {
                        await handleCreateAccount();
                      }
                      setIsManageOpen(false); setEditingAccId(null); 
                    }} className={`flex-1 py-3 text-white rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 ${editingAccId ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>Simpan</button>
                    {editingAccId && <button onClick={() => { setEditingAccId(null); }} className="py-3 px-5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer active:scale-95">Batal</button>}
                  </div>
                </div>

                {!editingAccId && (
                  <div className="space-y-2 pb-6">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Daftar Dompet & Aset Anda</p>
                    {accounts.map((acc, index) => (
                      <div key={acc.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl transition-colors duration-200">
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                             {acc.isInvestment && <BarChart3 size={10} className="text-amber-500"/>}
                             {acc.name} 
                             {acc.isBusiness && <span className="text-[8px] text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-1 rounded font-black">Bisnis</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{acc.currency || "IDR"} • {acc.balance.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button disabled={index===0} onClick={()=>moveAccountOrder(index, "up")} className="p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-30"><ArrowUp size={12}/></button>
                          <button disabled={index===accounts.length-1} onClick={()=>moveAccountOrder(index, "down")} className="p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-30"><ArrowDown size={12}/></button>
                          <button onClick={() => { const cleanNum = (num: number | undefined | null) => num ? Number(num.toFixed(4)).toString() : ""; setEditingAccId(acc.id); setEditAccName(acc.name); setEditAccBalance(cleanNum(acc.balance) || "0"); setEditAccIsSavings(!!acc.isSavings); setEditAccIsBusiness(!!acc.isBusiness); setEditAccTargetBalance(cleanNum(acc.targetBalance)); setEditAccExcludeFromTotal(!!acc.excludeFromTotal); setEditAccSavingsGoalTitle(acc.savingsGoalTitle||""); setEditIsInv(!!acc.isInvestment); setEditAvgPrice(cleanNum(acc.averageBuyPrice)); setEditLastRate(cleanNum(acc.lastExchangeRate)); if(setEditAccCurrency)setEditAccCurrency(acc.currency||"IDR"); else setLocalEditAccCurrency(acc.currency||"IDR"); }} className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded ml-1 cursor-pointer"><Edit2 size={12}/></button>
                          <button onClick={() => deleteAccount(acc.id, acc.name)} className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 rounded cursor-pointer"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {updatingRateAcc && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setUpdatingRateAcc(null)}>
          <div className="bg-white dark:bg-slate-950 w-full max-w-sm rounded-t-[30px] sm:rounded-[30px] shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Update Harga Pasar</h3>
              <button onClick={() => setUpdatingRateAcc(null)} className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 rounded-full cursor-pointer"><X size={16}/></button>
            </div>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-[20px] border border-amber-200 dark:border-amber-800/50 space-y-3 mb-6">
               <div>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500">Harga 1 {updatingRateAcc.currency || "UNIT"} saat ini (Rupiah):</p>
                  <input type="text" inputMode="decimal" data-1p-ignore="true" data-lpignore="true" autoComplete="off" autoFocus className="w-full mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl text-lg border border-amber-200 dark:border-amber-700 outline-none font-black text-slate-800 dark:text-white" value={newRateInput} onChange={(e) => { const val = e.target.value.replace(/,/g, ".").replace(/[^0-9.-]/g, ""); setNewRateInput(val); }} />
               </div>
               {newRateInput && (
                 <p className="text-[10px] font-bold text-slate-500">Estimasi Nilai Baru: <span className="font-black text-amber-600 dark:text-amber-400">Rp {(updatingRateAcc.balance * Number(newRateInput)).toLocaleString('id-ID')}</span></p>
               )}
            </div>

            <button onClick={() => { 
                triggerHaptic(); 
                const nr = Number(newRateInput);
                if (nr > 0) {
                   setLocalInvRatesOverride(prev => ({...prev, [updatingRateAcc.id]: nr}));
                   if (handleUpdateInvestmentRate) handleUpdateInvestmentRate(updatingRateAcc.id, nr);
                }
                setUpdatingRateAcc(null); 
              }} className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black cursor-pointer transition-colors active:scale-95 shadow-[0_5px_15px_rgba(245,158,11,0.3)]">
              Simpan & Update
            </button>
          </div>
        </div>
      )}

      {isMobile && activeKeypad && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/80 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0 text-slate-800 dark:text-white">
            <div className="flex justify-between items-center mb-3 px-1 text-left">
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>
                {activeKeypad === "balance" ? "Kalkulator Saldo" : activeKeypad === "target" ? "Kalkulator Target" : "Kalkulator"}
              </span>
              <button onClick={() => {
                 const setVal = activeKeypad === "balance" ? (editingAccId ? setEditAccBalance : setAccBalance) : activeKeypad === "target" ? (editingAccId ? setEditAccTargetBalance : setAccTargetBalance) : null;
                 const curVal = activeKeypad === "balance" ? (editingAccId ? editAccBalance : accBalance) : activeKeypad === "target" ? (editingAccId ? editAccTargetBalance : accTargetBalance) : "";
                 if(setVal) { const evaluated = safeEvaluate(curVal as string); if(curVal) setVal(evaluated >= 0 ? evaluated.toString() : ""); }
                 setActiveKeypad(null);
              }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer">Selesai <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-slate-100 font-black text-sm">
              {["+", "-", "*", "/"].map((op) => (
                <button key={op} type="button" onClick={() => handleKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/30 dark:border-slate-800/20">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>
              ))}
              {["7", "8", "9"].map((num) => (
                <button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/30 active:bg-red-100/80 dark:active:bg-red-900/40 rounded-xl transition-all select-none font-bold">C</button>
              {["4", "5", "6"].map((num) => (
                <button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 flex items-center justify-center transition-all select-none">⌫</button>
              {["1", "2", "3"].map((num) => (
                <button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/45 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">.</button>
              {["(", "0", ")"].map((char) => (
                <button key={char} type="button" onClick={() => handleKeypadPress(char)} className={`${char === "0" ? "bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800" : "bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800"} py-3.5 rounded-xl transition-all select-none border border-slate-200/30 dark:border-slate-800/10`}>{char}</button>
              ))}
              <button type="button" onClick={() => handleKeypadPress("Ya")} className={`py-3.5 text-white font-black shadow-md transition-all select-none cursor-pointer rounded-xl border ${currentTheme.fab}`}>Ya</button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}