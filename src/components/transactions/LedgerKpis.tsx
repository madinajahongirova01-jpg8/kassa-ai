import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatNumber, formatSomoni } from "@/lib/format";

type LedgerSummary = {
  income: number;
  expense: number;
  net: number;
  count: number;
  accuracy: number | null;
  incomeChange: number | null;
  periodLabel: string;
};

function KpiTile({
  label,
  icon,
  iconClassName,
  children,
}: {
  label: string;
  icon: string;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-xs">
      <div className="flex items-center justify-between gap-space-xs">
        <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">{label}</span>
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
          <Icon name={icon} className="text-base" />
        </span>
      </div>
      {children}
    </div>
  );
}

export function LedgerKpis({ summary }: { summary: LedgerSummary }) {
  return (
    <div className="mb-space-lg hidden grid-cols-2 gap-space-md md:grid xl:grid-cols-4">
      <KpiTile label={`Даромади ${summary.periodLabel}`} icon="arrow_downward" iconClassName="bg-secondary-container text-on-secondary-container">
        <div className="mt-2 flex items-baseline justify-between gap-space-xs">
          <span className="font-headline-md text-headline-md font-bold text-primary tnum">
            {formatSomoni(summary.income, { sign: true })}
          </span>
          {summary.incomeChange !== null && (
            <span className="rounded-sm bg-primary-fixed/40 px-1.5 py-0.5 font-label-caps text-label-caps text-primary tnum">
              {summary.incomeChange >= 0 ? "▲ +" : "▼ "}
              {summary.incomeChange}%
            </span>
          )}
        </div>
      </KpiTile>
      <KpiTile label={`Хароҷоти ${summary.periodLabel}`} icon="arrow_upward" iconClassName="bg-error-container text-on-error-container">
        <div className="mt-2 flex items-baseline justify-between gap-space-xs">
          <span className="font-headline-md text-headline-md font-bold text-error tnum">{formatSomoni(summary.expense)}</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">{summary.count} амалиёт</span>
        </div>
      </KpiTile>
      <KpiTile label="Тавозуни соф (Net)" icon="account_balance_wallet" iconClassName="bg-surface-container-highest text-primary">
        <div className="mt-2 flex items-baseline justify-between gap-space-xs">
          <span className="font-headline-md text-headline-md font-bold text-on-surface tnum">
            {formatSomoni(summary.net, { sign: true })}
          </span>
          <span className={cn("font-label-caps text-label-caps font-semibold", summary.net >= 0 ? "text-primary" : "text-error")}>
            {summary.net >= 0 ? "Касса мусбат" : "Касса манфӣ"}
          </span>
        </div>
      </KpiTile>
      <KpiTile label="Дақиқии шинохти AI" icon="auto_awesome" iconClassName="bg-tertiary-fixed text-on-tertiary-fixed">
        <div className="mt-2 flex items-center justify-between gap-space-xs">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
            <div className="h-full rounded-full bg-tertiary-container" style={{ width: `${summary.accuracy ?? 0}%` }} />
          </div>
          <span className="font-tabular-ledger text-tabular-ledger font-bold text-on-surface tnum">
            {summary.accuracy === null ? "—" : `${formatNumber(summary.accuracy, 1)}%`}
          </span>
        </div>
      </KpiTile>
    </div>
  );
}

function MiniTile({
  label,
  icon,
  iconClassName,
  value,
  valueClassName,
}: {
  label: string;
  icon: string;
  iconClassName: string;
  value: number;
  valueClassName: string;
}) {
  const amount = formatSomoni(value, { sign: true, unit: false });
  return (
    <div className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-2.5 shadow-xs">
      <div className={cn("flex items-center gap-1", iconClassName)}>
        <Icon name={icon} className="text-[15px]" />
        <span className="font-label-caps text-label-caps font-medium text-on-surface-variant">{label}</span>
      </div>
      <div className="mt-1">
        <span className={cn("font-tabular-ledger text-tabular-ledger font-bold tracking-tight tnum", valueClassName)}>{amount}</span>{" "}
        <span className={cn("font-body-sm text-[10px]", valueClassName === "text-on-surface" ? "text-on-surface-variant" : valueClassName)}>
          смн
        </span>
      </div>
    </div>
  );
}

export function LedgerKpisCompact({ summary }: { summary: LedgerSummary }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:hidden">
      <MiniTile label="Даромад" icon="arrow_downward_alt" iconClassName="text-primary" value={summary.income} valueClassName="text-primary" />
      <MiniTile label="Хароҷот" icon="arrow_upward_alt" iconClassName="text-error" value={summary.expense} valueClassName="text-error" />
      <MiniTile label="Бақия" icon="account_balance_wallet" iconClassName="text-secondary" value={summary.net} valueClassName="text-on-surface" />
    </div>
  );
}

export type { LedgerSummary };
