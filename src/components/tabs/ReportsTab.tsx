"use client";
import { useState } from "react";
import { Download, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { CategoryData, TransactionData } from "../../types";

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-850 p-2 rounded-lg shadow-md border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100">
        <span className="text-slate-500 dark:text-slate-400">{payload[0].name || payload[0].payload.date}: </span>
        <span>Rp {Number(payload[0].value).toLocaleString('id-ID')}</span>
      </div>
    );
  }
  return null;
};

interface ReportsTabProps {
  reportMonth: string; setReportMonth: (val: string) => void; handleExportToExcel: () => void;
  totalIncome: number; totalExpense: number;
  pieData: { name: string; value: number }[];
  incomeCategoryList: { name: string; value: number }[];
  barData: { date: string; amount: number }[];
  categories: CategoryData[];
  reportTransactions: TransactionData[];
  globalSearch: string; setGlobalSearch: (val: string) => void;
  searchResult: TransactionData[];
  prevTotalIncome: number; 
  prevTotalExpense: number; 
}

export default function ReportsTab({
  reportMonth, setReportMonth, handleExportToExcel, totalIncome, totalExpense, pieData, incomeCategoryList, barData, categories, reportTransactions,
  globalSearch, setGlobalSearch, searchResult, prevTotalIncome, prevTotalExpense
}: ReportsTabProps) {
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({}); 

  const toggleExpand = (catName: string) => {
    setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const toggleExpandDay = (dayKey: string) => {
    setExpandedDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const getCatType = (catName: string) => categories.find(c => c.name === catName)?.expenseType === "fixed" ? "fixed" : "variable";
  
  // Ekstrak Biaya Admin dari Transfer dan jadikan Pengeluaran Rincian secara otomatis
  const adminFeeTxs = reportTransactions
    .filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0)
    .map(t => ({
      id: `fee-${t.id}`,
      amount: t.adminFee!,
      type: "expense",
      accountId: t.accountId,
      accountName: t.accountName,
      category: "Biaya Admin",
      note: `Biaya admin transfer ke ${t.toAccountName}`,
      tDate: t.tDate
    } as TransactionData));

  // Gabungkan pengeluaran murni dan biaya admin virtual
  const expenseTxs = [...reportTransactions.filter(t => t.type === 'expense'), ...adminFeeTxs];
  const fixedTxs = expenseTxs.filter(t => getCatType(t.category) === "fixed");
  const varTxs = expenseTxs.filter(t => getCatType(t.category) === "variable");
  const incomeTxs = reportTransactions.filter(t => t.type === 'income');

  const totalFixed = fixedTxs.reduce((a, b) => a + b.amount, 0);
  const totalVar = varTxs.reduce((a, b) => a + b.amount, 0);

  // Grouping untuk Drill-Down
  const groupTransactionsAndItems = (txs: TransactionData[]) => {
    return txs.reduce((acc: Record<string, { total: number; items: TransactionData[] }>, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { total: 0, items: [] };
      }
      acc[curr.category].total += curr.amount;
      acc[curr.category].items.push(curr);
      return acc;
    }, {});
  };

  const fixedGrouped = groupTransactionsAndItems(fixedTxs);
  const varGrouped = groupTransactionsAndItems(varTxs);
  const incomeGrouped = groupTransactionsAndItems(incomeTxs);

  // ALGORITMA BARU: URUTKAN DAFTAR KATEGORI BERDASARKAN TOTAL NOMINAL TERBESAR
  const sortedFixedKeys = Object.keys(fixedGrouped).sort((a, b) => fixedGrouped[b].total - fixedGrouped[a].total);
  const sortedVarKeys = Object.keys(varGrouped).sort((a, b) => varGrouped[b].total - varGrouped[a].total);
  const sortedIncomeKeys = Object.keys(incomeGrouped).sort((a, b) => incomeGrouped[b].total - incomeGrouped[a].total);

  const getTxsForDay = (tglStr: string) => {
    const dayNum = tglStr.replace("Tgl ", "");
    return expenseTxs.filter(t => {
      if (!t.tDate) return false;
      const day = t.tDate.split('-')[2];
      return Number(day) === Number(dayNum);
    });
  };

  const budgetCategories = categories.filter(c => c.type === 'expense' && c.budgetLimit && c.budgetLimit > 0);

  // URUTKAN DATA DARI PERSENTASE TERBESAR KE TERKECIL
  const sortedPieData = [...pieData].sort((a, b) => b.value - a.value);

  // --- ALGORITMA BARU: HITUNG TREN PERBANDINGAN BULAN KE BULAN (MoM TREND) ---
  const calcTrend = (current: number, prev: number) => {
    if (prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    return {
      value: Math.abs(diff).toFixed(0),
      isUp: diff > 0,
    };
  };

  const incomeTrend = calcTrend(totalIncome, prevTotalIncome);
  const expenseTrend = calcTrend(totalExpense, prevTotalExpense);

  return (
    <div className="space-y-6 animate-in">
      {/* CARD KONTROL MONTH & EXPORT */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 transition-colors duration-200">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-black text-xl italic text-slate-800 dark:text-slate-100">Laporan</h2>
          <input type="month" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 border-none outline-none cursor-pointer" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}/>
        </div>
        <button onClick={handleExportToExcel} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
          <Download size={14}/> Export Bulan Ini ke Excel
        </button>
      </div>

      {/* PENCARIAN RIWAYAT */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">🔍 Pencarian Riwayat (Semua Waktu)</h3>
        <div className="relative">
          <Download className="absolute left-3 top-3.5 text-slate-400 rotate-90" size={16} />
          {/* PERBAIKAN KONTRAS PADA INPUT PENCARIAN */}
          <input 
            type="text" 
            placeholder="Cari pengeluaran/bensin/servis motor..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold outline-blue-500 transition-colors focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>

        {globalSearch && (
          <div className="space-y-2 pt-2 animate-in fade-in">
            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-blue-100 dark:border-blue-900/30 pb-2">Hasil Pencarian ({searchResult.length})</p>
            {searchResult.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">Tidak ada transaksi yang cocok.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResult.map((t) => (
                  <div key={t.id} className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                    <div className="text-left">
                      <p className="font-bold text-slate-700 dark:text-slate-200 leading-none mb-1.5">{t.note || t.category}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-none">
                        {new Date(t.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})} • {t.accountName}
                      </p>
                    </div>
                    <span className={`font-black ${t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''} {t.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* TOTAL INCOME WITH MOM TREND */}
        <div className="bg-green-50 dark:bg-green-950/20 p-5 rounded-3xl border border-green-100 dark:border-green-900/30 flex flex-col items-center text-center justify-between transition-colors duration-200">
            <div>
              <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase mb-1">Pemasukan Total</p>
              <p className="text-lg font-black text-green-700 dark:text-green-300">Rp {totalIncome.toLocaleString('id-ID')}</p>
            </div>
            {incomeTrend && (
              <div className={`text-[9px] font-bold flex items-center justify-center gap-1 mt-2 ${incomeTrend.isUp ? "text-green-600" : "text-red-500"}`}>
                {incomeTrend.isUp ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                <span>{incomeTrend.value}% dibanding bulan lalu</span>
              </div>
            )}
        </div>
        
        {/* TOTAL EXPENSE WITH MOM TREND */}
        <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-3xl border border-red-100 dark:border-red-900/30 flex flex-col items-center text-center justify-between transition-colors duration-200">
            <div>
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase mb-1">Pengeluaran Total</p>
              <p className="text-lg font-black text-red-700 dark:text-red-300">Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
            {expenseTrend && (
              <div className={`text-[9px] font-bold flex items-center justify-center gap-1 mt-2 ${expenseTrend.isUp ? "text-red-600" : "text-green-600"}`}>
                {expenseTrend.isUp ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                <span>{expenseTrend.value}% dibanding bulan lalu</span>
              </div>
            )}
        </div>
      </div>

      {totalExpense > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors duration-200">
            <span className="text-[9px] font-black bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md mb-2">FIXED EXPENSE</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">Pengeluaran Wajib</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">Rp {totalFixed.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors duration-200">
            <span className="text-[9px] font-black bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md mb-2">VARIABLE EXPENSE</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">Jajan & Lainnya</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">Rp {totalVar.toLocaleString('id-ID')}</p>
          </div>
        </div>
      )}

      {/* STATUS ANGGARAN (BUDGET) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Status Anggaran (Budget)</h3>
        {budgetCategories.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            Belum ada budget yang diatur. Silakan ke menu Setting.
          </p>
        ) : (
          <div className="space-y-5">
            {budgetCategories.map(cat => {
              const spent = pieData.find(p => p.name === cat.name)?.value || 0;
              const limit = cat.budgetLimit!;
              const percentage = Math.min((spent / limit) * 100, 100);
              let color = "bg-emerald-400"; if(percentage >= 90) color = "bg-red-500"; else if(percentage >= 75) color = "bg-amber-400";
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <div className="text-right">
                      <span className={`text-[10px] font-black ${percentage >= 100 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>Rp {spent.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold"> / Rp {limit.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  {percentage >= 100 && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-right mt-0.5">Budget Habis!</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RINCIAN PENGELUARAN */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm px-1">Rincian Pengeluaran</h3>
        
        {/* TABEL FIXED DENGAN DRILL DOWN (TERURUT) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
          <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Pengeluaran Tetap (Fixed)</p>
          {sortedFixedKeys.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic">Kosong</p> : (
            <div className="space-y-2">
              {sortedFixedKeys.map((key) => {
                const data = fixedGrouped[key];
                const isExpanded = !!expandedCategories[key];
                return (
                  <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                    <div 
                      onClick={() => toggleExpand(key)} 
                      className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1 rounded-lg transition-all"
                    >
                      <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                        {key}
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({data.items.length}x)</span>
                      </span>
                      <span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">
                        Rp {data.total.toLocaleString('id-ID')}
                        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-2 pl-4 pr-2 py-2 bg-slate-50 dark:bg-slate-800/55 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">
                        {data.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-[10px] pb-1.5 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                            <div className="flex flex-col text-left">
                              <span className="text-slate-400 dark:text-slate-500 font-semibold">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] md:max-w-xs">{item.note || "Tanpa catatan"}</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 font-black">Rp {item.amount.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 font-black"><span className="text-slate-800 dark:text-slate-200">TOTAL FIXED</span><span className="text-purple-600 dark:text-purple-400">Rp {totalFixed.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>

        {/* TABEL VARIABLE DENGAN DRILL DOWN (TERURUT) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
          <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Pengeluaran Variabel (Jajan)</p>
          {sortedVarKeys.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic">Kosong</p> : (
            <div className="space-y-2">
              {sortedVarKeys.map((key) => {
                const data = varGrouped[key];
                const isExpanded = !!expandedCategories[key];
                return (
                  <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                    <div 
                      onClick={() => toggleExpand(key)} 
                      className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1 rounded-lg transition-all"
                    >
                      <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                        {key}
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({data.items.length}x)</span>
                      </span>
                      <span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">
                        Rp {data.total.toLocaleString('id-ID')}
                        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-2 pl-4 pr-2 py-2 bg-slate-50 dark:bg-slate-800/55 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">
                        {data.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-[10px] pb-1.5 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                            <div className="flex flex-col text-left">
                              <span className="text-slate-400 dark:text-slate-500 font-semibold">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] md:max-w-xs">{item.note || "Tanpa catatan"}</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 font-black">Rp {item.amount.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 font-black"><span className="text-slate-800 dark:text-slate-200">TOTAL VARIABEL</span><span className="text-orange-600 dark:text-orange-400">Rp {totalVar.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* TABEL PEMASUKAN DENGAN DRILL DOWN (TERURUT) */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm px-1">Rincian Pemasukan</h3>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
          <p className="text-[10px] font-black text-green-500 dark:text-green-450 uppercase tracking-widest mb-1">Detail Pemasukan</p>
          {Object.keys(incomeGrouped).length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-500 italic">Kosong</p> : (
            <div className="space-y-2">
              {sortedIncomeKeys.map((key) => {
                const data = incomeGrouped[key];
                const isExpanded = !!expandedCategories[key];
                return (
                  <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                    <div 
                      onClick={() => toggleExpand(key)} 
                      className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1 rounded-lg transition-all"
                    >
                      <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                        {key}
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({data.items.length}x)</span>
                      </span>
                      <span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">
                        Rp {data.total.toLocaleString('id-ID')}
                        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-2 pl-4 pr-2 py-2 bg-slate-50 dark:bg-slate-800/55 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">
                        {data.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-[10px] pb-1.5 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                            <div className="flex flex-col text-left">
                              <span className="text-slate-400 dark:text-slate-500 font-semibold">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold truncate max-w-[150px] md:max-w-xs">{item.note || "Tanpa catatan"}</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 font-black">Rp {item.amount.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 font-black"><span className="text-slate-800 dark:text-slate-200">TOTAL PEMASUKAN</span><span className="text-green-600 dark:text-green-455">Rp {totalIncome.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* --- GRAFIK DONAT DENGAN SORTING --- */}
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

          {/* LEGENDA BESAR KE KECIL */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            {sortedPieData.map((data, idx) => {
              const percentage = totalExpense > 0 ? ((data.value / totalExpense) * 100).toFixed(1) : "0";
              return (
                <div key={idx} className="flex justify-between items-center text-xs font-bold animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-slate-600 dark:text-slate-300">{data.name}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">({percentage}%)</span>
                  </div>
                  <span className="text-slate-800 dark:text-slate-100 font-black">Rp {data.value.toLocaleString('id-ID')}</span>
                </div>
              );
            })}
          </div>

        </div>
      )}
      
      {/* --- GRAFIK HARIAN --- */}
      {barData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm animate-in transition-colors duration-200">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">Grafik Harian</h3>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/30" />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} stroke="#94a3b8" />
                <YAxis 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8"
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                    return value;
                  }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9', className: 'dark:fill-slate-800/10'}} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8} 
                  wrapperStyle={{ fontSize: 10, fontWeight: "bold" }}
                  formatter={() => <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px]">Pengeluaran Harian</span>}
                />
                <Bar name="amount" dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LEGENDA DETAIL GRAFIK HARIAN (SINKRONUS DRILL-DOWN) */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {barData.map((data, idx) => {
              const dayNum = data.date.replace("Tgl ", "");
              const formattedDate = `${dayNum} ${new Date(reportMonth + "-01").toLocaleDateString('id-ID', { month: 'short' })}`;
              const dayTxs = getTxsForDay(data.date);
              const isExpanded = !!expandedDays[data.date]; 

              return (
                <div key={idx} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-2 pt-2 first:pt-0 last:pb-0">
                  <div 
                    onClick={() => toggleExpandDay(data.date)}
                    className="flex justify-between items-center text-xs font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0"></div>
                      <span className="text-slate-600 dark:text-slate-350">{formattedDate}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({dayTxs.length}x)</span>
                    </div>
                    <span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">
                      Rp {data.amount.toLocaleString('id-ID')}
                      <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pl-4 pr-2 py-2 bg-slate-50 dark:bg-slate-800/55 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">
                      {dayTxs.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-[10px] pb-1.5 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                          <div className="flex flex-col text-left">
                            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">{item.category}</span>
                            <span className="text-slate-600 dark:text-slate-350 font-bold truncate max-w-[150px] md:max-w-xs">{item.note || "Tanpa catatan"}</span>
                          </div>
                          <span className="text-slate-700 dark:text-slate-200 font-black">Rp {item.amount.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}