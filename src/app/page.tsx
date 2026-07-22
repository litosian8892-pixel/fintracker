"use client";

import Link from "next/link";
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowSticky(window.scrollY > 400); // Trigger Sticky CTA
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* CSS ENGINE: Animasi Float & Marquee Khusus Landing Page */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 20s linear infinite; }
      `}} />
      
      {/* 🔮 Background Glow Effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* 🛸 Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            {/* 💎 LOGO CUSTOM */}
            <img 
              src="/apple-touch-icon.png" 
              alt="Fintracker Logo" 
              className="w-8 h-8 rounded-xl object-cover shadow-lg shadow-blue-500/20"
            />
            <span className="font-black text-xl tracking-tight text-white">Fintracker<span className="text-blue-500">.</span></span>
          </div>
          <Link href="/dashboard" className="px-5 py-2.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 backdrop-blur-md">
            Masuk App
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* 🚀 HERO SECTION */}
        <section className="pt-40 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
            Fintracker Fase 27 Dirilis
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Kelola Uang Gak Pake Ribet. Otomatis, Cerdas, & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">Sedikit Julid.</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            Tinggalkan cara lama mencatat manual yang membosankan. Fintracker adalah PWA canggih dengan Asisten AI yang siap mengingatkan batas anggaranmu.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/dashboard" className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_0_60px_-10px_rgba(59,130,246,0.8)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
              Dapatkan Akses Sekarang <ArrowRight size={18} />
            </Link>
          </div>

          {/* 📱 FLOATING GLASS MOCKUP */}
          <div className="mt-20 relative w-full max-w-lg mx-auto animate-float hidden md:block">
            <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-[40px] pointer-events-none"></div>
            <div className="relative bg-[#0b101d]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[35px] p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span>🛡️</span> Total Saldo Pribadi</span>
                <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20"><Eye size={14}/></span>
              </div>
              <h2 className="text-4xl font-black text-white mb-6 tracking-tight">Rp 404.437<span className="text-xl text-slate-500">,83</span></h2>
              <div className="flex gap-4">
                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1"><span>↗</span> Pemasukan</p>
                  <p className="text-sm font-black text-white">Rp 18.527.862</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] text-rose-400 font-bold mb-1 flex items-center gap-1"><span>↘</span> Pengeluaran</p>
                  <p className="text-sm font-black text-white">Rp 16.383.443</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🏃🏻‍♂️ INFINITE MARQUEE (PITA BERJALAN) */}
        <div className="w-full overflow-hidden border-y border-white/5 bg-white/[0.02] py-4 md:mt-10 relative flex pointer-events-none">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#030712] to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#030712] to-transparent z-10"></div>
          
          <div className="flex whitespace-nowrap animate-marquee items-center gap-8 w-[200%]">
             {/* Render 2x untuk ilusi pergerakan tiada henti */}
             {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-8 items-center shrink-0">
                  <span className="text-slate-400 font-bold text-xs md:text-sm flex items-center gap-2">💳 BCA</span><span className="text-slate-700">•</span>
                  <span className="text-slate-400 font-bold text-xs md:text-sm flex items-center gap-2">📱 GoPay</span><span className="text-slate-700">•</span>
                  <span className="text-slate-400 font-bold text-xs md:text-sm flex items-center gap-2">📱 OVO</span><span className="text-slate-700">•</span>
                  <span className="text-slate-400 font-bold text-xs md:text-sm flex items-center gap-2">💳 Mandiri</span><span className="text-slate-700">•</span>
                  <span className="text-slate-400 font-bold text-xs md:text-sm flex items-center gap-2">📱 Dana</span><span className="text-slate-700">•</span>
                  <span className="text-slate-400 font-bold text-xs md:text-sm flex items-center gap-2">📈 Saham & Crypto</span><span className="text-slate-700">•</span>
                </div>
             ))}
          </div>
        </div>

        {/* 📱 BENTO GRID FEATURES SECTION */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Fitur Kelas <span className="text-blue-400">Enterprise</span></h2>
            <p className="text-slate-400 text-sm">Semua yang kamu butuhkan untuk mencapai kebebasan finansial.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 (Large) */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-900/40 p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors"></div>
              <Brain size={32} className="text-blue-400 mb-6" />
              <h3 className="text-2xl font-black mb-2">Asisten AI Kepribadian Ganda</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">Bosan diingetin robot yang kaku? Fintracker punya mode "Roaster" yang siap me-roasting pengeluaran impulsifmu agar kamu kapok jajan sembarangan.</p>
            </div>

            {/* Feature 2 (Square) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <WifiOff size={32} className="text-emerald-400 mb-6" />
              <h3 className="text-xl font-black mb-2">100% Offline-First</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Nggak ada sinyal? Gak masalah. Catat transaksi kapan saja, sinkronisasi ke cloud otomatis saat sinyal kembali.</p>
            </div>

            {/* Feature 3 (Square) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/40 p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <Smartphone size={32} className="text-purple-400 mb-6" />
              <h3 className="text-xl font-black mb-2">Sihir Drag & Drop</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Pindahkan saldo antar dompet semudah menahan dan menggeser ikon dompet di layar HP-mu.</p>
            </div>

            {/* Feature 4 (Large) */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-900/40 p-8 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <Target size={32} className="text-orange-400 mb-6" />
              <h3 className="text-2xl font-black mb-2">Gamifikasi Runtutan (Streak)</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">Bangun kebiasaan baik dengan sistem Streak dan Financial Health Score. Dapatkan pujian setiap kali berhasil melewati hari tanpa pengeluaran!</p>
            </div>

          </div>
        </section>

        {/* 💎 PRICING SECTION (LIFETIME DEAL) */}
        <section className="py-20 px-6 max-w-4xl mx-auto border-t border-white/5 mt-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Investasi <span className="text-amber-400">Sekali</span>, Pakai Selamanya.</h2>
            <p className="text-slate-400 text-sm">Tinggalkan aplikasi keuangan kuno yang memeras Anda dengan biaya langganan bulanan.</p>
          </div>

          <div className="bg-gradient-to-b from-[#111827] to-[#030712] border border-amber-500/20 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-amber-500/5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Glow Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex-1 text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-6">
                <span>👑</span> LIFETIME ACCESS PASS
              </div>
              <h3 className="text-4xl md:text-5xl font-black mb-4">Rp 49.000 <span className="text-lg text-slate-500 font-bold line-through ml-2">Rp 150.000</span></h3>
              
              {/* 🔥 SOCIAL PROOF AVATARS */}
              <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-blue-100 flex items-center justify-center text-sm shadow-sm">👱🏻‍♂️</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-emerald-100 flex items-center justify-center text-sm shadow-sm">👩🏻</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-rose-100 flex items-center justify-center text-sm shadow-sm">🧔🏻‍♂️</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-amber-100 flex items-center justify-center text-sm shadow-sm">🧕🏼</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold shadow-sm">+1.2K</div>
                </div>
                <div className="text-left">
                  <div className="flex text-amber-400"><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/><Star size={12} fill="currentColor"/></div>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Dipercaya Milenial & Gen-Z</p>
                </div>
              </div>

              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm mx-auto md:mx-0">
                Akses seluruh fitur premium Fintracker tanpa batas waktu. Bayar hari ini, nikmati *update* dan fitur baru selamanya tanpa biaya tambahan.
              </p>
              <ul className="space-y-3 text-sm font-bold text-slate-300 text-left w-max mx-auto md:mx-0">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Proteksi PIN & Biometrik Native</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Multi-Currency & Portofolio Investasi</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Manajemen Utang & Langganan</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Ekspor Laporan Excel Multi-Sheet</li>
              </ul>
            </div>
            
            <div className="w-full md:w-auto relative z-10 shrink-0">
              <Link href="/dashboard" className="w-full md:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm transition-all shadow-[0_10px_40px_-10px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                Amankan Lisensi Sekarang <ArrowRight size={18} />
              </Link>
              <p className="text-[10px] text-slate-500 font-bold text-center mt-4">Pembayaran 1x via WhatsApp Admin</p>
            </div>
          </div>
        </section>

        {/* 🔒 SECURITY SECTION */}
        <section className="py-24 px-6 max-w-4xl mx-auto text-center border-t border-white/5 mt-10">
          <ShieldCheck size={48} className="text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-4">Privasi Tingkat Bank</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">Data keuanganmu dikunci menggunakan enkripsi Firebase Firestore. Hanya kamu yang bisa mengakses data milikmu sendiri, bahkan kami pun tidak bisa melihatnya.</p>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-300">Face ID Supported</span>
            <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-300">Biometric Native</span>
          </div>
        </section>

        {/* ❓ FAQ SECTION (Pertanyaan Sering Diajukan) */}
        <section className="py-20 px-6 max-w-3xl mx-auto border-t border-white/5">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-4">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-slate-400 text-sm">Masih ragu? Berikut adalah jawaban untuk membantu Anda.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`border transition-all duration-300 rounded-[20px] overflow-hidden ${isOpen ? 'border-blue-500/30 bg-blue-900/10' : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/60'}`}
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : idx)} 
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <span className={`font-bold text-sm ${isOpen ? 'text-blue-400' : 'text-slate-200'}`}>{faq.q}</span>
                    <ChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'}`} />
                  </button>
                  
                  {/* Animasi Buka/Tutup Menggunakan CSS Grid Hack (Super Mulus) */}
                  <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4 mt-1">
                        {faq.a}
                      </p>
                    </div>
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
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-xs font-bold transition-colors">Masuk Aplikasi</Link>
          </div>
        </div>
      </footer>

      {/* 📌 STICKY MOBILE CTA (Anti-Lolos) */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-transparent z-[100] transition-transform duration-500 sm:hidden ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <Link href="/dashboard" className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm transition-all shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 active:scale-95">
          Amankan Lisensi 49rb <ArrowRight size={16} />
        </Link>
      </div>

    </div>
  );
}