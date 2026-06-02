"use client";
import { useState, useEffect } from "react";
import { Upload, Check, X, ArrowUp, ArrowDown, Edit2, Trash2, CreditCard, Smartphone, Banknote, Wallet } from "lucide-react";
import { AccountData, WalletTypeData } from "../../types";

const getCardDesign = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("bank") || t.includes("kartu") || t.includes("credit") || t.includes("savings")) {
    return { 
      bg: "bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-800", 
      icon: <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />, 
      iconBg: "bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50",
      chip: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800", 
      progressBar: "bg-blue-500"
    };
  } else if (t.includes("wallet") || t.includes("gopay") || t.includes("ovo") || t.includes("dana") || t.includes("pay")) {
    return { 
      bg: "bg-white dark:bg-slate-900 border-2 border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-800", 
      icon: <Smartphone size={18} className="text-purple-600 dark:text-purple-400" />, 
      iconBg: "bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/50",
      chip: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800",
      progressBar: "bg-purple-500" 
    };
  } else if (t.includes("cash") || t.includes("dompet") || t.includes("tunai")) {
    return { 
      bg: "bg-white dark:bg-slate-900 border-2 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-800", 
      icon: <Banknote size={18} className="text-emerald-600 dark:text-emerald-400" />, 
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50",
      chip: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800",
      progressBar: "bg-emerald-500" 
    };
  } else {
    return { 
      bg: "bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700", 
      icon: <Wallet size={18} className="text-slate-600 dark:text-slate-400" />, 
      iconBg: "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50",
      chip: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
      progressBar: "bg-slate-500" 
    };
  }
};

const safeEvaluate = (expr: string): number => {
  if (!expr) return 0;
  let sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return 0;
  sanitized = sanitized.replace(/[+\-*/(.]*$/, "");
  if (!sanitized) return 0;
  try {
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result === "number" && isFinite(result)) return result;
    return 0;
  } catch {
    const fallback = parseFloat(sanitized);
    return isNaN(fallback) ? 0 : fallback;
  }
};

