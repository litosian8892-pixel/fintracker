export interface AccountData { 
  id: string; name: string; balance: number; type: string; logo?: string; order?: number; 
}

export interface TransactionData { 
  id: string; amount: number; type: string; accountId: string; toAccountId?: string; accountName: string; toAccountName?: string; note: string; category: string; tDate: string; 
}

export interface CategoryData { 
  id: string; name: string; type: string; budgetLimit?: number; 
}

export interface WalletTypeData { 
  id: string; name: string; order: number; 
}

// INI STRUKTUR DATA BARU UNTUK UTANG/PIUTANG
export interface DebtData {
  id: string;
  type: "debt" | "receivable"; // debt = kita ngutang, receivable = orang ngutang ke kita
  personName: string;
  amount: number;
  paidAmount: number;
  status: "active" | "paid";
  note: string;
  createdAt?: string;
}