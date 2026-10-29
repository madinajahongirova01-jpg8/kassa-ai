import { daftarCategories, ledgerStart, type DaftarEntry } from "@/data/daftar";
import { debtsToday, type DebtCustomer, type DebtEvent } from "@/data/debts";
import { daysUntil } from "@/lib/debts";
import { formatDayMonth, formatSomoni } from "@/lib/format";

export type DaftarFilter = "all" | "income" | "expense" | "debt";

export function debtLedgerEntries(customers: DebtCustomer[], events: DebtEvent[]): DaftarEntry[] {
  return events
    .filter((event) => event.date >= ledgerStart)
    .map((event) => {
      const name = customers.find((c) => c.id === event.customerId)?.name.split(" ")[0] ?? "Муштарӣ";
      const paid = event.type === "payment";
      return {
        id: `n-${event.id}`,
        date: event.date,
        time: event.time,
        title: paid ? `${name} қарзашро баргардонд` : `${name} — насия`,
        category: "debt",
        source: event.tag === "Дастӣ" ? "text" : "voice",
        kind: paid ? "debtPaid" : "debtGiven",
        amount: Math.abs(event.amount),
      };
    });
}

export function matchesFilter(entry: DaftarEntry, filter: DaftarFilter) {
  if (filter === "all") return true;
  if (filter === "debt") return entry.category === "debt";
  return entry.kind === filter;
}

export function matchesQuery(entry: DaftarEntry, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${entry.title} ${daftarCategories[entry.category]} ${entry.amount}`.toLowerCase().includes(q);
}

/** Debt rows move no profit: lending is not a cost, repayment is not a sale. */
export function entryProfit(entry: DaftarEntry) {
  if (entry.kind === "income") return entry.amount;
  if (entry.kind === "expense") return -entry.amount;
  return 0;
}

export function entryAmountText(entry: DaftarEntry) {
  if (entry.kind === "debtGiven") return formatSomoni(entry.amount, { unit: false });
  const sign = entry.kind === "expense" ? -1 : 1;
  return formatSomoni(sign * entry.amount, { sign: true, unit: false });
}

export function dayLabel(date: string) {
  const offset = daysUntil(date, debtsToday);
  if (offset === 0) return `Имрӯз, ${formatDayMonth(date)}`;
  if (offset === -1) return `Дирӯз, ${formatDayMonth(date)}`;
  return formatDayMonth(date);
}

export type DaftarDay = { date: string; entries: DaftarEntry[]; total: number };

/** Groups the visible entries; a day total always counts every entry of that day. */
export function groupByDay(entries: DaftarEntry[], allEntries: DaftarEntry[] = entries): DaftarDay[] {
  const days = new Map<string, DaftarEntry[]>();
  for (const entry of entries) days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  return [...days.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      entries: list.sort((a, b) => b.time.localeCompare(a.time)),
      total: allEntries.filter((e) => e.date === date).reduce((sum, e) => sum + entryProfit(e), 0),
    }));
}

export function downloadLedgerCsv(entries: DaftarEntry[], fileName: string) {
  const rows = [
    ["Сана", "Вақт", "Сабт", "Категория", "Маблағ"],
    ...entries.map((e) => [e.date, e.time, e.title, daftarCategories[e.category], entryAmountText(e)]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
