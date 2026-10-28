import { debtsToday, type DebtCustomer, type DebtEvent } from "@/data/debts";
import { formatLedgerDate } from "@/lib/ledger";
import { formatNumber } from "@/lib/format";

export type DebtStatus = "overdue" | "near" | "active" | "paid";
export type StatusFilter = "all" | "active" | "near" | "overdue" | "paid";
export type DebtSort = "due" | "amount" | "name";

const DAY = 24 * 60 * 60 * 1000;
const NEAR_DAYS = 4;

export function daysUntil(date: string) {
  return Math.round((Date.parse(date) - Date.parse(debtsToday)) / DAY);
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

export function dueLabel(customer: DebtCustomer, balance: number) {
  const status = debtStatus(customer, balance);
  if (status === "paid" || !customer.dueDate) return "Пардохт шуд";
  const days = daysUntil(customer.dueDate);
  if (days < 0) return `${Math.abs(days)} рӯз гузашт`;
  if (days === 0) return "Мӯҳлат: Имрӯз";
  if (days === 1) return "Мӯҳлат: Фардо";
  return `Мӯҳлат: ${formatLedgerDate(customer.dueDate, false)}`;
}

export function dueHeadline(customer: DebtCustomer, balance: number) {
  const status = debtStatus(customer, balance);
  if (status === "paid" || !customer.dueDate) return "Қарз нест";
  const days = daysUntil(customer.dueDate);
  if (days < 0) return `${Math.abs(days)} рӯз гузашт`;
  if (days === 0) return "Имрӯз пардохт";
  if (days === 1) return "Фардо пардохт";
  return `То ${formatLedgerDate(customer.dueDate, false)}`;
}

export function isUrgent(customer: DebtCustomer, balance: number) {
  if (!customer.dueDate || balance <= 0) return false;
  const days = daysUntil(customer.dueDate);
  return days >= 0 && days <= 1;
}

export function matchesStatus(status: DebtStatus, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "active") return status !== "paid";
  return status === filter;
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

const statusOrder: Record<DebtStatus, number> = { overdue: 0, near: 1, active: 2, paid: 3 };

export function sortCustomers<T extends { customer: DebtCustomer; balance: number; status: DebtStatus }>(rows: T[], sort: DebtSort) {
  return [...rows].sort((a, b) => {
    if (sort === "amount") return b.balance - a.balance;
    if (sort === "name") return a.customer.name.localeCompare(b.customer.name, "ru");
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return (a.customer.dueDate ?? "9999").localeCompare(b.customer.dueDate ?? "9999");
  });
}

export function paymentsInMonth(events: DebtEvent[], month: string) {
  return events.filter((e) => e.type === "payment" && e.date.startsWith(month)).reduce((sum, e) => sum - e.amount, 0);
}

export function reminderText(customer: DebtCustomer, balance: number, business: string) {
  const firstName = customer.name.split(" ")[0];
  const due = customer.dueDate ? ` то ${formatLedgerDate(customer.dueDate, false)}` : "";
  return `Салом ${firstName}, ёдовар мешавем, ки қарзи шумо дар «${business}» ${formatNumber(balance)} смн${due} мебошад. Ташаккур!`;
}

export function customersToCsv(rows: { customer: DebtCustomer; balance: number; label: string }[]) {
  const header = ["Ном", "Телефон", "Қарз (смн)", "Ҳолат", "Мӯҳлат", "Лимит (смн)"];
  const body = rows.map(({ customer, balance, label }) => [
    customer.name,
    customer.phone,
    String(balance),
    label,
    customer.dueDate ?? "",
    String(customer.limit),
  ]);
  return [header, ...body].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\r\n");
}

export function downloadCsv(content: string, fileName: string) {
  const blob = new Blob(["﻿", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
