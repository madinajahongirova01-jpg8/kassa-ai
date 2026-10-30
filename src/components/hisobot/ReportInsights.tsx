import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";
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

function dayStat(label: string, day: DayStat | null, tone: string, missing: string, locale: Locale): Stat {
  if (!day) return { label, value: "—", tone: "text-ink-3", note: missing };
  return { label, value: formatMoney(day.profit, { sign: true, unit: false, locale }), tone, note: weekdayDate(day.date, locale) };
}

type ReportInsightsProps = {
  best: DayStat | null;
  worst: DayStat | null;
  debtGiven: number;
  debtReturned: number;
};

export function ReportInsights({ best, worst, debtGiven, debtReturned }: ReportInsightsProps) {
  const t = useT();
  const locale = useLocale();
  const stats: Stat[] = [
    dayStat(t("report.insights.best"), best, "text-green", t("report.insights.noEntries"), locale),
    dayStat(t("report.insights.worst"), worst, "text-red", best ? t("report.insights.fewDays") : t("report.insights.noEntries"), locale),
    {
      label: t("report.insights.debtReturned"),
      value: formatMoney(debtReturned, { unit: false, locale }),
      tone: debtReturned > 0 ? "text-pen" : "text-ink-3",
      note: t("report.insights.debtGiven", { amount: formatMoney(debtGiven, { unit: false, locale }) }),
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
