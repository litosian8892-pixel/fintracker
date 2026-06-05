"use client";

import { useEffect, useState, useRef } from "react"; 
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, orderBy, deleteDoc, updateDoc, limit, where, getDoc, setDoc } from "firebase/firestore";

import { AccountData, TransactionData, CategoryData, WalletTypeData, DebtData, SplitItemData, SubscriptionData } from "../types";
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

import { X, Lock, ChevronDown, Fingerprint, Crown, CheckCircle2, MessageCircle } from "lucide-react"; 

const safeEvaluate = (expr: string): number => {
  if (!expr) return 0;
  let sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return 0;
  sanitized = sanitized.replace(/[+\-*/(.]*$/, "");
  if (!sanitized) return 0;
  try {
    const result = new Function("use strict", `return (${sanitized});`)();
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
  
  // Optimasi: Membaca status premium dari cache lokal di awal untuk menghindari loading screen yang tertahan
  const [isPremium, setIsPremium] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fintracker_is_premium");
      return stored === "true" ? true : stored === "false" ? false : null;
    }
    return null;
  });
  
  const [appPin, setAppPin] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [walletTypes, setWalletTypes] = useState<WalletTypeData[]>([]);
  const [debts, setDebts] = useState<DebtData[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  
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

  // STATES UNTUK EDIT TRANSAKSI
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
  
  // STATES RINCIAN PECAHAN EDIT BARU
  const [editTSplits, setEditTSplits] = useState<SplitItemData[]>([]);
  const [activeEditSplitIndex, setActiveEditSplitIndex] = useState<number | null>(null);
  const [showEditSplitCatModal, setShowEditSplitCatModal] = useState(false);

  // STATE REAKTIF BARU: MELACAK STATUS BIOMETRIK
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  // STATE PRIVACY MODE (FITUR PREMIUM FASE 7)
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

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

    // Load Privacy Mode Status
    const storedPrivacy = localStorage.getItem("fintracker_privacy_mode");
    if (storedPrivacy === "true") setIsPrivacyMode(true);
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

  const triggerHapticFeedback = () => { if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(10); };

  const togglePrivacyMode = () => {
    triggerHapticFeedback();
    const newVal = !isPrivacyMode;
    setIsPrivacyMode(newVal);
    localStorage.setItem("fintracker_privacy_mode", newVal.toString());
  };

  const handleBiometricUnlock = async () => {
    try {
      const isBioEnabled = localStorage.getItem("fintracker_biometric_enabled") === "true";
      const credId = localStorage.getItem("fintracker_biometric_cred_id");
      if (!isBioEnabled || !credId || !window.PublicKeyCredential) return;

      const rawId = Uint8Array.from(atob(credId), c => c.charCodeAt(0));
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const options = {
        publicKey: {
          challenge: challenge,
          allowCredentials: [{ id: rawId, type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        }
      };

      const assertion = await navigator.credentials.get(options as any);
      if (assertion) {
        triggerHapticFeedback();
        setIsUnlocked(true);
      }
    } catch (err) {
      console.error("Gagal melakukan verifikasi sidik jari/FaceID:", err);
    }
  };

  useEffect(() => {
    const storedPin = localStorage.getItem("fintracker_pin");
    if (storedPin) { 
      setAppPin(storedPin); 
      setIsUnlocked(false); 
      
      const isBioEnabled = localStorage.getItem("fintracker_biometric_enabled") === "true";
      if (isBioEnabled) {
        setIsBiometricActive(true);
        setTimeout(() => {
          handleBiometricUnlock();
        }, 400); 
      }
    }
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
  const [accIsBusiness, setAccIsBusiness] = useState(false); 
  const [accSavingsGoalTitle, setAccSavingsGoalTitle] = useState(""); 
  // --- BARU: MULTI-CURRENCY AKUN BARU ---
  const [accCurrency, setAccCurrency] = useState("IDR");
  const [accExchangeRate, setAccExchangeRate] = useState("1");

  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccBalance, setEditAccBalance] = useState("");
  const [editAccLogo, setEditAccLogo] = useState<string>("");
  const [editAccIsSavings, setEditAccIsSavings] = useState(false); 
  const [editAccTargetBalance, setEditAccTargetBalance] = useState(""); 
  const [editAccExcludeFromTotal, setEditAccExcludeFromTotal] = useState(false); 
  const [editAccIsBusiness, setEditAccIsBusiness] = useState(false); 
  const [editAccSavingsGoalTitle, setEditAccSavingsGoalTitle] = useState(""); 
  // --- BARU: MULTI-CURRENCY AKUN EDIT ---
  const [editAccCurrency, setEditAccCurrency] = useState("IDR");
  const [editAccExchangeRate, setEditAccExchangeRate] = useState("1");

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

  // Optimasi: Memproses otentikasi & pengecekan dokumen hantu secara non-blocking
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      
      if (u) {
        // Jalankan pengecekan secara asinkron di latar belakang agar inisialisasi aplikasi tidak terhambat
        const checkGhostDocument = async () => {
          try {
            const userRef = doc(db, "users", u.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
              await setDoc(userRef, {
                uid: u.uid,
                name: u.displayName || "Pengguna Fintracker",
                email: u.email || "",
                photoURL: u.photoURL || "",
                isPremium: false, 
                createdAt: serverTimestamp()
              }, { merge: true });
            }
          } catch (error) {
            console.error("Gagal memeriksa profil pengguna:", error);
          }
        };
        checkGhostDocument();
      } else {
        localStorage.removeItem("fintracker_is_premium");
        setIsPremium(null);
      }
      
      setLoading(false); 
    });
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
    const unsubSubs = onSnapshot(query(collection(db, `users/${user.uid}/subscriptions`), orderBy("createdAt", "desc")), (sn) => {
      setSubscriptions(sn.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionData)));
    });

    // Optimasi: Memperbarui cache lokal setiap kali status premium diubah di server
    const unsubProfile = onSnapshot(doc(db, `users/${user.uid}`), (docSnap) => {
      if (docSnap.exists()) {
        const premiumStatus = docSnap.data().isPremium === true;
        setIsPremium(premiumStatus);
        localStorage.setItem("fintracker_is_premium", premiumStatus.toString());
      } else {
        setIsPremium(false);
        localStorage.setItem("fintracker_is_premium", "false");
      }
    });

    return () => { unsubAcc(); unsubCat(); unsubTypes(); unsubDebts(); unsubSubs(); unsubProfile(); };
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

  // --- MODIFIKASI: Menarik Data Transaksi 6 Bulan ke Belakang demi Analitik Tren ---
  useEffect(() => {
    if (!user || activeTab !== "reports") return; 
    
    const [y, m] = reportMonth.split("-").map(Number);
    // JS Date Month 0-indexed: June (6) minus 6 adalah 0 (Januari)
    const startOfRangeDate = new Date(y, m - 6, 1);
    const startYear = startOfRangeDate.getFullYear();
    const startMonth = String(startOfRangeDate.getMonth() + 1).padStart(2, "0");
    const startOfRange = `${startYear}-${startMonth}-01`;
    const endOfRange = `${reportMonth}-31`;

    const qReport = query(
      collection(db, `users/${user.uid}/transactions`), 
      where("tDate", ">=", startOfRange), 
      where("tDate", "<=", endOfRange)
    );
    
    const unsubReport = onSnapshot(qReport, (sn) => {
      const data = sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData));
      data.sort((a, b) => b.tDate.localeCompare(a.tDate)); 
      setReportTransactions(data);
    });
    return () => unsubReport();
  }, [user, reportMonth, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== "reports") return; 
    const prevMonth = getPrevMonth(reportMonth);
    const startOfPrev = `${prevMonth}-01`;
    const endOfPrev = `${prevMonth}-31`;
    const qPrev = query(collection(db, `users/${user.uid}/transactions`), where("tDate", ">=", startOfPrev), where("tDate", "<=", endOfPrev));
    const unsubPrev = onSnapshot(qPrev, (sn) => {
      setPrevMonthTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData)));
    });
    return () => unsubPrev();
  }, [user, reportMonth, activeTab]);

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

  const handleAddSubscription = async (name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => {
    if (isSubmittingRef.current) return;
    if (!user) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const acc = accounts.find(a => a.id === accountId);
      await addDoc(collection(db, `users/${user.uid}/subscriptions`), {
        name, amount, cycle, nextDueDate, accountId, accountName: acc?.name || "", category, createdAt: new Date().toISOString()
      });
      alert("Langganan berhasil ditambahkan!");
    } catch(e) { alert("Gagal menambah langganan"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleEditSubscription = async (id: string, name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => {
    if (isSubmittingRef.current) return;
    if (!user) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const acc = accounts.find(a => a.id === accountId);
      await updateDoc(doc(db, `users/${user.uid}/subscriptions/${id}`), {
        name, amount, cycle, nextDueDate, accountId, accountName: acc?.name || "", category
      });
      alert("Langganan berhasil diperbarui!");
    } catch(e) { alert("Gagal memperbarui langganan"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (isSubmittingRef.current) return;
    if (!user || !confirm("Hapus langganan tetap ini?")) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/subscriptions/${id}`));
    } catch(e) { alert("Gagal menghapus langganan"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handlePaySubscription = async (sub: SubscriptionData) => {
    if (isSubmittingRef.current) return;
    if (!user) return;
    
    const acc = accounts.find(a => a.id === sub.accountId);
    if (!acc) return alert("Dompet sumber dana tidak ditemukan! Silakan edit langganan ini dan pilih dompet yang aktif.");

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}/accounts/${sub.accountId}`), { balance: acc.balance - sub.amount });

      await addDoc(collection(db, `users/${user.uid}/transactions`), { 
        amount: sub.amount, 
        type: "expense", 
        accountId: sub.accountId, 
        accountName: acc.name, 
        category: sub.category, 
        note: `Pembayaran Langganan: ${sub.name}`, 
        tDate: new Date().toISOString().split('T')[0], 
        createdAt: serverTimestamp() 
      });

      const parts = sub.nextDueDate.split("-");
      let year = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10) - 1; 
      let day = parseInt(parts[2], 10);
      
      const oldDate = new Date(year, month, day);
      if (sub.cycle === "monthly") {
        oldDate.setMonth(oldDate.getMonth() + 1);
      } else {
        oldDate.setFullYear(oldDate.getFullYear() + 1);
      }
      
      const y = oldDate.getFullYear();
      const m = String(oldDate.getMonth() + 1).padStart(2, '0');
      const d = String(oldDate.getDate()).padStart(2, '0');
      const newDueDate = `${y}-${m}-${d}`;

      await updateDoc(doc(db, `users/${user.uid}/subscriptions/${sub.id}`), { nextDueDate: newDueDate });

      alert(`Pembayaran ${sub.name} berhasil! Jatuh tempo diperpanjang secara otomatis ke ${newDueDate}.`);
    } catch (e) { 
      alert("Gagal memproses pembayaran langganan."); 
    }
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

  // MODIFIKASI: Menyimpan mata uang dan kurs manual dompet baru
  const handleCreateAccount = async () => {
    if (isSubmittingRef.current) return; 
    if (!user || !accName || !accBalance) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/accounts`), { 
        name: accName, 
        balance: Number(accBalance), 
        type: accType, 
        logo: accLogo, 
        order: accounts.length, 
        isSavings: accIsSavings, 
        targetBalance: accIsSavings && accTargetBalance ? safeEvaluate(accTargetBalance) : null, 
        excludeFromTotal: accExcludeFromTotal, 
        isBusiness: accIsBusiness, 
        savingsGoalTitle: accIsSavings && accSavingsGoalTitle ? accSavingsGoalTitle : null, 
        // --- MULTI-CURRENCY ---
        currency: accCurrency,
        lastExchangeRate: accCurrency === "IDR" ? 1 : safeEvaluate(accExchangeRate) || 1,
        createdAt: serverTimestamp() 
      });
      setAccName(""); setAccBalance(""); setAccLogo(""); setAccTargetBalance(""); setAccIsSavings(false); setAccExcludeFromTotal(false); setAccIsBusiness(false); setAccSavingsGoalTitle("");
      setAccCurrency("IDR"); setAccExchangeRate("1");
    } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const deleteAccount = async (id: string, name: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm(`Hapus dompet "${name}"?`)) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try { deleteDoc(doc(db, `users/${user.uid}/accounts/${id}`)); } catch (e) { alert("Gagal hapus"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  // MODIFIKASI: Menyimpan mata uang & kurs manual serta merekam audit saldo yang dikonversikan ke IDR
  const handleEditAccount = async (id: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !editAccName || !editAccBalance) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const oldAcc = accounts.find(a => a.id === id);
      const newBalance = Number(editAccBalance);
      const targetCurrency = editAccCurrency;
      const targetRate = targetCurrency === "IDR" ? 1 : safeEvaluate(editAccExchangeRate) || 1;

      if (oldAcc && newBalance !== oldAcc.balance) {
        const diff = newBalance - oldAcc.balance;
        const tType = diff > 0 ? "income" : "expense";
        const convertedDiff = Math.abs(diff) * targetRate;
        const currencySymbol = targetCurrency !== "IDR" ? `${targetCurrency} ` : "";

        await addDoc(collection(db, `users/${user.uid}/transactions`), {
          amount: convertedDiff,
          type: tType,
          accountId: id,
          accountName: editAccName,
          note: `Penyesuaian manual dari ${currencySymbol}${oldAcc.balance.toLocaleString('id-ID')} ke ${currencySymbol}${newBalance.toLocaleString('id-ID')}`,
          category: "Penyesuaian Saldo", 
          tDate: new Date().toISOString().split('T')[0],
          originalAmount: Math.abs(diff),
          originalCurrency: targetCurrency,
          exchangeRate: targetRate,
          createdAt: serverTimestamp()
        });
      }

      await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), { 
        name: editAccName, 
        balance: newBalance, 
        logo: editAccLogo, 
        isSavings: editAccIsSavings, 
        targetBalance: editAccIsSavings && editAccTargetBalance ? safeEvaluate(editAccTargetBalance) : null, 
        excludeFromTotal: editAccExcludeFromTotal,
        isBusiness: editAccIsBusiness, 
        savingsGoalTitle: editAccIsSavings && editAccSavingsGoalTitle ? editAccSavingsGoalTitle : null,
        // --- MULTI-CURRENCY ---
        currency: targetCurrency,
        lastExchangeRate: targetRate
      });
      
      setEditingAccId(null); setEditAccName(""); setEditAccBalance(""); setEditAccLogo(""); setEditAccTargetBalance(""); setEditAccIsSavings(false); setEditAccExcludeFromTotal(false); setEditAccIsBusiness(false); setEditAccSavingsGoalTitle("");
      setEditAccCurrency("IDR"); setEditAccExchangeRate("1");
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

  // MODIFIKASI: Logika pencatatan transaksi yang secara otomatis mengonversi nominal asing ke IDR demi kestabilan database
  const handleTransaction = async (customSplits?: SplitItemData[]) => {
    if (isSubmittingRef.current) return; 
    if (!user || !tAmount || !tAccountId) return alert("Isi data dompet dan nominal dengan lengkap!");
    if (tType === "transfer" && (!tToAccountId || tAccountId === tToAccountId)) return alert("Pilih dompet tujuan yang berbeda!");
    if (tType !== "transfer" && !tCategory && (!customSplits || customSplits.length === 0)) return alert("Kategori transaksi wajib dipilih terlebih dahulu!");
    
    const rawAmount = safeEvaluate(tAmount);
    if (rawAmount <= 0) return alert("Nominal transaksi tidak valid!");

    const sourceAcc = accounts.find(a => a.id === tAccountId);
    if (!sourceAcc) return alert("Dompet asal tidak ditemukan!");

    const rateSource = sourceAcc.lastExchangeRate || 1;
    // Nilai transaksi terkonversi ke IDR
    const idrAmount = rawAmount * rateSource;

    if (customSplits && customSplits.length > 0) {
      const splitsTotal = customSplits.reduce((acc, curr) => acc + curr.amount, 0);
      if (splitsTotal !== rawAmount) {
        return alert(`Total pecahan (${sourceAcc.currency || "Rp"} ${splitsTotal.toLocaleString('id-ID')}) harus sama dengan total nominal transaksi (${sourceAcc.currency || "Rp"} ${rawAmount.toLocaleString('id-ID')})!`);
      }
    }

    const rawAdminFee = tType === "transfer" && tAdminFee ? safeEvaluate(tAdminFee) : 0; 
    const idrAdminFee = rawAdminFee * rateSource;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      if (tType === "transfer") {
        const destAcc = accounts.find(a => a.id === tToAccountId);
        if (!destAcc) return alert("Dompet tujuan tidak ditemukan!");
        
        const rateDest = destAcc.lastExchangeRate || 1;
        // Konversi nominal transfer dari IDR ke mata uang tujuan
        const destAmount = idrAmount / rateDest;

        await updateDoc(doc(db, `users/${user.uid}/accounts/${tAccountId}`), { balance: sourceAcc.balance - (rawAmount + rawAdminFee) });
        await updateDoc(doc(db, `users/${user.uid}/accounts/${tToAccountId}`), { balance: destAcc.balance + destAmount });
        
        await addDoc(collection(db, `users/${user.uid}/transactions`), { 
          amount: idrAmount, 
          type: "transfer", 
          accountId: tAccountId, 
          toAccountId: tToAccountId, 
          accountName: sourceAcc.name, 
          toAccountName: destAcc.name, 
          note: tNote || "Transfer Dana", 
          category: "Transfer", 
          tDate, 
          adminFee: idrAdminFee, 
          // Menyimpan rincian multi-currency
          originalAmount: rawAmount,
          originalCurrency: sourceAcc.currency || "IDR",
          exchangeRate: rateSource,
          createdAt: serverTimestamp() 
        });
      } else {
        const newBal = tType === "income" ? sourceAcc.balance + rawAmount : sourceAcc.balance - rawAmount;
        await updateDoc(doc(db, `users/${user.uid}/accounts/${tAccountId}`), { balance: newBal });
        
        const docData: any = { 
          amount: idrAmount, // Selalu simpan IDR ke 'amount' demi laporan dan grafik
          type: tType, 
          accountId: tAccountId, 
          accountName: sourceAcc.name, 
          note: tNote, 
          category: (customSplits && customSplits.length > 0) ? "Split Transaksi" : tCategory, 
          tDate, 
          originalAmount: rawAmount,
          originalCurrency: sourceAcc.currency || "IDR",
          exchangeRate: rateSource,
          createdAt: serverTimestamp() 
        };
        if (customSplits && customSplits.length > 0) {
          // Konversikan rincian pecahan splits ke IDR agar visual laporan splits sinkron
          docData.splits = customSplits.map(s => ({
            ...s,
            amount: s.amount * rateSource
          }));
        }
        await addDoc(collection(db, `users/${user.uid}/transactions`), docData);
      }
      setTAmount(""); setTNote(""); setTAdminFee(""); setTCategory(""); setTAccountId(""); setTToAccountId(""); 
      alert("Transaksi Sukses!");
    } catch (e) { alert("Gagal simpan transaksi"); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  // MODIFIKASI: Mengembalikan saldo dompet menggunakan originalAmount jika ada (kompatibel mundur)
  const handleDeleteTransaction = async (t: TransactionData) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus transaksi ini? Saldo akan dikoreksi.")) return;
    setIsSubmitting(true);
    try {
      if (t.type === "transfer") {
        const sourceAcc = accounts.find(a => a.id === t.accountId);
        const destAcc = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
        
        const rawAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount;
        const rawAdminFee = t.originalAmount !== undefined ? ((t.adminFee || 0) / (t.exchangeRate || 1)) : (t.adminFee || 0);

        if (sourceAcc) {
          await updateDoc(doc(db, `users/${user.uid}/accounts/${t.accountId}`), { balance: sourceAcc.balance + (rawAmount + rawAdminFee) });
        }
        if (destAcc) {
          const rateDest = destAcc.lastExchangeRate || 1;
          const destAmount = t.originalAmount !== undefined ? (t.amount / rateDest) : t.amount;
          await updateDoc(doc(db, `users/${user.uid}/accounts/${t.toAccountId}`), { balance: destAcc.balance - destAmount });
        }
      } else {
        const acc = accounts.find(a => a.id === t.accountId);
        if (acc) {
          const rawAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount;
          const restoredBal = t.type === "income" ? acc.balance - rawAmount : acc.balance + rawAmount;
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
    setEditTSplits(t.splits ? t.splits.map(s => ({ ...s })) : []); 
  };

  // MODIFIKASI: Logika koreksi transaksi yang ramah multi-currency & kompatibel mundur
  const handleUpdateTransaction = async () => {
    if (isSubmittingRef.current) return; 
    if (!user || !editingTransaction) return;
    const oldT = editingTransaction;
    
    const newRawAmount = editTSplits.length > 0 ? editTSplits.reduce((sum, s) => sum + s.amount, 0) : safeEvaluate(editTAmount);
    if (newRawAmount <= 0) return alert("Nominal transaksi tidak valid!");
    
    const newRawAdminFee = editTType === "transfer" && editTAdminFee ? safeEvaluate(editTAdminFee) : 0; 

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      // 1. Pulihkan saldo dompet lama menggunakan data transaksi lama
      if (oldT.type === "transfer") {
        const oldRawAmount = oldT.originalAmount !== undefined ? oldT.originalAmount : oldT.amount;
        const oldRawAdminFee = oldT.originalAmount !== undefined ? ((oldT.adminFee || 0) / (oldT.exchangeRate || 1)) : (oldT.adminFee || 0);
        
        const oldSrc = accounts.find(a => a.id === oldT.accountId);
        const oldDest = oldT.toAccountId ? accounts.find(a => a.id === oldT.toAccountId) : null;
        
        if (oldSrc) await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.accountId}`), { balance: oldSrc.balance + (oldRawAmount + oldRawAdminFee) });
        if (oldDest) {
          const rateOldDest = oldDest.lastExchangeRate || 1;
          const oldDestAmount = oldT.originalAmount !== undefined ? (oldT.amount / rateOldDest) : oldT.amount;
          await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.toAccountId}`), { balance: oldDest.balance - oldDestAmount });
        }
      } else {
        const oldAcc = accounts.find(a => a.id === oldT.accountId);
        if (oldAcc) {
          const oldRawAmount = oldT.originalAmount !== undefined ? oldT.originalAmount : oldT.amount;
          const restoredBal = oldT.type === "income" ? oldAcc.balance - oldRawAmount : oldAcc.balance + oldRawAmount;
          await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.accountId}`), { balance: restoredBal });
        }
      }

      // 2. Baca informasi dompet baru untuk menerapkan saldo baru
      const srcAccRef = doc(db, `users/${user.uid}/accounts/${editTAccountId}`);
      const srcSnap = await getDoc(srcAccRef);
      if (!srcSnap.exists()) throw "Dompet asal tidak ditemukan";
      const freshSrcBal = srcSnap.data().balance;
      const srcCurrency = srcSnap.data().currency || "IDR";
      const rateSource = srcSnap.data().lastExchangeRate || 1;

      const newIdrAmount = newRawAmount * rateSource;
      const newIdrAdminFee = newRawAdminFee * rateSource;

      if (editTType === "transfer") {
        const destAccRef = doc(db, `users/${user.uid}/accounts/${editTToAccountId}`);
        const destSnap = await getDoc(destAccRef);
        if (!destSnap.exists()) throw "Dompet tujuan tidak ditemukan";
        const freshDestBal = destSnap.data().balance;
        const rateDest = destSnap.data().lastExchangeRate || 1;
        
        const destAmount = newIdrAmount / rateDest;

        await updateDoc(srcAccRef, { balance: freshSrcBal - (newRawAmount + newRawAdminFee) });
        await updateDoc(destAccRef, { balance: freshDestBal + destAmount });
      } else {
        const newBal = editTType === "income" ? freshSrcBal + newRawAmount : freshSrcBal - newRawAmount;
        await updateDoc(srcAccRef, { balance: newBal });
      }

      // 3. Update dokumen transaksi di Firestore
      const tRef = doc(db, `users/${user.uid}/transactions/${oldT.id}`);
      const updateData: any = { 
        amount: newIdrAmount, // Tetap konversikan ke IDR
        type: editTType, 
        accountId: editTAccountId, 
        accountName: accounts.find(a => a.id === editTAccountId)?.name || "", 
        note: editTNote, 
        category: editTSplits.length > 0 ? "Split Transaksi" : (editTType === "transfer" ? "Transfer" : editTCategory), 
        tDate: editTDate,
        originalAmount: newRawAmount,
        originalCurrency: srcCurrency,
        exchangeRate: rateSource
      };
      
      if (editTType === "transfer") {
        updateData.toAccountId = editTToAccountId; 
        updateData.toAccountName = accounts.find(a => a.id === editTToAccountId)?.name || ""; 
        updateData.adminFee = newIdrAdminFee; 
        updateData.splits = null;
      } else {
        updateData.toAccountId = null; updateData.toAccountName = null; updateData.adminFee = null;
        if (editTSplits.length > 0) {
          updateData.splits = editTSplits.map(s => ({
            ...s,
            amount: s.amount * rateSource
          }));
        } else {
          updateData.splits = null;
        }
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

  const handleSelectEditSplitCategory = (catName: string) => {
    if (activeEditSplitIndex !== null) {
      const updated = [...editTSplits];
      updated[activeEditSplitIndex].category = catName;
      setEditTSplits(updated);
    }
    setShowEditSplitCatModal(false);
    setActiveEditSplitIndex(null);
  };

  // --- LOGIKA FILTER ULANG: Memastikan Laporan Bulanan Tetap Menggunakan Bulan Aktif ---
  const monthlyTransactions = reportTransactions.filter(t => t.tDate && t.tDate.startsWith(reportMonth));

  const adminFeeTxs = monthlyTransactions.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).map(t => ({ id: `fee-${t.id}`, amount: t.adminFee!, type: "expense", accountId: t.accountId, accountName: t.accountName, category: "Biaya Admin", note: `Biaya admin transfer ke ${t.toAccountName}`, tDate: t.tDate } as TransactionData));
  const combinedExpenseTxs = [...monthlyTransactions.filter(t => t.type === 'expense'), ...adminFeeTxs];
  const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = combinedExpenseTxs.reduce((a, b) => a + b.amount, 0); 
  
  const expenseByCategory = combinedExpenseTxs.reduce((acc: Record<string, number>, curr: TransactionData) => {
    if (curr.splits && curr.splits.length > 0) {
      curr.splits.forEach(s => {
        acc[s.category] = (acc[s.category] || 0) + s.amount;
      });
    } else {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    }
    return acc;
  }, {});

  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));
  
  const incomeByCategory = monthlyTransactions.filter(t => t.type === 'income').reduce((acc: Record<string, number>, curr: TransactionData) => {
    if (curr.splits && curr.splits.length > 0) {
      curr.splits.forEach(s => {
        acc[s.category] = (acc[s.category] || 0) + s.amount;
      });
    } else {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    }
    return acc;
  }, {});

  const incomeCategoryList = Object.keys(incomeByCategory).map(key => ({ name: key, value: incomeByCategory[key] }));
  const expenseByDate = combinedExpenseTxs.reduce((acc: Record<string, number>, curr: TransactionData) => { const day = curr.tDate.split('-')[2]; acc[day] = (acc[day] || 0) + curr.amount; return acc; }, {});
  const barData = Object.keys(expenseByDate).sort().map(key => ({ date: `Tgl ${key}`, amount: expenseByDate[key] }));
  const prevAdminFeeTxs = prevMonthTransactions.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).map(t => ({ amount: t.adminFee! }));
  const prevCombinedExpense = [...prevMonthTransactions.filter(t => t.type === 'expense'), ...prevAdminFeeTxs];
  const prevTotalExpense = prevCombinedExpense.reduce((a, b) => a + b.amount, 0);
  const prevTotalIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);

  const handleExportToExcel = async () => {
    if (monthlyTransactions.length === 0) return alert("Tidak ada data transaksi di bulan ini!");
    
    const excelData = monthlyTransactions.map((t, idx) => {
      let categoryStr = t.category;
      if (t.splits && t.splits.length > 0) {
        categoryStr = "Split: " + t.splits.map(s => `${s.category} (Rp ${s.amount.toLocaleString('id-ID')})`).join(', ');
      }
      
      let noteStr = t.note || "-";
      if (t.splits && t.splits.length > 0) {
        const splitNotes = t.splits.map(s => s.note).filter(Boolean);
        if (splitNotes.length > 0) {
          noteStr = `${noteStr} [Pecahan: ${splitNotes.join(', ')}]`;
        }
      }

      return { 
        "No": idx + 1, 
        "Tanggal": t.tDate, 
        "Tipe": t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer", 
        "Kategori": categoryStr, 
        "Dompet": t.type === "transfer" ? `${t.accountName} ➔ ${t.toAccountName}` : t.accountName, 
        "Nominal (Rp)": t.amount, 
        "Catatan": noteStr 
      };
    });

    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    worksheet["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 35 }];
    XLSX.writeFile(workbook, `Fintracker_Laporan_${reportMonth}.xlsx`);
  };

  // --- RENDER LAYAR LOADING, AUTH, & KUNCI ---
  
  if (loading || !pinChecked || (user && isPremium === null)) return <LoadingScreen />;
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
            
            {isBiometricActive ? (
              <button onClick={() => { triggerHapticFeedback(); handleBiometricUnlock(); }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-blue-500 dark:text-blue-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center select-none cursor-pointer">
                <Fingerprint size={24} />
              </button>
            ) : <div />}
            
            <button onClick={() => { triggerHapticFeedback(); if(pinInput.length < 6) { const newVal = pinInput + "0"; setPinInput(newVal); if(newVal.length === 6) { if(newVal === appPin) { setTimeout(() => { setIsUnlocked(true); setPinInput(""); }, 200); } else { setPinError(true); triggerHapticFeedback(); setTimeout(() => { setPinInput(""); setPinError(false); }, 500); } } } }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black text-slate-800 dark:text-white active:bg-slate-200 dark:active:bg-slate-700 transition-colors select-none">0</button>
            <button onClick={() => { triggerHapticFeedback(); setPinInput(prev => prev.slice(0, -1)); }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center select-none"><X size={24}/></button>
          </div>
          <button onClick={() => signOut(auth)} className="mt-8 text-[10px] font-bold text-red-500 hover:underline cursor-pointer">Lupa PIN? (Logout Paksa)</button>
        </div>
      </main>
    );
  }

  if (isPremium === false) {
    const waNumber = "6281234567890"; 
    const waMessage = `Halo Admin Fintracker! 🚀\nSaya ingin mengaktifkan Lisensi Premium (Lifetime).\n\n📧 Email akun saya: ${user.email}`;
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

    return (
      <main className="min-h-screen bg-[#070a13] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
        
        {/* Soft, rich ambient glows in the background (Match the new AuthScreen tone) */}
        <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -top-40 -left-40 pointer-events-none"></div>
        <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -bottom-40 -right-40 pointer-events-none"></div>

        {/* Card with subtle translucent border overlay (No harsh outlines) */}
        <div className="bg-[#0b101d]/60 backdrop-blur-2xl border border-white/[0.06] p-8 md:p-10 rounded-[35px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-sm flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Subtle gradient border overlay */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          
          {/* Icon with glowing ambient sphere behind it */}
          <div className="w-16 h-16 bg-[#0f1524] rounded-full flex items-center justify-center mb-5 shadow-xl border border-white/[0.08] relative">
            <div className="absolute w-8 h-8 bg-amber-500/20 rounded-full blur-[10px] pointer-events-none"></div>
            <Crown size={26} className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] z-10" strokeWidth={1.5}/>
          </div>
          
          {/* Header Typography */}
          <h2 className="text-2xl font-black mb-1.5 tracking-tight text-white leading-none text-center">
            AKSES <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">PREMIUM</span> TERKUNCI
          </h2>
          <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
            Aktifkan lisensi seumur hidup untuk membuka kunci akses selamanya.
          </p>

          {/* VIP Pass Digital Ticket Stub (Clean, Responsive Flexbox-Based Layout, NO absolute cutouts) */}
          <div className="w-full bg-[#151c30]/50 border border-amber-500/20 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-inner text-left flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[30px] rounded-full pointer-events-none"></div>
            
            {/* Top Stub Content */}
            <div className="pb-4 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest leading-none">LIFETIME ACCESS PASS</span>
                <Crown size={16} className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-tight">PREMIUM LIFETIME PASS</h3>
              <p className="text-[10px] font-semibold text-slate-400 leading-normal">
                Membuka penuh proteksi PIN & sidik jari, pemisahan dompet usaha, otomatisasi tagihan berulang, alokasi pecahan transaksi, s/d mutasi multi-valas asing selamanya.
              </p>
            </div>
            
            {/* Clean, responsive dotted line divider (Never cuts through text!) */}
            <div className="border-t border-dashed border-amber-500/25 my-1 pointer-events-none"></div>
            
            {/* Bottom Stub Content */}
            <div className="pt-2 flex justify-between items-center text-[8px] text-slate-500 font-mono leading-none">
              <span className="truncate max-w-[130px]">MEMBER: {user.email?.split("@")[0].toUpperCase()}</span>
              <span>NO: FT-{user.uid.slice(0, 6).toUpperCase()}</span>
            </div>
          </div>

          {/* Pricing & Checkout Section */}
          <div className="text-center w-full space-y-4">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-xs font-bold text-slate-500 line-through">Rp 150.000</span>
              <span className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">Rp 49.000</span>
              <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider ml-1">SAVE 67%</span>
            </div>
            <p className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest leading-none">Sekali Bayar Selamanya</p>

            <a href={waLink} target="_blank" rel="noreferrer" className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-[0_4px_20px_rgba(16,185,129,0.25)] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] duration-100 cursor-pointer">
              <MessageCircle size={16} /> Aktivasi via WhatsApp
            </a>

            <button onClick={() => signOut(auth)} className="text-[9px] font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer block mx-auto pt-1">
              Bukan {user.email}? Logout
            </button>
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 md:flex transition-colors duration-200">
      <Sidebar 
        user={user} activeTab={activeTab as any} setActiveTab={setActiveTab as any} onLogout={() => signOut(auth)} 
        isPrivacyMode={isPrivacyMode} togglePrivacyMode={togglePrivacyMode} 
      />
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col pb-24 md:pb-8">
        <MobileHeader 
          user={user} onLogout={() => signOut(auth)} 
          isPrivacyMode={isPrivacyMode} togglePrivacyMode={togglePrivacyMode} 
        />
        <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className={`space-y-6 ${(activeTab === "home" || activeTab === "reports" ? "md:col-span-2" : "md:col-span-3")}`}>
              {activeTab === "home" && (
                <HomeTab 
                  tType={tType} setTType={setTType} tDate={tDate} setTDate={setTDate}
                  tCategory={tCategory} setTCategory={setTCategory} tAccountId={tAccountId} setTAccountId={setTAccountId}
                  tToAccountId={tToAccountId} setTToAccountId={setTToAccountId} tAmount={tAmount} setTAmount={setTAmount}
                  tAdminFee={tAdminFee} setTAdminFee={setTAdminFee} 
                  tNote={tNote} setTNote={setTNote} categories={categories} accounts={accounts} handleTransaction={handleTransaction}
                  isPrivacyMode={isPrivacyMode}
                />
              )}
              {activeTab === "reports" && (
                <ReportsTab 
                  reportMonth={reportMonth} setReportMonth={setReportMonth} handleExportToExcel={handleExportToExcel}
                  totalIncome={totalIncome} totalExpense={totalExpense} pieData={pieData} incomeCategoryList={incomeCategoryList} barData={barData}
                  categories={categories} reportTransactions={reportTransactions}
                  globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} searchResult={searchResult} 
                  prevTotalIncome={prevTotalIncome} prevTotalExpense={prevTotalExpense} 
                  isPrivacyMode={isPrivacyMode}
                />
              )}
              {activeTab === "debts" && (
                <DebtsTab 
                  debts={debts} accounts={accounts} categories={categories}
                  handleAddDebt={handleAddDebt} 
                  handleEditDebt={handleEditDebt} 
                  handlePayDebt={handlePayDebt} 
                  handleDeleteDebt={handleDeleteDebt} 
                  subscriptions={subscriptions}
                  handleAddSubscription={handleAddSubscription}
                  handleEditSubscription={handleEditSubscription}
                  handlePaySubscription={handlePaySubscription}
                  handleDeleteSubscription={handleDeleteSubscription}
                  isPrivacyMode={isPrivacyMode}
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
                  
                  accIsBusiness={accIsBusiness} setAccIsBusiness={setAccIsBusiness}
                  editAccIsBusiness={editAccIsBusiness} setEditAccIsBusiness={setEditAccIsBusiness}

                  handleCreateAccount={handleCreateAccount} editingAccId={editingAccId} setEditingAccId={setEditingAccId} 
                  editAccName={editAccName} setEditAccName={setEditAccName} editAccBalance={editAccBalance} setEditAccBalance={setEditAccBalance} 
                  editAccLogo={editAccLogo} setEditAccLogo={setEditAccLogo} editAccIsSavings={editAccIsSavings} setEditAccIsSavings={setEditAccIsSavings} 
                  editAccTargetBalance={editAccTargetBalance} setEditAccTargetBalance={setEditAccTargetBalance} 
                  handleEditAccount={handleEditAccount} deleteAccount={deleteAccount} moveAccountOrder={moveAccountOrder}
                  
                  accSavingsGoalTitle={accSavingsGoalTitle} setAccSavingsGoalTitle={setAccSavingsGoalTitle}
                  editAccSavingsGoalTitle={editAccSavingsGoalTitle} setEditAccSavingsGoalTitle={setEditAccSavingsGoalTitle}
                  isPrivacyMode={isPrivacyMode}

                  // --- BARU: PROPS UNTUK MULTI-CURRENCY BINDINGS ---
                  accCurrency={accCurrency} setAccCurrency={setAccCurrency}
                  accExchangeRate={accExchangeRate} setAccExchangeRate={setAccExchangeRate}
                  editAccCurrency={editAccCurrency} setEditAccCurrency={setEditAccCurrency}
                  editAccExchangeRate={editAccExchangeRate} setEditAccExchangeRate={setEditAccExchangeRate}
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
                isPrivacyMode={isPrivacyMode}
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
                <select disabled={isSubmitting} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer disabled:opacity-50 transition-colors" value={editTType} onChange={(e) => { const newType = e.target.value as "income" | "expense" | "transfer"; setEditTType(newType); if (newType !== "transfer") { const filtered = categories.filter(c => c.type === newType); setEditTCategory(filtered.length > 0 ? filtered[0].name : (newType === "income" ? "Gaji" : "Makanan")); } else { setEditTCategory("Transfer"); } }}>
                  <option value="expense">🔴 Pengeluaran</option><option value="income">🟢 Pemasukan</option><option value="transfer">🔵 Transfer Dana</option>
                </select>
              </div>

              {editTSplits.length === 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal (Rp)</label>
                  <input disabled={isSubmitting} type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) setActiveEditKeypad("amount"); }} className={`w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white disabled:opacity-50 transition-all ${activeEditKeypad === 'amount' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)] bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700'}`} value={editTAmount} onChange={(e) => setEditTAmount(e.target.value)} />
                  {editTAmount && <p className="text-[10px] font-bold text-slate-455 dark:text-slate-400 pl-1 animate-in fade-in duration-150">Terbaca: <span className={`text-slate-600 dark:text-slate-200 font-black ${isPrivacyMode ? 'blur-sm select-none transition-all duration-300' : ''}`}>{formatRupiahTerbaca(editTAmount)}</span></p>}
                </div>
              )}

              {editTType === "transfer" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Biaya Admin (Opsional)</label>
                  <input disabled={isSubmitting} type="text" inputMode={isMobile ? "none" : undefined} onFocus={() => { if(isMobile) { setActiveEditKeypad("adminFee"); } }} className={`w-full p-3.5 bg-blue-50/20 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-blue-500 text-blue-900 dark:text-white disabled:opacity-50 transition-all ${activeEditKeypad === 'adminFee' && isMobile ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]' : 'border-blue-100'}`} value={editTAdminFee} onChange={(e) => setEditTAdminFee(e.target.value)} />
                  {editTAdminFee && <p className="text-[10px] font-bold text-blue-450 pl-1 animate-in fade-in duration-150">Terbaca: <span className={`text-blue-600 dark:text-blue-200 font-black ${isPrivacyMode ? 'blur-sm select-none transition-all duration-300' : ''}`}>{formatRupiahTerbaca(editTAdminFee)}</span></p>}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                <input disabled={isSubmitting} type="date" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer disabled:opacity-50 transition-colors" value={editTDate} onChange={(e) => setEditTDate(e.target.value)} />
              </div>

              {editTType !== "transfer" && editTSplits.length === 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                  <select disabled={isSubmitting} className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 dark:text-white cursor-pointer disabled:opacity-50 transition-colors" value={editTCategory} onChange={(e) => setEditTCategory(e.target.value)}>
                    {editTCategory && !categories.some(c => c.type === editTType && c.name === editTCategory) && (
                      <option value={editTCategory}>{editTCategory} (Sistem)</option>
                    )}
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan (Struk Utama)</label>
                <input disabled={isSubmitting} onFocus={() => { setActiveEditKeypad(null); }} type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white disabled:opacity-50 transition-colors" value={editTNote} onChange={(e) => setEditTNote(e.target.value)} />
              </div>

              {editTSplits && editTSplits.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">✂️ Koreksi Rincian Pecahan</p>
                    <span className={`text-[10px] font-black text-emerald-600 ${isPrivacyMode ? 'blur-sm select-none transition-all duration-300' : ''}`}>Total: Rp {editTSplits.reduce((sum, s) => sum + s.amount, 0).toLocaleString('id-ID')}</span>
                  </div>
                  {editTSplits.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3 relative text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400">PECAHAN #{i + 1}</span>
                        {editTSplits.length > 1 && (
                          <button type="button" onClick={() => {
                            const updated = editTSplits.filter((_, idx) => idx !== i);
                            setEditTSplits(updated);
                          }} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-0.5 cursor-pointer">
                            <X size={14} /> Hapus
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kategori</label>
                          <div onClick={() => {
                            setActiveEditSplitIndex(i);
                            setShowEditSplitCatModal(true);
                          }} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white cursor-pointer flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-750 truncate">
                            <span className="truncate">{item.category || "Pilih..."}</span>
                            <ChevronDown size={14} className="text-slate-400 shrink-0" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Nominal (Rp)</label>
                          <input type="text" placeholder="Contoh: 15000" className={`w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-blue-500 ${isPrivacyMode ? 'blur-sm select-none transition-all duration-300' : ''}`} value={item.amount === 0 ? "" : item.amount} onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            const updated = [...editTSplits];
                            updated[i].amount = val ? Number(val) : 0;
                            setEditTSplits(updated);
                          }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Catatan Khusus Pecahan</label>
                        <input type="text" placeholder="Keterangan..." className="w-full p-3 bg-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-blue-500" value={item.note || ""} onChange={(e) => {
                          const updated = [...editTSplits];
                          updated[i].note = e.target.value;
                          setEditTSplits(updated);
                        }} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => {
                    const totalSoFar = editTSplits.reduce((sum, s) => sum + s.amount, 0);
                    const diff = Math.max(0, safeEvaluate(editTAmount) - totalSoFar);
                    setEditTSplits([...editTSplits, { category: "", amount: diff, note: "" }]);
                  }} className="w-full py-2.5 border border-dashed border-blue-300 text-blue-600 dark:border-blue-800 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer">
                    + Tambah Baris Pecahan
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-4 shrink-0">
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
    </main>
  );
}