export type TransactionType = "sale" | "expense" | "credit_sale" | "debt_payment";

export interface ParsedTransaction {
  type: TransactionType;
  amountDiram: number;
  description: string;
  customerName: string | null;
}


export type TransactionStatus = "pending" | "confirmed" | "cancelled";

export interface StoredTransaction extends ParsedTransaction {
  id: number;
  userId: number;
  status: TransactionStatus;
}


export interface DailySummary {
  incomeDiram: number;     
  expenseDiram: number;    
  creditGivenDiram: number; 
  profitDiram: number;     
}

export interface DebtBalance {
  customerName: string;
  balanceDiram: number;
  /** Earliest due date ("YYYY-MM-DD") among the customer's unpaid debts, null when none has one. */
  dueOn: string | null;
}

export interface DebtorSummary {
  customerName: string;
  balanceDiram: number;
  isOverdue: boolean;
}