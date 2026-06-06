"use client";
import { useState, useEffect } from "react";
import { User, updateProfile } from "firebase/auth";
import { 
  LogOut, Tag, CreditCard, X, Edit2, Check, Sun, Moon, 
  Monitor, ChevronDown, ChevronUp, Trash2, Lock, Fingerprint, 
  ChevronRight, ChevronLeft, ShieldCheck, Palette, Bell, Smartphone,
  LayoutTemplate
} from "lucide-react";
import { CategoryData, WalletTypeData } from "../../types";

interface SettingsTabProps {
  user: User | null; onLogout: () => void;
  tType: "income" | "expense" | "transfer"; setTType: (val: "income" | "expense" | "transfer") => void;
  newCatName: string; setNewCatName: (val: string) => void; 
  newExpenseType: "fixed" | "variable"; setNewExpenseType: (val: "fixed" | "variable") => void;
  addCustomCategory: () => void;
  categories: CategoryData[]; deleteCategory: (id: string) => void;
  updateCategory: (id: string, name: string, limit: number | null, expenseType: "fixed" | "variable", icon?: string) => void;
  newWalletTypeName: string; setNewWalletTypeName: (val: string) => void;
  addCustomWalletType: () => void; walletTypes: WalletTypeData[]; deleteWalletType: (id: string) => void;
  theme: "light" | "dark" | "system"; setTheme: (theme: "light" | "dark" | "system") => void;
  appPin: string | null; setAppPin: (val: string | null) => void;
}

// PEMETAAN WARNA AKSEN RESMI TAILWIND V4 (Sangat Aman Kontras & Bebas Bug)
const accentThemes = {
  blue: {
    name: "Ocean Blue",
    dotBg: "bg-blue-600",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50/80 dark:bg-blue-900/30",
    border: "border-blue-100 dark:border-blue-900/40",
  },
  emerald: {
    name: "Emerald Green",
    dotBg: "bg-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50/80 dark:bg-emerald-900/30",
    border: "border-emerald-100 dark:border-emerald-900/40",
  },
  purple: {
    name: "Royal Purple",
    dotBg: "bg-purple-600",
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50/80 dark:bg-purple-900/30",
    border: "border-purple-100 dark:border-purple-900/40",
  },
  amber: {
    name: "Sunset Gold",
    dotBg: "bg-amber-600",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50/80 dark:bg-amber-900/30",
    border: "border-amber-100 dark:border-amber-900/40",
  },
  rose: {
    name: "Rose Gold",
    dotBg: "bg-rose-600",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50/80 dark:bg-rose-900/30",
    border: "border-rose-100 dark:border-rose-900/40",
  }
} as const;

const getCategoryIcon = (catName: string) => {
  const name = catName.toLowerCase();
  if (name.includes("makan") || name.includes("food") || name.includes("cafe") || name.includes("kopi")) return "🍔";
  if (name.includes("transport") || name.includes("ojek") || name.includes("bensin") || name.includes("car")) return "🚗";
  if (name.includes("gaji") || name.includes("salary") || name.includes("income") || name.includes("gajian")) return "💰";
  if (name.includes("tagihan") || name.includes("bill") || name.includes("listrik") || name.includes("wifi") || name.includes("pulsa")) return "⚡";
  if (name.includes("belanja") || name.includes("grocer") || name.includes("pasar") || name.includes("supermarket")) return "🛒";
  if (name.includes("transfer") || name.includes("kirim")) return "💸";
  if (name.includes("piutang") || name.includes("utang") || name.includes("debt")) return "🤝";
  if (name.includes("invest") || name.includes("saham") || name.includes("crypto")) return "📈";
  if (name.includes("hiburan") || name.includes("game") || name.includes("nonton") || name.includes("netflix")) return "🎬";
  return "🏷️";
};

