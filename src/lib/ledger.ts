import { categories, periods, sources, type EntryCategory, type EntrySource, type LedgerEntry, type PeriodId } from "@/data/transactions";

export type KindFilter = "all" | "income" | "expense" | "debt";
export type SortOrder = "newest" | "oldest" | "amount";

export type LedgerFilters = {
  query: string;
  period: PeriodId;
  kind: KindFilter;
  category: EntryCategory | "all";
  source: EntrySource | "all";
  sort: SortOrder;
};

export const defaultFilters: LedgerFilters = {
  query: "",
  period: "today",
  kind: "all",
  category: "all",
  source: "all",
  sort: "newest",
};

const months = ["Январ", "Феврал", "Март", "Апрел", "Май", "Июн", "Июл", "Август", "Сентябр", "Октябр", "Ноябр", "Декабр"];

export function formatLedgerDate(date: string, withYear = true) {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${months[month - 1]}${withYear ? `, ${year}` : ""}`;
}

function matchesQuery(entry: LedgerEntry, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/[\s ]/g, "");
  const haystack = [entry.title, entry.shortTitle, entry.description, categories[entry.category].label, entry.author.name, `#${entry.id}`]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q) || (/^\d+$/.test(digits) && String(Math.abs(entry.amount)).includes(digits));
}

function matchesKind(entry: LedgerEntry, kind: KindFilter) {
  if (kind === "income") return entry.amount > 0;
  if (kind === "expense") return entry.amount < 0;
  if (kind === "debt") return entry.category === "debt";
  return true;
}

export function inPeriod(entry: LedgerEntry, period: PeriodId) {
  const range = periods.find((p) => p.id === period) ?? periods[0];
  return entry.date >= range.from && entry.date <= range.to;
}

export function filterEntries(entries: LedgerEntry[], filters: LedgerFilters) {
  const result = entries.filter(
    (entry) =>
      inPeriod(entry, filters.period) &&
      matchesKind(entry, filters.kind) &&
      (filters.category === "all" || entry.category === filters.category) &&
      (filters.source === "all" || entry.source === filters.source) &&
      matchesQuery(entry, filters.query),
  );
  const stamp = (e: LedgerEntry) => `${e.date} ${e.time}`;
  return result.sort((a, b) => {
    if (filters.sort === "oldest") return stamp(a).localeCompare(stamp(b));
    if (filters.sort === "amount") return Math.abs(b.amount) - Math.abs(a.amount);
    return stamp(b).localeCompare(stamp(a));
  });
}

export function summarize(entries: LedgerEntry[]) {
  const income = entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0);
  const expenseCount = entries.filter((e) => e.amount < 0).length;
  const scored = entries.filter((e) => e.aiConfidence !== undefined);
  const accuracy = scored.length ? scored.reduce((s, e) => s + (e.aiConfidence ?? 0), 0) / scored.length : null;
  const turnover = entries.reduce((s, e) => s + Math.abs(e.amount), 0);
  return { income, expense, net: income + expense, expenseCount, accuracy, turnover };
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function previousPeriod(period: PeriodId): PeriodId | null {
  if (period === "today") return "yesterday";
  return null;
}

export function entriesToCsv(entries: LedgerEntry[]) {
  const header = ["ID", "Сана", "Вақт", "Тавсиф", "Категория", "Сарчашма", "Маблағ (смн)", "Муаллиф"];
  const rows = entries.map((e) => [
    e.id,
    e.date,
    e.time,
    e.title,
    categories[e.category].label,
    sources[e.source].label,
    String(e.amount),
    e.author.name,
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\r\n");
}
