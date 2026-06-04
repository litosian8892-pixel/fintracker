"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, CircleDashed, Trash2, Plus, Wallet, Pencil, Tag, X, Calendar, CalendarClock, Repeat, CreditCard, AlertCircle, BookUser } from "lucide-react";
import { DebtData, AccountData, CategoryData, SubscriptionData } from "../../types";

interface DebtsTabProps {
  debts: DebtData[];
  accounts: AccountData[];
  categories: CategoryData[];
  
  // Props Utang
  handleAddDebt: (type: "debt" | "receivable", person: string, amount: number, note: string, dueDate: string, accountId?: string) => void;
  handleEditDebt: (id: string, person: string, amount: number, note: string, dueDate: string) => void; 
  handlePayDebt: (debtId: string, payAmount: number, accountId: string, category: string, note: string) => void; 
  handleDeleteDebt: (debtId: string) => void;

  // Props Langganan Baru
  subscriptions: SubscriptionData[];
  handleAddSubscription: (name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => void;
  handleEditSubscription: (id: string, name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => void;
  handlePaySubscription: (sub: SubscriptionData) => void;
  handleDeleteSubscription: (id: string) => void;

  isPrivacyMode?: boolean; // Prop Privacy Mode
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
  
  // State Utama: Toggle Tab
  const [mainTab, setMainTab] = useState<"debts" | "subscriptions">("debts");
  
  // State Utang
  const [activeType, setActiveType] = useState<"debt" | "receivable">("debt");
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

  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [payCategory, setPayCategory] = useState(""); 

  // State Langganan
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

  // Keypad & Mobile
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

  // --- LOGIKA UTANG ---
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

  const startEdit = (debt: DebtData) => {
    setEditingDebtId(debt.id); setEditPerson(debt.personName); setEditAmount(debt.amount.toString());
    setEditNote(debt.note || ""); setEditDueDate(debt.dueDate || ""); setPayingDebtId(null); setActiveKeypad(null);
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
    setPayingDebtId(null); setPayAmount(""); setPayAccountId(""); setPayCategory(""); setActiveKeypad(null);
  };

  const filteredDebts = debts.filter(d => d.type === activeType);
  const totalActive = filteredDebts.filter(d => d.status === "active").reduce((a, b) => a + (b.amount - b.paidAmount), 0);

  // --- LOGIKA LANGGANAN ---
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

  const totalMonthlySubscriptions = subscriptions.reduce((acc, sub) => acc + (sub.cycle === 'monthly' ? sub.amount : sub.amount / 12), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* GLOBAL TAB TOGGLE */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1 transition-colors duration-200">
        <button onClick={() => setMainTab("debts")} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${mainTab === "debts" ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
          <BookUser size={16} /> Utang Piutang
        </button>
        <button onClick={() => setMainTab("subscriptions")} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${mainTab === "subscriptions" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-800" : "text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"}`}>
          <CalendarClock size={16} /> Langganan
        </button>
      </div>

      {mainTab === "debts" ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Toggle Utang/Piutang */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
              <button onClick={() => { setActiveType("debt"); setShowAddForm(false); setEditingDebtId(null); setActiveKeypad(null); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeType === "debt" ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm border border-transparent dark:border-red-900/30" : "text-slate-400 dark:text-slate-50"}`}>UTANG SAYA</button>
              <button onClick={() => { setActiveType("receivable"); setShowAddForm(false); setEditingDebtId(null); setActiveKeypad(null); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeType === "receivable" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-transparent dark:border-emerald-900/30" : "text-slate-400 dark:text-slate-50"}`}>PIUTANG ORANG</button>
            </div>
            
            <div className={`p-5 rounded-2xl transition-colors ${activeType === "debt" ? "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30"}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${activeType === "debt" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}`}>
                Sisa {activeType === "debt" ? "Utang Saya" : "Uang Saya di Orang"}
              </p>
              <h2 className={`text-2xl font-black italic mt-1 transition-all duration-300 ${activeType === "debt" ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"} ${isPrivacyMode ? 'blur-md select-none' : ''}`}>
                Rp {totalActive.toLocaleString('id-ID')}
              </h2>
            </div>

            {!showAddForm ? (
              <button onClick={() => { setShowAddForm(true); setEditingDebtId(null); setActiveKeypad(null); }} className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"><Plus size={16}/> Tambah Catatan Baru</button>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200 text-left">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{activeType === "debt" ? "Mencatat Utang Baru" : "Mencatat Piutang Baru"}</h4>
                <input type="text" placeholder={activeType === "debt" ? "Utang ke siapa?" : "Siapa yang pinjam?"} className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-100" value={person} onChange={e => setPerson(e.target.value)} />
                <div className="space-y-1">
                  <input type="text" placeholder="Nominal Total (Rp)" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveKeypad("add"); }} className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-100" value={amount} onChange={e => setAmount(e.target.value)} />
                  {amount && <p className="text-[10px] font-bold text-slate-455 dark:text-slate-400 pl-1 animate-in fade-in duration-150 text-left">Terbaca: <span className="text-slate-600 dark:text-slate-200 font-black">{formatRupiahTerbaca(amount)}</span></p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">📅 Jatuh Tempo (Opsional)</label>
                  <input type="date" className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-100 cursor-pointer" value={dueDate} onChange={e => setDueDate(e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()} />
                </div>
                {activeType === "receivable" && (
                  <div className="relative">
                    <Wallet className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                    <select className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-100 dark:border-slate-700" value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)}>
                      <option value="" disabled>Kirim dari Dompet...</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})</option>)}
                    </select>
                  </div>
                )}
                <input type="text" placeholder="Catatan / Tujuan pinjam" className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-100" value={note} onChange={e => setNote(e.target.value)} />
                <div className="flex gap-2 pt-2">
                  <button onClick={submitAdd} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors">Simpan</button>
                  <button onClick={() => { setShowAddForm(false); setActiveKeypad(null); }} className="py-3 px-6 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-bold cursor-pointer transition-colors">Batal</button>
                </div>
              </div>
            )}
          </div>

          {/* List Utang/Piutang */}
          <div className="space-y-3">
            {filteredDebts.length === 0 ? (
              <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">Belum ada catatan {activeType === "debt" ? "utang" : "piutang"}.</p>
            ) : (
              filteredDebts.map(debt => {
                const percentage = Math.min((debt.paidAmount / debt.amount) * 100, 100);
                const isPaid = debt.status === "paid";
                const overdue = !isPaid && isOverdue(debt.dueDate || "");

                return (
                  <div key={debt.id} className={`bg-white p-5 rounded-[25px] border shadow-sm transition-all duration-200 ${isPaid ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                    
                    {editingDebtId === debt.id ? (
                      <div className="space-y-3 animate-in fade-in text-left pb-2">
                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-center mb-2">Form Koreksi {activeType === "debt" ? "Utang" : "Piutang"}</p>
                        <input type="text" placeholder={activeType === "debt" ? "Utang ke siapa?" : "Siapa yang pinjam?"} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={editPerson} onChange={e => setEditPerson(e.target.value)} />
                        <div className="space-y-1">
                          <input type="text" placeholder="Nominal Total (Rp)" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveKeypad("edit"); }} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                          {editAmount && <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className="text-blue-600 dark:text-blue-400 font-black">{formatRupiahTerbaca(editAmount)}</span></p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 px-1">📅 Jatuh Tempo (Opsional)</label>
                          <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100 cursor-pointer" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()} />
                        </div>
                        <input type="text" placeholder="Catatan / Tujuan pinjam" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={editNote} onChange={e => setEditNote(e.target.value)} />
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => submitEdit(debt.id)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-blue-500/20">Simpan Koreksi</button>
                          <button onClick={() => { setEditingDebtId(null); setActiveKeypad(null); }} className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-355 rounded-xl text-xs font-bold border border-transparent dark:border-slate-700 cursor-pointer transition-colors">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3 text-left">
                            {isPaid ? <CheckCircle2 className="text-emerald-500" size={24}/> : <CircleDashed className="text-slate-300 dark:text-slate-600" size={24}/>}
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{debt.personName}</h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{debt.note}</p>
                              {debt.dueDate && (
                                <p className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${overdue ? "text-red-500 animate-pulse" : "text-slate-400 dark:text-slate-500"}`}>
                                  Jatuh Tempo: {new Date(debt.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                  {overdue && " • Terlewat / Overdue! ⚠️"}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(debt)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"><Pencil size={15}/></button>
                            <button onClick={() => handleDeleteDebt(debt.id)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <div className="flex justify-between text-xs font-black">
                            <span className="text-slate-500 dark:text-slate-400">
                              Terkumpul: <span className={`transition-all duration-300 ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>Rp {debt.paidAmount.toLocaleString('id-ID')}</span>
                            </span>
                            <span className="text-slate-800 dark:text-slate-200">
                              Total: <span className={`transition-all duration-300 ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>Rp {debt.amount.toLocaleString('id-ID')}</span>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${isPaid ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>

                        {!isPaid && payingDebtId !== debt.id && (
                          <button onClick={() => { setPayingDebtId(debt.id); setPayCategory(""); setPayAccountId(""); setPayAmount(""); setActiveKeypad(null); }} className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
                            Catat Pembayaran / Cicilan
                          </button>
                        )}

                        {payingDebtId === debt.id && (
                          <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200 text-left">
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-center">Form Pembayaran</p>
                            <div className="space-y-1">
                              <input type="text" placeholder="Nominal Bayar (Rp)" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveKeypad("pay"); }} className="w-full p-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                              {payAmount && <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 pl-1 animate-in fade-in duration-150 text-left">Terbaca: <span className="text-blue-600 dark:text-blue-400 font-black">{formatRupiahTerbaca(payAmount)}</span></p>}
                            </div>
                            <div className="flex gap-1.5 pt-0.5 animate-in fade-in duration-200">
                              {[25, 50, 75, 100].map((pct) => {
                                const remaining = debt.amount - debt.paidAmount;
                                const calculated = Math.round(remaining * (pct / 100));
                                return (
                                  <button key={pct} type="button" onClick={() => { triggerHaptic(); setPayAmount(calculated.toString()); }} className="flex-1 py-1.5 bg-blue-100/50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-black text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200/50 dark:border-slate-750 cursor-pointer transition-colors">
                                    {pct}% ({pct === 100 ? "Lunas" : "Rp " + calculated.toLocaleString('id-ID')})
                                  </button>
                                );
                              })}
                            </div>
                            <div className="relative">
                              <Wallet className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                              <select className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 appearance-none text-slate-700 dark:text-slate-200 cursor-pointer" value={payAccountId} onChange={e => setPayAccountId(e.target.value)}>
                                <option value="" disabled>Pilih Dompet...</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})</option>)}
                              </select>
                            </div>
                            <div className="relative">
                              <Tag className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                              <select className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 appearance-none text-slate-700 dark:text-slate-200 cursor-pointer" value={payCategory} onChange={e => setPayCategory(e.target.value)}>
                                <option value="" disabled>Pilih Kategori Pembayaran...</option>
                                {categories.filter(c => c.type === (debt.type === "debt" ? "expense" : "income")).sort((a, b) => a.name.localeCompare(b.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => submitPay(debt)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">Konfirmasi</button>
                              <button onClick={() => { setPayingDebtId(null); setActiveKeypad(null); }} className="py-2.5 px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer">Batal</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (

        // --- TAB LANGGANAN (SUBSCRIPTIONS) ---
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-[30px] shadow-xl text-left relative overflow-hidden transition-all">
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none"><CalendarClock size={120} /></div>
            <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Beban Tagihan Tetap Bulan Ini</p>
            <h2 className={`text-3xl md:text-4xl font-black italic text-white relative z-10 mb-2 transition-all duration-300 ${isPrivacyMode ? 'blur-md select-none' : ''}`}>
              Rp {totalMonthlySubscriptions.toLocaleString('id-ID')}
            </h2>
            <p className="text-[10px] text-blue-200 font-medium max-w-[80%] relative z-10 leading-tight">Jangan biarkan tagihan menunggak. Pantau dan bayar kewajiban bulanan Anda dengan sistem konfirmasi 1-Klik yang aman.</p>
          </div>

          {!showAddSubForm ? (
            <button onClick={() => { setShowAddSubForm(true); setEditingSubId(null); setActiveKeypad(null); }} className="w-full py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 hover:border-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"><Plus size={16}/> Daftarkan Tagihan Baru</button>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[25px] border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200 text-left shadow-sm">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-2">📋 Mendaftarkan Tagihan/Langganan</h4>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Layanan</label>
                <input type="text" placeholder="Misal: Netflix, Wi-Fi, Kosan..." className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white" value={subName} onChange={e => setSubName(e.target.value)} />
              </div>
              
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nominal Tetap (Rp)</label>
                <input type="text" placeholder="Contoh: 186000" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveKeypad("add-sub"); }} className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white" value={subAmount} onChange={e => setSubAmount(e.target.value)} />
                {subAmount && <p className="text-[10px] font-bold text-slate-455 dark:text-slate-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className="text-blue-600 dark:text-blue-400 font-black">{formatRupiahTerbaca(subAmount)}</span></p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Siklus</label>
                  <select className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={subCycle} onChange={e => setSubCycle(e.target.value as "monthly"|"yearly")}>
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Jatuh Tempo Awal</label>
                  <input type="date" className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={subDueDate} onChange={e => setSubDueDate(e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Sumber Dana (Dompet)</label>
                <select className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={subAccountId} onChange={e => setSubAccountId(e.target.value)}>
                  <option value="" disabled>Pilih dompet pembayaran...</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori Pengeluaran</label>
                <select className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
                  <option value="" disabled>Pilih kategori...</option>
                  {categories.filter(c => c.type === "expense").sort((a,b)=>a.name.localeCompare(b.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button onClick={submitAddSub} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors">Simpan Langganan</button>
                <button onClick={() => { setShowAddSubForm(false); setActiveKeypad(null); }} className="py-3 px-6 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-bold cursor-pointer transition-colors">Batal</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">Belum ada daftar langganan tetap.</p>
            ) : (
              subscriptions.slice().sort((a,b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()).map(sub => {
                const daysLeft = getDaysLeft(sub.nextDueDate);
                const isOverdue = daysLeft < 0;
                const isToday = daysLeft === 0;

                return (
                  <div key={sub.id} className={`p-5 rounded-[25px] border shadow-sm transition-all duration-200 text-left ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' : isToday ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    
                    {editingSubId === sub.id ? (
                       <div className="space-y-3 animate-in fade-in pb-2">
                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-center mb-2">Form Koreksi Langganan</p>
                        
                        <input type="text" placeholder="Nama Layanan" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white" value={editSubName} onChange={e => setEditSubName(e.target.value)} />
                        
                        <div className="space-y-1">
                          <input type="text" placeholder="Nominal (Rp)" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveKeypad("edit-sub"); }} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white" value={editSubAmount} onChange={e => setEditSubAmount(e.target.value)} />
                          {editSubAmount && <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className="text-blue-600 dark:text-blue-400 font-black">{formatRupiahTerbaca(editSubAmount)}</span></p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <select className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={editSubCycle} onChange={e => setEditSubCycle(e.target.value as any)}>
                            <option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
                          </select>
                          <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={editSubDueDate} onChange={e => setEditSubDueDate(e.target.value)} onClick={(e) => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()} />
                        </div>

                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={editSubAccountId} onChange={e => setEditSubAccountId(e.target.value)}>
                          <option value="" disabled>Pilih dompet...</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>

                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-white cursor-pointer" value={editSubCategory} onChange={e => setEditSubCategory(e.target.value)}>
                          <option value="" disabled>Pilih kategori...</option>
                          {categories.filter(c => c.type === "expense").sort((a,b)=>a.name.localeCompare(b.name)).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>

                        <div className="flex gap-2 pt-2">
                          <button onClick={() => submitEditSub(sub.id)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-blue-500/20">Simpan Koreksi</button>
                          <button onClick={() => { setEditingSubId(null); setActiveKeypad(null); }} className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-355 rounded-xl text-xs font-bold border border-transparent dark:border-slate-700 cursor-pointer transition-colors">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-red-100 dark:bg-red-900/40 text-red-500' : isToday ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              <Calendar size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{sub.name}</h4>
                              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mt-0.5">
                                <span className={`transition-all duration-300 ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>Rp {sub.amount.toLocaleString('id-ID')}</span> <span className="text-slate-400 dark:text-slate-500 font-medium text-[9px] uppercase tracking-wider">/ {sub.cycle === 'monthly' ? 'Bulan' : 'Tahun'}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditSub(sub)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"><Pencil size={15}/></button>
                            <button onClick={() => handleDeleteSubscription(sub.id)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl flex items-center justify-between text-[10px] font-bold border mb-4 ${isOverdue ? 'bg-red-100/50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400' : isToday ? 'bg-amber-100/50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                          <div className="flex items-center gap-1.5">
                            {isOverdue ? <AlertCircle size={14}/> : <CalendarClock size={14}/>}
                            <span>Tempo: {new Date(sub.nextDueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded uppercase tracking-widest font-black ${isOverdue ? 'bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300 animate-pulse' : isToday ? 'bg-amber-200 dark:bg-amber-900 text-amber-700 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            {isOverdue ? `Lewat ${Math.abs(daysLeft)} Hari` : isToday ? 'HARI INI' : `${daysLeft} Hari Lagi`}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => { if(confirm(`Konfirmasi pembayaran ${sub.name} (Rp ${sub.amount.toLocaleString('id-ID')})?\nSaldo dompet otomatis terpotong dan jatuh tempo diperpanjang.`)) handlePaySubscription(sub); }} className={`flex-1 py-3 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 ${isOverdue || isToday ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}>
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

      {/* FLOATING KEYPAD DRAWER UTANG PIUTANG & LANGGANAN */}
      {isMobile && activeKeypad !== null && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-blue-500 tracking-widest uppercase">
                {activeKeypad === "add" ? "Kalkulator Nominal Baru" : activeKeypad === "edit" ? "Koreksi Nominal" : activeKeypad === "pay" ? "Kalkulator Pembayaran" : "Kalkulator Langganan"}
              </span>
              <button onClick={() => setActiveKeypad(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold flex items-center gap-1">Tutup <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-white font-black text-base">
              {["+", "-", "*", "/"].map((op) => (<button key={op} type="button" onClick={() => handleKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>))}
              {["7", "8", "9"].map((num) => (<button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 active:bg-red-100 dark:active:bg-red-900/30 rounded-xl transition-all select-none">C</button>
              {["4", "5", "6"].map((num) => (<button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all select-none">⌫</button>
              {["1", "2", "3"].map((num) => (<button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">.</button>
              {["(", "0", ")"].map((char) => (<button key={char} type="button" onClick={() => handleKeypadPress(char)} className={`${char === "0" ? "bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700" : "bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800"} py-3.5 rounded-xl transition-all select-none`}>{char}</button>))}
              <button type="button" onClick={() => handleKeypadPress("Ya")} className="py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl text-white font-black hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all select-none">Ya</button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}