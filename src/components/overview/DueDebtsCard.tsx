"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { useDebtOverview } from "@/lib/useDebtOverview";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";

export function DueDebtsCard() {
  const { totals, dueSoon: dueDebts } = useDebtOverview();
  return (
    <Card>
      <CardHeader
        className="pb-space-sm"
        icon={<Icon name="notification_important" className="text-xl text-tertiary" />}
        title="Насияҳои мӯҳлаташ наздик"
        action={
          <Pill tone="error" className="font-bold">
            {dueDebts.length} огоҳӣ
          </Pill>
        }
      />
      <p className="pb-space-md font-body-sm text-body-sm text-outline">
        Рӯйхати муштариёне, ки ваъдаи пардохташон расидааст
      </p>
      <div className="space-y-space-sm">
        {dueDebts.map((debt) => (
          <div key={debt.id} className="flex items-center justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-md">
            <div className="flex min-w-0 items-center gap-space-sm">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-headline-sm text-headline-sm font-bold",
                  debt.avatarClassName,
                )}
              >
                {debt.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-body-md text-body-md font-bold text-on-surface">{debt.name}</p>
                <div className="flex flex-wrap items-center gap-x-1.5 font-body-sm text-body-sm text-outline">
                  <span className="whitespace-nowrap">{debt.phone}</span>
                  <span>•</span>
                  <span className={cn("font-semibold whitespace-nowrap", debt.dueClassName)}>{debt.due}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-tabular-ledger text-tabular-ledger font-extrabold text-error tnum">
                {formatSomoni(debt.amount)}
              </div>
              <Button variant="surface" size="sm" icon="send" className="mt-1">
                Ёдраскунӣ
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-space-md pt-space-xs text-center">
        <Link href="/app/debts" className="font-body-sm text-body-sm font-semibold text-primary hover:underline">
          Ба дафтари пурраи насия гузаштан ({totals.debtorCount} нафар) →
        </Link>
      </div>
    </Card>
  );
}

export function DueDebtsAlert() {
  const { dueSoon: dueDebts } = useDebtOverview();
  return (
    <section className="space-y-space-sm rounded-xl bg-error-container/40 p-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon name="notifications_active" className="text-[20px] text-error" />
          <span className="font-headline-sm text-body-sm font-bold text-on-surface">Насияҳои мӯҳлаташ наздик</span>
        </div>
        <Pill tone="error" shape="full" className="font-bold">
          {dueDebts.length} огоҳӣ
        </Pill>
      </div>
      {dueDebts.map((debt) => (
        <div
          key={debt.id}
          className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-space-sm shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        >
          <div className="min-w-0 pr-2">
            <div className="truncate font-body-md text-body-sm font-bold text-on-surface">{debt.name}</div>
            <div className={cn("font-body-sm text-[11px] font-medium", debt.urgent ? "text-error" : "text-tertiary")}>
              {debt.dueShort} • <span className="font-semibold tnum">{formatSomoni(debt.amount)}</span>
            </div>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-label-caps text-label-caps font-bold text-on-primary transition-opacity active:opacity-90"
          >
            <Icon name="send" className="text-[14px]" />
            Ёдраскунӣ
          </button>
        </div>
      ))}
    </section>
  );
}
