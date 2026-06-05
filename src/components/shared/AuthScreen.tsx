"use client";

import { auth, googleProvider } from "../../lib/firebase"; 
import { signInWithPopup } from "firebase/auth";
import { Crown, ShieldCheck, Zap, Sparkles, Receipt, BarChart3 } from "lucide-react";

export default function AuthScreen() {
  
  // Fungsi masuk Google yang aman dengan penanganan error try-catch
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      // Deteksi jika popup ditutup manual oleh pengguna agar tidak menyebabkan crash
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Sistem: Proses masuk dibatalkan oleh pengguna (jendela ditutup).");
      } else {
        console.error("Sistem: Gagal masuk dengan Google:", error);
        alert("Gagal masuk: " + (error.message || "Terjadi kesalahan jaringan."));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a13] text-white p-6 relative overflow-hidden transition-colors duration-200">
      
      {/* Efek Gradasi Bias Cahaya Ambient di Latar Belakang */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -bottom-40 -right-40 pointer-events-none"></div>

      {/* Kartu Utama Glassmorphism Tanpa Outline Tebal */}
      <div className="bg-[#0b101d]/60 backdrop-blur-2xl border border-white/[0.06] p-8 md:p-10 rounded-[35px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Garis Aksen Berkilau di Atas Kartu */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
        
        {/* Logo Mahkota Berkilau Dengan Pendaran Neon */}
        <div className="w-16 h-16 bg-[#0f1524] rounded-full flex items-center justify-center mb-5 shadow-xl border border-white/[0.08] relative">
          <div className="absolute w-8 h-8 bg-blue-500/30 rounded-full blur-[10px] pointer-events-none"></div>
          <Crown size={26} className="text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.4)] z-10" strokeWidth={1.5}/>
        </div>
        
        {/* Branding Dua Warna */}
        <h1 className="text-2xl font-black mb-1.5 tracking-tight text-white leading-none">
          FIN<span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">TRACKER</span>
        </h1>
        <p className="text-xs text-slate-400 mb-6 text-center leading-relaxed">
          Asisten pintar pelacak aset personal yang aman & mandiri.
        </p>

        {/* Kotak Pengenalan Fitur Utama (Value Proposition Ter-ekspansi) */}
        <div className="w-full bg-slate-950/20 rounded-2xl p-5 mb-6 space-y-4 border border-white/[0.03] text-left">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">🔥 Fitur Unggulan Seumur Hidup</p>
          
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/10 shrink-0 mt-0.5">
              <Zap size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-300 leading-none uppercase tracking-wider">Offline-First Engine</h4>
              <p className="text-[9px] text-slate-500 font-bold leading-tight mt-1">Kebal offline, data tersimpan di perangkat & sinkronisasi otomatis</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/10 shrink-0 mt-0.5">
              <ShieldCheck size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-300 leading-none uppercase tracking-wider">Lokal Gembok Sandi</h4>
              <p className="text-[9px] text-slate-500 font-bold leading-tight mt-1">Proteksi sandi PIN 6-digit, sidik jari/Face ID & sensor BCA style</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/10 shrink-0 mt-0.5">
              <Sparkles size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-300 leading-none uppercase tracking-wider">Multi-Currency Cerdas</h4>
              <p className="text-[9px] text-slate-500 font-bold leading-tight mt-1">Konversi multi-valas otomatis terhadap IDR, USD, s/d CNY Yuan China</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/10 shrink-0 mt-0.5">
              <Receipt size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-300 leading-none uppercase tracking-wider">Pecah Struk (Split Bill)</h4>
              <p className="text-[9px] text-slate-500 font-bold leading-tight mt-1">Bagi pengeluaran tunggal ke banyak sub-kategori belanja</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-pink-500/10 rounded-lg text-pink-400 border border-pink-500/10 shrink-0 mt-0.5">
              <BarChart3 size={13} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-300 leading-none uppercase tracking-wider">Analitik Tren 6 Bulan</h4>
              <p className="text-[9px] text-slate-500 font-bold leading-tight mt-1">Visualisasi grafik Recharts, heatmap kalender, & ekspor dokumen</p>
            </div>
          </div>
        </div>

        {/* Tombol Masuk Google Premium Bernuansa Dark Sleek */}
        <button 
          onClick={handleGoogleSignIn} 
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/[0.06] transition-all cursor-pointer"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            className="w-5 h-5 shrink-0" 
            alt="Google Logo"
          /> 
          Masuk dengan Google
        </button>

        {/* Footer Disclaimer */}
        <p className="mt-6 text-[9px] font-bold text-slate-600 text-center leading-relaxed max-w-[285px]">
          Dengan masuk, Anda menyetujui ketentuan privasi penyimpanan data terenkripsi lokal aman FINTRACKER.
        </p>

      </div>
    </div>
  );
}