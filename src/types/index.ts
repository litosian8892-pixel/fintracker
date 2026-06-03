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
  isBusiness?: boolean;       // <--- INI YANG DICARI OLEH VERCEL (Tahap 1)
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