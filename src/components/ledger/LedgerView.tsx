"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { LedgerDays } from "@/components/ledger/LedgerDays";
import { MonthPanel } from "@/components/ledger/MonthPanel";
import { cn } from "@/lib/cn";
import {
  expensesByCategory,
  groupLedgerByDay,
  ledgerCsv,
  matchesFilter,
  matchesQuery,
  monthName,
  monthTitle,
  monthTotals,
  type LedgerFilter,
  type LedgerMonth,
} from "@/lib/ledger";

const chips: { id: LedgerFilter; label: string; idle: string; active: string }[] = [
  { id: "all", label: "Ҳама", idle: "border-ink text-ink", active: "border-ink bg-ink text-card" },
  { id: "income", label: "+ Даромад", idle: "border-green text-green", active: "border-green bg-green text-card" },
  { id: "expense", label: "− Хароҷот", idle: "border-red text-red", active: "border-red bg-red text-card" },
  { id: "debt", label: "Насия", idle: "border-pen text-pen", active: "border-pen bg-pen text-card" },
];

function downloadCsv(csv: string, fileName: string) {
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function LedgerView({ ledger }: { ledger: LedgerMonth }) {
  const { month, months, today, entries } = ledger;
  const router = useRouter();
  const [loading, startLoading] = useTransition();
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [query, setQuery] = useState("");

  const visible = entries.filter((entry) => matchesFilter(entry, filter) && matchesQuery(entry, query));
  const emptyText = entries.length === 0 ? "дар ин моҳ ҳоло сабт нест" : "ҳеҷ сабт ёфт нашуд";

  function changeMonth(next: string) {
    startLoading(() => router.push(`/app/transactions?month=${next}`));
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:h-[calc(100dvh-116px)] lg:min-h-[640px] lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-[30px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-w-0 flex-col gap-3.5 lg:min-h-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <HandNote className="inline-block -rotate-2 text-[26px] lg:text-[28px]">Дафтари {monthName(month)}</HandNote>
            <h1 className="mt-0.5 font-display text-[30px] font-extrabold lg:text-4xl">{entries.length} сабт</h1>
          </div>
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
              <select
                value={month}
                disabled={loading}
                onChange={(event) => changeMonth(event.target.value)}
                className="h-9 appearance-none rounded-full border-[1.5px] border-ink bg-card px-3.5 text-ink disabled:text-ink-3"
              >
                {months.map((item) => (
                  <option key={item} value={item}>
                    {monthTitle(item)} ▾
                  </option>
                ))}
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

        <div
          aria-busy={loading}
          className={cn(
            "rounded-sheet border-[1.5px] border-ink bg-card bg-[linear-gradient(90deg,transparent_22px,var(--color-margin)_22px,var(--color-margin)_23.5px,transparent_23.5px)] py-2 pr-4 pl-9 shadow-hard-lg sm:bg-[linear-gradient(90deg,transparent_34px,var(--color-margin)_34px,var(--color-margin)_35.5px,transparent_35.5px)] sm:pr-6 sm:pl-[52px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto",
            loading && "opacity-60",
          )}
        >
          <LedgerDays days={groupLedgerByDay(visible, entries)} today={today} emptyText={emptyText} />
        </div>
      </section>

      <MonthPanel
        monthLabel={monthName(month)}
        totals={monthTotals(entries)}
        expenses={expensesByCategory(entries)}
        canExport={visible.length > 0}
        onExcel={() => downloadCsv(ledgerCsv(visible), `kassa-daftar-${month}.csv`)}
      />
    </div>
  );
}
