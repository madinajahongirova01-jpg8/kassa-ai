import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { Table, type Column } from "@/components/ui/Table";
import { recentTransactions } from "@/data/overview";
import type { Transaction } from "@/data/types";
import { cn } from "@/lib/cn";
import { formatSomoni } from "@/lib/format";

const columns: Column<Transaction>[] = [
  {
    key: "title",
    header: "Навъ / Манбаъ",
    render: (row) => (
      <div className="flex items-center gap-space-xs">
        <span
          title={row.source === "voice" ? "Сабти овозӣ" : "Сабти дастӣ"}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            row.source === "voice" ? "bg-primary-fixed text-primary" : "bg-surface-container text-outline",
          )}
        >
          <Icon name={row.source === "voice" ? "mic" : "edit_note"} className="text-sm" />
        </span>
        <span className="truncate font-body-md text-body-md font-medium text-on-surface">{row.title}</span>
      </div>
    ),
  },
  {
    key: "category",
    header: "Категория",
    render: (row) => (
      <Pill tone={row.categoryTone} size="text">
        {row.category}
      </Pill>
    ),
  },
  {
    key: "time",
    header: "Вақт",
    className: "font-body-sm text-body-sm text-outline whitespace-nowrap",
    render: (row) => row.time,
  },
  {
    key: "amount",
    header: "Маблағ",
    align: "right",
    render: (row) => (
      <span
        className={cn(
          "font-tabular-ledger text-tabular-ledger font-bold whitespace-nowrap tnum",
          row.amount < 0 ? "text-error" : "text-primary",
        )}
      >
        {formatSomoni(row.amount, { sign: true })}
      </span>
    ),
  },
  {
    key: "status",
    header: "Ҳолат",
    align: "right",
    render: (row) => (
      <Pill tone="secondary" shape="full">
        {row.status}
      </Pill>
    ),
  },
];

export function RecentTransactionsCard() {
  return (
    <Card>
      <CardHeader
        title="Охирин амалиётҳо"
        subtitle="Ҳамаи даромад ва хароҷоти охирин"
        action={
          <Link
            href="/app/transactions"
            className="flex items-center gap-1 font-body-sm text-body-sm font-semibold text-primary hover:underline"
          >
            Ҳамаашро дидан <Icon name="arrow_forward" className="text-sm" />
          </Link>
        }
      />
      <Table columns={columns} rows={recentTransactions} getRowKey={(row) => row.id} />
    </Card>
  );
}

export function RecentTransactionsList() {
  return (
    <section className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-[0_2px_8px_rgba(15,42,35,0.04)]">
      <div className="flex items-center justify-between">
        <span className="font-headline-sm text-body-md font-bold text-on-surface">Охирин амалиётҳо</span>
        <Link href="/app/transactions" className="font-headline-sm text-body-sm font-semibold text-primary active:opacity-80">
          Ҳамааш
        </Link>
      </div>
      <div className="divide-y divide-surface-container">
        {recentTransactions.map((row) => (
          <div key={row.id} className="flex items-center justify-between py-2">
            <div className="flex min-w-0 items-center gap-space-sm">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", row.iconClassName)}>
                <Icon name={row.icon} className="text-[20px]" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-body-md text-body-sm font-semibold text-on-surface">{row.title}</div>
                <span className="font-label-caps text-[10px] text-on-surface-variant">
                  {row.time.replace("Имрӯз, ", "")} • {row.category}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 pl-2 font-tabular-ledger text-body-md font-bold tnum",
                row.amount < 0 ? "text-error" : "text-primary",
              )}
            >
              {formatSomoni(row.amount, { sign: true })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
