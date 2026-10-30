import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { weekdayDate, type DayStat } from "@/lib/hisobot";

type Stat = { label: string; value: string; tone: string; note: string };

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="min-w-0 rounded-tile border-[1.5px] border-ink bg-card px-3 py-3 lg:px-3.5">
      <div className="text-xs text-ink-2">{stat.label}</div>
      <div className={cn("mt-1.5 font-display text-base font-bold lg:text-lg", stat.tone)}>{stat.value}</div>
      <div className="mt-0.5 text-xs text-ink-2 lg:truncate">{stat.note}</div>
    </div>
  );
}

function dayStat(label: string, day: DayStat | null, tone: string, missing: string): Stat {
  if (!day) return { label, value: "—", tone: "text-ink-3", note: missing };
  return { label, value: formatMoney(day.profit, { sign: true, unit: false }), tone, note: weekdayDate(day.date) };
}

type ReportInsightsProps = {
  best: DayStat | null;
  worst: DayStat | null;
  debtGiven: number;
  debtReturned: number;
};

export function ReportInsights({ best, worst, debtGiven, debtReturned }: ReportInsightsProps) {
  const stats: Stat[] = [
    dayStat("Беҳтарин рӯз", best, "text-green", "ҳоло сабт нест"),
    dayStat("Сусттарин рӯз", worst, "text-red", best ? "барои муқоиса рӯзҳо кам" : "ҳоло сабт нест"),
    {
      label: "Насия баргашт",
      value: formatMoney(debtReturned, { unit: false }),
      tone: debtReturned > 0 ? "text-pen" : "text-ink-3",
      note: `насия дода шуд: ${formatMoney(debtGiven, { unit: false })}`,
    },
  ];

  return (
    <section className="flex min-w-0 flex-col gap-4 lg:min-h-0">
      <div className="grid grid-cols-3 gap-2.5 lg:gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  );
}
