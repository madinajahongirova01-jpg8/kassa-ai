import { PAYMENT_METHODS, type AmountByMethod } from "@/data/debts";
import type { ReportBar, ReportPeriod } from "@/data/hisobot";
import type { ApiAmountByMethod, ApiReportSummary } from "@/lib/api/types";
import { addDays, monthKey, monthStart, weekdayIndex } from "@/lib/dates";
import { formatDayMonth, formatMoney, monthName, weekdayName } from "@/lib/format";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createPlural, createT } from "@/lib/i18n/translate";
import { DIRAMS_PER_SOMONI, toDirams } from "@/lib/money";

export type ReportDay = {
  date: string;
  income: number;
  expense: number;
  profit: number;
  debtGiven: number;
  debtReturned: number;
  debtReturnedByMethod: AmountByMethod;
  hasCash: boolean;
};

export type ReportData = { today: string; days: ReportDay[] };

export type ReportApi = { get: <T>(path: string) => Promise<T> };

export type DayStat = { date: string; profit: number };

export type PeriodReport = {
  period: ReportPeriod;
  from: string;
  to: string;
  lead: string;
  income: number;
  expense: number;
  profit: number;
  hasCash: boolean;
  note: string | null;
  chartTitle: string;
  chartNote: string;
  bars: ReportBar[];
  best: DayStat | null;
  worst: DayStat | null;
  debtGiven: number;
  debtReturned: number;
  debtReturnedByMethod: AmountByMethod;
  days: ReportDay[];
};

const MONTHS_BACK = 11;
const CHART_MONTHS = 6;

export function reportRange(today: string): { from: string; to: string } {
  return { from: monthStart(today, -MONTHS_BACK), to: today };
}

function methodDirams(amounts: ApiAmountByMethod): AmountByMethod {
  return { CASH: toDirams(amounts.CASH), CARD: toDirams(amounts.CARD), TRANSFER: toDirams(amounts.TRANSFER) };
}

export function sumByMethod(days: ReportDay[]): AmountByMethod {
  const sums: AmountByMethod = { CASH: 0, CARD: 0, TRANSFER: 0 };
  for (const day of days) {
    for (const method of PAYMENT_METHODS) sums[method] += day.debtReturnedByMethod[method];
  }
  return sums;
}

export function toReportDays(summary: ApiReportSummary): ReportDay[] {
  return summary.days.map((day) => {
    const income = toDirams(day.income);
    const expense = toDirams(day.expense);
    return {
      date: day.date,
      income,
      expense,
      profit: income - expense,
      debtGiven: toDirams(day.debtGiven),
      debtReturned: toDirams(day.debtReturned),
      debtReturnedByMethod: methodDirams(day.debtReturnedByMethod),
      hasCash: income > 0 || expense > 0,
    };
  });
}

export async function fetchReportData(today: string, api: ReportApi): Promise<ReportData> {
  const { from, to } = reportRange(today);
  const summary = await api.get<ApiReportSummary>(`/reports/summary?${new URLSearchParams({ from, to })}`);
  return { today: summary.today, days: toReportDays(summary) };
}

export function periodRange(period: ReportPeriod, today: string): { from: string; to: string } {
  if (period === "week") return { from: addDays(today, -6), to: today };
  if (period === "month") return { from: monthStart(today), to: today };
  return { from: `${today.slice(0, 4)}-01-01`, to: today };
}

function sumOf(days: ReportDay[], pick: (day: ReportDay) => number) {
  return days.reduce((total, day) => total + pick(day), 0);
}

export function periodTotals(days: ReportDay[]) {
  const income = sumOf(days, (day) => day.income);
  const expense = sumOf(days, (day) => day.expense);
  return { income, expense, profit: income - expense };
}

export function extremeDays(days: ReportDay[]): { best: DayStat | null; worst: DayStat | null } {
  const cashDays = days.filter((day) => day.hasCash);
  if (cashDays.length === 0) return { best: null, worst: null };
  const best = cashDays.reduce((a, b) => (b.profit > a.profit ? b : a));
  const worst = cashDays.reduce((a, b) => (b.profit < a.profit ? b : a));
  return {
    best: { date: best.date, profit: best.profit },
    worst: cashDays.length > 1 ? { date: worst.date, profit: worst.profit } : null,
  };
}

export function shortMonth(month: string, locale: Locale = DEFAULT_LOCALE) {
  const name = monthWord(month, locale);
  return `${name.charAt(0).toUpperCase()}${name.slice(1, 3)}`;
}

