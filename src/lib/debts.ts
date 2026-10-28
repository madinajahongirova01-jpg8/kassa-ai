import { debtsToday, type DebtCustomer, type DebtEvent } from "@/data/debts";
import { formatLedgerDate } from "@/lib/ledger";

export type DebtStatus = "overdue" | "near" | "active" | "paid";
export type StatusFilter = "all" | "near" | "overdue" | "paid";

const DAY = 24 * 60 * 60 * 1000;
const NEAR_DAYS = 2;

export function daysUntil(date: string) {
  return Math.round((Date.parse(date) - Date.parse(debtsToday)) / DAY);
}

export function dayMonth(date: string) {
  return date === debtsToday ? "имрӯз" : formatLedgerDate(date, false).toLowerCase();
}

export function customerBalance(customerId: string, events: DebtEvent[]) {
  return events.filter((e) => e.customerId === customerId).reduce((sum, e) => sum + e.amount, 0);
}

export function debtStatus(customer: DebtCustomer, balance: number): DebtStatus {
  if (balance <= 0 || !customer.dueDate) return "paid";
  const days = daysUntil(customer.dueDate);
  if (days < 0) return "overdue";
  if (days <= NEAR_DAYS) return "near";
  return "active";
}

export function matchesStatus(status: DebtStatus, filter: StatusFilter) {
  return filter === "all" || status === filter;
}

export function matchesQuery(customer: DebtCustomer, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    customer.name.toLowerCase().includes(q) ||
    (digits.length > 0 && customer.phone.replace(/\D/g, "").includes(digits))
  );
}

export type DebtRow = {
  customer: DebtCustomer;
  balance: number;
  status: DebtStatus;
  history: DebtEvent[];
  originalAmount: number;
};

export function buildDebtRows(customers: DebtCustomer[], events: DebtEvent[]): DebtRow[] {
  return customers.map((customer) => {
    const history = events.filter((e) => e.customerId === customer.id).sort((a, b) => a.date.localeCompare(b.date));
    const balance = customerBalance(customer.id, events);
    const lastDebt = history.findLast((e) => e.type === "debt");
    return { customer, balance, status: debtStatus(customer, balance), history, originalAmount: lastDebt?.amount ?? 0 };
  });
}

export function lastPayment(row: DebtRow) {
  return row.history.findLast((e) => e.type === "payment") ?? null;
}

export function debtTotals(rows: DebtRow[]) {
  const debtors = rows.filter((r) => r.balance > 0);
  const overdueRows = rows.filter((r) => r.status === "overdue");
  return {
    total: debtors.reduce((sum, r) => sum + r.balance, 0),
    debtorCount: debtors.length,
    overdue: overdueRows.reduce((sum, r) => sum + r.balance, 0),
    overdueCount: overdueRows.length,
  };
}

export function statusCounts(rows: DebtRow[]): Record<StatusFilter, number> {
  const count = (status: DebtStatus) => rows.filter((r) => r.status === status).length;
  return { all: rows.length, near: count("near"), overdue: count("overdue"), paid: count("paid") };
}
