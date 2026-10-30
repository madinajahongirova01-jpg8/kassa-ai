import type { DaftarEntry } from "@/data/daftar";

/** Debt rows move no profit: lending is not a cost, repayment is not a sale. */
export function entryProfit(entry: DaftarEntry) {
  if (entry.kind === "income") return entry.amount;
  if (entry.kind === "expense") return -entry.amount;
  return 0;
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
