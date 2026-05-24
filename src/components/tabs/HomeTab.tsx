"use client";
import { Calendar, Tag } from "lucide-react";
import { AccountData, CategoryData } from "../../types";

interface HomeTabProps {
  tType: "income" | "expense" | "transfer";
  setTType: (val: "income" | "expense" | "transfer") => void;
  tDate: string;
  setTDate: (val: string) => void;
  tCategory: string;
  setTCategory: (val: string) => void;
  tAccountId: string;
  setTAccountId: (val: string) => void;
  tToAccountId: string;
  setTToAccountId: (val: string) => void;
  tAmount: string;
  setTAmount: (val: string) => void;
  tNote: string;
  setTNote: (val: string) => void;
  categories: CategoryData[];
  accounts: AccountData[];
  handleTransaction: () => void;
}

export default function HomeTab({
  tType, setTType, tDate, setTDate, tCategory, setTCategory,
  tAccountId, setTAccountId, tToAccountId, setTToAccountId,
  tAmount, setTAmount, tNote, setTNote, categories, accounts, handleTransaction
}: HomeTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
        
        {/* TOMBOL PEMILIH TIPE TRANSAKSI (YANG DIPERBAIKI UI-NYA) */}
        <div className="flex gap-2">
          <button 
            onClick={() => setTType("expense")} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all duration-200 ${tType === "expense" ? "bg-red-500 text-white shadow-md scale-105" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            PENGELUARAN
          </button>
          <button 
            onClick={() => setTType("income")} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all duration-200 ${tType === "income" ? "bg-green-500 text-white shadow-md scale-105" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            PEMASUKAN
          </button>
          <button 
            onClick={() => setTType("transfer")} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all duration-200 ${tType === "transfer" ? "bg-blue-600 text-white shadow-md scale-105" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            TRANSFER
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
              <Calendar className="absolute left-3 top-3.5 text-slate-400" size={16}/>
              <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none" value={tDate} onChange={(e) => setTDate(e.target.value)} />
          </div>
          {tType !== "transfer" ? (
            <div className="relative">
                <Tag className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                <select className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none appearance-none" value={tCategory} onChange={(e) => setTCategory(e.target.value)}>
                    <option value="">Pilih Kategori</option>
                    {categories.filter(c => c.type === tType).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
            </div>
          ) : (
            <div className="py-3 px-4 bg-blue-50 rounded-2xl text-xs font-bold text-blue-600 flex items-center justify-center">
              Mode Transfer
            </div>
          )}
        </div>
        
        <select value={tAccountId} onChange={(e) => setTAccountId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none outline-none">
          <option value="">Dompet Asal...</option>
          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>)}
        </select>
        
        {tType === "transfer" && (
          <select value={tToAccountId} onChange={(e) => setTToAccountId(e.target.value)} className="w-full p-4 bg-blue-50/50 rounded-2xl text-sm font-bold border-none outline-none">
            <option value="">Kirim Ke Dompet Tujuan...</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>)}
          </select>
        )}
        
        <input type="number" placeholder="Nominal Rp" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none outline-none" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
        <input type="text" placeholder={tType === "transfer" ? "Catatan Transfer" : "Catatan (Opsional)"} className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none outline-none" value={tNote} onChange={(e) => setTNote(e.target.value)} />
        
        <button onClick={handleTransaction} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-colors">
          Simpan Transaksi
        </button>
      </div>
    </div>
  );
}