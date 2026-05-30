"use client";
import { useState } from "react";
import { User } from "firebase/auth";
import { LogOut, Tag, CreditCard, X, Edit2, Check, Sun, Moon, Monitor } from "lucide-react";
import { CategoryData, WalletTypeData } from "../../types";

interface SettingsTabProps {
  user: User | null; onLogout: () => void;
  tType: "income" | "expense" | "transfer"; setTType: (val: "income" | "expense" | "transfer") => void;
  newCatName: string; setNewCatName: (val: string) => void; 
  newExpenseType: "fixed" | "variable"; setNewExpenseType: (val: "fixed" | "variable") => void;
  addCustomCategory: () => void;
  categories: CategoryData[]; deleteCategory: (id: string) => void;
  updateCategory: (id: string, name: string, limit: number, expenseType: "fixed" | "variable") => void;
  newWalletTypeName: string; setNewWalletTypeName: (val: string) => void;
  addCustomWalletType: () => void; walletTypes: WalletTypeData[]; deleteWalletType: (id: string) => void;
  theme: "light" | "dark" | "system"; setTheme: (theme: "light" | "dark" | "system") => void;
}

export default function SettingsTab({
  user, onLogout, tType, setTType, newCatName, setNewCatName, newExpenseType, setNewExpenseType, addCustomCategory,
  categories, deleteCategory, updateCategory, newWalletTypeName, setNewWalletTypeName, addCustomWalletType, walletTypes, deleteWalletType,
  theme, setTheme
}: SettingsTabProps) {
  
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatBudget, setEditCatBudget] = useState("");
  const [editCatExpType, setEditCatExpType] = useState<"fixed" | "variable">("variable");

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* CARD PROFIL USER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4 transition-colors duration-200">
        <img src={user?.photoURL || ""} className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-lg" alt="Profile" />
        <div>
          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">{user?.displayName}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{user?.email}</p>
        </div>
        <button onClick={onLogout} className="px-6 py-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"><LogOut size={14}/> Logout</button>
      </div>

      {/* SEGMENTED CONTROL: KUSTOMISASI TEMA VISUAL (TAILWIND V4 DARK MODE) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <Sun size={16} className="text-blue-600 dark:text-blue-500" /> Tema Aplikasi
        </h3>
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => {
              setTheme("light");
              localStorage.setItem("theme", "light");
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              theme === "light"
                ? "bg-blue-600 text-white shadow-md animate-none"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sun size={14} />
            Terang
          </button>
          <button
            onClick={() => {
              setTheme("dark");
              localStorage.setItem("theme", "dark");
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-blue-600 text-white shadow-md animate-none"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Moon size={14} />
            Gelap
          </button>
          <button
            onClick={() => {
              setTheme("system");
              localStorage.setItem("theme", "system");
            }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              theme === "system"
                ? "bg-blue-600 text-white shadow-md animate-none"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Monitor size={14} />
            Sistem
          </button>
        </div>
      </div>

      {/* KELOLA KATEGORI (KOREKSI INPUT DAN DROPDOWN DARK-MODE) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><Tag size={16} className="text-blue-600 dark:text-blue-500"/> Kelola Kategori ({tType === 'expense' ? 'Pengeluaran' : 'Pemasukan'})</h3>
        <div className="flex gap-2">
          <button onClick={() => setTType("expense")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-colors cursor-pointer ${tType === "expense" ? "bg-red-500 text-white shadow-md animate-none" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>PENGELUARAN</button>
          <button onClick={() => setTType("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-colors cursor-pointer ${tType === "income" ? "bg-green-500 text-white shadow-md animate-none" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>PEMASUKAN</button>
        </div>
        
        {/* FORM INPUT RESPONSIF DENGAN KOREKSI KELAS 850 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            placeholder="Kategori Baru..." 
            className="w-full sm:flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100 placeholder-slate-400" 
            value={newCatName} 
            onChange={(e) => setNewCatName(e.target.value)} 
          />
          <div className="flex gap-2 w-full sm:w-auto">
            {tType === "expense" && (
              <select 
                className="flex-1 sm:flex-none p-3 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100 cursor-pointer min-w-[110px]" 
                value={newExpenseType} 
                onChange={(e) => setNewExpenseType(e.target.value as "fixed" | "variable")}
              >
                <option value="variable">Variabel</option>
                <option value="fixed">Tetap (Fixed)</option>
              </select>
            )}
            <button 
              onClick={addCustomCategory} 
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              Tambah
            </button>
          </div>
        </div>
        
        {/* LIST KATEGORI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
          {categories.filter(c => c.type === tType).map(cat => (
            <div key={cat.id} className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-[20px] border border-slate-200 dark:border-slate-700/80 transition-colors duration-200 shadow-sm">
              
              {editingCatId === cat.id ? (
                <div className="space-y-2">
                  <input type="text" placeholder="Nama Kategori" className="w-full p-2 bg-white dark:bg-slate-750 border border-blue-200 dark:border-blue-900 rounded-lg text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={editCatName} onChange={e => setEditCatName(e.target.value)} />
                  {tType === 'expense' && (
                    <div className="flex gap-2">
                      <input type="number" placeholder="Batas Budget (Rp)" className="flex-1 p-2 bg-white dark:bg-slate-755 border border-blue-200 dark:border-blue-900 rounded-lg text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={editCatBudget} onChange={e => setEditCatBudget(e.target.value)} />
                      <select className="w-24 p-2 bg-white dark:bg-slate-755 border border-blue-200 dark:border-blue-900 rounded-lg text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100 cursor-pointer" value={editCatExpType} onChange={(e) => setEditCatExpType(e.target.value as "fixed" | "variable")}>
                        <option value="variable">Variabel</option>
                        <option value="fixed">Tetap</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { updateCategory(cat.id, editCatName, Number(editCatBudget), editCatExpType); setEditingCatId(null); }} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"><Check size={12}/> Simpan</button>
                    <button onClick={() => setEditingCatId(null)} className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"><X size={12}/> Batal</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">{cat.name}</span>
                      {tType === 'expense' && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${cat.expenseType === 'fixed' ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400' : 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'}`}>
                          {cat.expenseType === 'fixed' ? 'FIXED' : 'VAR'}
                        </span>
                      )}
                    </div>
                    {tType === 'expense' && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Budget: {cat.budgetLimit && cat.budgetLimit > 0 ? `Rp ${cat.budgetLimit.toLocaleString('id-ID')}` : 'Belum Diatur'}</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatBudget(cat.budgetLimit?.toString() || ""); setEditCatExpType(cat.expenseType || "variable"); }} className="text-blue-500 hover:text-white p-1.5 hover:bg-blue-500 rounded-lg transition-all border border-blue-100 dark:border-blue-900/50 cursor-pointer"><Edit2 size={12}/></button>
                    <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:text-white p-1.5 hover:bg-red-500 rounded-lg transition-all border border-red-100 dark:border-red-950/50 cursor-pointer"><X size={12}/></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KELOLA TIPE DOMPET (KOREKSI FORM INPUT DENGAN KELASI 850) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><CreditCard size={16} className="text-blue-600 dark:text-blue-500"/> Kelola Tipe Dompet</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            placeholder="Kategori dompet (Misal: Investasi)" 
            className="w-full sm:flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" 
            value={newWalletTypeName} 
            onChange={(e) => setNewWalletTypeName(e.target.value)} 
          />
          <button 
            onClick={addCustomWalletType} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            Tambah
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {walletTypes.map(t => (
            <span key={t.id} className="bg-slate-150 dark:bg-slate-800 px-3 py-1.5 rounded-full text-[9px] font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-colors duration-200">
              {t.name} <X size={12} className="text-red-500 dark:text-red-400 cursor-pointer hover:scale-125 transition-transform" onClick={() => deleteWalletType(t.id)}/>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}