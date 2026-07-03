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
  currency?: string;          
  lastExchangeRate?: number;  
  isInvestment?: boolean;     
  averageBuyPrice?: number;   
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
  tTime?: string;             // FITUR BARU: JAM TRANSAKSI
  adminFee?: number;
  createdAt?: any; 
  splits?: SplitItemData[]; 
  originalAmount?: number;    
  originalCurrency?: string;  
  exchangeRate?: number;      
  receiptUrl?: string;        // FITUR BARU: URL STRUK DIGITAL (Fase 21)
}

export interface CategoryData { 
  id: string; 
  name: string; 
  type: string; 
  budgetLimit?: number; 
  expenseType?: "fixed" | "variable";
  icon?: string;
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

export interface SubscriptionData {
  id: string;
  name: string;             
  amount: number;           
  cycle: "monthly" | "yearly"; 
  nextDueDate: string;      
  accountId: string;        
  accountName: string;      
  category: string;         
  createdAt?: string;
}