export function weekdayDate(date: string, locale: Locale = DEFAULT_LOCALE) {
  const name = weekdayName(weekdayIndex(date), locale);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}, ${formatDayMonth(date, locale)}`;
}

export function weekBars(days: ReportDay[], today: string, locale: Locale = DEFAULT_LOCALE): ReportBar[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const profit = days.filter((day) => day.date === date).reduce((total, day) => total + day.profit, 0);
    return { label: weekdayName(weekdayIndex(date), locale, "short"), value: profit, current: date === today };
  });
}

export function monthBars(days: ReportDay[], months: string[], locale: Locale = DEFAULT_LOCALE): ReportBar[] {
  const current = months[months.length - 1];
  const withCash = months.filter((month) => days.some((day) => day.hasCash && monthKey(day.date) === month));
  if (withCash.length === 0) return [];
  return months.slice(months.indexOf(withCash[0])).map((month) => ({
    label: shortMonth(month, locale),
    value: periodTotals(days.filter((day) => monthKey(day.date) === month)).profit,
    current: month === current,
  }));
}

function monthsBack(today: string, count: number) {
  return Array.from({ length: count }, (_, index) => monthKey(monthStart(today, index - count + 1)));
}

function monthsOfYear(today: string) {
  return monthsBack(today, Number(today.slice(5, 7)));
}

function monthWord(month: string, locale: Locale) {
  return monthName(Number(month.slice(5, 7)) - 1, locale) ?? month;
}

function monthNote(days: ReportDay[], today: string, profit: number, locale: Locale): string | null {
  const t = createT(locale);
  const previous = monthKey(monthStart(today, -1));
  const previousDays = days.filter((day) => monthKey(day.date) === previous);
  if (!previousDays.some((day) => day.hasCash)) return null;
  const diff = profit - periodTotals(previousDays).profit;
  const month = monthWord(previous, locale);
  if (diff === 0) return t("report.compare.same", { month });
  const amount = formatMoney(Math.abs(diff), { unit: false, locale });
  return t(diff > 0 ? "report.compare.more" : "report.compare.less", { month, amount });
}

export function buildPeriodReport(data: ReportData, period: ReportPeriod, locale: Locale = DEFAULT_LOCALE): PeriodReport {
  const t = createT(locale);
  const plural = createPlural(locale);
  const { today } = data;
  const year = today.slice(0, 4);
  const range = periodRange(period, today);
  const days = data.days.filter((day) => day.date >= range.from && day.date <= range.to);
  const totals = periodTotals(days);
  const hasCash = days.some((day) => day.hasCash);
  const { best, worst } = extremeDays(days);
  const common = {
    period,
    ...range,
    ...totals,
    hasCash,
    best,
    worst,
    debtGiven: sumOf(days, (day) => day.debtGiven),
    debtReturned: sumOf(days, (day) => day.debtReturned),
    debtReturnedByMethod: sumByMethod(days),
    days,
  };

  if (period === "week") {
    return {
      ...common,
      lead: t("report.lead.week"),
      note: null,
      chartTitle: t("report.chart.daily"),
      chartNote: best ? t("report.chart.bestDay", { day: weekdayName(weekdayIndex(best.date), locale) }) : t("report.chart.lastWeek"),
      bars: hasCash ? weekBars(days, today, locale) : [],
    };
  }

  if (period === "year") {
    const bars = monthBars(data.days, monthsOfYear(today), locale);
    return {
      ...common,
      lead: t("report.lead.year", { year }),
      note: null,
      chartTitle: t("report.chart.monthly"),
      chartNote: bars.length > 0 ? plural("report.chart.yearMonths", bars.length) : t("report.chart.year", { year }),
      bars,
    };
  }

  const bars = monthBars(data.days, monthsBack(today, CHART_MONTHS), locale);
  return {
    ...common,
    lead: t("report.lead.month", { month: monthWord(monthKey(today), locale) }),
    note: hasCash ? monthNote(data.days, today, totals.profit, locale) : null,
    chartTitle: t("report.chart.monthly"),
    chartNote: bars.length > 0 ? plural("report.chart.lastMonths", bars.length) : t("report.chart.recentMonths"),
    bars,
  };
}

export function reportCsv(report: PeriodReport, locale: Locale = DEFAULT_LOCALE): string {
  const t = createT(locale);
  const money = (dirams: number) => {
    const absolute = Math.abs(dirams);
    return `${dirams < 0 ? "-" : ""}${Math.floor(absolute / DIRAMS_PER_SOMONI)}.${String(absolute % DIRAMS_PER_SOMONI).padStart(2, "0")}`;
  };
  const rows = [
    [
      t("report.csv.date"),
      t("report.csv.income"),
      t("report.csv.expense"),
      t("report.csv.profit"),
      t("report.csv.debtGiven"),
      t("report.csv.debtReturned"),
    ],
    ...report.days.map((day) => [day.date, money(day.income), money(day.expense), money(day.profit), money(day.debtGiven), money(day.debtReturned)]),
    [t("report.csv.total"), money(report.income), money(report.expense), money(report.profit), money(report.debtGiven), money(report.debtReturned)],
  ];
  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")).join("\r\n");
}

export function reportFileName(report: PeriodReport) {
  return `kassa-hisobot-${report.from}-${report.to}.csv`;
}
