// Response shapes of the NestJS API (apps/api). Amounts are somoni strings such as "150.50".

import type { PaymentMethod } from "@/data/debts";

export type ApiAmountByMethod = Record<PaymentMethod, string>;

export type ApiMe = {
  user: { id: string; email: string; name: string | null; businessName: string | null };
};

export type ApiCustomer = {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  balance: { totalAmount: string; paidAmount: string; remainingAmount: string; openDebtsCount: number };
  createdAt: string;
};

export type ApiDebtStatus = "ACTIVE" | "PARTIALLY_PAID" | "PAID";

export type ApiDebt = {
  id: string;
  customerId: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  status: ApiDebtStatus;
  description: string;
  occurredOn: string;
  dueOn: string | null;
  createdAt: string;
};

export type ApiPaymentListItem = {
  id: string;
  debtId: string;
  amount: string;
  method: PaymentMethod;
  paidOn: string;
  note: string | null;
  createdAt: string;
  debt: { id: string; description: string; occurredOn: string };
  customer: { id: string; name: string };
};

export type ApiCashKind = "INCOME" | "EXPENSE";
export type ApiCashCategory = "SALE" | "GOODS" | "SALARY" | "UTILITIES" | "TRANSPORT" | "RENT" | "OTHER";
export type ApiEntrySource = "VOICE" | "TEXT" | "PHOTO";

export type ApiCashEntry = {
  id: string;
  kind: ApiCashKind;
  category: ApiCashCategory;
  amount: string;
  title: string;
  occurredOn: string;
  source: ApiEntrySource;
  createdAt: string;
};

export type ApiPage<T> = { items: T[]; nextCursor: string | null };

export type ApiReportDay = {
  date: string;
  income: string;
  expense: string;
  profit: string;
  salesCount: number;
  debtGiven: string;
  debtReturned: string;
  debtReturnedByMethod: ApiAmountByMethod;
};

export type ApiReportSummary = {
  from: string;
  to: string;
  today: string;
  days: ApiReportDay[];
  expenseByCategory: { category: ApiCashCategory; amount: string }[];
  debtReturnedByMethod: ApiAmountByMethod;
  totals: {
    income: string;
    expense: string;
    profit: string;
    salesCount: number;
    entriesCount: number;
    debtGiven: string;
    debtReturned: string;
  };
};
