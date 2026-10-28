import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { expenseShares, monthFlow, weekFlow } from "@/data/overview";

export function FlowChartCard() {
  return (
    <Card>
      <CardHeader
        className="pb-space-lg"
        title="Даромад ва Хароҷот дар ин моҳ"
        subtitle="Муқоисаи ҳаррӯза аз 1 то 24 Майи соли ҷорӣ"
        action={
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-primary" />
              <span className="font-body-sm text-body-sm font-medium text-on-surface">Даромад</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-error/70" />
              <span className="font-body-sm text-body-sm font-medium text-on-surface">Хароҷот</span>
            </div>
          </div>
        }
      />
      <IncomeExpenseChart data={monthFlow} />
    </Card>
  );
}

export function FlowChartCompact() {
  return (
    <section className="rounded-xl bg-surface-container-lowest p-space-md shadow-[0_2px_8px_rgba(15,42,35,0.04)]">
      <div className="mb-space-sm flex items-center justify-between">
        <span className="font-headline-sm text-body-md font-bold text-on-surface">Даромад ва Хароҷот</span>
        <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-caps text-label-caps text-on-surface-variant">
          7 рӯзи охир
        </span>
      </div>
      <IncomeExpenseChart data={weekFlow} compact />
      <div className="mt-space-sm flex flex-wrap gap-1.5 border-t border-surface-container pt-space-sm">
        {expenseShares.map((share) => (
          <span
            key={share.label}
            className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-medium text-on-surface"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: share.color }} />
            <span>
              {share.shortLabel}: <strong>{share.percent}%</strong>
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
