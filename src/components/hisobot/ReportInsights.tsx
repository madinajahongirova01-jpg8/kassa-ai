import Link from "next/link";
import { tipTones, type ReportTipTone } from "@/data/hisobot";
import { cn } from "@/lib/cn";
import type { DebtRow } from "@/lib/debts";
import { formatSomoni } from "@/lib/format";
import { extremeDays, weekdayDate } from "@/lib/hisobot";

type Stat = { label: string; value: string; tone: string; note: string };

type Tip = { tone: ReportTipTone; title: string; body: string; href?: string };

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="min-w-0 rounded-tile border-[1.5px] border-ink bg-card px-3 py-3 lg:px-3.5">
      <div className="text-xs text-ink-2">{stat.label}</div>
      <div className={cn("mt-1.5 font-display text-base font-bold lg:text-lg", stat.tone)}>{stat.value}</div>
      <div className="mt-0.5 text-xs text-ink-2 lg:truncate">{stat.note}</div>
    </div>
  );
}

function TipNote({ tip }: { tip: Tip }) {
  const tone = tipTones[tip.tone];
  const body = (
    <>
      <span className={cn("font-hand text-2xl leading-[1.15] font-semibold", tone.title)}>{tip.title}</span>
      <span className={cn("text-[13px]", tone.body)}>{tip.body}</span>
    </>
  );
  const className = cn("flex min-h-[120px] flex-col gap-1.5 px-4 pt-4 pb-3.5 shadow-paper lg:min-h-0", tone.paper, tone.rotate);
  return tip.href ? (
    <Link href={tip.href} className={cn(className, "hover:text-ink")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

type ReportInsightsProps = {
  debtReturn: { given: number; returned: number; percent: number };
  overdue: DebtRow | undefined;
};

export function ReportInsights({ debtReturn, overdue }: ReportInsightsProps) {
  const { best, worst } = extremeDays();
  const stats: Stat[] = [
    { label: "Беҳтарин рӯз", value: formatSomoni(best.total, { sign: true, unit: false }), tone: "text-green", note: weekdayDate(best.date) },
    { label: "Сусттарин рӯз", value: formatSomoni(worst.total, { sign: true, unit: false }), tone: "text-red", note: weekdayDate(worst.date) },
    {
      label: "Насия баргашт",
      value: `${debtReturn.percent}%`,
      tone: "text-pen",
      note: `${formatSomoni(debtReturn.returned, { unit: false })} аз ${formatSomoni(debtReturn.given, { unit: false })}`,
    },
  ];
  const bestWeekday = weekdayDate(best.date).split(",")[0];
  const tips: Tip[] = [
    { tone: "yellow", title: "Роҳкиро 2 баробар зиёд шуд.", body: "Ордро як бор дар ҳафта якҷоя харед — моҳе ~400 смн сарфа." },
    ...(overdue?.customer.dueDate
      ? [
          {
            tone: "red" as const,
            title: `${overdue.customer.name.split(" ")[0]} ${Math.abs(overdue.daysLeft ?? 0)} рӯз дер кард.`,
            body: "Ёдраскунии мулоим фиристед — бо як тугма.",
            href: "/app/debts",
          },
        ]
      : []),
    { tone: "blue", title: `${bestWeekday}ҳо фурӯш бештар.`, body: "Он рӯз мол бештар тайёр кунед." },
    { tone: "green", title: "Офарин! Рекорди нав.", body: "Фоидаи май — беҳтарин дар ним сол." },
  ];

  return (
    <section className="flex min-w-0 flex-col gap-4 lg:min-h-0">
      <div className="grid grid-cols-3 gap-2.5 lg:gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <h2 className="mt-1 font-display text-base font-bold">Маслиҳатҳои Kassa AI</h2>
      <div className="grid grid-cols-1 gap-x-3.5 gap-y-4 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:auto-rows-fr">
        {tips.map((tip) => (
          <TipNote key={tip.title} tip={tip} />
        ))}
      </div>
    </section>
  );
}
