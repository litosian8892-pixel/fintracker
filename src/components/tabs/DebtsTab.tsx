"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, CircleDashed, Trash2, Plus, Wallet, Pencil, Tag, X, Calendar, CalendarClock, CreditCard, AlertCircle, BookUser, ArrowLeft, ArrowDownLeft, ArrowUpRight, Link as LinkIcon, LayoutGrid, List, ChevronDown } from "lucide-react";
import { DebtData, AccountData, CategoryData, SubscriptionData } from "../../types";

interface DebtsTabProps {
  debts: DebtData[];
  accounts: AccountData[];
  categories: CategoryData[];
  
  handleAddDebt: (type: "debt" | "receivable", person: string, amount: number, note: string, dueDate: string, accountId?: string) => void;
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

  const [activeKeypad, setActiveKeypad] = useState<"add" | "edit" | "pay" | "add-sub" | "edit-sub" | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); 
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10);
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
    handleAddDebt(activeType, person, safeEvaluate(amount), note, dueDate, sourceAccountId);
    setShowAddForm(false); setPerson(""); setAmount(""); setNote(""); setDueDate(""); setSourceAccountId(""); setActiveKeypad(null);
  };

  const submitEdit = (id: string) => {
    if (!editPerson || !editAmount) return alert("Nama dan Nominal harus diisi!");
    handleEditDebt(id, editPerson, safeEvaluate(editAmount), editNote, editDueDate);
    setEditingDebtId(null); setActiveKeypad(null);
  };

  const submitPay = (debt: DebtData) => {
    if (!payAmount || !payAccountId || !payCategory) return alert("Nominal, Dompet, dan Kategori harus diisi!");
    const finalNote = debt.note ? debt.note : `Cicilan ${debt.type === 'debt' ? 'Utang ke' : 'Piutang dari'} ${debt.personName}`;
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

  // Saring daftar utang aktif berdasarkan Status (Belum Lunas vs Lunas)
  const currentDebtsList = filteredDebts.filter(d => statusFilter === "active" ? d.status === "active" : d.status === "paid");

  // Get currently selected debt detail object
  const selectedDebt = debts.find(d => d.id === selectedDebtId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-800 dark:text-slate-100">
      
      {/* Detail Screen Rendering (Matches Photo 2) */}
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
                className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-755 rounded-xl transition-all text-blue-600 cursor-pointer border border-slate-200/40 dark:border-slate-700/40"
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
                className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 rounded-xl transition-all text-red-500 cursor-pointer border border-red-100/40 dark:border-red-900/40"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Edit Box */}
          {editingDebtId === selectedDebt.id && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Koreksi Data Transaksi</p>
              <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editPerson} onChange={e => setEditPerson(e.target.value)} />
              <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
              <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
              <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editNote} onChange={e => setEditNote(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => submitEdit(selectedDebt.id)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Simpan Perubahan</button>
                <button onClick={() => setEditingDebtId(null)} className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold">Batal</button>
              </div>
            </div>
          )}

          {/* Premium Detail Summary Card (Matches Photo 2) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center font-black text-lg">
                  {selectedDebt.personName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-slate-100 leading-tight">{selectedDebt.personName}</h4>
                  
                  {/* MEMO / NOTE DI DETAIL */}
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
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-955/40 border border-amber-100/50 dark:border-amber-900/30 rounded-full text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-wider">
                {Math.round((selectedDebt.paidAmount / selectedDebt.amount) * 100)}% lunas
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {isPrivacyMode ? 'Rp •••••••' : `Rp ${(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString('id-ID')}`}
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Remaining Debt</span>
            </div>

            {/* Progress Slider (Matches Photo 2) */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-black">
                <span className="text-slate-600 dark:text-slate-400">Rp {selectedDebt.paidAmount.toLocaleString('id-ID')} / Rp {selectedDebt.amount.toLocaleString('id-ID')}</span>
                <span className="text-blue-500">{Math.round((selectedDebt.paidAmount / selectedDebt.amount) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${Math.min((selectedDebt.paidAmount / selectedDebt.amount) * 100, 100)}%` }}></div>
              </div>
            </div>

            {/* Clean Statistics Table List (Matches Photo 2 with fixed contrast) */}
            <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs font-bold">
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

            {/* High-contrast status block for dark mode (Matches Photo 2 with Fixed Contrast) */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              selectedDebt.type === "debt" 
                ? "bg-red-50/50 dark:bg-red-955/20 border-red-100/80 dark:border-red-900/30 text-red-700 dark:text-red-350" 
                : "bg-emerald-50/50 dark:bg-emerald-955/20 border-emerald-100/80 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-355"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${selectedDebt.type === "debt" ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300"}`}>
                  {selectedDebt.type === "debt" ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
                </div>
                <div className="text-[10px] font-black tracking-wide leading-tight text-left">
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
                  ? "bg-red-100/60 dark:bg-red-955/40 border-red-200/50 dark:border-red-900/30 text-red-700 dark:text-red-350" 
                  : "bg-emerald-100/60 dark:bg-emerald-955/40 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-355"
              }`}>
                {selectedDebt.type === "debt" ? "↓ DIPINJAM" : "↑ DIPINJAMKAN"}
              </span>
            </div>
          </div>

          {/* Sub-Section payment history: Debt Records (Matches Photo 2) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[26px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center px-1">
              <h5 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">Debt Records</h5>
              <span className="px-2 py-0.5 bg-blue-100/60 dark:bg-slate-800 text-[9px] font-black rounded-full text-blue-600 dark:text-blue-355 border border-transparent dark:border-slate-700/60">
                {selectedDebt.paidAmount > 0 ? "1 entries" : "0 entries"}
              </span>
            </div>

            {selectedDebt.paidAmount === 0 ? (
              <p className="text-center py-6 text-slate-450 dark:text-slate-400 text-xs italic">Belum ada mutasi pembayaran yang terekam.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3.5 bg-slate-50/50 dark:bg-slate-955/40 border border-slate-100/50 dark:border-slate-800/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <ArrowDownLeft size={14} />
                    </div>
                    <div>
                      <h6 className="font-black text-xs text-emerald-600 dark:text-emerald-400">-Rp {selectedDebt.paidAmount.toLocaleString('id-ID')}</h6>
                      <p className="text-[9px] text-slate-455 dark:text-slate-400 font-bold mt-0.5">
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
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-150 dark:bg-slate-800 text-[8.5px] font-mono text-slate-500 dark:text-slate-400 rounded cursor-pointer border border-transparent dark:border-slate-700/60">
                      <LinkIcon size={8} /> 59df7b...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Button (FAB) inside Detail Screen to Pay/Cicilan */}
          {selectedDebt.status === "active" && (
            <button 
              onClick={() => {
                setPayAmount((selectedDebt.amount - selectedDebt.paidAmount).toString());
                setPayAccountId("");
                setPayCategory("");
                setShowPayModal(true);
              }}
              className="fixed bottom-24 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl transition-all cursor-pointer border border-blue-500/10"
            >
              <Plus size={24} />
            </button>
          )}

          {/* Pop-up Payment Modal Overlay (Matches request for immediate top pop-up) */}
          {showPayModal && (
            <div className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
              <div className="absolute inset-0 z-0" onClick={() => { setShowPayModal(false); setActiveKeypad(null); }}></div>
              
              <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-t-[32px] sm:rounded-[28px] shadow-2xl p-6 overflow-hidden z-10 flex flex-col max-h-[85vh] border border-slate-150 dark:border-slate-800 text-left animate-in slide-in-from-bottom sm:zoom-in-95 duration-250">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Catat Cicilan / Pelunasan</h5>
                  <button onClick={() => { setShowPayModal(false); setActiveKeypad(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-full text-slate-400 transition-colors"><X size={15}/></button>
                </div>

                <div className="space-y-4">
                  {/* INPUT NOMINAL */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nominal Pembayaran (Rp)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 15000" 
                      inputMode={isMobile ? "none" : undefined} 
                      onFocus={() => { if(isMobile) { setActiveKeypad("pay"); } }} 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-white" 
                      value={payAmount} 
                      onChange={e => setPayAmount(e.target.value)} 
                    />
                    {payAmount && <p className="text-[10px] font-bold text-slate-500 pl-1">Terbaca: <span className="font-black text-blue-600">{formatRupiahTerbaca(payAmount)}</span></p>}
                  </div>

                  {/* TOMBOL BAYAR LUNAS CEPAT */}
                  <button 
                    type="button" 
                    onClick={() => { triggerHaptic(); setPayAmount((selectedDebt.amount - selectedDebt.paidAmount).toString()); }} 
                    className="w-full py-2.5 bg-blue-100 hover:bg-blue-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] font-black text-blue-700 dark:text-blue-300 rounded-lg border border-transparent cursor-pointer transition-all active:scale-95 text-center"
                  >
                    🚀 Bayar Lunas (Sisa Rp {(selectedDebt.amount - selectedDebt.paidAmount).toLocaleString('id-ID')})
                  </button>

                  {/* PEMILIH DOMPET PREMIUM CARD POP-UP */}
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

                  {/* PEMILIH KATEGORI PREMIUM POP-UP */}
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
                  <button onClick={() => submitPay(selectedDebt)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md">Konfirmasi Pembayaran</button>
                  <button onClick={() => { setShowPayModal(false); setActiveKeypad(null); }} className="py-3 px-5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-505 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-850">Batal</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Classic List View with beautiful Photo 3 styled Cards */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Main Sub Tab Swapper (UTANG SAYA / PIUTANG ORANG) */}
          <div className="bg-slate-100/60 dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm flex items-center gap-1.5 transition-all">
            <button 
              onClick={() => setMainTab("debts")} 
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mainTab === "debts" 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <BookUser size={15} /> Utang Piutang
            </button>
            <button 
              onClick={() => setMainTab("subscriptions")} 
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mainTab === "subscriptions" 
                  ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-600"
              }`}
            >
              <CalendarClock size={15} /> Langganan
            </button>
          </div>

          {mainTab === "debts" ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Classic Selection Tab Swapper */}
              <div className="bg-white dark:bg-slate-900/65 p-5 rounded-[26px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex gap-1.5 bg-slate-100/70 dark:bg-slate-950 p-1 rounded-xl">
                  <button 
                    onClick={() => { setActiveType("debt"); setShowAddForm(false); setEditingDebtId(null); setActiveKeypad(null); }} 
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeType === "debt" 
                        ? "bg-white dark:bg-slate-800 text-red-655 dark:text-red-400 shadow-sm border border-slate-150 dark:border-slate-700" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    UTANG SAYA
                  </button>
                  <button 
                    onClick={() => { setActiveType("receivable"); setShowAddForm(false); setEditingDebtId(null); setActiveKeypad(null); }} 
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeType === "receivable" 
                        ? "bg-white dark:bg-slate-800 text-emerald-655 dark:text-emerald-400 shadow-sm border border-slate-150 dark:border-slate-700" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    PIUTANG ORANG
                  </button>
                </div>
                
                <div className={`p-5 rounded-2xl transition-all duration-200 border text-left ${
                  activeType === "debt" 
                    ? "bg-red-50/40 dark:bg-red-955/10 border-red-100/80 dark:border-red-900/20" 
                    : "bg-emerald-50/40 dark:bg-emerald-955/10 border-emerald-100/80 dark:border-emerald-900/20"
                }`}>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${activeType === "debt" ? "text-red-500" : "text-emerald-500"}`}>
                    Sisa {activeType === "debt" ? "Utang Saya" : "Uang Saya di Orang"}
                  </p>
                  <h2 className={`text-2xl font-black tracking-tight mt-1 ${activeType === "debt" ? "text-red-650 dark:text-red-300" : "text-emerald-650 dark:text-emerald-300"}`}>
                    {isPrivacyMode ? 'Rp •••••••' : `Rp ${totalActive.toLocaleString('id-ID')}`}
                  </h2>
                </div>

                {showAddForm && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 text-left">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {activeType === "debt" ? "Mencatat Utang Baru" : "Mencatat Piutang Baru"}
                      </h4>
                      <button onClick={() => { setShowAddForm(false); setActiveKeypad(null); }} className="text-slate-400"><X size={15}/></button>
                    </div>
                    
                    <input 
                      type="text" 
                      placeholder={activeType === "debt" ? "Utang ke siapa?" : "Siapa yang pinjam?"} 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-750 dark:text-white placeholder-slate-400" 
                      value={person} 
                      onChange={e => setPerson(e.target.value)} 
                    />
                    
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        placeholder="Nominal Total (Rp)" 
                        inputMode={isMobile ? "none" : undefined} 
                        onFocus={() => { if(isMobile) { setActiveKeypad("add"); } }} 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-755 dark:text-white placeholder-slate-400" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                      />
                      {amount && (
                        <p className="text-[10px] font-bold text-slate-500 pl-1">
                          Terbaca: <span className="text-slate-700 dark:text-slate-250 font-black">{formatRupiahTerbaca(amount)}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">📅 Jatuh Tempo (Opsional)</label>
                      <input 
                        type="date" 
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-750 dark:text-white" 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                      />
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
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-bold text-slate-750 dark:text-white placeholder-slate-400" 
                      value={note} 
                      onChange={e => setNote(e.target.value)} 
                    />

                    <div className="flex gap-2 pt-1.5">
                      <button onClick={submitAdd} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-[0.98]">Simpan</button>
                      <button onClick={() => { setShowAddForm(false); setActiveKeypad(null); }} className="py-3 px-5 bg-slate-200 dark:bg-slate-800 text-slate-605 rounded-xl text-xs font-bold">Batal</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid of Photo 3 styled Premium Cards (UTANG & PIUTANG) */}
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span className={`w-[3px] h-3.5 rounded-full ${activeType === 'debt' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                    {activeType === 'debt' 
                      ? (statusFilter === 'active' ? `DIPINJAM (${currentDebtsList.length})` : `LUNAS SAYA (${currentDebtsList.length})`)
                      : (statusFilter === 'active' ? `DIPINJAMKAN (${currentDebtsList.length})` : `LUNAS ORANG (${currentDebtsList.length})`)}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* STATUS FILTER: Belum Lunas vs Lunas (Mencegah Penimbunan Data Rp 0) */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                      <button 
                        onClick={() => { triggerHaptic(); setStatusFilter("active"); }}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${statusFilter === "active" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-650"}`}
                      >
                        Belum Lunas
                      </button>
                      <button 
                        onClick={() => { triggerHaptic(); setStatusFilter("paid"); }}
                        className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer ${statusFilter === "paid" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-655"}`}
                      >
                        Lunas
                      </button>
                    </div>

                    {/* Layout switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-955 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
                      <button 
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-700"}`}
                      >
                        <LayoutGrid size={14} />
                      </button>
                      <button 
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-700"}`}
                      >
                        <List size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {currentDebtsList.length === 0 ? (
                  <p className="text-center py-12 text-slate-455 dark:text-slate-500 text-xs italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-855">
                    Tidak ada catatan {activeType === "debt" ? "utang" : "piutang"} yang {statusFilter === "active" ? "belum lunas" : "lunas"}.
                  </p>
                ) : viewMode === "grid" ? (
                  /* GRID BOX VIEW MODE (Matches Photo 3 - Perfectly optimized 2 columns for Mobile) */
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
                              ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-955/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] before:bg-emerald-500" 
                              : "border-slate-100 dark:border-slate-800/80 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[4px] " + (activeType === "debt" ? "before:bg-red-500" : "before:bg-emerald-500")
                          }`}
                        >
                          <div className="flex justify-between items-start pl-1.5">
                            <div className="flex items-center gap-3">
                              {/* Square box logo (Matches Photo 3) */}
                              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                                {debt.personName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight truncate">{debt.personName}</h4>
                                
                                {/* CATATAN MEMO UTANG PADA KARTU (Memulihkan memo catatan di list utama) */}
                                {debt.note && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate leading-none my-1" title={debt.note}>
                                    {debt.note}
                                  </p>
                                )}

                                {/* 4-Segment signal/battery visual representation (Matches Photo 3) */}
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
                            <h3 className="text-sm font-black text-slate-855 dark:text-white leading-none truncate">
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
                  /* LINEAR LIST VIEW MODE */
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {currentDebtsList.map(debt => {
                      const percentage = Math.min((debt.paidAmount / debt.amount) * 100, 100);
                      const isPaid = debt.status === "paid";
                      const overdue = !isPaid && isOverdue(debt.dueDate || "");

                      return (
                        <div 
                          key={debt.id} 
                          onClick={() => setSelectedDebtId(debt.id)}
                          className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-855/30 transition-all cursor-pointer text-left pl-5 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center font-black text-xs">
                              {debt.personName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs tracking-tight">{debt.personName}</h4>
                              
                              {/* MEMO PADA LIST VIEW */}
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
                            <p className={`text-[9px] font-black mt-0.5 ${isPaid ? "text-emerald-500" : "text-blue-500"}`}>
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
            /* Subscriptions Tab rendering */
            <div className="space-y-6 text-left animate-in fade-in duration-200">
              
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[26px] shadow-sm text-left relative overflow-hidden border border-blue-500/10">
                <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none text-white"><CalendarClock size={110} /></div>
                <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Beban Tagihan Tetap Bulan Ini</p>
                <h2 className="text-3xl font-black tracking-tight text-white relative z-10 mb-2">
                  {isPrivacyMode ? 'Rp •••••••' : `Rp ${totalMonthlySubscriptions.toLocaleString('id-ID')}`}
                </h2>
                <p className="text-[10px] text-blue-100/80 font-medium max-w-[85%] relative z-10 leading-relaxed">
                  Pantau dan bayar kewajiban bulanan Anda dengan aman menggunakan sistem konfirmasi instan 1-Klik.
                </p>
              </div>

              {!showAddSubForm ? (
                <button 
                  onClick={() => { setShowAddSubForm(true); setEditingSubId(null); setActiveKeypad(null); }} 
                  className="w-full py-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Plus size={16}/> Daftarkan Tagihan Baru
                </button>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-[24px] border border-slate-200 dark:border-slate-800 space-y-3.5 text-left shadow-sm">
                  <div className="flex justify-between items-center px-1 mb-1">
                    <h4 className="text-xs font-black text-slate-855 dark:text-slate-100">📋 Daftarkan Tagihan Baru</h4>
                    <button onClick={() => { setShowAddSubForm(false); setActiveKeypad(null); }} className="text-slate-400"><X size={15}/></button>
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
                        Terbaca: <span className="text-blue-655 dark:text-blue-400 font-black">{formatRupiahTerbaca(subAmount)}</span>
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
                    <select 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white" 
                      value={subAccountId} 
                      onChange={e => setSubAccountId(e.target.value)}
                    >
                      <option value="" disabled>Pilih dompet...</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori Pengeluaran</label>
                    <select 
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-white" 
                      value={subCategory} 
                      onChange={e => setSubCategory(e.target.value)}
                    >
                      <option value="" disabled>Pilih kategori...</option>
                      {categories.filter(c => c.type === "expense").sort((a,b)=>a.name.localeCompare(b.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2.5">
                    <button onClick={submitAddSub} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors active:scale-[0.98]">Simpan Langganan</button>
                    <button onClick={() => { setShowAddSubForm(false); setActiveKeypad(null); }} className="py-3 px-5 bg-slate-200 dark:bg-slate-850 text-slate-650 rounded-xl text-xs font-bold">Batal</button>
                  </div>
                </div>
              )}

              {/* Subscriptions Grid List */}
              <div className="space-y-3.5">
                {subscriptions.length === 0 ? (
                  <p className="text-center py-12 text-slate-400 dark:text-slate-550 text-xs italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-150">
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
                            ? 'bg-red-50/20 dark:bg-red-955/10 border-red-200/60 dark:border-red-900/30' 
                            : isToday 
                              ? 'bg-amber-50/20 dark:bg-amber-955/10 border-amber-200/60 dark:border-amber-900/30' 
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80'
                        }`}
                      >
                        {editingSubId === sub.id ? (
                          <div className="space-y-3 pb-1">
                            <div className="flex justify-between items-center px-1 mb-1">
                              <p className="text-[10px] font-black text-blue-600 dark:text-blue-450 uppercase tracking-widest">Koreksi Langganan</p>
                              <button onClick={() => { setEditingSubId(null); setActiveKeypad(null); }} className="text-slate-400"><X size={15}/></button>
                            </div>
                            
                            <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editSubName} onChange={e => setEditSubName(e.target.value)} />
                            <input type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editSubAmount} onChange={e => setEditSubAmount(e.target.value)} />
                            
                            <div className="grid grid-cols-2 gap-3">
                              <select className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dark:text-white" value={editSubCycle} onChange={e => setEditSubCycle(e.target.value as any)}>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                              </select>
                              <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer text-slate-800 dark:text-white" value={editSubDueDate} onChange={e => setEditSubDueDate(e.target.value)} />
                            </div>

                            <select className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer text-slate-850 dark:text-white" value={editSubAccountId} onChange={e => setEditSubAccountId(e.target.value)}>
                              <option value="" disabled>Pilih dompet...</option>
                              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>

                            <select className="w-full p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer text-slate-855 dark:text-white" value={editSubCategory} onChange={e => setEditSubCategory(e.target.value)}>
                              <option value="" disabled>Pilih kategori...</option>
                              {categories.filter(c => c.type === "expense").sort((a,b)=>a.name.localeCompare(b.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>

                            <div className="flex gap-2 pt-2">
                              <button onClick={() => submitEditSub(sub.id)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">Simpan Koreksi</button>
                              <button onClick={() => { setEditingSubId(null); setActiveKeypad(null); }} className="py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-3.5 pl-2">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                                  isOverdue 
                                    ? 'bg-red-100 dark:bg-red-955/40 text-red-500' 
                                    : isToday 
                                      ? 'bg-amber-100 dark:bg-amber-955/40 text-amber-500' 
                                      : 'bg-slate-150 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  <Calendar size={18} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight tracking-tight">{sub.name}</h4>
                                  <p className="text-[10px] font-black text-blue-655 dark:text-blue-455 mt-0.5">
                                    {isPrivacyMode ? 'Rp •••••••' : `Rp ${sub.amount.toLocaleString('id-ID')}`} <span className="text-slate-400 dark:text-slate-500 font-medium text-[9px] uppercase tracking-wider">/ {sub.cycle === 'monthly' ? 'Bulan' : 'Tahun'}</span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                                <button onClick={() => startEditSub(sub)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-all"><Pencil size={13}/></button>
                                <button onClick={() => handleDeleteSubscription(sub.id)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-all"><Trash2 size={13}/></button>
                              </div>
                            </div>

                            <div className={`p-2.5 rounded-xl flex items-center justify-between text-[10px] font-bold border mb-3.5 ml-2 ${
                              isOverdue 
                                ? 'bg-red-50/50 dark:bg-red-955/15 border-red-200/50 dark:border-red-900/30 text-red-700 dark:text-red-455' 
                                : isToday 
                                  ? 'bg-amber-50/50 dark:bg-amber-955/15 border-amber-200/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-455' 
                                  : 'bg-slate-50 dark:bg-slate-855 border-slate-200/50 dark:border-slate-750 text-slate-500 dark:text-slate-400'
                            }`}>
                              <div className="flex items-center gap-1.5 pl-0.5">
                                {isOverdue ? <AlertCircle size={14}/> : <CalendarClock size={14}/>}
                                <span>Tempo: {new Date(sub.nextDueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase tracking-widest font-black ${
                                isOverdue 
                                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 animate-pulse' 
                                  : isToday 
                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' 
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-655 dark:text-slate-300'
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
                                    : 'bg-blue-50/40 hover:bg-blue-100/60 dark:bg-blue-955/40 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100/30 dark:border-blue-900/30'
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

          {/* Floating Action Button (FAB) at Bottom Right (List screen - Perfectly Raised above BottomNav) */}
          {mainTab === "debts" && (
            <button 
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingDebtId(null);
                setActiveKeypad(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="fixed bottom-24 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl transition-all cursor-pointer border border-blue-500/10"
            >
              {showAddForm ? <X size={24} /> : <Plus size={24} />}
            </button>
          )}

        </div>
      )}

      {/* Virtual Keypad Bottom Sheet */}
      {isMobile && activeKeypad !== null && (
        <>
          {/* Backdrop tanpa blur filter */}
          <div className="fixed inset-0 z-[140] bg-black/25 dark:bg-black/50" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-955 border-t border-slate-200/80 dark:border-slate-800/80 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[28px] md:shadow-2xl translate-y-0 text-slate-800 dark:text-white">
            <div className="flex justify-between items-center mb-3.5 px-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-blue-400 tracking-wider uppercase">
                {activeKeypad === "add" ? "Kalkulator Nominal Baru" : activeKeypad === "edit" ? "Koreksi Nominal" : activeKeypad === "pay" ? "Kalkulator Pembayaran" : "Kalkulator Langganan"}
              </span>
              <button onClick={() => setActiveKeypad(null)} className="text-slate-400 hover:text-slate-655 dark:hover:text-white p-1 text-xs font-bold flex items-center gap-1.5">
                Selesai <X size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-slate-855 dark:text-slate-100 font-black text-sm">
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
                  className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800 rounded-xl transition-all select-none border border-slate-150/40 dark:border-slate-855/10"
                >
                  {num}
                </button>
              ))}
              
              <button 
                type="button" 
                onClick={() => handleKeypadPress("C")} 
                className="py-3.5 bg-red-50 dark:bg-red-955/20 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/30 active:bg-red-100/80 dark:active:bg-red-900/40 rounded-xl transition-all select-none font-bold"
              >
                C
              </button>
              
              {["4", "5", "6"].map((num) => (
                <button 
                  key={num} 
                  type="button" 
                  onClick={() => handleKeypadPress(num)} 
                  className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-850 rounded-xl transition-all select-none border border-slate-150/40 dark:border-slate-855/10"
                >
                  {num}
                </button>
              ))}
              
              <button 
                type="button" 
                onClick={() => handleKeypadPress("⌫")} 
                className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-400 flex items-center justify-center transition-all select-none"
              >
                ⌫
              </button>
              
              {["1", "2", "3"].map((num) => (
                <button 
                  key={num} 
                  type="button" 
                  onClick={() => handleKeypadPress(num)} 
                  className="py-3.5 bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-855 rounded-xl transition-all select-none border border-slate-150/40 dark:border-slate-855/10"
                >
                  {num}
                </button>
              ))}
              
              <button 
                type="button" 
                onClick={() => handleKeypadPress(".")} 
                className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-850 rounded-xl transition-all select-none"
              >
                .
              </button>
              
              {["(", "0", ")"].map((char) => (
                <button 
                  key={char} 
                  type="button" 
                  onClick={() => handleKeypadPress(char)} 
                  className={`${char === "0" ? "bg-slate-50/90 dark:bg-slate-900/40 active:bg-slate-100 dark:active:bg-slate-800" : "bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800"} py-3.5 rounded-xl transition-all select-none border border-slate-150/30 dark:border-slate-855/10`}
                >
                  {char}
                </button>
              ))}
              <button 
                type="button" 
                onClick={() => handleKeypadPress("Ya")} 
                className="py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl text-white font-black shadow-md shadow-blue-950/20 transition-all select-none cursor-pointer"
              >
                Ya
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* BOTTOM SHEET: PILIH DOMPET PEMBAYARAN KEPINGAN */}
      {/* ========================================== */}
      {payAccSelector && (
        <div className="fixed inset-0 z-[190] flex items-end justify-center bg-slate-900/60 animate-in fade-in duration-200">
          <div className="absolute inset-0 z-0" onClick={() => setPayAccSelector(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] shadow-2xl p-6 pb-8 overflow-hidden z-10 flex flex-col max-h-[85vh] border-t border-slate-200 dark:border-slate-800 text-left">
            <div className="w-full flex justify-center pb-2"><div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>
            <div className="flex justify-between items-center mb-6 pt-2">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Pilih Dompet Pengeluaran</h3>
              </div>
              <button type="button" onClick={() => setPayAccSelector(false)} className="p-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"><X size={14} /></button>
            </div>
            <div className="overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                {accounts.map(acc => {
                  const isSelected = payAccountId === acc.id;
                  return (
                    <div 
                      key={acc.id}
                      onClick={() => { triggerHaptic(); setPayAccountId(acc.id); setPayAccSelector(false); }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between relative transition-all active:scale-95 cursor-pointer h-28 ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-955/20 shadow-md shadow-blue-500/5" 
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-855"
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
          <div className="bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh] border border-slate-150 dark:border-slate-800 text-left">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>🏷️</span> Pilih Kategori Pembayaran
              </h3>
              <button type="button" onClick={() => setPayCatSelector(false)} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-650 rounded-full cursor-pointer"><X size={14}/></button>
            </div>
            
            <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900">
              {selectedDebt?.type === "debt" ? (
                /* Pengelompokan Kategori Pengeluaran (Expense) */
                <div className="grid grid-cols-2 gap-4">
                  {/* KOLOM 1: VARIABEL */}
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-orange-100 dark:border-orange-955/30 z-10">
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
                                  ? "bg-blue-600 text-white border-blue-700 shadow-sm" 
                                  : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-755"
                              }`}
                            >
                              <span className="w-5 text-center shrink-0">{cat.icon || "🏷️"}</span>
                              <span className="truncate flex-1 text-left">{cat.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* KOLOM 2: TETAP */}
                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 border-b border-purple-100 dark:border-purple-955/30 z-10">
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
                                  : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-755"
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
                /* Pengelompokan Kategori Pemasukan (Income) */
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
                              : "bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-755"
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

    </div>
  );
}