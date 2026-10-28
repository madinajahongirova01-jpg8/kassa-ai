"use client";

import { Card } from "@/components/daftar/Card";
import { formatSomoni } from "@/lib/format";
import { useDebtOverview } from "@/lib/useDebtOverview";
import { cn } from "@/lib/cn";

type TodayStatsProps = {
  income: number;
  expense: number;
  salesCount: number;
  expenseHint: string;
};

export function TodayStats({ income, expense, salesCount, expenseHint }: TodayStatsProps) {
  const { totals } = useDebtOverview();
  const stats = [
    { label: "Пул даромад", value: formatSomoni(income, { sign: true, unit: false }), note: `${salesCount} фурӯш`, tone: "text-green" },
    { label: "Пул рафт", value: formatSomoni(-expense, { unit: false }), note: expenseHint, tone: "text-red" },
    { label: "Ба шумо қарздоранд", value: formatSomoni(totals.total, { unit: false }), note: `${totals.debtorCount} нафар`, tone: "text-pen" },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="rounded-card px-[18px] py-4">
          <div className="text-[13px] font-medium text-ink-2">{stat.label}</div>
          <div className={cn("mt-2 font-display text-[26px] font-bold", stat.tone)}>{stat.value}</div>
          <div className="mt-1 text-xs text-ink-2">{stat.note}</div>
        </Card>
      ))}
    </div>
  );
}

export function TodayStatsMobile({ income, expense }: Pick<TodayStatsProps, "income" | "expense">) {
  const { totals } = useDebtOverview();
  const stats = [
    { label: "Даромад", value: formatSomoni(income, { sign: true, unit: false }), tone: "text-green" },
    { label: "Рафт", value: formatSomoni(-expense, { unit: false }), tone: "text-red" },
    { label: "Қарздоранд", value: formatSomoni(totals.total, { unit: false }), tone: "text-pen" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((stat) => (
        <Card key={stat.label} shadow="sm" className="min-w-0 rounded-tile p-2.5">
          <div className="text-[11px] text-ink-2">{stat.label}</div>
          <div className={cn("mt-1 font-display text-base font-bold", stat.tone)}>{stat.value}</div>
        </Card>
      ))}
    </div>
  );
}
