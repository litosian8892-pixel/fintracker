"use client";

import { auth, db, googleProvider } from "../lib/firebase";
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, runTransaction, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { LogOut, ArrowUpCircle, ArrowDownCircle, History, Trash2, Edit2, Check, X, Calendar, Tag, CreditCard, Smartphone, Banknote, Settings, Home, PieChart, ArrowRightLeft, HelpCircle, Upload } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

const ACCOUNT_TYPES = ["Bank", "E-Wallet", "Cash", "Lainnya"];
const CATEGORIES = {
  expense: ["Makanan", "Transportasi", "Belanja", "Tagihan", "Hiburan", "Kesehatan", "Pendidikan", "Lainnya"],
  income: ["Gaji", "Bonus", "Investasi", "Penjualan", "Pemberian", "Lainnya"]
};
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

export default function FintrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<"home" | "reports">("home");
  
  // Report State
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // State Input Dompet
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accType, setAccType] = useState("Cash");
  const [accLogo, setAccLogo] = useState<string>(""); // Menyimpan base64 gambar logo
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [newAccName, setNewAccName] = useState("");

  // State Input Transaksi
  const [tAmount, setTAmount] = useState("");
  const [tType, setTType] = useState<"income" | "expense" | "transfer">("expense");
  const [tAccountId, setTAccountId] = useState("");
  const [tToAccountId, setTToAccountId] = useState(""); // Khusus transfer
  const [tNote, setTNote] = useState("");
  const [tCategory, setTCategory] = useState("");
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);

  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubAcc = onSnapshot(query(collection(db, `users/${user.uid}/accounts`)), (sn) => {
      setAccounts(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTr = onSnapshot(query(collection(db, `users/${user.uid}/transactions`), orderBy("tDate", "desc")), (sn) => {
      setTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCat = onSnapshot(collection(db, `users/${user.uid}/categories`), (sn) => {
      if (sn.empty) setupDefaultCategories(user.uid);
      else setCategories(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubAcc(); unsubTr(); unsubCat(); };
  }, [user]);

  useEffect(() => {
    if (tType !== "transfer") setTCategory(CATEGORIES[tType as "income"|"expense"][0] || "");
    else setTCategory("Transfer");
  }, [tType]);

  const setupDefaultCategories = async (uid: string) => {
    const defaults = [
      { name: "Makanan", type: "expense" }, { name: "Transportasi", type: "expense" },
      { name: "Gaji", type: "income" }
    ];
    for (const cat of defaults) await addDoc(collection(db, `users/${uid}/categories`), cat);
  };

  const addCustomCategory = async () => {
    if (!newCatName || !user) return;
    await addDoc(collection(db, `users/${user.uid}/categories`), { name: newCatName, type: tType });
    setNewCatName("");
  };

  const deleteCategory = async (id: string) => {
    if (!user || !confirm("Hapus kategori ini?")) return;
    await deleteDoc(doc(db, `users/${user.uid}/categories/${id}`));
  };

  // LOGIKA MEMBACA GAMBAR DAN MENGUBAH KE BASE64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit 500 KB agar database tetap kencang
        alert("File terlalu besar! Harap gunakan logo berukuran kurang dari 500 KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccLogo(reader.result as string); // Simpan string gambar
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAccount = async () => {
    if (!user || !accName || !accBalance) return;
    await addDoc(collection(db, `users/${user.uid}/accounts`), {
      name: accName, 
      balance: Number(accBalance), 
      type: accType, 
      logo: accLogo, // Simpan logo ke database
      createdAt: serverTimestamp()
    });
    setAccName(""); setAccBalance(""); setAccLogo("");
  };

  const deleteAccount = async (id: string, name: string) => {
    if (!user || !confirm(`Hapus dompet "${name}"?`)) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/accounts/${id}`)); } catch (e) { alert("Gagal hapus"); }
  };

  const renameAccount = async (id: string) => {
    if (!user || !newAccName) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), { name: newAccName });
      setEditingAccId(null); setNewAccName("");
    } catch (e) { alert("Gagal ubah nama"); }
  };

  // FUNGSI TRANSAKSI & TRANSFER
  const handleTransaction = async () => {
    if (!user || !tAmount || !tAccountId) return alert("Isi data dengan lengkap!");
    if (tType === "transfer" && (!tToAccountId || tAccountId === tToAccountId)) return alert("Pilih dompet tujuan yang berbeda!");

    const amount = Number(tAmount);
    const accRef = doc(db, `users/${user.uid}/accounts/${tAccountId}`);

    try {
      await runTransaction(db, async (ts) => {
        const snap = await ts.get(accRef);
        if (!snap.exists()) throw "Dompet asal tidak ditemukan";

        if (tType === "transfer") {
          const toAccRef = doc(db, `users/${user.uid}/accounts/${tToAccountId}`);
          const toSnap = await ts.get(toAccRef);
          if (!toSnap.exists()) throw "Dompet tujuan tidak ditemukan";

          ts.update(accRef, { balance: snap.data().balance - amount });
          ts.update(toAccRef, { balance: toSnap.data().balance + amount });

          ts.set(doc(collection(db, `users/${user.uid}/transactions`)), {
            amount, type: "transfer", accountId: tAccountId, toAccountId: tToAccountId,
            accountName: snap.data().name, toAccountName: toSnap.data().name,
            note: tNote || "Transfer Dana", category: "Transfer", tDate, createdAt: serverTimestamp()
          });
        } else {
          const newBal = tType === "income" ? snap.data().balance + amount : snap.data().balance - amount;
          ts.update(accRef, { balance: newBal });
          ts.set(doc(collection(db, `users/${user.uid}/transactions`)), {
            amount, type: tType, accountId: tAccountId, accountName: snap.data().name, 
            note: tNote, category: tCategory, tDate, createdAt: serverTimestamp()
          });
        }
      });
      setTAmount(""); setTNote(""); alert("Transaksi Sukses!");
    } catch (e) { alert("Gagal simpan transaksi"); }
  };

  const handleDeleteTransaction = async (t: any) => {
    if (!user || !confirm("Hapus transaksi ini? Saldo akan dikoreksi.")) return;
    const transRef = doc(db, `users/${user.uid}/transactions/${t.id}`);

    try {
      await runTransaction(db, async (ts) => {
        if (t.type === "transfer") {
          const accRef = doc(db, `users/${user.uid}/accounts/${t.accountId}`);
          const toAccRef = doc(db, `users/${user.uid}/accounts/${t.toAccountId}`);
          const accSnap = await ts.get(accRef);
          const toSnap = await ts.get(toAccRef);
          
          if (accSnap.exists()) ts.update(accRef, { balance: accSnap.data().balance + t.amount });
          if (toSnap.exists()) ts.update(toAccRef, { balance: toSnap.data().balance - t.amount });
        } else {
          const accRef = doc(db, `users/${user.uid}/accounts/${t.accountId}`);
          const accSnap = await ts.get(accRef);
          if (accSnap.exists()) {
            const restoredBal = t.type === "income" ? accSnap.data().balance - t.amount : accSnap.data().balance + t.amount;
            ts.update(accRef, { balance: restoredBal });
          }
        }
        ts.delete(transRef);
      });
    } catch (e) { alert("Gagal hapus transaksi"); }
  };

  // LOGIKA LAPORAN
  const filteredTransactions = transactions.filter(t => t.tDate && t.tDate.startsWith(reportMonth));
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  
  const expenseByCategory = filteredTransactions.filter(t => t.type === 'expense').reduce((acc: any, curr: any) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as any);
  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));

  const expenseByDate = filteredTransactions.filter(t => t.type === 'expense').reduce((acc: any, curr: any) => {
    const day = curr.tDate.split('-')[2];
    acc[day] = (acc[day] || 0) + curr.amount;
    return acc;
  }, {} as any);
  const barData = Object.keys(expenseByDate).sort().map(key => ({ date: `Tgl ${key}`, amount: expenseByDate[key] }));

  // GAYA KARTU PREMIUM UNTUK SETIAP TIPE DOMPET
  const getCardDesign = (type: string) => {
    switch (type) {
      case "Bank":
        return {
          bg: "bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-white shadow-lg shadow-blue-900/10",
          icon: <CreditCard size={20} className="text-white" />,
          chip: "bg-amber-400/20 border border-amber-300/30",
          textMuted: "text-blue-200/70"
        };
      case "E-Wallet":
        return {
          bg: "bg-gradient-to-br from-purple-900 via-violet-850 to-pink-950 text-white shadow-lg shadow-purple-950/10",
          icon: <Smartphone size={20} className="text-white" />,
          chip: "bg-pink-400/20 border border-pink-300/30",
          textMuted: "text-purple-200/70"
        };
      case "Cash":
        return {
          bg: "bg-gradient-to-br from-teal-900 via-emerald-900 to-green-950 text-white shadow-lg shadow-emerald-900/10",
          icon: <Banknote size={20} className="text-white" />,
          chip: "bg-yellow-400/20 border border-yellow-300/30",
          textMuted: "text-emerald-200/70"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-slate-800 via-slate-900 to-neutral-950 text-white shadow-lg shadow-slate-900/10",
          icon: <HelpCircle size={20} className="text-white" />,
          chip: "bg-slate-400/20 border border-slate-300/30",
          textMuted: "text-slate-300/70"
        };
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white py-4 px-8 rounded-2xl font-bold flex gap-3 shadow-2xl items-center active:scale-95 transition-all">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5"/> Masuk Google
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans">
      {/* HEADER */}
      <div className="bg-white p-6 flex justify-between items-center shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-blue-500" />
          <p className="font-bold text-sm">{user.displayName}</p>
        </div>
        <button onClick={() => signOut(auth)} className="text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        
        {/* TAMPILAN BERANDA (HOME) */}
        {activeTab === "home" && (
          <>
            <div className="bg-blue-600 p-8 rounded-[35px] text-white shadow-2xl shadow-blue-200">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Balance</p>
              <h2 className="text-4xl font-black italic">Rp {accounts.reduce((a, b) => a + b.balance, 0).toLocaleString('id-ID')}</h2>
            </div>

            <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setTType("expense")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "expense" ? "bg-red-500 text-white shadow-lg" : "bg-slate-100"}`}>PENGELUARAN</button>
                <button onClick={() => setTType("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "income" ? "bg-green-500 text-white shadow-lg" : "bg-slate-100"}`}>PEMASUKAN</button>
                <button onClick={() => setTType("transfer")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "transfer" ? "bg-blue-500 text-white shadow-lg" : "bg-slate-100"}`}>TRANSFER</button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                    <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none" value={tDate} onChange={(e) => setTDate(e.target.value)} />
                </div>
                {tType !== "transfer" ? (
                  <div className="relative">
                      <Tag className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                      <select className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none appearance-none" value={tCategory} onChange={(e) => setTCategory(e.target.value)}>
                          <option value="">Pilih Kategori</option>
                          {categories.filter(c => c.type === tType).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                  </div>
                ) : (
                  <div className="py-3 px-4 bg-blue-50 rounded-2xl text-xs font-bold text-blue-600 flex items-center justify-center">Mode Transfer</div>
                )}
              </div>

              <select value={tAccountId} onChange={(e) => setTAccountId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium border-none outline-blue-500">
                <option value="">Dompet Asal...</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString()})</option>)}
              </select>

              {tType === "transfer" && (
                <select value={tToAccountId} onChange={(e) => setTToAccountId(e.target.value)} className="w-full p-4 bg-blue-50/50 rounded-2xl text-sm font-medium border-none outline-blue-500">
                  <option value="">Kirim Ke Dompet Tujuan...</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString()})</option>)}
                </select>
              )}

              <input type="number" placeholder="Nominal Rp" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none outline-blue-500" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
              <input type="text" placeholder={tType === "transfer" ? "Catatan Transfer" : "Catatan (Opsional)"} className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none outline-blue-500" value={tNote} onChange={(e) => setTNote(e.target.value)} />
              <button onClick={handleTransaction} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">Simpan Transaksi</button>
            </div>

            {tType !== "transfer" && (
              <details className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <summary className="text-[10px] font-bold text-slate-500 cursor-pointer uppercase flex items-center gap-2 outline-none"><Settings size={14}/> Kelola Kategori {tType}</summary>
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                      <input type="text" placeholder="Kategori Baru..." className="flex-1 p-2 bg-slate-50 rounded-lg text-xs" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                      <button onClick={addCustomCategory} className="bg-blue-600 text-white px-4 rounded-lg text-xs font-bold">Tambah</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {categories.filter(c => c.type === tType).map(cat => (
                          <span key={cat.id} className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2">
                              {cat.name} <X size={12} className="text-red-500 cursor-pointer" onClick={() => deleteCategory(cat.id)}/>
                          </span>
                      ))}
                  </div>
                </div>
              </details>
            )}

            {/* DAFTAR DOMPET DEBIT CARD PREMIUM + CUSTOM LOGO */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 italic px-1 text-lg">Dompet Saya</h3>
                <div className="grid grid-cols-2 gap-4">
                    {accounts.map(acc => {
                      const design = getCardDesign(acc.type);
                      return (
                        <div key={acc.id} className={`${design.bg} p-5 rounded-[26px] h-36 flex flex-col justify-between relative overflow-hidden transition-all duration-300 active:scale-95 hover:-translate-y-1`}>
                            <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/5 rounded-full blur-xl"></div>
                            
                            <div className="flex justify-between items-start">
                              {/* TAMPILKAN LOGO CUSTOM JIKA ADA, JIKA TIDAK ADA TAMPILKAN IKON BAWAAN */}
                              {acc.logo ? (
                                <img src={acc.logo} alt="custom-logo" className="w-8 h-8 rounded-xl object-contain bg-white/90 p-1 border border-white/20 shadow-md" />
                              ) : (
                                <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                                  {design.icon}
                                </div>
                              )}
                              <div className={`w-7 h-5 rounded-md ${design.chip}`}></div>
                            </div>

                            <div className="space-y-1 mt-auto">
                              <p className={`text-[9px] font-black uppercase tracking-wider ${design.textMuted}`}>{acc.name}</p>
                              <p className="text-xs font-bold leading-none truncate">{acc.type}</p>
                              <p className="text-sm font-black tracking-tight pt-1">Rp {acc.balance.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                      );
                    })}
                </div>
                
                <details className="bg-slate-200/50 rounded-[25px] p-5 border border-slate-200/50">
                  <summary className="text-[10px] font-black text-slate-500 cursor-pointer uppercase tracking-widest outline-none">⚙️ Pengaturan Dompet</summary>
                  <div className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <select className="w-full p-3 bg-white rounded-xl text-xs border-none outline-none font-bold" value={accType} onChange={(e) => setAccType(e.target.value)}>
                          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input type="text" placeholder="Nama Dompet (BCA, Gopay, dll)" className="w-full p-3 bg-white rounded-xl text-xs border-none outline-none font-bold" value={accName} onChange={(e) => setAccName(e.target.value)} />
                      <input type="number" placeholder="Saldo Awal" className="w-full p-3 bg-white rounded-xl text-xs border-none outline-none font-bold" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
                      
                      {/* INPUT UPLOAD LOGO CUSTOM */}
                      <div className="flex flex-col gap-1 pt-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Upload Logo Dompet (Opsional)</label>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-dashed border-slate-300">
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="custom-logo-file" />
                          <label htmlFor="custom-logo-file" className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                            <Upload size={14}/> Pilih File
                          </label>
                          <span className="text-[10px] text-slate-400 truncate">
                            {accLogo ? "Logo Siap Diunggah ✅" : "Format PNG/JPG (Maks 500KB)"}
                          </span>
                        </div>
                      </div>

                      <button onClick={handleCreateAccount} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100 mt-2">Simpan Dompet</button>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-300/30 space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Daftar Dompet & Hapus</p>
                      {accounts.map((acc) => (
                        <div key={acc.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm">
                          {editingAccId === acc.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input className="bg-slate-50 p-1 text-xs rounded border border-blue-200 outline-none w-full" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} autoFocus />
                              <button onClick={() => renameAccount(acc.id)} className="text-green-500"><Check size={16}/></button>
                              <button onClick={() => setEditingAccId(null)} className="text-slate-400"><X size={16}/></button>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">{acc.name}</span>
                                <span className="text-[10px] font-black text-blue-600">Rp {acc.balance.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingAccId(acc.id); setNewAccName(acc.name); }} className="text-slate-300 hover:text-blue-500 p-1"><Edit2 size={14}/></button>
                                <button onClick={() => deleteAccount(acc.id, acc.name)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
            </div>
          </>
        )}

        {/* TAMPILAN LAPORAN (REPORTS) */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm flex items-center justify-between">
              <h2 className="font-black text-xl italic text-slate-800">Laporan</h2>
              <input type="month" className="p-2 bg-slate-50 rounded-xl text-xs font-bold text-blue-600 border-none outline-none" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-5 rounded-3xl border border-green-100">
                <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Pemasukan</p>
                <p className="text-lg font-black text-green-700">Rp {totalIncome.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-5 rounded-3xl border border-red-100">
                <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Pengeluaran</p>
                <p className="text-lg font-black text-red-700">Rp {totalExpense.toLocaleString()}</p>
              </div>
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
                      <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map((data, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-slate-600">{data.name}</span>
                      </div>
                      <span className="text-slate-800">Rp {data.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-[30px] text-center text-slate-400 text-sm italic border border-slate-200">
                Belum ada pengeluaran di bulan ini.
              </div>
            )}

            {barData.length > 0 && (
              <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Grafik Harian</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="date" fontSize={10} tickMargin={10} />
                      <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} cursor={{fill: '#f1f5f9'}} />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIWAYAT KESELURUHAN */}
        <div className="space-y-4 pt-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 italic text-lg px-1"><History size={20} className="text-blue-600"/> Riwayat Semua</h3>
          <div className="space-y-3 pb-24">
            {transactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-[25px] flex justify-between items-center border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${t.type === "income" ? "bg-green-50 text-green-600" : t.type === "expense" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                    {t.type === "income" ? "↓" : t.type === "expense" ? "↑" : <ArrowRightLeft size={18}/>}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 leading-none mb-1">{t.note || t.category}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        {new Date(t.tDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} 
                        {t.type === "transfer" ? ` • ${t.accountName} ➔ ${t.toAccountName}` : ` • ${t.category} • ${t.accountName}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-black text-sm ${t.type === "income" ? "text-green-600" : t.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
                    {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} {Number(t.amount).toLocaleString('id-ID')}
                  </p>
                  <button onClick={() => handleDeleteTransaction(t)} className="p-2 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 pb-safe">
        <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-blue-600" : "text-slate-400"}`}>
          <Home size={24} className={activeTab === "home" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">Beranda</span>
        </button>
        <button onClick={() => setActiveTab("reports")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "reports" ? "text-blue-600" : "text-slate-400"}`}>
          <PieChart size={24} className={activeTab === "reports" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">Laporan</span>
        </button>
      </nav>
    </main>
  );
}