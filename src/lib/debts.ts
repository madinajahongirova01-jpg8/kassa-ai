import type { DebtCustomer, DebtEvent } from "@/data/debts";
import { daysBetween } from "@/lib/dates";
import { formatDayMonth } from "@/lib/format";

export type DebtStatus = "overdue" | "near" | "active" | "paid";
export type StatusFilter = "all" | "near" | "overdue" | "paid";

const NEAR_DAYS = 2;

/** Whole days from `today` to `date`; negative once the date has passed. */
export function daysUntil(date: string, today: string) {
  return daysBetween(today, date);
}

export function dayMonth(date: string, today: string) {
  return date === today ? "имрӯз" : formatDayMonth(date);
}

export function debtStatus(customer: DebtCustomer, today: string): DebtStatus {
  if (customer.balance <= 0) return "paid";
  if (!customer.dueDate) return "active";
  const days = daysUntil(customer.dueDate, today);
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
  /** Days left until the due date (negative when overdue), null without a due date. */
  daysLeft: number | null;
};

export function buildDebtRows(customers: DebtCustomer[], events: DebtEvent[], today: string): DebtRow[] {
  return customers.map((customer) => {
    const history = events
      .filter((e) => e.customerId === customer.id)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    return {
      customer,
      balance: customer.balance,
      status: debtStatus(customer, today),
      history,
      originalAmount: customer.lastDebtAmount,
      daysLeft: customer.balance > 0 && customer.dueDate ? daysUntil(customer.dueDate, today) : null,
    };
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
