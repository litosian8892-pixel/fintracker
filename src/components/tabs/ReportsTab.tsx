"use client";
import { Download } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

// Custom Tooltip Recharts dari page Anda
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
  reportMonth: string;
  setReportMonth: (val: string) => void;
  handleExportToExcel: () => void;
  totalIncome: number;
  totalExpense: number;
  pieData: { name: string; value: number }[];
  incomeCategoryList: { name: string; value: number }[];
  barData: { date: string; amount: number }[];
}

export default function ReportsTab({
  reportMonth, setReportMonth, handleExportToExcel,
  totalIncome, totalExpense, pieData, incomeCategoryList, barData
}: ReportsTabProps) {
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
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-5 rounded-3xl border border-green-100"><p className="text-[10px] font-bold text-green-600 uppercase mb-1">Pemasukan</p><p className="text-lg font-black text-green-700">Rp {totalIncome.toLocaleString('id-ID')}</p></div>
        <div className="bg-red-50 p-5 rounded-3xl border border-red-100"><p className="text-[10px] font-bold text-red-600 uppercase mb-1">Pengeluaran</p><p className="text-lg font-black text-red-700">Rp {totalExpense.toLocaleString('id-ID')}</p></div>
      </div>

      {pieData.length > 0 ? (
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Pengeluaran per Kategori</h3>
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
          <div className="mt-4 space-y-2">
            {pieData.map((data, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div><span className="text-slate-600">{data.name}</span></div><span className="text-slate-800">Rp {data.value.toLocaleString('id-ID')}</span></div>
            ))}
          </div>
        </div>
      ) : <div className="bg-white p-10 rounded-[30px] text-center text-slate-400 text-sm italic border border-slate-200">Belum ada pengeluaran di bulan ini.</div>}
      
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm px-1">Rincian Per Kategori</h3>
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-3">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Detail Pengeluaran</p>
          {pieData.length === 0 ? <p className="text-xs text-slate-400 italic">Tidak ada pengeluaran</p> : (
            <div className="space-y-2">
              {pieData.map((data, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 last:border-0 last:pb-0"><span className="text-slate-600 font-bold">{data.name}</span><span className="text-slate-800 font-black">Rp {data.value.toLocaleString('id-ID')}</span></div>
              ))}
              <div className="flex justify-between items-center text-xs pt-3 border-t border-dashed border-slate-200 font-black"><span className="text-slate-800">TOTAL PENGELUARAN</span><span className="text-red-600">Rp {totalExpense.toLocaleString('id-ID')}</span></div>
            </div>
          )}
        </div>
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