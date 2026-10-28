import { DonutChart } from "@/components/charts/DonutChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { expenseShares, expenseTotal } from "@/data/overview";
import { formatNumber, formatSomoni } from "@/lib/format";

export function ExpenseBreakdownCard() {
  const main = expenseShares[0];

  return (
    <Card>
      <CardHeader
        title="Тақсимоти хароҷот"
        subtitle="Бахшҳои асосии моҳона"
        action={
          <span className="font-body-sm text-body-sm font-bold text-primary tnum">
            Ҳамагӣ: {formatSomoni(expenseTotal)}
          </span>
        }
      />
      <div className="flex items-center gap-space-lg py-space-sm">
        <DonutChart data={expenseShares} centerValue={`${main.percent}%`} centerLabel={main.label} />
        <div className="flex-1 space-y-2">
          {expenseShares.map((share) => (
            <div key={share.label} className="flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: share.color }} />
                <span className="font-body-md text-body-md text-on-surface">{share.label}</span>
              </div>
              <span className="font-tabular-ledger text-tabular-ledger font-semibold whitespace-nowrap text-on-surface tnum">
                {share.percent}% ({formatNumber(share.amount)}&nbsp;смн)
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
