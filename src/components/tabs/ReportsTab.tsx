"use client";
import { useState, useMemo } from "react";
import { 
  Download, ChevronDown, ArrowUp, ArrowDown, X, Printer, 
  BarChart3, PieChart as PieIcon, CalendarDays, Activity, Filter, 
  TrendingDown, TrendingUp, AlertCircle, Check, ChevronRight
} from "lucide-react";
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart as ReLineChart, Line, BarChart as ReBarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import { CategoryData, TransactionData } from "../../types";

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#0ea5e9', '#6366f1', '#d946ef', '#f43f5e'];
const INCOME_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const label = payload[0].payload.name || payload[0].payload.date || payload[0].name || payload[0].payload.dayName;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-[18px] shadow-xl border border-slate-200 dark:border-slate-700 space-y-1.5 min-w-[150px] text-left">
        <p className="text-slate-400 dark:text-slate-555 text-[10px] font-black uppercase tracking-wider leading-none">{label}</p>
        <div className="space-y-1.5 pt-1">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-slate-500 dark:text-slate-400">{item.name || "Total"}:</span>
              </div>
              <span className="text-slate-900 dark:text-white font-black">Rp {Number(item.value).toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>
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
  accounts?: any[];
}

export default function ReportsTab({
  reportMonth, setReportMonth, handleExportToExcel, categories, reportTransactions, globalSearch, setGlobalSearch, searchResult, isPrivacyMode = false, accounts = []
}: ReportsTabProps) {
  
  const [activeView, setActiveView] = useState<"statistik" | "laporan" | "kalender">("statistik");
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);
  
  const [selectedAccount, setSelectedAccount] = useState<string>("All");
  const [showAccountFilter, setShowAccountFilter] = useState<boolean>(false);
  
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<{name: string, type: 'income' | 'expense'} | null>(null);
  
  const [showAllExpCategories, setShowAllExpCategories] = useState(false);
  const [showAllIncCategories, setShowAllIncCategories] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showAllVarList, setShowAllVarList] = useState(false);

  const triggerHaptic = () => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); };

  const uniqueAccounts = useMemo(() => {
    const accs = new Set<string>();
    if (accounts && accounts.length > 0) accounts.forEach(a => accs.add(a.name));
    reportTransactions.forEach(t => {
      if (t.accountName) accs.add(t.accountName);
      if (t.type === 'transfer' && t.toAccountName) accs.add(t.toAccountName);
    });
    return Array.from(accs).sort();
  }, [reportTransactions, accounts]);

  const filteredGlobalTxs = useMemo(() => {
    if (selectedAccount === "All") return reportTransactions;
    return reportTransactions.filter(t => t.accountName === selectedAccount || t.toAccountName === selectedAccount);
  }, [reportTransactions, selectedAccount]);

  const currentMonthTxs = filteredGlobalTxs.filter(t => t.tDate && t.tDate.startsWith(reportMonth));

  const unrollSplits = (txs: TransactionData[]): TransactionData[] => {
    return txs.flatMap(t => {
      if (t.splits && t.splits.length > 0) return t.splits.map((s, idx) => ({ ...t, id: `${t.id}-split-${idx}`, amount: s.amount, category: s.category, note: s.note ? `${t.note ? t.note + " (" + s.note + ")" : s.note}` : t.note, tDate: t.tDate, accountName: t.accountName }));
      return t;
    });
  };

  const adminFeeTxs = currentMonthTxs.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0 && (selectedAccount === "All" || t.accountName === selectedAccount)).map(t => ({ id: `fee-${t.id}`, amount: t.adminFee!, type: "expense", accountId: t.accountId, accountName: t.accountName, category: "Biaya Admin", note: `Biaya admin transfer ke ${t.toAccountName}`, tDate: t.tDate } as TransactionData));
  const expenseTxs = unrollSplits([...currentMonthTxs.filter(t => t.type === 'expense' && (selectedAccount === "All" || t.accountName === selectedAccount)), ...adminFeeTxs]);
  const incomeTxs = unrollSplits(currentMonthTxs.filter(t => t.type === 'income' && (selectedAccount === "All" || t.accountName === selectedAccount)));

  const localTotalExpense = expenseTxs.reduce((a, b) => a + b.amount, 0);
  const localTotalIncome = incomeTxs.reduce((a, b) => a + b.amount, 0);

  const expGrouped = expenseTxs.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);
  const localPieData = Object.keys(expGrouped).map(k => ({ name: k, value: expGrouped[k] })).sort((a,b) => b.value - a.value);

  const incGrouped = incomeTxs.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);
  const localIncomePieData = Object.keys(incGrouped).map(k => ({ name: k, value: incGrouped[k] })).sort((a,b) => b.value - a.value);

  const getCatType = (catName: string) => categories.find(c => c.name === catName)?.expenseType === "fixed" ? "fixed" : "variable";
  
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

  const fixedGroupedList = groupTransactionsAndItems(fixedTxs);
  const varGroupedList = groupTransactionsAndItems(varTxs);
  const incomeGroupedList = groupTransactionsAndItems(incomeTxs);

  const sortedFixedKeys = Object.keys(fixedGroupedList).sort((a, b) => fixedGroupedList[b].total - fixedGroupedList[a].total);
  const sortedVarKeys = Object.keys(varGroupedList).sort((a, b) => varGroupedList[b].total - varGroupedList[a].total);
  const sortedIncomeKeys = Object.keys(incomeGroupedList).sort((a, b) => incomeGroupedList[b].total - incomeGroupedList[a].total);
  
  const displayedVarKeys = showAllVarList ? sortedVarKeys : sortedVarKeys.slice(0, 5);
  const toggleExpand = (catName: string) => { setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] })); };

  const [y, m] = reportMonth.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthTxs = filteredGlobalTxs.filter(t => t.tDate && t.tDate.startsWith(prevMonthStr) && (selectedAccount === "All" || t.accountName === selectedAccount));
  const prevAdmin = prevMonthTxs.filter(t => t.type === 'transfer' && t.adminFee).reduce((s,t) => s + t.adminFee!, 0);
  const localPrevTotalExpense = unrollSplits(prevMonthTxs.filter(t => t.type === 'expense')).reduce((s, t) => s + t.amount, 0) + prevAdmin;
  
  const localPrevTotalIncome = unrollSplits(prevMonthTxs.filter(t => t.type === 'income')).reduce((s, t) => s + t.amount, 0);

  const getSixMonthsList = (ym: string) => {
    const [year, month] = ym.split("-").map(Number);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months;
  };

  const lastSixMonthsList = getSixMonthsList(reportMonth);
  const monthNavPills = useMemo(() => {
    const [year, month] = reportMonth.split("-").map(Number);
    const pills = [];
    for (let i = 4; i >= -1; i--) { 
      const d = new Date(year, month - 1 - i, 1);
      pills.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return pills;
  }, [reportMonth]);

  const trendData = lastSixMonthsList.map(month => {
    const monthTxs = filteredGlobalTxs.filter(t => t.tDate && t.tDate.startsWith(month) && (selectedAccount === "All" || t.accountName === selectedAccount));
    const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.splits?.reduce((s, split) => s + split.amount, 0) || t.amount), 0);
    const adminFees = monthTxs.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).reduce((sum, t) => sum + t.adminFee!, 0);
    const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.splits?.reduce((s, split) => s + split.amount, 0) || t.amount), 0) + adminFees;
    return { month, name: new Date(month + "-01").toLocaleDateString('id-ID', { month: 'short' }), Pemasukan: inc, Pengeluaran: exp, Net: inc - exp };
  });

  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay(); 
  
  let runExp = 0, runInc = 0;
  const dailyCumulativeData = Array.from({length: daysInMonth}, (_, i) => {
    const dayStr = `${reportMonth}-${String(i+1).padStart(2, '0')}`;
    const txs = currentMonthTxs.filter(t => t.tDate === dayStr && (selectedAccount === "All" || t.accountName === selectedAccount));
    const exp = txs.filter(t=>t.type==='expense').reduce((a,b)=>a+(b.splits?.reduce((s, sp)=>s+sp.amount,0)||b.amount),0) + txs.filter(t=>t.type==='transfer' && t.adminFee).reduce((a,b)=>a+b.adminFee!,0);
    const inc = txs.filter(t=>t.type==='income').reduce((a,b)=>a+(b.splits?.reduce((s, sp)=>s+sp.amount,0)||b.amount),0);
    runExp += exp; runInc += inc;
    return { name: String(i+1), Pemasukan: runInc, Pengeluaran: runExp, DailyExp: exp };
  });

  const dowNames = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];
  const dowFullNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dowData = [0,0,0,0,0,0,0];
  expenseTxs.forEach(t => { const d = new Date(t.tDate).getDay(); dowData[d] += t.amount; });
  const dowChartData = dowNames.map((name, i) => ({ dayName: dowFullNames[i], name, Pengeluaran: dowData[i], fill: dowData[i] === Math.max(...dowData, 1) ? '#ef4444' : '#64748b' }));
  const peakDayIdx = dowData.indexOf(Math.max(...dowData));

  const dailyExpenseMap: Record<number, number> = {};
  const dailyIncomeMap: Record<number, number> = {};
  expenseTxs.forEach(t => { const d = parseInt(t.tDate.split('-')[2], 10); dailyExpenseMap[d] = (dailyExpenseMap[d] || 0) + t.amount; });
  incomeTxs.forEach(t => { const d = parseInt(t.tDate.split('-')[2], 10); dailyIncomeMap[d] = (dailyIncomeMap[d] || 0) + t.amount; });
  const trackedDays = Object.keys(dailyExpenseMap).length;

  const savingsRate = localTotalIncome > 0 ? ((localTotalIncome - localTotalExpense) / localTotalIncome) * 100 : 0;
  const consistencyScore = (trackedDays / daysInMonth) * 100;
  const expenseControlScore = localTotalExpense <= localTotalIncome ? 100 : (localTotalIncome === 0 ? 0 : Math.max(0, 100 - ((localTotalExpense - localTotalIncome) / localTotalIncome * 100)));
  const healthScore = Math.min(Math.max(Math.round((savingsRate > 0 ? 40 : 10) + (consistencyScore * 0.3) + (expenseControlScore * 0.3)), 0), 100);
  
  let healthStatus = { text: "Needs Attention", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30", stroke: "#ef4444" };
  if (healthScore >= 80) healthStatus = { text: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", stroke: "#10b981" };
  else if (healthScore >= 50) healthStatus = { text: "Good", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", stroke: "#f59e0b" };

  // FUNGSI UTAMA: MEMBUAT KONTEN LAPORAN INDEPENDEN BERSIH (E-STATEMENT GENERATOR)
  const generatePrintHTML = () => {
    const tableRows = currentMonthTxs.map(t => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 10px; font-weight: 500;">${new Date(t.tDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})}</td>
        <td style="padding: 12px 10px; font-weight: bold;">${t.note || t.category}</td>
        <td style="padding: 12px 10px;">${t.category}</td>
        <td style="padding: 12px 10px;">${t.type === 'transfer' ? `${t.accountName} -> ${t.toAccountName}` : t.accountName}</td>
        <td style="padding: 12px 10px; text-align: right; font-weight: 900; color: ${t.type === 'income' ? '#10b981' : t.type === 'expense' ? '#ef4444' : '#3b82f6'};">
          ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''} ${t.amount.toLocaleString('id-ID')}
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Laporan Keuangan - FINTRACKER</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background-color: #ffffff; }
          
          /* BARIS AKSI BUTTONS (KEMBALI & CETAK) */
          .no-print-actions { display: flex; gap: 12px; margin-bottom: 24px; }
          .no-print-btn { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; font-size: 14px; font-weight: bold; border-radius: 12px; cursor: pointer; border: none; transition: background 0.2s; -webkit-tap-highlight-color: transparent; }
          
          .print-primary-btn { background-color: #1e3a8a; color: white; flex: 2; }
          .print-primary-btn:active { background-color: #1e40af; }
          
          .print-secondary-btn { background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; flex: 1; }
          .print-secondary-btn:active { background-color: #e2e8f0; }

          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
          .logo-title { font-size: 24px; font-weight: 900; font-style: italic; letter-spacing: -0.05em; }
          .logo-title span:first-child { color: #1e293b; }
          .logo-title span:last-child { color: #2563eb; }
          .summary-box { display: flex; gap: 32px; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; margin-bottom: 24px; }
          .summary-item { flex: 1; }
          .summary-item p { margin: 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; }
          .summary-item h2 { margin: 4px 0 0 0; font-size: 18px; font-weight: 900; }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
          th { border-bottom: 1px solid #94a3b8; padding: 12px 10px; color: #475569; font-weight: bold; }
          td { padding: 12px 10px; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; font-style: italic; margin-top: 40px; }
          
          @media print {
            .no-print-actions { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <!-- DUA PILIHAN AKSI VISUAL UNTUK MOBILE USER -->
        <div class="no-print-actions">
          <button class="no-print-btn print-primary-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
          <button class="no-print-btn print-secondary-btn" onclick="window.close()">← Kembali</button>
        </div>
        
        <div class="header">
          <div>
            <div class="logo-title"><span>FIN</span><span>TRACKER</span></div>
            <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: bold; color: #94a3b8;">Laporan Mutasi Keuangan ${selectedAccount !== "All" ? `(${selectedAccount})` : ''}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b;">Periode</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 900;">${new Date(reportMonth + '-01').toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}</p>
          </div>
        </div>

        <div class="summary-box">
          <div class="summary-item">
            <p>Total Pemasukan</p>
            <h2 class="income">Rp ${localTotalIncome.toLocaleString('id-ID')}</h2>
          </div>
          <div class="summary-item" style="border-left: 1px solid #cbd5e1; padding-left: 32px;">
            <p>Total Pengeluaran</p>
            <h2 class="expense">Rp ${localTotalExpense.toLocaleString('id-ID')}</h2>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Kategori</th>
              <th>Dompet</th>
              <th style="text-align: right;">Nominal (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <p class="footer">Dicetak dari Aplikasi Fintracker pada ${new Date().toLocaleString('id-ID')}</p>

        <script>
          // Picu dialog cetak otomatis saat halaman baru yang bersih ini selesai dimuat
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
  };

  // ================= KOMPONEN RENDER =================
  const RenderDonutList = ({ data, colors, total, title, type, showAll, setShowAll }: { data: any[], colors: string[], total: number, title: string, type: 'income' | 'expense', showAll: boolean, setShowAll: (val: boolean) => void }) => {
    const displayedProgressBars = showAll ? data : data.slice(0, 5);
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">{title}</h3>
          <span className="font-black text-slate-800 dark:text-slate-100 text-lg">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        
        {total === 0 ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-6 opacity-50">
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 dark:border-slate-800 flex items-center justify-center"><span className="text-xs font-bold text-slate-400">No Data</span></div>
            <div className="space-y-3 w-full max-w-[200px]">
              {[1,2,3,4].map(i => (<div key={i} className="flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"/><div className="w-16 h-2 rounded bg-slate-200 dark:bg-slate-700"/></div><div className="w-6 h-2 rounded bg-slate-200 dark:bg-slate-700"/></div>))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                    {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={colors[index % colors.length]} />))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full shadow-inner flex items-center justify-center">
                  {type === "expense" ? <TrendingDown className="text-red-500" size={20}/> : <TrendingUp className="text-emerald-500" size={20}/>}
                </div>
              </div>
            </div>
            
            <div className="w-full space-y-1">
              {data.slice(0, 6).map((item, idx) => {
                const pct = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={idx} onClick={() => { triggerHaptic(); setSelectedCategoryDetail({name: item.name, type}); }} className="flex justify-between items-center text-xs w-full cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -mx-2 rounded-xl transition-colors active:scale-95 group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-black text-slate-800 dark:text-slate-200">{pct}%</span>
                      <span className="font-bold text-slate-400 hidden sm:block w-20 text-right">Rp {item.value.toLocaleString('id-ID')}</span>
                      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {total > 0 && (
          <div className="mt-8 space-y-2 pt-6 border-t border-slate-100 dark:border-slate-800">
            {displayedProgressBars.map((item, idx) => {
               const pct = (item.value / total) * 100;
               return (
                <div key={idx} onClick={() => { triggerHaptic(); setSelectedCategoryDetail({name: item.name, type}); }} className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -mx-2 rounded-xl transition-colors active:scale-95 group animate-in fade-in duration-200">
                  <div className="flex justify-between text-[10px] font-bold">
                     <div className="flex gap-2 items-center text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <div className="w-6 h-4 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-[8px] group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">{pct.toFixed(0)}%</div>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[data.findIndex(d => d.name === item.name) % colors.length] }} />
                        {item.name}
                     </div>
                     <div className="flex items-center gap-1">
                       <span className="text-slate-800 dark:text-slate-200">Rp {item.value.toLocaleString('id-ID')}</span>
                       <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
                </div>
               )
            })}
            {data.length > 5 && (
              <button onClick={() => { triggerHaptic(); setShowAll(!showAll); }} className="w-full mt-3 py-2 text-[10px] font-bold text-blue-500 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-dashed border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95">
                {showAll ? "↑ Sembunyikan" : `Tampilkan ${data.length - 5} Kategori Lainnya ↓`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 animate-in print:hidden">
        
        {/* HEADER & FILTER */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-black text-2xl text-[#064e3b] dark:text-emerald-400 tracking-tight">Ringkasan</h2>
            <button onClick={() => { triggerHaptic(); setShowAccountFilter(true); }} className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all">
              <Filter size={14} className="text-blue-600 dark:text-blue-400" /> 
              {selectedAccount === "All" ? "Semua Akun" : selectedAccount} 
              <ChevronDown size={14}/>
            </button>
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2 px-2 pb-2 -mx-2 snap-x">
            {monthNavPills.map(month => {
              const isActive = month === reportMonth;
              const dateObj = new Date(month + "-01");
              const label = dateObj.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
              return (
                <button key={month} onClick={() => { triggerHaptic(); setReportMonth(month); }} className={`snap-center shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${isActive ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center mb-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
              {[
                { id: "statistik", label: "Statistik", icon: BarChart3 },
                { id: "laporan", label: "Laporan", icon: Activity },
                { id: "kalender", label: "Kalender", icon: CalendarDays }
              ].map(tab => (
                <button key={tab.id} onClick={() => { triggerHaptic(); setActiveView(tab.id as any); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeView === tab.id ? "bg-blue-900 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 px-2">
            <button onClick={handleExportToExcel} className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95">
              <Download size={14}/> Export Excel
            </button>
            
            {/* TOMBOL CETAK PDF (ISOLATED DOCUMENT STREAM BYPASS) */}
            <button 
              onClick={() => {
                triggerHaptic();
                try {
                  const htmlContent = generatePrintHTML();
                  // Buka jendela baru secara murni sinkronus
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                  } else {
                    // Fallback jika diblokir oleh pop-up blocker browser
                    window.print();
                  }
                } catch (e) {
                  window.print();
                }
              }} 
              className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors touch-manipulation cursor-pointer active:scale-95"
            >
              <Printer size={14}/> Cetak PDF
            </button>
          </div>
        </div>

        {/* ================= VIEW 1: STATISTIK ================= */}
        {activeView === "statistik" && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* FIXED VS VARIABLE */}
            {localTotalExpense > 0 && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors duration-200">
                  <span className="text-[9px] font-black bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-md mb-2 tracking-wider">FIXED EXPENSE</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Pengeluaran Wajib</p>
                  <p className="text-[15px] font-black text-slate-800 dark:text-slate-100">Rp {totalFixed.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-colors duration-200">
                  <span className="text-[9px] font-black bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-md mb-2 tracking-wider">VARIABLE EXPENSE</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Jajan & Lainnya</p>
                  <p className="text-[15px] font-black text-slate-800 dark:text-slate-100">Rp {totalVar.toLocaleString('id-ID')}</p>
                </div>
              </div>
            )}
            
            {/* Arus Kas & Tren Pengeluaran */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Arus Kas</h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg"><span className="px-3 py-1 rounded-md text-[10px] font-bold text-slate-500 dark:text-slate-400">Minggu</span><span className="px-3 py-1 rounded-md text-[10px] font-bold bg-blue-900 text-white shadow-sm">Bulan</span></div>
              </div>
              
              <div className="h-32 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={trendData.slice(-6)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barGap={0} barCategoryGap="20%">
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: "bold", fill: "#94a3b8" }} dy={10} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="Net" radius={[4, 4, 4, 4]}>{trendData.slice(-6).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.month === reportMonth ? (entry.Net >= 0 ? '#10b981' : '#ef4444') : '#64748b'} />))}</Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-2xl flex items-center gap-4 border border-orange-100 dark:border-orange-900/30">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-500">{localTotalIncome - localTotalExpense >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}</div>
                <div><p className="text-xs font-black text-slate-800 dark:text-slate-200">Periode terakhir tren {localTotalIncome - localTotalExpense >= 0 ? "positif" : "menurun"}</p><p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">perubahan Rp {Math.abs(localTotalIncome - localTotalExpense).toLocaleString('id-ID')}</p></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Tren Pengeluaran</h3>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-300">Rata-rata: Rp {Math.round(trendData.reduce((a,b)=>a+b.Pengeluaran,0)/6).toLocaleString('id-ID')}/bln</span>
              </div>
              
              <div className="h-32 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={trendData.slice(-6)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: "bold", fill: "#94a3b8" }} dy={10} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="Pengeluaran" radius={[4, 4, 4, 4]}>{trendData.slice(-6).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.month === reportMonth ? '#ef4444' : '#64748b'} />))}</Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><ArrowDown size={12}/> Bulan Lalu</p><p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">Rp {localPrevTotalExpense.toLocaleString('id-ID')}</p></div>
                <div className="text-slate-400">→</div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><CalendarDays size={12}/> Bulan Ini</p><p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">Rp {localTotalExpense.toLocaleString('id-ID')}</p></div>
              </div>
            </div>

            {/* KARTU BARU: TREN PEMASUKAN */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Tren Pemasukan</h3>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-300">Rata-rata: Rp {Math.round(trendData.reduce((a,b)=>a+b.Pemasukan,0)/6).toLocaleString('id-ID')}/bln</span>
              </div>
              
              <div className="h-32 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={trendData.slice(-6)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: "bold", fill: "#94a3b8" }} dy={10} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                    <Bar dataKey="Pemasukan" radius={[4, 4, 4, 4]}>{trendData.slice(-6).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.month === reportMonth ? '#10b981' : '#64748b'} />))}</Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><ArrowDown size={12}/> Bulan Lalu</p><p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">Rp {localPrevTotalIncome.toLocaleString('id-ID')}</p></div>
                <div className="text-slate-400">→</div>
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800"><p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1"><CalendarDays size={12}/> Bulan Ini</p><p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">Rp {localTotalIncome.toLocaleString('id-ID')}</p></div>
              </div>
            </div>

            {/* Grafik Donut & Progress */}
            <RenderDonutList data={localPieData} colors={COLORS} total={localTotalExpense} title="Pengeluaran" type="expense" showAll={showAllExpCategories} setShowAll={setShowAllExpCategories} />
            <RenderDonutList data={localIncomePieData} colors={INCOME_COLORS} total={localTotalIncome} title="Pemasukan" type="income" showAll={showAllIncCategories} setShowAll={setShowAllIncCategories} />

            {/* RINCIAN PENGELUARAN (LIST EXPANDABLE) */}
            <div className="space-y-4 pt-2 animate-in fade-in duration-300">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg px-2">Rincian Pengeluaran</h3>
              
              {/* FIXED */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
                <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Pengeluaran Tetap (Fixed)</p>
                {sortedFixedKeys.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-550 italic">Kosong</p> : (
                  <div className="space-y-2">
                    {sortedFixedKeys.map((key) => {
                      const data = fixedGroupedList[key];
                      const isExpanded = !!expandedCategories[key];
                      return (
                        <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                          <div onClick={() => { triggerHaptic(); toggleExpand(key); }} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 -mx-1.5 rounded-xl transition-all">
                            <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black">{data.items[0]?.category?.charAt(0).toUpperCase()}</span>
                              {key} <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">({data.items.length}x)</span>
                            </span>
                            <span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">
                              Rp {data.total.toLocaleString('id-ID')} 
                              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="mt-2 pl-4 pr-2 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">
                              {data.items.sort((a,b) => new Date(b.tDate).getTime() - new Date(a.tDate).getTime()).map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-[10px] pb-2 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                                  <div className="flex flex-col text-left">
                                    <span className="text-slate-400 dark:text-slate-550 font-bold text-[9px] mb-0.5">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {item.accountName}</span>
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
                    <div className="flex justify-between items-center text-xs pt-4 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 font-black">
                      <span className="text-slate-800 dark:text-slate-200">TOTAL FIXED</span>
                      <span className="text-purple-600 dark:text-purple-400 text-sm">Rp {totalFixed.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* VARIABLE */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
                <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">Pengeluaran Variabel (Jajan)</p>
                {sortedVarKeys.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-550 italic">Kosong</p> : (
                  <div className="space-y-2">
                    {displayedVarKeys.map((key) => {
                      const data = varGroupedList[key];
                      const isExpanded = !!expandedCategories[key];
                      return (
                        <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                          <div onClick={() => { triggerHaptic(); toggleExpand(key); }} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 -mx-1.5 rounded-xl transition-all">
                            <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black">{data.items[0]?.category?.charAt(0).toUpperCase()}</span>
                              {key} <span className="text-[9px] text-slate-400 dark:text-slate-550 font-medium">({data.items.length}x)</span>
                            </span>
                            <span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">
                              Rp {data.total.toLocaleString('id-ID')} 
                              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="mt-2 pl-4 pr-2 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">
                              {data.items.sort((a,b) => new Date(b.tDate).getTime() - new Date(a.tDate).getTime()).map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-[10px] pb-2 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                                  <div className="flex flex-col text-left">
                                    <span className="text-slate-400 dark:text-slate-555 font-bold text-[9px] mb-0.5">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {item.accountName}</span>
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
                    {sortedVarKeys.length > 5 && (
                      <button onClick={() => { triggerHaptic(); setShowAllVarList(!showAllVarList); }} className="w-full mt-3 py-2 text-[10px] font-bold text-blue-500 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-dashed border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95">
                        {showAllVarList ? "↑ Sembunyikan" : `Tampilkan ${sortedVarKeys.length - 5} Kategori Lainnya ↓`}
                      </button>
                    )}
                    <div className="flex justify-between items-center text-xs pt-4 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 font-black">
                      <span className="text-slate-800 dark:text-slate-200">TOTAL VARIABEL</span>
                      <span className="text-orange-600 dark:text-orange-400 text-sm">Rp {totalVar.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RINCIAN PEMASUKAN (LIST EXPANDABLE) */}
            <div className="space-y-4 pt-2 animate-in fade-in duration-300">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg px-2">Rincian Pemasukan</h3>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors duration-200">
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Detail Pemasukan</p>
                {sortedIncomeKeys.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-550 italic">Kosong</p> : (
                  <div className="space-y-2">
                    {sortedIncomeKeys.map((key) => {
                      const data = incomeGroupedList[key];
                      const isExpanded = !!expandedCategories[`inc-${key}`];
                      return (
                        <div key={key} className="border-b border-slate-50 dark:border-slate-800/40 last:border-0 pb-1.5 pt-1.5 first:pt-0 last:pb-0">
                          <div onClick={() => { triggerHaptic(); toggleExpand(`inc-${key}`); }} className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-1.5 -mx-1.5 rounded-xl transition-all">
                            <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black">{data.items[0]?.category?.charAt(0).toUpperCase()}</span>
                              {key} <span className="text-[9px] text-slate-400 dark:text-slate-550 font-medium">({data.items.length}x)</span>
                            </span>
                            <span className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-1.5">
                              Rp {data.total.toLocaleString('id-ID')} 
                              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="mt-2 pl-4 pr-2 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-700/60 animate-in slide-in-from-top-2 duration-200">
                              {data.items.sort((a,b) => new Date(b.tDate).getTime() - new Date(a.tDate).getTime()).map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-[10px] pb-2 last:pb-0 border-b border-slate-200/40 dark:border-slate-700/40 last:border-none">
                                  <div className="flex flex-col text-left">
                                    <span className="text-slate-400 dark:text-slate-500 font-bold text-[9px] mb-0.5">{new Date(item.tDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {item.accountName}</span>
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
                    <div className="flex justify-between items-center text-xs pt-4 mt-2 border-t border-dashed border-slate-200 dark:border-slate-800 font-black">
                      <span className="text-slate-800 dark:text-slate-200">TOTAL PEMASUKAN</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">Rp {localTotalIncome.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= VIEW 2: LAPORAN (ANALISIS MENDALAM) ================= */}
        {activeView === "laporan" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#1e3a8a] text-white p-6 rounded-[30px] shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-start mb-6"><div><h3 className="font-bold text-blue-200 text-xs mb-1">Aktivitas Pengeluaran</h3><p className="font-black text-lg">{new Date(reportMonth + "-01").toLocaleDateString('id-ID', {month: 'short', year: 'numeric'})}</p></div></div>
              <div className="flex gap-6 mb-6 relative z-10">
                <div><p className="text-2xl font-black">Rp {localTotalExpense >= 1000 ? (localTotalExpense/1000).toFixed(1)+'K' : localTotalExpense}</p><p className="text-[10px] font-bold text-blue-300">Pengeluaran</p></div>
                {localPieData[0] && (<div><p className="text-2xl font-black">Rp {localPieData[0].value >= 1000 ? (localPieData[0].value/1000).toFixed(1)+'K' : localPieData[0].value}</p><p className="text-[10px] font-bold text-blue-300">{localPieData[0].name}</p></div>)}
              </div>
              <div className="h-48 w-full relative z-10 -ml-2 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyCumulativeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs><linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/><stop offset="95%" stopColor="#ffffff" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.8)", fontWeight: "bold" }} tickLine={false} axisLine={false} interval={0} dy={10} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2, strokeDasharray: '3 3' }} />
                    <Area type="monotone" dataKey="DailyExp" name="Pengeluaran Harian" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" activeDot={{ r: 6, fill: "#1e3a8a", stroke: "#ffffff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ringkasan</p>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Arus Kas Bulanan</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex gap-2 items-center mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/><span className="text-lg font-black text-slate-800 dark:text-slate-100">Rp {localTotalIncome.toLocaleString('id-ID')}</span></div>
                  <p className="text-[10px] font-bold text-slate-500 pl-4 mb-2">Pemasukan</p>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" style={{width: `${localTotalIncome > 0 ? (localTotalIncome >= localTotalExpense ? 100 : (localTotalIncome / localTotalExpense) * 100) : 0}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex gap-2 items-center mb-1"><div className="w-2 h-2 rounded-full bg-red-500"/><span className="text-lg font-black text-slate-800 dark:text-slate-100">Rp {localTotalExpense.toLocaleString('id-ID')}</span></div>
                  <p className="text-[10px] font-bold text-slate-500 pl-4 mb-2">Pengeluaran</p>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out" style={{width: `${localTotalExpense > 0 ? (localTotalExpense >= localTotalIncome ? 100 : (localTotalExpense / localTotalIncome) * 100) : 0}%`}}></div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mt-2"><p className="text-xs font-bold text-slate-600 dark:text-slate-300">Pada {new Date(reportMonth + "-01").toLocaleDateString('id-ID', {month: 'short', year: 'numeric'})}, arus kas Anda {localTotalIncome >= localTotalExpense ? "positif" : "negatif"}. Anda {localTotalIncome >= localTotalExpense ? "menyimpan" : "membelanjakan lebih sebesar"} <span className="font-black">Rp {Math.abs(localTotalIncome - localTotalExpense).toLocaleString('id-ID')}</span>.</p></div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2"><h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Income vs Expense</h3><span className="text-[10px] font-bold text-slate-500">Cumulative</span></div>
              <div className="flex gap-4 text-[10px] font-bold mb-4">
                <div className="flex items-center gap-1.5"><div className="w-4 h-1 rounded bg-emerald-500"/> Pemasukan <span className="text-emerald-600">Rp {localTotalIncome >= 1000 ? (localTotalIncome/1000).toFixed(0)+'K' : localTotalIncome}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-1 rounded bg-red-500"/> Pengeluaran <span className="text-red-500">Rp {localTotalExpense >= 1000 ? (localTotalExpense/1000).toFixed(0)+'K' : localTotalExpense}</span></div>
              </div>
              <div className="h-56 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={dailyCumulativeData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontStyle: "normal", fontWeight: "bold", fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 9, fontWeight: "bold", fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#10b981", strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#ef4444", strokeWidth: 0 }} />
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ringkasan</p>
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-2">Financial Health Score</h3><span className={`px-3 py-1 rounded-full text-[10px] font-black ${healthStatus.bg} ${healthStatus.color}`}>{healthStatus.text}</span></div>
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" className="dark:stroke-slate-800"/>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={healthStatus.stroke} strokeWidth="3" strokeDasharray={`${healthScore}, 100`} className="transition-all duration-1000 ease-out"/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={`text-xl font-black leading-none ${healthStatus.color}`}>{healthScore}</span><span className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">/100</span></div>
                </div>
              </div>
              <div className={`${localTotalIncome >= localTotalExpense ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"} p-4 rounded-2xl flex items-center gap-4 mb-6 border ${localTotalIncome >= localTotalExpense ? "border-emerald-100 dark:border-emerald-800/30" : "border-red-100 dark:border-red-800/30"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/50 dark:bg-black/20 shrink-0`}>{localTotalIncome >= localTotalExpense ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}</div>
                <div><p className="text-[10px] font-black uppercase tracking-wider">{localTotalIncome >= localTotalExpense ? "Net Surplus" : "Net Deficit"}</p><p className="text-lg font-black">Rp {Math.abs(localTotalIncome - localTotalExpense).toLocaleString('id-ID')}</p></div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Savings Rate", val: `${savingsRate.toFixed(1)}%`, score: (savingsRate>0?40:0), max: 40, icon: "🎯" },
                  { label: "Expense Control", val: localTotalExpense > localTotalIncome ? "Over" : "Good", score: (localTotalExpense<=localTotalIncome?30:10), max: 30, icon: "📉" },
                  { label: "Tracking Consistency", val: `${trackedDays}/${daysInMonth} hari`, score: (trackedDays/daysInMonth*30), max: 30, icon: "📅" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold"><span className="opacity-70">{item.icon}</span> {item.label}</div>
                    <div className="flex items-center gap-3"><span className="text-[10px] text-slate-400 font-bold w-20 text-right">{item.val}</span><div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-slate-800 dark:bg-slate-300 rounded-full" style={{width:`${(item.score/item.max)*100}%`}}></div></div><span className="text-[10px] font-black text-slate-800 dark:text-slate-200 w-4 text-right">{Math.round(item.score)}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div><h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Spending by Day of Week</h3><p className="text-[10px] font-bold text-slate-500">Peak spending day: <span className="text-red-500">{dowFullNames[peakDayIdx]}</span></p></div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={dowChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold", fill: "#94a3b8" }} dy={10} /><Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} /><Bar dataKey="Pengeluaran" radius={[6, 6, 6, 6]}>{dowChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Bar></ReBarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 divide-x divide-slate-200 dark:divide-slate-700">
                <div className="flex-1 text-center"><p className="text-[10px] font-bold text-slate-500 mb-1">Weekdays</p><p className="text-sm font-black text-slate-800 dark:text-slate-200">Rp {Math.round((dowData[1]+dowData[2]+dowData[3]+dowData[4]+dowData[5])/5/1000).toFixed(0)}K <span className="text-[9px] text-slate-400 font-normal">avg/day</span></p></div>
                <div className="flex-1 text-center"><p className="text-[10px] font-bold text-slate-500 mb-1">Weekends</p><p className="text-sm font-black text-slate-800 dark:text-slate-200">Rp {Math.round((dowData[0]+dowData[6])/2/1000).toFixed(0)}K <span className="text-[9px] text-slate-400 font-normal">avg/day</span></p></div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 3: KALENDER ================= */}
        {activeView === "kalender" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
              
              <div className="flex justify-between items-center mb-6 px-2">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">{new Date(reportMonth + "-01").toLocaleDateString('id-ID', {month: 'long', year: 'numeric'})}</h3>
                  <p className="text-[10px] font-bold text-slate-500">{trackedDays} hari terlacak bulan ini</p>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2">{['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (<div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{day}</div>))}</div>
              
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {Array.from({length: firstDayOfWeek}).map((_, i) => (<div key={`empty-${i}`} className="aspect-square bg-slate-50/50 dark:bg-slate-800/10 rounded-xl"></div>))}
                {Array.from({length: daysInMonth}).map((_, i) => {
                  const d = i + 1; const dateStr = `${reportMonth}-${String(d).padStart(2, '0')}`; const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const inc = dailyIncomeMap[d] || 0; const exp = dailyExpenseMap[d] || 0; const hasData = inc > 0 || exp > 0;
                  return (
                    <div key={d} onClick={() => { if(hasData) { triggerHaptic(); setSelectedHeatmapDate(dateStr); } }} className={`aspect-square p-1 md:p-2 rounded-xl flex flex-col justify-between transition-all ${hasData ? 'cursor-pointer hover:scale-105 hover:shadow-md hover:z-10' : ''} ${isToday ? 'bg-blue-50 border-2 border-blue-500 dark:bg-blue-900/20' : hasData ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-800/30 border border-transparent'}`}>
                      <span className={`text-[10px] md:text-xs font-black ${isToday ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'} ${!hasData && !isToday ? 'opacity-40' : ''}`}>{d}</span>
                      {hasData && (
                        <div className="flex flex-col gap-0.5 mt-auto">
                          {inc > 0 && <span className="text-[7px] md:text-[9px] font-black text-emerald-500 truncate leading-none">+{inc.toLocaleString('id-ID')}</span>}
                          {exp > 0 && <span className="text-[7px] md:text-[9px] font-black text-red-500 truncate leading-none">-{exp.toLocaleString('id-ID')}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SUMMARY FULL-NUMBER BARU DI BAWAH KALENDER */}
              <div className="mt-6 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Pendapatan</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Rp {localTotalIncome.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Pengeluaran</span>
                  <span className="text-red-500 dark:text-red-400 font-black">Rp {localTotalExpense.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 mt-1 border-t border-slate-100 border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Arus Kas</span>
                  <span className={`font-black ${localTotalIncome - localTotalExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {localTotalIncome - localTotalExpense < 0 ? '-' : ''}Rp {Math.abs(localTotalIncome - localTotalExpense).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= BOTTOM SHEETS ================= */}

        {/* 1. BOTTOM SHEET TRANSAKSI HARIAN KALENDER */}
        {selectedHeatmapDate && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedHeatmapDate(null)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[30px] sm:rounded-[30px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden"><div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>
              <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0">
                <div><div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1"><CalendarDays size={16} /><h3 className="font-black text-sm">{new Date(selectedHeatmapDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3></div><p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-6">{unrollSplits(currentMonthTxs.filter(t => t.tDate === selectedHeatmapDate)).length} transaksi tercatat</p></div>
                <button onClick={() => setSelectedHeatmapDate(null)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"><X size={16}/></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {(() => {
                  const dayTxs = unrollSplits(currentMonthTxs.filter(t => t.tDate === selectedHeatmapDate));
                  const dayInc = dayTxs.filter(t => t.type === 'income').reduce((a,b)=>a+b.amount,0); const dayExp = dayTxs.filter(t => t.type === 'expense').reduce((a,b)=>a+b.amount,0);
                  return (
                    <>
                      <div className="flex gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex-1"><p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1"><ArrowUp size={12} className="text-emerald-500"/> Pendapatan</p><p className="text-sm font-black text-emerald-600">Rp {dayInc.toLocaleString('id-ID')}</p></div>
                        <div className="flex-1"><p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1"><ArrowDown size={12} className="text-red-500"/> Pengeluaran</p><p className="text-sm font-black text-red-500">Rp {dayExp.toLocaleString('id-ID')}</p></div>
                      </div>
                      <div className="space-y-3 pt-2">
                        {dayTxs.sort((a,b) => b.amount - a.amount).map(t => (
                          <div key={t.id} className="flex justify-between items-center text-xs p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-100 text-red-500 dark:bg-red-900/30'}`}>{t.category.charAt(0).toUpperCase()}</div>
                              <div className="flex flex-col text-left"><span className="font-black text-slate-800 dark:text-slate-200">{t.category}</span><span className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[150px]">{t.accountName} {t.note ? `• ${t.note}` : ''}</span></div>
                            </div>
                            <span className={`font-black shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 2. BOTTOM SHEET FILTER AKUN */}
        {showAccountFilter && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAccountFilter(false)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[30px] sm:rounded-[30px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden"><div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>
              <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Filter by Account</h3>
                <button onClick={() => setShowAccountFilter(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"><X size={16}/></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                <div onClick={() => { triggerHaptic(); setSelectedAccount("All"); setShowAccountFilter(false); }} className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-colors border ${selectedAccount === "All" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent"}`}>
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"><Filter size={14}/></div><span className="font-black text-sm text-slate-800 dark:text-slate-200">All Accounts</span></div>
                  {selectedAccount === "All" && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                </div>
                {uniqueAccounts.map(acc => (
                  <div key={acc} onClick={() => { triggerHaptic(); setSelectedAccount(acc); setShowAccountFilter(false); }} className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-colors border ${selectedAccount === acc ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm" : "hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent"}`}>
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">{acc.charAt(0).toUpperCase()}</div><span className="font-black text-sm text-slate-800 dark:text-slate-200">{acc}</span></div>
                    {selectedAccount === acc && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. BOTTOM SHEET RINCIAN TRANSAKSI PER KATEGORI */}
        {selectedCategoryDetail && (
          <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedCategoryDetail(null)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[30px] sm:rounded-[30px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden"><div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>
              <div className="px-6 pb-4 pt-2 sm:pt-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">{selectedCategoryDetail.name}</h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Rincian riwayat kategori bulan ini</p>
                </div>
                <button onClick={() => setSelectedCategoryDetail(null)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"><X size={16}/></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-3">
                {(() => {
                  const catTxs = (selectedCategoryDetail.type === 'expense' ? expenseTxs : incomeTxs)
                    .filter(t => t.category === selectedCategoryDetail.name)
                    .sort((a,b) => new Date(b.tDate).getTime() - new Date(a.tDate).getTime());
                  
                  if(catTxs.length === 0) return <p className="text-center text-xs text-slate-400 dark:text-slate-550 italic py-4">Tidak ada riwayat untuk kategori ini.</p>;

                  return catTxs.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-xs p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-800 dark:text-slate-200 mb-1">{new Date(t.tDate).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'})}</span>
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]">{t.accountName} {t.note ? `• ${t.note}` : ''}</span>
                      </div>
                      <span className={`font-black shrink-0 ${selectedCategoryDetail.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {selectedCategoryDetail.type === 'income' ? '+' : '-'}Rp {t.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}