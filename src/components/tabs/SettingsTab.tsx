"use client";
import { useState } from "react";
import { User } from "firebase/auth";
import { LogOut, Tag, CreditCard, X, Edit2, Check } from "lucide-react";
import { CategoryData, WalletTypeData } from "../../types";

interface SettingsTabProps {
  user: User | null; onLogout: () => void;
  tType: "income" | "expense" | "transfer"; setTType: (val: "income" | "expense" | "transfer") => void;
  newCatName: string; setNewCatName: (val: string) => void; addCustomCategory: () => void;
  categories: CategoryData[]; deleteCategory: (id: string) => void;
  updateCategory: (id: string, name: string, limit: number) => void; // <--- PROPS DIUBAH
  newWalletTypeName: string; setNewWalletTypeName: (val: string) => void;
  addCustomWalletType: () => void; walletTypes: WalletTypeData[]; deleteWalletType: (id: string) => void;
}

export default function SettingsTab({
  user, onLogout, tType, setTType, newCatName, setNewCatName, addCustomCategory,
  categories, deleteCategory, updateCategory, newWalletTypeName, setNewWalletTypeName, addCustomWalletType, walletTypes, deleteWalletType
}: SettingsTabProps) {
  
  // STATE KHUSUS UNTUK EDIT KATEGORI
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatBudget, setEditCatBudget] = useState("");

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
        <img src={user?.photoURL || ""} className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-lg" alt="Profile" />
        <div>
          <h3 className="font-black text-lg text-slate-800">{user?.displayName}</h3>
          <p className="text-xs text-slate-400 font-semibold">{user?.email}</p>
        </div>
        <button onClick={onLogout} className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2"><LogOut size={14}/> Logout</button>
      </div>

      <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Tag size={16} className="text-blue-600"/> Kelola Kategori ({tType})</h3>
        <div className="flex gap-2">
          <button onClick={() => setTType("expense")} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${tType === "expense" ? "bg-red-500 text-white shadow-md" : "bg-slate-100"}`}>PENGELUARAN</button>
          <button onClick={() => setTType("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "income" ? "bg-green-500 text-white shadow-md" : "bg-slate-100"}`}>PEMASUKAN</button>
        </div>
        <div className="flex gap-2">
          <input type="text" placeholder="Kategori Baru..." className="flex-1 p-3 bg-slate-50 rounded-xl text-xs outline-blue-500" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
          <button onClick={addCustomCategory} className="bg-blue-600 text-white px-4 rounded-xl text-xs font-bold">Tambah</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
          {categories.filter(c => c.type === tType).map(cat => (
            <div key={cat.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              
              {/* JIKA SEDANG DI-EDIT */}
              {editingCatId === cat.id ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Nama Kategori" 
                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs outline-blue-500 font-bold" 
                    value={editCatName} 
                    onChange={e => setEditCatName(e.target.value)} 
                  />
                  {tType === 'expense' && (
                    <input 
                      type="number" 
                      placeholder="Batas Budget (Rp)" 
                      className="w-full p-2 bg-white border border-blue-200 rounded-lg text-xs outline-blue-500 font-bold" 
                      value={editCatBudget} 
                      onChange={e => setEditCatBudget(e.target.value)} 
                    />
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => {
                      updateCategory(cat.id, editCatName, Number(editCatBudget));
                      setEditingCatId(null);
                    }} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Check size={12}/> Simpan</button>
                    <button onClick={() => setEditingCatId(null)} className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><X size={12}/> Batal</button>
                  </div>
                </div>
              ) : (
                /* TAMPILAN NORMAL */
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                    {tType === 'expense' && (
                        <span className="text-[10px] font-bold text-blue-600">
                          Budget: {cat.budgetLimit && cat.budgetLimit > 0 ? `Rp ${cat.budgetLimit.toLocaleString('id-ID')}` : 'Belum Diatur'}
                        </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => {
                        setEditingCatId(cat.id);
                        setEditCatName(cat.name);
                        setEditCatBudget(cat.budgetLimit?.toString() || "");
                    }} className="text-blue-500 hover:text-white p-1.5 hover:bg-blue-500 rounded-lg transition-colors border border-blue-100">
                        <Edit2 size={12}/>
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:text-white p-1.5 hover:bg-red-500 rounded-lg transition-colors border border-red-100">
                        <X size={12}/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><CreditCard size={16} className="text-blue-600"/> Kelola Tipe Dompet</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="Kategori dompet (Misal: Investasi)" className="flex-1 p-3 bg-slate-50 rounded-xl text-xs outline-blue-500" value={newWalletTypeName} onChange={(e) => setNewWalletTypeName(e.target.value)} />
          <button onClick={addCustomWalletType} className="bg-blue-600 text-white px-4 rounded-lg text-xs font-bold">Tambah</button>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {walletTypes.map(t => (
            <span key={t.id} className="bg-slate-100 px-3 py-1.5 rounded-full text-[9px] font-bold flex items-center gap-2 border shadow-sm">
              {t.name} <X size={12} className="text-red-500 cursor-pointer hover:scale-125" onClick={() => deleteWalletType(t.id)}/>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}