import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { StatusFilter } from "@/lib/debts";

export type StatusCounts = Record<StatusFilter, number>;

const tabs: { id: StatusFilter; label: string; desktop: string; desktopActive: string; mobile: string; dot?: string }[] = [
  { id: "all", label: "Ҳама", desktop: "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high", desktopActive: "bg-surface-container-high text-on-surface", mobile: "text-on-surface-variant" },
  { id: "active", label: "Фаъол", desktop: "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high", desktopActive: "bg-primary-container text-on-primary-container shadow-xs", mobile: "text-on-surface-variant" },
  { id: "near", label: "Мӯҳлаташ наздик", desktop: "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high", desktopActive: "bg-tertiary-fixed text-on-tertiary-fixed shadow-xs", mobile: "text-tertiary", dot: "bg-tertiary-fixed-dim" },
  { id: "overdue", label: "Гузашта", desktop: "bg-error-container/60 text-on-error-container hover:bg-error-container", desktopActive: "bg-error text-on-error shadow-xs", mobile: "text-error", dot: "bg-error" },
  { id: "paid", label: "Пардохтшуда", desktop: "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high", desktopActive: "bg-secondary-container text-on-secondary-container shadow-xs", mobile: "text-secondary", dot: "bg-secondary" },
];

type FilterProps = {
  query: string;
  status: StatusFilter;
  counts: StatusCounts;
  onQuery: (value: string) => void;
  onStatus: (value: StatusFilter) => void;
};

export function DebtSearchDesktop({ query, onQuery, trailing }: Pick<FilterProps, "query" | "onQuery"> & { trailing?: ReactNode }) {
  return (
    <div className="relative flex items-center">
      <Icon name="search" className="pointer-events-none absolute left-space-md text-xl text-outline" />
      <input
        type="search"
        aria-label="Ҷустуҷӯи муштарӣ"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Ҷустуҷӯ бо ном ё рақами телефон..."
        className="w-full rounded-xl bg-surface-container-low py-2.5 pr-11 pl-11 font-body-md text-body-md text-on-surface shadow-inner outline-none placeholder:text-outline focus:bg-surface-container-lowest focus:ring-[1.5px] focus:ring-primary-container"
      />
      {trailing}
    </div>
  );
}

export function DebtStatusTabs({ status, counts, onStatus }: Pick<FilterProps, "status" | "counts" | "onStatus">) {
  return (
    <div role="tablist" aria-label="Ҳолати қарз" className="flex items-center gap-space-xs overflow-x-auto pb-1 text-nowrap no-scrollbar">
      {tabs.map((tab) => {
        const active = status === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onStatus(tab.id)}
            className={cn("shrink-0 rounded-lg px-3 py-1.5 font-label-caps text-label-caps font-semibold transition-colors", active ? tab.desktopActive : tab.desktop)}
          >
            {tab.label} <span className="ml-1 opacity-80">{counts[tab.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DebtStatusChips({ status, counts, onStatus }: Pick<FilterProps, "status" | "counts" | "onStatus">) {
  return (
    <div role="tablist" aria-label="Ҳолати қарз" className="flex items-center gap-space-xs overflow-x-auto py-0.5 no-scrollbar">
      {tabs.map((tab) => {
        const active = status === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onStatus(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 font-body-sm text-body-sm",
              active ? "bg-primary font-semibold text-on-primary shadow-xs" : cn("bg-surface-container-lowest active:bg-surface-container", tab.mobile),
            )}
          >
            {tab.dot && !active && <span className={cn("h-2 w-2 rounded-full", tab.dot)} />}
            {tab.label} ({counts[tab.id]})
          </button>
        );
      })}
    </div>
  );
}
