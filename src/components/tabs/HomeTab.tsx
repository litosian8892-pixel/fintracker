"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { AccountData, CategoryData, SplitItemData, TransactionData } from "../../types";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  ChevronDown, 
  X, 
  Search, 
  Plus, 
  Trophy, 
  Receipt, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  Wallet
} from "lucide-react";

interface HomeTabProps {
  reportMonth: string;
  setReportMonth: (val: string) => void;
  tType: "income" | "expense" | "transfer";
  setTType: (type: "income" | "expense" | "transfer") => void;
  tDate: string;
  setTDate: (date: string) => void;
  tTime: string;                  
  setTTime: (time: string) => void; 
  tCategory: string;
  setTCategory: (cat: string) => void;
  tAccountId: string;
  setTAccountId: (id: string) => void;
  tToAccountId: string;
  setTToAccountId: (id: string) => void;
  tAmount: string;
  setTAmount: (amt: string) => void;
  tAdminFee: string;
  setTAdminFee: (fee: string) => void;
  tNote: string;
  setTNote: (note: string) => void;
  categories: CategoryData[];
  accounts: AccountData[];
  handleTransaction: (customSplits?: SplitItemData[]) => void;
  transactions: TransactionData[];
  onDeleteTransaction: (t: TransactionData) => void;
  onEditTransaction: (t: TransactionData) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;

  editingTransaction: TransactionData | null;
  setEditingTransaction: (t: TransactionData | null) => void;
  handleUpdateTransaction: () => void;
  editTAmount: string;
  setEditTAmount: (amt: string) => void;
  editTType: "income" | "expense" | "transfer";
  setEditTType: (type: "income" | "expense" | "transfer") => void;
  editTAccountId: string;
  setEditTAccountId: (id: string) => void;
  editTToAccountId: string;
  setEditTToAccountId: (id: string) => void;
  editTNote: string;
  setEditTNote: (note: string) => void;
  editTCategory: string;
  setEditTCategory: (cat: string) => void;
  editTDate: string;
  setEditTDate: (date: string) => void;
  editTTime: string;                  
  setEditTTime: (time: string) => void; 
  editTAdminFee: string;
  setEditTAdminFee: (fee: string) => void;
  editTSplits: SplitItemData[];
  setEditTSplits: (splits: SplitItemData[]) => void;
  updateCategory?: (id: string, newName: string, newBudget: number | null, expenseType: "fixed" | "variable", newIcon?: string) => Promise<void>;
  
  // TRAVEL MODE PROPS
  isTravelMode?: boolean;
  toggleTravelMode?: (val: boolean) => void;
  activeTripName?: string;
  updateTripName?: (val: string) => void;
  isReportLoading?: boolean; // Props baru
}

const themeMap = {
  blue: {
    cardBg: "from-blue-700 via-blue-800 to-indigo-900",
    text: "text-blue-600 dark:text-blue-400",
    textHover: "hover:text-blue-600 dark:hover:text-blue-400",
    bgLight: "bg-blue-50 dark:bg-blue-950/40", 
    border: "border-blue-100/20 dark:border-blue-900/30",
    fab: "bg-blue-600 hover:bg-blue-700 border-blue-500",
    activePill: "bg-blue-600 border-blue-600 shadow-blue-500/10 text-white",
    activeAccCard: "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-blue-500/5",
    checkCircle: "bg-blue-600 text-white"
  },
  emerald: {
    cardBg: "from-emerald-700 via-emerald-800 to-teal-900",
    text: "text-emerald-600 dark:text-emerald-400",
    textHover: "hover:text-emerald-600 dark:hover:text-emerald-400",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-100/20 dark:border-emerald-900/30",
    fab: "bg-emerald-600 hover:bg-emerald-700 border-emerald-500",
    activePill: "bg-emerald-600 border-emerald-600 shadow-emerald-500/10 text-white",
    activeAccCard: "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-emerald-500/5",
    checkCircle: "bg-emerald-600 text-white"
  },
  purple: {
    cardBg: "from-purple-700 via-purple-800 to-fuchsia-900",
    text: "text-purple-600 dark:text-purple-400",
    textHover: "hover:text-purple-600 dark:hover:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-100/20 dark:border-purple-900/30",
    fab: "bg-purple-600 hover:bg-purple-700 border-purple-500",
    activePill: "bg-purple-600 border-purple-600 shadow-purple-500/10 text-white",
    activeAccCard: "border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 shadow-purple-500/5",
    checkCircle: "bg-purple-600 text-white"
  },
  amber: {
    cardBg: "from-amber-600 via-amber-700 to-orange-900",
    text: "text-amber-600 dark:text-amber-400",
    textHover: "hover:text-amber-600 dark:hover:text-amber-400",
    bgLight: "bg-amber-50 dark:bg-amber-900/40", 
    border: "border-amber-100/20 dark:border-amber-900/30",
    fab: "bg-amber-600 hover:bg-amber-700 border-amber-500",
    activePill: "bg-amber-600 border-amber-600 shadow-amber-500/10 text-white",
    activeAccCard: "border-amber-600 bg-amber-50/50 dark:bg-amber-900/20 shadow-amber-500/5",
    checkCircle: "bg-amber-600 text-white"
  },
  rose: {
    cardBg: "from-rose-600 via-rose-700 to-pink-900",
    text: "text-rose-600 dark:text-rose-400",
    textHover: "hover:text-rose-600 dark:hover:text-rose-400",
    bgLight: "bg-rose-50 dark:bg-rose-900/40", 
    border: "border-rose-100/20 dark:border-rose-900/30",
    fab: "bg-rose-600 hover:bg-rose-700 border-rose-500",
    activePill: "bg-rose-600 border-rose-600 shadow-rose-500/10 text-white",
    activeAccCard: "border-rose-600 bg-rose-50/50 dark:bg-rose-900/20 shadow-rose-500/5",
    checkCircle: "bg-rose-600 text-white"
  }
} as const;

