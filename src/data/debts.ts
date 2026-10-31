export type DebtEventType = "debt" | "payment";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

export const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER"];

export type AmountByMethod = Record<PaymentMethod, number>;

/** Amounts are integer dirams. */
export type DebtCustomer = {
  id: string;
  name: string;
  phone: string;
  note?: string;
  /** Earliest due date among the customer's open debts. */
  dueDate: string | null;
  /** Remaining amount the customer owes, as calculated by the API. */
  balance: number;
  /** Amount of the newest debt, shown crossed out once everything is paid. */
  lastDebtAmount: number;
};

export type DebtEvent = {
  id: string;
  customerId: string;
  type: DebtEventType;
  note: string;
  /** Positive for a debt, negative for a payment. */
  amount: number;
  date: string;
  time: string;
  method?: PaymentMethod;
};

export type DebtBook = {
  today: string;
  businessName: string | null;
  customers: DebtCustomer[];
  events: DebtEvent[];
};
