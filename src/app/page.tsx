"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Brain, Zap, ShieldCheck, Target, WifiOff, Smartphone, ChevronRight, ChevronDown, Eye, Star } from "lucide-react";
import { useEffect, useState } from "react";

const faqs = [
  { q: "Apakah ada biaya langganan bulanan?", a: "Tidak ada. Fintracker menggunakan model bisnis sekali bayar (Lifetime). Cukup bayar Rp 49.000 hari ini, Anda akan mendapatkan akses ke semua fitur premium selamanya, termasuk semua update di masa depan." },
  { q: "Apakah data keuangan saya aman?", a: "Sangat aman. Fintracker tidak menyimpan data Anda di server yang bisa dibaca oleh kami. Data Anda dikunci menggunakan sistem Firebase Firestore terenkripsi dan hanya bisa diakses menggunakan akun Google Anda sendiri." },
  { q: "Apakah Fintracker bisa dipakai tanpa koneksi internet?", a: "Tentu! Fintracker dibangun dengan arsitektur PWA Offline-First. Anda tetap bisa mencatat pengeluaran di daerah tanpa sinyal atau di pesawat. Data akan tersinkronisasi otomatis begitu HP kembali terhubung ke internet." },
  { q: "Bisa di-install di iPhone (iOS) dan Android?", a: "Bisa banget! Fintracker adalah Progressive Web App (PWA) modern. Cukup buka di Safari (iOS) atau Chrome (Android), lalu pilih menu 'Tambahkan ke Layar Utama' (Add to Homescreen). Fintracker akan berjalan layaknya aplikasi native." },
  { q: "Bagaimana proses aktivasinya?", a: "Saat ini aktivasi akun dilakukan secara eksklusif manual untuk menjaga keamanan. Anda cukup menekan tombol 'Amankan Lisensi Sekarang' yang akan mengarahkan Anda ke WhatsApp Admin. Setelah transfer terverifikasi, email Anda akan langsung diaktifkan dalam hitungan menit." }
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // ⚡ STATE ANTI-FREEZE

  const router = useRouter();

  // ⚡ AUTO-BYPASS (SOFT REDIRECT - ANTI BLINK/PUTIH)
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("fintracker_has_logged_in") === "true") {
      setIsNavigating(true);
      router.push("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowSticky(window.scrollY > 400); 
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ⚡ FUNGSI LOMPAT INSTAN BEBAS LAG
  const handleEnterApp = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsNavigating(true);
    router.push("/dashboard");
  };

  // 🚀 TAMPILAN LOADING ABSOLUTE (MENCEGAH KEBOCORAN WARNA SAFARI)
  if (isNavigating) {
    return (
      <div className="fixed inset-0 z-[99999] h-[100dvh] w-full bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <p className="text-slate-300 font-bold animate-pulse tracking-widest uppercase text-xs">Memuat Ruang Kerja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* CSS ENGINE */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        @keyframes shine { 100% { left: 200%; } }
      `}} />
      
      {/* 🔮 Background Depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* 🛸 Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img src="/apple-touch-icon.png" alt="Fintracker Logo" className="w-8 h-8 rounded-xl object-cover shadow-lg shadow-blue-500/20 ring-1 ring-white/10" />
            <span className="font-black text-xl tracking-tight text-white">Fintracker<span className="text-blue-500">.</span></span>
          </div>
          <button onClick={handleEnterApp} className="cursor-pointer px-5 py-2.5 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all border border-white/10 border-b-white/5 shadow-inner backdrop-blur-md">
            Masuk App
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        {/* 🚀 HERO SECTION */}
        <section className="pt-40 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
            Fintracker Fase 27 Dirilis
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05] mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Kelola Uang Gak Pake Ribet. Otomatis, Cerdas, & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">Sedikit Julid.</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            Tinggalkan cara lama mencatat manual yang membosankan. Fintracker adalah PWA canggih dengan Asisten AI yang siap mengingatkan batas anggaranmu.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <button onClick={handleEnterApp} className="cursor-pointer px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2),_0_0_40px_-10px_rgba(59,130,246,0.6)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 border border-blue-500">
              Dapatkan Akses Sekarang <ArrowRight size={18} />
            </button>
          </div>

          {/* 📱 FLOATING GLASS MOCKUP */}
          <div className="mt-20 relative w-full max-w-lg mx-auto animate-float hidden md:block group">
            <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-[40px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700"></div>
            <div className="relative bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-2xl border border-white/5 border-t-white/20 rounded-[35px] p-6 text-left shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span>🛡️</span> Total Saldo Pribadi</span>
                <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 shadow-inner"><Eye size={14}/></span>
              </div>
              <h2 className="text-4xl font-black text-white mb-6 tracking-tight">Rp 404.437<span className="text-xl text-slate-500 font-bold">,83</span></h2>
              <div className="flex gap-4">
                <div className="flex-1 bg-white/[0.03] rounded-2xl p-4 border border-white/5 border-t-white/10 shadow-inner">
                  <p className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1"><span>↗</span> Pemasukan</p>
                  <p className="text-sm font-black text-white tracking-tight">Rp 18.527.862</p>
                </div>
                <div className="flex-1 bg-white/[0.03] rounded-2xl p-4 border border-white/5 border-t-white/10 shadow-inner">
                  <p className="text-[10px] text-rose-400 font-bold mb-1 flex items-center gap-1"><span>↘</span> Pengeluaran</p>
                  <p className="text-sm font-black text-white tracking-tight">Rp 16.383.443</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🏃🏻‍♂️ INFINITE MARQUEE */}
        <div className="w-full pt-20 pb-10 flex flex-col items-center justify-center relative z-10 mt-10 md:mt-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-8 text-center px-4">Mendukung Pencatatan Aset Dari Berbagai Platform</p>
          <div className="w-full max-w-5xl mx-auto overflow-hidden relative flex [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="flex whitespace-nowrap animate-marquee items-center gap-6 md:gap-8 w-max">
               {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-6 md:gap-8 items-center shrink-0">
                    <div className="flex items-center justify-center w-32 h-14 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 group"><img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA" className="h-4 md:h-5 object-contain brightness-0 invert opacity-40 group-hover:invert-0 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-500" /></div>
                    <div className="flex items-center justify-center w-32 h-14 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 group"><img src="https://upload.wikimedia.org/wikipedia/id/f/fa/Bank_Mandiri_logo_2016.svg" alt="Mandiri" className="h-4 md:h-5 object-contain brightness-0 invert opacity-40 group-hover:invert-0 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-500" /></div>
                    <div className="flex items-center justify-center w-32 h-14 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 group"><img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" alt="GoPay" className="h-4 md:h-5 object-contain brightness-0 invert opacity-40 group-hover:invert-0 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-500" /></div>
                    <div className="flex items-center justify-center w-32 h-14 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 group"><img src="https://www.ovo.id/assets/images/header/ovo-logo-new.svg" alt="OVO" className="h-3 md:h-4 object-contain brightness-0 invert opacity-40 group-hover:invert-0 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-500" /></div>
                    <div className="flex items-center justify-center w-32 h-14 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500 group"><img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" alt="DANA" className="h-3 md:h-4 object-contain brightness-0 invert opacity-40 group-hover:invert-0 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-500" /></div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        {/* 📱 BENTO GRID FEATURES */}
        <section className="py-24 px-6 max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[100px] bg-blue-500/20 blur-[60px] rounded-full pointer-events-none"></div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight relative z-10">Fitur Kelas <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Enterprise</span></h2>
            <p className="text-slate-400 text-sm md:text-base font-medium relative z-10">Semua yang kamu butuhkan untuk mencapai kebebasan finansial tanpa kompromi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 auto-rows-[minmax(320px,auto)]">
            
            <div className="md:col-span-2 flex flex-col justify-between bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900 to-slate-950 backdrop-blur-2xl p-8 md:p-10 rounded-[32px] border border-white/10 border-t-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(59,130,246,0.2)]">
              <Brain className="absolute -bottom-10 -right-10 w-72 h-72 text-blue-500 opacity-[0.03] rotate-12 group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none" />
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/25 transition-colors duration-700"></div>
              <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-in-out]"></div>
              
              <div className="relative z-10 mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> AI-Powered
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(59,130,246,0.2)] group-hover:scale-110 group-hover:border-blue-400/50 transition-all duration-500">
                  <Brain size={28} className="text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-3 tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 transition-all duration-500">Asisten AI Kepribadian Ganda</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md font-medium group-hover:text-slate-300 transition-colors">Bosan diingetin robot yang kaku? Fintracker punya mode "Roaster" yang siap me-roasting pengeluaran impulsifmu agar kapok jajan sembarangan.</p>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900 to-slate-950 backdrop-blur-2xl p-8 md:p-10 rounded-[32px] border border-white/10 border-t-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)]">
              <WifiOff className="absolute -bottom-8 -right-8 w-56 h-56 text-emerald-500 opacity-[0.03] -rotate-12 group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/25 transition-colors duration-700"></div>
              
              <div className="relative z-10 mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Core System
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(16,185,129,0.2)] group-hover:scale-110 group-hover:border-emerald-400/50 transition-all duration-500">
                  <WifiOff size={28} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-3 tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-emerald-200 transition-all duration-500">100% Offline-First</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium group-hover:text-slate-300 transition-colors">Catat transaksi di mana saja tanpa sinyal, tersinkronisasi otomatis saat terhubung kembali.</p>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900 to-slate-950 backdrop-blur-2xl p-8 md:p-10 rounded-[32px] border border-white/10 border-t-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(168,85,247,0.2)]">
              <Smartphone className="absolute -bottom-8 -right-8 w-56 h-56 text-purple-500 opacity-[0.03] rotate-12 group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none" />
              <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/25 transition-colors duration-700"></div>

              <div className="relative z-10 mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> Seamless UX
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/30 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(168,85,247,0.2)] group-hover:scale-110 group-hover:border-purple-400/50 transition-all duration-500">
                  <Smartphone size={28} className="text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-3 tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all duration-500">Sihir Drag & Drop</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium group-hover:text-slate-300 transition-colors">Pindahkan saldo antar dompet semudah menahan dan menggeser ikon dompet di layar HP-mu.</p>
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col justify-between bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900 to-slate-950 backdrop-blur-2xl p-8 md:p-10 rounded-[32px] border border-white/10 border-t-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative overflow-hidden group hover:border-amber-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(245,158,11,0.2)]">
              <Target className="absolute -bottom-10 -right-10 w-72 h-72 text-amber-500 opacity-[0.03] -rotate-12 group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-amber-500/25 transition-colors duration-700"></div>

              <div className="relative z-10 mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Gamification
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center shadow-[inset_0_2px_10px_rgba(245,158,11,0.2)] group-hover:scale-110 group-hover:border-amber-400/50 transition-all duration-500">
                  <Target size={28} className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-3 tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-amber-200 transition-all duration-500">Gamifikasi Runtutan (Streak)</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md font-medium group-hover:text-slate-300 transition-colors">Bangun kebiasaan baik dengan sistem Streak dan Financial Health Score. Dapatkan pujian setiap kali berhasil melewati hari tanpa pengeluaran!</p>
              </div>
            </div>

          </div>
        </section>

        {/* 💎 PRICING SECTION (TITANIUM PASS) */}
        <section className="py-24 px-6 max-w-5xl mx-auto mt-10 relative z-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
          
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight relative z-10">Investasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">Sekali</span>, Pakai Selamanya.</h2>
            <p className="text-slate-400 text-sm md:text-base font-medium relative z-10">Tinggalkan aplikasi keuangan kuno yang memeras Anda dengan biaya langganan bulanan.</p>
          </div>

          <div className="relative group mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/20 rounded-[42px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 border border-amber-500/20 border-t-amber-500/40 rounded-[40px] p-2 shadow-2xl overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-6 shadow-inner w-max">
                  <span className="animate-pulse">👑</span> VIP LIFETIME PASS
                </div>
                
                <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter text-white">Akses Tanpa <br className="hidden md:block"/>Batas Waktu.</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md font-medium">Bayar hari ini, nikmati semua fitur premium, proteksi enkripsi tingkat bank, dan <i>update</i> sistem selamanya tanpa biaya tambahan sepeser pun.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"><span className="text-amber-400 text-[10px]">✓</span></div><span className="text-sm font-bold text-slate-300">Biometrik Native & PIN</span></div>
                  <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"><span className="text-amber-400 text-[10px]">✓</span></div><span className="text-sm font-bold text-slate-300">Portofolio Multi-Aset</span></div>
                  <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"><span className="text-amber-400 text-[10px]">✓</span></div><span className="text-sm font-bold text-slate-300">Laporan Excel Multi-Sheet</span></div>
                  <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"><span className="text-amber-400 text-[10px]">✓</span></div><span className="text-sm font-bold text-slate-300">Asisten AI "Roaster"</span></div>
                </div>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-blue-100 flex items-center justify-center text-xs shadow-sm">👱🏻‍♂️</div>
                    <div className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-emerald-100 flex items-center justify-center text-xs shadow-sm">👩🏻</div>
                    <div className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-rose-100 flex items-center justify-center text-xs shadow-sm">🧔🏻‍♂️</div>
                    <div className="w-8 h-8 rounded-full border-2 border-[#0a0c10] bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold shadow-sm">+1.2K</div>
                  </div>
                  <div className="flex text-amber-400"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                </div>
              </div>
              
              <div className="w-full md:w-[380px] shrink-0 bg-gradient-to-b from-slate-900 to-slate-950 border-l border-white/5 border-dashed md:border-solid p-8 md:p-10 relative flex flex-col justify-center items-center text-center rounded-[32px] md:rounded-l-none md:rounded-r-[38px] mt-2 md:mt-0">
                <div className="hidden md:block absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 bg-slate-950 rounded-full border-r border-white/5 shadow-inner"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Harga Spesial Hari Ini</p>
                <div className="flex items-start justify-center gap-1 mb-2">
                  <span className="text-xl font-bold text-amber-400 mt-2">Rp</span><span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 tracking-tighter">49</span><span className="text-xl font-bold text-slate-400 mt-2">.000</span>
                </div>
                <p className="text-sm font-bold text-slate-500 line-through decoration-rose-500/50 decoration-2 mb-8">Harga Normal Rp 150.000</p>
                
                <button onClick={handleEnterApp} className="w-full relative group/btn block cursor-pointer">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-50 group-hover/btn:opacity-100 transition duration-300"></div>
                  <div className="relative w-full px-8 py-5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 border border-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Amankan Lisensi <ArrowRight size={18} />
                  </div>
                </button>
                <p className="text-[10px] text-slate-500 font-bold mt-5 flex items-center justify-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500"/> Pembayaran 1x via WhatsApp Admin</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🔒 SECURITY SECTION */}
        <section className="py-10 px-6 max-w-5xl mx-auto relative z-10">
          <div className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-[32px] p-8 md:p-10 shadow-[0_10px_40px_rgba(16,185,129,0.05)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 w-full md:w-auto text-center md:text-left">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-30 animate-pulse"></div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-600/5 border border-emerald-500/40 flex items-center justify-center relative shadow-[inset_0_1px_0_rgba(16,185,129,0.4)] backdrop-blur-xl group-hover:scale-110 transition-transform duration-500">
                  <ShieldCheck size={32} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">Privasi Tingkat <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">Bank.</span></h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">Data keuanganmu dienkripsi via Firebase Firestore. Kami tidak bisa melihat, membaca, atau membagikan datamu.</p>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col justify-center gap-3 relative z-10 w-full md:w-auto shrink-0">
              <div className="px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl flex items-center justify-center md:justify-start gap-2.5 shadow-inner backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Face ID Enabled</span>
              </div>
              <div className="px-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl flex items-center justify-center md:justify-start gap-2.5 shadow-inner backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">WebAuthn Biometric</span>
              </div>
            </div>
          </div>
        </section>

        {/* ❓ FAQ SECTION */}
        <section className="py-24 px-6 max-w-3xl mx-auto relative z-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="text-center mb-16 mt-8">
            <h2 className="text-3xl font-black mb-4 tracking-tight">Masih Punya Pertanyaan?</h2>
            <p className="text-slate-400 text-sm font-medium">Semua jawaban yang Anda butuhkan sebelum memulai perjalanan finansial baru.</p>
          </div>
          <div className="space-y-1">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={`transition-all duration-300 border-b ${isOpen ? 'border-blue-500/30' : 'border-white/5'} overflow-hidden relative group`}>
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent transition-opacity duration-300 pointer-events-none ${isOpen ? 'opacity-100' : 'opacity-0'}`}></div>
                  <button onClick={() => setOpenFaq(isOpen ? null : idx)} className="w-full py-6 pr-6 pl-4 flex items-center justify-between text-left focus:outline-none cursor-pointer relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-1 transition-all duration-300 rounded-r-full ${isOpen ? 'h-6 bg-blue-500' : 'h-0 bg-transparent'} absolute left-0`}></div>
                      <span className={`font-bold text-base md:text-lg transition-colors duration-300 ${isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{faq.q}</span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-blue-500/10 text-blue-400 rotate-180 shadow-inner' : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300'}`}><ChevronDown size={16} /></div>
                  </button>
                  <div className={`grid transition-all duration-300 ease-in-out relative z-10 ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0 pb-0'}`}>
                    <div className="overflow-hidden"><p className="pl-4 pr-12 text-sm text-slate-400 leading-relaxed font-medium">{faq.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 mt-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 pb-20 md:pb-0">
          <p className="text-slate-500 text-xs font-bold">© {new Date().getFullYear()} Fintracker App. All rights reserved.</p>
          <div className="flex items-center gap-6"><button onClick={handleEnterApp} className="cursor-pointer text-slate-400 hover:text-white text-xs font-bold transition-colors">Masuk Aplikasi</button></div>
        </div>
      </footer>

      {/* 📌 STICKY MOBILE CTA */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-[100] transition-transform duration-500 sm:hidden ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <button onClick={handleEnterApp} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm transition-all shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
          Amankan Lisensi 49rb <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}