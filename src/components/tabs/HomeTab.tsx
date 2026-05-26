"use client";
import { useState } from "react";
import { Calendar, Tag, ChevronDown, X, Search } from "lucide-react";
import { AccountData, CategoryData } from "../../types";

interface HomeTabProps {
  tType: "income" | "expense" | "transfer"; setTType: (val: "income" | "expense" | "transfer") => void;
  tDate: string; setTDate: (val: string) => void;
  tCategory: string; setTCategory: (val: string) => void;
  tAccountId: string; setTAccountId: (val: string) => void;
  tToAccountId: string; setTToAccountId: (val: string) => void;
  tAmount: string; setTAmount: (val: string) => void;
  tNote: string; setTNote: (val: string) => void;
  categories: CategoryData[]; accounts: AccountData[];
  handleTransaction: () => void;
}

export default function HomeTab({
  tType, setTType, tDate, setTDate, tCategory, setTCategory,
  tAccountId, setTAccountId, tToAccountId, setTToAccountId,
  tAmount, setTAmount, tNote, setTNote, categories, accounts, handleTransaction
}: HomeTabProps) {
  
  const [showCatModal, setShowCatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // <--- STATE BARU UNTUK SEARCH

  const handleTypeChange = (newType: "income" | "expense" | "transfer") => {
    setTType(newType);
    setTAccountId("");
    setTToAccountId("");
  };

  const availableSourceAccounts = tType === "transfer" ? accounts : accounts.filter(acc => !acc.isSavings);

  // LOGIKA PENCARIAN (FILTER)
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in relative">
      <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4 relative z-10">
        
        <div className="flex gap-2">
          <button onClick={() => handleTypeChange("expense")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-colors ${tType === "expense" ? "bg-red-500 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>PENGELUARAN</button>
          <button onClick={() => handleTypeChange("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-colors ${tType === "income" ? "bg-green-500 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>PEMASUKAN</button>
          <button onClick={() => handleTypeChange("transfer")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-colors ${tType === "transfer" ? "bg-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>TRANSFER</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="relative">
              <Calendar className="absolute left-3 top-3.5 text-slate-400" size={16}/>
              <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none cursor-pointer" value={tDate} onChange={(e) => setTDate(e.target.value)} />
          </div>
          
          {tType !== "transfer" ? (
            <div className="relative">
                <Tag className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                <div 
                  onClick={() => { setShowCatModal(true); setSearchQuery(""); }} // Reset pencarian saat modal dibuka
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl text-xs font-bold text-slate-700 cursor-pointer flex items-center justify-between border border-slate-100"
                >
                  <span className="truncate">{tCategory || "Pilih Kategori"}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
            </div>
          ) : (
            <div className="py-3 px-4 bg-blue-50 rounded-2xl text-xs font-bold text-blue-600 flex items-center justify-center">Mode Transfer Antar Dompet</div>
          )}
        </div>

        <select value={tAccountId} onChange={(e) => setTAccountId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none outline-none cursor-pointer text-slate-700">
          <option value="">Dompet Asal...</option>
          {availableSourceAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>)}
        </select>
        
        {tType === "transfer" && (
          <select value={tToAccountId} onChange={(e) => setTToAccountId(e.target.value)} className="w-full p-4 bg-blue-50/50 rounded-2xl text-sm font-bold border-none outline-none cursor-pointer text-blue-800">
            <option value="">Kirim Ke Dompet Tujuan...</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>)}
          </select>
        )}
        
        <input type="number" placeholder="Nominal Rp" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none outline-none" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
        <input type="text" placeholder={tType === "transfer" ? "Catatan Transfer" : "Catatan (Opsional)"} className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none outline-none" value={tNote} onChange={(e) => setTNote(e.target.value)} />
        
        <button onClick={handleTransaction} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-colors">Simpan Transaksi</button>
      </div>

      {/* --- MODAL POP-UP CUSTOM KATEGORI DENGAN SEARCH BAR --- */}
      {showCatModal && tType !== "transfer" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Tag size={16} className={tType === 'expense' ? "text-red-500" : "text-green-500"}/> 
                Pilih Kategori {tType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors"><X size={14}/></button>
            </div>

            {/* BAR PENCARIAN (SEARCH BAR) */}
            <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Ketik untuk mencari kategori..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-blue-500 transition-colors focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            
            {/* Isi Modal (Bisa di-scroll) */}
            <div className="p-5 overflow-y-auto bg-white">
              {tType === "expense" ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* KOLOM KIRI: VARIABEL (Sering Dipakai) */}
                  <div className="space-y-2">
                    <div className="sticky top-0 bg-white pb-2 mb-2 border-b border-orange-100 z-10">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">🟠 Variabel (Sering)</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed").map(cat => (
                        <button key={cat.id} onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${tCategory === cat.name ? "bg-orange-500 text-white border-orange-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-orange-50 hover:border-orange-200"}`}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* KOLOM KANAN: FIXED (Jarang Dipakai) */}
                  <div className="space-y-2 border-l border-slate-100 pl-4">
                    <div className="sticky top-0 bg-white pb-2 mb-2 border-b border-purple-100 z-10">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🟣 Tetap (Bulanan)</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").length === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ditemukan</p>}
                      {filteredCategories.filter(c => c.type === "expense" && c.expenseType === "fixed").map(cat => (
                        <button key={cat.id} onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${tCategory === cat.name ? "bg-purple-500 text-white border-purple-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-purple-50 hover:border-purple-200"}`}>
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
                    <button key={cat.id} onClick={() => { setTCategory(cat.name); setShowCatModal(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${tCategory === cat.name ? "bg-green-500 text-white border-green-600 shadow-md" : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-green-50 hover:border-green-200"}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}