const cleanCategoryName = (name: string): string => {
  if (!name) return "";
  return name.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
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

const getCurrencySymbol = (currency?: string) => {
  if (!currency) return "Rp";
  switch (currency.toUpperCase()) {
    case "IDR": return "Rp"; case "USD": return "$"; case "SGD": return "S$"; case "EUR": return "€";
    case "JPY": case "CNY": return "¥"; case "GBP": return "£"; case "AUD": return "A$";
    case "MYR": return "RM"; case "SAR": return "SR"; default: return currency;
  }
};

const getCategoryIcon = (catName: string) => {
  const name = catName.toLowerCase();
  if (name.includes("makan") || name.includes("food") || name.includes("cafe") || name.includes("kopi")) return "🍔";
  if (name.includes("transport") || name.includes("ojek") || name.includes("bensin") || name.includes("car")) return "🚗";
  if (name.includes("gaji") || name.includes("salary") || name.includes("income") || name.includes("gajian")) return "💰";
  if (name.includes("tagihan") || name.includes("bill") || name.includes("listrik") || name.includes("wifi") || name.includes("pulsa")) return "⚡";
  if (name.includes("belanja") || name.includes("grocer") || name.includes("pasar") || name.includes("supermarket")) return "🛒";
  if (name.includes("transfer") || name.includes("kirim")) return "💸";
  if (name.includes("piutang") || name.includes("utang") || name.includes("debt")) return "🤝";
  if (name.includes("invest") || name.includes("saham") || name.includes("crypto")) return "📈";
  if (name.includes("hiburan") || name.includes("game") || name.includes("nonton") || name.includes("netflix")) return "🎬";
  return "🏷️";
};

const formatTime = (createdAt: any) => {
  if (!createdAt) return "00:00";
  let d: Date;
  if (typeof createdAt === "object" && createdAt !== null && "seconds" in createdAt) {
    d = new Date(createdAt.seconds * 1000);
  } else if (typeof createdAt === "object" && createdAt !== null && "_seconds" in createdAt) {
    d = new Date((createdAt as any)._seconds * 1000);
  } else {
    d = new Date(createdAt);
  }
  if (isNaN(d.getTime())) return "00:00";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 🪄 UX PREMIUM: Komponen Swipeable khusus untuk Beranda (HomeTab)
const SwipeableHomeCard = ({ t, onEdit, onDelete, isPrivacyMode, currentTheme, getRowIcon, isOpen, onOpen, onClose }: any) => {
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const MAX_SWIPE = -100;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || startX.current === null) return;
    const diff = e.clientX - startX.current;
    let newOffset = isOpen ? MAX_SWIPE + diff : diff;
    if (newOffset > 0) newOffset = 0;
    if (newOffset < MAX_SWIPE - 20) newOffset = MAX_SWIPE - 20; // Efek membal di ujung
    setDragOffset(newOffset);
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!isOpen && dragOffset < -40) onOpen();
    else if (isOpen && dragOffset > MAX_SWIPE + 20) onClose();
    setDragOffset(0);
    startX.current = null;
  };

  const isTransfer = t.type === "transfer"; 
  const isIncome = t.type === "income";

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 shadow-sm">
      {/* TOMBOL TERSEMBUNYI DI BALIK LAYAR */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end px-3 gap-2.5 w-1/2 z-0">
        <button onClick={() => { onClose(); onEdit(); }} className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-90"><Edit3 size={15} strokeWidth={2.5} /></button>
        <button onClick={() => { onClose(); onDelete(); }} className="w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-all shadow-md active:scale-90"><Trash2 size={15} strokeWidth={2.5} /></button>
      </div>
      
      {/* KARTU TRANSAKSI YANG BISA DIGESER */}
      <div
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onPointerLeave={handlePointerUp}
        style={{ transform: `translateX(${isDragging.current ? dragOffset : (isOpen ? MAX_SWIPE : 0)}px)`, touchAction: "pan-y" }}
        className={`relative z-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col cursor-grab active:cursor-grabbing shadow-sm ${isDragging.current ? 'duration-0' : 'transition-transform duration-300 ease-out'}`}
      >
        <div className="flex items-center justify-between w-full pointer-events-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">{getRowIcon(t)}</div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">{t.category} {t.splits && t.splits.length > 0 && <span className={`text-[8px] px-1 rounded font-bold ${currentTheme.bgLight} ${currentTheme.text}`}>✂️ {t.splits.length} Pecahan</span>}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5">{t.note || (isTransfer ? "Transfer Dana" : "-")}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 uppercase ${currentTheme.bgLight} ${currentTheme.text} ${currentTheme.border}`}><Wallet size={8} /> {isTransfer ? `${t.accountName} ➔ ${t.toAccountName}` : t.accountName}</span>
                {(() => {
                  const formattedTime = (t.tTime || formatTime(t.createdAt)).replace(':', '.');
                  if (!formattedTime) return null;
                  return (<span className="text-[9px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/40 px-1.5 py-0.5 rounded-md border border-slate-200/30 dark:border-slate-700/30 flex items-center gap-0.5">🕒 {formattedTime}</span>);
                })()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-right pointer-events-none">
            <div>
              <p className={`text-xs font-black ${isIncome ? "text-emerald-500" : isTransfer ? "text-blue-500" : "text-rose-500"}`}>{isPrivacyMode ? "Rp •••••" : `${isIncome ? "+" : "-"}${t.amount.toLocaleString("id-ID")}`}</p>
              {t.adminFee && t.adminFee > 0 ? (<p className="text-[8px] font-black text-slate-400 dark:text-slate-500 mt-0.5">Admin: Rp {t.adminFee.toLocaleString("id-ID")}</p>) : null}
            </div>
          </div>
        </div>
        
        {t.splits && t.splits.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-left pl-13 pointer-events-none">
            <p className={`text-[9px] font-black uppercase tracking-widest leading-none flex items-center gap-1 ${currentTheme.text}`}><span>✂️</span> Detail Alokasi Pecahan:</p>
            <div className="space-y-1.5">
              {t.splits.map((s: any, idx: number) => (
                <div key={idx} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" /><span className="font-extrabold text-slate-800 dark:text-slate-300">{s.category}:</span><span className="text-slate-700 dark:text-slate-500 font-extrabold">Rp {isPrivacyMode ? "•••••••" : s.amount.toLocaleString('id-ID')}</span>{s.note && (<span className="text-[9px] font-medium italic text-slate-400 dark:text-slate-500 leading-none">({s.note})</span>)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 🪄 UX PREMIUM: Komponen Animasi Angka (Slot Machine / Odometer Effect)
const AnimatedNumber = ({ value, isPrivacyMode, prefix = "Rp ", privacyText = "Rp •••••••" }: { value: number, isPrivacyMode?: boolean, prefix?: string, privacyText?: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // Durasi muter 1.2 detik (Sangat premium)
    const startValue = displayValue;
    const endValue = value;
    if (startValue === endValue) return;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Rumus Matematika EaseOutExpo (Mulai kencang, melambat dan mulus di akhir)
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(startValue + (endValue - startValue) * easeOut));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };
    window.requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (isPrivacyMode) return <span>{privacyText}</span>;
  return <span>{prefix}{displayValue.toLocaleString("id-ID")}</span>;
};

export default function HomeTab({
  reportMonth, setReportMonth, tType, setTType, tDate, setTDate, tTime, setTTime, tCategory, setTCategory, tAccountId, setTAccountId, tToAccountId, setTToAccountId, tAmount, setTAmount, tAdminFee, setTAdminFee, tNote, setTNote, categories, accounts, handleTransaction, transactions, onDeleteTransaction, onEditTransaction, isPrivacyMode, togglePrivacyMode, editingTransaction, setEditingTransaction, handleUpdateTransaction, editTAmount, setEditTAmount, editTType, setEditTType, editTAccountId, setEditTAccountId, editTToAccountId, setEditTToAccountId, editTNote, setEditTNote, editTCategory, setEditTCategory, editTDate, setEditTDate, editTTime, setEditTTime, editTAdminFee, setEditTAdminFee, editTSplits, setEditTSplits, updateCategory, isTravelMode, toggleTravelMode, activeTripName, updateTripName, isReportLoading
}: HomeTabProps) {
  const parseTime12 = (timeStr: string) => {
    if (!timeStr) return { hour12: "12", minute: "00", period: "PM" };
    const normalized = timeStr.replace(".", ":");
    const [hStr, mStr] = normalized.split(":");
    const h = parseInt(hStr, 10) || 0;
    const m = mStr || "00";
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? "12" : String(h % 12).padStart(2, "0");
    return { hour12: h12, minute: m, period };
  };

  const formatTime24 = (h12: string, m: string, period: string) => {
    let h = parseInt(h12, 10) || 12;
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  };

  const monthScrollRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null); // UX: Radar Auto-Focus Keyboard
  const [accent, setAccent] = useState<keyof typeof themeMap>("blue");
  const [noteSuggestions, setNoteSuggestions] = useState<{note: string, category: string, amount: number, icon?: string}[]>([]);

  useEffect(() => { if (monthScrollRef.current) { const timer = setTimeout(() => { if (monthScrollRef.current) { monthScrollRef.current.scrollLeft = monthScrollRef.current.scrollWidth; } }, 50); return () => clearTimeout(timer); } }, []);
  useEffect(() => { const updateAccent = () => { const stored = localStorage.getItem("fintracker_accent") as any; if (stored && ["blue", "emerald", "purple", "amber", "rose"].includes(stored)) { setAccent(stored); } }; updateAccent(); window.addEventListener("accent_color_changed", updateAccent); return () => window.removeEventListener("accent_color_changed", updateAccent); }, []);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKeypad, setActiveKeypad] = useState<"amount" | "adminFee" | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [editingCat, setEditingCat] = useState<CategoryData | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");

  const [searchQueryInput, setSearchQueryInput] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedAccountIdFilter, setSelectedAccountIdFilter] = useState("all");
  const [showAccountFilterDropdown, setShowAccountFilterDropdown] = useState(false);
  const [searchAllMonths, setSearchAllMonths] = useState(false);

  const [activeAccSelector, setActiveAccSelector] = useState<"source" | "dest" | null>(null);
  const [isDark, setIsDark] = useState(false);
  
  // UX Premium: State untuk menahan item mana yang sedang digeser agar tidak berantakan
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  
  useEffect(() => { const checkDark = () => { setIsDark(document.documentElement.classList.contains("dark")); }; checkDark(); const observer = new MutationObserver(checkDark); observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); return () => observer.disconnect(); }, []);

  const [splits, setSplits] = useState<SplitItemData[]>([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [tempSplits, setTempSplits] = useState<{ category: string; amountStr: string; note: string }[]>([]);
  
  const [activeSplitIndex, setActiveSplitIndex] = useState<number | null>(null);
  const [showSplitCatModal, setShowSplitCatModal] = useState(false);
  const [activeSplitKeypadIndex, setActiveSplitKeypadIndex] = useState<number | null>(null);

  const [showEditSplitCatModal, setShowEditSplitCatModal] = useState(false);
  const [activeEditSplitIndex, setActiveEditSplitIndex] = useState<number | null>(null);
  
  // STATE BARU: Buffer Ekspresi untuk Kalkulator Koreksi Pecahan
  const [activeEditSplitKeypadIndex, setActiveEditSplitKeypadIndex] = useState<number | null>(null);
  const [activeEditSplitExpression, setActiveEditSplitExpression] = useState<string>("");

  useEffect(() => { const handleResize = () => setIsMobile(window.innerWidth < 768); handleResize(); window.addEventListener("resize", handleResize); return () => window.removeEventListener("resize", handleResize); }, []);
  useEffect(() => { if (editingTransaction) { setIsDrawerOpen(true); } }, [editingTransaction]);
  
  // Efek auto-focus dipindah ke tombol FAB menggunakan flushSync agar lolos dari blokir sekuriti iOS

  useEffect(() => { if (!tAmount || safeEvaluate(tAmount) === 0) { setSplits([]); } }, [tAmount]);

  const availableSourceAccounts = tType === "transfer" ? accounts : accounts.filter(acc => !acc.isSavings);
  const selectedSourceAcc = accounts.find(a => a.id === tAccountId);
  const currentSymbol = getCurrencySymbol(selectedSourceAcc?.currency);

  const formatCurrencyTerbaca = (val: string, currencyCode?: string) => { if (!val) return `${getCurrencySymbol(currencyCode)} 0`; const parsed = safeEvaluate(val); const code = currencyCode || "IDR"; return new Intl.NumberFormat("id-ID", { style: "currency", currency: code.toUpperCase() === "IDR" ? "IDR" : code.toUpperCase(), minimumFractionDigits: 0, maximumFractionDigits: code.toUpperCase() === "IDR" ? 0 : 2 }).format(parsed); };

  const handleTypeChange = (newType: "income" | "expense" | "transfer") => { 
    flushSync(() => { setTType(newType); setTAccountId(""); setTToAccountId(""); setSplits([]); if (newType !== "transfer") setTCategory(""); });
    if (noteInputRef.current) noteInputRef.current.focus();
  };
  const handleEditTypeChange = (newType: "income" | "expense" | "transfer") => { 
    flushSync(() => { setEditTType(newType); setEditTAccountId(""); setEditTToAccountId(""); setEditTSplits([]); if (newType !== "transfer") setEditTCategory(""); });
    if (noteInputRef.current) noteInputRef.current.focus();
  };

  useEffect(() => { 
    if (tType === "transfer") { 
      setTCategory("Transfer"); 
    } else { 
      const matchingCats = categories.filter((cat) => cat.type === tType); 
      const isSystemCat = ["Split Transaksi", "Piutang", "Penyesuaian Saldo", "Biaya Admin"].includes(tCategory);
      if (tCategory && !matchingCats.some(c => c.name === tCategory) && !isSystemCat) { 
        setTCategory(""); 
      } 
    } 
  }, [tType, categories, tCategory, setTCategory]);

  useEffect(() => { 
    if (editTType === "transfer") { 
      setEditTCategory("Transfer"); 
    } else { 
      const matchingCats = categories.filter((cat) => cat.type === editTType); 
      const isSystemCat = ["Split Transaksi", "Piutang", "Penyesuaian Saldo", "Biaya Admin"].includes(editTCategory);
      if (editTCategory && !matchingCats.some(c => c.name === editTCategory) && !isSystemCat) { 
        setEditTCategory(""); 
      } 
    } 
  }, [editTType, categories, editTCategory, setEditTCategory]);

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  const triggerHaptic = () => { 
    if (typeof window !== "undefined" && localStorage.getItem("fintracker_haptic") !== "false") {
      if (navigator.vibrate) navigator.vibrate(15); 
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }
  };
  
  const handleNoteChange = (val: string) => {
    if (editingTransaction) setEditTNote(val); else setTNote(val);
    if (val.trim().length >= 2) {
      const currentType = editingTransaction ? editTType : tType;
      const matches: Record<string, {note: string, category: string, amount: number, icon?: string}> = {};
      const sortedTx = [...transactions].sort((a,b) => new Date(b.tDate).getTime() - new Date(a.tDate).getTime());
      
      for (const tx of sortedTx) { 
        if (tx.type === currentType && tx.note && tx.note.toLowerCase().includes(val.toLowerCase())) { 
          const key = tx.note.toLowerCase(); 
          if (!matches[key]) { 
            // SINKRONISASI CERDAS: Translasi kategori lama ke nama & emoji terbaru
            const cleanCat = cleanCategoryName(tx.category);
            const currentCat = categories.find(c => cleanCategoryName(c.name) === cleanCat);
            matches[key] = { 
              note: tx.note, 
              category: currentCat ? currentCat.name : tx.category, 
              amount: tx.amount,
              icon: currentCat?.icon || getCategoryIcon(tx.category)
            }; 
          } 
        } 
      }
      setNoteSuggestions(Object.values(matches).slice(0, 4));
    } else { setNoteSuggestions([]); }
  };

  const handleSelectSuggestion = (sug: {note: string, category: string, amount: number, icon?: string}) => {
    triggerHaptic();
    if (editingTransaction) { setEditTNote(sug.note); if (editTType !== "transfer") setEditTCategory(sug.category); } 
    else { setTNote(sug.note); if (tType !== "transfer") setTCategory(sug.category); }
    setNoteSuggestions([]);
  };

  const handleKeypadPress = (key: string) => { triggerHaptic(); const currentVal = activeKeypad === "amount" ? tAmount : tAdminFee; const setVal = activeKeypad === "amount" ? setTAmount : setTAdminFee; if (key === "⌫") setVal(currentVal.slice(0, -1)); else if (key === "C") setVal(""); else if (key === "=") { const evaluated = safeEvaluate(currentVal); setVal(evaluated > 0 ? evaluated.toString() : ""); } else if (key === "Ya") setActiveKeypad(null); else setVal(currentVal + key); };
  const handleEditKeypadPress = (key: string) => { triggerHaptic(); const currentVal = activeKeypad === "amount" ? editTAmount : editTAdminFee; const setVal = activeKeypad === "amount" ? setEditTAmount : setEditTAdminFee; if (key === "⌫") setVal(currentVal.slice(0, -1)); else if (key === "C") setVal(""); else if (key === "=") { const evaluated = safeEvaluate(currentVal); setVal(evaluated > 0 ? evaluated.toString() : ""); } else if (key === "Ya") setActiveKeypad(null); else setVal(currentVal + key); };
  const handleSplitKeypadPress = (key: string) => { triggerHaptic(); if (activeSplitKeypadIndex === null) return; const currentVal = tempSplits[activeSplitKeypadIndex].amountStr || ""; const updated = [...tempSplits]; if (key === "⌫") updated[activeSplitKeypadIndex].amountStr = currentVal.slice(0, -1); else if (key === "C") updated[activeSplitKeypadIndex].amountStr = ""; else if (key === "=") { const evaluated = safeEvaluate(currentVal); updated[activeSplitKeypadIndex].amountStr = evaluated > 0 ? evaluated.toString() : ""; } else if (key === "Ya") { setActiveSplitKeypadIndex(null); return; } else updated[activeSplitKeypadIndex].amountStr = currentVal + key; setTempSplits(updated); };

  // FUNGSI BARU: Kalkulator Pintar untuk Koreksi Pecahan (Selesaikan Bug NaN)
  const handleEditSplitKeypadPress = (key: string) => {
    triggerHaptic();
    if (activeEditSplitKeypadIndex === null) return;
    
    let currentVal = activeEditSplitExpression;

    if (key === "⌫") {
      currentVal = currentVal.slice(0, -1);
    } else if (key === "C") {
      currentVal = "";
    } else if (key === "=") {
      const evaluated = safeEvaluate(currentVal);
      currentVal = evaluated > 0 ? evaluated.toString() : "";
    } else if (key === "Ya") {
      const evaluated = safeEvaluate(currentVal);
      const updated = [...editTSplits];
      updated[activeEditSplitKeypadIndex].amount = evaluated > 0 ? evaluated : 0;
      setEditTSplits(updated);
      setActiveEditSplitKeypadIndex(null);
      return;
    } else {
      currentVal += key;
    }

    setActiveEditSplitExpression(currentVal);

    // Update real-time ke memori angka jika karakter valid
    const evaluatedForState = safeEvaluate(currentVal);
    const updated = [...editTSplits];
    updated[activeEditSplitKeypadIndex].amount = evaluatedForState > 0 ? evaluatedForState : 0;
    setEditTSplits(updated);
  };

  const handleAddSplitItem = () => { setTempSplits([...tempSplits, { category: "", amountStr: "", note: "" }]); };
  const handleSelectSplitCategory = (catName: string) => { if (activeSplitIndex !== null) { const updated = [...tempSplits]; updated[activeSplitIndex].category = catName; setTempSplits(updated); } setShowSplitCatModal(false); setActiveSplitIndex(null); };
  const handleSelectEditSplitCategory = (catName: string) => { if (activeEditSplitIndex !== null) { const updated = [...editTSplits]; updated[activeEditSplitIndex].category = catName; setEditTSplits(updated); } setShowEditSplitCatModal(false); setActiveEditSplitIndex(null); };

  const handleConfirmSplits = () => {
    const targetAmount = safeEvaluate(tAmount); const evaluatedSplits = tempSplits.map(s => ({ category: s.category, amount: safeEvaluate(s.amountStr), note: s.note }));
    const currentSum = evaluatedSplits.reduce((sum, s) => sum + s.amount, 0);
    if (evaluatedSplits.some(s => !s.category)) return alert("Seluruh pecahan wajib dipilih kategorinya!");
    if (evaluatedSplits.some(s => s.amount <= 0)) return alert("Nominal pecahan tidak boleh kosong!");
    if (currentSum !== targetAmount) { return alert(`Total alokasi pecahan (${currentSymbol} ${currentSum.toLocaleString('id-ID')}) harus sama persis dengan nominal utama (${currentSymbol} ${targetAmount.toLocaleString('id-ID')})!`); }
    setSplits(evaluatedSplits); setTCategory("Split Transaksi"); setShowSplitModal(false);
  };

  // SOLUSI BUG ZONA WAKTU: Injeksi fungsi tanggal zona waktu lokal
  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  const recentMonths = useMemo(() => { const months = []; const now = new Date(); for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" }); months.push({ value, label }); } return months; }, []);
  const totalBalanceCalculated = useMemo(() => { return accounts.filter(acc => !acc.isSavings && !acc.excludeFromTotal).reduce((sum, acc) => sum + (acc.balance * (acc.lastExchangeRate || 1)), 0); }, [accounts]);

  const monthlyTransactions = useMemo(() => {
    let filtered = transactions;
    if (!searchQueryInput.trim() || !searchAllMonths) { filtered = filtered.filter(t => t.tDate && t.tDate.startsWith(reportMonth)); }
    if (selectedAccountIdFilter !== "all") { filtered = filtered.filter(t => t.accountId === selectedAccountIdFilter || t.toAccountId === selectedAccountIdFilter); }
    if (searchQueryInput.trim()) { 
      const q = searchQueryInput.toLowerCase(); 
      filtered = filtered.filter(t => 
        (t.note && t.note.toLowerCase().includes(q)) || 
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.accountName && t.accountName.toLowerCase().includes(q)) ||
        (t.toAccountName && t.toAccountName.toLowerCase().includes(q)) ||
        (t.splits && t.splits.some(s => (s.category && s.category.toLowerCase().includes(q)) || (s.note && s.note.toLowerCase().includes(q))))
      ); 
    }
    return filtered;
  }, [transactions, reportMonth, selectedAccountIdFilter, searchQueryInput, searchAllMonths]);

  const monthlySummary = useMemo(() => { 
    let income = 0; let expense = 0; 
    const q = searchQueryInput.trim().toLowerCase();
    
    monthlyTransactions.forEach(t => { 
      if (q && t.splits && t.splits.length > 0) {
        // Logika Pintar: Jika sedang mencari, dan ini transaksi pecah, hitung persis bagian pecahannya saja
        const isParentMatch = (t.note && t.note.toLowerCase().includes(q)) || (t.accountName && t.accountName.toLowerCase().includes(q)) || (t.toAccountName && t.toAccountName.toLowerCase().includes(q));
        if (isParentMatch) {
          if (t.type === "income") income += t.amount; else if (t.type === "expense") expense += t.amount;
        } else {
          t.splits.forEach(s => {
            if ((s.category && s.category.toLowerCase().includes(q)) || (s.note && s.note.toLowerCase().includes(q))) {
              if (t.type === "income") income += s.amount; else if (t.type === "expense") expense += s.amount;
            }
          });
        }
      } else {
        if (t.type === "income") income += t.amount; else if (t.type === "expense") expense += t.amount; 
      }
      if (t.type === "transfer" && t.adminFee) expense += t.adminFee; 
    }); 
    return { income, expense }; 
  }, [monthlyTransactions, searchQueryInput]);

  const smartInsight = useMemo(() => {
    // UX Premium: Hindari teks kosong fiktif saat cold start, ganti dengan sapaan asisten menganalisis
    if (isReportLoading) return { text: "Fintracker Assistant sedang menganalisis kesehatan keuanganmu...", icon: "🧠", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/50 dark:bg-indigo-950/20", border: "border-indigo-100/30 dark:border-indigo-900/30" };
    if (monthlyTransactions.length === 0) return { text: "Belum ada catatan bulan ini. Yuk, mulai mencatat transaksi pertamamu!", icon: "✨", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-100 dark:border-blue-900/30" };
    
    let budgetWarning = null; 
    const expenseByCategory: Record<string, number> = {};
    const q = searchQueryInput.trim().toLowerCase();
    
    // BUG FIX: Smart Insight kini memahami Unroll Splits & Filter Pencarian agar akurat 100%
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => { 
      if (t.splits && t.splits.length > 0) {
        const isParentMatch = q ? ((t.note && t.note.toLowerCase().includes(q)) || (t.accountName && t.accountName.toLowerCase().includes(q)) || (t.toAccountName && t.toAccountName.toLowerCase().includes(q))) : false;
        
        t.splits.forEach(s => {
          if (q && !isParentMatch) {
            const isSplitMatch = (s.category && s.category.toLowerCase().includes(q)) || (s.note && s.note.toLowerCase().includes(q));
            if (!isSplitMatch) return; // Lewati pecahan yang tidak relevan dengan pencarian
          }
          expenseByCategory[s.category] = (expenseByCategory[s.category] || 0) + s.amount;
        });
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount; 
      }
    });

    // UX PREMIUM: Jika sedang menggunakan fitur pencarian, Assistant berubah jadi "Mode Detektif"
    if (q) {
      const sortedCats = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
      if (sortedCats.length > 0) { 
        const [topCat, topAmount] = sortedCats[0]; 
        return { text: `Dari hasil pencarian ini, pengeluaran terbesar ada di kategori '${topCat}' (Rp ${topAmount.toLocaleString('id-ID')}).`, icon: "🔍", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/30", border: "border-indigo-100 dark:border-indigo-900/30" }; 
      }
      return { text: `Menampilkan hasil pencarian untuk '${searchQueryInput}'.`, icon: "🔍", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-100 dark:border-blue-900/30" };
    }

    for (const cat of categories) {
      if (cat.type === 'expense' && cat.budgetLimit && cat.budgetLimit > 0) {
        const spent = expenseByCategory[cat.name] || 0; const percentage = (spent / cat.budgetLimit) * 100;
        if (percentage > 100) { 
          budgetWarning = { text: `Gawat! Pengeluaran '${cat.name}' sudah melebihi batas budget bulan ini.`, icon: "🚨", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30", border: "border-rose-100 dark:border-rose-900/30" }; 
          break; 
        } else if (percentage === 100) {
          budgetWarning = { text: `Perhatian! Anggaran untuk '${cat.name}' sudah pas habis tak bersisa (100%).`, icon: "🛑", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-100 dark:border-orange-900/30" }; 
          break; 
        } else if (percentage >= 80) { 
          budgetWarning = { text: `Hati-hati, pengeluaran '${cat.name}' sudah mencapai ${percentage.toFixed(0)}% dari batas budgetmu!`, icon: "⚠️", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-100 dark:border-amber-900/30" }; 
        }
      }
    }
    if (budgetWarning) return budgetWarning;
    if (monthlySummary.income > 0 && monthlySummary.expense > monthlySummary.income) { return { text: "Pengeluaranmu sudah melebihi total pemasukan bulan ini. Waktunya mengerem jajan variabel!", icon: "📉", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-100 dark:border-orange-900/30" }; }
    if (monthlySummary.expense > 0) {
      const sortedCats = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
      if (sortedCats.length > 0) { const [topCat, topAmount] = sortedCats[0]; return { text: `Sejauh ini, uangmu paling banyak tersedot untuk kategori '${topCat}' (Rp ${topAmount.toLocaleString('id-ID')}).`, icon: "💡", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/30", border: "border-indigo-100 dark:border-indigo-900/30" }; }
    }
    return { text: "Arus kas bulan ini terlihat sangat sehat and aman. Terus pertahankan kebiasaan baik ini!", icon: "🌟", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-100 dark:border-emerald-900/30" };
  }, [monthlyTransactions, monthlySummary, categories, searchQueryInput, isReportLoading]);

  const groupedTransactionsByDay = useMemo(() => {
    const groups: Record<string, TransactionData[]> = {};
    monthlyTransactions.forEach(t => { if (!groups[t.tDate]) groups[t.tDate] = []; groups[t.tDate].push(t); });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(dateStr => {
      const list = groups[dateStr];
      const sortedList = [...list].sort((a, b) => {
        const timeA = (a.tTime || formatTime(a.createdAt)).replace('.', ':');
        const timeB = (b.tTime || formatTime(b.createdAt)).replace('.', ':');
        return timeB.localeCompare(timeA); 
      });
      let dailyNet = 0;
      sortedList.forEach(t => { if (t.type === "income") dailyNet += t.amount; else if (t.type === "expense") dailyNet -= t.amount; });
      return { dateStr, list: sortedList, dailyNet };
    });
  }, [monthlyTransactions]);

  const formatDayHeader = (dateStr: string) => { const d = new Date(dateStr); const dayNum = d.getDate(); const dayName = d.toLocaleDateString("id-ID", { weekday: "short" }); const monthYear = d.toLocaleDateString("id-ID", { month: "2-digit", year: "numeric" }).replace(/\//g, "/"); return { dayNum, dayName, monthYear }; };
  const closeMainDrawer = () => { setIsDrawerOpen(false); setEditingTransaction(null); setActiveKeypad(null); setNoteSuggestions([]); };

  const activeCategoryObject = useMemo(() => {
    const activeName = editingTransaction ? editTCategory : tCategory; if (!activeName) return null;
    const cleanActive = cleanCategoryName(activeName); return categories.find(c => cleanCategoryName(c.name) === cleanActive);
  }, [categories, tCategory, editTCategory, editingTransaction]);

  useEffect(() => {
    if (editingTransaction && editTCategory && categories.length > 0) {
      const cleanActive = cleanCategoryName(editTCategory); const matched = categories.find(c => cleanCategoryName(c.name) === cleanActive);
      if (matched && matched.name !== editTCategory) { setEditTCategory(matched.name); }
    }
  }, [editingTransaction, editTCategory, categories]);

  const renderActiveCategoryIcon = () => { if (activeCategoryObject?.icon) return activeCategoryObject.icon; const activeName = editingTransaction ? editTCategory : tCategory; return getCategoryIcon(activeName || ""); };
  const getRowIcon = (item: TransactionData) => { const catObj = categories.find(c => cleanCategoryName(c.name) === cleanCategoryName(item.category)); return catObj?.icon || getCategoryIcon(item.category); };

  const handleSelectAccount = (accId: string) => {
    if (activeAccSelector === "source") { if (editingTransaction) { setEditTAccountId(accId); } else { setTAccountId(accId); } } 
    else if (activeAccSelector === "dest") { if (editingTransaction) { setEditTToAccountId(accId); } else { setTToAccountId(accId); } }
    setActiveAccSelector(null);
  };

  const activeType = editingTransaction ? editTType : tType;
  const handleSelectCategory = (catName: string) => { if (editingTransaction) { setEditTCategory(catName); } else { setTCategory(catName); } setShowCatModal(false); };

  const isDateYesterday = useMemo(() => { const activeDateValue = editingTransaction ? editTDate : tDate; return activeDateValue === getYesterdayDateString(); }, [editingTransaction, editTDate, tDate]);
  const toggleYesterdayToday = () => { triggerHaptic(); const today = getTodayDateString(); const yesterday = getYesterdayDateString(); if (editingTransaction) { if (editTDate === yesterday) { setEditTDate(today); } else { setEditTDate(yesterday); } } else { if (tDate === yesterday) { setTDate(today); } else { setTDate(yesterday); } } };

  const currentTheme = themeMap[accent];

  // === SELESAI PART 1 - HARAP BALAS UNTUK MENERIMA PART 2 ===
  return (
    <div className="space-y-6 text-left relative min-h-[calc(100vh-120px)] transition-colors duration-200">
      {/* SUNTIKAN ATURAN CSS UNTUK MENYEMBUNYIKAN BATANG SCROLLBAR SECARA LOKAL */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />
      
      {/* HEADER TAB TRANSAKSI */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isSearchExpanded ? ( 
            <div className="flex items-center gap-3 w-full">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight shrink-0">Transaksi</h2>
              {/* BADGE TRAVEL MODE SILUMAN */}
              {isTravelMode && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 rounded-full shrink-0 min-w-0 animate-in zoom-in-95 duration-300">
                  <span className="text-xs">✈️</span>
                  <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-400 truncate max-w-[100px]">{activeTripName || "Travel Mode"}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full pr-2 animate-in slide-in-from-left-2 duration-150">
              <input type="text" placeholder={searchAllMonths ? "Cari semua bulan..." : "Cari bulan ini..."} className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100" value={searchQueryInput} onChange={(e) => setSearchQueryInput(e.target.value)} autoFocus />
              <button type="button" onClick={() => { triggerHaptic(); setSearchAllMonths(!searchAllMonths); }} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black shrink-0 border transition-all active:scale-95 ${searchAllMonths ? "bg-blue-600 border-blue-600 text-white shadow" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>Semua Bulan</button>
              <button type="button" onClick={() => { setSearchQueryInput(""); setIsSearchExpanded(false); setSearchAllMonths(false); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 shrink-0 cursor-pointer"><X size={14} /></button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0 ml-2">
          <button type="button" onClick={() => { triggerHaptic(); setIsSearchExpanded(!isSearchExpanded); }} className={`p-2 rounded-xl transition-colors cursor-pointer ${isSearchExpanded ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Search size={18} /></button>
          <div className="relative">
            <button type="button" onClick={() => setShowAccountFilterDropdown(!showAccountFilterDropdown)} className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer select-none ${currentTheme.bgLight} ${currentTheme.text} ${currentTheme.border}`}>{selectedAccountIdFilter === "all" ? "All" : accounts.find(a => a.id === selectedAccountIdFilter)?.name || "All"}<ChevronDown size={10} /></button>
            {showAccountFilterDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAccountFilterDropdown(false)}></div>
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button type="button" onClick={() => { setSelectedAccountIdFilter("all"); setShowAccountFilterDropdown(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold ${selectedAccountIdFilter === "all" ? `${currentTheme.bgLight} ${currentTheme.text}` : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>Semua Dompet (All)</button>
                  {accounts.map(acc => (
                    <button key={acc.id} type="button" onClick={() => { setSelectedAccountIdFilter(acc.id); setShowAccountFilterDropdown(false); }} className={`w-full text-left px-4 py-2 text-xs font-bold ${selectedAccountIdFilter === acc.id ? `${currentTheme.bgLight} ${currentTheme.text}` : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>{acc.name}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HORIZONTAL MONTH SCROLLING PILLS */}
      <div 
        ref={monthScrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0"
      >
        {recentMonths.map((m) => { const isActive = reportMonth === m.value; return (<button key={m.value} type="button" onClick={() => setReportMonth(m.value)} className={`px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 border ${isActive ? currentTheme.activePill : "bg-slate-100/70 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"}`}>{m.label}</button>); })}
      </div>

      {/* PREMIUM TOTAL SALDO SUMMARY CARD */}
      <div className={`p-6 rounded-[28px] bg-gradient-to-br ${currentTheme.cardBg} text-white shadow-xl relative overflow-hidden transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex justify-between items-start mb-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/80 tracking-wider uppercase">Total Saldo</span>
            <button type="button" className="p-1 text-white/50 hover:text-white rounded-full transition-colors"><Trophy size={12} className="text-yellow-400" /></button>
            <span className="text-[9px] font-black bg-black/20 px-1.5 py-0.5 rounded border border-white/20 text-white flex items-center gap-0.5"><Receipt size={10} /> {monthlyTransactions.length}</span>
          </div>
          <button type="button" onClick={togglePrivacyMode} className="p-1.5 bg-white/10 active:bg-white/20 text-white rounded-full transition-all duration-200 cursor-pointer hover:scale-105">{isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}</button>
        </div>
        <div className="text-3xl font-black tracking-tight mb-6 relative z-10">
          <AnimatedNumber value={totalBalanceCalculated} isPrivacyMode={isPrivacyMode} />
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0"><ArrowUpRight size={18} strokeWidth={2.5} /></div>
            <div>
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Pemasukan ({reportMonth.split("-")[1]})</p>
              <p className="text-sm font-extrabold tracking-tight">
                <AnimatedNumber value={monthlySummary.income} isPrivacyMode={isPrivacyMode} privacyText="Rp •••••" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="w-9 h-9 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center shrink-0"><ArrowDownRight size={18} strokeWidth={2.5} /></div>
            <div>
              <p className="text-[9px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Pengeluaran ({reportMonth.split("-")[1]})</p>
              <p className="text-sm font-extrabold tracking-tight text-rose-200">
                <AnimatedNumber value={monthlySummary.expense} isPrivacyMode={isPrivacyMode} privacyText="Rp •••••" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WIDGET SMART FINANCIAL INSIGHTS */}
      <div className={`p-4 rounded-[20px] border ${smartInsight.bg} ${smartInsight.border} flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700`}>
        <div className="text-xl shrink-0 leading-none pt-0.5">{smartInsight.icon}</div>
        <div className="min-w-0">
          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${smartInsight.color}`}>Fintracker Assistant</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed pr-2">{smartInsight.text}</p>
        </div>
      </div>

      {/* DAILY GROUPED TRANSACTION HISTORY LIST */}
      <div className="space-y-4">
        {isReportLoading ? (
          // SKELETON SHIMMER LOADING (Agar tidak kaget disangka datanya hilang saat cold-start!)
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="space-y-1.5 text-left">
                    <div className="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : groupedTransactionsByDay.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[28px]"><p className="text-slate-400 dark:text-slate-500 text-xs font-bold">Tidak ada transaksi tercatat di bulan ini.</p></div>
        ) : (
          groupedTransactionsByDay.map(({ dateStr, list, dailyNet }) => {
            const { dayNum, dayName, monthYear } = formatDayHeader(dateStr);
            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100">{dayNum}</span>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.5 rounded uppercase">{dayName}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">{monthYear}</span>
                  </div>
                  <span className={`text-xs font-black ${dailyNet > 0 ? "text-emerald-500" : dailyNet < 0 ? "text-rose-500" : "text-slate-400"}`}>{isPrivacyMode ? "Rp ••" : `${dailyNet > 0 ? "+" : ""}${dailyNet.toLocaleString("id-ID")}`}</span>
                </div>

                <div className="space-y-2 overflow-x-hidden p-1 -mx-1">
                  {list.map((t) => (
                    <SwipeableHomeCard 
                      key={t.id}
                      t={t}
                      isPrivacyMode={isPrivacyMode}
                      currentTheme={currentTheme}
                      getRowIcon={getRowIcon}
                      isOpen={openSwipeId === t.id}
                      onOpen={() => setOpenSwipeId(t.id)}
                      onClose={() => setOpenSwipeId(null)}
                      onEdit={() => { triggerHaptic(); onEditTransaction(t); }}
                      onDelete={() => { triggerHaptic(); onDeleteTransaction(t); }}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FLOATING ACTION BUTTON (+) */}
          <button type="button" onClick={() => { 
            triggerHaptic(); 
            // HACK KELAS DEWA: flushSync memaksa React merender laci saat ini juga secara sinkron!
            // Ini membuat pemanggilan .focus() berada di dalam siklus klik jari yang sama, sehingga iPhone/iOS merestuinya!
            flushSync(() => {
              setIsDrawerOpen(true);
            });
            if (noteInputRef.current) {
              noteInputRef.current.focus();
            }
          }} className={`fixed bottom-28 md:bottom-10 right-6 md:right-8 z-40 w-14 h-14 text-white rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer active:scale-95 border ${currentTheme.fab} animate-in zoom-in-90`}>
            <Plus size={28} strokeWidth={2.5} />
          </button>

      {/* UNIFIED SLIDE-UP BOTTOM DRAWER DENGAN INPUT JAM */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={closeMainDrawer}></div>
          <div className="bg-white dark:bg-slate-950 w-full h-full rounded-none sm:max-w-md sm:h-[95vh] sm:rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 z-10 flex flex-col border-t border-slate-200 dark:border-slate-800">
            
            {editingTransaction ? (
              <div className={`p-6 ${editTType === 'income' ? 'bg-emerald-500' : editTType === 'expense' ? 'bg-red-600' : currentTheme.activePill.split(' ')[0]} text-white shrink-0 transition-colors duration-300 relative`}>
                <button type="button" onClick={closeMainDrawer} className="absolute top-4 left-4 p-1.5 hover:bg-white/10 text-white rounded-full"><X size={16} /></button>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        if (activeCategoryObject) {
                          triggerHaptic();
                          setEditingCat(activeCategoryObject);
                          setEditCatName(activeCategoryObject.name);
                          setEditCatIcon(activeCategoryObject.icon || "");
                        } else {
                          alert("Pilih kategori terlebih dahulu untuk mengubah logonya!");
                        }
                      }}
                      className="w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-2xl shrink-0 transition-all cursor-pointer active:scale-90"
                      title="Klik untuk ubah logo/emoji"
                    >
                      {renderActiveCategoryIcon()}
                    </button>
                    <div>
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-1">Koreksi Transaksi</span>
                      <div className="text-3xl font-black leading-none flex items-baseline gap-1">
                        {editTAmount ? parseFloat(editTAmount).toLocaleString("id-ID") : "0"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-black bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">{selectedSourceAcc?.currency || "IDR"}</div>
                </div>
              </div>
            ) : (
              <div className={`p-6 ${tType === 'income' ? 'bg-emerald-500' : tType === 'expense' ? 'bg-red-600' : currentTheme.activePill.split(' ')[0]} text-white shrink-0 transition-colors duration-300 relative`}>
                <button type="button" onClick={closeMainDrawer} className="absolute top-4 left-4 p-1.5 hover:bg-white/10 text-white rounded-full"><X size={16} /></button>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        if (activeCategoryObject) {
                          triggerHaptic();
                          setEditingCat(activeCategoryObject);
                          setEditCatName(activeCategoryObject.name);
                          setEditCatIcon(activeCategoryObject.icon || "");
                        } else {
                          alert("Pilih kategori terlebih dahulu untuk mengubah logonya!");
                        }
                      }}
                      className="w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-2xl shrink-0 transition-all cursor-pointer active:scale-90"
                      title="Klik untuk ubah logo/emoji"
                    >
                      {renderActiveCategoryIcon()}
                    </button>
                    <div>
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-1">Catat Baru</span>
                      <div className="text-3xl font-black leading-none flex items-baseline gap-1">
                        {tAmount ? parseFloat(tAmount).toLocaleString("id-ID") : "0"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-black bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">{selectedSourceAcc?.currency || "IDR"}</div>
                </div>
              </div>
            )}

            <div className="p-6 space-y-4 overflow-y-auto no-scrollbar bg-white dark:bg-slate-950 flex-1">
              
              {!editingTransaction && (
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-2">
                  <button type="button" onClick={() => handleTypeChange("expense")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "expense" ? "bg-red-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"}`}><ArrowDownRight size={12} /> Pengeluaran</button>
                  <button type="button" onClick={() => handleTypeChange("income")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "income" ? "bg-emerald-500 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"}`}><ArrowUpRight size={12} /> Pemasukan</button>
                  <button type="button" onClick={() => handleTypeChange("transfer")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "transfer" ? currentTheme.activePill : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"}`}><ArrowRightLeft size={12} strokeWidth={2.5} /> Transfer</button>
                </div>
              )}

              {editingTransaction && (
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-2">
                  <button type="button" onClick={() => handleEditTypeChange("expense")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${editTType === "expense" ? "bg-red-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"}`}><ArrowDownRight size={12} /> Pengeluaran</button>
                  <button type="button" onClick={() => handleEditTypeChange("income")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${editTType === "income" ? "bg-emerald-500 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"}`}><ArrowUpRight size={12} /> Pemasukan</button>
                  <button type="button" onClick={() => handleEditTypeChange("transfer")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${editTType === "transfer" ? currentTheme.activePill : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"}`}><ArrowRightLeft size={12} strokeWidth={2.5} /> Transfer</button>
                </div>
              )}

              {/* INPUT CATATAN DENGAN AUTOCOMPLETE */}
              <div className="space-y-1 relative z-[60] mb-2 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Catatan (Beli Apa?)</label>
                <input 
                  ref={noteInputRef}
                  type="text" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 text-slate-800 dark:text-white relative z-[70]" 
                  placeholder="Ketik 2 huruf untuk saran otomatis..." 
                  value={editingTransaction ? editTNote : tNote} 
                  onChange={(e) => handleNoteChange(e.target.value)}
                  onFocus={() => { if(isMobile) setActiveKeypad(null); }}
                  autoComplete="off"
                />
                
                {/* AUTOCOMPLETE DROPDOWN */}
                {noteSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[80] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Saran Riwayat Transaksi</span>
                      <button type="button" onClick={() => setNoteSuggestions([])} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer"><X size={10}/></button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {noteSuggestions.map((sug, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectSuggestion(sug)}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors flex justify-between items-center group"
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{sug.note}</span>
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">{sug.icon || getCategoryIcon(sug.category)}</span> {sug.category}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-bold text-slate-400 mb-0.5">Harga Terakhir</span>
                            <span className={`text-xs font-black ${currentTheme.text} bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800`}>
                              {formatCurrencyTerbaca(sug.amount.toString(), selectedSourceAcc?.currency)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {editingTransaction ? (
                editTSplits.length === 0 && (
                  <div className="space-y-1 relative z-10">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Nominal ({selectedSourceAcc?.currency || "IDR"})</label>
                    <div className="relative">
                      <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("amount"); setActiveEditSplitKeypadIndex(null); } }} className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="0" value={editTAmount} onChange={(e) => setEditTAmount(e.target.value)} />
                    </div>
                    <div className="flex justify-between items-start px-1 mt-1 min-h-[16px]">
                      {editTAmount ? <p className="text-[10px] font-bold text-slate-400">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(editTAmount, selectedSourceAcc?.currency)}</span></p> : <div></div>}
                      {/* UX Premium: Live Overdraft Warning (Mencegah dompet minus) */}
                      {((editTType === "expense" || editTType === "transfer") && selectedSourceAcc && safeEvaluate(editTAmount) > selectedSourceAcc.balance) && (
                        <p className="text-[9px] font-black text-orange-500 text-right animate-in fade-in slide-in-from-top-1">⚠️ Sisa: {formatCurrencyTerbaca(selectedSourceAcc.balance.toString(), selectedSourceAcc.currency)}</p>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-1 relative z-10">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Nominal ({selectedSourceAcc?.currency || "IDR"})</label>
                  <div className="relative">
                    <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("amount"); setActiveSplitKeypadIndex(null); } }} className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none text-slate-800 dark:text-white focus:border-blue-500" placeholder="0" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
                  </div>
                  <div className="flex justify-between items-start px-1 mt-1 min-h-[16px]">
                    {tAmount ? <p className="text-[10px] font-bold text-slate-400">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(tAmount, selectedSourceAcc?.currency)}</span></p> : <div></div>}
                    {/* UX Premium: Live Overdraft Warning (Mencegah dompet minus) */}
                    {((tType === "expense" || tType === "transfer") && selectedSourceAcc && safeEvaluate(tAmount) > selectedSourceAcc.balance) && (
                      <p className="text-[9px] font-black text-orange-500 text-right animate-in fade-in slide-in-from-top-1">⚠️ Sisa: {formatCurrencyTerbaca(selectedSourceAcc.balance.toString(), selectedSourceAcc.currency)}</p>
                    )}
                  </div>
                </div>
              )}

              {((editingTransaction ? editTType : tType) === "transfer") && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className={`text-[10px] font-black uppercase tracking-widest block pl-1 ${currentTheme.text}`}>Biaya Admin ({selectedSourceAcc?.currency || "IDR"}) (Opsional)</label>
                  <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("adminFee"); setActiveSplitKeypadIndex(null); setActiveEditSplitKeypadIndex(null); } }} className={`w-full p-3.5 rounded-2xl text-xs font-bold outline-none text-slate-800 dark:text-white border ${currentTheme.bgLight} ${currentTheme.border}`} placeholder="0" value={editingTransaction ? editTAdminFee : tAdminFee} onChange={(e) => editingTransaction ? setEditTAdminFee(e.target.value) : setTAdminFee(e.target.value)} />
                  {(editingTransaction ? editTAdminFee : tAdminFee) && <p className="text-[10px] font-bold text-slate-400 pl-1">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(editingTransaction ? editTAdminFee : tAdminFee, selectedSourceAcc?.currency)}</span></p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`space-y-1 min-w-0 ${(editingTransaction ? editTType : tType) === "transfer" ? "" : "md:col-span-2"}`}> 
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">💳 Dompet Asal</label>
                  <div 
                    onClick={() => { triggerHaptic(); setActiveAccSelector("source"); }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Wallet size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {editingTransaction 
                          ? (accounts.find(a => a.id === editTAccountId)?.name || "Pilih Dompet...") 
                          : (selectedSourceAcc?.name || "Pilih Dompet...")}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  </div>
                </div>

                {((editingTransaction ? editTType : tType) === "transfer") && (
                  <div className="space-y-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-200">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">💳 Dompet Tujuan</label>
                    <div 
                      onClick={() => { triggerHaptic(); setActiveAccSelector("dest"); }}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Wallet size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">
                          {editingTransaction 
                            ? (accounts.find(a => a.id === editTToAccountId)?.name || "Pilih Tujuan...") 
                            : (accounts.find(a => a.id === tToAccountId)?.name || "Pilih Tujuan...")}
                        </span>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT TANGGAL & JAM (RASIO 60:40) */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 relative z-10 w-full">
                
                {/* KOTAK TANGGAL */}
                <div className="col-span-3 space-y-1 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-between px-1">
                    <span>Tanggal</span>
                    <button type="button" onClick={toggleYesterdayToday} className={`text-[9px] font-black hover:underline cursor-pointer ${currentTheme.text}`}>{isDateYesterday ? "Hari Ini?" : "Kemarin?"}</button>
                  </label>
                  <div className="w-full h-12 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl flex items-center px-1 sm:px-2 overflow-hidden shadow-sm">
                    <input 
                      type="date" 
                      style={{ colorScheme: isDark ? "dark" : "light" }} 
                      className="w-full bg-transparent text-xs sm:text-sm font-black outline-none text-slate-800 dark:text-white cursor-pointer appearance-none min-w-0 text-center tracking-wide" 
                      value={editingTransaction ? editTDate : tDate} 
                      onChange={(e) => editingTransaction ? setEditTDate(e.target.value) : setTDate(e.target.value)} 
                    />
                  </div>
                </div>

                {/* KOTAK JAM */}
                <div className="col-span-2 space-y-1 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block text-right sm:text-left">
                    Jam
                  </label>
                  <div className="w-full h-12 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-1.5 px-1 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-center">
                      <select 
                        style={{ colorScheme: isDark ? "dark" : "light" }}
                        className="bg-transparent text-xs sm:text-sm font-black outline-none text-slate-800 dark:text-white cursor-pointer text-center appearance-none"
                        value={parseTime12(editingTransaction ? editTTime : tTime).hour12}
                        onChange={(e) => {
                          const current = parseTime12(editingTransaction ? editTTime : tTime);
                          const newTime = formatTime24(e.target.value, current.minute, current.period);
                          editingTransaction ? setEditTTime(newTime) : setTTime(newTime);
                        }}
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                          <option key={h} value={h} className="dark:bg-slate-950 text-slate-800 dark:text-white">{h}</option>
                        ))}
                      </select>
                      <span className="text-slate-400 font-black shrink-0 px-0.5 -mt-0.5">:</span>
                      <select 
                        style={{ colorScheme: isDark ? "dark" : "light" }}
                        className="bg-transparent text-xs sm:text-sm font-black outline-none text-slate-800 dark:text-white cursor-pointer text-center appearance-none"
                        value={parseTime12(editingTransaction ? editTTime : tTime).minute}
                        onChange={(e) => {
                          const current = parseTime12(editingTransaction ? editTTime : tTime);
                          const newTime = formatTime24(current.hour12, e.target.value, current.period);
                          editingTransaction ? setEditTTime(newTime) : setTTime(newTime);
                        }}
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(m => (
                          <option key={m} value={m} className="dark:bg-slate-950 text-slate-800 dark:text-white">{m}</option>
                        ))}
                      </select>
                    </div>
                    <select 
                      style={{ colorScheme: isDark ? "dark" : "light" }}
                      className={`px-1.5 py-1 rounded-xl text-[9px] font-black outline-none border cursor-pointer shrink-0 ${currentTheme.bgLight} ${currentTheme.text} ${currentTheme.border} appearance-none text-center shadow-sm`}
                      value={parseTime12(editingTransaction ? editTTime : tTime).period}
                      onChange={(e) => {
                        const current = parseTime12(editingTransaction ? editTTime : tTime);
                        const newTime = formatTime24(current.hour12, current.minute, e.target.value);
                        editingTransaction ? setEditTTime(newTime) : setTTime(newTime);
                      }}
                    >
                      <option value="AM" className="dark:bg-slate-950 text-slate-800 dark:text-white">AM</option>
                      <option value="PM" className="dark:bg-slate-950 text-slate-800 dark:text-white">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {((editingTransaction ? editTType : tType) !== "transfer") && (
                <div className="space-y-1 relative z-10">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Kategori</label>
                  {editingTransaction ? (
                    editTSplits.length > 0 ? (
                      <div className={`w-full p-3.5 border rounded-2xl text-xs font-bold flex items-center justify-between ${currentTheme.bgLight} ${currentTheme.text} ${currentTheme.border}`}>
                        <span>✂️ {editTSplits.length} Pecahan Terpilih</span>
                        <button type="button" onClick={() => setEditTSplits([])} className="text-[10px] font-black underline hover:opacity-80 cursor-pointer">Batalkan Pecahan</button>
                      </div>
                    ) : (
                      <div onClick={() => { triggerHaptic(); setShowCatModal(true); setSearchQuery(""); setActiveKeypad(null); }} className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between truncate hover:bg-slate-100 dark:hover:bg-slate-800">
                        <span className={`truncate ${!editTCategory ? "text-slate-400 font-medium" : ""}`}>
                          {editTCategory ? (
                            <>
                              <span className="mr-2">{activeCategoryObject?.icon || getCategoryIcon(editTCategory)}</span>
                              {editTCategory}
                            </>
                          ) : "Pilih Kategori..."}
                        </span>
                        <ChevronDown size={14} className="text-slate-400 shrink-0" />
                      </div>
                    )
                  ) : (
                    splits.length > 0 ? (
                      <div className={`w-full p-3.5 border rounded-2xl text-xs font-bold flex items-center justify-between ${currentTheme.bgLight} ${currentTheme.text} ${currentTheme.border}`}>
                        <span>✂️ {splits.length} Pecahan Terpilih</span>
                        <button type="button" onClick={() => setSplits([])} className="text-[10px] font-black underline hover:opacity-80 cursor-pointer">Batal</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div onClick={() => { setShowCatModal(true); setSearchQuery(""); setActiveKeypad(null); }} className="flex-1 p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between truncate hover:bg-slate-100 dark:hover:bg-slate-800">
                          <span className={`truncate ${!tCategory ? "text-slate-400 font-medium" : ""}`}>
                            {tCategory ? (
                              <>
                                <span className="mr-2">{activeCategoryObject?.icon || getCategoryIcon(tCategory)}</span>
                                {tCategory}
                              </>
                            ) : "Pilih Kategori..."}
                          </span>
                          <ChevronDown size={14} className="text-slate-400 shrink-0" />
                        </div>
                        {safeEvaluate(tAmount) > 0 && (
                          <button type="button" onClick={() => {
                            const initAmt = safeEvaluate(tAmount);
                            setTempSplits([{ category: tCategory || "", amountStr: initAmt.toString(), note: "" }]);
                            setShowSplitModal(true);
                            setActiveKeypad(null);
                          }} className={`px-3.5 py-3.5 rounded-2xl text-xs font-black border shrink-0 flex items-center gap-1 cursor-pointer transition-colors ${currentTheme.bgLight} ${currentTheme.text} ${currentTheme.border}`}>
                            ✂️ Pecah
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* TAMPILAN RINCIAN KOREKSI PECAHAN */}
              {editingTransaction && editTSplits && editTSplits.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="flex justify-between items-center">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>✂️ Rincian Pecahan Koreksi</p>
                      <span className={`text-[10px] font-black ${editTSplits.reduce((sum, s) => sum + s.amount, 0) === safeEvaluate(editTAmount) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                        Total Alokasi: {currentSymbol} {editTSplits.reduce((sum, s) => sum + s.amount, 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {(() => {
                      const remaining = safeEvaluate(editTAmount) - editTSplits.reduce((sum, s) => sum + s.amount, 0);
                      return (
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-500">{remaining < 0 ? "Kelebihan Alokasi:" : "Sisa Belum Dialokasi:"}</span>
                          <span className={remaining === 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {currentSymbol} {Math.abs(remaining).toLocaleString('id-ID')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {editTSplits.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400">Pecahan #{i + 1}</span>
                        {editTSplits.length > 1 && (
                          <button type="button" onClick={() => setEditTSplits(editTSplits.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-bold flex items-center gap-0.5 cursor-pointer"><X size={14} /> Hapus</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Kategori</label>
                          <div onClick={() => { setActiveEditSplitIndex(i); setShowEditSplitCatModal(true); }} className="p-3 !bg-slate-50 dark:!bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900 truncate transition-colors">
                          <span className="truncate">{item.category || "Pilih..."}</span><ChevronDown size={14} className="text-slate-400 shrink-0" />
                        </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400">Nominal ({selectedSourceAcc?.currency || "IDR"})</label>
                          
                          {/* INPUT NOMINAL KOREKSI (DILENGKAPI STRING BUFFER UNTUK SEMUA PERANGKAT) */}
                          <input 
                            type="text" 
                            inputMode={isMobile ? "none" : undefined} 
                            onFocus={() => { 
                              setActiveEditSplitKeypadIndex(i); 
                              setActiveEditSplitExpression(item.amount === 0 ? "" : item.amount.toString()); 
                              if(isMobile) setActiveKeypad(null); 
                            }} 
                            onBlur={() => {
                              if(!isMobile) setActiveEditSplitKeypadIndex(null);
                            }}
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore
                            className="w-full p-3 !bg-slate-50 dark:!bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500" 
                            value={activeEditSplitKeypadIndex === i ? activeEditSplitExpression : (item.amount === 0 ? "" : item.amount)} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9+*/().-]/g, "");
                              if (activeEditSplitKeypadIndex === i) {
                                setActiveEditSplitExpression(val);
                              }
                              const updated = [...editTSplits];
                              const evaluated = safeEvaluate(val);
                              updated[i].amount = evaluated > 0 ? evaluated : 0;
                              setEditTSplits(updated);
                            }} 
                          />

                          {item.amount > 0 && <p className="text-[9px] font-bold text-slate-400 pl-1 mt-1">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(item.amount.toString(), selectedSourceAcc?.currency)}</span></p>}
                        </div>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Catatan Pecahan (Opsional)..." 
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        className="w-full p-3 !bg-slate-50 dark:!bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500" 
                        value={item.note || ""} 
                        onChange={(e) => {
                          const updated = [...editTSplits];
                          updated[i].note = e.target.value;
                          setEditTSplits(updated);
                        }} 
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    setEditTSplits([...editTSplits, { category: "", amount: 0, note: "" }]);
                  }} className={`w-full py-2.5 border border-dashed rounded-xl text-xs font-black cursor-pointer transition-colors ${currentTheme.bgLight} ${currentTheme.text} ${currentTheme.border}`}>+ Tambah Pecahan Koreksi</button>
                </div>
              )}

              {/* PUSAT KENDALI TRAVEL MODE TERSEMBUNYI */}
              <div className={`mt-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${isTravelMode ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 p-3' : 'bg-transparent border-slate-200 dark:border-slate-800 p-3'}`}>
                {isTravelMode && <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 blur-xl rounded-full pointer-events-none"></div>}
                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${isTravelMode ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>✈️</div>
                    <div>
                      <h3 className={`text-[11px] font-black leading-tight ${isTravelMode ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>Travel Mode</h3>
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Sembunyikan dari Laporan</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => toggleTravelMode && toggleTravelMode(!isTravelMode)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${isTravelMode ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isTravelMode ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                {isTravelMode && (
                  <div className="mt-2.5 pt-2.5 border-t border-indigo-100 dark:border-indigo-500/20 animate-in slide-in-from-top-2 duration-200 relative z-10">
                    <input 
                      type="text" 
                      value={activeTripName || ""} 
                      onChange={(e) => updateTripName && updateTripName(e.target.value)} 
                      placeholder="Nama Trip (misal: Trip Bali 2026)"
                      autoComplete="off"
                      className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex gap-3 shrink-0">
              {editingTransaction ? (
                <button 
                  type="button" 
                  onClick={() => { 
                    triggerHaptic(); 
                    
                    // UX Premium: Hard-Block Overdraft untuk Mode Edit
                    if (editTType === "expense" || editTType === "transfer") {
                      const editSourceAcc = accounts.find(a => a.id === editTAccountId);
                      if (editSourceAcc) {
                        let availableBalance = editSourceAcc.balance;
                        
                        // Algoritma Pintar: Jika dompet asal tidak diganti, uang yang bisa dipakai = Saldo saat ini + Saldo transaksi lama yang dibatalkan
                        if (editingTransaction.accountId === editTAccountId && (editingTransaction.type === "expense" || editingTransaction.type === "transfer")) {
                          const oldRawAmount = editingTransaction.originalAmount !== undefined ? editingTransaction.originalAmount : editingTransaction.amount;
                          availableBalance += oldRawAmount;
                        }
                        
                        if (safeEvaluate(editTAmount) > availableBalance) {
                          alert(`Transaksi Ditolak!\n\nSaldo dompet tidak mencukupi.\nMaksimal dana yang bisa digunakan adalah ${formatCurrencyTerbaca(availableBalance.toString(), editSourceAcc.currency)}.`);
                          return; // BLOCK EKSEKUSI
                        }
                      }
                    }

                    handleUpdateTransaction(); 
                    closeMainDrawer(); 
                  }} 
                  className={`flex-1 py-3.5 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer border ${currentTheme.fab}`}
                >
                  Simpan Koreksi
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => { 
                    triggerHaptic(); 
                    
                    // UX Premium: Hard-Block Overdraft untuk Transaksi Baru
                    if (tType === "expense" || tType === "transfer") {
                      if (selectedSourceAcc && safeEvaluate(tAmount) > selectedSourceAcc.balance) {
                        alert(`Transaksi Ditolak!\n\nSaldo dompet "${selectedSourceAcc.name}" tidak mencukupi.\nSisa saldo: ${formatCurrencyTerbaca(selectedSourceAcc.balance.toString(), selectedSourceAcc.currency)}.`);
                        return; // BLOCK EKSEKUSI
                      }
                    }

                    if(splits.length > 0) handleTransaction(splits); else handleTransaction(); 
                    closeMainDrawer(); 
                  }} 
                  className={`flex-1 py-3.5 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer border ${currentTheme.fab}`}
                >
                  Simpan Transaksi
                </button>
              )}
              <button type="button" onClick={closeMainDrawer} className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMILIHAN KATEGORI UTAMA TRANSAKSI */}
      {showCatModal && activeType !== "transfer" && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-md md:max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh] border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>🏷️</span> Pilih Kategori {activeType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </h3>
              <button type="button" onClick={() => setShowCatModal(false)} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full cursor-pointer"><X size={14}/></button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input type="text" placeholder="Cari kategori..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 text-slate-800 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="p-4 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 text-left">
              {activeType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-orange-100 dark:border-orange-900/30 z-10"><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel</p></div>
                    <div className="flex flex-col gap-1.5">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectCategory(cat.name)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${tCategory === cat.name ? currentTheme.activePill : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                          <span className="shrink-0">{cat.icon || getCategoryIcon(cat.name)}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4 animate-in fade-in duration-150">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-purple-100 dark:border-purple-900/30 z-10"><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap</p></div>
                    <div className="flex flex-col gap-1.5">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectCategory(cat.name)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${tCategory === cat.name ? currentTheme.activePill : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                          <span className="shrink-0">{cat.icon || getCategoryIcon(cat.name)}</span>
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 animate-in fade-in duration-150">
                  {filteredCategories.filter(c => c.type === "income").map(cat => (
                    <button key={cat.id} type="button" onClick={() => handleSelectCategory(cat.name)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${tCategory === cat.name ? currentTheme.activePill : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                      <span className="shrink-0">{cat.icon || getCategoryIcon(cat.name)}</span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMILIHAN KATEGORI PECAHAN (BARU) DENGAN SEGREGASI VAR & FIXED */}
      {showSplitCatModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh] border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm"><span>🏷️</span> Pilih Kategori Pecahan</h3>
              <button type="button" onClick={() => { setShowSplitCatModal(false); setActiveSplitIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full cursor-pointer"><X size={14}/></button>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 shrink-0">
              <input type="text" placeholder="Cari kategori..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 text-slate-800 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="p-5 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 text-left">
              {tType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-orange-100 dark:border-orange-900/30 z-10"><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel</p></div>
                    <div className="flex flex-col gap-1.5">
                      {categories.filter(c => c.type === "expense" && c.expenseType !== "fixed" && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all">
                          <span className="mr-2">{cat.icon || getCategoryIcon(cat.name)}</span>{cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-purple-100 dark:border-purple-900/30 z-10"><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap</p></div>
                    <div className="flex flex-col gap-1.5">
                      {categories.filter(c => c.type === "expense" && c.expenseType === "fixed" && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all">
                          <span className="mr-2">{cat.icon || getCategoryIcon(cat.name)}</span>{cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {categories.filter(c => c.type === "income" && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cat => (
                    <button key={cat.id} type="button" onClick={() => handleSelectSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all">
                      <span className="mr-2">{cat.icon || getCategoryIcon(cat.name)}</span>{cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMILIHAN KATEGORI PECAHAN (KOREKSI) DENGAN SEGREGASI VAR & FIXED */}
      {showEditSplitCatModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh] border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm"><span>🏷️</span> Pilih Kategori Pecahan</h3>
              <button type="button" onClick={() => { setShowEditSplitCatModal(false); setActiveEditSplitIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full cursor-pointer"><X size={14}/></button>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 shrink-0"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-blue-500 text-slate-800 dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="p-5 overflow-y-auto no-scrollbar bg-white dark:bg-slate-900 text-left">
              {editTType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-orange-100 dark:border-orange-900/30 z-10"><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel</p></div>
                    <div className="flex flex-col gap-1.5">
                      {categories.filter(c => c.type === "expense" && c.expenseType !== "fixed" && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectEditSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all">
                          <span className="mr-2">{cat.icon || getCategoryIcon(cat.name)}</span>{cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-purple-100 dark:border-purple-900/30 z-10"><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap</p></div>
                    <div className="flex flex-col gap-1.5">
                      {categories.filter(c => c.type === "expense" && c.expenseType === "fixed" && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectEditSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all">
                          <span className="mr-2">{cat.icon || getCategoryIcon(cat.name)}</span>{cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {categories.filter(c => c.type === "income" && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cat => (
                    <button key={cat.id} type="button" onClick={() => handleSelectEditSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-all">
                      <span className="mr-2">{cat.icon || getCategoryIcon(cat.name)}</span>{cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETIL SPLIT MODAL (NEW TRANSACTIONS SPLITS) DENGAN DETEKSI OVER-ALOKASI SECARA REAL-TIME */}
      {showSplitModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                <span>✂️</span> Pecah Transaksi ({formatCurrencyTerbaca(tAmount, selectedSourceAcc?.currency)})
              </h3>
              <button type="button" onClick={() => { setShowSplitModal(false); setActiveSplitKeypadIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full cursor-pointer"><X size={14}/></button>
            </div>

            <div className="p-5 overflow-y-auto no-scrollbar space-y-4 bg-white dark:bg-slate-950 flex-1">
              <div className={`p-4 rounded-2xl border ${currentTheme.bgLight} ${currentTheme.border}`}>
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Nominal Transaksi:</span>
                  <span className="font-black text-slate-800 dark:text-white">{formatCurrencyTerbaca(tAmount, selectedSourceAcc?.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">
                  <span>Total Alokasi:</span>
                  <span className={`font-black ${tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0) === safeEvaluate(tAmount) ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {currentSymbol} {tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0).toLocaleString('id-ID')}
                  </span>
                </div>
                {(() => {
                  const remainingNew = safeEvaluate(tAmount) - tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0);
                  return (
                    <div className="flex justify-between items-center text-xs font-bold mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="text-slate-600 dark:text-slate-300">{remainingNew < 0 ? "Kelebihan Alokasi:" : "Sisa Belum Dialokasi:"}</span>
                      <span className={`font-black ${remainingNew === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {currentSymbol} {Math.abs(remainingNew).toLocaleString('id-ID')}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                {tempSplits.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400">Pecahan #{i + 1}</span>
                      {tempSplits.length > 1 && (
                        <button type="button" onClick={() => setTempSplits(tempSplits.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-bold flex items-center gap-0.5 cursor-pointer"><X size={14} /> Hapus</button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400">Kategori</label>
                        <div onClick={() => { setActiveSplitIndex(i); setShowSplitCatModal(true); setSearchQuery(""); }} className="p-3 !bg-slate-50 dark:!bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between truncate hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                          <span className="truncate">{item.category || "Pilih..."}</span><ChevronDown size={14} className="text-slate-400 shrink-0" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400">Nominal ({selectedSourceAcc?.currency || "IDR"})</label>
                        <input 
                          type="text" 
                          inputMode={isMobile ? "none" : undefined} 
                          onFocus={() => { if(isMobile) { setActiveSplitKeypadIndex(i); setActiveKeypad(null); setActiveEditSplitKeypadIndex(null); } }} 
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          className="w-full p-3 !bg-slate-50 dark:!bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500" 
                          value={item.amountStr} 
                          onChange={(e) => {
                            const updated = [...tempSplits];
                            updated[i].amountStr = e.target.value.replace(/[^0-9+*/().-]/g, "");
                            setTempSplits(updated);
                          }} 
                        />
                        {item.amountStr && <p className="text-[9px] font-bold text-slate-400 pl-1 mt-1">Terbaca: <span className={`${currentTheme.text} font-black`}>{formatCurrencyTerbaca(item.amountStr, selectedSourceAcc?.currency)}</span></p>}
                      </div>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Catatan Pecahan (Opsional)..." 
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      className="w-full p-3 !bg-slate-50 dark:!bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500" 
                      value={item.note || ""} 
                      onChange={(e) => {
                        const updated = [...tempSplits];
                        updated[i].note = e.target.value;
                        setTempSplits(updated);
                      }} 
                    />
                  </div>
                ))}
              </div>

              <button type="button" onClick={handleAddSplitItem} className={`w-full py-3 border border-dashed rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-colors ${currentTheme.bgLight} ${currentTheme.border} ${currentTheme.text}`}><Plus size={14} /> Tambah Pecahan Kategori</button>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex gap-3 shrink-0">
              <button type="button" onClick={handleConfirmSplits} className={`flex-1 py-3.5 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer border ${currentTheme.fab}`}>Konfirmasi</button>
              <button type="button" onClick={() => { setShowSplitModal(false); setActiveSplitKeypadIndex(null); }} className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING KEYPAD DRAWER UNTUK MAIN NOMINAL & ADMIN FEE */}
      {isMobile && activeKeypad && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/80 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0 text-slate-800 dark:text-white">
            <div className="flex justify-between items-center mb-3 px-1 text-left">
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>{activeKeypad === "amount" ? "Kalkulator Nominal" : "Kalkulator Biaya Admin"}</span>
              <button onClick={() => setActiveKeypad(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer">Selesai <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-slate-100 font-black text-sm">
              {["+", "-", "*", "/"].map((op) => (
                <button key={op} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(op) : handleKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/30 dark:border-slate-800/20">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>
              ))}
              {["7", "8", "9"].map((num) => (
                <button key={num} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(num) : handleKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress("C") : handleKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/30 active:bg-red-100/80 dark:active:bg-red-900/40 rounded-xl transition-all select-none font-bold">C</button>
              {["4", "5", "6"].map((num) => (
                <button key={num} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(num) : handleKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress("⌫") : handleKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 flex items-center justify-center transition-all select-none">⌫</button>
              {["1", "2", "3"].map((num) => (
                <button key={num} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(num) : handleKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/45 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress(".") : handleKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">.</button>
              {["00", "0", "000"].map((char) => (
                <button key={char} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(char) : handleKeypadPress(char)} className={`bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 py-3.5 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10`}>{char}</button>
              ))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress("Ya") : handleKeypadPress("Ya")} className={`py-3.5 text-white font-black shadow-md transition-all select-none cursor-pointer rounded-xl border ${currentTheme.fab}`}>Ya</button>
            </div>
          </div>
        </>
      )}

      {/* FLOATING KEYPAD DRAWER UNTUK NOMINAL PECAHAN BARU (NEW SPLITS) */}
      {isMobile && activeSplitKeypadIndex !== null && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveSplitKeypadIndex(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/80 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0 text-slate-800 dark:text-white">
            <div className="flex justify-between items-center mb-3 text-left">
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>Kalkulator Pecahan #{activeSplitKeypadIndex + 1}</span>
              <button onClick={() => setActiveSplitKeypadIndex(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer">Selesai <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-slate-100 font-black text-sm">
              {["+", "-", "*", "/"].map((op) => (
                <button key={op} type="button" onClick={() => handleSplitKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/30 dark:border-slate-800/20">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>
              ))}
              {["7", "8", "9"].map((num) => (
                <button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleSplitKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/30 active:bg-red-100/80 dark:active:bg-red-900/40 rounded-xl transition-all select-none font-bold">C</button>
              {["4", "5", "6"].map((num) => (
                <button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleSplitKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 flex items-center justify-center transition-all select-none">⌫</button>
              {["1", "2", "3"].map((num) => (
                <button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/45 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleSplitKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">.</button>
              {["00", "0", "000"].map((char) => (
                <button key={char} type="button" onClick={() => handleSplitKeypadPress(char)} className={`bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 py-3.5 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10`}>{char}</button>
              ))}
              <button type="button" onClick={() => handleSplitKeypadPress("Ya")} className={`py-3.5 text-white font-black shadow-md transition-all select-none cursor-pointer rounded-xl border ${currentTheme.fab}`}>Ya</button>
            </div>
          </div>
        </>
      )}

      {/* FLOATING KEYPAD DRAWER UNTUK NOMINAL PECAHAN KOREKSI (EDIT SPLITS) */}
      {isMobile && activeEditSplitKeypadIndex !== null && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveEditSplitKeypadIndex(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/80 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0 text-slate-800 dark:text-white">
            <div className="flex justify-between items-center mb-3 text-left">
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>Kalkulator Pecahan Koreksi #{activeEditSplitKeypadIndex + 1}</span>
              <button onClick={() => setActiveEditSplitKeypadIndex(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer">Selesai <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-slate-100 font-black text-sm">
              {["+", "-", "*", "/"].map((op) => (
                <button key={op} type="button" onClick={() => handleEditSplitKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/30 dark:border-slate-800/20">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>
              ))}
              {["7", "8", "9"].map((num) => (
                <button key={num} type="button" onClick={() => handleEditSplitKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleEditSplitKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/30 active:bg-red-100/80 dark:active:bg-red-900/40 rounded-xl transition-all select-none font-bold">C</button>
              {["4", "5", "6"].map((num) => (
                <button key={num} type="button" onClick={() => handleEditSplitKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleEditSplitKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 flex items-center justify-center transition-all select-none">⌫</button>
              {["1", "2", "3"].map((num) => (
                <button key={num} type="button" onClick={() => handleEditSplitKeypadPress(num)} className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/45 dark:border-slate-800/10">{num}</button>
              ))}
              <button type="button" onClick={() => handleEditSplitKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">.</button>
              {["00", "0", "000"].map((char) => (
                <button key={char} type="button" onClick={() => handleEditSplitKeypadPress(char)} className={`bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 py-3.5 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10`}>{char}</button>
              ))}
              <button type="button" onClick={() => handleEditSplitKeypadPress("Ya")} className={`py-3.5 text-white font-black shadow-md transition-all select-none cursor-pointer rounded-xl border ${currentTheme.fab}`}>Ya</button>
            </div>
          </div>
        </>
      )}

      {/* BOTTOM SHEET: PILIH DOMPET */}
      {activeAccSelector && (
        <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={() => setActiveAccSelector(null)}></div>
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-t-[32px] shadow-2xl p-6 pb-8 overflow-hidden animate-in slide-in-from-bottom duration-300 z-10 flex flex-col max-h-[85vh] border-t border-slate-200 dark:border-slate-800">
            <div className="w-full flex justify-center pb-2"><div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div></div>
            <div className="flex justify-between items-center mb-6 pt-2">
              <div className="flex items-center gap-2">
                <Wallet size={18} className={currentTheme.text} />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Select From Account</h3>
              </div>
              <button type="button" onClick={() => setActiveAccSelector(null)} className="p-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-full transition-colors cursor-pointer"><X size={14} className="text-slate-700 dark:text-slate-300" /></button>
            </div>
            <div className="overflow-y-auto no-scrollbar pr-1 text-left">
              <div className="grid grid-cols-2 gap-3">
                {(activeAccSelector === "source" ? availableSourceAccounts : accounts).map(acc => {
                  const activeId = activeAccSelector === "source" ? (editingTransaction ? editTAccountId : tAccountId) : (editingTransaction ? editTToAccountId : tToAccountId);
                  const isSelected = activeId === acc.id;
                  return (
                    <div key={acc.id} onClick={() => { triggerHaptic(); handleSelectAccount(acc.id); }} className={`p-4 rounded-2xl border text-left flex flex-col justify-between relative transition-all active:scale-95 cursor-pointer h-28 ${isSelected ? currentTheme.activeAccCard : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                      <div className="flex justify-between items-start">
                        {acc.logo ? ( <img src={acc.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-white" /> ) : ( <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><Wallet size={16} /></div> )}
                        {isSelected && ( <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow ${currentTheme.checkCircle}`}>✓</div> )}
                      </div>
                      <div className="mt-2 min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-none mb-1">{acc.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate leading-none">{getCurrencySymbol(acc.currency)} {acc.balance.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL: EDIT KATEGORI INSTAN */}
      {editingCat && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-xs shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-left">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1">🔧 Atur Logo & Kategori</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400">Emoji / Logo Kustom (Satu Karakter)</label>
                <input 
                  type="text" 
                  maxLength={8} 
                  placeholder="Ketik satu emoji (misal: 💈, 🍛)" 
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="w-full p-3 !bg-slate-50 dark:!bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl font-black outline-blue-500 text-slate-800 dark:text-white focus:border-blue-500" 
                  value={editCatIcon} 
                  onChange={(e) => setEditCatIcon(e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400">Nama Kategori</label>
                <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white focus:border-blue-500" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                type="button" 
                onClick={async () => { 
                  if (updateCategory && editingCat) { 
                    triggerHaptic(); 
                    await updateCategory(
                      editingCat.id, 
                      editCatName, 
                      editingCat.budgetLimit || null, 
                      editingCat.expenseType || "variable", 
                      editCatIcon
                    ); 
                    setEditingCat(null); 
                    setShowCatModal(false); 
                    alert("Kategori berhasil diperbarui!"); 
                  } 
                }} 
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer border ${currentTheme.fab}`}
              >
                Simpan
              </button>
              <button type="button" onClick={() => setEditingCat(null)} className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors">Batal</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}