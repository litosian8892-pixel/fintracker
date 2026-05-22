"use client";
import { Upload, Check, X, ArrowUp, ArrowDown, Edit2, Trash2, CreditCard, Smartphone, Banknote, HelpCircle } from "lucide-react";
import { AccountData, WalletTypeData } from "../../types";

// Helper Design Kartu dipindahkan ke sini agar rapi
const getCardDesign = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("bank") || t.includes("kartu") || t.includes("credit") || t.includes("savings")) {
    return { bg: "bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-white shadow-lg", icon: <CreditCard size={14} />, chip: "bg-amber-400/20 border border-amber-300/30", textMuted: "text-blue-200/50" };
  } else if (t.includes("wallet") || t.includes("gopay") || t.includes("ovo") || t.includes("dana") || t.includes("pay")) {
    return { bg: "bg-gradient-to-br from-purple-900 via-violet-850 to-pink-950 text-white shadow-lg", icon: <Smartphone size={14} />, chip: "bg-pink-400/20 border border-pink-300/30", textMuted: "text-purple-200/50" };
  } else if (t.includes("cash") || t.includes("dompet") || t.includes("tunai")) {
    return { bg: "bg-gradient-to-br from-teal-900 via-emerald-900 to-green-950 text-white shadow-lg", icon: <Banknote size={14} />, chip: "bg-yellow-400/20 border border-yellow-300/30", textMuted: "text-emerald-200/50" };
  } else {
    return { bg: "bg-gradient-to-br from-slate-800 via-slate-900 to-neutral-950 text-white shadow-lg", icon: <HelpCircle size={14} />, chip: "bg-slate-400/20 border border-slate-300/30", textMuted: "text-slate-300/50" };
  }
};

interface AssetsTabProps {
  accounts: AccountData[];
  walletTypes: WalletTypeData[];
  accType: string;
  setAccType: (val: string) => void;
  accName: string;
  setAccName: (val: string) => void;
  accBalance: string;
  setAccBalance: (val: string) => void;
  accLogo: string;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit?: boolean) => void;
  handleCreateAccount: () => void;
  editingAccId: string | null;
  setEditingAccId: (val: string | null) => void;
  editAccName: string;
  setEditAccName: (val: string) => void;
  editAccBalance: string;
  setEditAccBalance: (val: string) => void;
  editAccLogo: string;
  setEditAccLogo: (val: string) => void;
  handleEditAccount: (id: string) => void;
  deleteAccount: (id: string, name: string) => void;
  moveAccountOrder: (index: number, direction: "up" | "down") => void;
}

