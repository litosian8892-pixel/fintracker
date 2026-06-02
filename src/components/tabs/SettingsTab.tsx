"use client";
import { useState } from "react";
import { User } from "firebase/auth";
import { LogOut, Tag, CreditCard, X, Edit2, Check, Sun, Moon, Monitor, ChevronDown, ChevronUp, Trash2, Lock } from "lucide-react"; // <--- TAMBAH LOCK IMPORT
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
  
  // PROP KUNCI PIN BARU
  appPin: string | null; setAppPin: (val: string | null) => void;
}

export default function SettingsTab({
  user, onLogout, tType, setTType, newCatName, setNewCatName, newExpenseType, setNewExpenseType, addCustomCategory,
  categories, deleteCategory, updateCategory, newWalletTypeName, setNewWalletTypeName, addCustomWalletType, walletTypes, deleteWalletType,
  theme, setTheme, appPin, setAppPin
}: SettingsTabProps) {
  
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatBudget, setEditCatBudget] = useState("");
  const [editCatExpType, setEditCatExpType] = useState<"fixed" | "variable">("variable");

  const [showAllVar, setShowAllVar] = useState(false);
  const [showAllFixed, setShowAllFixed] = useState(false);
  const [showAllIncome, setShowAllIncome] = useState(false);

  // STATE MODAL PIN
  const [pinModalMode, setPinModalMode] = useState<"setup" | "confirm" | "disable" | null>(null);
  const [tempPin, setTempPin] = useState("");
  const [inputPin, setInputPin] = useState("");

  const sortedCategories = categories.slice().sort((a, b) => {
    const cleanA = a.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanB = b.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return cleanA.localeCompare(cleanB);
  });

  const varCats = sortedCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed");
  const fixedCats = sortedCategories.filter(c => c.type === "expense" && c.expenseType === "fixed");
  const incomeCats = sortedCategories.filter(c => c.type === "income");

  const visibleVarCats = showAllVar ? varCats : varCats.slice(0, 5);
  const visibleFixedCats = showAllFixed ? fixedCats : fixedCats.slice(0, 5);
  const visibleIncomeCats = showAllIncome ? incomeCats : incomeCats.slice(0, 5);

  const renderCategoryCard = (cat: CategoryData) => (
    <div key={cat.id} className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-[20px] border border-slate-200 dark:border-slate-700/80 transition-colors duration-200 shadow-sm min-h-[60px] flex flex-col justify-center">
      {editingCatId === cat.id ? (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="space-y-1 text-left">
            <label className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest px-1">Ubah Nama Kategori</label>
            <input type="text" placeholder="Nama Kategori" className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={editCatName} onChange={e => setEditCatName(e.target.value)} />
          </div>
          {tType === 'expense' && (
            <div className="flex gap-2 text-left">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest px-1">Ubah Batas Budget</label>
                <input type="number" placeholder="Batas Budget (Rp)" className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={editCatBudget} onChange={e => setEditCatBudget(e.target.value)} />
              </div>
              <div className="w-24 space-y-1">
                <label className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest px-1">Jenis</label>
                <select className="w-full p-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100 cursor-pointer" value={editCatExpType} onChange={(e) => setEditCatExpType(e.target.value as "fixed" | "variable")}>
                  <option value="variable">Variabel</option>
                  <option value="fixed">Tetap</option>
                </select>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={() => { updateCategory(cat.id, editCatName, Number(editCatBudget), editCatExpType); setEditingCatId(null); }} className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"><Check size={12}/> Simpan</button>
            <button onClick={() => setEditingCatId(null)} className="flex-1 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"><X size={12}/> Batal</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1 w-full overflow-hidden">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none truncate">{cat.name}</span>
              {tType === 'expense' && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 ${cat.expenseType === 'fixed' ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50' : 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50'}`}>
                  {cat.expenseType === 'fixed' ? 'FIXED' : 'VAR'}
                </span>
              )}
            </div>
            {tType === 'expense' && (
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                Budget: {cat.budgetLimit && cat.budgetLimit > 0 ? `Rp ${cat.budgetLimit.toLocaleString('id-ID')}` : 'Belum Diatur'}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 pl-2 shrink-0">
            <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatBudget(cat.budgetLimit?.toString() || ""); setEditCatExpType(cat.expenseType || "variable"); }} className="text-slate-400 hover:text-blue-500 p-1.5 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"><Edit2 size={14}/></button>
            <button onClick={() => deleteCategory(cat.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"><Trash2 size={14}/></button>
          </div>
        </div>
      )}
    </div>
  );

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

      {/* KEAMANAN APLIKASI (KUNCI PIN) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><Lock size={16} className="text-blue-600 dark:text-blue-500"/> Keamanan Aplikasi</h3>
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Kunci Aplikasi (PIN)</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Minta kode PIN 6-digit saat aplikasi dibuka</p>
            </div>
            
            {/* TOGGLE SWITCH KUNCI PIN */}
            <div 
              onClick={() => { if(appPin) { setPinModalMode("disable"); setInputPin(""); } else { setPinModalMode("setup"); setInputPin(""); setTempPin(""); } }} 
              className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors shadow-inner ${appPin ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${appPin ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
        </div>
      </div>

      {/* SEGMENTED CONTROL: KUSTOMISASI TEMA VISUAL */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <Sun size={16} className="text-blue-600 dark:text-blue-500" /> Tema Aplikasi
        </h3>
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => { setTheme("light"); localStorage.setItem("theme", "light"); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme === "light" ? "bg-blue-600 text-white shadow-md animate-none" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
          ><Sun size={14} />Terang</button>
          <button
            onClick={() => { setTheme("dark"); localStorage.setItem("theme", "dark"); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme === "dark" ? "bg-blue-600 text-white shadow-md animate-none" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
          ><Moon size={14} />Gelap</button>
          <button
            onClick={() => { setTheme("system"); localStorage.setItem("theme", "system"); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme === "system" ? "bg-blue-600 text-white shadow-md animate-none" : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
          ><Monitor size={14} />Sistem</button>
        </div>
      </div>

      {/* KELOLA KATEGORI */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><Tag size={16} className="text-blue-600 dark:text-blue-500"/> Kelola Kategori ({tType === 'expense' ? 'Pengeluaran' : 'Pemasukan'})</h3>
        <div className="flex gap-2">
          <button onClick={() => setTType("expense")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-colors cursor-pointer ${tType === "expense" ? "bg-red-500 text-white shadow-md animate-none" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>PENGELUARAN</button>
          <button onClick={() => setTType("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-colors cursor-pointer ${tType === "income" ? "bg-green-500 text-white shadow-md animate-none" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>PEMASUKAN</button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <input 
            type="text" 
            placeholder="Ketik kategori baru..." 
            className="w-full sm:flex-1 p-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100 placeholder-slate-400" 
            value={newCatName} 
            onChange={(e) => setNewCatName(e.target.value)} 
          />
          <div className="flex gap-2 w-full sm:w-auto">
            {tType === "expense" && (
              <select 
                className="flex-1 sm:flex-none p-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100 cursor-pointer min-w-[110px]" 
                value={newExpenseType} 
                onChange={(e) => setNewExpenseType(e.target.value as "fixed" | "variable")}
              >
                <option value="variable">Variabel</option>
                <option value="fixed">Tetap (Fixed)</option>
              </select>
            )}
            <button 
              onClick={addCustomCategory} 
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
            >
              Tambah
            </button>
          </div>
        </div>
        
        {tType === "expense" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 pt-2 items-start">
            <div className="space-y-3">
              <div className="pb-2 border-b border-orange-100 dark:border-orange-900/30">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center justify-between"><span>🟠 Variabel (Sering)</span><span className="text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{varCats.length}</span></p>
              </div>
              <div className="space-y-2">
                {visibleVarCats.length === 0 && <p className="text-[10px] text-slate-400 italic">Belum ada data</p>}
                {visibleVarCats.map(renderCategoryCard)}
              </div>
              {varCats.length > 5 && (
                <button onClick={() => setShowAllVar(!showAllVar)} className="w-full py-2.5 mt-2 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer">
                  {showAllVar ? <><ChevronUp size={14}/> Sembunyikan</> : <><ChevronDown size={14}/> Tampilkan {varCats.length - 5} Lainnya</>}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="pb-2 border-b border-purple-100 dark:border-purple-900/30">
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center justify-between"><span>🟣 Tetap (Bulanan)</span><span className="text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{fixedCats.length}</span></p>
              </div>
              <div className="space-y-2">
                {visibleFixedCats.length === 0 && <p className="text-[10px] text-slate-400 italic">Belum ada data</p>}
                {visibleFixedCats.map(renderCategoryCard)}
              </div>
              {fixedCats.length > 5 && (
                <button onClick={() => setShowAllFixed(!showAllFixed)} className="w-full py-2.5 mt-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer">
                  {showAllFixed ? <><ChevronUp size={14}/> Sembunyikan</> : <><ChevronDown size={14}/> Tampilkan {fixedCats.length - 5} Lainnya</>}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-2 max-w-xl mx-auto w-full space-y-3">
             <div className="pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-between"><span>🟢 Daftar Pemasukan</span><span className="text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{incomeCats.length}</span></p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {visibleIncomeCats.length === 0 && <p className="text-[10px] text-slate-400 italic">Belum ada data</p>}
                {visibleIncomeCats.map(renderCategoryCard)}
              </div>
              {incomeCats.length > 5 && (
                <button onClick={() => setShowAllIncome(!showAllIncome)} className="w-full py-2.5 mt-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer">
                  {showAllIncome ? <><ChevronUp size={14}/> Sembunyikan</> : <><ChevronDown size={14}/> Tampilkan {incomeCats.length - 5} Lainnya</>}
                </button>
              )}
          </div>
        )}
      </div>

      {/* KELOLA TIPE DOMPET */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><CreditCard size={16} className="text-blue-600 dark:text-blue-500"/> Kelola Tipe Dompet</h3>
        <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <input 
            type="text" 
            placeholder="Tipe dompet (Misal: Investasi)" 
            className="w-full sm:flex-1 p-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" 
            value={newWalletTypeName} 
            onChange={(e) => setNewWalletTypeName(e.target.value)} 
          />
          <button 
            onClick={addCustomWalletType} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            Tambah
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {walletTypes.map(t => (
            <span key={t.id} className="bg-white dark:bg-slate-800 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-colors duration-200">
              {t.name} <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5"></div><X size={12} className="text-red-500 dark:text-red-400 cursor-pointer hover:scale-125 transition-transform" onClick={() => deleteWalletType(t.id)}/>
            </span>
          ))}
        </div>
      </div>

      {/* POPUP MODAL SETUP & DISABLE PIN */}
      {pinModalMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner"><Lock size={32}/></div>
            <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight">
              {pinModalMode === "setup" ? "Buat PIN Baru" : pinModalMode === "confirm" ? "Konfirmasi PIN Anda" : "Verifikasi PIN"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2 mb-4 font-semibold">
              {pinModalMode === "setup" ? "Buat 6 digit PIN untuk mengunci aplikasi" : pinModalMode === "confirm" ? "Ketik ulang PIN yang baru saja Anda buat" : "Masukkan PIN Anda saat ini untuk mematikan kunci"}
            </p>
            
            <input 
              autoFocus 
              type="password" 
              inputMode="numeric" 
              maxLength={6} 
              className="w-full text-center tracking-[1em] text-3xl font-black p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-blue-500 text-slate-800 dark:text-white transition-all shadow-sm" 
              value={inputPin} 
              onChange={e => setInputPin(e.target.value.replace(/[^0-9]/g, ''))} 
            />
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  if(inputPin.length !== 6) return alert("PIN harus persis 6 angka!");
                  if(pinModalMode === "setup") { setTempPin(inputPin); setInputPin(""); setPinModalMode("confirm"); }
                  else if(pinModalMode === "confirm") {
                    if(inputPin === tempPin) { setAppPin(tempPin); setPinModalMode(null); alert("Kunci PIN berhasil diaktifkan!"); }
                    else { alert("PIN tidak cocok, silakan ulangi dari awal."); setPinModalMode("setup"); setInputPin(""); setTempPin(""); }
                  }
                  else if(pinModalMode === "disable") {
                    if(inputPin === appPin) { setAppPin(null); setPinModalMode(null); alert("Kunci PIN berhasil dinonaktifkan."); }
                    else { alert("PIN salah!"); setInputPin(""); }
                  }
                }} 
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-colors shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer"
              >
                Konfirmasi
              </button>
              <button 
                onClick={() => setPinModalMode(null)} 
                className="py-3.5 px-6 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-black transition-colors active:scale-95 cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}