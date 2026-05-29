"use client";

import React, { useEffect } from "react";
import { AccountData, CategoryData } from "../../types";
import { Wallet, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar, Tag, FileText } from "lucide-react";

interface HomeTabProps {
  tType: "income" | "expense" | "transfer";
  setTType: (type: "income" | "expense" | "transfer") => void;
  tDate: string;
  setTDate: (date: string) => void;
  tCategory: string;
  setTCategory: (cat: string) => void;
  tAccountId: string;
  setTAccountId: (id: string) => void;
  tToAccountId: string;
  setTToAccountId: (id: string) => void;
  tAmount: string;
  setTAmount: (amt: string) => void;
  tAdminFee: string;
  setTAdminFee: (fee: string) => void;
  tNote: string;
  setTNote: (note: string) => void;
  categories: CategoryData[];
  accounts: AccountData[];
  handleTransaction: () => void;
}

export default function HomeTab({
  tType,
  setTType,
  tDate,
  setTDate,
  tCategory,
  setTCategory,
  tAccountId,
  setTAccountId,
  tToAccountId,
  setTToAccountId,
  tAmount,
  setTAmount,
  tAdminFee,
  setTAdminFee,
  tNote,
  setTNote,
  categories,
  accounts,
  handleTransaction,
}: HomeTabProps) {
  
  // Aturan Koreksi Akuntansi: Sembunyikan akun tabungan (isSavings) dari pilihan pengeluaran
  const filteredAccounts = tType === "expense"
    ? accounts.filter((acc) => !acc.isSavings)
    : accounts;

  const filteredCategories = categories.filter((cat) => cat.type === tType);

  // Helper untuk memformat angka input ke Rupiah terbaca
  const formatRupiahTerbaca = (val: string) => {
    if (!val) return "Rp 0";
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parsed);
  };

  // Auto-select akun & kategori pertama jika pilihan kosong
  useEffect(() => {
    if (filteredAccounts.length > 0 && !tAccountId) {
      setTAccountId(filteredAccounts[0].id);
    }
  }, [filteredAccounts, tAccountId, setTAccountId]);

  useEffect(() => {
    if (tType === "transfer") {
      setTCategory("Transfer");
    } else {
      const matchingCats = categories.filter((cat) => cat.type === tType);
      if (matchingCats.length > 0 && !matchingCats.some(c => c.name === tCategory)) {
        setTCategory(matchingCats[0].name);
      }
    }
  }, [tType, categories, tCategory, setTCategory]);

  return (
    <div className="bg-white rounded-[30px] p-6 shadow-xl border border-slate-100">
      <h2 className="text-xl font-black text-slate-800 mb-6">Catat Transaksi</h2>

      {/* Navigasi Tipe Transaksi */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => setTType("expense")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
            tType === "expense"
              ? "bg-red-500 text-white shadow-md"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <ArrowDownRight size={14} />
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setTType("income")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
            tType === "income"
              ? "bg-emerald-500 text-white shadow-md"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <ArrowUpRight size={14} />
          Pemasukan
        </button>
        <button
          type="button"
          onClick={() => setTType("transfer")}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
            tType === "transfer"
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <ArrowRightLeft size={14} />
          Transfer
        </button>
      </div>

      <div className="space-y-4">
        {/* Input Nominal Utama */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Nominal (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
              Rp
            </span>
            <input
              type="number"
              className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-blue-500 text-slate-800"
              placeholder="0"
              value={tAmount}
              onChange={(e) => setTAmount(e.target.value)}
            />
          </div>
          {tAmount && (
            <p className="text-[10px] font-bold text-slate-400 pl-1 animate-in fade-in duration-150">
              Terbaca: <span className="text-slate-600 font-black">{formatRupiahTerbaca(tAmount)}</span>
            </p>
          )}
        </div>

        {/* Biaya Admin Tambahan (Muncul Eksklusif untuk Mode Transfer) */}
        {tType === "transfer" && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              Biaya Admin (Opsional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-blue-400">
                Rp
              </span>
              <input
                type="number"
                className="w-full pl-10 pr-4 py-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-bold outline-blue-500 text-blue-900"
                placeholder="0"
                value={tAdminFee}
                onChange={(e) => setTAdminFee(e.target.value)}
              />
            </div>
            {tAdminFee && (
              <p className="text-[10px] font-bold text-blue-400 pl-1 animate-in fade-in duration-150">
                Terbaca: <span className="text-blue-600 font-black">{formatRupiahTerbaca(tAdminFee)}</span>
              </p>
            )}
          </div>
        )}

        {/* Tanggal & Pilihan Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={10} /> Tanggal
            </label>
            <input
              type="date"
              className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 cursor-pointer"
              value={tDate}
              onChange={(e) => setTDate(e.target.value)}
            />
          </div>

          {tType !== "transfer" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Tag size={10} /> Kategori
              </label>
              <select
                className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 cursor-pointer"
                value={tCategory}
                onChange={(e) => setTCategory(e.target.value)}
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Akun Sumber / Tujuan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Wallet size={10} /> Dompet {tType === "transfer" ? "Asal" : ""}
            </label>
            <select
              className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 cursor-pointer"
              value={tAccountId}
              onChange={(e) => setTAccountId(e.target.value)}
            >
              {filteredAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Rp {acc.balance.toLocaleString("id-ID")})
                </option>
              ))}
            </select>
          </div>

          {tType === "transfer" && (
            <div className="space-y-1 animate-in fade-in slide-in-from-left-2 duration-200">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Wallet size={10} /> Dompet Tujuan
              </label>
              <select
                className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-blue-500 text-slate-800 cursor-pointer"
                value={tToAccountId}
                onChange={(e) => setTToAccountId(e.target.value)}
              >
                <option value="">Pilih Tujuan...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (Rp {acc.balance.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Catatan Transaksi */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <FileText size={10} /> Catatan
          </label>
          <input
            type="text"
            className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold outline-blue-500 text-slate-800"
            placeholder="Tulis keterangan transaksi..."
            value={tNote}
            onChange={(e) => setTNote(e.target.value)}
          />
        </div>

        {/* Tombol Eksekusi */}
        <button
          type="button"
          onClick={handleTransaction}
          className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg transition-all transform active:scale-[0.98] duration-75"
        >
          Simpan Transaksi
        </button>
      </div>
    </div>
  );
}