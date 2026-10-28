import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

export type DebtSummary = {
  total: number;
  activeCount: number;
  overdue: number;
  overdueCount: number;
  paidThisMonth: number;
  paidChange: number | null;
  reliability: number;
  collectedShare: number;
};

function Tile({
  label,
  icon,
  iconClassName,
  glowClassName,
  children,
}: {
  label: string;
  icon: string;
  iconClassName: string;
  glowClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-xs">
      {glowClassName && <div className={cn("pointer-events-none absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-xl", glowClassName)} />}
      <div className="flex items-center justify-between gap-space-xs">
        <span className="font-body-sm text-body-sm font-medium text-on-surface-variant">{label}</span>
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconClassName)}>
          <Icon name={icon} className="text-lg" />
        </span>
      </div>
      <div className="mt-space-sm">{children}</div>
    </div>
  );
}

function Amount({ value, className, unitClassName, unit = "смн" }: { value: string; className: string; unitClassName: string; unit?: string }) {
  return (
    <div className="flex items-baseline gap-space-xs">
      <span className={cn("font-display-hero text-display-hero leading-none font-extrabold tnum", className)}>{value}</span>
      <span className={cn("font-headline-sm text-headline-sm font-bold", unitClassName)}>{unit}</span>
    </div>
  );
}

export function DebtKpis({ summary }: { summary: DebtSummary }) {
  return (
    <div className="hidden grid-cols-2 gap-space-md md:grid xl:grid-cols-4">
      <Tile label="Умумии насия (Қарздоранд)" icon="receipt_long" iconClassName="bg-tertiary-container/15 text-tertiary-container" glowClassName="bg-tertiary/5">
        <Amount value={formatNumber(summary.total)} className="text-tertiary" unitClassName="text-on-surface-variant" />
        <div className="mt-space-xs flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="h-2 w-2 rounded-full bg-tertiary-container" />
          {summary.activeCount} муштарии фаъол дар гардиш
        </div>
      </Tile>
      <Tile label="Мӯҳлаташ гузашта" icon="warning" iconClassName="bg-error-container text-on-error-container" glowClassName="bg-error/5">
        <Amount value={formatNumber(summary.overdue)} className="text-error" unitClassName="text-error" />
        <div className="mt-space-xs flex items-center gap-space-xs">
          <span className="rounded-full bg-error/15 px-2 py-0.5 font-label-caps text-label-caps font-bold text-error">
            {summary.overdueCount} нафар таъхир дорад
          </span>
          {summary.overdueCount > 0 && <span className="font-body-sm text-body-sm text-outline">диққат!</span>}
        </div>
      </Tile>
      <Tile label="Пардохт дар ин моҳ" icon="payments" iconClassName="bg-primary-container text-on-primary-container" glowClassName="bg-primary/5">
        <Amount value={formatNumber(summary.paidThisMonth)} className="text-primary" unitClassName="text-on-surface-variant" />
        {summary.paidChange !== null && (
          <div className="mt-space-xs flex items-center gap-space-xs font-body-sm text-body-sm font-semibold text-primary">
            <Icon name={summary.paidChange >= 0 ? "trending_up" : "trending_down"} className="text-base" />
            {summary.paidChange >= 0 ? "+" : ""}
            {summary.paidChange}% ҷамъоварӣ шуд (нисбати Апрел)
          </div>
        )}
      </Tile>
      <Tile label="Эътимоднокии миёна" icon="verified_user" iconClassName="bg-surface-container-highest text-secondary">
        <div className="flex items-center justify-between">
          <Amount value={String(summary.reliability)} unit="%" className="text-on-surface" unitClassName="text-on-surface-variant" />
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-surface-container-high" />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${summary.reliability}, 100`}
              className="text-primary"
            />
          </svg>
        </div>
        <div className="mt-space-xs flex items-center gap-space-xs font-body-sm text-body-sm text-secondary">
          <Icon name="sentiment_satisfied" className="text-sm" />
          {summary.reliability >= 90 ? "Дараҷаи баланди пардохтпазирӣ" : "Пардохтпазирии миёна"}
        </div>
      </Tile>
    </div>
  );
}

