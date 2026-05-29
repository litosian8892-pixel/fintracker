"use client";

import React, { useEffect, useState } from "react";
import { AccountData, CategoryData } from "../../types";
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, ChevronDown, X, Search } from "lucide-react";

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
  handleTransaction: () => void;
}

// --- PARSER MATEMATIKA AMAN (ANTI-EVAL & TAHAN EROR SINTAKS) ---
const safeEvaluate = (expr: string): number => {
  if (!expr) return 0;
  // Bersihkan input, hanya izinkan angka, operator dasar, kurung, dan titik desimal
  let sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return 0;

  // Bersihkan operator menggantung di akhir (misalnya: "15000+" menjadi "15000")
  sanitized = sanitized.replace(/[+\-*/(.]*$/, "");
  if (!sanitized) return 0;

  try {
    // Evaluasi terisolasi menggunakan Function constructor di dalam strict mode
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
  tType,
  setTType,
  tDate,
  setTDate,
  tCategory,
  setTCategory,
  tAccountId,
  setTAccountId,
  tToAccountId,
  setTToAccountId,
  tAmount,
  setTAmount,
  tAdminFee,
  setTAdminFee,
  tNote,
  setTNote,
  categories,
  accounts,
  handleTransaction,
}: HomeTabProps) {
  
  const [showCatModal, setShowCatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // STATE KEYPAD KUSTOM (PENCATAT AKTIF)
  const [activeKeypad, setActiveKeypad] = useState<"amount" | "adminFee" | null>(null);

  // DETEKSI PERANGKAT RESPONSIF (MOBILE vs DESKTOP)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); 
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredAccounts = tType === "expense"
    ? accounts.filter((acc) => !acc.isSavings)
    : accounts;

  const availableSourceAccounts = tType === "transfer" ? accounts : accounts.filter(acc => !acc.isSavings);

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

  useEffect(() => {
    if (availableSourceAccounts.length > 0 && !tAccountId) {
      setTAccountId(availableSourceAccounts[0].id);
    }
  }, [availableSourceAccounts, tAccountId, setTAccountId]);

  const handleTypeChange = (newType: "income" | "expense" | "transfer") => {
    setTType(newType);
    setTAccountId("");
    setTToAccountId("");
  };

  useEffect(() => {
    if (tType === "transfer") {
      setTCategory("Transfer");
    } else {
      const matchingCats = categories.filter((cat) => cat.type === tType);
      if (matchingCats.length > 0 && !matchingCats.some(c => c.name === tCategory)) {
        setTCategory(matchingCats[0].name);
      }
    }
  }, [tType, categories, tCategory, setTCategory]);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- LOGIKA FEEDBACK GETARAN RINGAN PADA HP ---
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleKeypadPress = (key: string) => {
    triggerHaptic();
    const currentVal = activeKeypad === "amount" ? tAmount : tAdminFee;
    const setVal = activeKeypad === "amount" ? setTAmount : setTAdminFee;

    if (key === "⌫") {
      setVal(currentVal.slice(0, -1));
    } else if (key === "C") {
      setVal("");
    } else if (key === "=") {
      const evaluated = safeEvaluate(currentVal);
      setVal(evaluated > 0 ? evaluated.toString() : "");
    } else if (key === "Ya") {
      setActiveKeypad(null);
    } else {
      setVal(currentVal + key);
    }
  };

  return (
    <div className="bg-white rounded-[30px] p-6 shadow-xl border border-slate-100 relative">
      <h2 className="text-xl font-black text-slate-800 mb-6">Catat Transaksi</h2>

      {/* Navigasi Tipe Transaksi */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
            tType === "expense"
              ? "bg-red-500 text-white shadow-md"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <ArrowDownRight size={14} />
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
            tType === "income"
              ? "bg-emerald-500 text-white shadow-md"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <ArrowUpRight size={14} />
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("transfer")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
            tType === "transfer"
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <ArrowRightLeft size={14} />
          Transfer
        </button>
      </div>

      <div className="space-y-4">
        {/* Input Nominal Utama */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            NOMINAL (RP)
          </label>
          {/* inputMode="none" Mencegah keyboard bawaan HP keluar HANYA saat dibuka di perangkat mobile */}
          <input
            type="text"
            inputMode={isMobile ? "none" : undefined} 
            onFocus={() => { if(isMobile) setActiveKeypad("amount"); }}
            className={`w-full max-w-full p-3.5 bg-white border rounded-xl text-xs font-bold outline-blue-500 text-slate-800 transition-all ${activeKeypad === 'amount' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]' : 'border-slate-800'}`}
            placeholder={isMobile ? "Ketuk untuk input nominal..." : "Rp 0 atau ketik ekspresi matematika..."}
            value={tAmount}
            onChange={(e) => setTAmount(e.target.value)}
          />
          {tAmount && (
            <p className="text-[10px] font-bold text-slate-400 pl-1 animate-in fade-in duration-150">
              Terbaca: <span className="text-slate-600 font-black">{formatRupiahTerbaca(tAmount)}</span>
            </p>
          )}
        </div>

        {/* Biaya Admin Tambahan (Transfer) */}
        {tType === "transfer" && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Biaya Admin (Opsional)
            </label>
            {/* inputMode="none" Mencegah keyboard bawaan HP keluar HANYA saat dibuka di perangkat mobile */}
            <input
              type="text"
              inputMode={isMobile ? "none" : undefined}
              onFocus={() => { if(isMobile) setActiveKeypad("adminFee"); }}
              className={`w-full max-w-full p-3.5 bg-white border rounded-xl text-xs font-bold outline-blue-500 text-slate-800 transition-all ${activeKeypad === 'adminFee' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]' : 'border-slate-800'}`}
              placeholder={isMobile ? "Ketuk untuk input biaya admin..." : "Rp 0 atau ketik ekspresi matematika..."}
              value={tAdminFee}
              onChange={(e) => setTAdminFee(e.target.value)}
            />
            {tAdminFee && (
              <p className="text-[10px] font-bold text-blue-400 pl-1 animate-in fade-in duration-150">
                Terbaca: <span className="text-blue-600 font-black">{formatRupiahTerbaca(tAdminFee)}</span>
              </p>
            )}
          </div>
        )}

        {/* Tanggal & Pilihan Kategori Kustom Pop-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 min-w-0"> 
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              📅 TANGGAL
            </label>
            <input
              type="date"
              onFocus={() => setActiveKeypad(null)}
              className="w-full max-w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 cursor-pointer appearance-none"
              value={tDate}
              onChange={(e) => setTDate(e.target.value)}
            />
          </div>

          {tType !== "transfer" ? (
            <div className="space-y-1 min-w-0"> 
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                🏷️ KATEGORI
              </label>
              <div 
                onClick={() => { setShowCatModal(true); setSearchQuery(""); setActiveKeypad(null); }}
                className="w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold text-slate-800 cursor-pointer flex items-center justify-between transition-colors hover:bg-slate-50"
              >
                <span className="truncate">{tCategory || "Pilih Kategori"}</span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </div>
            </div>
          ) : (
            <div className="space-y-1 min-w-0"> 
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                🏷️ KATEGORI
              </label>
              <div className="w-full p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-blue-600 flex items-center justify-center">
                Mode Transfer Antar Dompet
              </div>
            </div>
          )}
        </div>

        {/* Akun Sumber / Tujuan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`space-y-1 min-w-0 ${tType === "transfer" ? "" : "md:col-span-2"}`}> 
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              💳 DOMPET
            </label>
            <select
              className="w-full max-w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 cursor-pointer"
              value={tAccountId}
              onFocus={() => setActiveKeypad(null)}
              onChange={(e) => setTAccountId(e.target.value)}
            >
              {availableSourceAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Rp {acc.balance.toLocaleString("id-ID")})
                </option>
              ))}
            </select>
          </div>

          {tType === "transfer" && (
            <div className="space-y-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-200">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                💳 DOMPET TUJUAN
              </label>
              <select
                className="w-full max-w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 cursor-pointer"
                value={tToAccountId}
                onFocus={() => setActiveKeypad(null)}
                onChange={(e) => setTToAccountId(e.target.value)}
              >
                <option value="">Pilih Tujuan...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Rp {acc.balance.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Catatan Transaksi */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            📝 CATATAN
          </label>
          <input
            type="text"
            onFocus={() => setActiveKeypad(null)}
            className="w-full max-w-full p-3.5 bg-white border border-slate-800 rounded-xl text-xs font-bold outline-blue-500 text-slate-800"
            placeholder="Tulis keterangan transaksi..."
            value={tNote}
            onChange={(e) => setTNote(e.target.value)}
          />
        </div>

        {/* Tombol Eksekusi */}
        <button
          type="button"
          onClick={handleTransaction}
          className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition-all transform active:scale-[0.98] duration-75"
        >
          Simpan Transaksi
        </button>
      </div>

      {/* --- POP-UP MODAL CUSTOM KATEGORI 2-KOLOM --- */}
      {showCatModal && tType !== "transfer" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-slate-100">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                <span className={tType === 'expense' ? "text-red-500" : "text-green-500"}>🏷️</span> 
                Pilih Kategori {tType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </h3>
              <button type="button" onClick={() => setShowCatModal(false)} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors"><X size={14}/></button>
            </div>

            {/* BAR PENCARIAN */}
            <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Ketik untuk mencari kategori..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-blue-500 transition-colors focus:bg-white text-slate-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Isi List Kategori */}
            <div className="p-5 overflow-y-auto bg-white">
              {tType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* KOLOM KIRI: VARIABEL (Sering) */}
                  <div className="space-y-2 min-w-0">
                    <div className="sticky top-0 bg-white pb-2 mb-2 border-b border-orange-100 z-10">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel (Sering)</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${tCategory === cat.name ? "bg-orange-500 text-white border-orange-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-orange-50 hover:border-orange-200"}`}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* KOLOM KANAN: FIXED (Bulanan) */}
                  <div className="space-y-2 border-l border-slate-100 pl-4 min-w-0">
                    <div className="sticky top-0 bg-white pb-2 mb-2 border-b border-purple-100 z-10">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap (Bulanan)</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").map(cat => (
                        <button key={cat.id} type="button" onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${tCategory === cat.name ? "bg-purple-500 text-white border-purple-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-purple-50 hover:border-purple-200"}`}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // TAMPILAN PEMASUKAN
                <div className="grid grid-cols-2 gap-3">
                  {filteredCategories.filter(c => c.type === "income").length === 0 && <p className="text-[10px] text-slate-400 italic col-span-2 text-center py-4">Tidak ditemukan</p>}
                  {filteredCategories.filter(c => c.type === "income").map(cat => (
                    <button key={cat.id} type="button" onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${tCategory === cat.name ? "bg-green-500 text-white border-green-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-green-50 hover:border-green-200"}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* --- DRAW KEYPAD KALKULATOR KUSTOM (HANYA AKTIF DI SELULER) --- */}
      {isMobile && activeKeypad && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-slate-950 border-t border-slate-800 p-4 pb-6 transition-transform duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">
                {activeKeypad === "amount" ? "Kalkulator Nominal" : "Kalkulator Biaya Admin"}
              </span>
              <button onClick={() => setActiveKeypad(null)} className="text-slate-400 hover:text-white p-1 text-xs font-bold flex items-center gap-1">
                Tutup <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-white font-black text-base">
              {["+", "-", "*", "/"].map((op) => (
                <button key={op} type="button" onClick={() => handleKeypadPress(op)} className="py-3.5 bg-slate-900 active:bg-slate-800 rounded-xl hover:bg-slate-800/80 transition-all select-none">
                  {op === "*" ? "×" : op === "/" ? "÷" : op}
                </button>
              ))}
              {["7", "8", "9"].map((num) => (
                <button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-800 active:bg-slate-700 rounded-xl hover:bg-slate-700/80 transition-all select-none">
                  {num}
                </button>
              ))}
              <button type="button" onClick={() => handleKeypadPress("C")} className="py-3.5 bg-red-950/40 text-red-400 border border-red-900/30 active:bg-red-900/30 rounded-xl transition-all select-none">
                C
              </button>
              {["4", "5", "6"].map((num) => (
                <button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-800 active:bg-slate-700 rounded-xl hover:bg-slate-700/80 transition-all select-none">
                  {num}
                </button>
              ))}
              <button type="button" onClick={() => handleKeypadPress("⌫")} className="py-3.5 bg-slate-900 active:bg-slate-800 rounded-xl text-slate-300 flex items-center justify-center transition-all select-none">
                ⌫
              </button>
              {["1", "2", "3"].map((num) => (
                <button key={num} type="button" onClick={() => handleKeypadPress(num)} className="py-3.5 bg-slate-800 active:bg-slate-700 rounded-xl hover:bg-slate-700/80 transition-all select-none">
                  {num}
                </button>
              ))}
              <button type="button" onClick={() => handleKeypadPress(".")} className="py-3.5 bg-slate-900 active:bg-slate-800 rounded-xl transition-all select-none">
                .
              </button>
              {["(", "0", ")"].map((char) => (
                <button key={char} type="button" onClick={() => handleKeypadPress(char)} className={`${char === "0" ? "bg-slate-800 active:bg-slate-700" : "bg-slate-900 active:bg-slate-800"} py-3.5 rounded-xl transition-all select-none`}>
                  {char}
                </button>
              ))}
              <button type="button" onClick={() => handleKeypadPress("Ya")} className="py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl text-white font-black hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all select-none">
                Ya
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}