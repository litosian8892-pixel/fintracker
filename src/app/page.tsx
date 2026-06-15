"use client";

import { useEffect, useState, useRef } from "react"; 
import dynamic from "next/dynamic";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, serverTimestamp, doc, orderBy, deleteDoc, updateDoc, limit, where, getDoc, setDoc, getDocs, writeBatch } from "firebase/firestore";

import { AccountData, TransactionData, CategoryData, WalletTypeData, DebtData, SplitItemData, SubscriptionData } from "../types";
import LoadingScreen from "../components/shared/LoadingScreen";
import AuthScreen from "../components/shared/AuthScreen";
import Sidebar from "../components/layout/Sidebar";
import MobileHeader from "../components/layout/MobileHeader";
import BottomNav from "../components/layout/BottomNav";

import { X, Lock, ChevronDown, Fingerprint, Crown, CheckCircle2, MessageCircle, Rocket, ArrowRight } from "lucide-react";

const HomeTab = dynamic(() => import("../components/tabs/HomeTab"), { ssr: false });
const ReportsTab = dynamic(() => import("../components/tabs/ReportsTab"), { ssr: false });
const AssetsTab = dynamic(() => import("../components/tabs/AssetsTab"), { ssr: false });
const SettingsTab = dynamic(() => import("../components/tabs/SettingsTab"), { ssr: false });
const DebtsTab = dynamic(() => import("../components/tabs/DebtsTab"), { ssr: false });

const cleanCategoryName = (name: string): string => {
  if (!name) return "";
  return name.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
};

const safeEvaluate = (expr: string): number => {
  if (!expr) return 0;
  let sanitized = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!sanitized) return 0;
  sanitized = sanitized.replace(/[+\-*/(.]*$/, "");
  if (!sanitized) return 0;
  try {
    // BUG FIX: Memperbaiki eksekusi matematika yang sebelumnya terblokir oleh SyntaxError
    const result = new Function(`"use strict"; return (${sanitized});`)();
    if (typeof result === "number" && isFinite(result)) return result;
    return 0;
  } catch {
    const fallback = parseFloat(sanitized);
    return isNaN(fallback) ? 0 : fallback;
  }
};

const getLocalDateString = (dateInput = new Date()) => {
  const d = dateInput;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function FintrackerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // STATE UNTUK MIGRASI DOMAIN
  const [isOldDomain, setIsOldDomain] = useState(false);
  // 👇 GANTI LINK DI BAWAH INI DENGAN DOMAIN BARU ANDA YANG SUDAH DIBUAT DI VERCEL
  const NEW_DOMAIN_URL = "https://fintracker-id.vercel.app"; 

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Jika URL masih memuat kata "nine-neon", aktifkan Spanduk Migrasi
      if (window.location.hostname.includes("nine-neon")) {
        setIsOldDomain(true);
      }
    }
  }, []);
  
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
  const [reportMonth, setReportMonth] = useState(() => getLocalDateString().slice(0, 7)); 

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
  const [editTTime, setEditTTime] = useState(""); 
  const [editTAdminFee, setEditTAdminFee] = useState(""); 
  const [activeEditKeypad, setActiveEditKeypad] = useState<"amount" | "adminFee" | null>(null);
  
  const [editTSplits, setEditTSplits] = useState<SplitItemData[]>([]);
  const [activeEditSplitIndex, setActiveEditSplitIndex] = useState<number | null>(null);
  const [showEditSplitCatModal, setShowEditSplitCatModal] = useState(false);

  const [isBiometricActive, setIsBiometricActive] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    IDR: 1, USD: 16000, SGD: 12000, EUR: 17000, JPY: 100, CNY: 2200, GBP: 20000, AUD: 10500, MYR: 3400, SAR: 4200
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768); 
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // FITUR PINTAR: Auto-Refresh Jam & Tanggal saat aplikasi kembali dibuka (kembali fokus)
  useEffect(() => {
    const handleAppFocus = () => {
      if (document.visibilityState === "visible" || !document.hidden) {
        // Hanya update jika user BELUM mulai mengetik nominal (tAmount kosong)
        // dan TIDAK sedang dalam mode edit koreksi, agar tidak mengganggu proses input.
        if (!tAmount && !editingTransaction) {
          const now = new Date();
          setTDate(getLocalDateString(now));
          setTTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        }
      }
    };

    // Deteksi saat pindah/kembali ke tab (PC) atau buka kembali app dari background (Mobile)
    document.addEventListener("visibilitychange", handleAppFocus);
    window.addEventListener("focus", handleAppFocus);
    
    return () => {
      document.removeEventListener("visibilitychange", handleAppFocus);
      window.removeEventListener("focus", handleAppFocus);
    };
  }, [tAmount, editingTransaction]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (storedTheme) setTheme(storedTheme);
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

  const triggerHapticFeedback = () => { 
    if (typeof window !== "undefined" && localStorage.getItem("fintracker_haptic") !== "false") {
      // 1. Getaran Hardware Aktual (Untuk pengguna Android)
      if (navigator.vibrate) navigator.vibrate(15); 
      
      // 2. Ilusi Sentuhan / Pseudo-Haptic Web Audio (Untuk pengguna iPhone/iOS)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime); // Volume 15% agar halus
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }
  };

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
        setTimeout(() => { handleBiometricUnlock(); }, 400); 
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
  const [accCurrency, setAccCurrency] = useState("IDR");
  const [accIsInvestment, setAccIsInvestment] = useState(false);
  const [accAverageBuyPrice, setAccAverageBuyPrice] = useState("");
  const [accLastExchangeRate, setAccLastExchangeRate] = useState("");

  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editAccName, setEditAccName] = useState("");
  const [editAccBalance, setEditAccBalance] = useState("");
  const [editAccLogo, setEditAccLogo] = useState<string>("");
  const [editAccIsSavings, setEditAccIsSavings] = useState(false); 
  const [editAccTargetBalance, setEditAccTargetBalance] = useState(""); 
  const [editAccExcludeFromTotal, setEditAccExcludeFromTotal] = useState(false); 
  const [editAccIsBusiness, setEditAccIsBusiness] = useState(false); 
  const [editAccSavingsGoalTitle, setEditAccSavingsGoalTitle] = useState(""); 
  const [editAccCurrency, setEditAccCurrency] = useState("IDR");
  const [editAccIsInvestment, setEditAccIsInvestment] = useState(false);
  const [editAccAverageBuyPrice, setEditAccAverageBuyPrice] = useState("");
  const [editAccLastExchangeRate, setEditAccLastExchangeRate] = useState("");

  const [tAmount, setTAmount] = useState("");
  const [tAdminFee, setTAdminFee] = useState(""); 
  const [tType, setTType] = useState<"income" | "expense" | "transfer">("expense");
  const [tAccountId, setTAccountId] = useState("");
  const [tToAccountId, setTToAccountId] = useState("");
  const [tNote, setTNote] = useState("");
  const [tCategory, setTCategory] = useState("");
  const [tDate, setTDate] = useState(() => getLocalDateString());
  const [tTime, setTTime] = useState(() => { const now = new Date(); return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; });

  const [newCatName, setNewCatName] = useState("");
