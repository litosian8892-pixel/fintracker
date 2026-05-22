"use client";

import { auth, db, googleProvider } from "../lib/firebase";
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, runTransaction, orderBy, deleteDoc, updateDoc, setDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Wallet, Plus, LogOut, ArrowUpCircle, ArrowDownCircle, History, Trash2, Edit2, Check, X, Calendar, Tag, CreditCard, Smartphone, Banknote, Settings } from "lucide-react";

// Tipe Akun Standar
const ACCOUNT_TYPES = ["Bank", "E-Wallet", "Cash", "Lainnya"];

export default function FintrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // State Input Dompet
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accType, setAccType] = useState("Cash");
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [newAccName, setNewAccName] = useState("");

  // State Input Transaksi
  const [tAmount, setTAmount] = useState("");
  const [tType, setTType] = useState<"income" | "expense">("expense");
  const [tAccountId, setTAccountId] = useState("");
  const [tNote, setTNote] = useState("");
  const [tCategory, setTCategory] = useState("");
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);

  // State Custom Kategori
  const [newCatName, setNewCatName] = useState("");

  // 1. CEK LOGIN & INITIAL DATA
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  // 2. AMBIL DATA DARI FIRESTORE
  useEffect(() => {
    if (!user) return;

    // Ambil Dompet
    const unsubAcc = onSnapshot(query(collection(db, `users/${user.uid}/accounts`)), (sn) => {
      setAccounts(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Ambil Transaksi
    const unsubTr = onSnapshot(query(collection(db, `users/${user.uid}/transactions`), orderBy("tDate", "desc")), (sn) => {
      setTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Ambil Kategori & Buat Default jika kosong
    const unsubCat = onSnapshot(collection(db, `users/${user.uid}/categories`), (sn) => {
      if (sn.empty) {
        setupDefaultCategories(user.uid);
      } else {
        setCategories(sn.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });

    return () => { unsubAcc(); unsubTr(); unsubCat(); };
  }, [user]);

  // FUNGSI SETUP KATEGORI DEFAULT PERTAMA KALI
  const setupDefaultCategories = async (uid: string) => {
    const defaults = [
      { name: "Makanan", type: "expense" },
      { name: "Transportasi", type: "expense" },
      { name: "Gaji", type: "income" },
      { name: "Bonus", type: "income" },
    ];
    for (const cat of defaults) {
      await addDoc(collection(db, `users/${uid}/categories`), cat);
    }
  };

  // FUNGSI TAMBAH KATEGORI BARU
  const addCustomCategory = async () => {
    if (!newCatName || !user) return;
    await addDoc(collection(db, `users/${user.uid}/categories`), {
      name: newCatName,
      type: tType
    });
    setNewCatName("");
  };

  const deleteCategory = async (id: string) => {
    if (!user || !confirm("Hapus kategori ini?")) return;
    await deleteDoc(doc(db, `users/${user.uid}/categories/${id}`));
  };

  // FUNGSI DOMPET
  const handleCreateAccount = async () => {
    if (!user || !accName || !accBalance) return;
    await addDoc(collection(db, `users/${user.uid}/accounts`), {
      name: accName, balance: Number(accBalance), type: accType, createdAt: serverTimestamp()
    });
    setAccName(""); setAccBalance("");
  };

  // FUNGSI TRANSAKSI
  const handleTransaction = async () => {
    if (!user || !tAmount || !tAccountId || !tCategory) return;
    const amount = Number(tAmount);
    const accRef = doc(db, `users/${user.uid}/accounts/${tAccountId}`);

    try {
      await runTransaction(db, async (ts) => {
        const snap = await ts.get(accRef);
        const newBal = tType === "income" ? snap.data()!.balance + amount : snap.data()!.balance - amount;
        ts.update(accRef, { balance: newBal });
        ts.set(doc(collection(db, `users/${user.uid}/transactions`)), {
          amount, type: tType, accountId: tAccountId, accountName: snap.data()!.name, 
          note: tNote, category: tCategory, tDate, createdAt: serverTimestamp()
        });
      });
      setTAmount(""); setTNote("");
    } catch (e) { alert("Error simpan transaksi"); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white py-4 px-8 rounded-2xl font-bold">Masuk Google</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 pb-20 text-slate-900 font-sans">
      {/* HEADER */}
      <div className="bg-white p-6 flex justify-between items-center shadow-sm border-b sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-blue-500" />
          <p className="font-bold text-sm">{user.displayName}</p>
        </div>
        <button onClick={() => signOut(auth)} className="text-slate-300"><LogOut size={20}/></button>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* TOTAL SALDO */}
        <div className="bg-blue-600 p-8 rounded-[35px] text-white shadow-2xl">
          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Total Balance</p>
          <h2 className="text-4xl font-black italic">Rp {accounts.reduce((a, b) => a + b.balance, 0).toLocaleString('id-ID')}</h2>
        </div>

        {/* FORM TRANSAKSI */}
        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setTType("expense")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "expense" ? "bg-red-500 text-white shadow-lg" : "bg-slate-100"}`}>PENGELUARAN</button>
            <button onClick={() => setTType("income")} className={`flex-1 py-3 rounded-xl text-[10px] font-bold ${tType === "income" ? "bg-green-500 text-white shadow-lg" : "bg-slate-100"}`}>PEMASUKAN</button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold border-none" value={tDate} onChange={(e) => setTDate(e.target.value)} />
            <select className="w-full p-3 bg-slate-50 rounded-2xl text-xs font-bold border-none" value={tCategory} onChange={(e) => setTCategory(e.target.value)}>
                <option value="">Pilih Kategori</option>
                {categories.filter(c => c.type === tType).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>

          <select value={tAccountId} onChange={(e) => setTAccountId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium border-none">
            <option value="">Pilih Dompet...</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
            ))}
          </select>

          <input type="number" placeholder="Nominal Rp" className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold border-none" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
          <button onClick={handleTransaction} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg">Simpan Transaksi</button>
        </div>

        {/* CUSTOM KATEGORI UI */}
        <details className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <summary className="text-[10px] font-bold text-slate-500 cursor-pointer uppercase flex items-center gap-2"><Settings size={14}/> Kelola Kategori {tType}</summary>
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
                <input type="text" placeholder="Tambah Kategori Baru..." className="flex-1 p-2 bg-slate-50 rounded-lg text-xs" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
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

        {/* DAFTAR DOMPET */}
        <div className="space-y-4">
            <h3 className="font-bold text-slate-800 italic px-1">Dompet Saya</h3>
            <div className="grid grid-cols-2 gap-3">
                {accounts.map(acc => (
                    <div key={acc.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative group">
                        <div className="mb-2 text-blue-600">
                            {acc.type === "Bank" ? <CreditCard size={20}/> : acc.type === "E-Wallet" ? <Smartphone size={20}/> : <Banknote size={20}/>}
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-none">{acc.name}</p>
                        <p className="text-[10px] text-slate-400 mb-2">{acc.type}</p>
                        <p className="text-sm font-black text-blue-600">Rp {acc.balance.toLocaleString()}</p>
                        <button onClick={() => deleteAccount(acc.id, acc.name)} className="absolute top-3 right-3 text-slate-200 group-hover:text-red-400"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        </div>

        {/* PENGATURAN TAMBAH DOMPET BARU */}
        <details className="bg-slate-200/50 rounded-2xl p-4">
          <summary className="text-[10px] font-black text-slate-500 cursor-pointer uppercase tracking-widest outline-none">➕ Tambah Dompet Baru</summary>
          <div className="mt-4 space-y-2">
            <select className="w-full p-3 bg-white rounded-xl text-xs border-none" value={accType} onChange={(e) => setAccType(e.target.value)}>
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Nama Dompet (BCA, Gopay, dll)" className="w-full p-3 bg-white rounded-xl text-xs border-none" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <input type="number" placeholder="Saldo Awal" className="w-full p-3 bg-white rounded-xl text-xs border-none" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
            <button onClick={handleCreateAccount} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold">Simpan Dompet</button>
          </div>
        </details>
      </div>
    </main>
  );
}