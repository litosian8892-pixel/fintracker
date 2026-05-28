"use client";
import { History, Trash2, ArrowRightLeft, Edit2 } from "lucide-react";
import { TransactionData } from "../../types";

interface HistoryListProps {
  transactions: TransactionData[];
  onDelete: (t: TransactionData) => void;
  onEdit: (t: TransactionData) => void; // <--- PROPS BARU
  onLoadMore: () => void;
  hasMore: boolean;
}

export default function HistoryList({ transactions, onDelete, onEdit, onLoadMore, hasMore }: HistoryListProps) {
  return (
    <div className="space-y-4 md:col-span-1">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 italic text-lg px-1">
        <History size={20} className="text-blue-600"/> Riwayat Terakhir
      </h3>
      <div className="space-y-3 pb-24 md:pb-4">
        {transactions.length === 0 ? (
          <p className="text-center py-10 text-slate-400 text-sm italic bg-white rounded-3xl border border-slate-100">
            Belum ada transaksi
          </p>
        ) : (
          <>
            {transactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-[25px] flex justify-between items-center border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${t.type === "income" ? "bg-green-50 text-green-600" : t.type === "expense" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                    {t.type === "income" ? "↓" : t.type === "expense" ? "↑" : <ArrowRightLeft size={18}/>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 leading-none mb-1 text-left">{t.note || t.category}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-left">
                        {t.tDate ? new Date(t.tDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'} 
                        {t.type === "transfer" ? ` • ${t.accountName} ➔ ${t.toAccountName}` : ` • ${t.category} • ${t.accountName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className={`font-black text-sm ${t.type === "income" ? "text-green-600" : t.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
                    {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} {Number(t.amount).toLocaleString('id-ID')}
                  </p>
                  {/* TOMBOL EDIT BARU */}
                  <button onClick={() => onEdit(t)} className="p-2 text-slate-200 hover:text-blue-500 transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(t)} className="p-2 text-slate-200 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <button 
                onClick={onLoadMore} 
                className="w-full py-4 mt-2 bg-blue-50/50 hover:bg-blue-100 text-blue-600 font-bold rounded-[20px] text-xs transition-colors border border-blue-100 border-dashed"
              >
                Tampilkan Lebih Banyak ↓
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}