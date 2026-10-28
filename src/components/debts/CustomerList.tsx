import { Icon } from "@/components/ui/Icon";
import type { DebtCustomer } from "@/data/debts";
import { cn } from "@/lib/cn";
import { dueLabel, isUrgent, type DebtStatus } from "@/lib/debts";
import { formatNumber, formatSomoni } from "@/lib/format";

export type CustomerRow = { customer: DebtCustomer; balance: number; status: DebtStatus };

type CustomerListProps = {
  rows: CustomerRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReset: () => void;
};

function StatusPill({ row, mobile }: { row: CustomerRow; mobile?: boolean }) {
  const label = dueLabel(row.customer, row.balance);
  if (row.status === "overdue") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-caps text-label-caps font-bold", mobile ? "bg-error-container text-error" : "bg-error-container text-on-error-container")}>
        {!mobile && <Icon name="error" className="text-xs" />}
        {label}
      </span>
    );
  }
  if (row.status === "paid") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-caps text-label-caps font-bold",
          mobile ? "bg-secondary-container text-on-secondary-fixed-variant" : "bg-primary-container/20 text-primary",
        )}
      >
        {!mobile && <Icon name="check" className="text-xs" />}
        {label}
      </span>
    );
  }
  if (isUrgent(row.customer, row.balance)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 font-label-caps text-label-caps font-bold text-on-tertiary-fixed">
        {!mobile && <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />}
        {label}
      </span>
    );
  }
  return <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-caps text-label-caps text-on-surface-variant">{label}</span>;
}

function EmptyList({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-space-sm rounded-xl px-space-md py-space-xl text-center">
      <Icon name="person_search" className="text-4xl text-outline-variant" />
      <p className="font-headline-sm text-body-md font-bold text-on-surface">Муштарӣ ёфт нашуд</p>
      <button type="button" onClick={onReset} className="font-body-sm text-body-sm font-semibold text-primary hover:underline">
        Тоза кардани филтрҳо
      </button>
    </div>
  );
}

export function CustomerList({ rows, selectedId, onSelect, onReset }: CustomerListProps) {
  if (rows.length === 0) return <EmptyList onReset={onReset} />;
  return (
    <ul className="space-y-space-xs pt-space-xs">
      {rows.map((row) => {
        const selected = row.customer.id === selectedId;
        const amountClass = row.status === "overdue" ? "text-error" : row.status === "paid" ? "font-medium text-on-surface-variant" : "text-on-surface";
        return (
          <li key={row.customer.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(row.customer.id)}
              className={cn(
                "relative w-full rounded-xl p-space-md text-left transition-all",
                selected ? "bg-surface-container-high/60 shadow-xs hover:bg-surface-container-high" : "hover:bg-surface-container-low",
                row.status === "paid" && !selected && "opacity-85",
              )}
            >
              {selected && <span className="absolute top-3 bottom-3 left-0 w-1.5 rounded-r-full bg-primary-container" />}
              <div className="flex items-center justify-between gap-space-sm">
                <div className="flex min-w-0 items-center gap-space-sm">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-headline-sm text-headline-sm font-bold", row.customer.avatarClassName)}>
                    {row.customer.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <h4 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">{row.customer.name}</h4>
                      {isUrgent(row.customer, row.balance) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-tertiary" />}
                    </div>
                    <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                      {row.customer.phone}
                      {row.customer.place ? ` • ${row.customer.place}` : ""}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn("font-headline-sm text-headline-sm font-extrabold tnum", amountClass)}>
                    {formatNumber(row.balance)} <span className="font-body-sm text-body-sm text-outline">смн</span>
                  </div>
                  <div className="mt-1">
                    <StatusPill row={row} />
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CustomerCards({ rows, selectedId, onSelect, onReset }: CustomerListProps) {
  if (rows.length === 0) return <EmptyList onReset={onReset} />;
  return (
    <ul className="space-y-space-sm">
      {rows.map((row) => {
        const selected = row.customer.id === selectedId;
        const amountClass = row.status === "overdue" ? "text-error" : row.status === "paid" ? "font-semibold text-secondary" : selected ? "text-primary" : "text-on-surface";
        return (
          <li key={row.customer.id}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(row.customer.id)}
              className={cn(
                "w-full rounded-xl bg-surface-container-lowest p-space-md text-left shadow-xs transition-all active:scale-[0.99]",
                selected && "bg-linear-to-r from-secondary-container/30 to-transparent ring-1 ring-secondary-container",
                row.status === "paid" && !selected && "opacity-85",
              )}
            >
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex min-w-0 items-center gap-space-sm">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-headline-sm text-headline-sm font-bold", row.customer.mobileAvatarClassName)}>
                    {row.customer.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-headline-sm text-body-lg font-bold text-on-surface">{row.customer.name}</h3>
                      {row.customer.vip && (
                        <span className="shrink-0 rounded-xs bg-tertiary-fixed px-1.5 font-label-caps text-[10px] font-extrabold text-on-tertiary-fixed uppercase">
                          VIP
                        </span>
                      )}
                    </div>
                    <p className="truncate font-body-sm text-body-sm text-outline">{row.customer.phone}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={cn("font-tabular-ledger text-headline-sm font-bold tnum", amountClass)}>{formatSomoni(row.balance)}</div>
                  <span className="mt-0.5 inline-block">
                    <StatusPill row={row} mobile />
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
