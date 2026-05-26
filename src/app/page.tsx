"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, runTransaction, orderBy, deleteDoc, updateDoc, limit, where } from "firebase/firestore";
import * as XLSX from "xlsx";

import { AccountData, TransactionData, CategoryData, WalletTypeData, DebtData } from "../types";
import LoadingScreen from "../components/shared/LoadingScreen";
import AuthScreen from "../components/shared/AuthScreen";
import HistoryList from "../components/shared/HistoryList";
import Sidebar from "../components/layout/Sidebar";
import MobileHeader from "../components/layout/MobileHeader";
import BottomNav from "../components/layout/BottomNav";
import HomeTab from "../components/tabs/HomeTab";
import ReportsTab from "../components/tabs/ReportsTab";
import AssetsTab from "../components/tabs/AssetsTab";
import SettingsTab from "../components/tabs/SettingsTab";
import DebtsTab from "../components/tabs/DebtsTab";

export default function FintrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [walletTypes, setWalletTypes] = useState<WalletTypeData[]>([]);
  const [debts, setDebts] = useState<DebtData[]>([]);
  
  const [activeTab, setActiveTab] = useState<"home" | "reports" | "assets" | "settings" | "debts">("home");
  
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [reportTransactions, setReportTransactions] = useState<TransactionData[]>([]);
  const [txLimit, setTxLimit] = useState(20);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); 

  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accType, setAccType] = useState("Cash");
  const [accLogo, setAccLogo] = useState<string>("");
  const [accIsSavings, setAccIsSavings] = useState(false); 

  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccBalance, setEditAccBalance] = useState("");
  const [editAccLogo, setEditAccLogo] = useState<string>("");
  const [editAccIsSavings, setEditAccIsSavings] = useState(false); 

  const [tAmount, setTAmount] = useState("");
  const [tType, setTType] = useState<"income" | "expense" | "transfer">("expense");
  const [tAccountId, setTAccountId] = useState("");
  const [tToAccountId, setTToAccountId] = useState("");
  const [tNote, setTNote] = useState("");
  const [tCategory, setTCategory] = useState("");
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);

  // CATEGORY STATES
  const [newCatName, setNewCatName] = useState("");
  const [newExpenseType, setNewExpenseType] = useState<"fixed" | "variable">("variable"); 

  const [newWalletTypeName, setNewWalletTypeName] = useState("");

  // --- FIREBASE EFFECTS ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubAcc = onSnapshot(query(collection(db, `users/${user.uid}/accounts`), orderBy("order", "asc")), (sn) => {
      setAccounts(sn.docs.map(d => ({ id: d.id, ...d.data() } as AccountData)));
    });
    const unsubCat = onSnapshot(collection(db, `users/${user.uid}/categories`), (sn) => {
      if (sn.empty) setupDefaultCategories(user.uid);
      else setCategories(sn.docs.map(d => ({ id: d.id, ...d.data() } as CategoryData)));
    });
    const unsubTypes = onSnapshot(query(collection(db, `users/${user.uid}/walletTypes`), orderBy("order", "asc")), (sn) => {
      if (sn.empty) setupDefaultWalletTypes(user.uid); // <--- INI YANG TADI ERROR KARENA FUNGSINYA HILANG
      else setWalletTypes(sn.docs.map(d => ({ id: d.id, ...d.data() } as WalletTypeData)));
    });
    const unsubDebts = onSnapshot(query(collection(db, `users/${user.uid}/debts`), orderBy("createdAt", "desc")), (sn) => {
      setDebts(sn.docs.map(d => ({ id: d.id, ...d.data() } as DebtData)));
    });
    return () => { unsubAcc(); unsubCat(); unsubTypes(); unsubDebts(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const qHistory = query(collection(db, `users/${user.uid}/transactions`), orderBy("tDate", "desc"), limit(txLimit));
    const unsubTr = onSnapshot(qHistory, (sn) => {
      setTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData)));
    });
    return () => unsubTr();
  }, [user, txLimit]);

  useEffect(() => {
    if (!user) return;
    const startOfMonth = `${reportMonth}-01`;
    const endOfMonth = `${reportMonth}-31`;
    const qReport = query(collection(db, `users/${user.uid}/transactions`), where("tDate", ">=", startOfMonth), where("tDate", "<=", endOfMonth));
    const unsubReport = onSnapshot(qReport, (sn) => {
      const data = sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData));
      data.sort((a, b) => b.tDate.localeCompare(a.tDate)); 
      setReportTransactions(data);
    });
    return () => unsubReport();
  }, [user, reportMonth]);

  useEffect(() => {
    if (tType !== "transfer") {
      const filtered = categories.filter(c => c.type === tType);
      setTCategory(filtered.length > 0 ? filtered[0].name : (tType === "income" ? "Gaji" : "Makanan"));
    } else setTCategory("Transfer");
  }, [tType, categories]);

  // --- FUNCTIONS ---
  
  const setupDefaultCategories = async (uid: string) => {
    const defaults = [
      { name: "Makanan", type: "expense", expenseType: "variable" }, 
      { name: "Transportasi", type: "expense", expenseType: "variable" }, 
      { name: "Tagihan Bulanan", type: "expense", expenseType: "fixed" }, 
      { name: "Gaji", type: "income" }
    ];
    for (const cat of defaults) await addDoc(collection(db, `users/${uid}/categories`), cat);
  };

  // FUNGSI INI YANG KEMARIN SAYA TERHAPUS, SEKARANG SUDAH KEMBALI!
  const setupDefaultWalletTypes = async (uid: string) => {
    const defaults = ["Bank", "E-Wallet", "Cash", "Lainnya"];
    for (let i = 0; i < defaults.length; i++) await addDoc(collection(db, `users/${uid}/walletTypes`), { name: defaults[i], order: i });
  };

  const addCustomCategory = async () => {
    if (!newCatName || !user) return;
    const data: any = { name: newCatName, type: tType };
    if (tType === "expense") data.expenseType = newExpenseType;
    await addDoc(collection(db, `users/${user.uid}/categories`), data);
    setNewCatName("");
  };

  const deleteCategory = async (id: string) => {
    if (!user || !confirm("Hapus kategori ini?")) return;
    await deleteDoc(doc(db, `users/${user.uid}/categories/${id}`));
  };

  const handleEditCategory = async (id: string, newName: string, newBudget: number, expenseType: "fixed" | "variable") => {
    if (!user) return;
    try { 
      await updateDoc(doc(db, `users/${user.uid}/categories/${id}`), { 
        name: newName,
        budgetLimit: newBudget,
        expenseType: expenseType
      }); 
    } catch (e) { alert("Gagal memperbarui kategori!"); }
  };

  const handleAddDebt = async (type: "debt" | "receivable", person: string, amount: number, note: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/debts`), {
        type, personName: person, amount, paidAmount: 0, status: "active", note, createdAt: new Date().toISOString()
      });
      alert("Catatan berhasil ditambahkan!");
    } catch (e) { alert("Gagal menambah catatan"); }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!user || !confirm("Hapus catatan ini secara permanen?")) return;
    await deleteDoc(doc(db, `users/${user.uid}/debts/${id}`));
  };

  const handlePayDebt = async (debtId: string, payAmount: number, accountId: string) => {
    if (!user) return;
    const debtRef = doc(db, `users/${user.uid}/debts/${debtId}`);
    const accRef = doc(db, `users/${user.uid}/accounts/${accountId}`);
    
    try {
      await runTransaction(db, async (ts) => {
        const debtSnap = await ts.get(debtRef);
        const accSnap = await ts.get(accRef);
        if (!debtSnap.exists() || !accSnap.exists()) throw "Data tidak ditemukan!";
        
        const debt = debtSnap.data() as DebtData;
        const acc = accSnap.data() as AccountData;
        
        const newPaidAmount = debt.paidAmount + payAmount;
        const newStatus = newPaidAmount >= debt.amount ? "paid" : "active";
        
        ts.update(debtRef, { paidAmount: newPaidAmount, status: newStatus });
        
        if (debt.type === "debt") {
          ts.update(accRef, { balance: acc.balance - payAmount });
          ts.set(doc(collection(db, `users/${user.uid}/transactions`)), {
            amount: payAmount, type: "expense", accountId, accountName: acc.name,
            category: "Bayar Utang", note: `Cicilan utang ke ${debt.personName}`,
            tDate: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
          });
        } else {
          ts.update(accRef, { balance: acc.balance + payAmount });
          ts.set(doc(collection(db, `users/${user.uid}/transactions`)), {
            amount: payAmount, type: "income", accountId, accountName: acc.name,
            category: "Terima Piutang", note: `Cicilan masuk dari ${debt.personName}`,
            tDate: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
          });
        }
      });
      alert("Pembayaran berhasil dicatat & saldo otomatis diperbarui!");
    } catch (e) { alert("Gagal memproses pembayaran"); }
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
      name: accName, balance: Number(accBalance), type: accType, logo: accLogo, order: accounts.length, 
      isSavings: accIsSavings,
      createdAt: serverTimestamp()
    });
    setAccName(""); setAccBalance(""); setAccLogo(""); setAccIsSavings(false); 
  };

  const deleteAccount = async (id: string, name: string) => {
    if (!user || !confirm(`Hapus dompet "${name}"?`)) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/accounts/${id}`)); } catch (e) { alert("Gagal hapus"); }
  };

  const handleEditAccount = async (id: string) => {
    if (!user || !editAccName || !editAccBalance) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), { 
        name: editAccName, balance: Number(editAccBalance), logo: editAccLogo, 
        isSavings: editAccIsSavings 
      });
      setEditingAccId(null); setEditAccName(""); setEditAccBalance(""); setEditAccLogo(""); setEditAccIsSavings(false);
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

  const handleDeleteTransaction = async (t: TransactionData) => {
    if (!user || !confirm("Hapus transaksi ini? Saldo akan dikoreksi.")) return;
    const transRef = doc(db, `users/${user.uid}/transactions/${t.id}`);
    try {
      await runTransaction(db, async (ts) => {
        if (t.type === "transfer") {
          const accRef = doc(db, `users/${user.uid}/accounts/${t.accountId}`);
          const toAccRef = doc(db, `users/${user.uid}/accounts/${t.toAccountId}`);
          const accSnap = await ts.get(accRef);
          const toSnap = t.toAccountId ? await ts.get(toAccRef) : null;
          if (accSnap.exists()) ts.update(accRef, { balance: accSnap.data().balance + t.amount });
          if (toSnap && toSnap.exists()) ts.update(toAccRef, { balance: toSnap.data().balance - t.amount });
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
    } catch (e) { alert("Gagal hapus"); }
  };

  const totalIncome = reportTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = reportTransactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const expenseByCategory = reportTransactions.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, curr: TransactionData) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));
  const incomeByCategory = reportTransactions.filter(t => t.type === 'income').reduce((acc: Record<string, number>, curr: TransactionData) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
  const incomeCategoryList = Object.keys(incomeByCategory).map(key => ({ name: key, value: incomeByCategory[key] }));
  const expenseByDate = reportTransactions.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, curr: TransactionData) => { const day = curr.tDate.split('-')[2]; acc[day] = (acc[day] || 0) + curr.amount; return acc; }, {});
  const barData = Object.keys(expenseByDate).sort().map(key => ({ date: `Tgl ${key}`, amount: expenseByDate[key] }));

  const handleExportToExcel = () => {
    if (reportTransactions.length === 0) return alert("Tidak ada data transaksi di bulan ini!");
    const excelData = reportTransactions.map((t, idx) => ({
      "No": idx + 1, "Tanggal": t.tDate, "Tipe": t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
      "Kategori": t.category, "Dompet": t.type === "transfer" ? `${t.accountName} ➔ ${t.toAccountName}` : t.accountName, "Nominal (Rp)": t.amount, "Catatan": t.note || "-"
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    worksheet["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 25 }];
    XLSX.writeFile(workbook, `Fintracker_Laporan_${reportMonth}.xlsx`);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;

  return (
    <main className="min-h-screen bg-slate-50 md:flex">
      <Sidebar user={user} activeTab={activeTab as any} setActiveTab={setActiveTab as any} onLogout={() => signOut(auth)} />
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col pb-24 md:pb-8">
        <MobileHeader user={user} onLogout={() => signOut(auth)} />
        <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {activeTab === "home" && (
                <HomeTab 
                  tType={tType} setTType={setTType} tDate={tDate} setTDate={setTDate}
                  tCategory={tCategory} setTCategory={setTCategory} tAccountId={tAccountId} setTAccountId={setTAccountId}
                  tToAccountId={tToAccountId} setTToAccountId={setTToAccountId} tAmount={tAmount} setTAmount={setTAmount}
                  tNote={tNote} setTNote={setTNote} categories={categories} accounts={accounts} handleTransaction={handleTransaction}
                />
              )}
              {activeTab === "reports" && (
                <ReportsTab 
                  reportMonth={reportMonth} setReportMonth={setReportMonth} handleExportToExcel={handleExportToExcel}
                  totalIncome={totalIncome} totalExpense={totalExpense} pieData={pieData} incomeCategoryList={incomeCategoryList} barData={barData}
                  categories={categories} reportTransactions={reportTransactions}
                />
              )}
              {activeTab === "debts" && (
                <DebtsTab 
                  debts={debts} accounts={accounts} handleAddDebt={handleAddDebt} handlePayDebt={handlePayDebt} handleDeleteDebt={handleDeleteDebt} 
                />
              )}
              {activeTab === "assets" && (
                <AssetsTab 
                  accounts={accounts} walletTypes={walletTypes} accType={accType} setAccType={setAccType}
                  accName={accName} setAccName={setAccName} accBalance={accBalance} setAccBalance={setAccBalance}
                  accLogo={accLogo} handleLogoUpload={handleLogoUpload} accIsSavings={accIsSavings} setAccIsSavings={setAccIsSavings} 
                  handleCreateAccount={handleCreateAccount} editingAccId={editingAccId} setEditingAccId={setEditingAccId} 
                  editAccName={editAccName} setEditAccName={setEditAccName} editAccBalance={editAccBalance} setEditAccBalance={setEditAccBalance} 
                  editAccLogo={editAccLogo} setEditAccLogo={setEditAccLogo} editAccIsSavings={editAccIsSavings} setEditAccIsSavings={setEditAccIsSavings} 
                  handleEditAccount={handleEditAccount} deleteAccount={deleteAccount} moveAccountOrder={moveAccountOrder}
                />
              )}
              {activeTab === "settings" && (
                <SettingsTab 
                  user={user} onLogout={() => signOut(auth)} tType={tType} setTType={setTType}
                  newCatName={newCatName} setNewCatName={setNewCatName} 
                  newExpenseType={newExpenseType} setNewExpenseType={setNewExpenseType}
                  addCustomCategory={addCustomCategory}
                  categories={categories} deleteCategory={deleteCategory} updateCategory={handleEditCategory}
                  newWalletTypeName={newWalletTypeName} setNewWalletTypeName={setNewWalletTypeName}
                  addCustomWalletType={addCustomWalletType} walletTypes={walletTypes} deleteWalletType={deleteWalletType}
                />
              )}
            </div>

            <HistoryList 
              transactions={transactions} onDelete={handleDeleteTransaction} 
              onLoadMore={() => setTxLimit(prev => prev + 20)} hasMore={transactions.length >= txLimit}
            />

          </div>
        </div>
      </div>
      <BottomNav activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
    </main>
  );
}