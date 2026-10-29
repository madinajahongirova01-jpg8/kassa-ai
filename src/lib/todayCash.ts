import type { ApiCashEntry, ApiEntrySource } from "@/lib/api/types";
import { businessTime } from "@/lib/dates";
import { toDirams } from "@/lib/money";

export type TodayCashEntry = {
  id: string;
  time: string;
  title: string;
  kind: "income" | "expense";
  source: ApiEntrySource;
  amount: number;
};

export function toTodayCashEntries(items: ApiCashEntry[]): TodayCashEntry[] {
  return [...items]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((item) => ({
      id: item.id,
      time: businessTime(item.createdAt),
      title: item.title,
      kind: item.kind === "INCOME" ? "income" : "expense",
      source: item.source,
      amount: toDirams(item.amount),
    }));
}

export function signedCashAmount(entry: TodayCashEntry) {
  return entry.kind === "income" ? entry.amount : -entry.amount;
}

export function cashDaySummary(entries: TodayCashEntry[]) {
  const sum = (kind: TodayCashEntry["kind"]) => entries.filter((entry) => entry.kind === kind).reduce((total, entry) => total + entry.amount, 0);
  const income = sum("income");
  const expense = sum("expense");
  return { income, expense, profit: income - expense };
}