export default function AssetsTab({
  accounts, walletTypes, accType, setAccType, accName, setAccName, accBalance, setAccBalance, accLogo, handleLogoUpload, handleCreateAccount,
  editingAccId, setEditingAccId, editAccName, setEditAccName, editAccBalance, setEditAccBalance, editAccLogo, setEditAccLogo, handleEditAccount, deleteAccount, moveAccountOrder
}: AssetsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-blue-600 p-8 rounded-[35px] text-white shadow-2xl">
        <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Balance</p>
        <h2 className="text-4xl font-black italic">Rp {accounts.reduce((a, b) => a + b.balance, 0).toLocaleString('id-ID')}</h2>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 italic px-1 text-lg">Dompet Saya</h3>
        {accounts.length === 0 ? <p className="text-center py-10 text-slate-400 text-sm italic">Belum ada dompet aktif</p> : (
          <div className="grid grid-cols-3 gap-2.5">
            {accounts.map((acc) => {
              const design = getCardDesign(acc.type);
              return (
                <div key={acc.id} className={`${design.bg} p-3 rounded-[20px] h-28 flex flex-col justify-between relative overflow-hidden active:scale-95`}>
                    <div className="absolute -top-8 -right-8 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
                    <div className="flex justify-between items-start">
                      {acc.logo ? <img src={acc.logo} alt="custom-logo" className="w-6 h-6 rounded-lg object-contain bg-white/90 p-0.5 border border-white/20 shadow-sm" /> : (
                        <div className="w-6 h-6 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">{design.icon}</div>
                      )}
                      <div className={`w-5 h-3.5 rounded-sm ${design.chip}`}></div>
                    </div>
                    <div className="space-y-0.5 mt-auto z-10">
                      <p className="text-xs font-black tracking-tight leading-none truncate">{acc.name}</p>
                      <p className={`text-[8px] font-bold uppercase tracking-widest leading-none ${design.textMuted}`}>{acc.type}</p>
                      <p className="text-[10px] font-black tracking-tight pt-0.5 whitespace-nowrap overflow-hidden">Rp{acc.balance.toLocaleString('id-ID')}</p>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <details className="bg-slate-200/50 rounded-[25px] p-5 border border-slate-200/50">
        <summary className="text-[10px] font-black text-slate-500 cursor-pointer uppercase tracking-widest outline-none">⚙️ Kelola Akun & Dompet</summary>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <select className="w-full p-3 bg-white rounded-xl text-xs border-none outline-none font-bold" value={accType} onChange={(e) => setAccType(e.target.value)}>
                {walletTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <input type="text" placeholder="Nama Dompet (BCA, Gopay, dll)" className="w-full p-3 bg-white rounded-xl text-xs border-none outline-none font-bold" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <input type="number" placeholder="Saldo Awal" className="w-full p-3 bg-white rounded-xl text-xs border-none outline-none font-bold" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
            <div className="flex flex-col gap-1 pt-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Upload Logo Dompet (Opsional)</label>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-dashed border-slate-300">
                <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, false)} className="hidden" id="custom-logo-file" />
                <label htmlFor="custom-logo-file" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"><Upload size={14}/> Pilih File</label>
                <span className="text-[10px] text-slate-400 truncate">{accLogo ? "Logo Siap Diunggah ✅" : "Format PNG/JPG (Maks 500KB)"}</span>
              </div>
            </div>
            <button onClick={handleCreateAccount} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg">Simpan Dompet</button>
          </div>
          <div className="pt-4 border-t border-slate-300/30 space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Daftar Dompet (Ubah / Urutan / Hapus)</p>
            {accounts.map((acc, index) => (
              <div key={acc.id} className="bg-white p-4 rounded-xl flex flex-col gap-3 shadow-sm border border-slate-100">
                {editingAccId === acc.id ? (
                  <div className="space-y-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubah Nama Dompet</label><input className="w-full bg-slate-50 p-2.5 text-xs rounded-xl border border-blue-200 outline-none font-bold" value={editAccName} onChange={(e) => setEditAccName(e.target.value)} /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubah Saldo Dompet</label><input type="number" className="w-full bg-slate-50 p-2.5 text-xs rounded-xl border border-blue-200 outline-none font-bold" value={editAccBalance} onChange={(e) => setEditAccBalance(e.target.value)} /></div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubah Logo Dompet</label>
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-dashed border-slate-300">
                        <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} className="hidden" id={`edit-logo-file-${acc.id}`} /><label htmlFor={`edit-logo-file-${acc.id}`} className="cursor-pointer bg-white text-slate-600 p-2 rounded-lg text-xs font-bold flex items-center gap-2"><Upload size={14}/> Ganti Logo</label>
                        <span className="text-[10px] text-slate-400 truncate">{editAccLogo ? "Logo Baru Terpasang ✅" : "Logo lama tetap aktif"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleEditAccount(acc.id)} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Check size={14}/> Simpan</button>
                      <button onClick={() => setEditingAccId(null)} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><X size={14}/> Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {acc.logo ? <img src={acc.logo} className="w-8 h-8 rounded-lg object-contain bg-slate-100 p-1" alt="logo" /> : <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">{getCardDesign(acc.type).icon}</div>}
                      <div>
                        <p className="text-xs font-bold text-slate-700 leading-none mb-1">{acc.name}</p>
                        <p className="text-[10px] font-black text-blue-600 leading-none">Rp {acc.balance.toLocaleString('id-ID')}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{acc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveAccountOrder(index, "up")} disabled={index === 0} className={`p-1.5 rounded-lg border ${index === 0 ? "text-slate-200 border-slate-100" : "text-slate-400 border-slate-200 hover:bg-slate-100"}`}><ArrowUp size={12}/></button>
                      <button onClick={() => moveAccountOrder(index, "down")} disabled={index === accounts.length - 1} className={`p-1.5 rounded-lg border ${index === accounts.length - 1 ? "text-slate-200 border-slate-100" : "text-slate-400 border-slate-200 hover:bg-slate-100"}`}><ArrowDown size={12}/></button>
                      <button onClick={() => { setEditingAccId(acc.id); setEditAccName(acc.name); setEditAccBalance(acc.balance.toString()); setEditAccLogo(acc.logo || ""); }} className="text-slate-300 hover:text-blue-500 p-1.5"><Edit2 size={12}/></button>
                      <button onClick={() => deleteAccount(acc.id, acc.name)} className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 size={12}/></button>
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