const [newCatIcon, setNewCatIcon] = useState(""); // <-- TAMBAHKAN BARIS INI
const [newExpenseType, setNewExpenseType] = useState<"fixed" | "variable">("variable");
  const [newWalletTypeName, setNewWalletTypeName] = useState("");

  const getPrevMonth = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 2, 1); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  useEffect(() => {
    // BUG FIX SAFARI: Timer pemaksa jika Firebase Auth tercekik oleh ITP Safari
    const authFallbackTimer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 3000);

    const unsub = onAuthStateChanged(auth, (u) => { 
      clearTimeout(authFallbackTimer);
      setUser(u); 
      if (u) {
        const checkGhostDocument = async () => {
          try {
            const userRef = doc(db, "users", u.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              await setDoc(userRef, { uid: u.uid, name: u.displayName || "Pengguna", email: u.email || "", photoURL: u.photoURL || "", isPremium: false, createdAt: serverTimestamp() }, { merge: true });
            }
          } catch (error) { console.error(error); }
        };
        checkGhostDocument();
      } else {
        localStorage.removeItem("fintracker_is_premium");
        setIsPremium(null);
      }
      setLoading(false); 
    });
    return () => { clearTimeout(authFallbackTimer); unsub(); };
  }, [loading]);

  // 1. DATA KRITIS (Langsung ditarik agar Beranda cepat menyala)
  useEffect(() => {
    if (!user) return;
    
    // SAFETY FALLBACK: Safari sering memblokir IndexedDB di tab browser, 
    // Mencegah isPremium nyangkut di null selamanya yang membuat layar putih/skeleton.
    const fallbackTimer = setTimeout(() => {
      if (isPremium === null) {
         const stored = localStorage.getItem("fintracker_is_premium");
         setIsPremium(stored === "true");
      }
    }, 2500);

    const unsubAcc = onSnapshot(query(collection(db, `users/${user.uid}/accounts`), orderBy("order", "asc")), 
      (sn) => { setAccounts(sn.docs.map(d => ({ id: d.id, ...d.data() } as AccountData))); },
      (err) => { console.warn("Accounts sync error (Safari DB blocked?):", err); }
    );
    
    const unsubCat = onSnapshot(collection(db, `users/${user.uid}/categories`), 
      (sn) => { if (sn.empty) setupDefaultCategories(user.uid); else setCategories(sn.docs.map(d => ({ id: d.id, ...d.data() } as CategoryData))); },
      (err) => { console.warn("Categories sync error:", err); }
    );
    
    const unsubProfile = onSnapshot(doc(db, `users/${user.uid}`), 
      (docSnap) => {
        clearTimeout(fallbackTimer);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const premiumStatus = data.isPremium === true;
          setIsPremium(premiumStatus);
          localStorage.setItem("fintracker_is_premium", premiumStatus.toString());
          if (data.rates) setExchangeRates(prev => ({ ...prev, ...data.rates }));
        } else { setIsPremium(false); localStorage.setItem("fintracker_is_premium", "false"); }
      },
      (err) => { 
        console.warn("Profile sync error:", err); 
        clearTimeout(fallbackTimer);
        const stored = localStorage.getItem("fintracker_is_premium");
        setIsPremium(stored === "true");
      }
    );
    
    return () => { clearTimeout(fallbackTimer); unsubAcc(); unsubCat(); unsubProfile(); };
  }, [user, isPremium]);

  // 2. DATA DEFERRED / DITUNDA (Ditarik 2 detik setelah Beranda muncul)
  useEffect(() => {
    if (!user) return;
    let unsubTypes: any, unsubDebts: any, unsubSubs: any;
    
    const timer = setTimeout(() => {
      unsubTypes = onSnapshot(query(collection(db, `users/${user.uid}/walletTypes`), orderBy("order", "asc")), (sn) => { if (sn.empty) setupDefaultWalletTypes(user.uid); else setWalletTypes(sn.docs.map(d => ({ id: d.id, ...d.data() } as WalletTypeData))); });
      unsubDebts = onSnapshot(query(collection(db, `users/${user.uid}/debts`), orderBy("createdAt", "desc")), (sn) => { setDebts(sn.docs.map(d => ({ id: d.id, ...d.data() } as DebtData))); });
      unsubSubs = onSnapshot(query(collection(db, `users/${user.uid}/subscriptions`), orderBy("createdAt", "desc")), (sn) => { setSubscriptions(sn.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionData))); });
    }, 2000); // Tunda 2 Detik
    
    return () => { 
      clearTimeout(timer); 
      if(unsubTypes) unsubTypes(); 
      if(unsubDebts) unsubDebts(); 
      if(unsubSubs) unsubSubs(); 
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const qHistory = query(collection(db, `users/${user.uid}/transactions`), orderBy("tDate", "desc"), limit(txLimit));
    const unsubTr = onSnapshot(qHistory, (sn) => {
      const data = sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData));
      
      // OPTIMASI: Mengurutkan kronologis berdasarkan tanggal, jam input (tTime), dan waktu pembuatan dokumen (createdAt)
      data.sort((a, b) => {
        const dateCompare = b.tDate.localeCompare(a.tDate);
        if (dateCompare !== 0) return dateCompare;
        
        const timeA = a.tTime || "00:00";
        const timeB = b.tTime || "00:00";
        const timeCompare = timeB.localeCompare(timeA);
        if (timeCompare !== 0) return timeCompare;

        const getMillis = (t: any) => {
          if (!t) return Date.now(); 
          if (typeof t.toMillis === 'function') {
            try { return t.toMillis(); } catch { return Date.now(); }
          }
          if (typeof t === 'object') {
            if (t.seconds !== undefined) return t.seconds * 1000;
            if (t._seconds !== undefined) return t._seconds * 1000;
          }
          const parsed = new Date(t).getTime();
          return isNaN(parsed) ? Date.now() : parsed;
        };
        return getMillis(b.createdAt) - getMillis(a.createdAt);
      });
      setTransactions(data);
    });
    return () => unsubTr();
  }, [user, txLimit]);

  useEffect(() => {
    if (!user || (activeTab !== "reports" && activeTab !== "assets" && activeTab !== "home")) return; 
    const [y, m] = reportMonth.split("-").map(Number);
    let monthsBack = 0;
    if (activeTab === "reports") monthsBack = 12; 
    else if (activeTab === "assets") monthsBack = 1; 
    else monthsBack = 0; 
    const startOfRangeDate = new Date(y, m - 1 - monthsBack, 1);
    const startYear = startOfRangeDate.getFullYear();
    const startMonth = String(startOfRangeDate.getMonth() + 1).padStart(2, "0");
    const startOfRange = `${startYear}-${startMonth}-01`;
    const endOfRange = `${reportMonth}-31`;
    const qReport = query(collection(db, `users/${user.uid}/transactions`), where("tDate", ">=", startOfRange), where("tDate", "<=", endOfRange));
    const unsubReport = onSnapshot(qReport, (sn) => {
      const data = sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData));
      
      // OPTIMASI: Mengurutkan berjenjang per tanggal, jam input (tTime), dan pembuatan dokumen (createdAt) agar tampilan Beranda sinkron
      data.sort((a, b) => {
        const dateCompare = b.tDate.localeCompare(a.tDate);
        if (dateCompare !== 0) return dateCompare;

        const timeA = a.tTime || "00:00";
        const timeB = b.tTime || "00:00";
        const timeCompare = timeB.localeCompare(timeA);
        if (timeCompare !== 0) return timeCompare;

        const getMillis = (t: any) => {
          if (!t) return Date.now(); 
          if (typeof t.toMillis === 'function') {
            try { return t.toMillis(); } catch { return Date.now(); }
          }
          if (typeof t === 'object') {
            if (t.seconds !== undefined) return t.seconds * 1000;
            if (t._seconds !== undefined) return t._seconds * 1000;
          }
          const parsed = new Date(t).getTime();
          return isNaN(parsed) ? Date.now() : parsed;
        };
        return getMillis(b.createdAt) - getMillis(a.createdAt);
      }); 
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
    const unsubPrev = onSnapshot(qPrev, (sn) => { setPrevMonthTransactions(sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData))); });
    return () => unsubPrev();
  }, [user, reportMonth, activeTab]);

  useEffect(() => {
    if (!user || !globalSearch) { setSearchResult([]); return; }
    const qGlobal = query(collection(db, `users/${user.uid}/transactions`), orderBy("tDate", "desc"), limit(500));
    const unsubGlobal = onSnapshot(qGlobal, (sn) => {
      const allTxs = sn.docs.map(d => ({ id: d.id, ...d.data() } as TransactionData));
      const filtered = allTxs.filter(t => (t.note && t.note.toLowerCase().includes(globalSearch.toLowerCase())) || t.category.toLowerCase().includes(globalSearch.toLowerCase()));
      setSearchResult(filtered);
    });
    return () => unsubGlobal();
  }, [user, globalSearch]);

  useEffect(() => {
    if (!user || categories.length === 0 || reportTransactions.length === 0) return;
    const healData = async () => {
      const batch = writeBatch(db);
      let hasUpdates = false;
      reportTransactions.forEach(t => {
        const cleanTxCat = cleanCategoryName(t.category);
        const matchedCat = categories.find(c => cleanCategoryName(c.name) === cleanTxCat);
        if (matchedCat && t.category !== matchedCat.name) {
          const txRef = doc(db, `users/${user.uid}/transactions/${t.id}`);
          batch.update(txRef, { category: matchedCat.name });
          hasUpdates = true;
        }
      });
      if (hasUpdates) await batch.commit();
    };
    const timeoutId = setTimeout(() => { if (typeof window !== 'undefined' && 'requestIdleCallback' in window) { (window as any).requestIdleCallback(() => healData()); } else { healData(); } }, 4000); 
    return () => clearTimeout(timeoutId);
  }, [user, categories, reportTransactions]);

  const setupDefaultCategories = async (uid: string) => {
    const defaults = [{ name: "Makanan", type: "expense", expenseType: "variable" }, { name: "Transportasi", type: "expense", expenseType: "variable" }, { name: "Tagihan Bulanan", type: "expense", expenseType: "fixed" }, { name: "Gaji", type: "income" }];
    for (const cat of defaults) await addDoc(collection(db, `users/${uid}/categories`), cat);
  };
  const setupDefaultWalletTypes = async (uid: string) => {
    const defaults = ["Bank", "E-Wallet", "Cash", "Lainnya"];
    for (let i = 0; i < defaults.length; i++) await addDoc(collection(db, `users/${uid}/walletTypes`), { name: defaults[i], order: i });
  };
  const addCustomCategory = async () => {
    if (isSubmittingRef.current) return; 
    if (!newCatName || !user) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { 
  const data: any = { name: newCatName, type: tType, icon: newCatIcon || "" }; // <-- UBAH DI SINI
  if (tType === "expense") data.expenseType = newExpenseType; 
  await addDoc(collection(db, `users/${user.uid}/categories`), data); 
  setNewCatName(""); 
  setNewCatIcon(""); // <-- TAMBAHKAN BARIS INI (Reset emoji)
} finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const deleteCategory = async (id: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus kategori ini?")) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/categories/${id}`)); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleEditCategory = async (id: string, newName: string, newBudget: number | null, expenseType: "fixed" | "variable", newIcon?: string) => {
    if (isSubmittingRef.current) return; 
    if (!user) return;
    const oldCategory = categories.find(c => c.id === id); const oldName = oldCategory ? oldCategory.name : "";
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { 
      await updateDoc(doc(db, `users/${user.uid}/categories/${id}`), { name: newName, budgetLimit: newBudget, expenseType: expenseType, icon: newIcon || "" }); 
      if (oldName && oldName !== newName) {
        const txQuery = query(collection(db, `users/${user.uid}/transactions`), where("category", "==", oldName));
        const txSnap = await getDocs(txQuery);
        const batch = writeBatch(db);
        txSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          const updatePayload: any = { category: newName };
          if (data.splits && Array.isArray(data.splits)) { updatePayload.splits = data.splits.map((s: any) => s.category === oldName ? { ...s, category: newName } : s); }
          batch.update(doc(db, `users/${user.uid}/transactions/${docSnap.id}`), updatePayload);
        });
        await batch.commit();
      }
    } catch (e) { alert("Gagal memperbarui kategori!"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleAddDebt = async (type: "debt" | "receivable", person: string, amount: number, note: string, dueDate: string, accountId?: string) => {
    if (isSubmittingRef.current) return; 
    if (!user) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      if (type === "receivable" && accountId) {
        const accRef = doc(db, `users/${user.uid}/accounts/${accountId}`);
        const acc = accounts.find(a => a.id === accountId);
        if (!acc) return alert("Dompet pengirim tidak ditemukan!");
        await updateDoc(accRef, { balance: acc.balance - amount });
        await addDoc(collection(db, `users/${user.uid}/transactions`), { amount, type: "expense", accountId, accountName: acc.name, category: "Piutang", note: `Memberikan pinjaman (piutang) ke ${person} - ${note || ""}`, tDate: getLocalDateString(), createdAt: serverTimestamp() });
      }
      await addDoc(collection(db, `users/${user.uid}/debts`), { type, personName: person, amount, paidAmount: 0, status: "active", note, dueDate, createdAt: new Date().toISOString() });
      alert("Catatan berhasil ditambahkan & saldo dompet Anda otomatis terpotong!");
    } catch (e) { alert("Gagal menambah catatan"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleDeleteDebt = async (id: string) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus catatan ini secara permanen?")) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/debts/${id}`)); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleEditDebt = async (id: string, personName: string, amount: number, note: string, dueDate: string) => {
    if (isSubmittingRef.current) return; if (!user) return;
    const debtToEdit = debts.find(d => d.id === id); if (!debtToEdit) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      const newStatus = debtToEdit.paidAmount >= amount ? "paid" : "active";
      await updateDoc(doc(db, `users/${user.uid}/debts/${id}`), { personName, amount, note, dueDate, status: newStatus });
    } catch (e) { alert("Gagal memperbarui catatan"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handlePayDebt = async (debtId: string, payAmount: number, accountId: string, categoryName: string, transactionNote: string) => {
    if (isSubmittingRef.current) return; 
    if (!user) return;
    const debt = debts.find(d => d.id === debtId); const acc = accounts.find(a => a.id === accountId);
    if (!debt || !acc) return alert("Data tidak ditemukan!");
    const newPaidAmount = debt.paidAmount + payAmount; const newStatus = newPaidAmount >= debt.amount ? "paid" : "active";
    isSubmittingRef.current = true; setIsSubmitting(true);
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
    } catch (e) { alert("Gagal memproses pembayaran"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleAddSubscription = async (name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => {
    if (isSubmittingRef.current) return; if (!user) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { const acc = accounts.find(a => a.id === accountId); await addDoc(collection(db, `users/${user.uid}/subscriptions`), { name, amount, cycle, nextDueDate, accountId, accountName: acc?.name || "", category, createdAt: new Date().toISOString() }); alert("Langganan berhasil ditambahkan!"); } catch(e) { alert("Gagal menambah langganan"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleEditSubscription = async (id: string, name: string, amount: number, cycle: "monthly" | "yearly", nextDueDate: string, accountId: string, category: string) => {
    if (isSubmittingRef.current) return; if (!user) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { const acc = accounts.find(a => a.id === accountId); await updateDoc(doc(db, `users/${user.uid}/subscriptions/${id}`), { name, amount, cycle, nextDueDate, accountId, accountName: acc?.name || "", category }); alert("Langganan berhasil diperbarui!"); } catch(e) { alert("Gagal memperbarui langganan"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleDeleteSubscription = async (id: string) => {
    if (isSubmittingRef.current) return; if (!user || !confirm("Hapus langganan tetap ini?")) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/subscriptions/${id}`)); } catch(e) { alert("Gagal menghapus langganan"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handlePaySubscription = async (sub: SubscriptionData) => {
    if (isSubmittingRef.current) return; if (!user) return;
    const acc = accounts.find(a => a.id === sub.accountId); if (!acc) return alert("Dompet sumber dana tidak ditemukan! Silakan edit langganan ini dan pilih dompet yang aktif.");
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      await updateDoc(doc(db, `users/${user.uid}/accounts/${sub.accountId}`), { balance: acc.balance - sub.amount });
      await addDoc(collection(db, `users/${user.uid}/transactions`), { amount: sub.amount, type: "expense", accountId: sub.accountId, accountName: acc.name, category: sub.category, note: `Pembayaran Langganan: ${sub.name}`, tDate: new Date().toISOString().split('T')[0], createdAt: serverTimestamp() });
      const parts = sub.nextDueDate.split("-"); let year = parseInt(parts[0], 10); let month = parseInt(parts[1], 10) - 1; let day = parseInt(parts[2], 10);
      const oldDate = new Date(year, month, day); if (sub.cycle === "monthly") { oldDate.setMonth(oldDate.getMonth() + 1); } else { oldDate.setFullYear(oldDate.getFullYear() + 1); }
      const y = oldDate.getFullYear(); const m = String(oldDate.getMonth() + 1).padStart(2, '0'); const d = String(oldDate.getDate()).padStart(2, '0'); const newDueDate = `${y}-${m}-${d}`;
      await updateDoc(doc(db, `users/${user.uid}/subscriptions/${sub.id}`), { nextDueDate: newDueDate });
      alert(`Pembayaran ${sub.name} berhasil! Jatuh tempo diperpanjang secara otomatis ke ${newDueDate}.`);
    } catch (e) { alert("Gagal memproses pembayaran langganan."); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const addCustomWalletType = async () => {
    if (isSubmittingRef.current) return; if (!newWalletTypeName || !user) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { await addDoc(collection(db, `users/${user.uid}/walletTypes`), { name: newWalletTypeName, order: walletTypes.length }); setNewWalletTypeName(""); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const deleteWalletType = async (id: string) => {
    if (isSubmittingRef.current) return; if (!user || !confirm("Hapus kategori dompet?")) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { await deleteDoc(doc(db, `users/${user.uid}/walletTypes/${id}`)); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) { if (file.size > 500000) return alert("File terlalu besar! Maks 500 KB."); const reader = new FileReader(); reader.onloadend = () => isEdit ? setEditAccLogo(reader.result as string) : setAccLogo(reader.result as string); reader.readAsDataURL(file); }
  };
  const handleUpdateGlobalRates = async (newRates: Record<string, number>) => {
    if (isSubmittingRef.current) return; if (!user) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { await updateDoc(doc(db, `users/${user.uid}`), { rates: newRates }); alert("Sistem: Seluruh nilai kurs global manual berhasil diperbarui!"); } catch (e) { alert("Gagal memperbarui nilai kurs global"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleCreateAccount = async () => {
    if (isSubmittingRef.current) return; if (!user || !accName || !accBalance) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${user.uid}/accounts`), { 
        name: accName, balance: Number(accBalance), type: accType, logo: accLogo, order: accounts.length, isSavings: accIsSavings && !accIsInvestment, targetBalance: accIsSavings && accTargetBalance && !accIsInvestment ? safeEvaluate(accTargetBalance) : null, excludeFromTotal: accExcludeFromTotal, isBusiness: accIsBusiness && !accIsInvestment, savingsGoalTitle: accIsSavings && accSavingsGoalTitle && !accIsInvestment ? accSavingsGoalTitle : null, currency: accCurrency, isInvestment: accIsInvestment, averageBuyPrice: accIsInvestment && accAverageBuyPrice ? safeEvaluate(accAverageBuyPrice) : null, lastExchangeRate: accIsInvestment && accLastExchangeRate ? safeEvaluate(accLastExchangeRate) : (accCurrency === "IDR" ? 1 : exchangeRates[accCurrency] || 1), createdAt: serverTimestamp() 
      });
      setAccName(""); setAccBalance(""); setAccLogo(""); setAccTargetBalance(""); setAccIsSavings(false); setAccExcludeFromTotal(false); setAccIsBusiness(false); setAccSavingsGoalTitle(""); setAccCurrency("IDR"); setAccIsInvestment(false); setAccAverageBuyPrice(""); setAccLastExchangeRate("");
    } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const deleteAccount = async (id: string, name: string) => {
    if (isSubmittingRef.current) return; if (!user || !confirm(`Hapus dompet "${name}"?`)) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try { deleteDoc(doc(db, `users/${user.uid}/accounts/${id}`)); } catch (e) { alert("Gagal hapus"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleEditAccount = async (id: string) => {
    if (isSubmittingRef.current) return; if (!user || !editAccName || !editAccBalance) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      const oldAcc = accounts.find(a => a.id === id); const newBalance = Number(editAccBalance); const targetCurrency = editAccCurrency; const targetRate = targetCurrency === "IDR" ? 1 : exchangeRates[targetCurrency] || 1; 
      if (oldAcc && newBalance !== oldAcc.balance) {
        const diff = newBalance - oldAcc.balance; const tType = diff > 0 ? "income" : "expense"; const convertedDiff = Math.abs(diff) * targetRate; const currencySymbol = targetCurrency !== "IDR" ? `${targetCurrency} ` : "";
        await addDoc(collection(db, `users/${user.uid}/transactions`), { amount: convertedDiff, type: tType, accountId: id, accountName: editAccName, note: `Penyesuaian manual dari ${currencySymbol}${oldAcc.balance.toLocaleString('id-ID')} ke ${currencySymbol}${newBalance.toLocaleString('id-ID')}`, category: "Penyesuaian Saldo", tDate: new Date().toISOString().split('T')[0], originalAmount: Math.abs(diff), originalCurrency: targetCurrency, exchangeRate: targetRate, createdAt: serverTimestamp() });
      }
      await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), { name: editAccName, balance: newBalance, logo: editAccLogo, isSavings: editAccIsSavings && !editAccIsInvestment, targetBalance: editAccIsSavings && editAccTargetBalance && !editAccIsInvestment ? safeEvaluate(editAccTargetBalance) : null, excludeFromTotal: editAccExcludeFromTotal, isBusiness: editAccIsBusiness && !editAccIsInvestment, savingsGoalTitle: editAccIsSavings && editAccSavingsGoalTitle && !editAccIsInvestment ? editAccSavingsGoalTitle : null, currency: targetCurrency, isInvestment: editAccIsInvestment, averageBuyPrice: editAccIsInvestment && editAccAverageBuyPrice ? safeEvaluate(editAccAverageBuyPrice) : null, lastExchangeRate: editAccIsInvestment && editAccLastExchangeRate ? safeEvaluate(editAccLastExchangeRate) : targetRate });
      setEditingAccId(null); setEditAccName(""); setEditAccBalance(""); setEditAccLogo(""); setEditAccTargetBalance(""); setEditAccIsSavings(false); setEditAccExcludeFromTotal(false); setEditAccIsBusiness(false); setEditAccSavingsGoalTitle(""); setEditAccCurrency("IDR"); setEditAccIsInvestment(false); setEditAccAverageBuyPrice(""); setEditAccLastExchangeRate("");
      alert("Dompet berhasil diperbarui & riwayat audit otomatis dicatat!");
    } catch (e) { alert("Gagal memperbarui"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };
  const handleUpdateInvestmentRate = async (id: string, newRate: number) => {
    if (!user) return; try { await updateDoc(doc(db, `users/${user.uid}/accounts/${id}`), { lastExchangeRate: newRate }); } catch (error) { console.error("Gagal update rate:", error); }
  };

  const moveAccountOrder = async (index: number, direction: "up" | "down") => {
    if (isSubmittingRef.current) return; if (!user) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;
    const currentAcc = accounts[index], targetAcc = accounts[targetIndex];
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      const currentRef = doc(db, `users/${user.uid}/accounts/${currentAcc.id}`); const targetRef = doc(db, `users/${user.uid}/accounts/${targetAcc.id}`);
      await updateDoc(currentRef, { order: targetAcc.order !== undefined ? targetAcc.order : targetIndex }); await updateDoc(targetRef, { order: currentAcc.order !== undefined ? currentAcc.order : index });
    } catch (e) { alert("Gagal memindahkan posisi"); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const handleTransaction = async (customSplits?: SplitItemData[]) => {
    if (isSubmittingRef.current) return; 
    if (!user || !tAmount || !tAccountId) return alert("Isi data dompet dan nominal dengan lengkap!");
    if (tType === "transfer" && (!tToAccountId || tAccountId === tToAccountId)) return alert("Pilih dompet tujuan yang berbeda!");
    if (tType !== "transfer" && !tCategory && (!customSplits || customSplits.length === 0)) return alert("Kategori transaksi wajib dipilih terlebih dahulu!");
    
    const rawAmount = safeEvaluate(tAmount);
    if (rawAmount <= 0) return alert("Nominal transaksi tidak valid!");

    const sourceAcc = accounts.find(a => a.id === tAccountId);
    if (!sourceAcc) return alert("Dompet asal tidak ditemukan!");

    const rateSource = exchangeRates[sourceAcc.currency || "IDR"] || sourceAcc.lastExchangeRate || 1;
    const idrAmount = rawAmount * rateSource;

    if (customSplits && customSplits.length > 0) {
      const splitsTotal = customSplits.reduce((acc, curr) => acc + curr.amount, 0);
      if (splitsTotal !== rawAmount) {
        return alert(`Total pecahan (${sourceAcc.currency || "Rp"} ${splitsTotal.toLocaleString('id-ID')}) harus sama dengan total nominal transaksi (${sourceAcc.currency || "Rp"} ${rawAmount.toLocaleString('id-ID')})!`);
      }
    }

    const rawAdminFee = tType === "transfer" && tAdminFee ? safeEvaluate(tAdminFee) : 0; 
    const idrAdminFee = rawAdminFee * rateSource;

    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      // 🛡️ SOLUSI MUTLAK: Gunakan Batch Writes agar proses update saldo & histori transaksi bersifat Atomik (All-or-Nothing).
      const batch = writeBatch(db);

      if (tType === "transfer") {
        const destAcc = accounts.find(a => a.id === tToAccountId);
        if (!destAcc) { alert("Dompet tujuan tidak ditemukan!"); return; }
        const rateDest = exchangeRates[destAcc.currency || "IDR"] || destAcc.lastExchangeRate || 1;
        const destAmount = idrAmount / rateDest;

        batch.update(doc(db, `users/${user.uid}/accounts/${tAccountId}`), { balance: sourceAcc.balance - (rawAmount + rawAdminFee) });
        batch.update(doc(db, `users/${user.uid}/accounts/${tToAccountId}`), { balance: destAcc.balance + destAmount });
        
        const newTxRef = doc(collection(db, `users/${user.uid}/transactions`));
        batch.set(newTxRef, { 
          amount: idrAmount, type: "transfer", accountId: tAccountId, toAccountId: tToAccountId, accountName: sourceAcc.name, toAccountName: destAcc.name, note: tNote || "Transfer Dana", category: "Transfer", tDate, tTime, adminFee: idrAdminFee, originalAmount: rawAmount, originalCurrency: sourceAcc.currency || "IDR", exchangeRate: rateSource, createdAt: serverTimestamp() 
        });
      } else {
        const newBal = tType === "income" ? sourceAcc.balance + rawAmount : sourceAcc.balance - rawAmount;
        batch.update(doc(db, `users/${user.uid}/accounts/${tAccountId}`), { balance: newBal });
        
        const docData: any = { amount: idrAmount, type: tType, accountId: tAccountId, accountName: sourceAcc.name, note: tNote, category: (customSplits && customSplits.length > 0) ? "Split Transaksi" : tCategory, tDate, tTime, originalAmount: rawAmount, originalCurrency: sourceAcc.currency || "IDR", exchangeRate: rateSource, createdAt: serverTimestamp() };
        if (customSplits && customSplits.length > 0) docData.splits = customSplits.map(s => ({ ...s, amount: s.amount * rateSource }));
        
        const newTxRef = doc(collection(db, `users/${user.uid}/transactions`));
        batch.set(newTxRef, docData);
      }
      
      // Eksekusi semua perintah modifikasi data sekaligus!
      await batch.commit();

      setTAmount(""); setTNote(""); setTAdminFee(""); setTCategory(""); setTAccountId(""); setTToAccountId(""); 
      const now = new Date(); setTTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      alert("Transaksi Sukses!");
    } catch (e) { 
      console.error("Kesalahan Atomik:", e);
      alert("Gagal simpan transaksi. Saldo Anda aman dan dibatalkan (Rollback)."); 
    } finally { 
      isSubmittingRef.current = false; setIsSubmitting(false); 
    }
  };

  const handleDeleteTransaction = async (t: TransactionData) => {
    if (isSubmittingRef.current) return; 
    if (!user || !confirm("Hapus transaksi ini? Saldo akan dikoreksi.")) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      // 🛡️ SOLUSI MUTLAK: Batch hapus, mencegah pengguna farming saldo gratis karena error hapus doc.
      const batch = writeBatch(db);

      if (t.type === "transfer") {
        const sourceAcc = accounts.find(a => a.id === t.accountId); const destAcc = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;
        const rawAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount;
        const rawAdminFee = t.originalAmount !== undefined ? ((t.adminFee || 0) / (t.exchangeRate || 1)) : (t.adminFee || 0);
        if (sourceAcc) batch.update(doc(db, `users/${user.uid}/accounts/${t.accountId}`), { balance: sourceAcc.balance + (rawAmount + rawAdminFee) });
        if (destAcc) { const rateDest = exchangeRates[destAcc.currency || "IDR"] || destAcc.lastExchangeRate || 1; const destAmount = t.originalAmount !== undefined ? (t.amount / rateDest) : t.amount; batch.update(doc(db, `users/${user.uid}/accounts/${t.toAccountId}`), { balance: destAcc.balance - destAmount }); }
      } else {
        const acc = accounts.find(a => a.id === t.accountId);
        if (acc) { const rawAmount = t.originalAmount !== undefined ? t.originalAmount : t.amount; const restoredBal = t.type === "income" ? acc.balance - rawAmount : acc.balance + rawAmount; batch.update(doc(db, `users/${user.uid}/accounts/${t.accountId}`), { balance: restoredBal }); }
      }
      
      batch.delete(doc(db, `users/${user.uid}/transactions/${t.id}`));
      
      await batch.commit();
    } catch (e) { alert("Gagal hapus transaksi. Saldo batal dikembalikan."); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const openEditModal = (t: TransactionData) => {
    setEditingTransaction(t); 
    setEditTAmount(t.originalAmount !== undefined ? t.originalAmount.toString() : t.amount.toString()); 
    setEditTType(t.type as any); setEditTAccountId(t.accountId); setEditTToAccountId(t.toAccountId || ""); setEditTNote(t.note || ""); setEditTCategory(t.category); setEditTDate(t.tDate); 
    setEditTTime(t.tTime || (() => { if (!t.createdAt) return "12:00"; let d = new Date(); if (t.createdAt.seconds) d = new Date(t.createdAt.seconds * 1000); else if (t.createdAt._seconds) d = new Date(t.createdAt._seconds * 1000); else d = new Date(t.createdAt); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; })()); 
    setEditTAdminFee(t.originalAmount !== undefined ? ((t.adminFee || 0) / (t.exchangeRate || 1)).toString() : (t.adminFee?.toString() || "")); 
    setEditTSplits(t.splits ? t.splits.map(s => ({ ...s, amount: t.originalAmount !== undefined ? (s.amount / (t.exchangeRate || 1)) : s.amount })) : []); 
  };

  const handleUpdateTransaction = async () => {
    if (isSubmittingRef.current) return; if (!user || !editingTransaction) return;
    const oldT = editingTransaction;
    const newRawAmount = editTSplits.length > 0 ? editTSplits.reduce((sum, s) => sum + s.amount, 0) : safeEvaluate(editTAmount);
    if (newRawAmount <= 0) return alert("Nominal transaksi tidak valid!");
    const newRawAdminFee = editTType === "transfer" && editTAdminFee ? safeEvaluate(editTAdminFee) : 0; 
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      if (oldT.type === "transfer") {
        const oldRawAmount = oldT.originalAmount !== undefined ? oldT.originalAmount : oldT.amount;
        const oldRawAdminFee = oldT.originalAmount !== undefined ? ((oldT.adminFee || 0) / (oldT.exchangeRate || 1)) : (oldT.adminFee || 0);
        const oldSrc = accounts.find(a => a.id === oldT.accountId); const oldDest = oldT.toAccountId ? accounts.find(a => a.id === oldT.toAccountId) : null;
        if (oldSrc) await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.accountId}`), { balance: oldSrc.balance + (oldRawAmount + oldRawAdminFee) });
        if (oldDest) { const rateOldDest = exchangeRates[oldDest.currency || "IDR"] || oldDest.lastExchangeRate || 1; const oldDestAmount = oldT.originalAmount !== undefined ? (oldT.amount / rateOldDest) : oldT.amount; await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.toAccountId}`), { balance: oldDest.balance - oldDestAmount }); }
      } else {
        const oldAcc = accounts.find(a => a.id === oldT.accountId);
        if (oldAcc) { const oldRawAmount = oldT.originalAmount !== undefined ? oldT.originalAmount : oldT.amount; const restoredBal = oldT.type === "income" ? oldAcc.balance - oldRawAmount : oldAcc.balance + oldRawAmount; await updateDoc(doc(db, `users/${user.uid}/accounts/${oldT.accountId}`), { balance: restoredBal }); }
      }

      const srcAccRef = doc(db, `users/${user.uid}/accounts/${editTAccountId}`);
      const srcSnap = await getDoc(srcAccRef);
      if (!srcSnap.exists()) throw "Dompet asal tidak ditemukan";
      const freshSrcBal = srcSnap.data().balance; const srcCurrency = srcSnap.data().currency || "IDR"; const rateSource = exchangeRates[srcCurrency] || srcSnap.data().lastExchangeRate || 1;
      const newIdrAmount = newRawAmount * rateSource; const newIdrAdminFee = newRawAdminFee * rateSource;

      if (editTType === "transfer") {
        const destAccRef = doc(db, `users/${user.uid}/accounts/${editTToAccountId}`); const destSnap = await getDoc(destAccRef); if (!destSnap.exists()) throw "Dompet tujuan tidak ditemukan";
        const freshDestBal = destSnap.data().balance; const rateDest = exchangeRates[destSnap.data().currency || "IDR"] || destSnap.data().lastExchangeRate || 1;
        const destAmount = newIdrAmount / rateDest;
        await updateDoc(srcAccRef, { balance: freshSrcBal - (newRawAmount + newRawAdminFee) });
        await updateDoc(destAccRef, { balance: freshDestBal + destAmount });
      } else {
        const newBal = editTType === "income" ? freshSrcBal + newRawAmount : freshSrcBal - newRawAmount;
        await updateDoc(srcAccRef, { balance: newBal });
      }

      const tRef = doc(db, `users/${user.uid}/transactions/${oldT.id}`);
      const updateData: any = { amount: newIdrAmount, type: editTType, accountId: editTAccountId, accountName: accounts.find(a => a.id === editTAccountId)?.name || "", note: editTNote, category: editTSplits.length > 0 ? "Split Transaksi" : (editTType === "transfer" ? "Transfer" : editTCategory), tDate: editTDate, tTime: editTTime, originalAmount: newRawAmount, originalCurrency: srcCurrency, exchangeRate: rateSource };
      if (editTType === "transfer") { updateData.toAccountId = editTToAccountId; updateData.toAccountName = accounts.find(a => a.id === editTToAccountId)?.name || ""; updateData.adminFee = newIdrAdminFee; updateData.splits = null; } else { updateData.toAccountId = null; updateData.toAccountName = null; updateData.adminFee = null; if (editTSplits.length > 0) { updateData.splits = editTSplits.map(s => ({ ...s, amount: s.amount * rateSource })); } else { updateData.splits = null; } }
      await updateDoc(tRef, updateData);
      setEditingTransaction(null); setEditTAdminFee(""); alert("Transaksi berhasil diperbarui!");
    } catch (e) { alert("Gagal memperbarui transaksi: " + e); } finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  };

  const monthlyTransactions = reportTransactions.filter(t => t.tDate && t.tDate.startsWith(reportMonth));
  const adminFeeTxs = monthlyTransactions.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).map(t => ({ id: `fee-${t.id}`, amount: t.adminFee!, type: "expense", accountId: t.accountId, accountName: t.accountName, category: "Biaya Admin", note: `Biaya admin transfer ke ${t.toAccountName}`, tDate: t.tDate } as TransactionData));
  const combinedExpenseTxs = [...monthlyTransactions.filter(t => t.type === 'expense'), ...adminFeeTxs];
  const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = combinedExpenseTxs.reduce((a, b) => a + b.amount, 0); 
  const expenseByCategory = combinedExpenseTxs.reduce((acc: Record<string, number>, curr: TransactionData) => { if (curr.splits && curr.splits.length > 0) { curr.splits.forEach(s => { acc[s.category] = (acc[s.category] || 0) + s.amount; }); } else { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; } return acc; }, {});
  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));
  const incomeByCategory = monthlyTransactions.filter(t => t.type === 'income').reduce((acc: Record<string, number>, curr: TransactionData) => { if (curr.splits && curr.splits.length > 0) { curr.splits.forEach(s => { acc[s.category] = (acc[s.category] || 0) + s.amount; }); } else { acc[curr.category] = (acc[curr.category] || 0) + curr.amount; } return acc; }, {});
  const incomeCategoryList = Object.keys(incomeByCategory).map(key => ({ name: key, value: incomeByCategory[key] }));
  const expenseByDate = combinedExpenseTxs.reduce((acc: Record<string, number>, curr: TransactionData) => { const day = curr.tDate.split('-')[2]; acc[day] = (acc[day] || 0) + curr.amount; return acc; }, {});
  const barData = Object.keys(expenseByDate).sort().map(key => ({ date: `Tgl ${key}`, amount: expenseByDate[key] }));
  const prevAdminFeeTxs = prevMonthTransactions.filter(t => t.type === 'transfer' && t.adminFee && t.adminFee > 0).map(t => ({ amount: t.adminFee! }));
  const prevCombinedExpense = [...prevMonthTransactions.filter(t => t.type === 'expense'), ...prevAdminFeeTxs];
  const prevTotalExpense = prevCombinedExpense.reduce((a, b) => a + b.amount, 0);
  const prevTotalIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);

  const handleExportToExcel = async () => {
    const monthlyTransactions = reportTransactions.filter(t => t.tDate && t.tDate.startsWith(reportMonth));
    if (monthlyTransactions.length === 0) return alert("Tidak ada data transaksi di bulan ini!");
    const excelData = monthlyTransactions.map((t, idx) => {
      let categoryStr = t.category;
      if (t.splits && t.splits.length > 0) categoryStr = "Split: " + t.splits.map(s => `${s.category} (Rp ${s.amount.toLocaleString('id-ID')})`).join(', ');
      let noteStr = t.note || "-";
      if (t.splits && t.splits.length > 0) { const splitNotes = t.splits.map(s => s.note).filter(Boolean); if (splitNotes.length > 0) { noteStr = `${noteStr} [Pecahan: ${splitNotes.join(', ')}]`; } }
      return { "No": idx + 1, "Tanggal": t.tDate, "Waktu": t.tTime || "-", "Tipe": t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer", "Kategori": categoryStr, "Dompet": t.type === "transfer" ? `${t.accountName} ➔ ${t.toAccountName}` : t.accountName, "Nominal (Rp)": t.amount, "Catatan": noteStr };
    });
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    worksheet["!cols"] = [{ wch: 5 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 35 }];
    XLSX.writeFile(workbook, `Fintracker_Laporan_${reportMonth}.xlsx`);
  };

  // JIKA BUKA DARI DOMAIN LAMA, CEGAT DENGAN SPANDUK MIGRASI INI
  if (isOldDomain) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] shadow-2xl w-full max-w-sm flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-inner"><Rocket size={40} strokeWidth={2}/></div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Pindah Rumah! 🚀</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-semibold leading-relaxed">Fintracker telah bermigrasi ke alamat baru yang lebih cepat & profesional. Silakan pindah ke alamat baru untuk melanjutkan.</p>
          <a href={NEW_DOMAIN_URL} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2">Pindah ke Aplikasi Baru <ArrowRight size={18}/></a>
          <p className="text-[10px] text-slate-400 mt-6 font-medium bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">Tips: Setelah menekan tombol di atas, jangan lupa <b>Hapus</b> aplikasi lama ini dari layar HP Anda, lalu <b>Install Ulang</b> (Tambahkan ke Layar Utama) melalui link yang baru.</p>
        </div>
      </main>
    );
  }

  if (loading || !pinChecked || (user && isPremium === null)) return <LoadingScreen />;
  if (!user) return <AuthScreen />;

  if (appPin && !isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] shadow-2xl w-full max-w-sm flex flex-col items-center border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-inner"><Lock size={32} strokeWidth={2.5}/></div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-1">Aplikasi Terkunci</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 text-center font-semibold">Masukkan 6 digit PIN untuk membuka Fintracker.</p>
          <div className="flex gap-4 mb-8">{[...Array(6)].map((_, i) => (<div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${i < pinInput.length ? 'bg-blue-600 scale-110' : 'bg-slate-200 dark:bg-slate-800'} ${pinError ? 'bg-red-500 animate-pulse' : ''}`} />))}</div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} onClick={() => { triggerHapticFeedback(); if(pinInput.length < 6) { const newVal = pinInput + num; setPinInput(newVal); if(newVal.length === 6) { if(newVal === appPin) { setTimeout(() => { setIsUnlocked(true); setPinInput(""); }, 200); } else { setPinError(true); triggerHapticFeedback(); setTimeout(() => { setPinInput(""); setPinError(false); }, 500); } } } }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black text-slate-800 dark:text-white active:bg-slate-200 dark:active:bg-slate-700 transition-colors select-none">{num}</button>
            ))}
            {isBiometricActive ? (<button onClick={() => { triggerHapticFeedback(); handleBiometricUnlock(); }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-blue-500 dark:text-blue-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center select-none cursor-pointer"><Fingerprint size={24} /></button>) : <div />}
            <button onClick={() => { triggerHapticFeedback(); if(pinInput.length < 6) { const newVal = pinInput + "0"; setPinInput(newVal); if(newVal.length === 6) { if(newVal === appPin) { setTimeout(() => { setIsUnlocked(true); setPinInput(""); }, 200); } else { setPinError(true); triggerHapticFeedback(); setTimeout(() => { setPinInput(""); setPinError(false); }, 500); } } } }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-2xl font-black text-slate-800 dark:text-white active:bg-slate-200 dark:active:bg-slate-700 transition-colors select-none">0</button>
            <button onClick={() => { triggerHapticFeedback(); setPinInput(prev => prev.slice(0, -1)); }} className="h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xl font-black text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center select-none"><X size={24}/></button>
          </div>
          <button onClick={() => signOut(auth)} className="mt-8 text-[10px] font-bold text-red-500 hover:underline cursor-pointer">Lupa PIN? (Logout Paksa)</button>
        </div>
      </main>
    );
  }

  if (isPremium === false) {
    const waLink = `https://wa.me/6282271312559?text=${encodeURIComponent(`Halo Admin Fintracker! 🚀\nSaya ingin mengaktifkan Lisensi Premium (Lifetime).\n\n📧 Email akun saya: ${user.email}`)}`;
    return (
      <main className="min-h-screen bg-[#070a13] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
        <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -top-40 -left-40 pointer-events-none"></div><div className="absolute w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -bottom-40 -right-40 pointer-events-none"></div>
        <div className="bg-[#0b101d]/60 backdrop-blur-2xl border border-white/[0.06] p-8 md:p-10 rounded-[35px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-sm flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          <div className="w-16 h-16 bg-[#0f1524] rounded-full flex items-center justify-center mb-5 shadow-xl border border-white/[0.08] relative"><div className="absolute w-8 h-8 bg-amber-500/20 rounded-full blur-[10px] pointer-events-none"></div><Crown size={26} className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] z-10" strokeWidth={1.5}/></div>
          <h2 className="text-2xl font-black mb-1.5 tracking-tight text-white leading-none text-center">AKSES <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">PREMIUM</span> TERKUNCI</h2>
          <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">Aktifkan lisensi seumur hidup untuk membuka kunci akses selamanya.</p>
          <div className="w-full bg-[#151c30]/50 border border-amber-500/20 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-inner text-left flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[30px] rounded-full pointer-events-none"></div>
            <div className="pb-4 space-y-1.5"><div className="flex justify-between items-center"><span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest leading-none">LIFETIME ACCESS PASS</span><Crown size={16} className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" /></div><h3 className="text-xs font-black text-white uppercase tracking-tight">PREMIUM LIFETIME PASS</h3><p className="text-[10px] font-semibold text-slate-400 leading-normal">Membuka penuh proteksi PIN & sidik jari, pemisahan dompet usaha, otomatisasi tagihan berulang, alokasi pecahan transaksi, s/d mutasi multi-valas asing selamanya.</p></div>
            <div className="border-t border-dashed border-amber-500/25 my-1 pointer-events-none"></div><div className="pt-2 flex justify-between items-center text-[8px] text-slate-500 font-mono leading-none"><span className="truncate max-w-[130px]">MEMBER: {user.email?.split("@")[0].toUpperCase()}</span><span>NO: FT-{user.uid.slice(0, 6).toUpperCase()}</span></div>
          </div>
          <div className="text-center w-full space-y-4">
            <div className="flex items-baseline justify-center gap-2"><span className="text-xs font-bold text-slate-500 line-through">Rp 150.000</span><span className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">Rp 49.000</span><span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider ml-1">SAVE 67%</span></div>
            <p className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest leading-none">Sekali Bayar Selamanya</p>
            <a href={waLink} target="_blank" rel="noreferrer" className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-[0_4px_20px_rgba(16,185,129,0.25)] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] duration-100 cursor-pointer"><MessageCircle size={16} /> Aktivasi via WhatsApp</a>
            <button onClick={() => signOut(auth)} className="text-[9px] font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer block mx-auto pt-1">Bukan {user.email}? Logout</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 md:flex transition-colors duration-200 relative">

      <Sidebar user={user} activeTab={activeTab as any} setActiveTab={setActiveTab as any} onLogout={() => signOut(auth)} isPrivacyMode={isPrivacyMode} togglePrivacyMode={togglePrivacyMode} />
      <div className="flex-1 md:ml-64 min-h-screen flex flex-col pb-24 md:pb-8">
        <MobileHeader user={user} onLogout={() => signOut(auth)} isPrivacyMode={isPrivacyMode} togglePrivacyMode={togglePrivacyMode} />
        <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
          <div className="space-y-6 w-full">
            {activeTab === "home" && (
              <HomeTab 
                reportMonth={reportMonth} setReportMonth={setReportMonth}
                tType={tType} setTType={setTType} tDate={tDate} setTDate={setTDate}
                tTime={tTime} setTTime={setTTime}
                tCategory={tCategory} setTCategory={setTCategory} tAccountId={tAccountId} setTAccountId={setTAccountId}
                tToAccountId={tToAccountId} setTToAccountId={setTToAccountId} tAmount={tAmount} setTAmount={setTAmount}
                tAdminFee={tAdminFee} setTAdminFee={setTAdminFee} tNote={tNote} setTNote={setTNote} categories={categories} accounts={accounts} handleTransaction={handleTransaction}
                transactions={reportTransactions} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={openEditModal} 
                isPrivacyMode={isPrivacyMode} togglePrivacyMode={togglePrivacyMode}
                editingTransaction={editingTransaction} setEditingTransaction={setEditingTransaction} handleUpdateTransaction={handleUpdateTransaction}
                editTAmount={editTAmount} setEditTAmount={setEditTAmount} editTType={editTType} setEditTType={setEditTType}
                editTAccountId={editTAccountId} setEditTAccountId={setEditTAccountId} editTToAccountId={editTToAccountId} setEditTToAccountId={setEditTToAccountId}
                editTNote={editTNote} setEditTNote={setEditTNote} editTCategory={editTCategory} setEditTCategory={setEditTCategory}
                editTDate={editTDate} setEditTDate={setEditTDate} editTTime={editTTime} setEditTTime={setEditTTime}
                editTAdminFee={editTAdminFee} setEditTAdminFee={setEditTAdminFee} editTSplits={editTSplits} setEditTSplits={setEditTSplits}
                updateCategory={handleEditCategory}
              />
            )}
            {activeTab === "reports" && (
              <ReportsTab reportMonth={reportMonth} setReportMonth={setReportMonth} handleExportToExcel={handleExportToExcel} totalIncome={totalIncome} totalExpense={totalExpense} pieData={pieData} incomeCategoryList={incomeCategoryList} barData={barData} categories={categories} reportTransactions={reportTransactions} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} searchResult={searchResult} prevTotalIncome={prevTotalIncome} prevTotalExpense={prevTotalExpense} isPrivacyMode={isPrivacyMode} accounts={accounts} updateCategory={handleEditCategory} />
            )}
            {activeTab === "debts" && (
              <DebtsTab debts={debts} accounts={accounts} categories={categories} handleAddDebt={handleAddDebt} handleEditDebt={handleEditDebt} handlePayDebt={handlePayDebt} handleDeleteDebt={handleDeleteDebt} subscriptions={subscriptions} handleAddSubscription={handleAddSubscription} handleEditSubscription={handleEditSubscription} handlePaySubscription={handlePaySubscription} handleDeleteSubscription={handleDeleteSubscription} isPrivacyMode={isPrivacyMode} />
            )}
            {activeTab === "assets" && (
              <AssetsTab accounts={accounts} walletTypes={walletTypes} accType={accType} setAccType={setAccType} accName={accName} setAccName={setAccName} accBalance={accBalance} setAccBalance={setAccBalance} accLogo={accLogo} handleLogoUpload={handleLogoUpload} accIsSavings={accIsSavings} setAccIsSavings={setAccIsSavings} accTargetBalance={accTargetBalance} setAccTargetBalance={setAccTargetBalance} accExcludeFromTotal={accExcludeFromTotal} setAccExcludeFromTotal={setAccExcludeFromTotal} editAccExcludeFromTotal={editAccExcludeFromTotal} setEditAccExcludeFromTotal={setEditAccExcludeFromTotal} accIsBusiness={accIsBusiness} setAccIsBusiness={setAccIsBusiness} editAccIsBusiness={editAccIsBusiness} setEditAccIsBusiness={setEditAccIsBusiness} handleCreateAccount={handleCreateAccount} editingAccId={editingAccId} setEditingAccId={setEditingAccId} editAccName={editAccName} setEditAccName={setEditAccName} editAccBalance={editAccBalance} setEditAccBalance={setEditAccBalance} editAccLogo={editAccLogo} setEditAccLogo={setEditAccLogo} editAccIsSavings={editAccIsSavings} setEditAccIsSavings={setEditAccIsSavings} editAccTargetBalance={editAccTargetBalance} setEditAccTargetBalance={setEditAccTargetBalance} handleEditAccount={handleEditAccount} deleteAccount={deleteAccount} moveAccountOrder={moveAccountOrder} accSavingsGoalTitle={accSavingsGoalTitle} setAccSavingsGoalTitle={setAccSavingsGoalTitle} editAccSavingsGoalTitle={editAccSavingsGoalTitle} setEditAccSavingsGoalTitle={setEditAccSavingsGoalTitle} isPrivacyMode={isPrivacyMode} accCurrency={accCurrency} setAccCurrency={setAccCurrency} editAccCurrency={editAccCurrency} setEditAccCurrency={setEditAccCurrency} exchangeRates={exchangeRates} handleUpdateGlobalRates={handleUpdateGlobalRates} reportTransactions={reportTransactions} reportMonth={reportMonth} setReportMonth={setReportMonth} accIsInvestment={accIsInvestment} setAccIsInvestment={setAccIsInvestment} editAccIsInvestment={editAccIsInvestment} setEditAccIsInvestment={setEditAccIsInvestment} accAverageBuyPrice={accAverageBuyPrice} setAccAverageBuyPrice={setAccAverageBuyPrice} editAccAverageBuyPrice={editAccAverageBuyPrice} setEditAccAverageBuyPrice={setEditAccAverageBuyPrice} accLastExchangeRate={accLastExchangeRate} setAccLastExchangeRate={setAccLastExchangeRate} editAccLastExchangeRate={editAccLastExchangeRate} setEditAccLastExchangeRate={setEditAccLastExchangeRate} handleUpdateInvestmentRate={handleUpdateInvestmentRate} />
            )}
            {activeTab === "settings" && (
              <SettingsTab user={user} onLogout={() => signOut(auth)} tType={tType} setTType={setTType} newCatName={newCatName} setNewCatName={setNewCatName} newExpenseType={newExpenseType} setNewExpenseType={setNewExpenseType} addCustomCategory={addCustomCategory} categories={categories} deleteCategory={deleteCategory} updateCategory={handleEditCategory} newCatIcon={newCatIcon} setNewCatIcon={setNewCatIcon} newWalletTypeName={newWalletTypeName} setNewWalletTypeName={setNewWalletTypeName} addCustomWalletType={addCustomWalletType} walletTypes={walletTypes} deleteWalletType={deleteWalletType} theme={theme} setTheme={setTheme} appPin={appPin} setAppPin={handleSetAppPin} exchangeRates={exchangeRates} handleUpdateGlobalRates={handleUpdateGlobalRates} />
            )}
          </div>
        </div>
      </div>
      <BottomNav activeTab={activeTab as any} setActiveTab={setActiveTab as any} />
    </main>
  );
}