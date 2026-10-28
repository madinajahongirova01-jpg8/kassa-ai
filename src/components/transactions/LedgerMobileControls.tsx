"use client";

import { useState } from "react";
import { FilterSelect } from "@/components/transactions/FilterSelect";
import { categoryOptions, periodOptions, sourceOptions } from "@/components/transactions/LedgerFiltersBar";
import { Icon } from "@/components/ui/Icon";
import { periods, type EntryCategory, type EntrySource, type PeriodId } from "@/data/transactions";
import { cn } from "@/lib/cn";
import type { LedgerFilters } from "@/lib/ledger";

type MobileControlsProps = {
  filters: LedgerFilters;
  total: number;
  onChange: (patch: Partial<LedgerFilters>) => void;
  onReset: () => void;
  onNew: () => void;
};

export function LedgerMobileHeader({ filters, total, onChange, onReset, onNew }: MobileControlsProps) {
  const [open, setOpen] = useState(false);
  const period = periods.find((p) => p.id === filters.period) ?? periods[0];
  const active = filters.category !== "all" || filters.source !== "all" || filters.sort !== "newest";

  return (
    <section className="flex flex-col gap-space-sm pt-space-xs pb-space-sm md:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <h1 className="font-headline-md text-headline-md text-on-surface">Амалиётҳо</h1>
          <span className="inline-flex items-center rounded-full bg-secondary-container px-2 py-0.5 font-label-caps text-label-caps font-bold text-on-secondary-container">
            {total} қайд
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            aria-label="Филтрҳо"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              open ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant active:bg-surface-container-high",
            )}
          >
            <Icon name="filter_list" className="text-[20px]" />
            {active && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />}
          </button>
          <button
            type="button"
            onClick={onNew}
            className="flex h-10 items-center gap-1 rounded-xl bg-primary px-3 font-headline-sm text-body-sm font-semibold text-on-primary shadow-xs transition-transform active:scale-95"
          >
            <Icon name="add" className="text-[18px]" />
            Илова
          </button>
        </div>
      </div>

      <label className="relative flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
        <span className="flex items-center gap-2">
          <Icon name="calendar_today" className="text-[18px] text-primary" />
          <span className="font-headline-sm text-body-md font-semibold text-on-surface">{period.label}</span>
        </span>
        <span className="flex items-center gap-1 text-on-surface-variant">
          <span className="font-label-caps text-label-caps text-outline uppercase">{period.mobileLabel}</span>
          <Icon name="unfold_more" className="text-[18px]" />
        </span>
        <select
          aria-label="Давра"
          value={filters.period}
          onChange={(event) => onChange({ period: event.target.value as PeriodId })}
          className="absolute inset-0 cursor-pointer appearance-none opacity-0"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {open && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-container-lowest p-space-sm shadow-xs">
          <FilterSelect<EntryCategory | "all">
            label="Категорияҳо"
            icon="category"
            iconClassName="text-secondary"
            value={filters.category}
            options={categoryOptions}
            onChange={(value) => onChange({ category: value })}
            display={categoryOptions.find((c) => c.value === filters.category)?.label ?? "Ҳама"}
          />
          <FilterSelect<EntrySource | "all">
            label="Сарчашма"
            icon="sensors"
            iconClassName="text-primary"
            value={filters.source}
            options={sourceOptions}
            onChange={(value) => onChange({ source: value })}
            display={sourceOptions.find((s) => s.value === filters.source)?.label ?? "Ҳама манбаъҳо"}
          />
          <button type="button" onClick={onReset} className="ml-auto flex items-center gap-1 font-body-sm text-body-sm text-outline">
            <Icon name="filter_list_off" className="text-base" />
            Тоза кардан
          </button>
        </div>
      )}
    </section>
  );
}

const chips = [
  { id: "all", label: "Ҳама", className: "text-on-surface" },
  { id: "income", label: "Даромад (+)", className: "text-primary" },
  { id: "expense", label: "Хароҷот (−)", className: "text-error" },
  { id: "voice", label: "Овозӣ", className: "text-tertiary" },
] as const;

export function LedgerMobileSearch({ filters, total, onChange }: Pick<MobileControlsProps, "filters" | "total" | "onChange">) {
  const isActive = (id: (typeof chips)[number]["id"]) =>
    id === "voice" ? filters.source === "voice" : filters.source !== "voice" && filters.kind === id;

  const select = (id: (typeof chips)[number]["id"]) => {
    if (id === "voice") onChange({ kind: "all", source: "voice" });
    else onChange({ kind: id, source: filters.source === "voice" ? "all" : filters.source });
  };

  return (
    <section className="flex flex-col gap-2 pt-space-sm pb-space-xs md:hidden">
      <div className="relative w-full">
        <Icon name="search" className="absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-outline" />
        <input
          type="search"
          aria-label="Ҷустуҷӯи амалиёт"
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          placeholder="Ҷустуҷӯи амалиёт..."
          className="w-full rounded-xl bg-surface-container-lowest py-2 pr-10 pl-10 font-body-md text-body-md text-on-surface shadow-xs placeholder:text-outline focus:ring-[1.5px] focus:ring-primary-container focus:outline-none"
        />
        <Icon name="keyboard_voice" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[18px] text-outline" />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={isActive(chip.id)}
            onClick={() => select(chip.id)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-body-sm text-body-sm shadow-xs",
              isActive(chip.id) ? "bg-primary font-semibold text-on-primary" : cn("bg-surface-container-lowest font-medium active:bg-surface-container", chip.className),
            )}
          >
            {chip.id === "voice" && <Icon name="mic" className={cn("text-[16px]", !isActive(chip.id) && "text-tertiary")} />}
            {chip.id === "all" ? `${chip.label} (${total})` : chip.label}
          </button>
        ))}
      </div>
    </section>
  );
}
