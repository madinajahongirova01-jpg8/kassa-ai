import { Icon } from "@/components/ui/Icon";
import type { DebtCustomer } from "@/data/debts";
import { cn } from "@/lib/cn";
import { formatNumber, formatSomoni } from "@/lib/format";

type CustomerProfileProps = {
  customer: DebtCustomer;
  balance: number;
  onRepay: () => void;
  onAddDebt: () => void;
  onRemind: () => void;
};

export function CustomerProfile({ customer, balance, onRepay, onAddDebt, onRemind }: CustomerProfileProps) {
  return (
    <section aria-label="Маълумоти муштарӣ" className="space-y-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-space-md">
          <div className="relative">
            <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl font-headline-md text-headline-md font-extrabold shadow-xs", customer.avatarClassName)}>
              {customer.initials}
            </div>
            {customer.vip && (
              <span
                title="Мизоҷи доимӣ"
                className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-container text-xs font-bold text-on-tertiary-container"
              >
                ★
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-space-xs">
              <h2 className="font-headline-md text-headline-md font-extrabold text-on-surface">{customer.name}</h2>
              {customer.vip && (
                <span className="rounded-full bg-tertiary-container/20 px-2 py-0.5 font-label-caps text-label-caps font-bold text-tertiary">VIP Муштарӣ</span>
              )}
            </div>
            <a href={`tel:${customer.phone.replace(/\s/g, "")}`} className="mt-0.5 flex items-center gap-1 font-body-md text-body-md text-on-surface-variant hover:text-primary">
              <Icon name="call" className="text-sm text-outline" /> {customer.phone}
            </a>
            {customer.address && (
              <p className="flex items-center gap-1 font-body-sm text-body-sm text-outline">
                <Icon name="location_on" className="text-sm" /> {customer.address}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-space-md text-right sm:min-w-40">
          <span className="font-label-caps text-label-caps font-semibold text-outline uppercase">Қарзи ҷорӣ</span>
          <div className={cn("font-headline-lg text-headline-lg font-extrabold tnum", balance > 0 ? "text-tertiary" : "text-primary")}>
            {formatNumber(balance)} <span className="font-body-md text-body-md text-on-surface-variant">смн</span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Лимит: {formatSomoni(customer.limit)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
        <button
          type="button"
          onClick={onRepay}
          disabled={balance <= 0}
          className="flex flex-1 items-center justify-center gap-space-xs rounded-xl bg-primary px-space-md py-2.5 font-headline-sm text-body-lg font-bold whitespace-nowrap text-on-primary shadow-md transition-all hover:bg-primary/95 disabled:opacity-50"
        >
          <Icon name="payments" className="text-xl" />
          Пардохтро қабул кунед
        </button>
        <button
          type="button"
          onClick={onAddDebt}
          className="flex flex-1 items-center justify-center gap-space-xs rounded-xl bg-surface-container-low px-space-md py-2.5 font-headline-sm text-body-lg font-bold whitespace-nowrap text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <Icon name="add_circle_outline" className="text-xl text-primary" />
          Қарз илова кунед
        </button>
        <button
          type="button"
          onClick={onRemind}
          disabled={balance <= 0}
          className="flex items-center justify-center gap-space-xs rounded-xl bg-tertiary-container px-space-md py-2.5 font-headline-sm text-body-lg font-bold whitespace-nowrap text-on-tertiary-container shadow-xs transition-all hover:opacity-90 disabled:opacity-50"
        >
          <Icon name="chat" className="text-xl" />
          Ёдраскунӣ (SMS / TG)
        </button>
      </div>
    </section>
  );
}
