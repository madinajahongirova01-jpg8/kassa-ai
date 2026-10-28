import { cashEntries } from "@/data/daftar";
import type { DebtEvent } from "@/data/debts";
import { monthlyProfit, weeklyProfit, type ReportBar, type ReportPeriod } from "@/data/hisobot";
import { weekProfit } from "@/data/imruz";
import { groupByDay } from "@/lib/daftar";
import { daysUntil } from "@/lib/debts";
import { formatDayMonth, formatSomoni } from "@/lib/format";
import { bestDay } from "@/lib/imruz";

const weekdays = ["Якшанбе", "Душанбе", "Сешанбе", "Чоршанбе", "Панҷшанбе", "Ҷумъа", "Шанбе"];
const TODAY_WEEKDAY = 3; // the demo "today", 24 May, is a Wednesday (Чоршанбе)

export function weekdayDate(date: string) {
  const index = (((TODAY_WEEKDAY + daysUntil(date)) % 7) + 7) % 7;
  return `${weekdays[index]}, ${formatDayMonth(date)}`;
}

export function extremeDays() {
  const days = groupByDay(cashEntries);
  const best = days.reduce((a, b) => (b.total > a.total ? b : a));
  const worst = days.reduce((a, b) => (b.total < a.total ? b : a));
  return { best, worst };
}

export function debtReturn(events: DebtEvent[], month: string) {
  const inMonth = events.filter((e) => e.date.startsWith(month));
  const given = inMonth.filter((e) => e.type === "debt").reduce((sum, e) => sum + e.amount, 0);
  const returned = inMonth.filter((e) => e.type === "payment").reduce((sum, e) => sum - e.amount, 0);
  return { given, returned, percent: given > 0 ? Math.round((returned / given) * 100) : 0 };
}

type PeriodReport = {
  lead: string;
  total: number;
  note: string | null;
  chartTitle: string;
  chartNote: string;
  bars: ReportBar[];
};

function best(bars: ReportBar[]) {
  return bars.reduce((a, b) => (b.value > a.value ? b : a));
}

export function periodReport(period: ReportPeriod): PeriodReport {
  if (period === "week") {
    return {
      lead: "Дар ин ҳафта шумо…",
      total: weeklyProfit.reduce((sum, b) => sum + b.value, 0),
      note: null,
      chartTitle: "Фоида рӯз ба рӯз",
      chartNote: `${bestDay(weekProfit).name} беҳтарин рӯз буд`,
      bars: weeklyProfit,
    };
  }
  if (period === "year") {
    const bars = monthlyProfit.slice(1);
    return {
      lead: "Дар соли 2024 шумо…",
      total: bars.reduce((sum, b) => sum + b.value, 0),
      note: `${best(bars).label.toLowerCase()} — беҳтарин моҳ`,
      chartTitle: "Фоида моҳ ба моҳ",
      chartNote: "панҷ моҳи сол",
      bars,
    };
  }
  const current = monthlyProfit[monthlyProfit.length - 1];
  const previous = monthlyProfit[monthlyProfit.length - 2];
  const diff = current.value - previous.value;
  return {
    lead: "Дар май шумо…",
    total: current.value,
    note: `аз апрел ${formatSomoni(Math.abs(diff), { unit: false })} ${diff >= 0 ? "зиёд" : "кам"} (${diff >= 0 ? "+" : "−"}${Math.round((Math.abs(diff) / previous.value) * 100)}%)`,
    chartTitle: "Фоида моҳ ба моҳ",
    chartNote: "қариб ҳар моҳ рушд",
    bars: monthlyProfit,
  };
}

export function downloadReportCsv(report: PeriodReport, fileName: string) {
  const csv = [["Давра", "Фоида (смн)"], ...report.bars.map((b) => [b.label, String(b.value)])]
    .map((row) => row.map((cell) => `"${cell}"`).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