export default function SettingsTab({
  user, onLogout, tType, setTType, newCatName, setNewCatName, newExpenseType, setNewExpenseType, addCustomCategory,
  categories, deleteCategory, updateCategory, newWalletTypeName, setNewWalletTypeName, addCustomWalletType, walletTypes, deleteWalletType,
  theme, setTheme, appPin, setAppPin
}: SettingsTabProps) {
  
  // STATE NAVIGASI SUB-MENU (DITAMBAHKAN "accents")
  const [activeMenu, setActiveMenu] = useState<"main" | "categories" | "wallets" | "profile" | "accents">("main");
  const [showThemeModal, setShowThemeModal] = useState(false);

  // STATE KATEGORI
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatBudget, setEditCatBudget] = useState("");
  const [editCatExpType, setEditCatExpType] = useState<"fixed" | "variable">("variable");
  const [editCatIcon, setEditCatIcon] = useState(""); 
  const [showAllVar, setShowAllVar] = useState(false);
  const [showAllFixed, setShowAllFixed] = useState(false);
  const [showAllIncome, setShowAllIncome] = useState(false);

  // STATE FITUR & KEAMANAN
  const [pinModalMode, setPinModalMode] = useState<"setup" | "confirm" | "disable" | null>(null);
  const [tempPin, setTempPin] = useState("");
  const [inputPin, setInputPin] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [editProfileName, setEditProfileName] = useState(user?.displayName || "");

  // STATE BARU: WARNA AKSEN TEMA
  const [accent, setAccent] = useState<keyof typeof accentThemes>("blue");

  // INISIALISASI PREFERENSI DARI PENYIMPANAN LOKAL
  useEffect(() => {
    setBiometricEnabled(localStorage.getItem("fintracker_biometric_enabled") === "true");
    setHapticEnabled(localStorage.getItem("fintracker_haptic") !== "false");
    setReminderEnabled(localStorage.getItem("fintracker_reminder") === "true");
    setEditProfileName(user?.displayName || "");
    
    // Inisialisasi warna aksen default
    setAccent((localStorage.getItem("fintracker_accent") as any) || "blue");
  }, [user]);

  // FUNGSI GETAR CERDAS
  const triggerHaptic = () => { 
    if (typeof window !== "undefined" && navigator.vibrate) {
      if (localStorage.getItem("fintracker_haptic") !== "false") {
        navigator.vibrate(10); 
      }
    }
  };

  const toggleHaptic = () => {
    if (hapticEnabled) {
      localStorage.setItem("fintracker_haptic", "false");
      setHapticEnabled(false);
    } else {
      localStorage.setItem("fintracker_haptic", "true");
      setHapticEnabled(true);
      if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(20);
    }
  };

  const toggleReminder = async () => {
    triggerHaptic();
    if (reminderEnabled) {
      localStorage.setItem("fintracker_reminder", "false");
      setReminderEnabled(false);
      alert("Pengingat harian berhasil dinonaktifkan.");
    } else {
      if (!("Notification" in window)) {
        return alert("Browser atau perangkat Anda tidak mendukung fitur Notifikasi Push.");
      }
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        localStorage.setItem("fintracker_reminder", "true");
        setReminderEnabled(true);
        new Notification("Fintracker Assistant", { body: "Pengingat aktif! Jangan lupa catat keuanganmu setiap hari ya." });
      } else {
        alert("Izin notifikasi ditolak. Silakan izinkan dari pengaturan browser Anda.");
      }
    }
  };

  const handleUpdateProfile = async () => {
    triggerHaptic();
    if (!user || !editProfileName.trim()) return alert("Nama tidak boleh kosong.");
    try {
      await updateProfile(user, { displayName: editProfileName });
      alert("Profil berhasil diperbarui! Perubahan nama akan terlihat sepenuhnya saat aplikasi dimuat ulang.");
      setActiveMenu("main");
    } catch (e) {
      alert("Gagal memperbarui profil. Pastikan koneksi internet stabil.");
    }
  };

  const handleToggleBiometric = async () => {
    triggerHaptic();
    if (biometricEnabled) {
      localStorage.removeItem("fintracker_biometric_enabled");
      localStorage.removeItem("fintracker_biometric_cred_id");
      setBiometricEnabled(false);
      alert("Kunci Biometrik dinonaktifkan.");
    } else {
      if (!window.PublicKeyCredential) return alert("Sensor biometrik tidak didukung di perangkat/browser ini.");
      const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16); window.crypto.getRandomValues(userId);
      const options = {
        challenge, rp: { name: "Fintracker", id: window.location.hostname },
        user: { id: userId, name: "fintracker-user", displayName: "Fintracker User" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000
      };
      try {
        const credential = await navigator.credentials.create({ publicKey: options as any });
        if (credential) {
          const rawId = new Uint8Array((credential as any).rawId);
          const base64String = btoa(String.fromCharCode(...rawId));
          localStorage.setItem("fintracker_biometric_cred_id", base64String);
          localStorage.setItem("fintracker_biometric_enabled", "true");
          setBiometricEnabled(true);
          alert("Kunci Biometrik berhasil diaktifkan!");
        }
      } catch (err: any) { alert("Gagal mengaktifkan biometrik."); }
    }
  };

  const sortedCategories = categories.slice().sort((a, b) => a.name.localeCompare(b.name));
  const varCats = sortedCategories.filter(c => c.type === "expense" && c.expenseType !== "fixed");
  const fixedCats = sortedCategories.filter(c => c.type === "expense" && c.expenseType === "fixed");
  const incomeCats = sortedCategories.filter(c => c.type === "income");
  const visibleVarCats = showAllVar ? varCats : varCats.slice(0, 5);
  const visibleFixedCats = showAllFixed ? fixedCats : fixedCats.slice(0, 5);
  const visibleIncomeCats = showAllIncome ? incomeCats : incomeCats.slice(0, 5);

  const MenuItem = ({ icon: Icon, iconBg, iconColor, title, subtitle, rightElement, onClick, isDestructive = false }: any) => (
    <div onClick={() => { if(onClick) { triggerHaptic(); onClick(); } }} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}><Icon size={18} strokeWidth={2.5} /></div>
        <div className="text-left">
          <p className={`text-sm font-black ${isDestructive ? 'text-red-600 dark:text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>{title}</p>
          {subtitle && <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center shrink-0 pl-4">
        {rightElement !== undefined ? rightElement : <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-colors" />}
      </div>
    </div>
  );

  const renderCategoryCard = (cat: CategoryData) => (
    <div key={cat.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-200 shadow-sm flex flex-col justify-center">
      {editingCatId === cat.id ? (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="flex gap-2 text-left">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Kategori</label>
              <input type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-slate-100" value={editCatName} onChange={e => setEditCatName(e.target.value)} />
            </div>
            <div className="w-20 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Emoji</label>
              <input type="text" maxLength={2} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-lg outline-blue-500 font-black text-center text-slate-800 dark:text-slate-100" value={editCatIcon} onChange={e => setEditCatIcon(e.target.value)} />
            </div>
          </div>
          {tType === 'expense' && (
            <div className="flex gap-2 text-left">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Limit Budget (Rp)</label>
                <input type="number" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-slate-100" value={editCatBudget} onChange={e => setEditCatBudget(e.target.value)} />
              </div>
              <div className="w-28 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Tipe</label>
                <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-slate-100 cursor-pointer" value={editCatExpType} onChange={(e) => setEditCatExpType(e.target.value as "fixed" | "variable")}>
                  <option value="variable">Variabel</option>
                  <option value="fixed">Tetap</option>
                </select>
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => { updateCategory(cat.id, editCatName, editCatBudget ? Number(editCatBudget) : null, editCatExpType, editCatIcon); setEditingCatId(null); }} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-colors cursor-pointer active:scale-95">Simpan</button>
            <button onClick={() => setEditingCatId(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black transition-colors cursor-pointer active:scale-95">Batal</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1 w-full overflow-hidden">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xl shrink-0">{cat.icon || getCategoryIcon(cat.name)}</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none truncate">{cat.name}</span>
              {tType === 'expense' && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded shrink-0 ${cat.expenseType === 'fixed' ? 'bg-purple-100 dark:bg-purple-905 text-purple-600 dark:text-purple-400' : 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400'}`}>
                  {cat.expenseType === 'fixed' ? 'FIXED' : 'VAR'}
                </span>
              )}
            </div>
            {tType === 'expense' && cat.budgetLimit && cat.budgetLimit > 0 && (
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                Limit: Rp {cat.budgetLimit.toLocaleString('id-ID')}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 pl-3 shrink-0">
            <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatBudget(cat.budgetLimit?.toString() || ""); setEditCatExpType(cat.expenseType || "variable"); setEditCatIcon(cat.icon || ""); }} className="text-slate-400 hover:text-blue-500 p-2 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"><Edit2 size={14}/></button>
            <button onClick={() => deleteCategory(cat.id)} className="text-slate-400 hover:text-red-500 p-2 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"><Trash2 size={14}/></button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in pb-20 text-center relative overflow-hidden">
      
      {/* ========================================== */}
      {/* TAMPILAN UTAMA (MENU PENGATURAN) */}
      {/* ========================================== */}
      <div className={`transition-all duration-300 ${activeMenu !== "main" ? "opacity-0 -translate-x-full h-0 overflow-hidden" : "opacity-100 translate-x-0"}`}>
        <h2 className={`font-black text-2xl tracking-tight mb-6 ${accentThemes[accent].text}`}>Pengaturan</h2>

        {/* SECTION 1: PROFIL & AKUN */}
        <div className="mb-6 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-2">Akun Pengguna</p>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <div onClick={() => { triggerHaptic(); setActiveMenu("profile"); }} className="p-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
              <img src={user?.photoURL || ""} className="w-14 h-14 rounded-full border-2 border-slate-100 dark:border-slate-800 object-cover" alt="Profile" />
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-base text-slate-800 dark:text-slate-100 truncate">{user?.displayName || "Pengguna"}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">{user?.email}</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
            </div>
           <MenuItem 
  icon={LogOut} iconBg="bg-red-50 dark:bg-red-900/30" iconColor="text-red-500" 
  title="Keluar / Logout" subtitle="Akhiri sesi Anda saat ini" 
  rightElement={<div/>} isDestructive={true} onClick={onLogout} 
