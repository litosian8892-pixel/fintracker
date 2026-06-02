"use client";

import { useEffect, useState, useRef } from "react"; 
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, orderBy, deleteDoc, updateDoc, limit, where, getDoc } from "firebase/firestore";
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

import { X, Lock } from "lucide-react"; 

const safeEvaluate = (expr: string): number => {
  if (!expr) return 0;
  let sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return 0;
  sanitized = sanitized.replace(/[+\-*/(.]*$/, "");
  if (!sanitized) return 0;
  try {
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result === "number" && isFinite(result)) {
      return result;
    }
    return 0;
  } catch {
    const fallback = parseFloat(sanitized);
    return isNaN(fallback) ? 0 : fallback;
  }
};

export default function FintrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [appPin, setAppPin] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [walletTypes, setWalletTypes] = useState<WalletTypeData[]>([]);
  const [debts, setDebts] = useState<DebtData[]>([]);
  
  const [activeTab, setActiveTab] = useState<"home" | "reports" | "assets" | "settings" | "debts">("home");
  
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [reportTransactions, setReportTransactions] = useState<TransactionData[]>([]);
  
  const [txLimit, setTxLimit] = useState(10);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7)); 

  const [prevMonthTransactions, setPrevMonthTransactions] = useState<TransactionData[]>([]);

  const isSubmittingRef = useRef(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [globalSearch, setGlobalSearch] = useState("");
  const [searchResult, setSearchResult] = useState<TransactionData[]>([]);

  const [editingTransaction, setEditingTransaction] = useState<TransactionData | null>(null);
  const [editTAmount, setEditTAmount] = useState("");
  const [editTType, setEditTType] = useState<"income" | "expense" | "transfer">("expense");
  const [editTAccountId, setEditTAccountId] = useState("");
  const [editTToAccountId, setEditTToAccountId] = useState("");
  const [editTNote, setEditTNote] = useState("");
  const [editTCategory, setEditTCategory] = useState("");
  const [editTDate, setEditTDate] = useState("");
  const [editTAdminFee, setEditTAdminFee] = useState(""); 
  const [activeEditKeypad, setActiveEditKeypad] = useState<"amount" | "adminFee" | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); 
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (storedTheme) setTheme(storedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      if (theme === "dark" || (theme === "system" && mediaQuery.matches)) root.classList.add("dark");
      else root.classList.remove("dark");
    };
    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    const storedPin = localStorage.getItem("fintracker_pin");
    if (storedPin) { setAppPin(storedPin); setIsUnlocked(false); }
    else { setIsUnlocked(true); }
    setPinChecked(true); 
  }, []);

  const handleSetAppPin = (val: string | null) => {
    setAppPin(val);
    if (val) localStorage.setItem("fintracker_pin", val);
    else localStorage.removeItem("fintracker_pin");
  };

  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [accType, setAccType] = useState("Cash");
  const [accLogo, setAccLogo] = useState<string>("");
  const [accIsSavings, setAccIsSavings] = useState(false); 
  const [accTargetBalance, setAccTargetBalance] = useState(""); 
  const [accExcludeFromTotal, setAccExcludeFromTotal] = useState(false); 

  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccBalance, setEditAccBalance] = useState("");
  const [editAccLogo, setEditAccLogo] = useState<string>("");
  const [editAccIsSavings, setEditAccIsSavings] = useState(false); 
  const [editAccTargetBalance, setEditAccTargetBalance] = useState(""); 
  const [editAccExcludeFromTotal, setEditAccExcludeFromTotal] = useState(false); 

  const [tAmount, setTAmount] = useState("");
  const [tAdminFee, setTAdminFee] = useState(""); 
  const [tType, setTType] = useState<"income" | "expense" | "transfer">("expense");
  const [tAccountId, setTAccountId] = useState("");
  const [tToAccountId, setTToAccountId] = useState("");
  const [tNote, setTNote] = useState("");
  const [tCategory, setTCategory] = useState("");
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);

  const [newCatName, setNewCatName] = useState("");
  const [newExpenseType, setNewExpenseType] = useState<"fixed" | "variable">("variable"); 

  const [newWalletTypeName, setNewWalletTypeName] = useState("");

  const getPrevMonth = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 2, 1); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const formatRupiahTerbaca = (val: string) => {
    if (!val) return "Rp 0";
    const parsed = safeEvaluate(val);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parsed);
  };

  const triggerHapticFeedback = () => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); };

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
      if (sn.empty) setupDefaultWalletTypes(user.uid);
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
      const data = sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData));
      data.sort((a, b) => {
        const dateCompare = b.tDate.localeCompare(a.tDate);
        if (dateCompare !== 0) return dateCompare;
        const getMillis = (t: any) => {
          if (!t) return Date.now(); 
          if (typeof t.toMillis === 'function') return t.toMillis();
          if (t.seconds) return t.seconds * 1000;
          return new Date(t).getTime();
        };
        return getMillis(b.createdAt) - getMillis(a.createdAt);
      });
      setTransactions(data);
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
    if (!user) return;
    const prevMonth = getPrevMonth(reportMonth);
    const startOfPrev = `${prevMonth}-01`;
    const endOfPrev = `${prevMonth}-31`;
    const qPrev = query(collection(db, `users/${user.uid}/transactions`), where("tDate", ">=", startOfPrev), where("tDate", "<=", endOfPrev));
    const unsubPrev = onSnapshot(qPrev, (sn) => {
      setPrevMonthTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData)));
    });
    return () => unsubPrev();
  }, [user, reportMonth]);

  useEffect(() => {
    if (!user || !globalSearch) {
      setSearchResult([]);
      return;
    }
    const qGlobal = query(collection(db, `users/${user.uid}/transactions`), orderBy("tDate", "desc"), limit(500));
    const unsubGlobal = onSnapshot(qGlobal, (sn) => {
      const allTxs = sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData));
      const filtered = allTxs.filter(t => 
        (t.note && t.note.toLowerCase().includes(globalSearch.toLowerCase())) ||
        t.category.toLowerCase().includes(globalSearch.toLowerCase())
      );
      setSearchResult(filtered);
    });
    return () => unsubGlobal();
  }, [user, globalSearch]);

  const setupDefaultCategories = async (uid: string) => {
    const defaults = [
      { name: "Makanan", type: "expense", expenseType: "variable" }, 
      { name: "Transportasi", type: "expense", expenseType: "variable" }, 
      { name: "Tagihan Bulanan", type: "expense", expenseType: "fixed" }, 
      { name: "Gaji", type: "income" }
    ];
    for (const cat of defaults) await addDoc(collection(db, `users/${uid}/categories`), cat);
  };

  const setupDefaultWalletTypes = async (uid: string) => {
    const defaults = ["Bank", "E-Wallet", "Cash", "Lainnya"];
    for (let i = 0; i < defaults.length; i++) await addDoc(collection(db, `users/${uid}/walletTypes`), { name: defaults[i], order: i });
  };

  const addCustomCategory = async () => {
    if (isSubmittingRef.current) return; 
    if (!newCatName || !user) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const data: any = { name: newCatName, type: tType };
      if (tType === "expense") data.expenseType = newExpenseType;
      await addDoc(collection(db, `users/${user.uid}/categories`), data);
      setNewCatName("");
    } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const deleteCategory = async (id: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus kategori ini?")) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/categories/${id}`)); } 
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleEditCategory = async (id: string, newName: string, newBudget: number, expenseType: "fixed" | "variable") => {
    if (isSubmittingRef.current) return; 
    if (!user) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try { await updateDoc(doc(db, `users/${user.uid}/categories/${id}`), { name: newName, budgetLimit: newBudget, expenseType: expenseType }); } 
    catch (e) { alert("Gagal memperbarui kategori!"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleAddDebt = async (type: "debt" | "receivable", person: string, amount: number, note: string, dueDate: string, accountId?: string) => {
    if (isSubmittingRef.current) return; 
    if (!user) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (type === "receivable" && accountId) {
        const accRef = doc(db, `users/${user.uid}/accounts/${accountId}`);
        const acc = accounts.find(a => a.id === accountId);
        if (!acc) return alert("Dompet pengirim tidak ditemukan!");
        await updateDoc(accRef, { balance: acc.balance - amount });
        await addDoc(collection(db, `users/${user.uid}/transactions`), { amount, type: "expense", accountId, accountName: acc.name, category: "Piutang", note: `Memberikan pinjaman (piutang) ke ${person} - ${note || ""}`, tDate: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
      }
      await addDoc(collection(db, `users/${user.uid}/debts`), { type, personName: person, amount, paidAmount: 0, status: "active", note, dueDate, createdAt: new Date().toISOString() });
      alert("Catatan berhasil ditambahkan & saldo dompet Anda otomatis terpotong!");
    } catch (e) { alert("Gagal menambah catatan"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleDeleteDebt = async (id: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus catatan ini secara permanen?")) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/debts/${id}`)); } 
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleEditDebt = async (id: string, personName: string, amount: number, note: string, dueDate: string) => {
    if (isSubmittingRef.current) return;
    if (!user) return;
    const debtToEdit = debts.find(d => d.id === id);
    if (!debtToEdit) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const newStatus = debtToEdit.paidAmount >= amount ? "paid" : "active";
      await updateDoc(doc(db, `users/${user.uid}/debts/${id}`), { personName, amount, note, dueDate, status: newStatus });
    } catch (e) { alert("Gagal memperbarui catatan"); } 
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handlePayDebt = async (debtId: string, payAmount: number, accountId: string, categoryName: string, transactionNote: string) => {
    if (isSubmittingRef.current) return; 
    if (!user) return;
    const debt = debts.find(d => d.id === debtId);
    const acc = accounts.find(a => a.id === accountId);
    if (!debt || !acc) return alert("Data tidak ditemukan!");

    const newPaidAmount = debt.paidAmount + payAmount;
    const newStatus = newPaidAmount >= debt.amount ? "paid" : "active";

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}/debts/${debtId}`), { paidAmount: newPaidAmount, status: newStatus });
      if (debt.type === "debt") {
        await updateDoc(doc(db, `users/${user.uid}/accounts/${accountId}`), { balance: acc.balance - payAmount });
        await addDoc(collection(db, `users/${user.uid}/transactions`), { amount: payAmount, type: "expense", accountId, accountName: acc.name, category: categoryName, note: transactionNote, tDate: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, `users/${user.uid}/accounts/${accountId}`), { balance: acc.balance + payAmount });
        await addDoc(collection(db, `users/${user.uid}/transactions`), { amount: payAmount, type: "income", accountId, accountName: acc.name, category: categoryName, note: transactionNote, tDate: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
      }
      alert("Pembayaran berhasil dicatat & saldo otomatis diperbarui!");
    } catch (e) { alert("Gagal memproses pembayaran"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const addCustomWalletType = async () => {
    if (isSubmittingRef.current) return; 
    if (!newWalletTypeName || !user) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try { await addDoc(collection(db, `users/${user.uid}/walletTypes`), { name: newWalletTypeName, order: walletTypes.length }); setNewWalletTypeName(""); } 
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const deleteWalletType = async (id: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus kategori dompet?")) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/walletTypes/${id}`)); } 
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
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
    if (isSubmittingRef.current) return; 
    if (!user || !accName || !accBalance) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/accounts`), { name: accName, balance: Number(accBalance), type: accType, logo: accLogo, order: accounts.length, isSavings: accIsSavings, targetBalance: accIsSavings && accTargetBalance ? safeEvaluate(accTargetBalance) : null, excludeFromTotal: accExcludeFromTotal, createdAt: serverTimestamp() });
      setAccName(""); setAccBalance(""); setAccLogo(""); setAccTargetBalance(""); setAccIsSavings(false); setAccExcludeFromTotal(false);
    } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const deleteAccount = async (id: string, name: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm(`Hapus dompet "${name}"?`)) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/accounts/${id}`)); } catch (e) { alert("Gagal hapus"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  // --- LOGIKA BARU: AUDIT SALDO DOMPET ---
  const handleEditAccount = async (id: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !editAccName || !editAccBalance) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const oldAcc = accounts.find(a => a.id === id);
      const newBalance = Number(editAccBalance);

      // JIKA ADA SELISIH ANTARA SALDO BARU DAN SALDO LAMA, BUATKAN TRANSAKSI KOREKSI
      if (oldAcc && newBalance !== oldAcc.balance) {
        const diff = newBalance - oldAcc.balance;
        const tType = diff > 0 ? "income" : "expense";
        await addDoc(collection(db, `users/${user.uid}/transactions`), {
          amount: Math.abs(diff),
          type: tType,
          accountId: id,
          accountName: editAccName,
          note: `Penyesuaian manual dari Rp ${oldAcc.balance.toLocaleString('id-ID')} ke Rp ${newBalance.toLocaleString('id-ID')}`,
          category: "Penyesuaian Saldo", 
          tDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
      }

      await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), { name: editAccName, balance: newBalance, logo: editAccLogo, isSavings: editAccIsSavings, targetBalance: editAccIsSavings && editAccTargetBalance ? safeEvaluate(editAccTargetBalance) : null, excludeFromTotal: editAccExcludeFromTotal });
      
      setEditingAccId(null); setEditAccName(""); setEditAccBalance(""); setEditAccLogo(""); setEditAccTargetBalance(""); setEditAccIsSavings(false); setEditAccExcludeFromTotal(false); 
      alert("Dompet berhasil diperbarui & riwayat audit otomatis dicatat!");
    } catch (e) { alert("Gagal memperbarui"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const moveAccountOrder = async (index: number, direction: "up" | "down") => {
    if (isSubmittingRef.current) return; 
    if (!user) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;
    const currentAcc = accounts[index], targetAcc = accounts[targetIndex];
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const currentRef = doc(db, `users/${user.uid}/accounts/${currentAcc.id}`);
      const targetRef = doc(db, `users/${user.uid}/accounts/${targetAcc.id}`);
      await updateDoc(currentRef, { order: targetAcc.order !== undefined ? targetAcc.order : targetIndex });
      await updateDoc(targetRef, { order: currentAcc.order !== undefined ? currentAcc.order : index });
    } catch (e) { alert("Gagal memindahkan posisi"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleTransaction = async () => {
    if (isSubmittingRef.current) return; 
    if (!user || !tAmount || !tAccountId) return alert("Isi data dompet dan nominal dengan lengkap!");
    if (tType === "transfer" && (!tToAccountId || tAccountId === tToAccountId)) return alert("Pilih dompet tujuan yang berbeda!");
    if (tType !== "transfer" && !tCategory) return alert("Kategori transaksi wajib dipilih terlebih dahulu!");
    
    const amount = safeEvaluate(tAmount);
    if (amount <= 0) return alert("Nominal transaksi tidak valid!");

    const adminFee = tType === "transfer" && tAdminFee ? safeEvaluate(tAdminFee) : 0; 
    const sourceAcc = accounts.find(a => a.id === tAccountId);
    if (!sourceAcc) return alert("Dompet asal tidak ditemukan!");

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (tType === "transfer") {
        const destAcc = accounts.find(a => a.id === tToAccountId);
        if (!destAcc) return alert("Dompet tujuan tidak ditemukan!");
        await updateDoc(doc(db, `users/${user.uid}/accounts/${tAccountId}`), { balance: sourceAcc.balance - (amount + adminFee) });
        await updateDoc(doc(db, `users/${user.uid}/accounts/${tToAccountId}`), { balance: destAcc.balance + amount });
        await addDoc(collection(db, `users/${user.uid}/transactions`), { amount, type: "transfer", accountId: tAccountId, toAccountId: tToAccountId, accountName: sourceAcc.name, toAccountName: destAcc.name, note: tNote || "Transfer Dana", category: "Transfer", tDate, adminFee, createdAt: serverTimestamp() });
      } else {
        const newBal = tType === "income" ? sourceAcc.balance + amount : sourceAcc.balance - amount;
        await updateDoc(doc(db, `users/${user.uid}/accounts/${tAccountId}`), { balance: newBal });
        await addDoc(collection(db, `users/${user.uid}/transactions`), { amount, type: tType, accountId: tAccountId, accountName: sourceAcc.name, note: tNote, category: tCategory, tDate, createdAt: serverTimestamp() });
      }
      setTAmount(""); setTNote(""); setTAdminFee(""); setTCategory(""); setTAccountId(""); setTToAccountId(""); 
      alert("Transaksi Sukses!");
    } catch (e) { alert("Gagal simpan transaksi"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleDeleteTransaction = async (t: TransactionData) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus transaksi ini? Saldo akan dikoreksi.")) return;
    setIsSubmitting(true);
    try {
      if (t.type === "transfer") {
        const sourceAcc = accounts.find(a => a.id === t.accountId);
        const destAcc = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
        const adminFee = t.adminFee || 0; 
        if (sourceAcc) await updateDoc(doc(db, `users/${user.uid}/accounts/${t.accountId}`), { balance: sourceAcc.balance + (t.amount + adminFee) });
        if (destAcc) await updateDoc(doc(db, `users/${user.uid}/accounts/${t.toAccountId}`), { balance: destAcc.balance - t.amount });
      } else {
        const acc = accounts.find(a => a.id === t.accountId);
        if (acc) {
          const restoredBal = t.type === "income" ? acc.balance - t.amount : acc.balance + t.amount;
          await updateDoc(doc(db, `users/${user.uid}/accounts/${t.accountId}`), { balance: restoredBal });
        }
      }
      await deleteDoc(doc(db, `users/${user.uid}/transactions/${t.id}`));
    } catch (e) { alert("Gagal hapus transaksi"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const openEditModal = (t: TransactionData) => {
    setEditingTransaction(t); setEditTAmount(t.amount.toString()); setEditTType(t.type as any); setEditTAccountId(t.accountId);
    setEditTToAccountId(t.toAccountId || ""); setEditTNote(t.note || ""); setEditTCategory(t.category); setEditTDate(t.tDate); setEditTAdminFee(t.adminFee?.toString() || ""); 
  };

  const handleUpdateTransaction = async () => {
    if (isSubmittingRef.current) return; 
    if (!user || !editingTransaction) return;
    const oldT = editingTransaction;
    const newAmount = safeEvaluate(editTAmount);
    if (newAmount <= 0) return alert("Nominal transaksi tidak valid!");
    const newAdminFee = editTType === "transfer" && editTAdminFee ? safeEvaluate(editTAdminFee) : 0; 

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (oldT.type === "transfer") {
        const oldAdminFee = oldT.adminFee || 0;
        const oldSrc = accounts.find(a => a.id === oldT.accountId);
        const oldDest = oldT.toAccountId ? accounts.find(a => a.id === oldT.toAccountId) : null;
        if (oldSrc) await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.accountId}`), { balance: oldSrc.balance + (oldT.amount + oldAdminFee) });
        if (oldDest) await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.toAccountId}`), { balance: oldDest.balance - oldT.amount });
      } else {
        const oldAcc = accounts.find(a => a.id === oldT.accountId);
        if (oldAcc) {
          const restoredBal = oldT.type === "income" ? oldAcc.balance - oldT.amount : oldAcc.balance + oldT.amount;
          await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.accountId}`), { balance: restoredBal });
        }
      }

      const srcAccRef = doc(db, `users/${user.uid}/accounts/${editTAccountId}`);
      const srcSnap = await getDoc(srcAccRef);
      if (!srcSnap.exists()) throw "Dompet asal tidak ditemukan";
      const freshSrcBal = srcSnap.data().balance;

      if (editTType === "transfer") {
        const destAccRef = doc(db, `users/${user.uid}/accounts/${editTToAccountId}`);
        const destSnap = await getDoc(destAccRef);
        if (!destSnap.exists()) throw "Dompet tujuan tidak ditemukan";
        const freshDestBal = destSnap.data().balance;
        await updateDoc(srcAccRef, { balance: freshSrcBal - (newAmount + newAdminFee) });
        await updateDoc(destAccRef, { balance: freshDestBal + newAmount });
      } else {
        const newBal = editTType === "income" ? freshSrcBal + newAmount : freshSrcBal - newAmount;
        await updateDoc(srcAccRef, { balance: newBal });
      }

      const tRef = doc(db, `users/${user.uid}/transactions/${oldT.id}`);
      const updateData: any = { amount: newAmount, type: editTType, accountId: editTAccountId, accountName: accounts.find(a => a.id === editTAccountId)?.name || "", note: editTNote, category: editTType === "transfer" ? "Transfer" : editTCategory, tDate: editTDate };
      if (editTType === "transfer") {
        updateData.toAccountId = editTToAccountId; updateData.toAccountName = accounts.find(a => a.id === editTToAccountId)?.name || ""; updateData.adminFee = newAdminFee; 
      } else {
        updateData.toAccountId = null; updateData.toAccountName = null; updateData.adminFee = null;
      }
      await updateDoc(tRef, updateData);
      setEditingTransaction(null); setEditTAdminFee(""); alert("Transaksi berhasil diperbarui!");
    } catch (e) { alert("Gagal memperbarui transaksi: " + e); } 
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleEditKeypadPress = (key: string) => {
    triggerHapticFeedback();
    const currentVal = activeEditKeypad === "amount" ? editTAmount : editTAdminFee;
    const setVal = activeEditKeypad === "amount" ? setEditTAmount : setEditTAdminFee;
    if (key === "⌫") setVal(currentVal.slice(0, -1));
    else if (key === "C") setVal("");
    else if (key === "=") { const evaluated = safeEvaluate(currentVal); setVal(evaluated > 0 ? evaluated.toString() : ""); } 
    else if (key === "Ya") setActiveEditKeypad(null);
    else setVal(currentVal + key);
  };

  const adminFeeTxs = reportTransactions.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).map(t => ({ id: `fee-${t.id}`, amount: t.adminFee!, type: "expense", accountId: t.accountId, accountName: t.accountName, category: "Biaya Admin", note: `Biaya admin transfer ke ${t.toAccountName}`, tDate: t.tDate } as TransactionData));
  const combinedExpenseTxs = [...reportTransactions.filter(t => t.type === 'expense'), ...adminFeeTxs];
  const totalIncome = reportTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = combinedExpenseTxs.reduce((a, b) => a + b.amount, 0); 
  const expenseByCategory = combinedExpenseTxs.reduce((acc: Record<string, number>, curr: TransactionData) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));
  const incomeByCategory = reportTransactions.filter(t => t.type === 'income').reduce((acc: Record<string, number>, curr: TransactionData) => { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; return acc; }, {});
  const incomeCategoryList = Object.keys(incomeByCategory).map(key => ({ name: key, value: incomeByCategory[key] }));
  const expenseByDate = combinedExpenseTxs.reduce((acc: Record<string, number>, curr: TransactionData) => { const day = curr.tDate.split('-')[2]; acc[day] = (acc[day] || 0) + curr.amount; return acc; }, {});
  const barData = Object.keys(expenseByDate).sort().map(key => ({ date: `Tgl ${key}`, amount: expenseByDate[key] }));
  const prevAdminFeeTxs = prevMonthTransactions.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).map(t => ({ amount: t.adminFee! }));
  const prevCombinedExpense = [...prevMonthTransactions.filter(t => t.type === 'expense'), ...prevAdminFeeTxs];
  const prevTotalExpense = prevCombinedExpense.reduce((a, b) => a + b.amount, 0);
  const prevTotalIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);

  const handleExportToExcel = () => {
    if (reportTransactions.length === 0) return alert("Tidak ada data transaksi di bulan ini!");
    const excelData = reportTransactions.map((t, idx) => ({ "No": idx + 1, "Tanggal": t.tDate, "Tipe": t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer", "Kategori": t.category, "Dompet": t.type === "transfer" ? `${t.accountName} ➔ ${t.toAccountName}` : t.accountName, "Nominal (Rp)": t.amount, "Catatan": t.note || "-" }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    worksheet["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 25 }];
    XLSX.writeFile(workbook, `Fintracker_Laporan_${reportMonth}.xlsx`);
  };

  if (loading || !pinChecked) return <LoadingScreen />;
  if (!user) return <AuthScreen />;

  if (appPin && !isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] shadow-2xl w-full max-w-sm flex flex-col items-center border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-inner"><Lock size={32} strokeWidth={2.5}/></div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Aplikasi Terkunci</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 text-center font-semibold">Masukkan 6 digit PIN untuk membuka Fintracker.</p>
          <div className="flex gap-4 mb-8">
            {[...Array(6)].map((_, i) => (<div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${i < pinInput.length ? 'bg-blue-600 scale-110' : 'bg-slate-200 dark:bg-slate-800'} ${pinError ? 'bg-red-500 animate-pulse' : ''}`} />))}
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => { triggerHapticFeedback(); if(pinInput.length < 6) { const newVal = pinInput + num; setPinInput(newVal); if(newVal.length === 6) { if(newVal === appPin) { setTimeout(() => { setIsUnlocked(true); setPinInput(""); }, 200); } else { setPinError(true); triggerHapticFeedback(); setTimeout(() => { setPinInput(""); setPinError(false); }, 500); } } } }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black text-slate-800 dark:text-white active:bg-slate-200 dark:active:bg-slate-700 transition-colors select-none">{num}</button>
            ))}
            <div />
            <button onClick={() => { triggerHapticFeedback(); if(pinInput.length < 6) { const newVal = pinInput + "0"; setPinInput(newVal); if(newVal.length === 6) { if(newVal === appPin) { setTimeout(() => { setIsUnlocked(true); setPinInput(""); }, 200); } else { setPinError(true); triggerHapticFeedback(); setTimeout(() => { setPinInput(""); setPinError(false); }, 500); } } } }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black text-slate-800 dark:text-white active:bg-slate-200 dark:active:bg-slate-700 transition-colors select-none">0</button>
            <button onClick={() => { triggerHapticFeedback(); setPinInput(prev => prev.slice(0, -1)); }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center select-none"><X size={24}/></button>
          </div>
          <button onClick={() => signOut(auth)} className="mt-8 text-[10px] font-bold text-red-500 hover:underline cursor-pointer">Lupa PIN? (Logout Paksa)</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 md:flex transition-colors duration-200">
      <Sidebar user={user} activeTab={activeTab as any} setActiveTab={setActiveTab as any} onLogout={() => signOut(auth)} />
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col pb-24 md:pb-8">
        <MobileHeader user={user} onLogout={() => signOut(auth)} />
        <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className={`space-y-6 ${(activeTab === "home" || activeTab === "reports") ? "md:col-span-2" : "md:col-span-3"}`}>
              {activeTab === "home" && (
                <HomeTab 
                  tType={tType} setTType={setTType} tDate={tDate} setTDate={setTDate}
                  tCategory={tCategory} setTCategory={setTCategory} tAccountId={tAccountId} setTAccountId={setTAccountId}
                  tToAccountId={tToAccountId} setTToAccountId={setTToAccountId} tAmount={tAmount} setTAmount={setTAmount}
                  tAdminFee={tAdminFee} setTAdminFee={setTAdminFee} 
                  tNote={tNote} setTNote={setTNote} categories={categories} accounts={accounts} handleTransaction={handleTransaction}
                />
              )}
              {activeTab === "reports" && (
                <ReportsTab 
                  reportMonth={reportMonth} setReportMonth={setReportMonth} handleExportToExcel={handleExportToExcel}
                  totalIncome={totalIncome} totalExpense={totalExpense} pieData={pieData} incomeCategoryList={incomeCategoryList} barData={barData}
                  categories={categories} reportTransactions={reportTransactions}
                  globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} searchResult={searchResult} 
                  prevTotalIncome={prevTotalIncome} prevTotalExpense={prevTotalExpense} 
                />
              )}
              {activeTab === "debts" && (
                <DebtsTab 
                  debts={debts} accounts={accounts} categories={categories}
                  handleAddDebt={handleAddDebt} handleEditDebt={handleEditDebt} handlePayDebt={handlePayDebt} handleDeleteDebt={handleDeleteDebt} 
                />
              )}
              {activeTab === "assets" && (
                <AssetsTab 
                  accounts={accounts} walletTypes={walletTypes} accType={accType} setAccType={setAccType}
                  accName={accName} setAccName={setAccName} accBalance={accBalance} setAccBalance={setAccBalance}
                  accLogo={accLogo} handleLogoUpload={handleLogoUpload} accIsSavings={accIsSavings} setAccIsSavings={setAccIsSavings} 
                  accTargetBalance={accTargetBalance} setAccTargetBalance={setAccTargetBalance} 
                  accExcludeFromTotal={accExcludeFromTotal} setAccExcludeFromTotal={setAccExcludeFromTotal}
                  editAccExcludeFromTotal={editAccExcludeFromTotal} setEditAccExcludeFromTotal={setEditAccExcludeFromTotal}
                  handleCreateAccount={handleCreateAccount} editingAccId={editingAccId} setEditingAccId={setEditingAccId} 
                  editAccName={editAccName} setEditAccName={setEditAccName} editAccBalance={editAccBalance} setEditAccBalance={setEditAccBalance} 
                  editAccLogo={editAccLogo} setEditAccLogo={setEditAccLogo} editAccIsSavings={editAccIsSavings} setEditAccIsSavings={setEditAccIsSavings} 
                  editAccTargetBalance={editAccTargetBalance} setEditAccTargetBalance={setEditAccTargetBalance} 
                  handleEditAccount={handleEditAccount} deleteAccount={deleteAccount} moveAccountOrder={moveAccountOrder}
                />
              )}
              {activeTab === "settings" && (
                <SettingsTab 
                  user={user} onLogout={() => signOut(auth)} tType={tType} setTType={setTType}
                  newCatName={newCatName} setNewCatName={setNewCatName} newExpenseType={newExpenseType} setNewExpenseType={setNewExpenseType}
                  addCustomCategory={addCustomCategory} categories={categories} deleteCategory={deleteCategory} updateCategory={handleEditCategory}
                  newWalletTypeName={newWalletTypeName} setNewWalletTypeName={setNewWalletTypeName} addCustomWalletType={addCustomWalletType} 
                  walletTypes={walletTypes} deleteWalletType={deleteWalletType} theme={theme} setTheme={setTheme}
                  appPin={appPin} setAppPin={handleSetAppPin}
                />
              )}
            </div>

            {(activeTab === "home" || activeTab === "reports") && (
              <HistoryList 
                transactions={transactions} onDelete={handleDeleteTransaction} onEdit={openEditModal} 
                onLoadMore={() => setTxLimit(prev => prev + 10)} hasMore={transactions.length >= txLimit}
              />
            )}
          </div>
        </div>
      </div>
      <BottomNav activeTab={activeTab as any} setActiveTab={setActiveTab as any} />

      {/* POP-UP MODAL EDIT TRANSAKSI */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[30px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800 transition-colors duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Koreksi Transaksi</h3>
              <button disabled={isSubmitting} onClick={() => { setEditingTransaction(null); setActiveEditKeypad(null); }} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full disabled:opacity-50 transition-colors"><X size={14}/></button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto pb-12 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Transaksi</label>
                <select disabled={isSubmitting} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-slate-100 cursor-pointer disabled:opacity-50 transition-colors" value={editTType} onChange={(e) => { const newType = e.target.value as "income" | "expense" | "transfer"; setEditTType(newType); if (newType !== "transfer") { const filtered = categories.filter(c => c.type === newType); setEditTCategory(filtered.length > 0 ? filtered[0].name : (newType === "income" ? "Gaji" : "Makanan")); } else { setEditTCategory("Transfer"); } }}>
                  <option value="expense">🔴 Pengeluaran</option><option value="income">🟢 Pemasukan</option><option value="transfer">🔵 Transfer Dana</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal (Rp)</label>
                <input disabled={isSubmitting} type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveEditKeypad("amount"); }} className={`w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white disabled:opacity-50 transition-all ${activeEditKeypad === 'amount' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)] bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700'}`} value={editTAmount} onChange={(e) => setEditTAmount(e.target.value)} />
                {editTAmount && <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className="text-slate-600 dark:text-slate-200 font-black">{formatRupiahTerbaca(editTAmount)}</span></p>}
              </div>

              {editTType === "transfer" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Biaya Admin (Opsional)</label>
                  <input disabled={isSubmitting} type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveEditKeypad("adminFee"); }} className={`w-full p-3.5 bg-blue-50/20 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-blue-500 text-blue-900 dark:text-white disabled:opacity-50 transition-all ${activeEditKeypad === 'adminFee' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]' : 'border-blue-100 dark:border-slate-700'}`} value={editTAdminFee} onChange={(e) => setEditTAdminFee(e.target.value)} />
                  {editTAdminFee && <p className="text-[10px] font-bold text-blue-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className="text-blue-600 dark:text-blue-200 font-black">{formatRupiahTerbaca(editTAdminFee)}</span></p>}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                <input disabled={isSubmitting} type="date" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer disabled:opacity-50 transition-colors" value={editTDate} onChange={(e) => setEditTDate(e.target.value)} />
              </div>

              {editTType !== "transfer" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                  <select disabled={isSubmitting} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer disabled:opacity-50 transition-colors" value={editTCategory} onChange={(e) => setEditTCategory(e.target.value)}>
                    {categories.filter(c => c.type === editTType).map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dompet Asal</label>
                <select disabled={isSubmitting} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer disabled:opacity-50 transition-colors" value={editTAccountId} onChange={(e) => setEditTAccountId(e.target.value)}>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>

              {editTType === "transfer" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kirim Ke Dompet Tujuan</label>
                  <select disabled={isSubmitting} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-850 dark:text-white cursor-pointer disabled:opacity-50 transition-colors" value={editTToAccountId} onChange={(e) => setEditTToAccountId(e.target.value)}>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan</label>
                <input disabled={isSubmitting} onFocus={() => setActiveEditKeypad(null)} type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white disabled:opacity-50 transition-colors" value={editTNote} onChange={(e) => setEditTNote(e.target.value)} />
              </div>

              <div className="flex gap-2 pt-2 shrink-0">
                <button disabled={isSubmitting} onClick={handleUpdateTransaction} className={`flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Koreksi"}
                </button>
                <button disabled={isSubmitting} onClick={() => { setEditingTransaction(null); setActiveEditKeypad(null); }} className="py-3 px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile && editingTransaction && activeEditKeypad && (
        <>
          <div className="fixed inset-0 z-[140] bg-transparent" onClick={() => setActiveEditKeypad(null)}></div>
          <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 pb-6 transition-all duration-300 md:max-w-md md:mx-auto md:rounded-t-[30px] md:shadow-2xl translate-y-0">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-[10px] font-black text-slate-500 dark:text-blue-500 tracking-widest uppercase">{activeEditKeypad === "amount" ? "Kalkulator Nominal" : "Kalkulator Biaya Admin"}</span>
              <button onClick={() => setActiveEditKeypad(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-xs font-bold flex items-center gap-1">Tutup <X size={14} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-slate-800 dark:text-white font-black text-base">
              {["+", "-", "*", "/"].map((op) => (<button key={op} type="button" onClick={() => handleEditKeypadPress(op)} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">{op === "*" ? "×" : op === "/" ? "÷" : op}</button>))}
              {["7", "8", "9"].map((num) => (<button key={num} type="button" onClick={() => handleEditKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleEditKeypadPress("C")} className="py-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 active:bg-red-100 dark:active:bg-red-900/30 rounded-xl transition-all select-none">C</button>
              {["4", "5", "6"].map((num) => (<button key={num} type="button" onClick={() => handleEditKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleEditKeypadPress("⌫")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-300 flex items-center justify-center transition-all select-none">⌫</button>
              {["1", "2", "3"].map((num) => (<button key={num} type="button" onClick={() => handleEditKeypadPress(num)} className="py-3.5 bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 rounded-xl transition-all select-none">{num}</button>))}
              <button type="button" onClick={() => handleEditKeypadPress(".")} className="py-3.5 bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800 rounded-xl transition-all select-none">.</button>
              {["(", "0", ")"].map((char) => (<button key={char} type="button" onClick={() => handleEditKeypadPress(char)} className={`${char === "0" ? "bg-slate-50 dark:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700" : "bg-slate-100 dark:bg-slate-900 active:bg-slate-200 dark:active:bg-slate-800"} py-3.5 rounded-xl transition-all select-none`}>{char}</button>))}
              <button type="button" onClick={() => handleEditKeypadPress("Ya")} className="py-3.5 bg-blue-600 active:bg-blue-700 rounded-xl text-white font-black hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all select-none">Ya</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}