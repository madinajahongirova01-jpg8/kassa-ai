import { DebtHistoryCompact } from "@/components/debts/DebtHistory";
import { DebtReceiptMini } from "@/components/debts/DebtReceiptCard";
import { Icon } from "@/components/ui/Icon";
import type { DebtCustomer, DebtEvent, DebtReceipt } from "@/data/debts";
import { cn } from "@/lib/cn";
import { dueHeadline, type DebtStatus } from "@/lib/debts";
import { formatSomoni } from "@/lib/format";

type SelectedCustomerPanelProps = {
  customer: DebtCustomer;
  balance: number;
  status: DebtStatus;
  receipt: DebtReceipt | undefined;
  events: DebtEvent[];
  onRepay: () => void;
  onRemind: () => void;
};

export function SelectedCustomerPanel({ customer, balance, status, receipt, events, onRepay, onRemind }: SelectedCustomerPanelProps) {
  return (
    <section id="selected-customer" aria-label="Муштарии интихобшуда" className="relative scroll-mt-20 space-y-space-md overflow-hidden rounded-2xl bg-surface-container-lowest p-space-md shadow-md">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-primary via-tertiary-fixed-dim to-primary" />
      <div className="flex items-center justify-between gap-space-sm pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="quick_reference_all" className="text-[22px] text-primary" />
          <div className="min-w-0">
            <span className="font-label-caps text-label-caps font-semibold text-outline uppercase">Муштарии интихобшуда</span>
            <h4 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">{customer.name}</h4>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span
            className={cn(
              "font-label-caps text-label-caps font-bold uppercase",
              status === "paid" ? "text-secondary" : status === "overdue" || status === "near" ? "text-error" : "text-outline",
            )}
          >
            {dueHeadline(customer, balance)}
          </span>
          <div className="font-headline-sm text-headline-sm font-extrabold text-primary tnum">{formatSomoni(balance)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-space-xs">
        <button
          type="button"
          onClick={onRepay}
          disabled={balance <= 0}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary font-headline-sm text-body-sm font-bold text-on-primary shadow-xs transition-transform active:scale-95 disabled:opacity-50"
        >
          <Icon name="payments" className="text-[18px]" />
          Пардохтро қабул
        </button>
        <button
          type="button"
          onClick={onRemind}
          disabled={balance <= 0}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-surface-container-high font-body-md text-body-sm font-semibold text-on-surface transition-colors active:bg-surface-variant disabled:opacity-50"
        >
          <Icon name="send" className="text-[18px] text-primary" />
          Ёдраскунӣ (SMS/TG)
        </button>
      </div>
      <DebtReceiptMini receipt={receipt} />
      <DebtHistoryCompact events={events} />
    </section>
  );
}
