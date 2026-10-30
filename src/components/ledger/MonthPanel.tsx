import { Card } from "@/components/daftar/Card";
import { HandNote } from "@/components/daftar/HandNote";
import { Marker } from "@/components/daftar/Marker";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { ExpenseGroup } from "@/lib/ledger";

const buttonClass = "h-[42px] flex-1 rounded-xl border-[1.5px] border-ink bg-card font-semibold text-ink hover:text-pen disabled:text-ink-3";

type MonthPanelProps = {
  monthLabel: string;
  totals: { income: number; expense: number; profit: number };
  expenses: ExpenseGroup[];
  canExport: boolean;
  onExcel: () => void;
};

export function MonthPanel({ monthLabel, totals, expenses, canExport, onExcel }: MonthPanelProps) {
  const t = useT();
  const locale = useLocale();
  const largest = Math.max(0, ...expenses.map((item) => item.amount));
  return (
    <section className="flex flex-col gap-4 lg:min-h-0">
      <Card className="rounded-sheet px-5 py-[18px]">
        <h2 className="font-display text-[15px] font-bold">{t("ledger.panel.title", { month: monthLabel })}</h2>
        <div className="mt-3.5 flex justify-between">
          <span className="text-ink-2">{t("ledger.panel.moneyIn")}</span>
          <span className="font-mono font-bold text-green">{formatMoney(totals.income, { sign: true, unit: false, locale })}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-ink-2">{t("ledger.panel.moneyOut")}</span>
          <span className="font-mono font-bold text-red">{formatMoney(-totals.expense, { unit: false, locale })}</span>
        </div>
        <div className="my-3 border-t-[1.5px] border-dashed border-line-strong" />
        <div className="flex items-baseline justify-between">
          <span className="font-bold">{t("ledger.panel.profit")}</span>
          <Marker className={cn("px-1 font-display text-2xl font-extrabold", totals.profit < 0 && "text-red")}>{formatMoney(totals.profit, { unit: false, locale })}</Marker>
        </div>
        <p className="mt-2 text-xs text-ink-3">{t("ledger.panel.profitHint")}</p>
      </Card>

      <Card shadow="none" className="flex flex-col gap-3 rounded-sheet px-5 py-[18px] lg:min-h-0 lg:flex-1">
        <h2 className="font-display text-[15px] font-bold">{t("ledger.panel.whereWent")}</h2>
        {expenses.length === 0 ? (
          <HandNote tone="muted" role="status" className="text-xl leading-tight">
            {t("ledger.panel.noExpenses")}
          </HandNote>
        ) : (
          <ul className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
            {expenses.map((item) => (
              <li key={item.category}>
                <div className="flex justify-between text-[13px]">
                  <span>{item.label}</span>
                  <b className="font-mono">{formatMoney(item.amount, { unit: false, locale })}</b>
                </div>
                <div style={{ width: `${Math.max((item.amount / largest) * 100, 5)}%` }} className="mt-1.5 h-3 rounded-md bg-marker" />
              </li>
            ))}
          </ul>
        )}
        <div className="flex-1" />
        <div className="flex gap-2.5 print:hidden">
          <button type="button" onClick={onExcel} disabled={!canExport} className={buttonClass}>
            Excel
          </button>
          <button type="button" onClick={() => window.print()} disabled={!canExport} className={buttonClass}>
            PDF
          </button>
        </div>
      </Card>
    </section>
  );
}
