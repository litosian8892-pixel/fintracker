"use client";

import React, { useState, useRef } from "react";
import { X, Camera, Image as ImageIcon, ScanLine, Sparkles, RefreshCw, Users, Receipt, Plus, Trash2, CheckCircle2 } from "lucide-react";
import Tesseract from "tesseract.js";

interface SmartSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: any;
}

interface ParsedItem {
  id: string;
  name: string;
  price: number;
  owner: string;
}

export default function SmartSplitModal({ isOpen, onClose, currentTheme }: SmartSplitModalProps) {
  const [step, setStep] = useState<"upload" | "scanning" | "review" | "result">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // OCR Progress State
  const [scanStatus, setScanStatus] = useState("Menyiapkan AI...");
  const [scanProgress, setScanProgress] = useState(0);

  // Split Data States
  const [friends, setFriends] = useState<string[]>(["Saya"]);
  const [newFriend, setNewFriend] = useState("");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [tax, setTax] = useState(0);
  const [service, setService] = useState(0);

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

  const parseReceiptText = (text: string) => {
    const lines = text.split('\n');
    const extractedItems: ParsedItem[] = [];
    let extractedTax = 0;
    let extractedService = 0;

    const priceRegex = /([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*$/;

    lines.forEach((line) => {
      let cleanLine = line.trim();
      if (cleanLine.length < 5) return;

      const match = cleanLine.match(priceRegex);
      if (match) {
        const priceStr = match[1].replace(/[^\d]/g, ''); 
        const price = parseInt(priceStr, 10);
        
        if (price > 1000) { 
           let name = cleanLine.replace(match[0], '').trim();
           name = name.replace(/^[^a-zA-Z]+/, ''); 
           if (name.length < 2) return;

           const lower = name.toLowerCase();
           if (lower.includes('tax') || lower.includes('pajak') || lower.includes('pb1') || lower.includes('ppn')) {
             extractedTax += price;
           } else if (lower.includes('service') || lower.includes('servis') || lower.includes('svc')) {
             extractedService += price;
           } else if (lower.includes('total') || lower.includes('cash') || lower.includes('change') || lower.includes('kembali') || lower.includes('card') || lower.includes('debit') || lower.includes('qris') || lower.includes('pay') || lower.includes('subtotal') || lower.includes('amount')) {
             // Abaikan
           } else {
             extractedItems.push({ 
               id: Math.random().toString(36).substr(2, 9), 
               name: name.substring(0, 30), 
               price, 
               owner: 'Saya' 
             });
           }
        }
      }
    });

    return { extractedItems, extractedTax, extractedService };
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    triggerHaptic();
    setStep("scanning");

    try {
      const result = await Tesseract.recognize(
        imagePreview,
        'ind+eng', 
        { 
          logger: m => {
            if (m.status === "recognizing text") {
              setScanStatus("Mengekstrak teks struk...");
              setScanProgress(m.progress);
            } else {
              setScanStatus("Memuat mesin AI...");
            }
          } 
        }
      );

      const { extractedItems, extractedTax, extractedService } = parseReceiptText(result.data.text);
      
      setItems(extractedItems);
      setTax(extractedTax);
      setService(extractedService);
      
      triggerHaptic();
      setStep("review");

    } catch (error) {
      console.error(error);
      alert("Gagal membaca struk. Pastikan foto terang dan teks terbaca jelas.");
      setStep("upload");
    }
  };

  const handleAddFriend = () => {
    if (!newFriend.trim()) return;
    if (friends.includes(newFriend.trim())) return alert("Nama sudah ada!");
    triggerHaptic();
    setFriends([...friends, newFriend.trim()]);
    setNewFriend("");
  };

  const handleUpdateItemOwner = (id: string, newOwner: string) => {
    triggerHaptic();
    setItems(items.map(item => item.id === id ? { ...item, owner: newOwner } : item));
  };

  const handleDeleteItem = (id: string) => {
    triggerHaptic();
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddItemManual = () => {
    triggerHaptic();
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: "Menu Baru", price: 0, owner: "Saya" }]);
  };

  const calculateResult = () => {
    const totalItemsPrice = items.reduce((sum, item) => sum + item.price, 0);
    if (totalItemsPrice === 0) return [];

    const result = friends.map(friend => {
      const friendItemsTotal = items.filter(item => item.owner === friend).reduce((sum, item) => sum + item.price, 0);
      const proportion = friendItemsTotal / totalItemsPrice;
      const friendTax = Math.round(tax * proportion);
      const friendService = Math.round(service * proportion);
      const finalTotal = friendItemsTotal + friendTax + friendService;

      return {
        name: friend,
        itemsTotal: friendItemsTotal,
        tax: friendTax,
        service: friendService,
        finalTotal
      };
    });

    return result.filter(r => r.finalTotal > 0); 
  };

  const formatRp = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  const handleReset = () => {
    triggerHaptic();
    setStep("upload");
    setImagePreview(null);
    setItems([]);
    setTax(0);
    setService(0);
    setFriends(["Saya"]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0 z-0" onClick={() => step !== "scanning" && onClose()}></div>
      
      <div className="bg-white dark:bg-slate-950 w-full md:max-w-md rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-400 z-10 flex flex-col h-[90vh] md:h-[85vh] border border-slate-200 dark:border-slate-800">
        
        {/* HEADER PREMIUM (MIDNIGHT SLATE GRADIENT) */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shrink-0 relative overflow-hidden border-b border-slate-700/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none text-indigo-200"><ScanLine size={100} /></div>
          {step !== "scanning" && (
            <button type="button" onClick={onClose} className="absolute top-4 left-4 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm cursor-pointer border border-white/10">
              <X size={16} />
            </button>
          )}
          
          <div className="mt-5 text-center relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 shadow-inner border border-indigo-500/30 rotate-3">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Smart SplitBill</h2>
            <p className="text-[10px] font-bold text-indigo-300/80 mt-1 tracking-widest uppercase">
              {step === "upload" ? "AI Receipt Scanner" : step === "scanning" ? "Memproses Data..." : step === "review" ? "Review & Alokasi" : "Rekap Tagihan Final"}
            </p>
          </div>
        </div>

        <div className="p-0 bg-slate-50 dark:bg-slate-950 flex-1 overflow-y-auto no-scrollbar relative">
          
          {/* ========================================================= */}
          {/* STEP 1: UPLOAD & PREVIEW */}
          {/* ========================================================= */}
          {step === "upload" && (
            <div className="p-6">
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleImagePick} />
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImagePick} />

              {!imagePreview ? (
                <div className="space-y-4">
                  <div className="text-center mb-6 px-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                      Pindai struk Anda. Fintracker AI akan mengekstrak rincian item, harga, serta proporsi pajak secara otomatis untuk dibagikan secara akurat.
                    </p>
                  </div>
                  <button onClick={() => { triggerHaptic(); cameraInputRef.current?.click(); }} className="w-full p-5 rounded-[20px] border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 hover:bg-indigo-100 dark:hover:bg-indigo-900/30">
                    <Camera size={32} strokeWidth={1.5} /><span className="text-sm font-black">Gunakan Kamera</span>
                  </button>
                  <button onClick={() => { triggerHaptic(); fileInputRef.current?.click(); }} className="w-full p-4 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-95 text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md">
                    <ImageIcon size={20} /><span className="text-xs font-black">Unggah dari Galeri</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="relative w-full aspect-[3/4] max-h-[45vh] bg-slate-200 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-800 flex items-center justify-center">
                    <img src={imagePreview} alt="Struk" className="w-full h-full object-contain" />
                  </div>
                  <div className="w-full flex gap-3">
                    <button onClick={handleReset} className="p-3.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all active:scale-95 cursor-pointer shadow-sm"><RefreshCw size={20}/></button>
                    <button onClick={handleScan} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-[0_4px_20px_rgba(79,70,229,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-indigo-500">
                      <ScanLine size={18} /> Ekstrak Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: SCANNING PROGRESS */}
          {/* ========================================================= */}
          {step === "scanning" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-950 z-50">
              <div className="relative w-32 h-48 bg-slate-900 rounded-2xl border border-indigo-500/30 overflow-hidden mb-8 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                {imagePreview && <img src={imagePreview} alt="Scan" className="w-full h-full object-cover opacity-20 grayscale-[50%]" />}
                <div className="absolute left-0 right-0 h-1 bg-indigo-400 shadow-[0_0_20px_4px_rgba(129,140,248,0.8)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
              </div>
              <h3 className="text-lg font-black text-white mb-2">{scanStatus}</h3>
              <div className="w-full max-w-[200px] h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${Math.round(scanProgress * 100)}%` }}></div>
              </div>
              <p className="text-[10px] text-indigo-400 font-bold mt-2 uppercase tracking-widest">{Math.round(scanProgress * 100)}% Selesai</p>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: REVIEW & ASSIGN ITEMS */}
          {/* ========================================================= */}
          {step === "review" && (
            <div className="p-5 space-y-6 pb-24 text-left">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Users size={12}/> Daftar Pembayar</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {friends.map(f => (
                    <span key={f} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${f === "Saya" ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Tambah teman..." value={newFriend} onChange={e => setNewFriend(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFriend()} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-white" />
                  <button onClick={handleAddFriend} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm">Tambah</button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Receipt size={12}/> Hasil Ekstrak Cerdas</p>
                
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="text-xs font-bold text-rose-500 italic text-center py-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl">Data tidak terbaca dengan baik. Silakan masukkan secara manual.</p>
                  ) : items.map((item, index) => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl relative">
                      <button onClick={() => handleDeleteItem(item.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-sm hover:scale-110 transition-transform"><X size={10} strokeWidth={3}/></button>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={item.name} onChange={(e) => { const newItems = [...items]; newItems[index].name = e.target.value; setItems(newItems); }} className="flex-1 bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-indigo-500 px-1" />
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-slate-400">Rp</span>
                          <input type="number" value={item.price || ""} onChange={(e) => { const newItems = [...items]; newItems[index].price = Number(e.target.value); setItems(newItems); }} className="w-16 bg-transparent text-xs font-black text-right text-slate-800 dark:text-white outline-none" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {friends.map(f => (
                          <button key={f} onClick={() => handleUpdateItemOwner(item.id, f)} className={`text-[9px] font-black px-2 py-1 rounded transition-all border ${item.owner === f ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleAddItemManual} className="w-full mt-3 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Plus size={14}/> Tambah Item Manual</button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 shadow-sm flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Pajak Resto</label>
                  <div className="flex items-center bg-white dark:bg-slate-900 px-2 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700/50">
                    <span className="text-[10px] font-bold text-slate-400">Rp</span><input type="number" value={tax || ""} onChange={e => setTax(Number(e.target.value))} className="w-full bg-transparent text-xs font-black text-right text-slate-800 dark:text-white outline-none" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Service Charge</label>
                  <div className="flex items-center bg-white dark:bg-slate-900 px-2 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700/50">
                    <span className="text-[10px] font-bold text-slate-400">Rp</span><input type="number" value={service || ""} onChange={e => setService(Number(e.target.value))} className="w-full bg-transparent text-xs font-black text-right text-slate-800 dark:text-white outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: HASIL FINAL (REKAP TAGIHAN) */}
          {/* ========================================================= */}
          {step === "result" && (
            <div className="p-6 space-y-4 pb-24 text-left">
              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-black text-slate-500">TOTAL KESELURUHAN</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">{formatRp(items.reduce((s,i)=>s+i.price,0) + tax + service)}</span>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rincian Per Orang</p>
                {calculateResult().map((res, i) => (
                  <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center shadow-sm ${res.name === "Saya" ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                    <div>
                      <h4 className={`text-sm font-black ${res.name === "Saya" ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>{res.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-tight">Total Item: {formatRp(res.itemsTotal)}<br/>Pajak+Servis: {formatRp(res.tax + res.service)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${res.name === "Saya" ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>{formatRp(res.finalTotal)}</p>
                      {res.name !== "Saya" && <span className="text-[8px] bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black mt-1 inline-block uppercase border border-emerald-200 dark:border-emerald-800/50">Piutang Baru</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR STICKY */}
        {step === "review" && (
          <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex gap-3 shrink-0 z-20">
            <button onClick={() => { triggerHaptic(); setStep("result"); }} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded-xl text-sm font-black shadow-lg transition-all active:scale-[0.98]">
              Kalkulasi & Bagi Tagihan
            </button>
          </div>
        )}

        {step === "result" && (
          <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md flex gap-3 shrink-0 z-20">
            <button 
              onClick={() => {
                triggerHaptic();
                alert(`Tagihan Berhasil Dihitung!\n\nBos bisa menagih ke teman-teman Bos sebesar nominal tersebut.\n(Integrasi simpan otomatis ke Tab Utang akan kita pasang di sesi berikutnya).`);
                onClose();
                setTimeout(handleReset, 500);
              }} 
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 rounded-xl text-sm font-black shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18}/> Selesai
            </button>
            <button onClick={() => { triggerHaptic(); setStep("review"); }} className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700">Kembali</button>
          </div>
        )}

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