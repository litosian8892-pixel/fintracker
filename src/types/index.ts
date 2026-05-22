export interface AccountData { 
  id: string; 
  name: string; 
  balance: number; 
  type: string; 
  logo?: string; 
  order?: number; 
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
}

export interface CategoryData { 
  id: string; 
  name: string; 
  type: string; 
}

export interface WalletTypeData { 
  id: string; 
  name: string; 
  order: number; 
}