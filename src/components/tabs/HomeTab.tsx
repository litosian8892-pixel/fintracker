"use client";

import React, { useEffect, useState } from "react";
import { AccountData, CategoryData, SplitItemData } from "../../types";
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, ChevronDown, X, Search, Plus } from "lucide-react";

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
  isPrivacyMode?: boolean; // Ditambahkan agar tidak error di page.tsx, namun tidak dipakai untuk nge-blur
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

export default function HomeTab({
  tType, setTType, tDate, setTDate, tCategory, setTCategory, tAccountId, setTAccountId, tToAccountId, setTToAccountId, tAmount, setTAmount, tAdminFee, setTAdminFee, tNote, setTNote, categories, accounts, handleTransaction, isPrivacyMode
}: HomeTabProps) {
  
  const [showCatModal, setShowCatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeKeypad, setActiveKeypad] = useState<"amount" | "adminFee" | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // States baru untuk mendukung pecahan transaksi yang fleksibel
  const [splits, setSplits] = useState<SplitItemData[]>([]);
  const [showSplitModal, setShowSplitModal] = useState(false);
  
  // Mengubah tempSplits menyimpan string expression agar bisa dikalkulasi per baris
  const [tempSplits, setTempSplits] = useState<{ category: string; amountStr: string; note: string }[]>([]);
  const [activeSplitIndex, setActiveSplitIndex] = useState<number | null>(null);
  const [showSplitCatModal, setShowSplitCatModal] = useState(false);

  // State untuk melacak input pecahan mana yang sedang diketik via kalkulator seluler
  const [activeSplitKeypadIndex, setActiveSplitKeypadIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); 
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Membersihkan pecahan jika input nominal dibersihkan oleh parent (setelah transaksi sukses)
  useEffect(() => {
    if (!tAmount || safeEvaluate(tAmount) === 0) {
      setSplits([]);
    }
  }, [tAmount]);

  const availableSourceAccounts = tType === "transfer" ? accounts : accounts.filter(acc => !acc.isSavings);

  const formatRupiahTerbaca = (val: string) => {
    if (!val) return "Rp 0";
    const parsed = safeEvaluate(val);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parsed);
  };

  const handleTypeChange = (newType: "income" | "expense" | "transfer") => {
    setTType(newType);
    setTAccountId("");
    setTToAccountId("");
    setSplits([]);
    if (newType !== "transfer") setTCategory("");
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

  const filteredCategories = categories
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const cleanA = a.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanB = b.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return cleanA.localeCompare(cleanB);
    });

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

  // LOGIKA BARU: KEYPAD KHUSUS NOMINAL PECAHAN
  const handleSplitKeypadPress = (key: string) => {
    triggerHaptic();
    if (activeSplitKeypadIndex === null) return;
    const currentVal = tempSplits[activeSplitKeypadIndex].amountStr || "";
    const updated = [...tempSplits];
    
    if (key === "⌫") {
      updated[activeSplitKeypadIndex].amountStr = currentVal.slice(0, -1);
    } else if (key === "C") {
      updated[activeSplitKeypadIndex].amountStr = "";
    } else if (key === "=") {
      const evaluated = safeEvaluate(currentVal);
      updated[activeSplitKeypadIndex].amountStr = evaluated > 0 ? evaluated.toString() : "";
    } else if (key === "Ya") {
      setActiveSplitKeypadIndex(null);
      return;
    } else {
      updated[activeSplitKeypadIndex].amountStr = currentVal + key;
    }
    setTempSplits(updated);
  };

  const handleAddSplitItem = () => {
    const targetAmount = safeEvaluate(tAmount);
    const currentSum = tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0);
    const remaining = Math.max(0, targetAmount - currentSum);
    // AUTO-FILL KATEGORI BERDASARKAN KATEGORI INDUK TRANSAKSI
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

  const handleConfirmSplits = () => {
    const targetAmount = safeEvaluate(tAmount);
    
    // Evaluasi seluruh nominal pecahan matematika terlebih dahulu
    const evaluatedSplits = tempSplits.map(s => ({
      category: s.category,
      amount: safeEvaluate(s.amountStr),
      note: s.note
    }));

    const currentSum = evaluatedSplits.reduce((sum, s) => sum + s.amount, 0);
    
    if (evaluatedSplits.some(s => !s.category)) {
      return alert("Seluruh pecahan wajib dipilih kategorinya!");
    }
    if (evaluatedSplits.some(s => s.amount <= 0)) {
      return alert("Nominal pecahan tidak boleh kosong atau bernilai 0!");
    }
    if (currentSum !== targetAmount) {
      return alert(`Total alokasi pecahan (Rp ${currentSum.toLocaleString('id-ID')}) harus sama persis dengan nominal transaksi utama (Rp ${targetAmount.toLocaleString('id-ID')})!`);
    }

    setSplits(evaluatedSplits);
    setTCategory("Split Transaksi");
    setShowSplitModal(false);
  };

  return (
    <div className="bg-white rounded-[30px] p-6 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 relative transition-colors duration-200">
      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6">Catat Transaksi</h2>

      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
        <button type="button" onClick={() => handleTypeChange("expense")} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${tType === "expense" ? "bg-red-500 text-white shadow-md animate-none" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}><ArrowDownRight size={14} /> Pengeluaran</button>
        <button type="button" onClick={() => handleTypeChange("income")} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${tType === "income" ? "bg-emerald-500 text-white shadow-md animate-none" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}><ArrowUpRight size={14} /> Pemasukan</button>
        <button type="button" onClick={() => handleTypeChange("transfer")} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${tType === "transfer" ? "bg-blue-500 text-white shadow-md animate-none" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}><ArrowRightLeft size={14} /> Transfer</button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NOMINAL (RP)</label>
          <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("amount"); setActiveSplitKeypadIndex(null); } }} className={`w-full max-w-full p-3.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100 transition-all ${activeKeypad === 'amount' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)] bg-slate-50 dark:bg-slate-800' : 'border-slate-800 dark:border-slate-700'}`} placeholder={isMobile ? "Ketuk untuk input nominal..." : "Rp 0 atau ketik ekspresi matematika..."} value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
          {tAmount && <p className="text-[10px] font-bold text-slate-400 pl-1 text-left animate-in fade-in duration-150">Terbaca: <span className="text-slate-600 dark:text-slate-300 font-black">{formatRupiahTerbaca(tAmount)}</span></p>}
        </div>

        {tType === "transfer" && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Biaya Admin (Opsional)</label>
            <input type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveKeypad("adminFee"); setActiveSplitKeypadIndex(null); } }} className={`w-full max-w-full p-3.5 bg-white dark:bg-slate-800 border rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100 transition-all ${activeKeypad === 'adminFee' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)] bg-slate-50 dark:bg-slate-800' : 'border-slate-800 dark:border-slate-700'}`} placeholder={isMobile ? "Ketuk untuk input biaya admin..." : "Rp 0 atau ketik ekspresi matematika..."} value={tAdminFee} onChange={(e) => setTAdminFee(e.target.value)} />
            {tAdminFee && <p className="text-[10px] font-bold text-blue-400 pl-1 text-left animate-in fade-in duration-150">Terbaca: <span className="text-blue-600 dark:text-blue-300 font-black">{formatRupiahTerbaca(tAdminFee)}</span></p>}
          </div>
        )}

        <div className={`grid grid-cols-1 ${tType !== "transfer" ? "md:grid-cols-2" : ""} gap-4`}>
          <div className="space-y-1 min-w-0"> 
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">📅 TANGGAL</label>
            <input type="date" onFocus={() => { setActiveKeypad(null); setActiveSplitKeypadIndex(null); }} className="w-full max-w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100 cursor-pointer appearance-none dark:bg-slate-800 dark:border-slate-700" value={tDate} onChange={(e) => setTDate(e.target.value)} />
          </div>

          {tType !== "transfer" && (
            <div className="space-y-1 min-w-0"> 
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">🏷️ KATEGORI</label>
              {splits.length > 0 ? (
                <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300 flex items-center justify-between transition-all">
                  <span className="truncate">✂️ {splits.length} Pecahan Terpilih</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => { 
                      setTempSplits(splits.map(s => ({ category: s.category, amountStr: s.amount.toString(), note: s.note || "" }))); 
                      setShowSplitModal(true); 
                    }} className="text-[10px] font-black underline hover:text-blue-800">Edit</button>
                    <button type="button" onClick={() => { setSplits([]); setTCategory(""); }} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full text-blue-500"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div onClick={() => { setShowCatModal(true); setSearchQuery(""); setActiveKeypad(null); setActiveSplitKeypadIndex(null); }} className="flex-1 p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 truncate">
                    <span className={`truncate ${!tCategory ? "text-slate-400 dark:text-slate-500 font-medium" : ""}`}>{tCategory || "Pilih Kategori..."}</span><ChevronDown size={14} className="text-slate-400 shrink-0" />
                  </div>
                  {safeEvaluate(tAmount) > 0 && (
                    <button type="button" onClick={() => {
                      const initialAmount = safeEvaluate(tAmount);
                      // AUTO-FILL KATEGORI SAAT KLIK TOMBOL PECAH PERTAMA KALI
                      setTempSplits([{ category: tCategory || "", amountStr: initialAmount.toString(), note: "" }]);
                      setShowSplitModal(true);
                      setActiveSplitKeypadIndex(null);
                      setActiveKeypad(null);
                    }} className="px-3 py-3.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black border border-blue-200 dark:border-blue-900/30 shrink-0 flex items-center gap-1 cursor-pointer transition-colors">
                      ✂️ Pecah
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`space-y-1 min-w-0 ${tType === "transfer" ? "" : "md:col-span-2"}`}> 
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">💳 DOMPET</label>
            <select className="w-full max-w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer" value={tAccountId} onFocus={() => { setActiveKeypad(null); setActiveSplitKeypadIndex(null); }} onChange={(e) => setTAccountId(e.target.value)}>
              <option value="" disabled>Pilih Dompet...</option>
              {availableSourceAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>
              ))}
            </select>
          </div>

          {tType === "transfer" && (
            <div className="space-y-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-200">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">💳 DOMPET TUJUAN</label>
              <select className="w-full max-w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-800 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer" value={tToAccountId} onFocus={() => { setActiveKeypad(null); setActiveSplitKeypadIndex(null); }} onChange={(e) => setTToAccountId(e.target.value)}>
                <option value="" disabled>Pilih Tujuan...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">📝 CATATAN</label>
          <input type="text" onFocus={() => { setActiveKeypad(null); setActiveSplitKeypadIndex(null); }} className="w-full max-w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100 dark:bg-slate-800 dark:border-slate-700" placeholder="Tulis keterangan transaksi..." value={tNote} onChange={(e) => setTNote(e.target.value)} />
        </div>

        <button type="button" onClick={() => {
          if (splits.length > 0) {
            handleTransaction(splits);
          } else {
            handleTransaction();
          }
        }} className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition-all transform active:scale-[0.98] duration-75 cursor-pointer">Simpan Transaksi</button>
      </div>

      {showCatModal && tType !== "transfer" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm"><span className={tType === 'expense' ? "text-red-500" : "text-green-500"}>🏷️</span> Pilih Kategori {tType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</h3>
              <button type="button" onClick={() => setShowCatModal(false)} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-colors"><X size={14}/></button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={16} /><input type="text" placeholder="Ketik untuk mencari kategori..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 transition-colors focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            </div>
            
            <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900">
              {tType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 mb-2 border-b border-orange-100 dark:border-orange-950/30 z-10"><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel (Sering)</p></div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${tCategory === cat.name ? "bg-orange-500 text-white border-orange-600 shadow-md animate-none" : "bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200 dark:hover:bg-orange-900/50"}`}>{cat.name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4 min-w-0">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 mb-2 border-b border-purple-100 dark:border-purple-950/30 z-10"><p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap (Bulanan)</p></div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${tCategory === cat.name ? "bg-purple-500 text-white border-purple-600 shadow-md animate-none" : "bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:bg-purple-900/50"}`}>{cat.name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredCategories.filter(c => c.type === "income").length === 0 && <p className="text-[10px] text-slate-400 italic col-span-2 text-center py-4">Tidak ditemukan</p>}
                  {filteredCategories.filter(c => c.type === "income").map(cat => (
                    <button key={cat.id} type="button" onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${tCategory === cat.name ? "bg-green-500 text-white border-green-600 shadow-md" : "bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-200 dark:hover:bg-green-900/50"}`}>{cat.name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETIL ALOKASI PECAHAN (SPLIT MODAL) */}
      {showSplitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>✂️</span> Pecah Transaksi ({formatRupiahTerbaca(tAmount)})
              </h3>
              <button type="button" onClick={() => { setShowSplitModal(false); setActiveSplitKeypadIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-colors">
                <X size={14}/>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 flex-1">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Nominal Transaksi:</span>
                  <span className="font-black text-slate-800 dark:text-white">{formatRupiahTerbaca(tAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold mt-2 pt-2 border-t border-blue-100/50 dark:border-blue-900/20">
                  <span>Total Dialokasikan:</span>
                  <span className={`font-black ${tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0) === safeEvaluate(tAmount) ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0))}
                  </span>
                </div>
                {safeEvaluate(tAmount) - tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0) !== 0 && (
                  <div className="text-[10px] font-black text-amber-500 mt-2 text-right animate-in fade-in">
                    Sisa yang belum dialokasikan: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(safeEvaluate(tAmount) - tempSplits.reduce((sum, s) => sum + safeEvaluate(s.amountStr), 0))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {tempSplits.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 relative text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400">PECAHAN #{i + 1}</span>
                      {tempSplits.length > 1 && (
                        <button type="button" onClick={() => {
                          triggerHaptic();
                          const updated = tempSplits.filter((_, idx) => idx !== i);
                          setTempSplits(updated);
                        }} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-0.5 cursor-pointer">
                          <X size={14} /> Hapus
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kategori</label>
                        <div onClick={() => {
                          triggerHaptic();
                          setActiveSplitIndex(i);
                          setShowSplitCatModal(true);
                          setSearchQuery("");
                          setActiveSplitKeypadIndex(null); 
                        }} className="p-3 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 truncate">
                          <span className="truncate">{item.category || "Pilih Kategori..."}</span>
                          <ChevronDown size={14} className="text-slate-400 shrink-0" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nominal (Rp)</label>
                        <input type="text" placeholder="Contoh: 15000" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveSplitKeypadIndex(i); setActiveKeypad(null); } }} className={`w-full p-3 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-blue-500 transition-all ${activeSplitKeypadIndex === i && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)] bg-slate-50 dark:bg-slate-900' : 'border-slate-200 dark:border-slate-700'}`} value={item.amountStr} onChange={(e) => {
                          const updated = [...tempSplits];
                          updated[i].amountStr = e.target.value;
                          setTempSplits(updated);
                        }} />
                        {item.amountStr && <p className="text-[9px] font-bold text-slate-400 pl-1">Terbaca: <span className="font-black text-slate-600 dark:text-slate-300">{formatRupiahTerbaca(item.amountStr)}</span></p>}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Catatan Khusus (Opsional)</label>
                      <input type="text" onFocus={() => { setActiveSplitKeypadIndex(null); }} placeholder="Contoh: Belanja bumbu masak" className="w-full p-3 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-blue-500" value={item.note || ""} onChange={(e) => {
                        const updated = [...tempSplits];
                        updated[i].note = e.target.value;
                        setTempSplits(updated);
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => { triggerHaptic(); handleAddSplitItem(); }} className="w-full py-3 border border-dashed border-blue-300 text-blue-600 dark:border-blue-800 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1 cursor-pointer">
                <Plus size={14} /> Tambah Pecahan Kategori
              </button>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex gap-3 shrink-0">
              <button type="button" onClick={() => { triggerHaptic(); handleConfirmSplits(); }} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer">
                Konfirmasi Pecahan
              </button>
              <button type="button" onClick={() => { setShowSplitModal(false); setActiveSplitKeypadIndex(null); }} className="py-3.5 px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP PILIH KATEGORI UNTUK ITEM SPLIT */}
      {showSplitCatModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[75vh] border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                <span>🏷️</span> Pilih Kategori Pecahan #{activeSplitIndex !== null ? activeSplitIndex + 1 : ""}
              </h3>
              <button type="button" onClick={() => { setShowSplitCatModal(false); setActiveSplitIndex(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-colors"><X size={14}/></button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                <input type="text" placeholder="Ketik untuk mencari kategori..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 transition-colors focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900">
              {tType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0 text-left">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 mb-2 border-b border-orange-100 dark:border-orange-950/30 z-10">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectSplitCategory(cat.name)} className="w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-200 dark:hover:bg-orange-900/50">{cat.name}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 pl-4 min-w-0 text-left">
                    <div className="sticky top-0 bg-white dark:bg-slate-900 pb-2 mb-2 border-b border-purple-100 dark:border-purple-950/30 z-10">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => handleSelectSplitCategory(cat.name)} className="w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:bg-purple-900/50">{cat.name}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredCategories.filter(c => c.type === "income").length === 0 && <p className="text-[10px] text-slate-400 italic col-span-2 text-center py-4">Tidak ditemukan</p>}
                  {filteredCategories.filter(c => c.type === "income").map(cat => (
                    <button key={cat.id} type="button" onClick={() => handleSelectSplitCategory(cat.name)} className="w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer bg-slate-50 text-slate-800 border-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-200 dark:hover:bg-green-900/50">{cat.name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING KEYPAD DRAWER UNTUK MAIN NOMINAL */}
      {isMobile && activeKeypad && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-blue-500 tracking-widest uppercase">{activeKeypad === "amount" ? "Kalkulator Nominal" : "Kalkulator Biaya Admin"}</span>
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

      {/* BARU: FLOATING KEYPAD DRAWER UNTUK NOMINAL PECAHAN (SPLIT KEYPAD) */}
      {isMobile && activeSplitKeypadIndex !== null && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveSplitKeypadIndex(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-blue-500 tracking-widest uppercase">Kalkulator Pecahan #{activeSplitKeypadIndex + 1}</span>
              <button onClick={() => setActiveSplitKeypadIndex(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold flex items-center gap-1">Tutup <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-white font-black text-base">
              {["+", "-", "*", "/"].map((op) => (<button key={op} type="button" onClick={() => handleSplitKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>))}
              {["7", "8", "9"].map((num) => (<button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 active:bg-red-100 dark:active:bg-red-900/30 rounded-xl transition-all select-none">C</button>
              {["4", "5", "6"].map((num) => (<button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all select-none">⌫</button>
              {["1", "2", "3"].map((num) => (<button key={num} type="button" onClick={() => handleSplitKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">.</button>
              {["(", "0", ")"].map((char) => (<button key={char} type="button" onClick={() => handleSplitKeypadPress(char)} className={`${char === "0" ? "bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700" : "bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800"} py-3.5 rounded-xl transition-all select-none`}>{char}</button>))}
              <button type="button" onClick={() => handleSplitKeypadPress("Ya")} className="py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl text-white font-black hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all select-none">Ya</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}