/>
          </div>
        </div>

        {/* SECTION 2: PERSONALISASI & DATA */}
        <div className="mb-6 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-2">Personalisasi & Data</p>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <MenuItem 
              icon={LayoutTemplate} iconBg="bg-slate-50 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-300" 
              title="Tema Visual" subtitle="Terang, Gelap, atau Otomatis" 
              onClick={() => setShowThemeModal(true)}
              rightElement={<div className="flex items-center gap-1.5"><span className="text-xs font-bold text-slate-400 uppercase">{theme === 'system' ? 'Auto' : theme}</span><ChevronRight size={16} className="text-slate-300 dark:text-slate-600"/></div>}
            />
            {/* ROW BARU: WARNA AKSEN TEMA PREMIUM */}
            <MenuItem 
              icon={Palette} iconBg="bg-indigo-50 dark:bg-indigo-900/30" iconColor="text-indigo-600 dark:text-indigo-400" 
              title="Warna Tema" subtitle="Sesuaikan warna utama aplikasi Anda" 
              onClick={() => setActiveMenu("accents")}
              rightElement={
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${accentThemes[accent].dotBg} border border-white dark:border-slate-800 shadow-sm`} />
                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                </div>
              }
            />
            <MenuItem 
              icon={Tag} iconBg="bg-orange-50 dark:bg-orange-900/30" iconColor="text-orange-600 dark:text-orange-400" 
              title="Kategori Transaksi" subtitle="Kelola pemasukan & pengeluaran" 
              onClick={() => setActiveMenu("categories")}
            />
            <MenuItem 
              icon={CreditCard} iconBg="bg-blue-50 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400" 
              title="Tipe Dompet Aset" subtitle="Kelola jenis-jenis sumber dana" 
              onClick={() => setActiveMenu("wallets")}
            />
          </div>
        </div>

        {/* SECTION 3: PREFERENSI SISTEM */}
        <div className="mb-6 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-2">Preferensi Sistem</p>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <MenuItem 
              icon={Bell} iconBg="bg-amber-50 dark:bg-amber-900/30" iconColor="text-amber-500" 
              title="Pengingat Harian" subtitle="Notifikasi pencatatan pengeluaran rutin" 
              onClick={toggleReminder}
              rightElement={
                <div className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors shadow-inner ${reminderEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${reminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              }
            />
            <MenuItem 
              icon={Smartphone} iconBg="bg-pink-50 dark:bg-pink-900/30" iconColor="text-pink-500" 
              title="Getaran (Haptic)" subtitle="Umpan balik saat menekan tombol" 
              onClick={toggleHaptic}
              rightElement={
                <div className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors shadow-inner ${hapticEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${hapticEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              }
            />
          </div>
        </div>

        {/* SECTION 4: KEAMANAN & PRIVASI */}
        <div className="mb-6 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 mb-2">Keamanan & Privasi</p>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            <MenuItem 
              icon={Lock} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-300" 
              title="Kunci Aplikasi (PIN)" subtitle="Minta kode akses 6 digit" 
              onClick={() => { if(appPin) { setPinModalMode("disable"); setInputPin(""); } else { setPinModalMode("setup"); setInputPin(""); setTempPin(""); } }}
              rightElement={
                <div className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors shadow-inner ${appPin ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${appPin ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              }
            />
            <MenuItem 
              icon={Fingerprint} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-300" 
              title="Kunci Biometrik" subtitle="Face ID / Sidik Jari untuk akses instan" 
              onClick={handleToggleBiometric}
              rightElement={
                <div className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors shadow-inner ${biometricEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${biometricEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* SUB-MENU: ACCENT COLOR SELECTION (NEW) */}
      {/* ========================================== */}
      <div className={`absolute top-0 left-0 w-full transition-all duration-300 ${activeMenu === "accents" ? "opacity-100 translate-x-0 relative" : "opacity-0 translate-x-full pointer-events-none absolute"}`}>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { triggerHaptic(); setActiveMenu("main"); }} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer text-slate-800 dark:text-slate-100">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Warna Tema</h2>
          <div className="w-10"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          {Object.entries(accentThemes).map(([key, opt]) => {
            const isSelected = accent === key;
            return (
              <div 
                key={key} 
                onClick={() => {
                  triggerHaptic();
                  localStorage.setItem("fintracker_accent", key);
                  setAccent(key as any);
                  window.dispatchEvent(new Event("accent_color_changed"));
                  setActiveMenu("main");
                }} 
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${isSelected ? `${opt.border} ${opt.bg} shadow-sm` : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full ${opt.dotBg} border-2 border-white dark:border-slate-800 shadow-sm`} />
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{opt.name}</p>
                </div>
                {isSelected && <Check size={20} className={opt.text} strokeWidth={3} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* SUB-MENU 1: EDIT PROFIL */}
      {/* ========================================== */}
      <div className={`absolute top-0 left-0 w-full transition-all duration-300 ${activeMenu === "profile" ? "opacity-100 translate-x-0 relative" : "opacity-0 translate-x-full pointer-events-none absolute"}`}>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { triggerHaptic(); setActiveMenu("main"); setEditProfileName(user?.displayName || ""); }} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer text-slate-800 dark:text-slate-100">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Profil Saya</h2>
          <div className="w-10"></div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left space-y-5">
          <div className="flex flex-col items-center mb-2">
            <img src={user?.photoURL || ""} className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg object-cover mb-3" alt="Profile" />
            <p className="text-[10px] font-bold text-slate-400">Foto profil diatur melalui penyedia login Anda (Google)</p>
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Tampilan</label>
             <input 
                type="text" 
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-blue-500" 
                value={editProfileName} 
                onChange={(e) => setEditProfileName(e.target.value)} 
              />
          </div>
          <div className="space-y-1.5 opacity-60">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Utama (Terhubung)</label>
             <input 
                type="email" 
                disabled
                className="w-full p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed" 
                value={user?.email || ""} 
              />
          </div>
          <button 
            onClick={handleUpdateProfile} 
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl mt-4 shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* SUB-MENU 2: KATEGORI TRANSAKSI */}
      {/* ========================================== */}
      <div className={`absolute top-0 left-0 w-full transition-all duration-300 ${activeMenu === "categories" ? "opacity-100 translate-x-0 relative" : "opacity-0 translate-x-full pointer-events-none absolute"}`}>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { triggerHaptic(); setActiveMenu("main"); }} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer text-slate-800 dark:text-slate-100">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Kategori</h2>
          <div className="w-10"></div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6 shadow-inner">
          <button onClick={() => { triggerHaptic(); setTType("expense"); }} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "expense" ? "bg-white dark:bg-slate-900 text-red-500 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>PENGELUARAN</button>
          <button onClick={() => { triggerHaptic(); setTType("income"); }} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${tType === "income" ? "bg-white dark:bg-slate-900 text-emerald-500 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>PEMASUKAN</button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 text-left">
          <input 
            type="text" placeholder="Buat kategori baru..." 
            className="w-full sm:flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-transparent rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400" 
            value={newCatName} onChange={(e) => setNewCatName(e.target.value)} 
          />
          <div className="flex gap-2 w-full sm:w-auto">
            {tType === "expense" && (
              <select 
                className="flex-1 sm:flex-none p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-slate-100 cursor-pointer min-w-[110px]" 
                value={newExpenseType} onChange={(e) => setNewExpenseType(e.target.value as "fixed" | "variable")}
              >
                <option value="variable">Variabel</option>
                <option value="fixed">Tetap</option>
              </select>
            )}
            <button onClick={addCustomCategory} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-500/20">
              Tambah
            </button>
          </div>
        </div>

        {tType === "expense" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center justify-between pb-2 border-b border-orange-100 dark:border-orange-900/30">
                <span>🟠 Kebutuhan Variabel</span><span className="text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full shadow-sm">{varCats.length}</span>
              </p>
              <div className="space-y-2">{visibleVarCats.length === 0 && <p className="text-xs text-slate-400 italic py-2 text-center">Kosong</p>}{visibleVarCats.map(renderCategoryCard)}</div>
              {varCats.length > 5 && (
                <button onClick={() => setShowAllVar(!showAllVar)} className="w-full py-3 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
                  {showAllVar ? <><ChevronUp size={14}/> Sembunyikan</> : <><ChevronDown size={14}/> Tampilkan Semua</>}
                </button>
              )}
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center justify-between pb-2 border-b border-purple-100 dark:border-purple-900/30">
                <span>🟣 Kebutuhan Tetap</span><span className="text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full shadow-sm">{fixedCats.length}</span>
              </p>
              <div className="space-y-2">{visibleFixedCats.length === 0 && <p className="text-xs text-slate-400 italic py-2 text-center">Kosong</p>}{visibleFixedCats.map(renderCategoryCard)}</div>
              {fixedCats.length > 5 && (
                <button onClick={() => setShowAllFixed(!showAllFixed)} className="w-full py-3 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
                  {showAllFixed ? <><ChevronUp size={14}/> Sembunyikan</> : <><ChevronDown size={14}/> Tampilkan Semua</>}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-left">
             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/30">
                <span>🟢 Sumber Pemasukan</span><span className="text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full shadow-sm">{incomeCats.length}</span>
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{visibleIncomeCats.length === 0 && <p className="text-xs text-slate-400 italic py-2 text-center col-span-2">Kosong</p>}{visibleIncomeCats.map(renderCategoryCard)}</div>
             {incomeCats.length > 5 && (
               <button onClick={() => setShowAllIncome(!showAllIncome)} className="w-full py-3 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
                 {showAllIncome ? <><ChevronUp size={14}/> Sembunyikan</> : <><ChevronDown size={14}/> Tampilkan Semua</>}
               </button>
             )}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* SUB-MENU 3: TIPE DOMPET */}
      {/* ========================================== */}
      <div className={`absolute top-0 left-0 w-full transition-all duration-300 ${activeMenu === "wallets" ? "opacity-100 translate-x-0 relative" : "opacity-0 translate-x-full pointer-events-none absolute"}`}>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { triggerHaptic(); setActiveMenu("main"); }} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer text-slate-800 dark:text-slate-100">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">Tipe Dompet</h2>
          <div className="w-10"></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 text-left">
          <input 
            type="text" placeholder="Tambah tipe baru (Misal: Investasi)" 
            className="w-full sm:flex-1 p-3 bg-slate-50 dark:bg-slate-955 border border-transparent rounded-xl text-xs outline-blue-500 font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400" 
            value={newWalletTypeName} onChange={(e) => setNewWalletTypeName(e.target.value)} 
          />
          <button onClick={addCustomWalletType} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-500/20">
            Tambah
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Daftar Kategori Dompet</p>
          <div className="flex flex-wrap gap-2.5">
            {walletTypes.map(t => (
              <span key={t.id} className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2.5 rounded-2xl text-[11px] font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-colors duration-200 group">
                {t.name} 
                <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <X size={14} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors" onClick={() => deleteWalletType(t.id)}/>
              </span>
            ))}
            {walletTypes.length === 0 && <p className="text-xs text-slate-400 italic">Belum ada tipe kustom.</p>}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* BOTTOM SHEET: TEMA APLIKASI */}
      {/* ========================================== */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowThemeModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 border-t border-slate-200 dark:border-slate-800 pb-8" onClick={e => e.stopPropagation()}>
            <div className="w-full flex justify-center pt-3 pb-2"><div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>
            <div className="px-6 pb-4 pt-2 flex justify-between items-center shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Pilih Tema</h3>
              <button onClick={() => setShowThemeModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-full cursor-pointer transition-colors"><X size={16}/></button>
            </div>
            <div className="p-6 pt-2 space-y-3">
              {[
                { id: "light", label: "Terang (Light)", icon: Sun, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
                { id: "dark", label: "Gelap (Dark)", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
                { id: "system", label: "Ikuti Sistem (Auto)", icon: Monitor, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
              ].map(opt => (
                <div key={opt.id} onClick={() => { triggerHaptic(); setTheme(opt.id as "light"|"dark"|"system"); localStorage.setItem("theme", opt.id); setShowThemeModal(false); }} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${theme === opt.id ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm" : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.bg} ${opt.color}`}><opt.icon size={18} strokeWidth={2.5}/></div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{opt.label}</p>
                  </div>
                  {theme === opt.id && <Check size={20} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL SETUP & DISABLE PIN */}
      {pinModalMode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[35px] w-full max-sm shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner"><ShieldCheck size={32} strokeWidth={2.5}/></div>
            <div>
              <h3 className="font-black text-xl text-slate-800 dark:text-white leading-tight">
                {pinModalMode === "setup" ? "Buat PIN Baru" : pinModalMode === "confirm" ? "Konfirmasi PIN" : "Verifikasi PIN"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-bold">
                {pinModalMode === "setup" ? "Gunakan 6 digit angka untuk mengunci aplikasi" : pinModalMode === "confirm" ? "Ketik ulang PIN yang baru saja Anda buat" : "Masukkan PIN saat ini untuk mematikan kunci"}
              </p>
            </div>
            
            <input 
              autoFocus type="password" inputMode="numeric" maxLength={6} 
              className="w-full text-center tracking-[0.8em] text-3xl font-black p-4 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-700 rounded-2xl outline-blue-500 text-slate-800 dark:text-white transition-all shadow-sm focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500" 
              value={inputPin} onChange={e => setInputPin(e.target.value.replace(/[^0-9]/g, ''))} 
            />
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  triggerHaptic();
                  if(inputPin.length !== 6) return alert("PIN harus persis 6 angka!");
                  if(pinModalMode === "setup") { setTempPin(inputPin); setInputPin(""); setPinModalMode("confirm"); }
                  else if(pinModalMode === "confirm") {
                    if(inputPin === tempPin) { setAppPin(tempPin); setPinModalMode(null); alert("Kunci PIN berhasil diaktifkan!"); }
                    else { alert("PIN tidak cocok, silakan ulangi."); setPinModalMode("setup"); setInputPin(""); setTempPin(""); }
                  }
                  else if(pinModalMode === "disable") {
                    if(inputPin === appPin) { setAppPin(null); setPinModalMode(null); alert("Kunci PIN berhasil dinonaktifkan."); }
                    else { alert("PIN salah!"); setInputPin(""); }
                  }
                }} 
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-colors shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer"
              >
                Konfirmasi
              </button>
              <button 
                onClick={() => { triggerHaptic(); setPinModalMode(null); }} 
                className="py-3.5 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-colors active:scale-95 cursor-pointer"
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