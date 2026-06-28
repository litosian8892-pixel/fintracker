"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, CircleDashed, Trash2, Plus, Wallet, Pencil, Tag, X, Calendar, CalendarClock, CreditCard, AlertCircle, BookUser, ArrowLeft, ArrowDownLeft, ArrowUpRight, Link as LinkIcon, LayoutGrid, List, ChevronDown } from "lucide-react";
import { DebtData, AccountData, CategoryData, SubscriptionData } from "../../types";

interface DebtsTabProps {
  debts: DebtData[];
  accounts: AccountData[];
  categories: CategoryData[];
  
  handleAddDebt: (type: "debt" | "receivable", person: string, amount: number, note: string, dueDate: string, accountId?: string, startDate?: string) => void;
  handleEditDebt: (id: string, person: string, amount: number, note: string, dueDate: string) => void; 
  handlePayDebt: (debtId: string, payAmount: number, accountId: string, category: string, note: string) => void; 
  handleDeleteDebt: (debtId: string) => void;

  subscriptions: SubscriptionData[];
  handleAddSubscription: (name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => void;
  handleEditSubscription: (id: string, name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => void;
  handlePaySubscription: (sub: SubscriptionData) => void;
  handleDeleteSubscription: (id: string) => void;

  isPrivacyMode?: boolean;
}

// PEMETAAN SEMANTIK WARNA AKSEN TAB UTANG & LANGGANAN (100% Standar Tailwind v4 & Bebas Bocor)
const themeMap = {
  blue: {
    activeBg: "bg-blue-600 text-white",
    text: "text-blue-600 dark:text-blue-400",
    bgLight: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-100 dark:border-blue-900/40",
    subTabActive: "bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    subTabHover: "hover:text-blue-600 dark:hover:text-blue-400",
    subGradient: "from-blue-600 to-indigo-700 shadow-blue-500/10",
    fab: "bg-blue-600 hover:bg-blue-700 border-blue-500",
    payAccSelected: "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-blue-500/5",
    payBtnInactive: "bg-blue-50/40 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-100/30 dark:border-blue-900/30",
    activePill: "bg-blue-600 border-blue-600 text-white shadow-blue-500/10"
  },
  emerald: {
    activeBg: "bg-emerald-600 text-white",
    text: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-100 dark:border-emerald-900/40",
    subTabActive: "bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    subTabHover: "hover:text-emerald-600 dark:hover:text-emerald-400",
    subGradient: "from-emerald-600 to-teal-800 shadow-emerald-500/10",
    fab: "bg-emerald-600 hover:bg-emerald-700 border-emerald-500",
    payAccSelected: "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-emerald-500/5",
    payBtnInactive: "bg-emerald-50/40 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-100/30 dark:border-emerald-900/30",
    activePill: "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/10"
  },
  purple: {
    activeBg: "bg-purple-600 text-white",
    text: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-50 dark:bg-purple-900/30",
    border: "border-purple-100 dark:border-purple-900/40",
    subTabActive: "bg-purple-50/80 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    subTabHover: "hover:text-purple-600 dark:hover:text-purple-400",
    subGradient: "from-purple-600 to-fuchsia-800 shadow-purple-500/10",
    fab: "bg-purple-600 hover:bg-purple-700 border-purple-500",
    payAccSelected: "border-purple-600 bg-purple-50/50 dark:bg-purple-900/20 shadow-purple-500/5",
    payBtnInactive: "bg-purple-50/40 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 border-purple-100/30 dark:border-purple-900/30",
    activePill: "bg-purple-600 border-purple-600 text-white shadow-purple-500/10"
  },
  amber: {
    activeBg: "bg-amber-600 text-white",
    text: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-100 dark:border-amber-900/40",
    subTabActive: "bg-amber-50/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    subTabHover: "hover:text-amber-600 dark:hover:text-amber-400",
    subGradient: "from-amber-600 to-orange-800 shadow-amber-500/10",
    fab: "bg-amber-600 hover:bg-amber-700 border-amber-500",
    payAccSelected: "border-amber-600 bg-amber-50/50 dark:bg-amber-900/20 shadow-amber-500/5",
    payBtnInactive: "bg-amber-50/40 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border-amber-100/30 dark:border-amber-900/30",
    activePill: "bg-amber-600 border-amber-600 text-white shadow-amber-500/10"
  },
  rose: {
    activeBg: "bg-rose-600 text-white",
    text: "text-rose-600 dark:text-rose-400",
    bgLight: "bg-rose-50 dark:bg-rose-900/30",
    border: "border-rose-100 dark:border-rose-900/40",
    subTabActive: "bg-rose-50/80 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    subTabHover: "hover:text-rose-600 dark:hover:text-rose-400",
    subGradient: "from-rose-600 to-pink-800 shadow-rose-500/10",
    fab: "bg-rose-600 hover:bg-rose-700 border-rose-500",
    payAccSelected: "border-rose-600 bg-rose-50/50 dark:bg-rose-900/20 shadow-rose-500/5",
    payBtnInactive: "bg-rose-50/40 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-100/30 dark:border-rose-900/30",
    activePill: "bg-rose-600 border-rose-600 text-white shadow-rose-500/10"
  }
} as const;

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

export default function DebtsTab({ 
  debts, accounts, categories, handleAddDebt, handleEditDebt, handlePayDebt, handleDeleteDebt,
  subscriptions, handleAddSubscription, handleEditSubscription, handlePaySubscription, handleDeleteSubscription,
  isPrivacyMode = false
}: DebtsTabProps) {
  
  const [mainTab, setMainTab] = useState<"debts" | "subscriptions">("debts");
  const [activeType, setActiveType] = useState<"debt" | "receivable">("debt");
  
  // Layout toggle: Grid (kotak) vs List (baris)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Status Filter: active (Belum Lunas) vs paid (Lunas)
  const [statusFilter, setStatusFilter] = useState<"active" | "paid">("active");
  
  // Navigation State for Detail Page
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState(""); 
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [sourceAccountId, setSourceAccountId] = useState("");

  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payCategory, setPayCategory] = useState(""); 

  // Modal selector states for payment form
  const [payAccSelector, setPayAccSelector] = useState(false);
  const [payCatSelector, setPayCatSelector] = useState(false);

  const [showAddSubForm, setShowAddSubForm] = useState(false);
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subCycle, setSubCycle] = useState<"monthly" | "yearly">("monthly");
  const [subDueDate, setSubDueDate] = useState("");
  const [subAccountId, setSubAccountId] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubAmount, setEditSubAmount] = useState("");
  const [editSubCycle, setEditSubCycle] = useState<"monthly" | "yearly">("monthly");
  const [editSubDueDate, setEditSubDueDate] = useState("");
  const [editSubAccountId, setEditSubAccountId] = useState("");
  const [editSubCategory, setEditSubCategory] = useState("");

  // STATE BARU UNTUK SELECTOR LANGGANAN
  const [subAccSelector, setSubAccSelector] = useState<"add" | "edit" | null>(null);
  const [subCatSelector, setSubCatSelector] = useState<"add" | "edit" | null>(null);

  const [activeKeypad, setActiveKeypad] = useState<"add" | "edit" | "pay" | "add-sub" | "edit-sub" | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // STATE BARU: TEMA WARNA AKSEN DINAMIS
  const [accent, setAccent] = useState<keyof typeof themeMap>("blue");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); 
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Memuat warna aksen dari localStorage reaktif [1]
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

  const formatRupiahTerbaca = (val: string) => {
    if (!val) return "Rp 0";
    const parsed = safeEvaluate(val);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parsed);
  };

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

  const handleKeypadPress = (key: string) => {
    triggerHaptic();
    
    let currentVal = "";
    let setVal: (val: string) => void = () => {};

    if (activeKeypad === "add") { currentVal = amount; setVal = setAmount; } 
    else if (activeKeypad === "edit") { currentVal = editAmount; setVal = setEditAmount; } 
    else if (activeKeypad === "pay") { currentVal = payAmount; setVal = setPayAmount; } 
    else if (activeKeypad === "add-sub") { currentVal = subAmount; setVal = setSubAmount; } 
    else if (activeKeypad === "edit-sub") { currentVal = editSubAmount; setVal = setEditSubAmount; } 
    else { return; }

    if (key === "⌫") setVal(currentVal.slice(0, -1));
    else if (key === "C") setVal("");
    else if (key === "=") { const evaluated = safeEvaluate(currentVal); setVal(evaluated > 0 ? evaluated.toString() : ""); } 
    else if (key === "Ya") setActiveKeypad(null);
    else setVal(currentVal + key);
  };

  const isOverdue = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
    return today > due;
  };

  const submitAdd = () => {
    if (!person || !amount) return alert("Nama dan Nominal harus diisi!");
    if (activeType === "receivable" && !sourceAccountId) return alert("Pilih dompet pengirim uang terlebih dahulu!");
    
    // FIX: Memastikan startDate (Tgl Pinjam) dikirimkan ke mesin utama!
    handleAddDebt(activeType, person, safeEvaluate(amount), note, dueDate, sourceAccountId, startDate);
    
    setShowAddForm(false); setPerson(""); setAmount(""); setNote(""); setDueDate(""); setSourceAccountId(""); setActiveKeypad(null);
    const d = new Date();
    setStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const submitEdit = (id: string) => {
    if (!editPerson || !editAmount) return alert("Nama dan Nominal harus diisi!");
    handleEditDebt(id, editPerson, safeEvaluate(editAmount), editNote, editDueDate);
    setEditingDebtId(null); setActiveKeypad(null);
  };

  const submitPay = (debt: DebtData) => {
    if (!payAmount || !payAccountId || !payCategory) return alert("Nominal, Dompet, dan Kategori harus diisi!");
    
    // FIX: Format catatan pelunasan menjadi "Nama - Catatan" agar rapi & informatif
    const finalNote = debt.note ? `${debt.personName} - ${debt.note}` : debt.personName; 
    
    handlePayDebt(debt.id, safeEvaluate(payAmount), payAccountId, payCategory, finalNote);
    setShowPayModal(false); setPayAmount(""); setPayAccountId(""); setPayCategory(""); setActiveKeypad(null);
  };

  const getDaysLeft = (dueDateStr: string) => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const submitAddSub = () => {
    if (!subName || !subAmount || !subDueDate || !subAccountId || !subCategory) return alert("Harap lengkapi semua data!");
    handleAddSubscription(subName, safeEvaluate(subAmount), subCycle, subDueDate, subAccountId, subCategory);
    setShowAddSubForm(false); setSubName(""); setSubAmount(""); setSubDueDate(""); setSubAccountId(""); setSubCategory(""); setActiveKeypad(null);
  };

  const startEditSub = (sub: SubscriptionData) => {
    setEditingSubId(sub.id); setEditSubName(sub.name); setEditSubAmount(sub.amount.toString()); setEditSubCycle(sub.cycle);
    setEditSubDueDate(sub.nextDueDate); setEditSubAccountId(sub.accountId); setEditSubCategory(sub.category); setActiveKeypad(null);
  };

  const submitEditSub = (id: string) => {
    if (!editSubName || !editSubAmount || !editSubDueDate || !editSubAccountId || !editSubCategory) return alert("Harap lengkapi semua data!");
    handleEditSubscription(id, editSubName, safeEvaluate(editSubAmount), editSubCycle, editSubDueDate, editSubAccountId, editSubCategory);
    setEditingSubId(null); setActiveKeypad(null);
  };

  const filteredDebts = debts.filter(d => d.type === activeType);
  const totalActive = filteredDebts.filter(d => d.status === "active").reduce((a, b) => a + (b.amount - b.paidAmount), 0);
  const totalMonthlySubscriptions = subscriptions.reduce((acc, sub) => acc + (sub.cycle === 'monthly' ? sub.amount : sub.amount / 12), 0);

  const currentDebtsList = filteredDebts.filter(d => statusFilter === "active" ? d.status === "active" : d.status === "paid");

  const selectedDebt = debts.find(d => d.id === selectedDebtId);
  const currentTheme = themeMap[accent];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-800 dark:text-slate-100">
      {/* SUNTIKAN ANTI SCROLLBAR DEFAULT */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}} />
      
      {/* Detail Screen Rendering */}
      {selectedDebt ? (
        <div className="space-y-5 animate-in slide-in-from-right duration-250 text-left pb-12">
          {/* Header Navigation Bar */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <button 
              onClick={() => { setSelectedDebtId(null); setShowPayModal(false); }} 
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Detail Utang</h3>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setEditPerson(selectedDebt.personName);
                  setEditAmount(selectedDebt.amount.toString());
                  setEditNote(selectedDebt.note || "");
                  setEditDueDate(selectedDebt.dueDate || "");
                  setEditingDebtId(selectedDebt.id);
                }}
                className={`p-2 bg-slate-50 hover:bg-slate-105 dark:bg-slate-800 rounded-xl transition-all border border-slate-200/40 dark:border-slate-700/40 cursor-pointer ${currentTheme.text}`}
              >
                <Pencil size={15} />
              </button>
              <button 
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin menghapus catatan ini secara permanen?")) {
                    handleDeleteDebt(selectedDebt.id);
                    setSelectedDebtId(null);
                  }
                }}
                className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-800/40 rounded-xl transition-all text-red-500 cursor-pointer border border-red-100/40 dark:border-red-900/40"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {editingDebtId === selectedDebt.id && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
              <p className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>Koreksi Data Transaksi</p>
              <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editPerson} onChange={e => setEditPerson(e.target.value)} />
              <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
              <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
              <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editNote} onChange={e => setEditNote(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => submitEdit(selectedDebt.id)} className={`flex-1 py-3 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer ${currentTheme.fab}`}>Simpan Perubahan</button>
                <button onClick={() => setEditingDebtId(null)} className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold">Batal</button>
              </div>
            </div>
          )}

          {/* Premium Detail Summary Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center font-black text-lg">
                  {selectedDebt.personName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-slate-100 leading-tight">{selectedDebt.personName}</h4>
                  
                  {selectedDebt.note && (
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 leading-normal italic">
                      "{selectedDebt.note}"
                    </p>
                  )}

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1.5 uppercase tracking-wider leading-none">
                    {selectedDebt.dueDate ? `Tanggal Jatuh Tempo: ${new Date(selectedDebt.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}` : "Tidak Ada Jatuh Tempo"}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 border rounded-full text-[9px] font-black tracking-wider ${currentTheme.bgLight} ${currentTheme.border} ${currentTheme.text}`}>
                {Math.round((selectedDebt.paidAmount / selectedDebt.amount) * 100)}% lunas
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {isPrivacyMode ? 'Rp •••••••' : `Rp ${(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString('id-ID')}`}
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Remaining Debt</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-black">
                <span className="text-slate-600 dark:text-slate-400">Rp {selectedDebt.paidAmount.toLocaleString('id-ID')} / Rp {selectedDebt.amount.toLocaleString('id-ID')}</span>
                <span className={currentTheme.text}>{Math.round((selectedDebt.paidAmount / selectedDebt.amount) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${activeType === 'debt' ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((selectedDebt.paidAmount / selectedDebt.amount) * 100, 100)}%` }}></div>
              </div>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Total Debt</span>
                <span className="text-slate-800 dark:text-slate-200">Rp {selectedDebt.amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Remaining Debt</span>
                <span className="text-orange-600 dark:text-orange-400 font-black">Rp {(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Dibayar</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">Rp {selectedDebt.paidAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              selectedDebt.type === "debt" 
                ? "bg-red-50/50 dark:bg-red-900/10 border-red-100/80 dark:border-red-800/30 text-red-700 dark:text-red-400" 
                : "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100/80 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${selectedDebt.type === "debt" ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300"}`}>
                  {selectedDebt.type === "debt" ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                </div>
                <div className="text-[10px] font-black tracking-wide text-left">
                  <p className={`uppercase ${selectedDebt.type === "debt" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}`}>
                    {selectedDebt.type === "debt" ? "DIPINJAM" : "DIPINJAMKAN"}
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedDebt.type === "debt" 
                      ? `You owe Rp ${(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString('id-ID')}` 
                      : `Owed Rp ${(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString('id-ID')}`}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                selectedDebt.type === "debt" 
                  ? "bg-red-100/60 dark:bg-red-900/40 border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400" 
                  : "bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400"
              }`}>
                {selectedDebt.type === "debt" ? "↓ DIPINJAM" : "↑ DIPINJAMKAN"}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-[26px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center px-1">
              <h5 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">Debt Records</h5>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border border-transparent ${currentTheme.bgLight} ${currentTheme.text}`}>
                {selectedDebt.paidAmount > 0 ? "1 entries" : "0 entries"}
              </span>
            </div>

            {selectedDebt.paidAmount === 0 ? (
              <p className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs italic">Belum ada mutasi pembayaran yang terekam.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-800/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <ArrowDownLeft size={14} />
                    </div>
                    <div>
                      <h6 className="font-black text-xs text-emerald-600 dark:text-emerald-400">-Rp {selectedDebt.paidAmount.toLocaleString('id-ID')}</h6>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                        {(() => {
                          const dateVal = selectedDebt.createdAt as any;
                          const d = dateVal?.seconds 
                            ? new Date(dateVal.seconds * 1000) 
                            : new Date(selectedDebt.createdAt || Date.now());
                          return isNaN(d.getTime()) ? "-" : d.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[8.5px] font-mono text-slate-500 dark:text-slate-400 rounded cursor-pointer border border-transparent dark:border-slate-700">
                      <LinkIcon size={8} /> 59df7b...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedDebt.status === "active" && (
            <button 
              onClick={() => {
                setPayAmount((selectedDebt.amount - selectedDebt.paidAmount).toString());
                setPayAccountId("");
                setPayCategory("");
                setShowPayModal(true);
              }}
              className={`fixed bottom-24 right-6 z-50 p-4 text-white rounded-full shadow-2xl transition-all cursor-pointer border ${currentTheme.fab}`}
            >
              <Plus size={24} />
            </button>
          )}

          {showPayModal && (
            <div className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
              <div className="absolute inset-0 z-0" onClick={() => { setShowPayModal(false); setActiveKeypad(null); }}></div>
              
              <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-t-[32px] sm:rounded-[28px] shadow-2xl p-6 overflow-hidden z-10 flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 text-left animate-in slide-in-from-bottom sm:zoom-in-95 duration-250">
                <div className="flex justify-between items-center mb-4">
                  <h5 className={`text-[10px] font-black uppercase tracking-widest ${currentTheme.text}`}>Catat Cicilan / Pelunasan</h5>
                  <button onClick={() => { setShowPayModal(false); setActiveKeypad(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={15}/></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nominal Pembayaran (Rp)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 15000" 
                      inputMode={isMobile ? "none" : undefined} 
                      onFocus={() => { if(isMobile) { setActiveKeypad("pay"); } }} 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-white" 
                      value={payAmount} 
                      onChange={e => setPayAmount(e.target.value)} 
                    />
                    {payAmount && <p className="text-[10px] font-bold text-slate-500 pl-1">Terbaca: <span className={currentTheme.text}>{formatRupiahTerbaca(payAmount)}</span></p>}
                  </div>

                  <button 
                    type="button" 
                    onClick={() => { triggerHaptic(); setPayAmount((selectedDebt.amount - selectedDebt.paidAmount).toString()); }} 
                    className={`w-full py-2.5 text-[10px] font-black rounded-lg border border-transparent cursor-pointer transition-all active:scale-95 text-center ${currentTheme.payBtnInactive}`}
                  >
                    🚀 Bayar Lunas (Sisa Rp {(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString('id-ID')})
                  </button>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Sumber Dana (Dompet)</label>
                    <div 
                      onClick={() => { triggerHaptic(); setPayAccSelector(true); }}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Wallet size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {payAccountId ? (accounts.find(a => a.id === payAccountId)?.name || "Pilih Dompet...") : "Pilih Dompet Pengeluaran..."}
                        </span>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Kategori Transaksi</label>
                    <div 
                      onClick={() => { triggerHaptic(); setPayCatSelector(true); }}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tag size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {payCategory ? payCategory : "Pilih Kategori..."}
                        </span>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-5">
                  <button onClick={() => submitPay(selectedDebt)} className={`flex-1 py-3 text-white rounded-xl text-xs font-black cursor-pointer shadow-md ${currentTheme.fab}`}>Konfirmasi Pembayaran</button>
                  <button onClick={() => { setShowPayModal(false); setActiveKeypad(null); }} className="py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">Batal</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-slate-100/60 dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm flex items-center gap-1.5 transition-all">
            <button 
              onClick={() => setMainTab("debts")} 
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mainTab === "debts" 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <BookUser size={15} /> Utang Piutang
            </button>
            <button 
              onClick={() => setMainTab("subscriptions")} 
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mainTab === "subscriptions" 
                  ? currentTheme.subTabActive 
                  : `text-slate-500 dark:text-slate-400 ${currentTheme.subTabHover}`
              }`}
            >
              <CalendarClock size={15} /> Langganan
            </button>
          </div>

          {mainTab === "debts" ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white dark:bg-slate-900/65 p-5 rounded-[26px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1.5 bg-slate-100/70 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => { triggerHaptic(); setActiveType("debt"); setShowAddForm(false); setEditingDebtId(null); setActiveKeypad(null); }} 
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        activeType === "debt" 
                          ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200 dark:border-slate-700" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      UTANG SAYA
                    </button>
                    <button 
                      onClick={() => { triggerHaptic(); setActiveType("receivable"); setShowAddForm(false); setEditingDebtId(null); setActiveKeypad(null); }} 
                      className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        activeType === "receivable" 
                          ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700" 
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      PIUTANG ORANG
                    </button>
                   </div>
                </div>
                
                <div className={`p-5 rounded-2xl transition-all duration-200 border text-left ${
                  activeType === "debt" 
                    ? "bg-red-50/40 dark:bg-red-900/10 border-red-100/80 dark:border-red-900/20" 
                    : "bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-100/80 dark:border-emerald-900/20"
                }`}>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${activeType === "debt" ? "text-red-500" : "text-emerald-500"}`}>
                    Sisa {activeType === "debt" ? "Utang Saya" : "Uang Saya di Orang"}
                  </p>
                  <h2 className={`text-2xl font-black tracking-tight mt-1 ${activeType === "debt" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {isPrivacyMode ? 'Rp •••••••' : `Rp ${totalActive.toLocaleString('id-ID')}`}
                  </h2>
                </div>

                {showAddForm && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 text-left animate-in slide-in-from-top-2 duration-200">
``
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {activeType === "debt" ? "Mencatat Utang Baru" : "Mencatat Piutang Baru"}
                      </h4>
                      <button onClick={() => { setShowAddForm(false); setActiveKeypad(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={15}/></button>
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder={activeType === "debt" ? "Utang ke siapa?" : "Siapa yang pinjam?"} 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-800 dark:text-white placeholder-slate-400" 
                      value={person} 
                      onChange={e => setPerson(e.target.value)} 
                    />
                    
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        placeholder="Nominal Total (Rp)" 
                        inputMode={isMobile ? "none" : undefined} 
                        onFocus={() => { if(isMobile) { setActiveKeypad("add"); } }} 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-800 dark:text-white placeholder-slate-400" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                      />
                      {amount && (
                        <p className="text-[10px] font-bold text-slate-500 pl-1">
                          Terbaca: <span className="text-slate-700 dark:text-slate-300 font-black">{formatRupiahTerbaca(amount)}</span>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">📅 Tgl Pinjam</label>
                        <input 
                          type="date" 
                          onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white" 
                          value={startDate} 
                          onChange={e => setStartDate(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">📅 Jatuh Tempo</label>
                        <input 
                          type="date" 
                          onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white" 
                          value={dueDate} 
                          onChange={e => setDueDate(e.target.value)} 
                        />
                      </div>
                    </div>

                    {activeType === "receivable" && (
                      <div className="relative">
                        <Wallet className="absolute left-3 top-3.5 text-slate-400" size={15}/>
                        <select 
                          className="w-full pl-9 pr-3 py-3 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none cursor-pointer border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white" 
                          value={sourceAccountId} 
                          onChange={e => setSourceAccountId(e.target.value)}
                        >
                          <option value="" disabled>Kirim dari Dompet...</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})</option>)}
                        </select>
                      </div>
                    )}

                    <input 
                      type="text" 
                      placeholder="Catatan / Tujuan pinjam" 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-800 dark:text-white placeholder-slate-400" 
                      value={note} 
                      onChange={e => setNote(e.target.value)} 
                    />

                    <div className="flex gap-2 pt-1.5">
                      <button onClick={submitAdd} className={`flex-1 py-3 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-[0.98] ${currentTheme.fab}`}>Simpan</button>
                      <button onClick={() => { setShowAddForm(false); setActiveKeypad(null); }} className="py-3 px-5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Batal</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span className={`w-[3px] h-3.5 rounded-full ${activeType === 'debt' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    {activeType === 'debt' 
                      ? (statusFilter === 'active' ? `DIPINJAM (${currentDebtsList.length})` : `LUNAS SAYA (${currentDebtsList.length})`)
                      : (statusFilter === 'active' ? `DIPINJAMKAN (${currentDebtsList.length})` : `LUNAS ORANG (${currentDebtsList.length})`)}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                      <button 
                        onClick={() => { triggerHaptic(); setStatusFilter("active"); }}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${statusFilter === "active" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                      >
                        Belum Lunas
                      </button>
                      <button 
                        onClick={() => { triggerHaptic(); setStatusFilter("paid"); }}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${statusFilter === "paid" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
                      >
                        Lunas
                      </button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800">
                      <button 
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                      >
                        <LayoutGrid size={14} />
                      </button>
                      <button 
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                      >
                        <List size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {currentDebtsList.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    Tidak ada catatan {activeType === "debt" ? "utang" : "piutang"} yang {statusFilter === "active" ? "belum lunas" : "lunas"}.
                  </p>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    {currentDebtsList.map(debt => {
                      const percentage = Math.min((debt.paidAmount / debt.amount) * 100, 100);
                      const isPaid = debt.status === "paid";
                      const overdue = !isPaid && isOverdue(debt.dueDate || "");

                      return (
                        <div 
                          key={debt.id} 
                          onClick={() => setSelectedDebtId(debt.id)}
                          className={`relative overflow-hidden bg-white dark:bg-slate-900 p-4 rounded-[20px] border shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md cursor-pointer flex flex-col justify-between ${
                            isPaid 
                              ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-900/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-emerald-500" 
                              : "border-slate-100 dark:border-slate-800 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] " + (activeType === "debt" ? "before:bg-red-500" : "before:bg-emerald-500")
                          }`}
                        >
                          <div className="flex justify-between items-start pl-1.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                                {debt.personName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight truncate">{debt.personName}</h4>
                                
                                {debt.note && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate leading-none my-1" title={debt.note}>
                                    {debt.note}
                                  </p>
                                )}

                                <div className="flex gap-0.5 items-center mt-0.5">
                                  {[1, 2, 3, 4].map((seg) => {
                                    const filled = percentage >= seg * 25;
                                    return (
                                      <span key={seg} className={`w-1 h-2 rounded-[1px] ${
                                        filled 
                                          ? (activeType === 'debt' ? 'bg-orange-500' : 'bg-emerald-500') 
                                          : 'bg-slate-200 dark:bg-slate-800'
                                      }`} />
                                    );
                                  })}
                                  <span className={`text-[8px] font-black ml-1 shrink-0 ${
                                    activeType === 'debt' ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-500 dark:text-emerald-400'
                                  }`}>
                                    {Math.round(percentage)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pl-1.5 space-y-0.5">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none truncate">
                              {isPrivacyMode ? 'Rp •••••' : `Rp ${(debt.amount - debt.paidAmount).toLocaleString('id-ID')}`}
                            </h3>
                            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold truncate">
                              {debt.dueDate ? `Tempo: ${new Date(debt.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}` : "No Tempo"}
                              {overdue && " ⚠️"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {currentDebtsList.map(debt => {
                      const percentage = Math.min((debt.paidAmount / debt.amount) * 100, 100);
                      const isPaid = debt.status === "paid";
                      const overdue = !isPaid && isOverdue(debt.dueDate || "");

                      return (
                        <div 
                          key={debt.id} 
                          onClick={() => setSelectedDebtId(debt.id)}
                          className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer text-left pl-5 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-slate-200 dark:before:bg-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center font-black text-xs">
                              {debt.personName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs tracking-tight">{debt.personName}</h4>
                              
                              {debt.note && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-none">
                                  {debt.note}
                                </p>
                              )}

                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-1 leading-none">
                                {debt.dueDate ? `Tempo: ${new Date(debt.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}` : "Tidak Ada Jatuh Tempo"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              {isPrivacyMode ? 'Rp •••••' : `Rp ${(debt.amount - debt.paidAmount).toLocaleString('id-ID')}`}
                            </span>
                            <p className={`text-[9px] font-black mt-0.5 ${isPaid ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400"}`}>
                              {Math.round(percentage)}% lunas
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left animate-in fade-in duration-200">
              {/* KARTU ATAS LANGGANAN INTEGRASI AKSEN TEMA GRADASI DUA WARNA PREMIUM */}
              <div className={`p-6 rounded-[26px] shadow-sm text-left relative overflow-hidden border border-white/10 bg-gradient-to-br ${currentTheme.subGradient}`}>
                <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none text-white"><CalendarClock size={110} /></div>
                
                <div className="flex justify-between items-start relative z-10 mb-1">
                  <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest">Beban Tagihan Tetap</p>
                </div>


                <h2 className="text-3xl font-black tracking-tight text-white relative z-10 mb-2 mt-1">
                  {isPrivacyMode ? 'Rp •••••••' : `Rp ${totalMonthlySubscriptions.toLocaleString('id-ID')}`}
                </h2>
                <p className="text-[10px] text-white/80 font-medium max-w-[85%] relative z-10 leading-relaxed">
                  Pantau dan bayar kewajiban bulanan Anda dengan aman menggunakan sistem konfirmasi instan 1-Klik.
                </p>
              </div>

              {showAddSubForm && (
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 space-y-3.5 text-left shadow-sm animate-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center px-1 mb-1">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">📋 Daftarkan Tagihan Baru</h4>
                    <button onClick={() => { setShowAddSubForm(false); setActiveKeypad(null); }} className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-300"><X size={15}/></button>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Layanan</label>
                    <input 
                      type="text" 
                      placeholder="Netflix, Wi-Fi, Kosan..." 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-800 dark:text-white placeholder-slate-400" 
                      value={subName} 
                      onChange={e => setSubName(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nominal Tetap (Rp)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 186000" 
                      inputMode={isMobile ? "none" : undefined} 
                      onFocus={() => { if(isMobile) { setActiveKeypad("add-sub"); } }} 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-800 dark:text-white placeholder-slate-400" 
                      value={subAmount} 
                      onChange={e => setSubAmount(e.target.value)} 
                    />
                    {subAmount && (
                      <p className="text-[10px] font-bold text-slate-500 pl-1">
                        Terbaca: <span className={`font-black ${currentTheme.text}`}>{formatRupiahTerbaca(subAmount)}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Siklus</label>
                      <select 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-800 dark:text-white cursor-pointer" 
                        value={subCycle} 
                        onChange={e => setSubCycle(e.target.value as "monthly"|"yearly")}
                      >
                        <option value="monthly">Bulanan</option>
                        <option value="yearly">Tahunan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Jatuh Tempo Awal</label>
                      <input 
                        type="date" 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white" 
                        value={subDueDate} 
                        onChange={e => setSubDueDate(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Sumber Dana (Dompet)</label>
                    <div 
                      onClick={() => { triggerHaptic(); setSubAccSelector("add"); }}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Wallet size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {subAccountId ? (accounts.find(a => a.id === subAccountId)?.name || "Pilih Dompet...") : "Pilih dompet..."}
                        </span>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori Pengeluaran</label>
                    <div 
                      onClick={() => { triggerHaptic(); setSubCatSelector("add"); }}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tag size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700 dark:text-slate-300">
                          {subCategory ? (
                            <>
                              <span className="mr-2">{categories.find(c => c.name === subCategory)?.icon || "🏷️"}</span>
                              {subCategory}
                            </>
                          ) : "Pilih kategori..."}
                        </span>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2.5">
                    <button onClick={submitAddSub} className={`flex-1 py-3 text-white rounded-xl text-xs font-black cursor-pointer transition-colors active:scale-[0.98] ${currentTheme.fab}`}>Simpan Langganan</button>
                    <button onClick={() => { setShowAddSubForm(false); setActiveKeypad(null); }} className="py-3 px-5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Batal</button>
                  </div>
                </div>
              )}

              {/* Subscriptions Grid List */}
              <div className="space-y-3.5">
                {subscriptions.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    Belum ada daftar langganan tetap.
                  </p>
                ) : (
                  subscriptions.slice().sort((a,b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()).map(sub => {
                    const daysLeft = getDaysLeft(sub.nextDueDate);
                    const isOverdue = daysLeft < 0;
                    const isToday = daysLeft === 0;

                    return (
                      <div 
                        key={sub.id} 
                        className={`relative overflow-hidden p-5 rounded-[24px] border shadow-sm transition-all duration-200 text-left before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-blue-500 ${
                          isOverdue 
                            ? 'bg-red-50/20 dark:bg-red-900/10 border-red-200/60 dark:border-red-800/30' 
                            : isToday 
                              ? 'bg-amber-50/20 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/30' 
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80'
                        }`}
                      >
                        {editingSubId === sub.id ? (
                          <div className="space-y-3 pb-1">
                            <div className="flex justify-between items-center px-1 mb-1">
                              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Koreksi Langganan</p>
                              <button onClick={() => { setEditingSubId(null); setActiveKeypad(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={15}/></button>
                            </div>
                            
                            <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editSubName} onChange={e => setEditSubName(e.target.value)} />
                            <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editSubAmount} onChange={e => setEditSubAmount(e.target.value)} />
                            
                            <div className="grid grid-cols-2 gap-3">
                              <select className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editSubCycle} onChange={e => setEditSubCycle(e.target.value as any)}>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                              </select>
                              <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer text-slate-800 dark:text-white" value={editSubDueDate} onChange={e => setEditSubDueDate(e.target.value)} />
                            </div>

                            <div 
                              onClick={() => { triggerHaptic(); setSubAccSelector("edit"); }}
                              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Wallet size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate text-slate-700 dark:text-slate-300">
                                  {editSubAccountId ? (accounts.find(a => a.id === editSubAccountId)?.name || "Pilih dompet...") : "Pilih dompet..."}
                                </span>
                              </div>
                              <ChevronDown size={14} className="text-slate-400 shrink-0" />
                            </div>

                            <div 
                              onClick={() => { triggerHaptic(); setSubCatSelector("edit"); }}
                              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Tag size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate text-slate-700 dark:text-slate-300">
                                  {editSubCategory ? (
                                    <>
                                      <span className="mr-2">{categories.find(c => c.name === editSubCategory)?.icon || "🏷️"}</span>
                                      {editSubCategory}
                                    </>
                                  ) : "Pilih kategori..."}
                                </span>
                              </div>
                              <ChevronDown size={14} className="text-slate-400 shrink-0" />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button onClick={() => submitEditSub(sub.id)} className={`flex-1 py-3 text-white rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${currentTheme.fab}`}>Simpan Koreksi</button>
                              <button onClick={() => { setEditingSubId(null); setActiveKeypad(null); }} className="py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-3.5 pl-2">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                                  isOverdue 
                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-500' 
                                    : isToday 
                                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}>
                                  <Calendar size={18} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight tracking-tight">{sub.name}</h4>
                                  <p className="text-[10px] font-black mt-0.5 text-blue-600 dark:text-blue-400">
                                    {isPrivacyMode ? 'Rp •••••••' : `Rp ${sub.amount.toLocaleString('id-ID')}`} <span className="text-slate-400 dark:text-slate-500 font-medium text-[9px] uppercase tracking-wider">/ {sub.cycle === 'monthly' ? 'Bulan' : 'Tahun'}</span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                                <button onClick={() => startEditSub(sub)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-all"><Pencil size={13}/></button>
                                <button onClick={() => handleDeleteSubscription(sub.id)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-all"><Trash2 size={13}/></button>
                              </div>
                            </div>

                            <div className={`p-2.5 rounded-xl flex items-center justify-between text-[10px] font-bold border mb-3.5 ml-2 ${
                              isOverdue 
                                ? 'bg-red-50/50 dark:bg-red-900/15 border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400' 
                                : isToday 
                                  ? 'bg-amber-50/50 dark:bg-amber-900/15 border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400' 
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200/50 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              <div className="flex items-center gap-1.5 pl-0.5">
                                {isOverdue ? <AlertCircle size={14}/> : <CalendarClock size={14}/>}
                                <span>Tempo: {new Date(sub.nextDueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-widest font-black ${
                                isOverdue 
                                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400 animate-pulse' 
                                  : isToday 
                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400' 
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}>
                                {isOverdue ? `Lewat ${Math.abs(daysLeft)} Hari` : isToday ? 'HARI INI' : `${daysLeft} Hari`}
                              </span>
                            </div>

                            <div className="flex gap-2 pl-2">
                              <button 
                                onClick={() => { if(confirm(`Konfirmasi pembayaran ${sub.name} (Rp ${sub.amount.toLocaleString('id-ID')})?\nSaldo dompet otomatis terpotong dan jatuh tempo diperpanjang.`)) handlePaySubscription(sub); }} 
                                className={`flex-1 py-3 rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                                  isOverdue || isToday 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : currentTheme.payBtnInactive
                                }`}
                              >
                                <CreditCard size={14} /> 1-Click Pay
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 🚀 CONTEXT-AWARE INTELLIGENT FAB */}
          {((mainTab === "debts" && !showAddForm) || (mainTab === "subscriptions" && !showAddSubForm)) && (
            <button 
              onClick={() => {
                triggerHaptic();
                if (mainTab === "debts") {
                  setShowAddForm(true);
                  setEditingDebtId(null);
                } else {
                  setShowAddSubForm(true);
                  setEditingSubId(null);
                }
                setActiveKeypad(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`fixed bottom-24 right-6 z-50 p-4 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border ${currentTheme.fab} animate-in zoom-in-90`}
            >
              <Plus size={24} />
            </button>
          )}

          </div>
      )}

      {isMobile && activeKeypad !== null && (
        <div className="relative">
          <div className="fixed inset-0 z-[140] bg-black/25 dark:bg-black/50" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[28px] md:shadow-2xl translate-y-0 text-slate-800 dark:text-white">
            <div className="flex justify-between items-center mb-3.5 px-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-blue-400 tracking-wider uppercase">
                {activeKeypad === "add" ? "Kalkulator Nominal Baru" : activeKeypad === "edit" ? "Koreksi Nominal" : activeKeypad === "pay" ? "Kalkulator Pembayaran" : "Kalkulator Langganan"}
              </span>
              <button onClick={() => setActiveKeypad(null)} className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold flex items-center gap-1.5">
                Selesai <X size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-slate-100 font-black text-sm">
              {["+", "-", "*", "/"].map((op) => (
                <button 
                  key={op} 
                  type="button" 
                  onClick={() => handleKeypadPress(op)} 
                  className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/30 dark:border-slate-800/20"
                >
                  {op === "*" ? "×" : op === "/" ? "÷" : op}
                </button>
              ))}
              
              {["7", "8", "9"].map((num) => (
                <button 
                  key={num} 
                  type="button" 
                  onClick={() => handleKeypadPress(num)} 
                  className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10"
                >
                  {num}
                </button>
              ))}
              
              <button 
                type="button" 
                onClick={() => handleKeypadPress("C")} 
                className="py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-800/30 active:bg-red-100/80 dark:active:bg-red-900/40 rounded-xl transition-all select-none font-bold"
              >
                C
              </button>
              
              {["4", "5", "6"].map((num) => (
                <button 
                  key={num} 
                  type="button" 
                  onClick={() => handleKeypadPress(num)} 
                  className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10"
                >
                  {num}
                </button>
              ))}
              
              <button 
                type="button" 
                onClick={() => handleKeypadPress("⌫")} 
                className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 flex items-center justify-center transition-all select-none"
              >
                ⌫
              </button>
              
              {["1", "2", "3"].map((num) => (
                <button 
                  key={num} 
                  type="button" 
                  onClick={() => handleKeypadPress(num)} 
                  className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-200/40 dark:border-slate-800/10"
                >
                  {num}
                </button>
              ))}
              
              <button 
                type="button" 
                onClick={() => handleKeypadPress(".")} 
                className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none"
              >
                .
              </button>
              
              {["(", "0", ")"].map((char) => (
                <button 
                  key={char} 
                  type="button" 
                  onClick={() => handleKeypadPress(char)} 
                  className={`${char === "0" ? "bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-850" : "bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800"} py-3.5 rounded-xl transition-all select-none border border-slate-200/30 dark:border-slate-800/10`}
                >
                  {char}
                </button>
              ))}
              <button 
                type="button" 
                onClick={() => handleKeypadPress("Ya")} 
                className={`py-3.5 text-white font-black shadow-md transition-all select-none cursor-pointer rounded-xl ${currentTheme.fab}`}
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BOTTOM SHEET: PILIH DOMPET PEMBAYARAN KEPINGAN */}
      {/* ========================================== */}
      {payAccSelector && (
        <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-900/60 animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={() => setPayAccSelector(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] shadow-2xl p-6 pb-8 overflow-hidden z-10 flex flex-col max-h-[85vh] border-t border-slate-200 dark:border-slate-800 text-left">
            <div className="w-full flex justify-center pb-2"><div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div></div>
            <div className="flex justify-between items-center mb-6 pt-2">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Pilih Dompet Pengeluaran</h3>
              </div>
              <button type="button" onClick={() => setPayAccSelector(false)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-505 rounded-full cursor-pointer transition-colors"><X size={14} className="text-slate-700 dark:text-slate-300" /></button>
            </div>
            <div className="overflow-y-auto no-scrollbar pr-1">
              <div className="grid grid-cols-2 gap-3">
                {accounts.map(acc => {
                  const isSelected = payAccountId === acc.id;
                  return (
                    <div 
                      key={acc.id}
                      onClick={() => { triggerHaptic(); setPayAccountId(acc.id); setPayAccSelector(false); }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between relative transition-all active:scale-95 cursor-pointer h-28 ${
                        isSelected 
                          ? currentTheme.payAccSelected
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        {acc.logo ? (
                          <img src={acc.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-white" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Wallet size={16} />
                          </div>
                        )}
                        {isSelected && <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">✓</div>}
                      </div>
                      <div className="mt-2 min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-none mb-1">{acc.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate leading-none">Rp {acc.balance.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BOTTOM SHEET: PILIH KATEGORI PEMBAYARAN KEPINGAN */}
      {/* ========================================== */}
      {payCatSelector && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={() => setPayCatSelector(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh] border border-slate-200 dark:border-slate-800 text-left">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>🏷️</span> Pilih Kategori Pembayaran
              </h3>
              <button type="button" onClick={() => setPayCatSelector(false)} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"><X size={14}/></button>
            </div>
            
            <div className="p-5 overflow-y-auto no-scrollbar no-scrollbar bg-white dark:bg-slate-900">
              {selectedDebt?.type === "debt" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-orange-100 dark:border-orange-900/30 z-10">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {categories
                        .filter(c => c.type === "expense" && c.expenseType !== "fixed")
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(cat => {
                          const isSelected = payCategory === cat.name;
                          return (
                            <button 
                              key={cat.id} 
                              type="button" 
                              onClick={() => { triggerHaptic(); setPayCategory(cat.name); setPayCatSelector(false); }} 
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                                isSelected 
                                  ? `${currentTheme.activePill}` 
                                  : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span className="w-5 text-center shrink-0">{cat.icon || "🏷️"}</span>
                              <span className="truncate flex-1 text-left">{cat.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-purple-100 dark:border-purple-900/30 z-10">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {categories
                        .filter(c => c.type === "expense" && c.expenseType === "fixed")
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(cat => {
                          const isSelected = payCategory === cat.name;
                          return (
                            <button 
                              key={cat.id} 
                              type="button" 
                              onClick={() => { triggerHaptic(); setPayCategory(cat.name); setPayCatSelector(false); }} 
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                                isSelected 
                                  ? "bg-purple-600 text-white border-purple-700 shadow-sm" 
                                  : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span className="w-5 text-center shrink-0">{cat.icon || "🏷️"}</span>
                              <span className="truncate flex-1 text-left">{cat.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {categories
                    .filter(c => c.type === "income")
                    .sort((a,b) => a.name.localeCompare(b.name))
                    .map(cat => {
                      const isSelected = payCategory === cat.name;
                      return (
                        <button 
                          key={cat.id} 
                          type="button" 
                          onClick={() => { triggerHaptic(); setPayCategory(cat.name); setPayCatSelector(false); }} 
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                            isSelected 
                              ? "bg-green-600 text-white border-green-700 shadow-sm" 
                              : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          <span className="w-5 text-center shrink-0">{cat.icon || "🏷️"}</span>
                          <span className="truncate flex-1 text-left">{cat.name}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BOTTOM SHEET: PILIH DOMPET LANGGANAN */}
      {/* ========================================== */}
      {subAccSelector && (
        <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-900/60 animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={() => setSubAccSelector(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] shadow-2xl p-6 pb-8 overflow-hidden z-10 flex flex-col max-h-[85vh] border-t border-slate-200 dark:border-slate-800 text-left">
            <div className="w-full flex justify-center pb-2"><div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full"></div></div>
            <div className="flex justify-between items-center mb-6 pt-2">
              <div className="flex items-center gap-2">
                <Wallet size={18} className={currentTheme.text} />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Pilih Dompet Sumber Dana</h3>
              </div>
              <button type="button" onClick={() => setSubAccSelector(null)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-505 rounded-full cursor-pointer transition-colors"><X size={14} className="text-slate-700 dark:text-slate-300" /></button>
            </div>
            <div className="overflow-y-auto no-scrollbar no-scrollbar pr-1">
              <div className="grid grid-cols-2 gap-3">
                {accounts.map(acc => {
                  const isSelected = subAccSelector === "add" ? subAccountId === acc.id : editSubAccountId === acc.id;
                  return (
                    <div 
                      key={acc.id}
                      onClick={() => { 
                        triggerHaptic(); 
                        if (subAccSelector === "add") setSubAccountId(acc.id);
                        else setEditSubAccountId(acc.id);
                        setSubAccSelector(null); 
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between relative transition-all active:scale-95 cursor-pointer h-28 ${
                        isSelected 
                          ? currentTheme.payAccSelected
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        {acc.logo ? (
                          <img src={acc.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-white" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Wallet size={16} />
                          </div>
                        )}
                        {isSelected && <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-sm ${currentTheme.activeBg}`}>✓</div>}
                      </div>
                      <div className="mt-2 min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-none mb-1">{acc.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate leading-none">Rp {acc.balance.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BOTTOM SHEET: PILIH KATEGORI LANGGANAN */}
      {/* ========================================== */}
      {subCatSelector && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={() => setSubCatSelector(null)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh] border border-slate-200 dark:border-slate-800 text-left">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>🏷️</span> Pilih Kategori Berlangganan
              </h3>
              <button type="button" onClick={() => setSubCatSelector(null)} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"><X size={14}/></button>
            </div>
            
            <div className="p-5 overflow-y-auto no-scrollbar no-scrollbar bg-white dark:bg-slate-900">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-orange-100 dark:border-orange-900/30 z-10">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {categories
                      .filter(c => c.type === "expense" && c.expenseType !== "fixed")
                      .sort((a,b) => a.name.localeCompare(b.name))
                      .map(cat => {
                        const isSelected = subCatSelector === "add" ? subCategory === cat.name : editSubCategory === cat.name;
                        return (
                          <button 
                            key={cat.id} 
                            type="button" 
                            onClick={() => { 
                              triggerHaptic(); 
                              if (subCatSelector === "add") setSubCategory(cat.name);
                              else setEditSubCategory(cat.name);
                              setSubCatSelector(null); 
                            }} 
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                              isSelected 
                                ? currentTheme.activePill 
                                : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            <span className="w-5 text-center shrink-0">{cat.icon || "🏷️"}</span>
                            <span className="truncate flex-1 text-left">{cat.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                  <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-purple-100 dark:border-purple-900/30 z-10">
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {categories
                      .filter(c => c.type === "expense" && c.expenseType === "fixed")
                      .sort((a,b) => a.name.localeCompare(b.name))
                      .map(cat => {
                        const isSelected = subCatSelector === "add" ? subCategory === cat.name : editSubCategory === cat.name;
                        return (
                          <button 
                            key={cat.id} 
                            type="button" 
                            onClick={() => { 
                              triggerHaptic(); 
                              if (subCatSelector === "add") setSubCategory(cat.name);
                              else setEditSubCategory(cat.name);
                              setSubCatSelector(null); 
                            }} 
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-2 ${
                              isSelected 
                                ? "bg-purple-600 text-white border-purple-700 shadow-sm" 
                                : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                          >
                            <span className="w-5 text-center shrink-0">{cat.icon || "🏷️"}</span>
                            <span className="truncate flex-1 text-left">{cat.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}