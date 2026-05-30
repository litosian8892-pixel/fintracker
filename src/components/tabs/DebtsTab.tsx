"use client";
import { useState } from "react";
import { CheckCircle2, CircleDashed, Trash2, Plus, Wallet } from "lucide-react";
import { DebtData, AccountData } from "../../types";

interface DebtsTabProps {
  debts: DebtData[];
  accounts: AccountData[];
  handleAddDebt: (type: "debt" | "receivable", person: string, amount: number, note: string, accountId?: string) => void;
  handlePayDebt: (debtId: string, payAmount: number, accountId: string) => void;
  handleDeleteDebt: (debtId: string) => void;
}

export default function DebtsTab({ debts, accounts, handleAddDebt, handlePayDebt, handleDeleteDebt }: DebtsTabProps) {
  const [activeType, setActiveType] = useState<"debt" | "receivable">("debt");
  
  // State Form Tambah Utang
  const [showAddForm, setShowAddForm] = useState(false);
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");

  // State Form Bayar Cicilan
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");

  const submitAdd = () => {
    if (!person || !amount) return alert("Nama dan Nominal harus diisi!");
    if (activeType === "receivable" && !sourceAccountId) {
      return alert("Pilih dompet pengirim uang terlebih dahulu agar saldo otomatis terpotong!");
    }
    
    handleAddDebt(activeType, person, Number(amount), note, sourceAccountId);
    setShowAddForm(false); setPerson(""); setAmount(""); setNote(""); setSourceAccountId("");
  };

  const submitPay = (id: string) => {
    if (!payAmount || !payAccountId) return alert("Nominal dan Dompet harus diisi!");
    handlePayDebt(id, Number(payAmount), payAccountId);
    setPayingDebtId(null); setPayAmount(""); setPayAccountId("");
  };

  const filteredDebts = debts.filter(d => d.type === activeType);
  const totalActive = filteredDebts.filter(d => d.status === "active").reduce((a, b) => a + (b.amount - b.paidAmount), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header Toggle (KOREKSI VISUAL MODE GELAP) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[30px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button onClick={() => { setActiveType("debt"); setShowAddForm(false); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeType === "debt" ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm border border-transparent dark:border-red-900/30" : "text-slate-400 dark:text-slate-500"}`}>UTANG SAYA</button>
          <button onClick={() => { setActiveType("receivable"); setShowAddForm(false); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${activeType === "receivable" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-transparent dark:border-emerald-900/30" : "text-slate-400 dark:text-slate-500"}`}>PIUTANG ORANG</button>
        </div>
        
        <div className={`p-5 rounded-2xl transition-colors ${activeType === "debt" ? "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30" : "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30"}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${activeType === "debt" ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}`}>
            Sisa {activeType === "debt" ? "Utang Saya" : "Uang Saya di Orang"}
          </p>
          <h2 className={`text-2xl font-black italic mt-1 ${activeType === "debt" ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>Rp {totalActive.toLocaleString('id-ID')}</h2>
        </div>

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"><Plus size={16}/> Tambah Catatan Baru</button>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{activeType === "debt" ? "Mencatat Utang Baru" : "Mencatat Piutang Baru"}</h4>
            
            <input type="text" placeholder={activeType === "debt" ? "Utang ke siapa?" : "Siapa yang pinjam?"} className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-100" value={person} onChange={e => setPerson(e.target.value)} />
            
            <input type="number" placeholder="Nominal Total (Rp)" className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-100" value={amount} onChange={e => setAmount(e.target.value)} />
            
            {/* DROPDOWN PILIHAN DOMPET */}
            {activeType === "receivable" && (
              <div className="relative">
                <Wallet className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200 appearance-none cursor-pointer border border-slate-100 dark:border-slate-700" 
                  value={sourceAccountId} 
                  onChange={e => setSourceAccountId(e.target.value)}
                >
                  <option value="">Kirim dari Dompet...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})</option>
                  ))}
                </select>
              </div>
            )}

            <input type="text" placeholder="Catatan / Tujuan pinjam" className="w-full p-3.5 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-none font-bold text-slate-700 dark:text-slate-100" value={note} onChange={e => setNote(e.target.value)} />
            
            <div className="flex gap-2 pt-2">
              <button onClick={submitAdd} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Simpan</button>
              <button onClick={() => setShowAddForm(false)} className="py-3 px-6 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-bold cursor-pointer">Batal</button>
            </div>
          </div>
        )}
      </div>

      {/* List Utang/Piutang (KOREKSI VISUAL MODE GELAP) */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <p className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm italic bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">Belum ada catatan {activeType === "debt" ? "utang" : "piutang"}.</p>
        ) : (
          filteredDebts.map(debt => {
            const percentage = Math.min((debt.paidAmount / debt.amount) * 100, 100);
            const isPaid = debt.status === "paid";

            return (
              <div key={debt.id} className={`bg-white p-5 rounded-[25px] border shadow-sm transition-all duration-200 ${isPaid ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {isPaid ? <CheckCircle2 className="text-emerald-500" size={24}/> : <CircleDashed className="text-slate-300 dark:text-slate-600" size={24}/>}
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{debt.personName}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{debt.note}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteDebt(debt.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 cursor-pointer transition-colors"><Trash2 size={16}/></button>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-slate-500 dark:text-slate-400">Terkumpul: Rp {debt.paidAmount.toLocaleString('id-ID')}</span>
                    <span className="text-slate-800 dark:text-slate-200">Total: Rp {debt.amount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${isPaid ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>

                {!isPaid && payingDebtId !== debt.id && (
                  <button onClick={() => setPayingDebtId(debt.id)} className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
                    Catat Pembayaran / Cicilan
                  </button>
                )}

                {payingDebtId === debt.id && (
                  <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-center">Form Pembayaran</p>
                    <input type="number" placeholder="Nominal Bayar (Rp)" className="w-full p-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs outline-blue-500 font-bold text-slate-700 dark:text-slate-100" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                    <div className="relative">
                      <Wallet className="absolute left-3 top-3.5 text-slate-400" size={16}/>
                      <select className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold outline-blue-500 appearance-none text-slate-700 dark:text-slate-200 cursor-pointer" value={payAccountId} onChange={e => setPayAccountId(e.target.value)}>
                        <option value="">Pilih Dompet...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} (Saldo: Rp {acc.balance.toLocaleString('id-ID')})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => submitPay(debt.id)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">Konfirmasi</button>
                      <button onClick={() => setPayingDebtId(null)} className="py-2.5 px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-350 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer">Batal</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}