const getGoalStatus = (percentage: number) => {
  if (percentage >= 100) return { label: "✨ Selesai!", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-250 dark:border-emerald-800/50" };
  if (percentage >= 75) return { label: "🚀 Sikit Lagi!", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50" };
  if (percentage >= 40) return { label: "🔥 On Track", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50" };
  return { label: "🌱 Berjuang!", color: "text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700/50" };
};

interface AssetsTabProps {
  accounts: AccountData[]; walletTypes: WalletTypeData[];
  accType: string; setAccType: (val: string) => void;
  accName: string; setAccName: (val: string) => void;
  accBalance: string; setAccBalance: (val: string) => void;
  accLogo: string; handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit?: boolean) => void;
  accIsSavings: boolean; setAccIsSavings: (val: boolean) => void; 
  accTargetBalance: string; setAccTargetBalance: (val: string) => void;
  accExcludeFromTotal: boolean; setAccExcludeFromTotal: (val: boolean) => void;
  editAccExcludeFromTotal: boolean; setEditAccExcludeFromTotal: (val: boolean) => void;
  handleCreateAccount: () => void;
  editingAccId: string | null; setEditingAccId: (val: string | null) => void;
  editAccName: string; setEditAccName: (val: string) => void;
  editAccBalance: string; setEditAccBalance: (val: string) => void;
  editAccLogo: string; setEditAccLogo: (val: string) => void;
  editAccIsSavings: boolean; setEditAccIsSavings: (val: boolean) => void; 
  editAccTargetBalance: string; setEditAccTargetBalance: (val: string) => void;
  handleEditAccount: (id: string) => void;
  deleteAccount: (id: string, name: string) => void;
  moveAccountOrder: (index: number, direction: "up" | "down") => void;
}

export default function AssetsTab({
  accounts, walletTypes, accType, setAccType, accName, setAccName, accBalance, setAccBalance, accLogo, handleLogoUpload, accIsSavings, setAccIsSavings, accTargetBalance, setAccTargetBalance, 
  accExcludeFromTotal, setAccExcludeFromTotal, editAccExcludeFromTotal, setEditAccExcludeFromTotal,
  handleCreateAccount, editingAccId, setEditingAccId, editAccName, setEditAccName, editAccBalance, setEditAccBalance, editAccLogo, setEditAccLogo, editAccIsSavings, setEditAccIsSavings, editAccTargetBalance, setEditAccTargetBalance, handleEditAccount, deleteAccount, moveAccountOrder
}: AssetsTabProps) {
  
  const [isManageOpen, setIsManageOpen] = useState(false);

  useEffect(() => {
    if (editingAccId) setIsManageOpen(true);
  }, [editingAccId]);

  const activeAccounts = accounts.filter((a: AccountData) => !a.isSavings);
  const savingsAccounts = accounts.filter((a: AccountData) => a.isSavings);
  
  // FILTER OUT YANG EXCLUDE DARI TOTAL
  const totalActiveBalance = activeAccounts.reduce((accVal: number, curr: AccountData) => {
    if (curr.excludeFromTotal) return accVal;
    return accVal + curr.balance;
  }, 0);

  // LOGIKA BARU: HITUNG TOTAL DARI SEMUA DOMPET YANG DIKECUALIKAN
  const totalExcludedBalance = activeAccounts.reduce((accVal: number, curr: AccountData) => {
    if (curr.excludeFromTotal) return accVal + curr.balance;
    return accVal;
  }, 0);

  const totalSavingsBalance = savingsAccounts.reduce((accVal: number, curr: AccountData) => accVal + curr.balance, 0);

  // KONDISI INTEGRASI BARU: AKUMULASI TARGET IMPIAN MENABUNG
  const savingsWithTargets = savingsAccounts.filter(a => a.targetBalance && a.targetBalance > 0);
  const totalTargetAmount = savingsWithTargets.reduce((sum, a) => sum + (a.targetBalance || 0), 0);
  const totalSavedAmount = savingsWithTargets.reduce((sum, a) => sum + a.balance, 0);
  const overallPercentage = totalTargetAmount > 0 ? Math.min((totalSavedAmount / totalTargetAmount) * 105, 100) : 0;

  const formatRupiahTerbaca = (val: string) => {
    if (!val) return "Rp 0";
    const parsed = safeEvaluate(val);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parsed);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* TOTAL BALANCE CARD DENGAN VISUALISASI SALDO TERPISAH */}
      <div className="bg-blue-600 p-8 md:p-10 rounded-[35px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-4 -right-4 p-8 opacity-10"><CreditCard size={120} /></div>
        
        <p className="text-blue-100 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Total Uang Bisa Dipakai</p>
        <h2 className="text-4xl md:text-5xl font-black italic relative z-10">Rp {totalActiveBalance.toLocaleString('id-ID')}</h2>
        
        {/* SUB-INFORMASI SALDO TERPISAH YANG DIKECUALIKAN */}
        {totalExcludedBalance > 0 && (
          <div className="mt-5 pt-4 border-t border-blue-500/40 flex justify-between items-center text-xs text-blue-100 font-bold z-10 relative animate-in fade-in duration-200">
            <span className="opacity-85">Total Saldo Terpisah (Dikecualikan):</span>
            <span className="text-sm font-black">Rp {totalExcludedBalance.toLocaleString('id-ID')}</span>
          </div>
        )}
      </div>

      {/* DOMPET AKTIF DENGAN GRID DESKTOP (4 KOLOM) */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 italic px-1 text-lg transition-colors">Dompet Aktif</h3>
        {activeAccounts.length === 0 ? <p className="text-center py-6 text-slate-400 text-sm italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">Belum ada dompet aktif</p> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {activeAccounts.map((acc: AccountData) => {
              const design = getCardDesign(acc.type);
              return (
                <div key={acc.id} className={`${design.bg} p-4 md:p-5 rounded-[24px] flex flex-col justify-between transition-all duration-200 shadow-sm min-h-[120px] md:min-h-[135px]`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      {acc.logo ? (
                        <img src={acc.logo} alt="custom-logo" className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-contain bg-white p-1 border border-slate-100 shadow-sm" /> 
                      ) : (
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${design.iconBg}`}>{design.icon}</div>
                      )}
                      <div className={`px-2 py-1 rounded-md text-[8px] md:text-[10px] font-black uppercase tracking-widest ${design.chip}`}>{acc.type}</div>
                    </div>
                    
                    <div className="space-y-0.5 mt-auto">
                      <div className="flex items-center mb-1.5">
                        <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 tracking-tight leading-none mb-1 truncate text-left">{acc.name}</p>
                        {acc.excludeFromTotal && <span className="text-[7px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded ml-1.5 uppercase font-black shrink-0 tracking-widest border border-slate-200 dark:border-slate-700">Dikecualikan</span>}
                      </div>
                      <p className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none truncate text-left">Rp {acc.balance.toLocaleString('id-ID')}</p>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TABUNGAN KHUSUS DENGAN WIDGET TARGET IMPIAN MENABUNG */}
      {savingsAccounts.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-end px-1">
             <h3 className="font-bold text-slate-800 dark:text-slate-100 italic text-lg transition-colors">Tabungan Saya</h3>
             <span className="text-[10px] md:text-xs font-black text-emerald-600 dark:text-emerald-400">Total Saldo: Rp {totalSavingsBalance.toLocaleString('id-ID')}</span>
          </div>

          {/* WIDGET AKUMULASI TARGET IMPIAN */}
          {savingsWithTargets.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[30px] text-white shadow-lg relative overflow-hidden transition-all duration-300">
              <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <CreditCard size={120} />
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-left">
                  <p className="text-emerald-100 text-[10px] uppercase tracking-widest font-bold mb-1">Akumulasi Target Impian</p>
                  <h3 className="text-2xl font-black">Rp {totalSavedAmount.toLocaleString('id-ID')}</h3>
                </div>
                <span className="bg-emerald-400/30 text-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-emerald-300/20">
                  {overallPercentage.toFixed(0)}% Terkumpul
                </span>
              </div>
              <div className="w-full h-2.5 bg-emerald-700/50 rounded-full overflow-hidden border border-emerald-500/20 mb-2">
                <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out" style={{ width: `${overallPercentage}%` }}></div>
              </div>
              <p className="text-[10px] text-emerald-100/95 font-bold text-left leading-relaxed">
                Telah terkumpul <span className="font-black text-white">Rp {totalSavedAmount.toLocaleString('id-ID')}</span> dari target <span className="font-black text-white">Rp {totalTargetAmount.toLocaleString('id-ID')}</span> untuk rencana masa depan Anda.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {savingsAccounts.map((acc: AccountData) => {
              const design = getCardDesign(acc.type);
              const hasTarget = acc.targetBalance && acc.targetBalance > 0;
              const percentage = hasTarget ? Math.min((acc.balance / acc.targetBalance!) * 100, 100) : 0;
              const remaining = hasTarget ? Math.max(0, acc.targetBalance! - acc.balance) : 0;
              const status = getGoalStatus(percentage);

              return (
                <div key={acc.id} className={`${design.bg} p-4 md:p-5 rounded-[24px] flex flex-col justify-between transition-all duration-200 shadow-sm min-h-[130px] md:min-h-[145px]`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      {acc.logo ? (
                        <img src={acc.logo} alt="custom-logo" className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-contain bg-white p-1 border border-slate-100 shadow-sm" /> 
                      ) : (
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${design.iconBg}`}>{design.icon}</div>
                      )}
                      {hasTarget ? (
                        <div className={`text-[9px] md:text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest border ${status.color}`}>
                          {status.label} • {percentage.toFixed(0)}%
                        </div>
                      ) : (
                        <div className="text-[9px] md:text-[10px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">No Target</div>
                      )}
                    </div>
                    
                    <div className="space-y-1 mt-auto w-full">
                      <div className="flex justify-between items-end">
                        <div className="text-left">
                          <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 tracking-tight leading-none mb-1.5">{acc.name}</p>
                          <p className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none truncate">Rp {acc.balance.toLocaleString('id-ID')}</p>
                        </div>
                        {hasTarget && (
                          <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 font-bold">Target: Rp {acc.targetBalance!.toLocaleString('id-ID')}</span>
                        )}
                      </div>

                      {hasTarget && (
                        <div className="w-full mt-2 space-y-1.5">
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div className={`h-full ${percentage >= 100 ? 'bg-emerald-500' : design.progressBar} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          {remaining > 0 ? (
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold text-right leading-none">
                              Kurang Rp {remaining.toLocaleString('id-ID')} lagi
                            </p>
                          ) : (
                            <p className="text-[9px] text-emerald-500 dark:text-emerald-400 font-black text-right uppercase tracking-wider leading-none">
                              Target Terpenuhi! 🎉
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KELOLA AKUN */}
      <details 
        open={isManageOpen} 
        onToggle={(e) => setIsManageOpen(e.currentTarget.open)}
        className="bg-white dark:bg-slate-900 rounded-[25px] p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200"
      >
        <summary className="text-[10px] font-black text-slate-500 dark:text-slate-400 cursor-pointer uppercase tracking-widest outline-none select-none flex items-center gap-2">
          <span>⚙️ Kelola Akun & Dompet</span>
        </summary>
        <div className="mt-5 space-y-4">
          
          {/* FORM TAMBAH DOMPET BARU */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3">Tambah Dompet Baru</h4>
            <select className="w-full p-3.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-transparent dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-slate-200 cursor-pointer" value={accType} onChange={(e) => setAccType(e.target.value)}>
                {walletTypes.map((t: WalletTypeData) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <input type="text" placeholder="Nama Dompet (BCA, Gopay, dll)" className="w-full p-3.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-transparent dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-slate-200" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <input type="number" placeholder="Saldo Awal" className="w-full p-3.5 bg-white dark:bg-slate-900 rounded-xl text-xs border border-transparent dark:border-slate-700 outline-none font-bold text-slate-700 dark:text-slate-200" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
            
            <div onClick={() => setAccExcludeFromTotal(!accExcludeFromTotal)} className="flex items-center gap-2 pt-1 cursor-pointer select-none">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${accExcludeFromTotal ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>{accExcludeFromTotal && <Check size={10} strokeWidth={4} />}</div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Sembunyikan dari "Total Uang Bisa Dipakai" (Pemisahan Saldo)</span>
            </div>

            <div onClick={() => setAccIsSavings(!accIsSavings)} className="flex items-center gap-2 pt-1 pb-1 cursor-pointer select-none">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${accIsSavings ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>{accIsSavings && <Check size={10} strokeWidth={4} />}</div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Jadikan Kategori "Tabungan" di bagian bawah</span>
            </div>

            {accIsSavings && (
              <div className="space-y-1">
                <input type="text" placeholder="Target Nominal Tabungan (Opsional)" className="w-full p-3.5 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-emerald-800 dark:text-emerald-400 placeholder-emerald-300 dark:placeholder-emerald-800" value={accTargetBalance} onChange={(e) => setAccTargetBalance(e.target.value)} />
                {accTargetBalance && <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className="font-black">{formatRupiahTerbaca(accTargetBalance)}</span></p>}
              </div>
            )}

            <div className="flex flex-col gap-1 pt-1 text-left">
              <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Upload Logo Dompet (Opsional)</label>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, false)} className="hidden" id="custom-logo-file" />
                <label htmlFor="custom-logo-file" className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"><Upload size={14}/> Pilih File</label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{accLogo ? "Logo Siap Diunggah ✅" : "Format PNG/JPG (Maks 500KB)"}</span>
              </div>
            </div>
            <button onClick={handleCreateAccount} className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer transition-colors">Simpan Dompet Baru</button>
          </div>

          {/* DAFTAR EDIT DOMPET */}
          <div className="pt-4 space-y-3">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 text-left">Daftar Dompet (Ubah / Urutan / Hapus)</p>
            {accounts.map((acc: AccountData, index: number) => (
              <div key={acc.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl flex flex-col gap-3 border border-slate-100 dark:border-slate-800 transition-colors duration-200">
                {editingAccId === acc.id ? (
                  <div className="space-y-3 animate-in fade-in duration-200 text-left">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubah Nama Dompet</label><input className="w-full bg-white dark:bg-slate-900 p-3 text-xs rounded-xl border border-blue-200 dark:border-blue-900/50 outline-none font-bold text-slate-700 dark:text-slate-200" value={editAccName} onChange={(e) => setEditAccName(e.target.value)} /></div>
                    
                    <div className="space-y-1 bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <label className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Audit Saldo Nyata (Real)</label>
                      <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight mb-2">
                        Ubah jika uang fisik Anda berbeda. Sistem akan otomatis mencatat selisihnya sebagai Penyesuaian.
                      </p>
                      <input type="number" className="w-full bg-white dark:bg-slate-900 p-3 text-xs rounded-xl border border-blue-200 dark:border-blue-800 outline-none font-bold text-slate-700 dark:text-slate-200" value={editAccBalance} onChange={(e) => setEditAccBalance(e.target.value)} />
                    </div>
                    
                    <div onClick={() => setEditAccExcludeFromTotal(!editAccExcludeFromTotal)} className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${editAccExcludeFromTotal ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>{editAccExcludeFromTotal && <Check size={10} strokeWidth={4} />}</div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Sembunyikan dari Total Saldo (Pemisahan Saldo)</span>
                    </div>

                    <div onClick={() => setEditAccIsSavings(!editAccIsSavings)} className="flex items-center gap-2 pt-1 pb-1 cursor-pointer select-none">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${editAccIsSavings ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900'}`}>{editAccIsSavings && <Check size={10} strokeWidth={4} />}</div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Jadikan Kategori "Tabungan"</span>
                    </div>

                    {editAccIsSavings && (
                      <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubah Target Tabungan</label>
                        <input type="text" placeholder="Target Nominal Tabungan" className="w-full bg-white dark:bg-slate-900 p-3 text-xs border border-blue-200 dark:border-slate-700 rounded-xl outline-none font-bold text-emerald-800 dark:text-emerald-400 placeholder-emerald-300 dark:placeholder-emerald-800" value={editAccTargetBalance} onChange={(e) => setEditAccTargetBalance(e.target.value)} />
                        {editAccTargetBalance && <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className="font-black">{formatRupiahTerbaca(editAccTargetBalance)}</span></p>}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubah Logo Dompet</label>
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} className="hidden" id={`edit-logo-file-${acc.id}`} /><label htmlFor={`edit-logo-file-${acc.id}`} className="cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700"><Upload size={14}/> Ganti Logo</label>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{editAccLogo ? "Logo Baru Terpasang ✅" : "Logo lama tetap aktif"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleEditAccount(acc.id)} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"><Check size={14}/> Simpan Perubahan</button>
                      <button onClick={() => setEditingAccId(null)} className="py-3 px-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750"><X size={14}/> Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-left">
                      {acc.logo ? ( <img src={acc.logo} className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 dark:border-slate-700 p-1 shadow-sm" alt="logo" /> ) : ( <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400">{getCardDesign(acc.type).icon}</div> )}
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{acc.name}</p>
                          {acc.isSavings && <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Tabungan</span>}
                          {acc.excludeFromTotal && <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Terpisah</span>}
                        </div>
                        <p className="text-xs font-black text-blue-600 dark:text-blue-400 leading-none mb-1">Rp {acc.balance.toLocaleString("id-ID")}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{acc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveAccountOrder(index, "up")} disabled={index === 0} className={`p-2 rounded-xl bg-white dark:bg-slate-900 border cursor-pointer ${index === 0 ? "text-slate-200 border-slate-100 dark:border-slate-850 dark:text-slate-800" : "text-slate-500 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400"}`}><ArrowUp size={14}/></button>
                      <button onClick={() => moveAccountOrder(index, "down")} disabled={index === accounts.length - 1} className={`p-2 rounded-xl bg-white dark:bg-slate-900 border cursor-pointer ${index === accounts.length - 1 ? "text-slate-200 border-slate-100 dark:border-slate-850 dark:text-slate-800" : "text-slate-500 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400"}`}><ArrowDown size={14}/></button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                      <button onClick={() => { setEditingAccId(acc.id); setEditAccName(acc.name); setEditAccBalance(acc.balance.toString()); setEditAccLogo(acc.logo || ""); setEditAccIsSavings(!!acc.isSavings); setEditAccTargetBalance(acc.targetBalance?.toString() || ""); setEditAccExcludeFromTotal(!!acc.excludeFromTotal); }} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:border-blue-800 cursor-pointer transition-colors"><Edit2 size={14}/></button>
                      <button onClick={() => deleteAccount(acc.id, acc.name)} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-300 dark:text-slate-400 dark:hover:text-red-400 dark:hover:border-red-800 cursor-pointer transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}