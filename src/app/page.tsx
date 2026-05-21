"use client";

import { auth, db, googleProvider } from "../lib/firebase";
import { signInWithPopup, onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, runTransaction, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Wallet, Plus, LogOut, ArrowUpCircle, ArrowDownCircle, History, CreditCard } from "lucide-react";

export default function FintrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [tAmount, setTAmount] = useState("");
  const [tType, setTType] = useState<"income" | "expense">("expense");
  const [tAccountId, setTAccountId] = useState("");
  const [tNote, setTNote] = useState("");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qAcc = query(collection(db, `users/${user.uid}/accounts`));
    const unsubAcc = onSnapshot(qAcc, (sn) => setAccounts(sn.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qTr = query(collection(db, `users/${user.uid}/transactions`), orderBy("createdAt", "desc"));
    const unsubTr = onSnapshot(qTr, (sn) => setTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubAcc(); unsubTr(); };
  }, [user]);

  const handleCreateAccount = async () => {
    if (!user || !accName || !accBalance) return;
    await addDoc(collection(db, `users/${user.uid}/accounts`), {
      name: accName, balance: Number(accBalance), createdAt: serverTimestamp()
    });
    setAccName(""); setAccBalance("");
  };

  const handleTransaction = async () => {
    if (!user || !tAmount || !tAccountId) return;
    const amount = Number(tAmount);
    const accRef = doc(db, `users/${user.uid}/accounts/${tAccountId}`);

    try {
      await runTransaction(db, async (ts) => {
        const snap = await ts.get(accRef);
        if (!snap.exists()) return;
        const newBal = tType === "income" ? snap.data().balance + amount : snap.data().balance - amount;
        ts.update(accRef, { balance: newBal });
        ts.set(doc(collection(db, `users/${user.uid}/transactions`)), {
          amount, type: tType, accountName: snap.data().name, note: tNote, createdAt: serverTimestamp()
        });
      });
      setTAmount(""); setTNote(""); alert("Berhasil!");
    } catch (e) { alert("Gagal!"); }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-6">
      <button onClick={() => signInWithPopup(auth, googleProvider)} className="bg-white py-4 px-8 rounded-2xl font-bold flex items-center gap-3 active:scale-95 transition-all shadow-2xl">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" />
        Mulai Sekarang
      </button>
    </div>
  );

  const totalSaldo = accounts.reduce((a, b) => a + b.balance, 0);

  return (
    <main className="min-h-screen bg-slate-50 pb-20 text-slate-900 font-sans">
      <div className="bg-white p-6 flex justify-between items-center shadow-sm border-b">
        <div className="flex items-center gap-3">
          <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-blue-500" />
          <p className="font-bold text-sm">Halo, {user.displayName?.split(' ')[0]}!</p>
        </div>
        <button onClick={() => signOut(auth)} className="text-slate-300 hover:text-red-500"><LogOut size={20}/></button>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="bg-blue-600 p-8 rounded-[35px] text-white shadow-2xl shadow-blue-200">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Total Saldo</p>
          <h2 className="text-4xl font-black italic">Rp {totalSaldo.toLocaleString('id-ID')}</h2>
        </div>

        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setTType("expense")} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${tType === "expense" ? "bg-red-500 text-white" : "bg-slate-100"}`}>PENGELUARAN</button>
            <button onClick={() => setTType("income")} className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${tType === "income" ? "bg-green-500 text-white" : "bg-slate-100"}`}>PEMASUKAN</button>
          </div>
          <select value={tAccountId} onChange={(e) => setTAccountId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-blue-500">
            <option value="">Pilih Dompet...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} (Rp {a.balance.toLocaleString()})</option>
            ))}
          </select>
          <input type="number" placeholder="Nominal Rp" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-blue-500" value={tAmount} onChange={(e) => setTAmount(e.target.value)} />
          <input type="text" placeholder="Catatan" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-blue-500" value={tNote} onChange={(e) => setTNote(e.target.value)} />
          <button onClick={handleTransaction} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">Simpan Transaksi</button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 italic text-lg"><History size={20}/> Riwayat</h3>
          {transactions.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                {t.type === "income" ? <ArrowUpCircle className="text-green-500" /> : <ArrowDownCircle className="text-red-500" />}
                <div>
                  <p className="font-bold text-sm text-slate-800">{t.note || "Tanpa Catatan"}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t.accountName}</p>
                </div>
              </div>
              <p className={`font-black ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                {t.type === "income" ? "+" : "-"} {Number(t.amount).toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>

        <details className="bg-slate-200/50 rounded-2xl p-4">
          <summary className="text-xs font-bold text-slate-500 cursor-pointer uppercase">⚙️ Dompet Saya</summary>
          <div className="mt-4 space-y-2">
            <input type="text" placeholder="Nama Akun" className="w-full p-3 bg-white rounded-xl text-xs" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <input type="number" placeholder="Saldo Awal" className="w-full p-3 bg-white rounded-xl text-xs" value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
            <button onClick={handleCreateAccount} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold">Tambah</button>
            <div className="pt-2 space-y-1">
              {accounts.map(a => <div key={a.id} className="text-[10px] flex justify-between bg-white/50 p-2 rounded-lg"><span>{a.name}</span><b>Rp {a.balance.toLocaleString()}</b></div>)}
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}