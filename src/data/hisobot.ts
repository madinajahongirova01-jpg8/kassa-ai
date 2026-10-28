import { weekProfit } from "@/data/imruz";

export type ReportPeriod = "week" | "month" | "year";

export type ReportBar = { label: string; value: number; current?: boolean };

export const reportPeriods: { id: ReportPeriod; label: string }[] = [
  { id: "week", label: "Ҳафта" },
  { id: "month", label: "Моҳ" },
  { id: "year", label: "Сол" },
];

export const monthlyProfit: ReportBar[] = [
  { label: "Дек", value: 9800 },
  { label: "Янв", value: 11200 },
  { label: "Фев", value: 10400 },
  { label: "Мар", value: 12900 },
  { label: "Апр", value: 13600 },
  { label: "Май", value: 17400, current: true },
];

export const weeklyProfit: ReportBar[] = weekProfit.map((day) => ({ label: day.short, value: day.profit, current: day.today }));

export type ReportTipTone = "yellow" | "red" | "blue" | "green";

export const tipTones: Record<ReportTipTone, { paper: string; title: string; body: string; rotate: string }> = {
  yellow: { paper: "bg-[#fff3a8]", title: "text-ink", body: "text-[#4a4416]", rotate: "-rotate-2" },
  red: { paper: "bg-[#ffe0dc]", title: "text-[#8a2a22]", body: "text-[#6b2a22]", rotate: "rotate-[1.5deg]" },
  blue: { paper: "bg-[#dcebff]", title: "text-[#1d3a9e]", body: "text-[#24345e]", rotate: "rotate-1" },
  green: { paper: "bg-[#ddf5e8]", title: "text-[#126645]", body: "text-[#1e4a36]", rotate: "-rotate-[1.2deg]" },
};
