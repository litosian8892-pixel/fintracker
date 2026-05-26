"use client";
import { Download } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { CategoryData, TransactionData } from "../../types";

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg shadow-md border border-slate-100 text-xs font-bold">
        <span className="text-slate-500">{payload[0].name || payload[0].payload.date}: </span>
        <span className="text-slate-800">Rp {Number(payload[0].value).toLocaleString('id-ID')}</span>
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
  reportTransactions: TransactionData[]; // <--- BARU (untuk memisahkan rincian)
}

export default function ReportsTab({
  reportMonth, setReportMonth, handleExportToExcel, totalIncome, totalExpense, pieData, incomeCategoryList, barData, categories, reportTransactions
}: ReportsTabProps) {
  
  // PEMISAHAN FIXED VS VARIABLE
  const getCatType = (catName: string) => categories.find(c => c.name === catName)?.expenseType === "fixed" ? "fixed" : "variable";
  
  const expenseTxs = reportTransactions.filter(t => t.type === 'expense');
  const fixedTxs = expenseTxs.filter(t => getCatType(t.category) === "fixed");
  const varTxs = expenseTxs.filter(t => getCatType(t.category) === "variable");

  const totalFixed = fixedTxs.reduce((a, b) => a + b.amount, 0);
  const totalVar = varTxs.reduce((a, b) => a + b.amount, 0);

  // Grouping untuk UI Rincian
  const fixedGroup = fixedTxs.reduce((acc: Record<string, number>, curr) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
  const varGroup = varTxs.reduce((acc: Record<string, number>, curr) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});

  const budgetCategories = categories.filter(c => c.type === 'expense' && c.budgetLimit && c.budgetLimit > 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <h2 className="font-black text-xl italic text-slate-800">Laporan</h2>
          <input type="month" className="p-2 bg-slate-50 rounded-xl text-xs font-bold text-blue-600 border-none outline-none" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}/>
        </div>
        <button onClick={handleExportToExcel} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2">
          <Download size={14}/> Export Bulan Ini ke Excel
        </button>
      </div>
      
      {/* RINGKASAN ATAS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-5 rounded-3xl border border-green-100">
            <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Pemasukan Total</p>
            <p className="text-lg font-black text-green-700">Rp {totalIncome.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-3xl border border-red-100">
            <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Pengeluaran Total</p>
            <p className="text-lg font-black text-red-700">Rp {totalExpense.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* FIXED VS VARIABLE BOX */}
      {totalExpense > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded-md mb-2">FIXED EXPENSE</span>
            <p className="text-[10px] text-slate-500 font-bold mb-1">Pengeluaran Wajib</p>
            <p className="text-sm font-black text-slate-800">Rp {totalFixed.toLocaleString('id-ID')}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-2 py-1 rounded-md mb-2">VARIABLE EXPENSE</span>
            <p className="text-[10px] text-slate-500 font-bold mb-1">Jajan & Lainnya</p>
            <p className="text-sm font-black text-slate-800">Rp {totalVar.toLocaleString('id-ID')}</p>
          </div>
        </div>
      )}

      {/* PROGRESS BAR BUDGET */}
      <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Status Anggaran (Budget)</h3>
        {budgetCategories.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
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
                    <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                    <div className="text-right">
                      <span className={`text-[10px] font-black ${percentage >= 100 ? 'text-red-500' : 'text-slate-800'}`}>Rp {spent.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-slate-400 font-bold"> / Rp {limit.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  {percentage >= 100 && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-right mt-0.5">Budget Habis!</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RINCIAN PENGELUARAN YANG SUDAH DIPISAH */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm px-1">Rincian Pengeluaran</h3>
        
        {/* TABEL FIXED */}
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center mb-1">
             <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Pengeluaran Tetap (Fixed)</p>
          </div>
          {Object.keys(fixedGroup).length === 0 ? <p className="text-xs text-slate-400 italic">Kosong</p> : (
            <div className="space-y-2">
              {Object.keys(fixedGroup).map((key, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 last:border-0 last:pb-0"><span className="text-slate-600 font-bold">{key}</span><span className="text-slate-800 font-black">Rp {fixedGroup[key].toLocaleString('id-ID')}</span></div>
              ))}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 font-black"><span className="text-slate-800">TOTAL FIXED</span><span className="text-purple-600">Rp {totalFixed.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>

        {/* TABEL VARIABLE */}
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-3">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Pengeluaran Variabel (Jajan)</p>
          {Object.keys(varGroup).length === 0 ? <p className="text-xs text-slate-400 italic">Kosong</p> : (
            <div className="space-y-2">
              {Object.keys(varGroup).map((key, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 last:border-0 last:pb-0"><span className="text-slate-600 font-bold">{key}</span><span className="text-slate-800 font-black">Rp {varGroup[key].toLocaleString('id-ID')}</span></div>
              ))}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 font-black"><span className="text-slate-800">TOTAL VARIABEL</span><span className="text-orange-600">Rp {totalVar.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm px-1">Rincian Pemasukan</h3>
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-3">
          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Detail Pemasukan</p>
          {incomeCategoryList.length === 0 ? <p className="text-xs text-slate-400 italic">Tidak ada pemasukan</p> : (
            <div className="space-y-2">
              {incomeCategoryList.map((data, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 last:border-0 last:pb-0"><span className="text-slate-600 font-bold">{data.name}</span><span className="text-slate-800 font-black">Rp {data.value.toLocaleString('id-ID')}</span></div>
              ))}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 font-black"><span className="text-slate-800">TOTAL PEMASUKAN</span><span className="text-green-600">Rp {totalIncome.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Grafik Donat (Semua Pengeluaran)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {barData.length > 0 && (
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm animate-in">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Grafik Harian</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="date" fontSize={10} tickMargin={10} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}