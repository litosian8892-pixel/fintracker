export interface AccountData { 
  id: string; 
  name: string; 
  balance: number; 
  type: string; 
  logo?: string; 
  order?: number; 
  isSavings?: boolean; 
  targetBalance?: number; 
  excludeFromTotal?: boolean; 
  isBusiness?: boolean;
  savingsGoalTitle?: string;  
}

export interface SplitItemData {
  category: string;
  amount: number;
  note?: string;
}

export interface TransactionData { 
  id: string; 
  amount: number; 
  type: string; 
  accountId: string; 
  toAccountId?: string; 
  accountName: string; 
  toAccountName?: string; 
  note: string; 
  category: string; 
  tDate: string; 
  adminFee?: number;
  createdAt?: any; 
  splits?: SplitItemData[]; 
}

export interface CategoryData { 
  id: string; 
  name: string; 
  type: string; 
  budgetLimit?: number; 
  expenseType?: "fixed" | "variable";
}

export interface WalletTypeData { 
  id: string; 
  name: string; 
  order: number; 
}

export interface DebtData {
  id: string; 
  type: "debt" | "receivable"; 
  personName: string; 
  amount: number; 
  paidAmount: number; 
  status: "active" | "paid"; 
  note: string; 
  dueDate?: string; 
  createdAt?: string;
}

// --- BARU: STRUKTUR DATA UNTUK LANGGANAN (SUBSCRIPTIONS) ---
export interface SubscriptionData {
  id: string;
  name: string;             // Nama layanan (Netflix, Spotify, Kosan)
  amount: number;           // Nominal tagihan
  cycle: "monthly" | "yearly"; // Siklus penagihan
  nextDueDate: string;      // Tanggal jatuh tempo berikutnya (YYYY-MM-DD)
  accountId: string;        // ID Dompet yang akan dipotong
  accountName: string;      // Nama dompet (untuk UI)
  category: string;         // Kategori pengeluaran (misal: Tagihan Bulanan)
  createdAt?: string;
}