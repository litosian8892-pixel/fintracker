"use client";
import { useState } from "react";
import { Download, ChevronDown, ArrowUp, ArrowDown, X, Printer } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CategoryData, TransactionData } from "../../types";

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
        <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">{payload[0].name || payload[0].payload.date}:</span>
        <span className="text-slate-900 dark:text-white text-xs font-black">Rp {Number(payload[0].value).toLocaleString('id-ID')}</span>
      </div>
    );
  }
  return null;
};

interface ReportsTabProps {
  reportMonth: string; setReportMonth: (val: string) => void; handleExportToExcel: () => void;
  totalIncome: number; totalExpense: number; pieData: { name: string; value: number }[];
  incomeCategoryList: { name: string; value: number }[]; barData: { date: string; amount: number }[];
  categories: CategoryData[]; reportTransactions: TransactionData[];
  globalSearch: string; setGlobalSearch: (val: string) => void; searchResult: TransactionData[];
  prevTotalIncome: number; prevTotalExpense: number; isPrivacyMode?: boolean; 
}

export default function ReportsTab({
  reportMonth, setReportMonth, handleExportToExcel, totalIncome, totalExpense, pieData, incomeCategoryList, barData, categories, reportTransactions, globalSearch, setGlobalSearch, searchResult, prevTotalIncome, prevTotalExpense, isPrivacyMode
}: ReportsTabProps) {
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({}); 
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<"expense" | "income">("expense");

  const [showAllVar, setShowAllVar] = useState(false);
  const [showAllPie, setShowAllPie] = useState(false);

  const unrollSplits = (txs: TransactionData[]): TransactionData[] => {
    return txs.flatMap(t => {
      if (t.splits && t.splits.length > 0) return t.splits.map((s, idx) => ({ ...t, id: `${t.id}-split-${idx}`, amount: s.amount, category: s.category, note: s.note ? `${t.note ? t.note + " (" + s.note + ")" : s.note}` : t.note }));
      return t;
    });
  };

  const toggleExpand = (catName: string) => { setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] })); };
  const toggleExpandDay = (dayKey: string) => { setExpandedDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] })); };
  const getCatType = (catName: string) => categories.find(c => c.name === catName)?.expenseType === "fixed" ? "fixed" : "variable";
  
  const adminFeeTxs = reportTransactions.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).map(t => ({ id: `fee-${t.id}`, amount: t.adminFee!, type: "expense", accountId: t.accountId, accountName: t.accountName, category: "Biaya Admin", note: `Biaya admin transfer ke ${t.toAccountName}`, tDate: t.tDate } as TransactionData));
  const rawExpenseTxs = [...reportTransactions.filter(t => t.type === 'expense'), ...adminFeeTxs];
  const expenseTxs = unrollSplits(rawExpenseTxs);
  const rawIncomeTxs = reportTransactions.filter(t => t.type === 'income');
  const incomeTxs = unrollSplits(rawIncomeTxs);

  const fixedTxs = expenseTxs.filter(t => getCatType(t.category) === "fixed");
  const varTxs = expenseTxs.filter(t => getCatType(t.category) === "variable");

  const totalFixed = fixedTxs.reduce((a, b) => a + b.amount, 0);
  const totalVar = varTxs.reduce((a, b) => a + b.amount, 0);

  const groupTransactionsAndItems = (txs: TransactionData[]) => {
    return txs.reduce((acc: Record<string, { total: number; items: TransactionData[] }>, curr) => {
      if (!acc[curr.category]) { acc[curr.category] = { total: 0, items: [] }; }
      acc[curr.category].total += curr.amount; acc[curr.category].items.push(curr);
      return acc;
    }, {});
  };

  const fixedGrouped = groupTransactionsAndItems(fixedTxs);
  const varGrouped = groupTransactionsAndItems(varTxs);
  const incomeGrouped = groupTransactionsAndItems(incomeTxs);

  const sortedFixedKeys = Object.keys(fixedGrouped).sort((a, b) => fixedGrouped[b].total - fixedGrouped[a].total);
  const sortedVarKeys = Object.keys(varGrouped).sort((a, b) => varGrouped[b].total - varGrouped[a].total);
  const sortedIncomeKeys = Object.keys(incomeGrouped).sort((a, b) => incomeGrouped[b].total - incomeGrouped[a].total);
  
  const displayedVarKeys = showAllVar ? sortedVarKeys : sortedVarKeys.slice(0, 5);
  const budgetCategories = categories.filter(c => c.type === 'expense' && c.budgetLimit && c.budgetLimit > 0);
  const sortedPieData = [...pieData].sort((a, b) => b.value - a.value);
  const displayedPieData = showAllPie ? sortedPieData : sortedPieData.slice(0, 5);

  const calcTrend = (current: number, prev: number) => {
    if (prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    return { value: Math.abs(diff).toFixed(0), isUp: diff > 0 };
  };

  const incomeTrend = calcTrend(totalIncome, prevTotalIncome);
  const expenseTrend = calcTrend(totalExpense, prevTotalExpense);

  const [yearStr, monthStr] = reportMonth.split('-');
  const yearNum = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay(); 

  const activeHeatmapTxs = heatmapMode === "expense" ? expenseTxs : incomeTxs;
  const dailyExpenseMap: Record<number, number> = {};
  activeHeatmapTxs.forEach(t => {
    if (t.tDate.startsWith(reportMonth)) {
      const day = parseInt(t.tDate.split('-')[2], 10);
      dailyExpenseMap[day] = (dailyExpenseMap[day] || 0) + t.amount;
    }
  });

  const maxDaily = Math.max(...Object.values(dailyExpenseMap), 1); 
  const getHeatmapColor = (amount: number) => {
    if (!amount || amount === 0) return "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800";
    const ratio = amount / maxDaily;
    if (heatmapMode === "expense") {
      if (ratio <= 0.15) return "bg-emerald-400 dark:bg-emerald-600/80 border-emerald-500 dark:border-emerald-700";
      if (ratio <= 0.45) return "bg-yellow-400 dark:bg-yellow-600/80 border-yellow-500 dark:border-yellow-700";
      if (ratio <= 0.75) return "bg-orange-500 dark:bg-orange-600/80 border-orange-600 dark:border-orange-700";
      return "bg-red-600 dark:bg-red-700/80 border-red-700 dark:border-red-800"; 
    } else {
      if (ratio <= 0.15) return "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/30";
      if (ratio <= 0.45) return "bg-emerald-300 dark:bg-emerald-800/50 border-emerald-400 dark:border-emerald-700";
      if (ratio <= 0.75) return "bg-emerald-500 dark:bg-emerald-700/80 border-emerald-600 dark:border-emerald-600";
      return "bg-emerald-700 dark:bg-emerald-600 border-emerald-800 dark:border-emerald-500";
    }
  };

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) { calendarCells.push(<div key={`empty-${i}`} className="w-full aspect-square rounded-md opacity-0 pointer-events-none"></div>); }
  for (let d = 1; d <= daysInMonth; d++) {
    const amount = dailyExpenseMap[d] || 0;
    const fullDateStr = `${reportMonth}-${String(d).padStart(2, '0')}`;
    calendarCells.push(
      <div key={`day-${d}`} onClick={() => setSelectedHeatmapDate(fullDateStr)} className={`w-full aspect-square rounded-xl border ${getHeatmapColor(amount)} flex items-center justify-center relative group cursor-pointer transition-all hover:scale-110 hover:z-10 shadow-sm`}>
        <span className={`text-[10px] md:text-xs font-black ${amount > 0 ? "text-white dark:text-white" : "opacity-60 text-slate-700 dark:text-slate-100"}`}>{d}</span>
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 font-black pointer-events-none before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-900 dark:before:border-t-white">
          Tgl {d}: Rp {amount.toLocaleString('id-ID')}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* KONTEN UI NORMAL (Sembunyi saat Print PDF) */}
      <div className="space-y-6 animate-in print:hidden">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 transition-colors duration-200">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-black text-xl italic text-slate-800 dark:text-slate-100">Laporan</h2>
            <input type="month" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 border-none outline-none cursor-pointer" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}/>
          </div>
          
          {/* TOMBOL EXPORT BARU */}
          <div className="flex flex-col md:flex-row gap-2">
            <button onClick={handleExportToExcel} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-emerald-600/20 active:scale-95"><Download size={14}/> Export Excel</button>
            <button onClick={() => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(15); setTimeout(() => { window.print(); }, 10); }} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-red-600/20 active:scale-95"><Printer size={14}/> Save as PDF / Cetak</button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">🔍 Pencarian Riwayat (Semua Waktu)</h3>
          <div className="relative">
            <Download className="absolute left-3 top-3.5 text-slate-400 rotate-90" size={16} />
            <input type="text" placeholder="Cari pengeluaran/bensin/servis motor..." className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-blue-500 transition-colors focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
          </div>
          {globalSearch && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-blue-100 dark:border-blue-900/30 pb-2">Hasil Pencarian ({searchResult.length})</p>
              {searchResult.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">Tidak ada transaksi yang cocok.</p> : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {unrollSplits(searchResult).map((t) => (
                    <div key={t.id} className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                      <div className="text-left"><p className="font-bold text-slate-700 dark:text-slate-200 leading-none mb-1.5">{t.note || t.category}</p><p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-none">{new Date(t.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})} • {t.accountName} • {t.category}</p></div>
                      <span className={`font-black ${t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>{t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''} {t.amount.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-950/20 p-5 rounded-3xl border border-green-100 dark:border-green-900/30 flex flex-col items-center text-center justify-between transition-colors duration-200">
              <div><p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-1">Pemasukan Total</p><p className="text-lg font-black text-green-700 dark:text-green-300">Rp {totalIncome.toLocaleString('id-ID')}</p></div>
              {incomeTrend && <div className={`text-[9px] font-bold flex items-center justify-center gap-1 mt-2 ${incomeTrend.isUp ? "text-green-600" : "text-red-500"}`}>{incomeTrend.isUp ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}<span>{incomeTrend.value}% dibanding bulan lalu</span></div>}
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-3xl border border-red-100 dark:border-red-900/30 flex flex-col items-center text-center justify-between transition-colors duration-200">
              <div><p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase mb-1">Pengeluaran Total</p><p className="text-lg font-black text-red-700 dark:text-red-300">Rp {totalExpense.toLocaleString('id-ID')}</p></div>
              {expenseTrend && <div className={`text-[9px] font-bold flex items-center justify-center gap-1 mt-2 ${expenseTrend.isUp ? "text-red-600" : "text-green-600"}`}>{expenseTrend.isUp ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}<span>{expenseTrend.value}% dibanding bulan lalu</span></div>}
          </div>
        </div>

        {totalExpense > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors duration-200"><span className="text-[9px] font-black bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md mb-2">FIXED EXPENSE</span><p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">Pengeluaran Wajib</p><p className="text-sm font-black text-slate-800 dark:text-slate-100">Rp {totalFixed.toLocaleString('id-ID')}</p></div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors duration-200"><span className="text-[9px] font-black bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md mb-2">VARIABLE EXPENSE</span><p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">Jajan & Lainnya</p><p className="text-sm font-black text-slate-800 dark:text-slate-100">Rp {totalVar.toLocaleString('id-ID')}</p></div>
          </div>
        )}

        {expenseTxs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{heatmapMode === "expense" ? "Kalender Pengeluaran" : "Kalender Pemasukan"}</h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-700">
                  <button type="button" onClick={() => { if(typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); setHeatmapMode("expense"); }} className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${heatmapMode === "expense" ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>PENGELUARAN</button>
                  <button type="button" onClick={() => { if(typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); setHeatmapMode("income"); }} className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${heatmapMode === "income" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>PEMASUKAN</button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <span>{heatmapMode === "expense" ? "Hemat" : "Sedikit"}</span>
                <div className="flex gap-1">
                  {heatmapMode === "expense" ? (
                    <><div className="w-3 h-3 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800"></div><div className="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-600/80 border border-emerald-500 dark:border-emerald-700"></div><div className="w-3 h-3 rounded bg-yellow-400 dark:bg-yellow-600/80 border border-yellow-500 dark:border-yellow-700"></div><div className="w-3 h-3 rounded bg-orange-500 dark:bg-orange-600/80 border border-orange-600 dark:border-orange-700"></div><div className="w-3 h-3 rounded bg-red-600 dark:bg-red-700/80 border border-red-700 dark:border-red-800"></div></>
                  ) : (
                    <><div className="w-3 h-3 rounded bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800"></div><div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30"></div><div className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-800/50 border border-emerald-400 dark:border-emerald-700"></div><div className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-700/80 border border-emerald-600 dark:border-emerald-600"></div><div className="w-3 h-3 rounded bg-emerald-700 dark:bg-emerald-600 border border-emerald-800 dark:border-emerald-500"></div></>
                  )}
                </div>
                <span>{heatmapMode === "expense" ? "Boros" : "Banyak"}</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (<div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase mb-1">{day}</div>))}
              {calendarCells}
            </div>
          </div>
        )}

        {selectedHeatmapDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedHeatmapDate(null)}>
            <div className="bg-white rounded-[30px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] border border-slate-100 dark:bg-slate-900 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">📅 {new Date(selectedHeatmapDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setSelectedHeatmapDate(null)} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full transition-colors"><X size={14}/></button>
              </div>
              <div className="p-5 overflow-y-auto bg-white dark:bg-slate-900 space-y-3">
                {(() => {
                  const dayTxs = activeHeatmapTxs.filter(t => t.tDate === selectedHeatmapDate);
                  if (dayTxs.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">Tidak ada {heatmapMode === "expense" ? "pengeluaran" : "pemasukan"} di hari ini.</p>;
                  dayTxs.sort((a, b) => {
                    const catCompare = a.category.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().localeCompare(b.category.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
                    if (catCompare !== 0) return catCompare;
                    return b.amount - a.amount;
                  });
                  const totalDay = dayTxs.reduce((a,b) => a + b.amount, 0);
                  return (
                    <>{dayTxs.map(t => (
                        <div key={t.id} className="flex justify-between items-center text-xs p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                          <div className="flex flex-col text-left overflow-hidden pr-2">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.category} • {t.accountName}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{t.note || t.category}</span>
                          </div>
                          <span className={`font-black shrink-0 ${heatmapMode === "expense" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{heatmapMode === "expense" ? "-" : "+"} Rp {t.amount.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-xs pt-4 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 font-black">
                        <span className="text-slate-800 dark:text-slate-200">TOTAL HARI INI</span><span className={heatmapMode === "expense" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>Rp {totalDay.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Status Anggaran (Budget)</h3>
          {budgetCategories.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">Belum ada budget yang diatur. Silakan ke menu Setting.</p> : (
            <div className="space-y-5">
              {budgetCategories.map(cat => {
                const spent = pieData.find(p => p.name === cat.name)?.value || 0;
                const limit = cat.budgetLimit!;
                const percentage = Math.min((spent / limit) * 100, 100);
                let color = "bg-emerald-400"; if(percentage >= 90) color = "bg-red-500"; else if(percentage >= 75) color = "bg-amber-400";
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex justify-between items-end"><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span><div className="text-right"><span className={`text-[10px] font-black ${percentage >= 100 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>Rp {spent.toLocaleString('id-ID')}</span><span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold"> / Rp {limit.toLocaleString('id-ID')}</span></div></div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700"><div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div></div>
                    {percentage >= 100 && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-right mt-0.5">Budget Habis!</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm px-1">Rincian Pengeluaran</h3>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
            <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Pengeluaran Tetap (Fixed)</p>
            {sortedFixedKeys.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic">Kosong</p> : (
              <div className="space-y-2">
                {sortedFixedKeys.map((key) => {
                  const data = fixedGrouped[key];
                  const isExpanded = !!expandedCategories[key];
                  return (
                    <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                      <div onClick={() => toggleExpand(key)} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1 rounded-lg transition-all"><span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">{key} <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({data.items.length}x)</span></span><span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">Rp {data.total.toLocaleString('id-ID')} <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} /></span></div>
                      {isExpanded && <div className="mt-2 pl-4 pr-2 py-2 bg-slate-50 dark:bg-slate-800/55 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">{data.items.map((item) => (<div key={item.id} className="flex justify-between items-center text-[10px] pb-1.5 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none"><div className="flex flex-col text-left"><span className="text-slate-400 dark:text-slate-500 font-semibold text-[9px]">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {item.accountName}</span><span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] md:max-w-xs">{item.note || "Tanpa catatan"}</span></div><span className="text-slate-700 dark:text-slate-200 font-black">Rp {item.amount.toLocaleString('id-ID')}</span></div>))}</div>}
                    </div>
                  );
                })}
                <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 font-black"><span className="text-slate-800 dark:text-slate-200">TOTAL FIXED</span><span className="text-purple-600 dark:text-purple-400">Rp {totalFixed.toLocaleString('id-ID')}</span></div>
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
            <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Pengeluaran Variabel (Jajan)</p>
            {sortedVarKeys.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic">Kosong</p> : (
              <div className="space-y-2">
                {displayedVarKeys.map((key) => {
                  const data = varGrouped[key];
                  const isExpanded = !!expandedCategories[key];
                  return (
                    <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                      <div onClick={() => toggleExpand(key)} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1 rounded-lg transition-all"><span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">{key} <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({data.items.length}x)</span></span><span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">Rp {data.total.toLocaleString('id-ID')} <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} /></span></div>
                      {isExpanded && <div className="mt-2 pl-4 pr-2 py-2 bg-slate-50 dark:bg-slate-800/55 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">{data.items.map((item) => (<div key={item.id} className="flex justify-between items-center text-[10px] pb-1.5 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none"><div className="flex flex-col text-left"><span className="text-slate-400 dark:text-slate-500 font-semibold text-[9px]">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {item.accountName}</span><span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] md:max-w-xs">{item.note || "Tanpa catatan"}</span></div><span className="text-slate-700 dark:text-slate-200 font-black">Rp {item.amount.toLocaleString('id-ID')}</span></div>))}</div>}
                    </div>
                  );
                })}
                {sortedVarKeys.length > 5 && (
                  <button onClick={() => setShowAllVar(!showAllVar)} className="w-full text-[10px] font-bold text-blue-500 dark:text-blue-400 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer border border-dashed border-slate-200 dark:border-slate-700">{showAllVar ? "Sembunyikan" : `Tampilkan ${sortedVarKeys.length - 5} Lainnya ↓`}</button>
                )}
                <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 font-black"><span className="text-slate-800 dark:text-slate-200">TOTAL VARIABEL</span><span className="text-orange-600 dark:text-orange-400">Rp {totalVar.toLocaleString('id-ID')}</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm px-1">Rincian Pemasukan</h3>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
            <p className="text-[10px] font-black text-green-500 dark:text-green-455 uppercase tracking-widest mb-1">Detail Pemasukan</p>
            {Object.keys(incomeGrouped).length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic">Kosong</p> : (
              <div className="space-y-2">
                {sortedIncomeKeys.map((key) => {
                  const data = incomeGrouped[key];
                  const isExpanded = !!expandedCategories[key];
                  return (
                    <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                      <div onClick={() => toggleExpand(key)} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1 rounded-lg transition-all"><span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">{key} <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({data.items.length}x)</span></span><span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">Rp {data.total.toLocaleString('id-ID')} <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} /></span></div>
                      {isExpanded && <div className="mt-2 pl-4 pr-2 py-2 bg-slate-50 dark:bg-slate-800/55 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">{data.items.map((item) => (<div key={item.id} className="flex justify-between items-center text-[10px] pb-1.5 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none"><div className="flex flex-col text-left"><span className="text-slate-400 dark:text-slate-500 font-semibold text-[9px]">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {item.accountName}</span><span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] md:max-w-xs">{item.note || "Tanpa catatan"}</span></div><span className="text-slate-700 dark:text-slate-200 font-black">Rp {item.amount.toLocaleString('id-ID')}</span></div>))}</div>}
                    </div>
                  );
                })}
                <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 font-black"><span className="text-slate-800 dark:text-slate-200">TOTAL PEMASUKAN</span><span className="text-green-600 dark:text-green-455">Rp {totalIncome.toLocaleString('id-ID')}</span></div>
              </div>
            )}
          </div>
        </div>

        {sortedPieData.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">Grafik Donat (Semua Pengeluaran)</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={sortedPieData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {sortedPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              {displayedPieData.map((data, idx) => {
                const percentage = totalExpense > 0 ? ((data.value / totalExpense) * 100).toFixed(1) : "0";
                const originalIndex = sortedPieData.findIndex(p => p.name === data.name);
                return (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold animate-in fade-in">
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[originalIndex % COLORS.length] }}></div><span className="text-slate-600 dark:text-slate-300">{data.name}</span><span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">({percentage}%)</span></div>
                    <span className="text-slate-800 dark:text-slate-100 font-black">Rp {data.value.toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
              {sortedPieData.length > 5 && (
                <button onClick={() => setShowAllPie(!showAllPie)} className="w-full text-center text-[10px] font-bold text-blue-500 dark:text-blue-400 pt-2 pb-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer">{showAllPie ? "↑ Sembunyikan" : `Tampilkan ${sortedPieData.length - 5} Lainnya ↓`}</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- TEMPLATE PDF TERSEMBUNYI (HANYA MUNCUL SAAT CETAK / SAVE PDF) --- */}
      <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:text-black print:p-6 print:z-[9999]">
         <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <img src="/android-chrome-192x192.png?v=4" alt="Logo" className="w-8 h-8 rounded-xl border border-slate-200 shadow-sm" />
                <div className="text-2xl font-black tracking-tighter italic">
                  <span className="text-slate-800">FIN</span>
                  <span className="text-blue-600">TRACKER</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 pl-1 leading-none">Laporan Mutasi Keuangan</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase">Periode</p>
              <p className="text-lg font-black">{new Date(reportMonth + '-01').toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}</p>
            </div>
         </div>

         <div className="flex gap-8 mb-8 border border-slate-200 p-4 rounded-xl">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Pemasukan</p>
              <p className="text-lg font-black text-green-600">Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex-1 border-l border-slate-200 pl-8">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Pengeluaran</p>
              <p className="text-lg font-black text-red-600">Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
         </div>

         <h3 className="font-bold text-sm mb-3 uppercase tracking-widest border-b border-slate-200 pb-2">Rincian Transaksi</h3>
         <table className="w-full text-left text-xs mb-8">
            <thead>
               <tr className="border-b border-slate-300 text-slate-600">
                 <th className="py-2">Tanggal</th>
                 <th className="py-2">Keterangan</th>
                 <th className="py-2">Kategori</th>
                 <th className="py-2">Dompet</th>
                 <th className="py-2 text-right">Nominal (Rp)</th>
               </tr>
            </thead>
            <tbody>
               {reportTransactions.map(t => (
                 <tr key={t.id} className="border-b border-slate-100">
                   <td className="py-2 font-medium">{new Date(t.tDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})}</td>
                   <td className="py-2 font-bold">{t.note || t.category}</td>
                   <td className="py-2">{t.category}</td>
                   <td className="py-2">{t.type === 'transfer' ? `${t.accountName} -> ${t.toAccountName}` : t.accountName}</td>
                   <td className={`py-2 text-right font-black ${t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                     {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''} {t.amount.toLocaleString('id-ID')}
                   </td>
                 </tr>
               ))}
           </tbody>
      </table>
      
      <p className="text-[10px] text-slate-400 text-center italic mt-10">Dicetak dari Aplikasi Fintracker pada {new Date().toLocaleString('id-ID')}</p>
    </div>

    {/* CSS Penolong Cetak iOS */}
    <style>{`
      @media print {
        html, body, main {
          overflow: visible !important;
          height: auto !important;
        }
      }
    `}</style>
  </>
);
}