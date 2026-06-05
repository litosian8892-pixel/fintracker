"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  tType: "income" | "expense" | "transfer";
  setTType: (type: "income" | "expense" | "transfer") => void;
  tDate: string;
  setTDate: (date: string) => void;
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
  
  // States tambahan hasil sinkronisasi dengan page.tsx
  transactions: TransactionData[];
  onDeleteTransaction: (t: TransactionData) => void;
  onEditTransaction: (t: TransactionData) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;

  // Koreksi / Edit Transaksi states
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
  editTAdminFee: string;
  setEditTAdminFee: (fee: string) => void;
  editTSplits: SplitItemData[];
  setEditTSplits: (splits: SplitItemData[]) => void;
  updateCategory?: (id: string, newName: string, newBudget: number | null, expenseType: "fixed" | "variable", newIcon?: string) => Promise<void>;
}

const safeEvaluate = (expr: string): number => {
  if (!expr) return 0;
  let sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return 0;
  sanitized = sanitized.replace(/[+\-*/(.]*$/, "");
  if (!sanitized) return 0;
  try {
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result === "number" && isFinite(result)) {
      return result;
    }
    return 0;
  } catch {
    const fallback = parseFloat(sanitized);
    return isNaN(fallback) ? 0 : fallback;
  }
};

