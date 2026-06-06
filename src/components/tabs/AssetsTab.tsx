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
    return { 
      bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", 
      icon: <BarChart3 size={18} className="text-amber-500 dark:text-amber-400" />, 
      iconBg: "bg-amber-50 dark:bg-amber-900/50", 
      chip: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400", 
      progressBar: "bg-amber-500"
    };
  } else if (t.includes("bank") || t.includes("kartu") || t.includes("credit") || t.includes("savings")) {
    return { 
      bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", 
      icon: <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />, 
      iconBg: "bg-blue-50 dark:bg-blue-900/50", 
      chip: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", 
      progressBar: "bg-blue-500"
    };
  } else if (t.includes("wallet") || t.includes("gopay") || t.includes("ovo") || t.includes("dana") || t.includes("pay")) {
    return { 
      bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", 
      icon: <Smartphone size={18} className="text-purple-600 dark:text-purple-400" />, 
      iconBg: "bg-purple-50 dark:bg-purple-900/50", 
      chip: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      progressBar: "bg-purple-500" 
    };
  } else if (t.includes("cash") || t.includes("dompet") || t.includes("tunai")) {
    return { 
      bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", 
      icon: <Banknote size={18} className="text-emerald-600" />, 
      iconBg: "bg-emerald-50 dark:bg-emerald-900/50", 
      chip: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
      progressBar: "bg-emerald-500" 
    };
  } else {
    return { 
      bg: "bg-white dark:bg-slate-900 shadow-sm border border-transparent dark:border-slate-700/50", 
      icon: <Wallet size={18} className="text-slate-600 dark:text-slate-400" />, 
      iconBg: "bg-slate-50 dark:bg-slate-800/50", 
      chip: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
      progressBar: "bg-slate-500" 
    };
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
  
  // Format khusus untuk Kripto/Unit yang butuh desimal lebih panjang
  if (["BTC", "ETH", "GRAM", "LOT"].includes(code.toUpperCase())) {
    return `${getCurrencySymbol(code)} ${parsed.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })}`;
  }
  
  return new Intl.NumberFormat("id-ID", { 
    style: "currency", 
    currency: code.toUpperCase() === "IDR" ? "IDR" : code.toUpperCase(), 
    minimumFractionDigits: 0, 
    maximumFractionDigits: code.toUpperCase() === "IDR" ? 0 : 2 
  }).format(parsed);
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
  
  // --- PROPS BARU UNTUK INVESTASI (OPSIONAL, DENGAN FALLBACK LOKAL JIKA PAGE.TSX BELUM UPDATE) ---
  accIsInvestment?: boolean; setAccIsInvestment?: (val: boolean) => void;
  editAccIsInvestment?: boolean; setEditAccIsInvestment?: (val: boolean) => void;
  accAverageBuyPrice?: string; setAccAverageBuyPrice?: (val: string) => void;
  editAccAverageBuyPrice?: string; setEditAccAverageBuyPrice?: (val: string) => void;
  accLastExchangeRate?: string; setAccLastExchangeRate?: (val: string) => void;
  editAccLastExchangeRate?: string; setEditAccLastExchangeRate?: (val: string) => void;
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
  
  // STATE NAVIGASI VIEW & FALLBACK INTERN
  const [activeSubTab, setActiveSubTab] = useState<"net_worth" | "akun" | "investasi" | "aset">("akun"); 
  const [detailAccId, setDetailAccId] = useState<string | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [walletGroup, setWalletGroup] = useState<"pribadi" | "bisnis">("pribadi");
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [localRates, setLocalRates] = useState<Record<string, string>>({});
  
  const [localAccCurrency, setLocalAccCurrency] = useState("IDR");
  const [localEditAccCurrency, setLocalEditAccCurrency] = useState("IDR");

  // Fallback Local States jika page.tsx belum diupdate
  const [localAccIsInv, setLocalAccIsInv] = useState(false);
  const [localEditAccIsInv, setLocalEditAccIsInv] = useState(false);
  const [localAccAvgPrice, setLocalAccAvgPrice] = useState("");
  const [localEditAccAvgPrice, setLocalEditAccAvgPrice] = useState("");
  const [localAccLastRate, setLocalAccLastRate] = useState("");
  const [localEditAccLastRate, setLocalEditAccLastRate] = useState("");
  
  // State untuk Quick Update Rate Portofolio
  const [updatingRateAcc, setUpdatingRateAcc] = useState<AccountData | null>(null);
  const [newRateInput, setNewRateInput] = useState("");

  const [localBalanceOverride, setLocalBalanceOverride] = useState<Record<string, number>>({});
  const [localNameOverride, setLocalNameOverride] = useState<Record<string, string>>({});
  const [localInvRatesOverride, setLocalInvRatesOverride] = useState<Record<string, number>>({}); // Mock offline mark-to-market

  const detailMonthScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);

  const [accent, setAccent] = useState<keyof typeof themeMap>("blue");

  useEffect(() => {
    if (detailAccId) {
      const timer = setTimeout(() => { if (detailMonthScrollRef.current) detailMonthScrollRef.current.scrollLeft = detailMonthScrollRef.current.scrollWidth; }, 50);
      return () => clearTimeout(timer);
    }
  }, [detailAccId]);

  useEffect(() => {
    if (activeSubTab === "aset" || activeSubTab === "investasi") {
      const timer = setTimeout(() => { if (monthScrollRef.current) monthScrollRef.current.scrollLeft = monthScrollRef.current.scrollWidth; }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeSubTab]);

  useEffect(() => {
    const updateAccent = () => {
      const stored = localStorage.getItem("fintracker_accent") as any;
      if (stored && ["blue", "emerald", "purple", "amber", "rose"].includes(stored)) setAccent(stored);
    };
    updateAccent();
    window.addEventListener("accent_color_changed", updateAccent);
    return () => window.removeEventListener("accent_color_changed", updateAccent);
  }, []);

  const triggerHaptic = () => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); };

  // Resolusi State Props vs Local
  const currency = accCurrency !== undefined ? accCurrency : localAccCurrency;
  const setCurrency = setAccCurrency !== undefined ? setAccCurrency : setLocalAccCurrency;
  const editCurrency = editAccCurrency !== undefined ? editAccCurrency : localEditAccCurrency;
  const setEditCurrency = setEditAccCurrency !== undefined ? setEditAccCurrency : setLocalEditAccCurrency;

  const isInv = accIsInvestment !== undefined ? accIsInvestment : localAccIsInv;
  const setIsInv = setAccIsInvestment !== undefined ? setAccIsInvestment : setLocalAccIsInv;
  const editIsInv = editAccIsInvestment !== undefined ? editAccIsInvestment : localEditAccIsInv;
  const setEditIsInv = setEditAccIsInvestment !== undefined ? setEditAccIsInvestment : setLocalEditAccIsInv;

  const avgPrice = accAverageBuyPrice !== undefined ? accAverageBuyPrice : localAccAvgPrice;
  const setAvgPrice = setAccAverageBuyPrice !== undefined ? setAccAverageBuyPrice : setLocalAccAvgPrice;
  const editAvgPrice = editAccAverageBuyPrice !== undefined ? editAccAverageBuyPrice : localEditAccAvgPrice;
  const setEditAvgPrice = setEditAccAverageBuyPrice !== undefined ? setEditAccAverageBuyPrice : setLocalEditAccAvgPrice;

  const lastRate = accLastExchangeRate !== undefined ? accLastExchangeRate : localAccLastRate;
  const setLastRate = setAccLastExchangeRate !== undefined ? setAccLastExchangeRate : setLocalAccLastRate;
  const editLastRate = editAccLastExchangeRate !== undefined ? editAccLastExchangeRate : localEditAccLastRate;
  const setEditLastRate = setEditAccLastExchangeRate !== undefined ? setEditAccLastExchangeRate : setLocalEditAccLastRate;

  useEffect(() => { if (exchangeRates) { const temp: Record<string, string> = {}; Object.keys(exchangeRates).forEach(k => { temp[k] = exchangeRates[k].toString(); }); setLocalRates(temp); } }, [exchangeRates]);
  useEffect(() => { if (editingAccId) setIsManageOpen(true); }, [editingAccId]);

  const getRate = (curCode?: string, historicalRate?: number, accountId?: string) => { 
    if (accountId && localInvRatesOverride[accountId] !== undefined) return localInvRatesOverride[accountId];
    if (historicalRate) return historicalRate; // Portofolio selalu utamakan rate tersimpan (Mark-to-Market)
    if (!curCode || curCode === "IDR") return 1; 
    if (exchangeRates && exchangeRates[curCode] !== undefined) return exchangeRates[curCode]; 
    return 1; 
  };

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
              <linearGradient id={`areaNeutralGradient${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12}/><stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
              </linearGradient>
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

  const updatedAccounts = accounts.map(a => {
    let balance = a.balance;
    let name = a.name;
    let overrideRate = a.lastExchangeRate;
    if (localBalanceOverride[a.id] !== undefined) balance = localBalanceOverride[a.id];
    if (localNameOverride[a.id] !== undefined) name = localNameOverride[a.id];
    if (localInvRatesOverride[a.id] !== undefined) overrideRate = localInvRatesOverride[a.id];
    return { ...a, balance, name, lastExchangeRate: overrideRate };
  });

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

  const historicalNetWorthData = useMemo(() => {
    let runningBalance = totalPersonal + totalBusiness + totalAssets + totalInvestment;
    const data = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      data.unshift({ name: dayName, dateStr, Balance: runningBalance });
      const dayTxs = reportTransactions.filter(t => t.tDate === dateStr);
      const dayInc = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const dayExp = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const adminFees = dayTxs.filter(t => t.type === 'transfer' && t.adminFee).reduce((sum, t) => sum + t.adminFee!, 0);
      runningBalance = runningBalance - dayInc + dayExp + adminFees; 
    }
    return data;
  }, [totalPersonal, totalBusiness, totalAssets, totalInvestment, reportTransactions]);

  const historicalAccountsData = useMemo(() => {
    let runningBalance = totalPersonal + totalBusiness;
    const data = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      data.unshift({ name: dayName, dateStr, Balance: runningBalance });
      const dayTxs = reportTransactions.filter(t => t.tDate === dateStr);
      const dayInc = dayTxs.filter(t => t.type === 'income' && activeAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.amount, 0);
      const dayExp = dayTxs.filter(t => t.type === 'expense' && activeAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.amount, 0);
      const tToAst = dayTxs.filter(t => t.type === 'transfer' && activeAccountIds.has(t.accountId) && assetAccountIds.has(t.toAccountId || "")).reduce((sum, t) => sum + t.amount, 0);
      const tFromAst = dayTxs.filter(t => t.type === 'transfer' && assetAccountIds.has(t.accountId) && activeAccountIds.has(t.toAccountId || "")).reduce((sum, t) => sum + t.amount, 0);
      const adminFees = dayTxs.filter(t => t.type === 'transfer' && t.adminFee && activeAccountIds.has(t.accountId)).reduce((sum, t) => sum + t.adminFee!, 0);
      runningBalance = runningBalance - dayInc + dayExp + tToAst - tFromAst + adminFees;
    }
    return data;
  }, [totalPersonal, totalBusiness, activeAccountIds, assetAccountIds, reportTransactions]);

  const detailTxs = useMemo(() => {
    return reportTransactions.filter(t => t.tDate?.startsWith(reportMonth || "") && (t.accountId === detailAccId || t.toAccountId === detailAccId));
  }, [reportTransactions, reportMonth, detailAccId]);

  const detailInc = useMemo(() => { return detailTxs.filter(t => t.type === 'income' || (t.type === 'transfer' && t.toAccountId === detailAccId)).reduce((sum, t) => sum + t.amount, 0); }, [detailTxs, detailAccId]);
  const detailExp = useMemo(() => { return detailTxs.filter(t => t.type === 'expense' || (t.type === 'transfer' && t.accountId === detailAccId)).reduce((sum, t) => sum + t.amount, 0); }, [detailTxs, detailAccId]);

  const detailPieData = useMemo(() => {
    const detailExpGrouped = detailTxs.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
    return Object.keys(detailExpGrouped).map(k => ({ name: k, value: detailExpGrouped[k] })).sort((a,b) => b.value - a.value);
  }, [detailTxs]);

  const getLatestTxForAccount = (accId: string) => {
    const latest = reportTransactions.find(t => t.accountId === accId || t.toAccountId === accId);
    if (!latest) return null;
    const isIncome = latest.type === 'income' || (latest.type === 'transfer' && latest.toAccountId === accId);
    const dateObj = new Date(latest.tDate);
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    let dayLabel = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (latest.tDate === todayStr) dayLabel = "Hari Ini"; else if (latest.tDate === yesterdayStr) dayLabel = "Kemarin";
    return { category: latest.category, amount: latest.amount, note: latest.note || latest.category, isIncome, dayLabel };
  };

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
  
  // --- RENDERING MULAI ---
  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      
      {detailAccId && detailAcc ? (
        
        // VIEW A: DETAIL AKUN (Tetap Sama dengan Kode Awal)
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center px-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <button onClick={() => { triggerHaptic(); setDetailAccId(null); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer"><ChevronLeft size={20} className="text-slate-800 dark:text-slate-200"/></button>
              <h2 className="font-black text-xl text-slate-800 dark:text-white">{detailAcc.name}</h2>
            </div>
            
            <button onClick={() => {
              triggerHaptic();
              setEditingAccId(detailAcc.id); setEditAccName(detailAcc.name); setEditAccBalance(detailAcc.balance.toString()); setEditAccLogo(detailAcc.logo || "");
              setEditAccIsSavings(!!detailAcc.isSavings); setEditAccIsBusiness(!!detailAcc.isBusiness); setEditAccTargetBalance(detailAcc.targetBalance?.toString() || "");
              setEditAccExcludeFromTotal(!!detailAcc.excludeFromTotal); setEditAccSavingsGoalTitle(detailAcc.savingsGoalTitle || "");
              setEditCurrency(detailAcc.currency || "IDR"); setEditIsInv(!!detailAcc.isInvestment); setEditAvgPrice(detailAcc.averageBuyPrice?.toString() || ""); setEditLastRate(detailAcc.lastExchangeRate?.toString() || "");
              setIsManageOpen(true);
            }} className={`p-2.5 rounded-full cursor-pointer transition-colors active:scale-95 flex items-center justify-center ${currentTheme.bgLight} ${currentTheme.text}`} border-transparent>
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
          
          {/* Laporan Pengeluaran Detail (Sama seperti sebelumnya) */}
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

        // =============================================================
        // VIEW B: DASHBOARD / LIST UTAMA (4 TAB BERSARANG)
        // =============================================================
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

          {/* TAB 1: NILAI BERSIH */}
          {activeSubTab === "net_worth" && (
            <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1">Nilai Bersih</p>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center mb-6">{isPrivacyMode ? 'Rp •••••••' : `Rp ${(totalPersonal + totalBusiness + totalAssets + totalInvestment).toLocaleString('id-ID')}`}</h2>
                {renderAreaChart(historicalNetWorthData, "#ef4444", "Balance")}
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-2"><span>{historicalNetWorthData[0]?.name}</span><span>{historicalNetWorthData[historicalNetWorthData.length - 1]?.name}</span></div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 p-4">
                <div className="text-center"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Dompet</p><p className="text-xs md:text-sm font-black text-blue-600 dark:text-blue-400">Rp {(totalPersonal + totalBusiness).toLocaleString('id-ID')}</p></div>
                <div className="text-center"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Investasi</p><p className="text-xs md:text-sm font-black text-amber-600 dark:text-amber-400">Rp {totalInvestment.toLocaleString('id-ID')}</p></div>
                <div className="text-center"><p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Aset & Impian</p><p className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400">Rp {totalAssets.toLocaleString('id-ID')}</p></div>
              </div>
            </div>
          )}

          {/* TAB 2: AKUN / LIKUID */}
          {activeSubTab === "akun" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center mb-1">{isPrivacyMode ? 'Rp •••••••' : `Rp ${(totalPersonal + totalBusiness).toLocaleString('id-ID')}`}</h2>
                <p className="text-[10px] font-bold text-slate-500 text-center mb-6">Total Saldo Tersedia • {personalActiveAccounts.length + businessActiveAccounts.length} Dompet Likuid</p>
                {renderAreaChart(historicalAccountsData, "#ef4444", "Balance")}
              </div>

              {/* Layout Container untuk Switcher Pribadi/Bisnis yang ada di kode awal (Sama persis) */}
              <div className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-4 gap-2 text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{walletGroup === "pribadi" ? `Dompet Pribadi (${personalActiveAccounts.length})` : <><Briefcase size={12} className="text-amber-500 shrink-0 inline mr-1" /> Dompet Bisnis ({businessActiveAccounts.length})</>}</span>
                  <div className="flex items-center gap-2.5">
                    <div className="flex bg-slate-200/50 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                      <button onClick={() => { triggerHaptic(); setWalletGroup("pribadi"); }} className={`px-3 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${walletGroup === "pribadi" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400"}`}>Pribadi</button>
                      <button onClick={() => { triggerHaptic(); setWalletGroup("bisnis"); }} className={`px-3 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${walletGroup === "bisnis" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm" : "text-slate-400"}`}>Bisnis</button>
                    </div>
                    <div className="flex bg-slate-200/50 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                      <button onClick={(e) => { e.stopPropagation(); triggerHaptic(); setViewMode("grid"); }} className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === "grid" ? `bg-white dark:bg-slate-800 shadow-sm ${currentTheme.text}` : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}><LayoutGrid size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); triggerHaptic(); setViewMode("list"); }} className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === "list" ? `bg-white dark:bg-slate-800 shadow-sm ${currentTheme.text}` : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}><List size={14} /></button>
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
                      return (
                        <div key={acc.id} onClick={() => { triggerHaptic(); setDetailAccId(acc.id); }} className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-all border border-slate-100 dark:border-slate-800 flex flex-col justify-between min-h-[140px] text-left">
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
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-300">
                    {activeWalletsToRender.map((acc) => {
                      const design = getCardDesign(acc.type);
                      const symbol = getCurrencySymbol(acc.currency);
                      return (
                        <div key={acc.id} onClick={() => { triggerHaptic(); setDetailAccId(acc.id); }} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
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
              </div>
            </div>
          )}
{/* TAB 3: INVESTASI (PORTOFOLIO KHUSUS FASE 14) */}
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
                          
                          {/* Indikator PnL (Cuan / Rugi) */}
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

          {/* TAB 4: ASET (DANA DARURAT & IMPIAN) - Sama Persis seperti Kode Awal */}
          {activeSubTab === "aset" && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white text-center mb-1">{isPrivacyMode ? 'Rp •••••••' : `Rp ${totalAssets.toLocaleString('id-ID')}`}</h2>
                <p className="text-[10px] font-bold text-slate-500 text-center mb-6">Total Nilai Aset Tabungan Fisik & Impian</p>
              </div>

              {(emergencyAccounts.length === 0 && dreamGoals.length === 0) ? (
                <div className="bg-white dark:bg-slate-900 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4"><Activity size={32} className="text-emerald-500 dark:text-emerald-400"/></div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1">Belum Ada Tabungan</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...emergencyAccounts, ...dreamGoals].map((acc) => {
                    const design = getCardDesign(acc.type); const symbol = getCurrencySymbol(acc.currency);
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

          {/* FLOATING ACTION BUTTON (+) */}
          <button onClick={() => { triggerHaptic(); setIsManageOpen(true); }} className={`fixed bottom-24 md:bottom-10 right-6 w-14 h-14 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer ${currentTheme.fab}`}>
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* =============================================================
          MODAL 1: KELOLA AKUN (DENGAN TAMBAHAN FORM INVESTASI)
          ============================================================= */}
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
                    </select>
                  </div>

                  <div className={`space-y-1 p-3 rounded-xl border ${currentTheme.auditBox}`}>
                    <label className={`text-[9px] font-black uppercase tracking-widest ${currentTheme.text}`}>{ (editingAccId ? editIsInv : isInv) ? 'Jumlah Kepemilikan (Unit)' : 'Saldo Saat Ini' }</label>
                    <input type="number" placeholder="0" className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100" value={editingAccId ? editAccBalance : accBalance} onChange={(e) => editingAccId ? setEditAccBalance(e.target.value) : setAccBalance(e.target.value)} />
                    {(editingAccId ? editAccBalance : accBalance) && <p className="text-[10px] font-bold text-slate-400 pl-1 mt-1">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(editingAccId ? editAccBalance : accBalance, editingAccId ? editCurrency : currency)}</span></p>}
                  </div>

                  {/* KHUSUS JIKA MODE INVESTASI (Fase 14) */}
                  {(editingAccId ? editIsInv : isInv) ? (
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Harga Beli / Modal (Per 1 Unit)</label>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-slate-400 pl-1">Rp</span>
                           <input type="number" placeholder="Contoh: 1000000000" className="flex-1 p-3 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100" value={editingAccId ? editAvgPrice : avgPrice} onChange={(e) => editingAccId ? setEditAvgPrice(e.target.value) : setAvgPrice(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest pl-1">Harga Pasar Saat Ini (Per 1 Unit)</label>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-amber-500 pl-1">Rp</span>
                           <input type="number" placeholder="Bisa diupdate kapan saja nanti" className="flex-1 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl text-xs border border-amber-200 dark:border-amber-800/50 outline-none font-bold text-amber-700 dark:text-amber-400" value={editingAccId ? editLastRate : lastRate} onChange={(e) => editingAccId ? setEditLastRate(e.target.value) : setLastRate(e.target.value)} />
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

                  {/* KHUSUS JIKA MODE TABUNGAN */}
                  {(editingAccId ? editAccIsSavings : accIsSavings) && !(editingAccId ? editIsInv : isInv) && (
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Impian</label>
                        <input type="text" placeholder="Contoh: DP Rumah" className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-200" value={editingAccId ? editAccSavingsGoalTitle : accSavingsGoalTitle} onChange={(e) => editingAccId ? setEditAccSavingsGoalTitle(e.target.value) : setAccSavingsGoalTitle(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Nominal Tabungan</label>
                        <input type="number" placeholder="0" className="w-full p-3.5 bg-white dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-800 outline-none font-bold text-slate-800 dark:text-slate-100" value={editingAccId ? editAccTargetBalance : accTargetBalance} onChange={(e) => editingAccId ? setEditAccTargetBalance(e.target.value) : setAccTargetBalance(e.target.value)} />
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

                {/* DAFTAR AKUN YANG ADA (Sama seperti sebelumnya) */}
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
                          <button onClick={() => { setEditingAccId(acc.id); setEditAccName(acc.name); setEditAccBalance(acc.balance.toString()); setEditAccIsSavings(!!acc.isSavings); setEditAccIsBusiness(!!acc.isBusiness); setEditAccTargetBalance(acc.targetBalance?.toString()||""); setEditAccExcludeFromTotal(!!acc.excludeFromTotal); setEditAccSavingsGoalTitle(acc.savingsGoalTitle||""); setEditIsInv(!!acc.isInvestment); setEditAvgPrice(acc.averageBuyPrice?.toString()||""); setEditLastRate(acc.lastExchangeRate?.toString()||""); if(setEditAccCurrency)setEditAccCurrency(acc.currency||"IDR"); else setLocalEditAccCurrency(acc.currency||"IDR"); }} className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded ml-1 cursor-pointer"><Edit2 size={12}/></button>
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

      {/* MODAL 2: UPDATE VALUASI (MANUAL MARK-TO-MARKET PORTOFOLIO) */}
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
                  <input type="number" autoFocus className="w-full mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl text-lg border border-amber-200 dark:border-amber-700 outline-none font-black text-slate-800 dark:text-white" value={newRateInput} onChange={(e) => setNewRateInput(e.target.value)} />
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

    </div>
  );
}
        