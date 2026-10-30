export type ReportPeriod = "week" | "month" | "year";

export type ReportBar = { label: string; value: number; current?: boolean };

export const reportPeriods: { id: ReportPeriod; label: string }[] = [
  { id: "week", label: "Ҳафта" },
  { id: "month", label: "Моҳ" },
  { id: "year", label: "Сол" },
];