const getCurrencySymbol = (currency?: string) => {
  if (!currency) return "Rp";
  switch (currency.toUpperCase()) {
    case "IDR": return "Rp";
    case "USD": return "$";
    case "SGD": return "S$";
    case "EUR": return "€";
    case "JPY": return "¥";
    case "CNY": return "¥";
    case "GBP": return "£";
    case "AUD": return "A$";
    case "MYR": return "RM";
    case "SAR": return "SR";
    default: return currency;
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

export default function HomeTab({
  tType, setTType, tDate, setTDate, tCategory, setTCategory, tAccountId, setTAccountId, tToAccountId, setTToAccountId, tAmount, setTAmount, tAdminFee, setTAdminFee, tNote, setTNote, categories, accounts, handleTransaction,
  transactions, onDeleteTransaction, onEditTransaction, isPrivacyMode, togglePrivacyMode,
  editingTransaction, setEditingTransaction, handleUpdateTransaction,
  editTAmount, setEditTAmount, editTType, setEditTType, editTAccountId, setEditTAccountId, editTToAccountId, setEditTToAccountId, editTNote, setEditTNote, editTCategory, setEditTCategory, editTDate, setEditTDate, editTAdminFee, setEditTAdminFee, editTSplits, setEditTSplits,
  updateCategory
}: HomeTabProps) {
  
  // Filter bulan aktif bergaya Gambar 3
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKeypad, setActiveKeypad] = useState<"amount" | "adminFee" | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // States Baru untuk Edit Logo / Emoji Kategori di Tempat
  const [editingCat, setEditingCat] = useState<CategoryData | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("");

  // States baru pencarian dan penyaringan dompet
  const [searchQueryInput, setSearchQueryInput] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedAccountIdFilter, setSelectedAccountIdFilter] = useState("all");
  const [showAccountFilterDropdown, setShowAccountFilterDropdown] = useState(false);

  // State pemilih akun/dompet aktif untuk pop-up card
  const [activeAccSelector, setActiveAccSelector] = useState<"source" | "dest" | null>(null);

  // States pecahan transaksi (splits) baru
  const [splits, setSplits] = useState<SplitItemData[]>([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [tempSplits, setTempSplits] = useState<{ category: string; amountStr: string; note: string }[]>([]);
  const [activeSplitIndex, setActiveSplitIndex] = useState<number | null>(null);
  const [showSplitCatModal, setShowSplitCatModal] = useState(false);
  const [activeSplitKeypadIndex, setActiveSplitKeypadIndex] = useState<number | null>(null);

  // States koreksi / edit splits
  const [showEditSplitCatModal, setShowEditSplitCatModal] = useState(false);
  const [activeEditSplitIndex, setActiveEditSplitIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); 
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sinkronisasi Drawer jika dipicu dari luar (Aksi Edit/Koreksi dari page.tsx)
  useEffect(() => {
    if (editingTransaction) {
      setIsDrawerOpen(true);
    }
  }, [editingTransaction]);

  // Pembersihan splits setelah transaksi sukses / tAmount dibersihkan parent
  useEffect(() => {
    if (!tAmount || safeEvaluate(tAmount) === 0) {
      setSplits([]);
    }
  }, [tAmount]);

  const availableSourceAccounts = tType === "transfer" ? accounts : accounts.filter(acc => !acc.isSavings);
  const selectedSourceAcc = accounts.find(a => a.id === tAccountId);
  const currentSymbol = getCurrencySymbol(selectedSourceAcc?.currency);

  const formatCurrencyTerbaca = (val: string, currencyCode?: string) => {
    if (!val) return `${getCurrencySymbol(currencyCode)} 0`;
    const parsed = safeEvaluate(val);
    const code = currencyCode || "IDR";
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: code.toUpperCase() === "IDR" ? "IDR" : code.toUpperCase(), 
      minimumFractionDigits: 0, 
      maximumFractionDigits: code.toUpperCase() === "IDR" ? 0 : 2 
    }).format(parsed);
  };

  const handleTypeChange = (newType: "income" | "expense" | "transfer") => {
    setTType(newType);
    setTAccountId("");
    setTToAccountId("");
    setSplits([]);
    if (newType !== "transfer") setTCategory("");
  };

  const handleEditTypeChange = (newType: "income" | "expense" | "transfer") => {
    setEditTType(newType);
    setEditTAccountId("");
    setEditTToAccountId("");
    setEditTSplits([]);
    if (newType !== "transfer") setEditTCategory("");
  };

  useEffect(() => {
    if (tType === "transfer") {
      setTCategory("Transfer");
    } else {
      const matchingCats = categories.filter((cat) => cat.type === tType);
      if (tCategory && !matchingCats.some(c => c.name === tCategory) && tCategory !== "Split Transaksi") {
        setTCategory("");
      }
    }
  }, [tType, categories, tCategory, setTCategory]);

  useEffect(() => {
    if (editTType === "transfer") {
      setEditTCategory("Transfer");
    } else {
      const matchingCats = categories.filter((cat) => cat.type === editTType);
      if (editTCategory && !matchingCats.some(c => c.name === editTCategory) && editTCategory !== "Split Transaksi") {
        setEditTCategory("");
      }
    }
  }, [editTType, categories, editTCategory, setEditTCategory]);

  const filteredCategories = categories
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const triggerHaptic = () => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); };
  
  const handleKeypadPress = (key: string) => {
    triggerHaptic();
    const currentVal = activeKeypad === "amount" ? tAmount : tAdminFee;
    const setVal = activeKeypad === "amount" ? setTAmount : setTAdminFee;
    if (key === "⌫") setVal(currentVal.slice(0, -1));
    else if (key === "C") setVal("");
    else if (key === "=") { const evaluated = safeEvaluate(currentVal); setVal(evaluated > 0 ? evaluated.toString() : ""); } 
    else if (key === "Ya") setActiveKeypad(null);
    else setVal(currentVal + key);
  };

  const handleEditKeypadPress = (key: string) => {
    triggerHaptic();
    const currentVal = activeKeypad === "amount" ? editTAmount : editTAdminFee;
    const setVal = activeKeypad === "amount" ? setEditTAmount : setEditTAdminFee;
    if (key === "⌫") setVal(currentVal.slice(0, -1));
    else if (key === "C") setVal("");
    else if (key === "=") { const evaluated = safeEvaluate(currentVal); setVal(evaluated > 0 ? evaluated.toString() : ""); } 
    else if (key === "Ya") setActiveKeypad(null);
    else setVal(currentVal + key);
  };

  const handleSplitKeypadPress = (key: string) => {
    triggerHaptic();
    if (activeSplitKeypadIndex === null) return;
    const currentVal = tempSplits[activeSplitKeypadIndex].amountStr || "";
    const updated = [...tempSplits];
    
    if (key === "⌫") updated[activeSplitKeypadIndex].amountStr = currentVal.slice(0, -1);
    else if (key === "C") updated[activeSplitKeypadIndex].amountStr = "";
    else if (key === "=") {
      const evaluated = safeEvaluate(currentVal);
      updated[activeSplitKeypadIndex].amountStr = evaluated > 0 ? evaluated.toString() : "";
    } else if (key === "Ya") {
      setActiveSplitKeypadIndex(null);
      return;
    } else updated[activeSplitKeypadIndex].amountStr = currentVal + key;
    setTempSplits(updated);
  };

  const handleAddSplitItem = () => {
    const targetAmount = safeEvaluate(tAmount);
    const currentSum = tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0);
    const remaining = Math.max(0, targetAmount - currentSum);
    setTempSplits([...tempSplits, { category: tCategory || "", amountStr: remaining > 0 ? remaining.toString() : "", note: "" }]);
  };

  const handleSelectSplitCategory = (catName: string) => {
    if (activeSplitIndex !== null) {
      const updated = [...tempSplits];
      updated[activeSplitIndex].category = catName;
      setTempSplits(updated);
    }
    setShowSplitCatModal(false);
    setActiveSplitIndex(null);
  };

  // FUNGSI BARU: Mengubah kategori rincian pecahan khusus mode edit
  const handleSelectEditSplitCategory = (catName: string) => {
    if (activeEditSplitIndex !== null) {
      const updated = [...editTSplits];
      updated[activeEditSplitIndex].category = catName;
      setEditTSplits(updated);
    }
    setShowEditSplitCatModal(false);
    setActiveEditSplitIndex(null);
  };

  const handleConfirmSplits = () => {
    const targetAmount = safeEvaluate(tAmount);
    const evaluatedSplits = tempSplits.map(s => ({
      category: s.category,
      amount: safeEvaluate(s.amountStr),
      note: s.note
    }));
    const currentSum = evaluatedSplits.reduce((sum, s) => sum + s.amount, 0);
    
    if (evaluatedSplits.some(s => !s.category)) return alert("Seluruh pecahan wajib dipilih kategorinya!");
    if (evaluatedSplits.some(s => s.amount <= 0)) return alert("Nominal pecahan tidak boleh kosong!");
    if (currentSum !== targetAmount) {
      return alert(`Total alokasi pecahan (${currentSymbol} ${currentSum.toLocaleString('id-ID')}) harus sama persis dengan nominal utama (${currentSymbol} ${targetAmount.toLocaleString('id-ID')})!`);
    }

    setSplits(evaluatedSplits);
    setTCategory("Split Transaksi");
    setShowSplitModal(false);
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  // --- LOGIKA GENERASI BULAN REAKTIF (6 Bulan Terakhir) ---
  const recentMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      months.push({ value, label });
    }
    return months;
  }, []);

  // --- KALKULASI RINGKASAN SALDO PREMIUM CARD ---
  // Hanya kalkulasi dompet bertipe AKUN (!acc.isSavings) dan keluarkan dompet bertipe ASET (acc.isSavings === true)
  const totalBalanceCalculated = useMemo(() => {
    return accounts
      .filter(acc => !acc.isSavings && !acc.excludeFromTotal)
      .reduce((sum, acc) => sum + (acc.balance * (acc.lastExchangeRate || 1)), 0);
  }, [accounts]);

  // Saringan Berantai (Filter) Berdasarkan Bulan, Pencarian, & Filter Dompet Aktif
  const monthlyTransactions = useMemo(() => {
    let filtered = transactions.filter(t => t.tDate && t.tDate.startsWith(selectedMonth));
    
    // Filter Berdasarkan Akun/Dompet Terpilih
    if (selectedAccountIdFilter !== "all") {
      filtered = filtered.filter(t => t.accountId === selectedAccountIdFilter || t.toAccountId === selectedAccountIdFilter);
    }
    
    // Filter Berdasarkan Kata Kunci Pencarian
    if (searchQueryInput.trim()) {
      const q = searchQueryInput.toLowerCase();
      filtered = filtered.filter(t => 
        (t.note && t.note.toLowerCase().includes(q)) || 
        t.category.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [transactions, selectedMonth, selectedAccountIdFilter, searchQueryInput]);

  const monthlySummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    monthlyTransactions.forEach(t => {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
      if (t.type === "transfer" && t.adminFee) expense += t.adminFee;
    });
    return { income, expense };
  }, [monthlyTransactions]);

  // Mengelompokkan transaksi harian secara urut menurun (descending)
  const groupedTransactionsByDay = useMemo(() => {
    const groups: Record<string, TransactionData[]> = {};
    monthlyTransactions.forEach(t => {
      if (!groups[t.tDate]) groups[t.tDate] = [];
      groups[t.tDate].push(t);
    });
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(dateStr => {
        const list = groups[dateStr];
        let dailyNet = 0;
        list.forEach(t => {
          if (t.type === "income") dailyNet += t.amount;
          else if (t.type === "expense") dailyNet -= t.amount;
        });
        return { dateStr, list, dailyNet };
      });
  }, [monthlyTransactions]);

  const formatDayHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNum = d.getDate();
    const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
    const monthYear = d.toLocaleDateString("id-ID", { month: "2-digit", year: "2-digit" }).replace(/\//g, "/");
    return { dayNum, dayName, monthYear };
  };

  const closeMainDrawer = () => {
    setIsDrawerOpen(false);
    setEditingTransaction(null);
    setActiveKeypad(null);
  };

  // Cari objek kategori aktif pilihan pengguna untuk merender logo besar secara dinamis di header
  const activeCategoryObject = useMemo(() => {
    const activeName = editingTransaction ? editTCategory : tCategory;
    return categories.find(c => c.name === activeName);
  }, [categories, tCategory, editTCategory, editingTransaction]);

  const renderActiveCategoryIcon = () => {
    if (activeCategoryObject?.icon) return activeCategoryObject.icon;
    const activeName = editingTransaction ? editTCategory : tCategory;
    return getCategoryIcon(activeName || "");
  };

  const getRowIcon = (item: TransactionData) => {
    const catObj = categories.find(c => c.name === item.category);
    return catObj?.icon || getCategoryIcon(item.category);
  };

  const handleSelectAccount = (accId: string) => {
    if (activeAccSelector === "source") {
      if (editingTransaction) {
        setEditTAccountId(accId);
      } else {
        setTAccountId(accId);
      }
    } else if (activeAccSelector === "dest") {
      if (editingTransaction) {
        setEditTToAccountId(accId);
      } else {
        setTToAccountId(accId);
      }
    }
    setActiveAccSelector(null);
  };

  // Menentukan tipe transaksi aktif secara dinamis (expense/income) baik mode baru maupun edit
  const activeType = editingTransaction ? editTType : tType;

  const handleSelectCategory = (catName: string) => {
    if (editingTransaction) {
      setEditTCategory(catName);
    } else {
      setTCategory(catName);
    }
    setShowCatModal(false);
  };

  return (
    <div className="space-y-6 text-left relative min-h-[calc(100vh-120px)] transition-colors duration-200">
      
      {/* HEADER TAB TRANSAKSI (GAMBAR 3 STYLE DENGAN PENCARIAN & FILTER DOMPET AKTIF) */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {!isSearchExpanded ? (
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">Transaksi</h2>
          ) : (
            <div className="flex items-center gap-2 w-full pr-2 animate-in slide-in-from-left-2 duration-150">
              <input 
                type="text" 
                placeholder="Cari transaksi..." 
                className="w-full px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold outline-none focus:border-blue-500 text-slate-855 dark:text-slate-100"
                value={searchQueryInput}
                onChange={(e) => setSearchQueryInput(e.target.value)}
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => { setSearchQueryInput(""); setIsSearchExpanded(false); }} 
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-855 rounded-full text-slate-400"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-2">
          {/* Tombol Cari Transaksi */}
          <button 
            type="button" 
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${isSearchExpanded ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Search size={18} />
          </button>

          {/* Filter Akun/Dompet Terpakai - Sebelah Kanan Atas */}
          <div className="relative">
            <button 
              type="button" 
              onClick={() => setShowAccountFilterDropdown(!showAccountFilterDropdown)}
              className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center gap-1 cursor-pointer select-none"
            >
              {selectedAccountIdFilter === "all" ? "All" : accounts.find(a => a.id === selectedAccountIdFilter)?.name || "All"}
              <ChevronDown size={10} />
            </button>
            
            {showAccountFilterDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAccountFilterDropdown(false)}></div>
                <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => { setSelectedAccountIdFilter("all"); setShowAccountFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold ${selectedAccountIdFilter === "all" ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    Semua Dompet (All)
                  </button>
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => { setSelectedAccountIdFilter(acc.id); setShowAccountFilterDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold ${selectedAccountIdFilter === acc.id ? "text-blue-600 bg-blue-50 dark:bg-blue-950/30" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HORIZONTAL MONTH SCROLLING PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
        {recentMonths.map((m) => {
          const isActive = selectedMonth === m.value;
          return (
            <button 
              key={m.value}
              type="button" 
              onClick={() => setSelectedMonth(m.value)}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                isActive 
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10" 
                  : "bg-slate-100/70 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-855 dark:hover:text-slate-100"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* PREMIUM TOTAL SALDO SUMMARY CARD (Gambar 3 Style) */}
      <div className="p-6 rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white shadow-xl relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-blue-100 tracking-wider uppercase">Total Saldo Terkonsolidasi</span>
            <button type="button" className="p-1 text-blue-200/50 hover:text-white rounded-full transition-colors"><Trophy size={12} className="text-yellow-400" /></button>
            <span className="text-[9px] font-black bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-500/20 text-blue-100 flex items-center gap-0.5"><Receipt size={10} /> {monthlyTransactions.length}</span>
          </div>
          <button 
            type="button" 
            onClick={togglePrivacyMode} 
            className="p-1.5 bg-white/10 active:bg-white/20 text-white rounded-full transition-all duration-200 cursor-pointer hover:scale-105"
          >
            {isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <div className="text-3xl font-black tracking-tight mb-6 relative z-10">
          {isPrivacyMode ? "Rp •••••••" : `Rp ${totalBalanceCalculated.toLocaleString("id-ID")}`}
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0"><ArrowUpRight size={18} strokeWidth={2.5} /></div>
            <div>
              <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Pemasukan ({selectedMonth.split("-")[1]})</p>
              <p className="text-sm font-extrabold tracking-tight">
                {isPrivacyMode ? "Rp •••••" : `Rp ${monthlySummary.income.toLocaleString("id-ID")}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="w-9 h-9 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center shrink-0"><ArrowDownRight size={18} strokeWidth={2.5} /></div>
            <div>
              <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Pengeluaran ({selectedMonth.split("-")[1]})</p>
              <p className="text-sm font-extrabold tracking-tight text-rose-300">
                {isPrivacyMode ? "Rp •••••" : `Rp ${monthlySummary.expense.toLocaleString("id-ID")}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY GROUPED TRANSACTION HISTORY LIST */}
      <div className="space-y-4">
        {groupedTransactionsByDay.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[28px]">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold">Tidak ada transaksi tercatat di bulan ini.</p>
          </div>
        ) : (
          groupedTransactionsByDay.map(({ dateStr, list, dailyNet }) => {
            const { dayNum, dayName, monthYear } = formatDayHeader(dateStr);
            return (
              <div key={dateStr} className="space-y-2">
                {/* HEADLINE HARIAN (FORMAT GAMBAR 3 STYLE) */}
                <div className="flex items-center justify-between px-2 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100">{dayNum}</span>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">{dayName}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600">{monthYear}</span>
                  </div>
                  <span className={`text-xs font-black ${dailyNet > 0 ? "text-emerald-500" : dailyNet < 0 ? "text-rose-500" : "text-slate-400"}`}>
                    {isPrivacyMode ? "Rp ••" : `${dailyNet > 0 ? "+" : ""}${dailyNet.toLocaleString("id-ID")}`}
                  </span>
                </div>

                {/* TRANSACTIONS UNDER ACTIVE DAY */}
                <div className="space-y-2">
                  {list.map((t) => {
                    const isTransfer = t.type === "transfer";
                    const symbol = isPrivacyMode ? "" : "-";
                    const isIncome = t.type === "income";
                    return (
                      <div key={t.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-blue-100 dark:hover:border-blue-900/30 transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                            {getRowIcon(t)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate flex items-center gap-1">
                              {t.category} 
                              {t.splits && t.splits.length > 0 && <span className="text-[8px] px-1 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded font-bold">✂️ {t.splits.length} Pecahan</span>}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {t.note || (isTransfer ? "Transfer Dana" : "-")}
                            </p>
                            <p className="text-[9px] font-extrabold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md border border-blue-100/20 w-fit mt-1 uppercase flex items-center gap-0.5">
                              <Wallet size={8} /> {isTransfer ? `${t.accountName} ➔ ${t.toAccountName}` : t.accountName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-right">
                          <div>
                            <p className={`text-xs font-black ${isIncome ? "text-emerald-500" : isTransfer ? "text-blue-500" : "text-rose-500"}`}>
                              {isPrivacyMode ? "Rp •••••" : `${isIncome ? "+" : "-"}${t.amount.toLocaleString("id-ID")}`}
                            </p>
                            {t.adminFee && t.adminFee > 0 && (
                              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 mt-0.5">
                                Admin: Rp {t.adminFee.toLocaleString("id-ID")}
                              </p>
                            )}
                          </div>

                          {/* Tombol edit/delete cepat - Dibuat selalu muncul penuh */}
                          <div className="flex items-center gap-1.5 shrink-0 opacity-100">
                            <button 
                              type="button" 
                              onClick={() => { triggerHaptic(); onEditTransaction(t); }} 
                              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => { triggerHaptic(); onDeleteTransaction(t); }} 
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FLOATING ACTION BUTTON (FAB) + DI POJOK KANAN BAWAH */}
      <button 
        type="button"
        onClick={() => { triggerHaptic(); setIsDrawerOpen(true); }}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border border-blue-500"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* ========================================== */}
      {/* UNIFIED SLIDE-UP BOTTOM DRAWER / MODAL FORM (Gambar 4 Style) */}
      {/* ========================================== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 z-0" onClick={closeMainDrawer}></div>
          
          {/* Diubah menjadi h-full (Full Screen) & rounded-none di HP, serta tetap melengkung di desktop */}
          <div className="bg-white dark:bg-slate-950 w-full h-full rounded-none sm:max-w-md sm:h-[95vh] sm:rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 z-10 flex flex-col border-t border-slate-200 dark:border-slate-800">
            
            {/* Header Laci Dinamis Berdasarkan Tipe Transaksi - MERAH PEKAT, BUKAN PINK (Gambar 4 Style) */}
            {editingTransaction ? (
              <div className={`p-6 ${editTType === 'income' ? 'bg-emerald-500' : editTType === 'expense' ? 'bg-red-600' : 'bg-blue-600'} text-white shrink-0 transition-colors duration-300 relative`}>
                <button type="button" onClick={closeMainDrawer} className="absolute top-4 left-4 p-1.5 hover:bg-white/10 text-white rounded-full"><X size={16} /></button>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    {/* Mengubah logo agar bisa diklik untuk edit logo instan */}
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
                      {/* Header besar Gambar 4 */}
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
              <div className={`p-6 ${tType === 'income' ? 'bg-emerald-500' : tType === 'expense' ? 'bg-red-600' : 'bg-blue-600'} text-white shrink-0 transition-colors duration-300 relative`}>
                <button type="button" onClick={closeMainDrawer} className="absolute top-4 left-4 p-1.5 hover:bg-white/10 text-white rounded-full"><X size={16} /></button>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    {/* Mengubah logo agar bisa diklik untuk edit logo instan */}
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
                      {/* Header besar Gambar 4 */}
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

            {/* Input Form Fields (Scrollable) */}
            <div className="p-6 space-y-4 overflow-y-auto bg-white dark:bg-slate-950 flex-1">
              
              {/* TABS SELECTOR (Untuk Transaksi Baru) */}
              {!editingTransaction && (
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-2">
                  <button type="button" onClick={() => handleTypeChange("expense")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "expense" ? "bg-red-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100"}`}><ArrowDownRight size={12} /> Pengeluaran</button>
                  <button type="button" onClick={() => handleTypeChange("income")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "income" ? "bg-emerald-500 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100"}`}><ArrowUpRight size={12} /> Pemasukan</button>
                  <button type="button" onClick={() => handleTypeChange("transfer")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "transfer" ? "bg-blue-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100"}`}><ArrowRightLeft size={12} /> Transfer</button>
                </div>
              )}

              {/* TABS SELECTOR (Untuk Koreksi/Edit Transaksi) */}
              {editingTransaction && (
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-2">
                  <button type="button" onClick={() => handleEditTypeChange("expense")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${editTType === "expense" ? "bg-red-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100"}`}><ArrowDownRight size={12} /> Pengeluaran</button>
                  <button type="button" onClick={() => handleEditTypeChange("income")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${editTType === "income" ? "bg-emerald-500 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100"}`}><ArrowUpRight size={12} /> Pemasukan</button>
                  <button type="button" onClick={() => handleEditTypeChange("transfer")} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${editTType === "transfer" ? "bg-blue-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100"}`}><ArrowRightLeft size={12} /> Transfer</button>
                </div>
              )}

              {/* INPUT NOMINAL UTAMA */}
              {editingTransaction ? (
                editTSplits.length === 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Nominal ({selectedSourceAcc?.currency || "IDR"})</label>
                    <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("amount"); setActiveSplitKeypadIndex(null); } }} className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100" placeholder="0" value={editTAmount} onChange={(e) => setEditTAmount(e.target.value)} />
                    {editTAmount && <p className="text-[10px] font-bold text-slate-400 pl-1">Terbaca: <span className="text-slate-600 dark:text-slate-300 font-black">{formatCurrencyTerbaca(editTAmount, selectedSourceAcc?.currency)}</span></p>}
                  </div>
                )
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Nominal ({selectedSourceAcc?.currency || "IDR"})</label>
                  <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("amount"); setActiveSplitKeypadIndex(null); } }} className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100" placeholder="0" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
                  {tAmount && <p className="text-[10px] font-bold text-slate-400 pl-1">Terbaca: <span className="text-slate-600 dark:text-slate-300 font-black">{formatCurrencyTerbaca(tAmount, selectedSourceAcc?.currency)}</span></p>}
                </div>
              )}

              {/* INPUT BIAYA ADMIN UNTUK TRANSFER */}
              {((editingTransaction ? editTType : tType) === "transfer") && (
                <div className="space-y-1 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block pl-1">Biaya Admin ({selectedSourceAcc?.currency || "IDR"}) (Opsional)</label>
                  <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("adminFee"); setActiveSplitKeypadIndex(null); } }} className="w-full p-3.5 bg-blue-50/30 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 rounded-2xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100" placeholder="0" value={editingTransaction ? editTAdminFee : tAdminFee} onChange={(e) => editingTransaction ? setEditTAdminFee(e.target.value) : setTAdminFee(e.target.value)} />
                  {(editingTransaction ? editTAdminFee : tAdminFee) && <p className="text-[10px] font-bold text-blue-400 pl-1">Terbaca: <span className="text-blue-600 dark:text-blue-300 font-black">{formatCurrencyTerbaca(editingTransaction ? editTAdminFee : tAdminFee, selectedSourceAcc?.currency)}</span></p>}
                </div>
              )}

              {/* DOMPET ASAL & DOMPET TUJUAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`space-y-1 min-w-0 ${(editingTransaction ? editTType : tType) === "transfer" ? "" : "md:col-span-2"}`}> 
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">💳 Dompet Asal</label>
                  <div 
                    onClick={() => { triggerHaptic(); setActiveAccSelector("source"); }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-855 dark:text-white hover:bg-slate-100"
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
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-855 dark:text-white hover:bg-slate-100"
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

              {/* INPUT TANGGAL PENUH (Hanya jika transfer aktif) */}
              {((editingTransaction ? editTType : tType) === "transfer") && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-between px-1">
                    <span>Tanggal</span>
                    <button type="button" onClick={() => { triggerHaptic(); const yes = getYesterdayDateString(); if (editingTransaction) setEditTDate(yes); else setTDate(yes); }} className="text-[9px] font-black text-blue-600 dark:text-blue-400 hover:underline">Kemarin?</button>
                  </label>
                  <input type="date" className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer" value={editingTransaction ? editTDate : tDate} onChange={(e) => editingTransaction ? setEditTDate(e.target.value) : setTDate(e.target.value)} />
                </div>
              )}

              {/* INPUT KATEGORI (GAMBAR 4 ROW STYLE) */}
              {((editingTransaction ? editTType : tType) !== "transfer") && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Kategori</label>
                  {editingTransaction ? (
                    editTSplits.length > 0 ? (
                      <div className="w-full p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300 flex items-center justify-between">
                        <span>✂️ {editTSplits.length} Pecahan Terpilih</span>
                        <button type="button" onClick={() => setEditTSplits([])} className="text-[10px] font-black underline hover:text-blue-800">Batalkan Pecahan</button>
                      </div>
                    ) : (
                      <div onClick={() => { setShowCatModal(true); setSearchQuery(""); setActiveKeypad(null); }} className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-850 dark:text-white cursor-pointer flex items-center justify-between truncate">
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
                      <div className="w-full p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300 flex items-center justify-between">
                        <span>✂️ {splits.length} Pecahan Terpilih</span>
                        <button type="button" onClick={() => setSplits([])} className="text-[10px] font-black underline hover:text-blue-800">Batal</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <div onClick={() => { setShowCatModal(true); setSearchQuery(""); setActiveKeypad(null); }} className="flex-1 p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-850 dark:text-white cursor-pointer flex items-center justify-between truncate">
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
                          }} className="px-3.5 py-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black border border-blue-200 dark:border-blue-900/30 shrink-0 flex items-center gap-1 cursor-pointer transition-colors">
                            ✂️ Pecah
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* INPUT CATATAN / MEMO */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Catatan</label>
                <input type="text" className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100" placeholder="Tulis keterangan transaksi..." value={editingTransaction ? editTNote : tNote} onChange={(e) => editingTransaction ? setEditTNote(e.target.value) : setTNote(e.target.value)} />
              </div>

              {/* EDITING SPLITS SECTION (Untuk Koreksi Splits Langsung di Form Laci) */}
              {editingTransaction && editTSplits && editTSplits.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center"><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">✂️ Rincian Pecahan Koreksi</p><span className="text-[10px] font-black text-emerald-600">Total: Rp {editTSplits.reduce((sum, s) => sum + s.amount, 0).toLocaleString('id-ID')}</span></div>
                  {editTSplits.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400">Pecahan #{i + 1}</span>
                        {editTSplits.length > 1 && (
                          <button type="button" onClick={() => setEditTSplits(editTSplits.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-0.5"><X size={14} /> Hapus</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Kategori</label>
                          <div onClick={() => { setActiveEditSplitIndex(i); setShowEditSplitCatModal(true); }} className="p-3 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between hover:bg-slate-50 truncate">
                            <span className="truncate">{item.category || "Pilih..."}</span><ChevronDown size={14} className="text-slate-400 shrink-0" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400">Nominal</label>
                          <input type="text" className="w-full p-3 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-blue-500" value={item.amount === 0 ? "" : item.amount} onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            const updated = [...editTSplits];
                            updated[i].amount = val ? Number(val) : 0;
                            setEditTSplits(updated);
                          }} />
                        </div>
                      </div>
                      <input type="text" placeholder="Catatan Pecahan..." className="w-full p-3 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={item.note || ""} onChange={(e) => {
                        const updated = [...editTSplits];
                        updated[i].note = e.target.value;
                        setEditTSplits(updated);
                      }} />
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const totalSoFar = editTSplits.reduce((sum, s) => sum + s.amount, 0);
                    const diff = Math.max(0, safeEvaluate(editTAmount) - totalSoFar);
                    setEditTSplits([...editTSplits, { category: "", amount: diff, note: "" }]);
                  }} className="w-full py-2.5 border border-dashed border-blue-300 text-blue-600 dark:border-blue-800 rounded-xl text-xs font-black">+ Tambah Pecahan Koreksi</button>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS (GAMBAR 4 SAVE BUTTON STYLE) */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex gap-3 shrink-0">
              {editingTransaction ? (
                <button type="button" onClick={() => { triggerHaptic(); handleUpdateTransaction(); closeMainDrawer(); }} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer">Simpan Koreksi</button>
              ) : (
                <button type="button" onClick={() => { triggerHaptic(); if(splits.length > 0) handleTransaction(splits); else handleTransaction(); closeMainDrawer(); }} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer">Simpan Transaksi</button>
              )}
              <button type="button" onClick={closeMainDrawer} className="py-3.5 px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP CATEGORY MODAL FOR NEW CREATION */}
      {showCatModal && activeType !== "transfer" && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh] border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>🏷️</span> Pilih Kategori {activeType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </h3>
              <button type="button" onClick={() => setShowCatModal(false)} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"><X size={14}/></button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input type="text" placeholder="Cari kategori..." className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900 text-left">
              {activeType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-orange-100 dark:border-orange-950/30 z-10"><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel</p></div>
                    <div className="flex flex-col gap-1.5">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").map(cat => (
                        <div key={cat.id} className="flex gap-1.5 items-center w-full">
                          <button type="button" onClick={() => handleSelectCategory(cat.name)} className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${tCategory === cat.name ? "bg-red-600 text-white border-red-700" : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"}`}>
                            <span className="shrink-0">{cat.icon || getCategoryIcon(cat.name)}</span>
                            <span className="truncate">{cat.name}</span>
                          </button>
                          <button type="button" onClick={() => { triggerHaptic(); setEditingCat(cat); setEditCatName(cat.name); setEditCatIcon(cat.icon || ""); }} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 shrink-0 cursor-pointer transition-all active:scale-90"><Edit3 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4 animate-in fade-in duration-150">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-purple-100 dark:border-purple-950/30 z-10"><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap</p></div>
                    <div className="flex flex-col gap-1.5">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").map(cat => (
                        <div key={cat.id} className="flex gap-1.5 items-center w-full">
                          <button type="button" onClick={() => handleSelectCategory(cat.name)} className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${tCategory === cat.name ? "bg-purple-600 text-white border-purple-700" : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"}`}>
                            <span className="shrink-0">{cat.icon || getCategoryIcon(cat.name)}</span>
                            <span className="truncate">{cat.name}</span>
                          </button>
                          <button type="button" onClick={() => { triggerHaptic(); setEditingCat(cat); setEditCatName(cat.name); setEditCatIcon(cat.icon || ""); }} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 shrink-0 cursor-pointer transition-all active:scale-90"><Edit3 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 animate-in fade-in duration-150">
                  {filteredCategories.filter(c => c.type === "income").map(cat => (
                    <div key={cat.id} className="flex gap-1.5 items-center w-full">
                      <button type="button" onClick={() => handleSelectCategory(cat.name)} className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${tCategory === cat.name ? "bg-green-600 text-white border-green-700" : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"}`}>
                        <span className="shrink-0">{cat.icon || getCategoryIcon(cat.name)}</span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                      <button type="button" onClick={() => { triggerHaptic(); setEditingCat(cat); setEditCatName(cat.name); setEditCatIcon(cat.icon || ""); }} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 shrink-0 cursor-pointer transition-all active:scale-90"><Edit3 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POP-UP CATEGORY MODAL FOR EDIT / KOREKSI PECAHAN */}
      {showEditSplitCatModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh] border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm"><span>🏷️</span> Pilih Kategori Pecahan</h3>
              <button type="button" onClick={() => { setShowEditSplitCatModal(false); setActiveEditSplitIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"><X size={14}/></button>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 shrink-0"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900 text-left">
              <div className="grid grid-cols-2 gap-3">
                {categories.filter(c => c.type === editTType).map(cat => (
                  <button key={cat.id} type="button" onClick={() => handleSelectEditSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100">{cat.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETIL SPLIT MODAL (NEW TRANSACTIONS SPLITS) */}
      {showSplitModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-slate-100 dark:border-slate-950 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>✂️</span> Pecah Transaksi ({formatCurrencyTerbaca(tAmount, selectedSourceAcc?.currency)})
              </h3>
              <button type="button" onClick={() => { setShowSplitModal(false); setActiveSplitKeypadIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"><X size={14}/></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 bg-white dark:bg-slate-950 flex-1">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Nominal Transaksi:</span>
                  <span className="font-black text-slate-800 dark:text-white">{formatCurrencyTerbaca(tAmount, selectedSourceAcc?.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold mt-2 pt-2 border-t border-blue-100/50 dark:border-blue-900/20">
                  <span>Total Alokasi:</span>
                  <span className={`font-black ${tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0) === safeEvaluate(tAmount) ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {currentSymbol} {tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {tempSplits.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400">Pecahan #{i + 1}</span>
                      {tempSplits.length > 1 && (
                        <button type="button" onClick={() => setTempSplits(tempSplits.filter((_, idx) => idx !== i))} className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-0.5"><X size={14} /> Hapus</button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400">Kategori</label>
                        <div onClick={() => { setActiveSplitIndex(i); setShowSplitCatModal(true); setSearchQuery(""); }} className="p-3 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between truncate">
                          <span className="truncate">{item.category || "Pilih..."}</span><ChevronDown size={14} className="text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400">Nominal ({selectedSourceAcc?.currency || "IDR"})</label>
                        <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveSplitKeypadIndex(i); setActiveKeypad(null); } }} className="w-full p-3 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-blue-500" value={item.amountStr} onChange={(e) => {
                          const updated = [...tempSplits];
                          updated[i].amountStr = e.target.value;
                          setTempSplits(updated);
                        }} />
                      </div>
                    </div>
                    <input type="text" placeholder="Catatan Pecahan (Opsional)..." className="w-full p-3 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={item.note || ""} onChange={(e) => {
                      const updated = [...tempSplits];
                      updated[i].note = e.target.value;
                      setTempSplits(updated);
                    }} />
                  </div>
                ))}
              </div>

              <button type="button" onClick={handleAddSplitItem} className="w-full py-3 border border-dashed border-blue-300 text-blue-600 rounded-xl text-xs font-black flex items-center justify-center gap-1"><Plus size={14} /> Tambah Pecahan Kategori</button>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex gap-3 shrink-0">
              <button type="button" onClick={handleConfirmSplits} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition-all">Konfirmasi</button>
              <button type="button" onClick={() => { setShowSplitModal(false); setActiveSplitKeypadIndex(null); }} className="py-3.5 px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-600 rounded-xl text-xs font-bold">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* SPLITS CATEGORY MODAL FOR NEW TRANSACTION */}
      {showSplitCatModal && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh] border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm"><span>🏷️</span> Pilih Kategori</h3>
              <button type="button" onClick={() => { setShowSplitCatModal(false); setActiveSplitIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 rounded-full"><X size={14}/></button>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 shrink-0"><input type="text" placeholder="Cari..." className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900 text-left">
              <div className="grid grid-cols-2 gap-3">
                {categories.filter(c => c.type === tType).map(cat => (
                  <button key={cat.id} type="button" onClick={() => handleSelectSplitCategory(cat.name)} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100">{cat.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING KEYPAD DRAWER UNTUK MAIN NOMINAL (CREATE & EDIT) */}
      {isMobile && activeKeypad && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0">
            <div className="flex justify-between items-center mb-3 px-1 text-left">
              <span className="text-[10px] font-black text-slate-500 dark:text-blue-500 tracking-widest uppercase">{activeKeypad === "amount" ? "Kalkulator Nominal" : "Kalkulator Biaya Admin"}</span>
              <button onClick={() => setActiveKeypad(null)} className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold flex items-center gap-1">Tutup <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-white font-black text-base">
              {["+", "-", "*", "/"].map((op) => (<button key={op} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(op) : handleKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 rounded-xl select-none">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>))}
              {["7", "8", "9"].map((num) => (<button key={num} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(num) : handleKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 rounded-xl select-none">{num}</button>))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress("C") : handleKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl select-none">C</button>
              {["4", "5", "6"].map((num) => (<button key={num} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(num) : handleKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 rounded-xl select-none">{num}</button>))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress("⌫") : handleKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 rounded-xl text-slate-500 flex items-center justify-center select-none">⌫</button>
              {["1", "2", "3"].map((num) => (<button key={num} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(num) : handleKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 rounded-xl select-none">{num}</button>))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress(".") : handleKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 rounded-xl select-none">.</button>
              {["(", "0", ")"].map((char) => (<button key={char} type="button" onClick={() => editingTransaction ? handleEditKeypadPress(char) : handleKeypadPress(char)} className="bg-slate-50 dark:bg-slate-800 py-3.5 rounded-xl select-none">{char}</button>))}
              <button type="button" onClick={() => editingTransaction ? handleEditKeypadPress("Ya") : handleKeypadPress("Ya")} className="py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl text-white font-black shadow-lg select-none">Ya</button>
            </div>
          </div>
        </>
      )}

      {/* FLOATING KEYPAD DRAWER UNTUK NOMINAL PECAHAN */}
      {isMobile && activeSplitKeypadIndex !== null && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveSplitKeypadIndex(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0">
            <div className="flex justify-between items-center mb-3 text-left">
              <span className="text-[10px] font-black text-slate-500 dark:text-blue-500 tracking-widest uppercase">Kalkulator Pecahan #{activeSplitKeypadIndex + 1}</span>
              <button onClick={() => setActiveSplitKeypadIndex(null)} className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold flex items-center gap-1">Tutup <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-white font-black text-base">
              {["+", "-", "*", "/"].map((op) => (<button key={op} type="button" onClick={() => handleSplitKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 rounded-xl select-none">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>))}
              {["7", "8", "9"].map((num) => (<button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 rounded-xl select-none">{num}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl select-none">C</button>
              {["4", "5", "6"].map((num) => (<button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 rounded-xl select-none">{num}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 rounded-xl text-slate-500 flex items-center justify-center select-none">⌫</button>
              {["1", "2", "3"].map((num) => (<button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 rounded-xl select-none">{num}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 rounded-xl select-none">.</button>
              {["(", "0", ")"].map((char) => (<button key={char} type="button" onClick={() => handleSplitKeypadPress(char)} className="bg-slate-50 dark:bg-slate-800 py-3.5 rounded-xl select-none">{char}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress("Ya")} className="py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl text-white font-black shadow-lg select-none">Ya</button>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* BOTTOM SHEET: PILIH DOMPET/AKUN (Gambar Pop-up Card Style) */}
      {/* ========================================== */}
      {activeAccSelector && (
        <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={() => setActiveAccSelector(null)}></div>
          
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] shadow-2xl p-6 pb-8 overflow-hidden animate-in slide-in-from-bottom duration-300 z-10 flex flex-col max-h-[85vh] border-t border-slate-200 dark:border-slate-800">
            <div className="w-full flex justify-center pb-2"><div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>
            
            <div className="flex justify-between items-center mb-6 pt-2">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Select From Account</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveAccSelector(null)} 
                className="p-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500 rounded-full transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                {(activeAccSelector === "source" ? availableSourceAccounts : accounts).map(acc => {
                  const activeId = activeAccSelector === "source" 
                    ? (editingTransaction ? editTAccountId : tAccountId) 
                    : (editingTransaction ? editTToAccountId : tToAccountId);
                  const isSelected = activeId === acc.id;
                  
                  return (
                    <div 
                      key={acc.id}
                      onClick={() => { triggerHaptic(); handleSelectAccount(acc.id); }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between relative transition-all active:scale-95 cursor-pointer h-28 ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-md shadow-blue-500/5" 
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      {/* Logo / Icon */}
                      <div className="flex justify-between items-start">
                        {acc.logo ? (
                          <img src={acc.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-white" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Wallet size={16} />
                          </div>
                        )}
                        
                        {/* Checkmark overlay */}
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black shadow shadow-blue-500/50">
                            ✓
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="mt-2 min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-none mb-1">{acc.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate leading-none">
                          {getCurrencySymbol(acc.currency)} {acc.balance.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MINI MODAL: EDIT NAMA & LOGO EMOJI KATEGORI SECARA INSTAN */}
      {editingCat && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-xs shadow-2xl p-6 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-left">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1">🔧 Atur Logo & Kategori</h4>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400">Emoji / Logo Kustom (Satu Karakter)</label>
                <input 
                  type="text" 
                  maxLength={2} // Mengizinkan input emoji penuh
                  placeholder="Ketik satu emoji (misal: 💈, 🍛)" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xl font-black outline-blue-500 text-slate-800 dark:text-white"
                  value={editCatIcon}
                  onChange={(e) => setEditCatIcon(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400">Nama Kategori</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white"
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                type="button" 
                onClick={async () => {
                  if (updateCategory && editingCat) {
                    triggerHaptic();
                    await updateCategory(editingCat.id, editCatName, editingCat.budgetLimit || null, editingCat.expenseType || "variable", editCatIcon);
                    setEditingCat(null);
                    setShowCatModal(false); // Tutup modal luar agar perubahan termuat penuh
                    alert("Kategori berhasil diperbarui!");
                  }
                }} 
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer"
              >
                Simpan
              </button>
              <button 
                type="button" 
                onClick={() => setEditingCat(null)} 
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}