import type { DayEntry, WeekDay } from "@/data/imruz";

export function daySummary(entries: DayEntry[]) {
  const sum = (kind: DayEntry["kind"]) => entries.filter((e) => e.kind === kind).reduce((s, e) => s + e.amount, 0);
  const income = sum("income");
  const expense = sum("expense");
  return {
    income,
    expense,
    profit: income - expense,
    salesCount: entries.filter((e) => e.kind === "income").length,
    voiceCount: entries.filter((e) => e.source === "voice").length,
    textCount: entries.filter((e) => e.source === "text").length,
  };
}

export function signedAmount(entry: DayEntry) {
  return entry.kind === "expense" ? -entry.amount : entry.amount;
}

export function changeFromYesterday(week: WeekDay[]) {
  const todayIndex = week.findIndex((d) => d.today);
  const yesterday = week[todayIndex - 1];
  if (!yesterday || yesterday.profit <= 0) return null;
  return Math.round(((week[todayIndex].profit - yesterday.profit) / yesterday.profit) * 100);
}

export function bestDay(week: WeekDay[]) {
  return week.filter((d) => !d.today).reduce((best, d) => (d.profit > best.profit ? d : best));
}
