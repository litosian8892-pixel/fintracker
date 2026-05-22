"use client";

import { auth, db, googleProvider } from "../lib/firebase";
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, runTransaction, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { LogOut, ArrowUpCircle, ArrowDownCircle, History, Trash2, Edit2, Check, X, Calendar, Tag, CreditCard, Smartphone, Banknote, Settings, Home, PieChart, ArrowRightLeft, HelpCircle, Upload, ArrowUp, ArrowDown, Wallet, Download } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import * as XLSX from "xlsx";

const ACCOUNT_TYPES = ["Bank", "E-Wallet", "Cash", "Lainnya"];
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

export default function FintrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [walletTypes, setWalletTypes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "reports" | "assets" | "settings">("home");
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  // State Input Dompet & Transaksi
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accType, setAccType] = useState("Cash");
  const [accLogo, setAccLogo] = useState<string>("");
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccBalance, setEditAccBalance] = useState("");
  const [editAccLogo, setEditAccLogo] = useState<string>("");
  const [tAmount, setTAmount] = useState("");
  const [tType, setTType] = useState<"income" | "expense" | "transfer">("expense");
  const [tAccountId, setTAccountId] = useState("");
  const [tToAccountId, setTToAccountId] = useState("");
  const [tNote, setTNote] = useState("");
  const [tCategory, setTCategory] = useState("");
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCatName, setNewCatName] = useState("");
  const [newWalletTypeName, setNewWalletTypeName] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubAcc = onSnapshot(query(collection(db, `users/${user.uid}/accounts`), orderBy("order", "asc")), (sn) => setAccounts(sn.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTr = onSnapshot(query(collection(db, `users/${user.uid}/transactions`), orderBy("tDate", "desc")), (sn) => setTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCat = onSnapshot(collection(db, `users/${user.uid}/categories`), (sn) => {
      if (sn.empty) setupDefaultCategories(user.uid);
      else setCategories(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTypes = onSnapshot(query(collection(db, `users/${user.uid}/walletTypes`), orderBy("order", "asc")), (sn) => {
      if (sn.empty) setupDefaultWalletTypes(user.uid);
      else setWalletTypes(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubAcc(); unsubTr(); unsubCat(); unsubTypes(); };
  }, [user]);

  useEffect(() => {
    if (tType !== "transfer") {
      const filtered = categories.filter(c => c.type === tType);
      setTCategory(filtered.length > 0 ? filtered[0].name : (tType === "income" ? "Gaji" : "Makanan"));
    } else setTCategory("Transfer");
  }, [tType, categories]);

  const setupDefaultCategories = async (uid: string) => {
    const defaults = [{ name: "Makanan", type: "expense" }, { name: "Transportasi", type: "expense" }, { name: "Gaji", type: "income" }];
    for (const cat of defaults) await addDoc(collection(db, `users/${uid}/categories`), cat);
  };

  const setupDefaultWalletTypes = async (uid: string) => {
    const defaults = ["Bank", "E-Wallet", "Cash", "Lainnya"];
    for (let i = 0; i < defaults.length; i++) await addDoc(collection(db, `users/${uid}/walletTypes`), { name: defaults[i], order: i });
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

  const addCustomWalletType = async () => {
    if (!newWalletTypeName || !user) return;
    await addDoc(collection(db, `users/${user.uid}/walletTypes`), { name: newWalletTypeName, order: walletTypes.length });
    setNewWalletTypeName("");
  };

  const deleteWalletType = async (id: string) => {
    if (!user || !confirm("Hapus kategori dompet?")) return;
    await deleteDoc(doc(db, `users/${user.uid}/walletTypes/${id}`));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) return alert("File terlalu besar! Maks 500 KB.");
      const reader = new FileReader();
      reader.onloadend = () => isEdit ? setEditAccLogo(reader.result as string) : setAccLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAccount = async () => {
    if (!user || !accName || !accBalance) return;
    await addDoc(collection(db, `users/${user.uid}/accounts`), {
      name: accName, balance: Number(accBalance), type: accType, logo: accLogo, order: accounts.length, createdAt: serverTimestamp()
    });
    setAccName(""); setAccBalance(""); setAccLogo("");
  };

  const deleteAccount = async (id: string, name: string) => {
    if (!user || !confirm(`Hapus dompet "${name}"?`)) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/accounts/${id}`)); } catch (e) { alert("Gagal hapus"); }
  };

  const handleEditAccount = async (id: string) => {
    if (!user || !editAccName || !editAccBalance) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), { name: editAccName, balance: Number(editAccBalance), logo: editAccLogo });
      setEditingAccId(null); setEditAccName(""); setEditAccBalance(""); setEditAccLogo("");
      alert("Dompet berhasil diperbarui!");
    } catch (e) { alert("Gagal memperbarui"); }
  };

  const moveAccountOrder = async (index: number, direction: "up" | "down") => {
    if (!user) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;
    const currentAcc = accounts[index], targetAcc = accounts[targetIndex];
    try {
      await runTransaction(db, async (ts) => {
        const currentRef = doc(db, `users/${user.uid}/accounts/${currentAcc.id}`);
        const targetRef = doc(db, `users/${user.uid}/accounts/${targetAcc.id}`);
        ts.update(currentRef, { order: targetAcc.order !== undefined ? targetAcc.order : targetIndex });
        ts.update(targetRef, { order: currentAcc.order !== undefined ? currentAcc.order : index });
      });
    } catch (e) { alert("Gagal memindahkan posisi"); }
  };

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
            amount, type: tType, accountId: tAccountId, accountName: snap.data().name, note: tNote, category: tCategory, tDate, createdAt: serverTimestamp()
          });
        }
      });
      setTAmount(""); setTNote(""); alert("Transaksi Sukses!");
    } catch (e) { alert("Gagal simpan"); }
  };

  const handleDeleteTransaction = async (t: any) => {
    if (!user || !confirm("Hapus transaksi ini? Saldo akan dikoreksi.")) return;
    const transRef = doc(db, `users/${user.uid}/transactions/${t.id}`);
    try {
      await runTransaction(db, async (ts) => {
        if (t.type === "transfer") {
          const accRef = doc(db, `users/${user.uid}/accounts/${t.accountId}`), toAccRef = doc(db, `users/${user.uid}/accounts/${t.toAccountId}`);
          const accSnap = await ts.get(accRef), toSnap = await ts.get(toAccRef);
          if (accSnap.exists()) ts.update(accRef, { balance: accSnap.data().balance + t.amount });
          if (toSnap.exists()) ts.update(toAccRef, { balance: toSnap.data().balance - t.amount });
        } else {
          const accRef = doc(db, `users/${user.uid}/accounts/${t.accountId}`), accSnap = await ts.get(accRef);
          if (accSnap.exists()) {
            const restoredBal = t.type === "income" ? accSnap.data().balance - t.amount : accSnap.data().balance + t.amount;
            ts.update(accRef, { balance: restoredBal });
          }
        }
        ts.delete(transRef);
      });
    } catch (e) { alert("Gagal hapus"); }
  };

  const filteredTransactions = transactions.filter(t => t.tDate && t.tDate.startsWith(reportMonth));
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  
  const expenseByCategory = filteredTransactions.filter(t => t.type === 'expense').reduce((acc: any, curr: any) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc;
  }, {} as any);
  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));

  const incomeByCategory = filteredTransactions.filter(t => t.type === 'income').reduce((acc: any, curr: any) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc;
  }, {} as any);
  const incomeCategoryList = Object.keys(incomeByCategory).map(key => ({ name: key, value: incomeByCategory[key] }));

  const expenseByDate = filteredTransactions.filter(t => t.type === 'expense').reduce((acc: any, curr: any) => {
    const day = curr.tDate.split('-')[2]; acc[day] = (acc[day] || 0) + curr.amount; return acc;
  }, {} as any);
  const barData = Object.keys(expenseByDate).sort().map(key => ({ date: `Tgl ${key}`, amount: expenseByDate[key] }));

  const handleExportToExcel = () => {
    if (filteredTransactions.length === 0) return alert("Tidak ada data transaksi!");
    const excelData = filteredTransactions.map((t, idx) => ({
      "No": idx + 1, "Tanggal": t.tDate, "Tipe": t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
      "Kategori": t.category, "Dompet": t.type === "transfer" ? `${t.accountName} ➔ ${t.toAccountName}` : t.accountName, "Nominal (Rp)": t.amount, "Catatan": t.note || "-"
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    worksheet["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 25 }];
    XLSX.writeFile(workbook, `Fintracker_Laporan_${reportMonth}.xlsx`);
  };

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center bg-blue-600"><button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white py-4 px-8 rounded-2xl font-bold flex gap-3 items-center"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5"/> Masuk Google</button></div>;

  return (
    <main className="min-h-screen bg-slate-50 md:flex">
      {/* SIDEBAR PC */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-30 justify-between p-6 shadow-sm">
        <div className="space-y-8">
          <div className="text-2xl font-black text-blue-600 tracking-tighter italic">FINTRACKER</div>
          <nav className="flex flex-col gap-2">
            <button onClick={() => setActiveTab("home")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "home" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}><Home size={18} /><span>Beranda</span></button>
            <button onClick={() => setActiveTab("reports")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "reports" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}><PieChart size={18} /><span>Laporan</span></button>
            <button onClick={() => setActiveTab("assets")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "assets" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-50"}`}><Wallet size={18} /><span>Aset & Akun</span></button>
            <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-black tracking-wide transition-all ${activeTab === "settings" ? "bg-blue-50 text-blue-600 animate-in" : "text-slate-400 hover:bg-slate-50"}`}><Settings size={18} /><span>Setting</span></button>
          </nav>
        </div>
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><img src={user?.photoURL || ""} className="w-8 h-8 rounded-full border border-blue-500 shadow-sm" /><p className="text-xs font-black text-slate-800 truncate max-w-[110px]">{user?.displayName?.split(" ")[0]}</p></div>
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50"><LogOut size={16} /></button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col pb-24 md:pb-8">
        {/* HEADER HP */}
        <div className="md:hidden bg-white p-6 flex justify-between items-center shadow-sm border-b sticky top-0 z-20">
          <div className="flex items-center gap-3"><img src={user?.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-blue-500" /><p className="font-bold text-sm">Halo, {user?.displayName?.split(' ')[0]}!</p></div>
          <button onClick={() => signOut(auth)} className="text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
        </div>

        {/* CONTAINER UTAMA */}
        <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KONTEN AKTIF (KOLOM KIRI) */}
            <div className="md:col-span-2 space-y-6">
              
              {activeTab === "home" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
                    <div className="flex gap-2">
                      <button onClick={() => setTType("expense")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "expense" ? "bg-red-500 text-white" : "bg-slate-100"}`}>PENGELUARAN</button>
                      <button onClick={() => setTType("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "income" ? "bg-green-50 text-white" : "bg-slate-100"}`}>PEMASUKAN</button>
                      <button onClick={() => setTType("transfer")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "transfer" ? "bg-blue-50 text-white" : "bg-slate-100"}`}>TRANSFER</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                          <Calendar className="absolute left-3 top-3.5 text-slate-400" size={16}/><input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none" value={tDate} onChange={(e) => setTDate(e.target.value)} />
                      </div>
                      {tType !== "transfer" ? (
                        <div className="relative">
                            <Tag className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                            <select className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none appearance-none font-bold" value={tCategory} onChange={(e) => setTCategory(e.target.value)}>
                                <option value="">Pilih Kategori</option>
                                {categories.filter(c => c.type === tType).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                      ) : <div className="py-3 px-4 bg-blue-50 rounded-2xl text-xs font-bold text-blue-600 flex items-center justify-center">Mode Transfer</div>}
                    </div>
                    <select value={tAccountId} onChange={(e) => setTAccountId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none">
                      <option value="">Dompet Asal...</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString()})</option>)}
                    </select>
                    {tType === "transfer" && (
                      <select value={tToAccountId} onChange={(e) => setTToAccountId(e.target.value)} className="w-full p-4 bg-blue-50/50 rounded-2xl text-sm font-bold border-none"><option value="">Kirim Ke Dompet Tujuan...</option>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString()})</option>)}</select>
                    )}
                    <input type="number" placeholder="Nominal Rp" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
                    <input type="text" placeholder={tType === "transfer" ? "Catatan Transfer" : "Catatan (Opsional)"} className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-none" value={tNote} onChange={(e) => setTNote(e.target.value)} />
                    <button onClick={handleTransaction} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg">Simpan Transaksi</button>
                  </div>
                </div>
              )}

              {activeTab === "reports" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between w-full">
                      <h2 className="font-black text-xl italic text-slate-800">Laporan</h2>
                      <input type="month" className="p-2 bg-slate-50 rounded-xl text-xs font-bold text-blue-600 border-none outline-none" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}/>
                    </div>
                    <button onClick={handleExportToExcel} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2"><Download size={14}/> Export Bulan Ini ke Excel</button>
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
                            <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 space-y-2">
                        {pieData.map((data, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div><span className="text-slate-600">{data.name}</span></div><span className="text-slate-800">Rp {data.value.toLocaleString()}</span></div>
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
                            <Tooltip formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`} cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "assets" && (
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
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="custom-logo-file" />
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
                                    <input type="file" accept="image/*" onChange={handleEditLogoUpload} className="hidden" id={`edit-logo-file-${acc.id}`} /><label htmlFor={`edit-logo-file-${acc.id}`} className="cursor-pointer bg-white text-slate-600 p-2 rounded-lg text-xs font-bold flex items-center gap-2"><Upload size={14}/> Ganti Logo</label>
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
                                  {acc.logo ? <img src={acc.logo} className="w-8 h-8 rounded-lg object-contain bg-slate-100 p-1" /> : <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">{getCardDesign(acc.type).icon}</div>}
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 leading-none mb-1">{acc.name}</p>
                                    <p className="text-[10px] font-black text-blue-600 leading-none">Rp {acc.balance.toLocaleString()}</p>
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
              )}

              {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                    <img src={user?.photoURL || ""} className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-lg" />
                    <div>
                      <h3 className="font-black text-lg text-slate-800">{user?.displayName}</h3>
                      <p className="text-xs text-slate-400 font-semibold">{user?.email}</p>
                    </div>
                    <button onClick={() => signOut(auth)} className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2"><LogOut size={14}/> Logout</button>
                  </div>
                  <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Tag size={16} className="text-blue-600"/> Kelola Kategori Transaksi ({tType})</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setTType("expense")} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${tType === "expense" ? "bg-red-500 text-white shadow-md" : "bg-slate-100"}`}>PENGELUARAN</button>
                      <button onClick={() => setTType("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "income" ? "bg-green-50 text-white shadow-md" : "bg-slate-100"}`}>PEMASUKAN</button>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Kategori Baru..." className="flex-1 p-3 bg-slate-50 rounded-xl text-xs outline-blue-500" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                      <button onClick={addCustomCategory} className="bg-blue-600 text-white px-4 rounded-xl text-xs font-bold">Tambah</button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {categories.filter(c => c.type === tType).map(cat => (
                        <span key={cat.id} className="bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2">
                          {cat.name} <X size={12} className="text-red-500 cursor-pointer" onClick={() => deleteCategory(cat.id)}/>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><CreditCard size={16} className="text-blue-600"/> Kelola Kategori Dompet</h3>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Kategori baru" className="flex-1 p-3 bg-slate-50 rounded-xl text-xs outline-blue-500" value={newWalletTypeName} onChange={(e) => setNewWalletTypeName(e.target.value)} />
                      <button onClick={addCustomWalletType} className="bg-blue-600 text-white px-4 rounded-lg text-xs font-bold">Tambah</button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {walletTypes.map(t => (
                        <span key={t.id} className="bg-slate-100 px-3 py-1.5 rounded-full text-[9px] font-bold flex items-center gap-2 border shadow-sm">
                          {t.name} <X size={12} className="text-red-500 cursor-pointer" onClick={() => deleteWalletType(t.id)}/>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div> {/* Tutup Kolom Kiri */}

            {/* ==================== KOLOM KANAN (SEMPIT) ==================== */}
            <div className="space-y-4 md:col-span-1">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 italic text-lg px-1"><History size={20} className="text-blue-600"/> Riwayat Semua</h3>
              <div className="space-y-3 pb-24 md:pb-4">
                {transactions.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 text-sm italic bg-white rounded-3xl border border-slate-100">Belum ada transaksi</p>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded-[25px] flex justify-between items-center border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${t.type === "income" ? "bg-green-50 text-green-600" : t.type === "expense" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                          {t.type === "income" ? "↓" : t.type === "expense" ? "↑" : <ArrowRightLeft size={18}/>}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 leading-none mb-1 text-left">{t.note || t.category}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-left">
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
                  ))
                )}
              </div>
            </div> {/* Tutup Kolom Kanan */}

          </div> {/* Tutup Grid */}
        </div> {/* Tutup Container Konten */}
      </div> {/* Tutup Area Konten Utama Wrapper */}

      {/* BOTTOM NAV (MOBILE ONLY) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 pb-safe shadow-lg">
        <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-blue-600" : "text-slate-400"}`}>
          <Home size={22} className={activeTab === "home" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">Beranda</span>
        </button>
        <button onClick={() => setActiveTab("reports")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "reports" ? "text-blue-600" : "text-slate-400"}`}>
          <PieChart size={22} className={activeTab === "reports" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">Laporan</span>
        </button>
        <button onClick={() => setActiveTab("assets")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "assets" ? "text-blue-600" : "text-slate-400"}`}>
          <Wallet size={22} className={activeTab === "assets" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">Aset</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "settings" ? "text-blue-600" : "text-slate-400"}`}>
          <Settings size={22} className={activeTab === "settings" ? "fill-blue-100" : ""} />
          <span className="text-[10px] font-bold">Setting</span>
        </button>
      </nav>
    </main>
  );
}