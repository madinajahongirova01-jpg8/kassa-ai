"use client";

import { useMemo, useState } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { LedgerDays } from "@/components/ledger/LedgerDays";
import { MonthPanel } from "@/components/ledger/MonthPanel";
import { cashEntries, monthSummary } from "@/data/daftar";
import { cn } from "@/lib/cn";
import { debtLedgerEntries, downloadLedgerCsv, groupByDay, matchesFilter, matchesQuery, type DaftarFilter } from "@/lib/daftar";
import { useDebtState } from "@/lib/debtStore";

const chips: { id: DaftarFilter; label: string; idle: string; active: string }[] = [
  { id: "all", label: "Ҳама", idle: "border-ink text-ink", active: "border-ink bg-ink text-card" },
  { id: "income", label: "+ Даромад", idle: "border-green text-green", active: "border-green bg-green text-card" },
  { id: "expense", label: "− Хароҷот", idle: "border-red text-red", active: "border-red bg-red text-card" },
  { id: "debt", label: "Насия", idle: "border-pen text-pen", active: "border-pen bg-pen text-card" },
];

export function LedgerView() {
  const { customers, events } = useDebtState();
  const [filter, setFilter] = useState<DaftarFilter>("all");
  const [query, setQuery] = useState("");

  const entries = useMemo(() => [...cashEntries, ...debtLedgerEntries(customers, events)], [customers, events]);
  const visible = entries.filter((entry) => matchesFilter(entry, filter) && matchesQuery(entry, query));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:h-[calc(100dvh-116px)] lg:min-h-[640px] lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-[30px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-w-0 flex-col gap-3.5 lg:min-h-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[28px]">Дафтари {monthSummary.label}</HandNote>
            <h1 className="mt-0.5 font-display text-[30px] font-extrabold lg:text-4xl">{monthSummary.records} сабт</h1>
          </div>
          <HandNote tone="muted" className="hidden rotate-2 text-[22px] sm:block">
            ҳамаашро Kassa AI навишт
          </HandNote>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="no-scrollbar -mx-[18px] flex items-center gap-2 overflow-x-auto px-[18px] lg:mx-0 lg:flex-wrap lg:px-0">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                aria-pressed={filter === chip.id}
                onClick={() => setFilter(chip.id)}
                className={cn("h-9 shrink-0 rounded-full border-[1.5px] px-3.5 font-semibold whitespace-nowrap", filter === chip.id ? chip.active : cn("bg-card", chip.idle))}
              >
                {chip.label}
              </button>
            ))}
            <label className="relative shrink-0">
              <span className="sr-only">Моҳ</span>
              <select className="h-9 appearance-none rounded-full border-[1.5px] border-ink bg-card px-3.5 text-ink">
                <option>{monthSummary.period} ▾</option>
              </select>
            </label>
          </div>
          <label className="lg:ml-auto">
            <span className="sr-only">Ҷустуҷӯ</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ҷустуҷӯ: «орд», «такси»…"
              className="h-9 w-full rounded-full border-[1.5px] border-ink bg-card px-3.5 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-pen lg:w-[200px] xl:w-[230px]"
            />
          </label>
        </div>

        <div className="rounded-sheet border-[1.5px] border-ink bg-card bg-[linear-gradient(90deg,transparent_22px,var(--color-margin)_22px,var(--color-margin)_23.5px,transparent_23.5px)] py-2 pr-4 pl-9 shadow-hard-lg sm:bg-[linear-gradient(90deg,transparent_34px,var(--color-margin)_34px,var(--color-margin)_35.5px,transparent_35.5px)] sm:pr-6 sm:pl-[52px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <LedgerDays days={groupByDay(visible, entries)} />
        </div>
      </section>

      <MonthPanel onExcel={() => downloadLedgerCsv(visible, "kassa-daftar.csv")} />
    </div>
  );
}
