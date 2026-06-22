"use client";
import { useState, useRef, TouchEvent } from "react";
import { History, Trash2, ArrowRightLeft, Edit2, Loader2 } from "lucide-react";
import { TransactionData } from "../../types";

interface HistoryListProps {
  transactions: TransactionData[];
  onDelete: (t: TransactionData) => void;
  onEdit: (t: TransactionData) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isPrivacyMode?: boolean;
}

// SUB-KOMPONEN: Item Transaksi dengan Swipe-to-Action ala iOS
const SwipeableItem = ({ 
  t, 
  onEdit, 
  onDelete, 
  isPrivacyMode, 
  isOpen, 
  onOpen, 
  onClose,
  isProcessing 
}: { 
  t: TransactionData, 
  onEdit: () => void, 
  onDelete: () => void, 
  isPrivacyMode?: boolean,
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
  isProcessing: boolean
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  // Lebar area tombol di balik layar (Edit & Hapus)
  const MAX_SWIPE = -110; 

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;

    // Jika sedang terbuka dan user geser ke kanan, atau sebaliknya
    let newOffset = isOpen ? MAX_SWIPE + diff : diff;

    // Batasi geseran agar tidak kebablasan
    if (newOffset > 0) newOffset = 0; // Tahan ke kanan
    if (newOffset < MAX_SWIPE - 20) newOffset = MAX_SWIPE - 20; // Efek karet sedikit di kiri

    setDragOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchCurrentX.current === null) {
      touchStartX.current = null;
      touchCurrentX.current = null;
      return;
    }

    const diff = touchCurrentX.current - touchStartX.current;
    
    // Threshold snapping (Lebih dari 40px akan membuka)
    if (!isOpen && diff < -40) {
      onOpen();
    } else if (isOpen && diff > 20) {
      onClose();
    }
    
    setDragOffset(0);
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  return (
    <div className="relative rounded-[25px] overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm">
      
      {/* BACKGROUND ACTIONS (TOMBOL TERSEMBUNYI DI BALIK KARTU) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end px-3 gap-2 w-1/2">
        <button 
          onClick={() => { onClose(); onEdit(); }}
          disabled={isProcessing}
          className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center transition-all active:scale-90"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => { onClose(); onDelete(); }}
          disabled={isProcessing}
          className="w-10 h-10 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center transition-all active:scale-90"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>

      {/* FRONT CARD (YANG DIGESER) */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${isOpen ? MAX_SWIPE : dragOffset}px)` }}
        className={`relative z-10 bg-white dark:bg-slate-900 p-4 rounded-[25px] border border-slate-100 dark:border-slate-800/80 transition-transform ${touchStartX.current === null ? 'duration-300 ease-out' : 'duration-0'}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 mt-0.5 ${t.type === "income" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" : t.type === "expense" ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400" : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"}`}>
              {t.type === "income" ? "↓" : t.type === "expense" ? "↑" : <ArrowRightLeft size={18}/>}
            </div>
            <div className="min-w-0 text-left">
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight mb-1 truncate">{t.note || t.category}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
                {t.tDate ? new Date(`${t.tDate}T12:00:00`).toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : '-'} 
                {t.type === "transfer" ? ` • ${t.accountName} ➔ ${t.toAccountName}` : ` • ${t.category} • ${t.accountName}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <p className={`font-black text-sm ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : t.type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-blue-600 dark:text-blue-400"}`}>
              {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} {isPrivacyMode ? "•••••••" : Number(t.amount).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

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
                  <span className="text-slate-700 dark:text-slate-500 font-extrabold">Rp {isPrivacyMode ? "•••••••" : s.amount.toLocaleString('id-ID')}</span>
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
    </div>
  );
};


export default function HistoryList({ transactions, onDelete, onEdit, onLoadMore, hasMore, isPrivacyMode }: HistoryListProps) {
  // STATE PELINDUNG: Mencegah tombol diklik ganda secara brutal (Spam Click)
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // STATE SWIPE: Hanya boleh satu item yang terbuka digeser dalam satu waktu
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const handleSafeDelete = async (t: TransactionData) => {
    if (processingId) return;
    setProcessingId(t.id);
    try { await onDelete(t); } 
    finally { setProcessingId(null); }
  };

  const handleSafeEdit = (t: TransactionData) => {
    if (processingId) return;
    onEdit(t);
  };

  return (
    <div className="space-y-4 md:col-span-1 print:hidden">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 italic text-lg">
          <History size={20} className="text-blue-600 dark:text-blue-500"/> Riwayat Terakhir
        </h3>
        <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-full md:hidden">👈 Geser Kiri</span>
      </div>

      <div className="space-y-3 pb-24 md:pb-4">
        {transactions.length === 0 ? (
          <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            Belum ada transaksi
          </p>
        ) : (
          <>
            {transactions.map((t) => (
              <SwipeableItem 
                key={t.id}
                t={t}
                isPrivacyMode={isPrivacyMode}
                isOpen={openItemId === t.id}
                onOpen={() => setOpenItemId(t.id)}
                onClose={() => setOpenItemId(null)}
                onEdit={() => handleSafeEdit(t)}
                onDelete={() => handleSafeDelete(t)}
                isProcessing={processingId === t.id}
              />
            ))}
            
            {hasMore && (
              <button 
                onClick={onLoadMore} 
                className="w-full py-4 mt-2 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-[20px] text-xs transition-colors border border-blue-100 dark:border-blue-900/50 border-dashed cursor-pointer active:scale-95"
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