"use client";

import { useMemo, useState } from "react";
import { EntryEditorPanel } from "@/components/transactions/EntryEditorPanel";
import { EntrySheet } from "@/components/transactions/EntrySheet";
import { LedgerCardList } from "@/components/transactions/LedgerCardList";
import { LedgerFiltersBar } from "@/components/transactions/LedgerFiltersBar";
import { LedgerKpis, LedgerKpisCompact } from "@/components/transactions/LedgerKpis";
import { LedgerMobileHeader, LedgerMobileSearch } from "@/components/transactions/LedgerMobileControls";
import { LedgerTable, PAGE_SIZE } from "@/components/transactions/LedgerTable";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Icon } from "@/components/ui/Icon";
import { ledgerEntries, periods, type LedgerEntry } from "@/data/transactions";
import { cn } from "@/lib/cn";
import { defaultFilters, entriesToCsv, filterEntries, inPeriod, percentChange, previousPeriod, summarize, type LedgerFilters } from "@/lib/ledger";
import { applyDraft, draftFromEntry, emptyDraft, type EntryDraft } from "@/lib/ledgerDraft";

const periodWord: Record<string, string> = { today: "имрӯз", yesterday: "дирӯз", week: "ҳафта" };

export function TransactionsView() {
  const [entries, setEntries] = useState<LedgerEntry[]>(ledgerEntries);
  const [filters, setFilters] = useState<LedgerFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<EntryDraft | null>(() => draftFromEntry(ledgerEntries[0]));
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => filterEntries(entries, filters), [entries, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const periodEntries = entries.filter((e) => inPeriod(e, filters.period));
  const stats = summarize(periodEntries);
  const previous = previousPeriod(filters.period);
  const previousIncome = previous ? summarize(entries.filter((e) => inPeriod(e, previous))).income : 0;
  const summary = {
    income: stats.income,
    expense: stats.expense,
    net: stats.net,
    count: periodEntries.length,
    accuracy: stats.accuracy,
    incomeChange: previous ? percentChange(stats.income, previousIncome) : null,
    periodLabel: periodWord[filters.period],
  };

  const base = draft?.id ? entries.find((e) => e.id === draft.id) : undefined;

  const updateFilters = (patch: Partial<LedgerFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const openEntry = (entry: LedgerEntry, mobile: boolean) => {
    setDraft(draftFromEntry(entry));
    if (mobile) setSheetOpen(true);
  };
  const openNew = (mobile: boolean) => {
    setDraft(emptyDraft(new Date()));
    if (mobile) setSheetOpen(true);
  };
  const closeEditor = () => {
    setDraft(null);
    setSheetOpen(false);
  };
  const closeSheet = () => setSheetOpen(false);

  const saveDraft = () => {
    if (!draft) return;
    const nextId = String(Math.max(...entries.map((e) => Number(e.id)), 1000) + 1);
    const saved = applyDraft(draft, base, nextId);
    setEntries((current) => (draft.id ? current.map((e) => (e.id === draft.id ? saved : e)) : [saved, ...current]));
    setDraft(draftFromEntry(saved));
    setSheetOpen(false);
  };
  const deleteEntry = (entry: LedgerEntry) => {
    setEntries((current) => current.filter((e) => e.id !== entry.id));
    if (draft?.id === entry.id) closeEditor();
  };

  const exportCsv = () => {
    const blob = new Blob(["﻿", entriesToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kassa-ai-amaliyotho-${periods.find((p) => p.id === filters.period)?.from ?? "all"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-[1580px] px-margin pb-space-md md:p-space-lg">
      <LedgerMobileHeader filters={filters} total={filtered.length} onChange={updateFilters} onReset={resetFilters} onNew={() => openNew(true)} />
      <div className="md:hidden">
        <DemoBadge className="mb-space-xs" />
        <LedgerKpisCompact summary={summary} />
        <LedgerMobileSearch filters={filters} total={filtered.length} onChange={updateFilters} />
        <section className="flex flex-col gap-2 pt-space-xs">
          <LedgerCardList entries={filtered} onOpen={(entry) => openEntry(entry, true)} onReset={resetFilters} />
        </section>
      </div>

      <div className="mb-space-lg hidden flex-col gap-space-md md:flex lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-space-xs">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
            <p className="font-label-caps text-label-caps tracking-wider text-secondary uppercase">Журнали молиявии вақти воқеӣ</p>
            <DemoBadge className="ml-space-xs" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Амалиётҳо ва Журнали касса</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Сабти мукаммали даромад ва хароҷоти тиҷорат бо таснифоти худкори таҳлили AI
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-space-xs rounded-lg bg-surface-container-high px-space-md py-2.5 font-body-sm text-body-sm font-semibold text-on-surface shadow-xs transition-colors hover:bg-surface-container-highest disabled:opacity-50"
          >
            <Icon name="file_download" className="text-lg text-secondary" />
            Содирот (Excel/CSV)
          </button>
          <button
            type="button"
            onClick={() => openNew(false)}
            className="flex items-center gap-space-xs rounded-lg bg-primary px-space-md py-2.5 font-body-sm text-body-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            <Icon name="add_circle" className="text-lg" />
            Амалиёти нав
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <LedgerKpis summary={summary} />
        <LedgerFiltersBar filters={filters} onChange={updateFilters} onReset={resetFilters} />
        <div className="relative grid grid-cols-12 items-start gap-space-lg">
          <div className={cn("col-span-12", draft && "xl:col-span-8")}>
            <LedgerTable
              entries={visible}
              total={filtered.length}
              turnover={summarize(filtered).turnover}
              page={currentPage}
              pageCount={pageCount}
              sort={filters.sort}
              selectedId={draft?.id ?? null}
              onSort={(sort) => updateFilters({ sort })}
              onPage={setPage}
              onEdit={(entry) => openEntry(entry, false)}
              onDelete={deleteEntry}
              onReset={resetFilters}
            />
          </div>
          {draft && (
            <div className="col-span-12 xl:sticky xl:top-20 xl:col-span-4">
              <EntryEditorPanel
                key={draft.id ?? "new"}
                draft={draft}
                base={base}
                onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
                onSave={saveDraft}
                onClose={closeEditor}
              />
            </div>
          )}
        </div>
      </div>

      {sheetOpen && draft && (
        <EntrySheet
          draft={draft}
          base={base}
          onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
          onSave={saveDraft}
          onClose={closeSheet}
          onDelete={() => base && deleteEntry(base)}
        />
      )}
    </div>
  );
}
