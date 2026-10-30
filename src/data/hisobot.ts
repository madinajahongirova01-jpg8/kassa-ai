export type ReportPeriod = "week" | "month" | "year";

export type ReportBar = { label: string; value: number; current?: boolean };

export const reportPeriods: ReportPeriod[] = ["week", "month", "year"];
