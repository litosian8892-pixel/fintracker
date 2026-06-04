"use client";
import { History, Trash2, ArrowRightLeft, Edit2 } from "lucide-react";
import { TransactionData } from "../../types";

interface HistoryListProps {
  transactions: TransactionData[];
  onDelete: (t: TransactionData) => void;
  onEdit: (t: TransactionData) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isPrivacyMode?: boolean; // Ditambahkan agar tidak error di page.tsx, namun tidak dipakai untuk nge-blur
}

export default function HistoryList({ transactions, onDelete, onEdit, onLoadMore, hasMore, isPrivacyMode }: HistoryListProps) {
  return (
    <div className="space-y-4 md:col-span-1">
      <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 italic text-lg px-1">
        <History size={20} className="text-blue-600 dark:text-blue-500"/> Riwayat Terakhir
      </h3>
      <div className="space-y-3 pb-24 md:pb-4">
        {transactions.length === 0 ? (
          <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            Belum ada transaksi
          </p>
        ) : (
          <>
            {transactions.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-[25px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
                
                {/* BAGIAN UTAMA TRANSAKSI */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 mt-0.5 ${t.type === "income" ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-450" : t.type === "expense" ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-450" : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-450"}`}>
                      {t.type === "income" ? "↓" : t.type === "expense" ? "↑" : <ArrowRightLeft size={18}/>}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight mb-1 truncate">{t.note || t.category}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
                        {t.tDate ? new Date(t.tDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'} 
                        {t.type === "transfer" ? ` • ${t.accountName} ➔ ${t.toAccountName}` : ` • ${t.category} • ${t.accountName}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <p className={`font-black text-sm ${t.type === "income" ? "text-green-600 dark:text-green-400" : t.type === "expense" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-450"}`}>
                      {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} {Number(t.amount).toLocaleString('id-ID')}
                    </p>
                    {/* TOMBOL EDIT */}
                    <button onClick={() => onEdit(t)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-all cursor-pointer">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(t)} className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-450 transition-all cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* BAGIAN RINCIAN PECAHAN (JIKA TRANSAKSI MERUPAKAN SPLIT TRANSACTION) */}
                {t.splits && t.splits.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-left pl-14 animate-in fade-in duration-200">
                    <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest leading-none flex items-center gap-1">
                      <span>✂️</span> Detail Alokasi Pecahan:
                    </p>
                    <div className="space-y-1.5">
                      {t.splits.map((s, idx) => (
                        <div key={idx} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="font-extrabold text-slate-800 dark:text-slate-300">{s.category}:</span>
                          <span className="text-slate-700 dark:text-slate-500 font-extrabold">Rp {s.amount.toLocaleString('id-ID')}</span>
                          {s.note && (
                            <span className="text-[9px] font-medium italic text-slate-400 dark:text-slate-500 leading-none">
                              ({s.note})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
            
            {hasMore && (
              <button 
                onClick={onLoadMore} 
                className="w-full py-4 mt-2 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-450 font-bold rounded-[20px] text-xs transition-colors border border-blue-100 dark:border-blue-900/50 border-dashed cursor-pointer"
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