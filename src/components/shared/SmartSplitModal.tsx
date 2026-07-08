"use client";

import React, { useState, useRef } from "react";
import { X, Camera, Image as ImageIcon, ScanLine, Sparkles, RefreshCw } from "lucide-react";

interface SmartSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: any;
}

export default function SmartSplitModal({ isOpen, onClose, currentTheme }: SmartSplitModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate(15);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerHaptic();
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleScan = () => {
    triggerHaptic();
    setIsScanning(true);
    
    // Simulasi Fake Loading OCR Tahap 1
    setTimeout(() => {
      setIsScanning(false);
      alert("🎉 TAHAP 1 BERHASIL!\n\nSistem Kamera & Pratinjau UI sudah siap.\nDi sesi selanjutnya (Tahap 2), kita akan memasukkan otak Tesseract AI untuk mengekstrak teks makanan dari foto ini!");
    }, 2500);
  };

  const handleReset = () => {
    triggerHaptic();
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0 z-0" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-slate-950 w-full md:max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-400 z-10 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        
        {/* Header Tema Dinamis */}
        <div className={`p-6 ${currentTheme.activePill.split(' ')[0]} text-white shrink-0 relative overflow-hidden`}>
          <div className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none text-white"><ScanLine size={100} /></div>
          <button type="button" onClick={onClose} className="absolute top-4 left-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer"><X size={16} /></button>
          
          <div className="mt-8 text-center relative z-10">
            <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner border border-white/30">
              <Sparkles size={32} />
            </div>
            <h2 className="text-xl font-black tracking-tight">Kasir Tongkrongan</h2>
            <p className="text-[10px] font-bold text-white/80 mt-1 tracking-widest uppercase">Smart Itemized Split Bill (AI)</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950 flex-1 overflow-y-auto">
          {/* HIDDEN INPUTS MURNI NATIVE HTML */}
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleImagePick} />
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImagePick} />

          {!imagePreview ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Foto struk makan siangmu. AI Fintracker akan membaca nama makanan, harga, dan pajak, lalu membaginya ke utang teman secara adil.
                </p>
              </div>

              <button 
                onClick={() => { triggerHaptic(); cameraInputRef.current?.click(); }}
                className={`w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${currentTheme.bgLight} ${currentTheme.border} ${currentTheme.text} hover:bg-slate-100 dark:hover:bg-slate-800`}
              >
                <Camera size={32} strokeWidth={1.5} />
                <span className="text-sm font-black">Jepret Kamera</span>
              </button>

              <button 
                onClick={() => { triggerHaptic(); fileInputRef.current?.click(); }}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-95 text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md"
              >
                <ImageIcon size={20} />
                <span className="text-xs font-black">Pilih dari Galeri</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 flex flex-col items-center animate-in zoom-in-95 duration-300">
              {/* PREVIEW IMAGE CONTAINER */}
              <div className="relative w-full aspect-[3/4] max-h-[45vh] bg-slate-200 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-800 flex items-center justify-center">
                
                {/* SCANNED IMAGE */}
                <img src={imagePreview} alt="Struk" className={`w-full h-full object-contain ${isScanning ? 'blur-sm scale-105 opacity-80' : ''} transition-all duration-700`} />
                
                {/* EFEK LASER MASA DEPAN ⚡ */}
                {isScanning && (
                  <>
                    <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay"></div>
                    <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_4px_rgba(34,211,238,0.8)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                  </>
                )}
              </div>

              {/* ACTIONS */}
              {!isScanning ? (
                <div className="w-full flex gap-3">
                  <button onClick={handleReset} className="p-3.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-sm"><RefreshCw size={20}/></button>
                  <button onClick={handleScan} className={`flex-1 py-3.5 text-white rounded-xl text-sm font-black shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border ${currentTheme.fab}`}>
                    <ScanLine size={18} /> Pindai Struk Sekarang
                  </button>
                </div>
              ) : (
                <div className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">AI Sedang Membaca...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}