export function DebtKpisScroller({ summary }: { summary: DebtSummary }) {
  return (
    <div className="-mx-margin flex gap-space-sm overflow-x-auto px-margin pb-1 no-scrollbar md:hidden">
      <div className="relative flex min-w-[210px] flex-col justify-between overflow-hidden rounded-xl bg-primary p-space-md text-on-primary shadow-xs">
        <div className="pointer-events-none absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-primary-container opacity-30" />
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps tracking-wider text-on-primary-container uppercase">Умумии насия</span>
          <Icon name="account_balance_wallet" className="text-[20px] text-on-primary-container" />
        </div>
        <div className="my-space-sm">
          <div className="font-display-hero-mobile text-display-hero-mobile font-extrabold tracking-tight tnum">
            {formatNumber(summary.total)} <span className="font-headline-sm text-headline-sm font-medium">смн</span>
          </div>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-primary-container">{summary.activeCount} муштарии фаъол</p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-primary/10" title="Ҳиссаи ҷамъовардашуда дар ин моҳ">
          <div className="h-full rounded-full bg-primary-fixed" style={{ width: `${summary.collectedShare}%` }} />
        </div>
      </div>
      <div className="flex min-w-[190px] flex-col justify-between rounded-xl bg-error-container p-space-md text-on-error-container shadow-xs">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps font-bold tracking-wider uppercase">Мӯҳлаташ гузашта</span>
          <Icon name="error_outline" className="text-[20px] text-error" />
        </div>
        <div className="my-space-sm">
          <div className="font-display-hero-mobile text-display-hero-mobile font-extrabold text-error tnum">
            {formatNumber(summary.overdue)} <span className="font-headline-sm text-headline-sm font-medium">смн</span>
          </div>
          <p className="mt-0.5 font-body-sm text-body-sm font-semibold">{summary.overdueCount} нафар таъхир (диққат!)</p>
        </div>
        <span className="flex items-center gap-1 font-label-caps text-label-caps font-bold text-error">
          <span className="h-1.5 w-1.5 rounded-full bg-error" /> Чора бинед
        </span>
      </div>
      <div className="flex min-w-[185px] flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md text-on-surface shadow-xs">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-outline uppercase">Пардохт дар ин моҳ</span>
          <Icon name="trending_up" className="text-[20px] text-primary" />
        </div>
        <div className="my-space-sm">
          <div className="font-headline-lg text-headline-lg font-extrabold text-on-surface tnum">
            {formatNumber(summary.paidThisMonth)} <span className="font-body-md text-body-md font-normal text-outline">смн</span>
          </div>
          {summary.paidChange !== null && (
            <p className="mt-0.5 font-body-sm text-body-sm font-semibold text-primary">
              {summary.paidChange >= 0 ? "+" : ""}
              {summary.paidChange}% ҷамъоварӣ шуд
            </p>
          )}
        </div>
        <span className="font-label-caps text-label-caps text-outline">Нисбати Апрел</span>
      </div>
      <div className="flex min-w-[160px] flex-col justify-between rounded-xl bg-surface-container-lowest p-space-md text-on-surface shadow-xs">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-outline uppercase">Эътимоднокӣ</span>
          <Icon name="verified_user" className="text-[20px] text-tertiary" />
        </div>
        <div className="my-space-sm">
          <div className="font-headline-lg text-headline-lg font-extrabold text-tertiary tnum">{summary.reliability}%</div>
          <p className="mt-0.5 font-body-sm text-body-sm text-outline">Рейтинги миёна</p>
        </div>
        <span className="font-label-caps text-label-caps font-bold text-primary">
          {summary.reliability >= 90 ? "Баландии назаррас" : "Миёна"}
        </span>
      </div>
    </div>
  );
}
