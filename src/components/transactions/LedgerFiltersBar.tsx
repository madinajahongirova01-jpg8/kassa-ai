"use client";

import { useEffect, useRef } from "react";
import { FilterSelect } from "@/components/transactions/FilterSelect";
import { Icon } from "@/components/ui/Icon";
import { currentBusiness } from "@/data/business";
import { categories, periods, sources, type EntryCategory, type EntrySource, type PeriodId } from "@/data/transactions";
import { cn } from "@/lib/cn";
import type { KindFilter, LedgerFilters } from "@/lib/ledger";

export const kindTabs: { id: KindFilter; label: string; className: string }[] = [
  { id: "all", label: "Ҳама", className: "text-on-surface" },
  { id: "income", label: "Даромад (+)", className: "text-primary" },
  { id: "expense", label: "Хароҷот (−)", className: "text-error" },
  { id: "debt", label: "Насия", className: "text-on-surface-variant" },
];

export const categoryOptions: { value: EntryCategory | "all"; label: string }[] = [
  { value: "all", label: "Ҳама" },
  ...(Object.keys(categories) as EntryCategory[]).map((key) => ({ value: key, label: categories[key].label })),
];

export const sourceOptions: { value: EntrySource | "all"; label: string }[] = [
  { value: "all", label: "Ҳама манбаъҳо" },
  ...(Object.keys(sources) as EntrySource[]).map((key) => ({ value: key, label: sources[key].label })),
];

export const periodOptions = periods.map((p) => ({ value: p.id, label: p.label }));

type LedgerFiltersBarProps = {
  filters: LedgerFilters;
  onChange: (patch: Partial<LedgerFilters>) => void;
  onReset: () => void;
};

export function LedgerFiltersBar({ filters, onChange, onReset }: LedgerFiltersBarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const period = periods.find((p) => p.id === filters.period) ?? periods[0];
  const category = categoryOptions.find((c) => c.value === filters.category)?.label ?? "Ҳама";
  const source = sourceOptions.find((s) => s.value === filters.source)?.label ?? "Ҳама манбаъҳо";

  return (
    <div className="mb-space-lg hidden space-y-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-xs md:block">
      <div className="flex flex-col justify-between gap-space-sm lg:flex-row lg:items-center">
        <div className="relative max-w-2xl flex-1">
          <Icon name="search" className="absolute top-1/2 left-3 -translate-y-1/2 text-xl text-outline" />
          <input
            ref={searchRef}
            type="search"
            aria-label="Ҷустуҷӯи амалиёт"
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Ҷустуҷӯи амалиёт бо ном, маблағ ё тавсиф..."
            className="w-full rounded-lg bg-surface-container-low py-2.5 pr-24 pl-10 font-body-sm text-body-sm text-on-surface shadow-inner transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-[1.5px] focus:ring-primary-container focus:outline-none"
          />
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 rounded-sm bg-surface-container px-2 py-0.5 font-label-caps text-label-caps text-outline">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-space-sm py-2 font-body-sm text-body-sm text-on-surface-variant">
          <Icon name="storefront" className="text-base text-primary" />
          <span className="font-medium text-on-surface">{currentBusiness.name}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <FilterSelect<PeriodId>
          label="Давра"
          icon="calendar_today"
          iconClassName="text-secondary"
          bold
          value={filters.period}
          options={periodOptions}
          onChange={(value) => onChange({ period: value })}
          display={`Давра: ${period.label}`}
        />
        <div role="tablist" aria-label="Навъи амалиёт" className="flex items-center rounded-lg bg-surface-container p-0.5">
          {kindTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filters.kind === tab.id}
              onClick={() => onChange({ kind: tab.id })}
              className={cn(
                "rounded-sm px-3 py-1 font-body-sm text-body-sm transition-colors",
                filters.kind === tab.id
                  ? "bg-surface-container-lowest font-semibold text-on-surface shadow-xs"
                  : cn("font-medium hover:text-on-surface", tab.className),
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <FilterSelect<EntryCategory | "all">
          label="Категорияҳо"
          icon="category"
          iconClassName="text-secondary"
          value={filters.category}
          options={categoryOptions}
          onChange={(value) => onChange({ category: value })}
          display={`Категорияҳо: ${category}`}
        />
        <FilterSelect<EntrySource | "all">
          label="Сарчашма"
          icon="sensors"
          iconClassName="text-primary"
          value={filters.source}
          options={sourceOptions}
          onChange={(value) => onChange({ source: value })}
          display={`Сарчашма: ${source}`}
        />
        <button
          type="button"
          onClick={onReset}
          className="ml-auto flex items-center gap-1 font-body-sm text-body-sm text-outline hover:text-on-surface"
        >
          <Icon name="filter_list_off" className="text-base" />
          Тоза кардан
        </button>
      </div>
    </div>
  );
}
