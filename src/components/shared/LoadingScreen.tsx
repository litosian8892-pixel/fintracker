"use client";

export default function LoadingScreen() {
  return (
    // Latar belakang disesuaikan dengan tema Terang/Gelap
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center overflow-hidden">
      
      {/* Kontainer Skeleton yang dibatasi lebarnya untuk konsistensi dengan konten utama */}
      <div className="w-full max-w-3xl px-4 py-6 md:p-8 flex flex-col gap-8 h-full relative">
        
        {/* SKELETON 1: HEADER (Avatar & Sapaan) */}
        <div className="flex items-center gap-4 animate-pulse pt-2">
          {/* Avatar Skeleton */}
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0"></div>
          
          {/* Text Lines Skeleton */}
          <div className="space-y-2.5 flex-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 md:w-1/5"></div>
          </div>
          
          {/* Action Icons Skeleton (Kanan Atas) */}
          <div className="flex gap-2">
            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
        </div>

        {/* SKELETON 2: KARTU SALDO (PREMIUM CARD) */}
        <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-[32px] animate-pulse relative overflow-hidden">
          <div className="absolute top-6 left-6 space-y-3">
            <div className="h-3 bg-white/40 dark:bg-slate-700 rounded w-24"></div>
            <div className="h-8 bg-white/40 dark:bg-slate-700 rounded w-48 mt-2"></div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between">
            <div className="h-10 bg-white/40 dark:bg-slate-700 rounded-xl w-1/3"></div>
            <div className="h-10 bg-white/40 dark:bg-slate-700 rounded-xl w-1/3"></div>
          </div>
        </div>

        {/* SKELETON 3: KONTEN/TRANSAKSI (List Items) */}
        <div className="space-y-5 animate-pulse mt-2">
          <div className="flex justify-between items-center mb-2">
             <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
             <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
          </div>

          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-4 w-full">
                {/* Ikon Kategori Skeleton */}
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0"></div>
                
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2 md:w-1/3"></div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 md:w-1/4"></div>
                </div>
              </div>
              
              {/* Nominal Transaksi Skeleton */}
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20 shrink-0"></div>
            </div>
          ))}
        </div>

        {/* SKELETON 4: BOTTOM NAV (Khusus Mobile) */}
        <div className="md:hidden fixed bottom-5 left-4 right-4 animate-pulse">
          <div className="bg-slate-200 dark:bg-slate-800 h-16 rounded-[28px] px-6 flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}