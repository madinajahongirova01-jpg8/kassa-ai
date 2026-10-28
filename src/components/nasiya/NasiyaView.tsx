"use client";

import { useMemo, useRef, useState } from "react";
import { NasiyaFilters } from "@/components/nasiya/NasiyaFilters";
import { NasiyaHeadline } from "@/components/nasiya/NasiyaHeadline";
import { NasiyaSheet } from "@/components/nasiya/NasiyaSheet";
import { NasiyaStickers } from "@/components/nasiya/NasiyaStickers";
import { buildDebtRows, debtTotals, matchesQuery, matchesStatus, statusCounts, type StatusFilter } from "@/lib/debts";
import { useDebtState } from "@/lib/debtStore";

export function NasiyaView() {
  const { customers, events } = useDebtState();
  const rows = useMemo(() => buildDebtRows(customers, events), [customers, events]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => (rows.find((r) => r.status === "overdue") ?? rows[0])?.customer.id);
  const sheetRef = useRef<HTMLElement>(null);

  const totals = debtTotals(rows);
  const visible = rows.filter((row) => matchesStatus(row.status, filter) && matchesQuery(row.customer, query));
  const selected = rows.find((row) => row.customer.id === selectedId) ?? rows[0];

  function select(id: string) {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="grid gap-5 lg:h-[calc(100dvh-116px)] lg:min-h-[700px] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-[30px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="flex min-w-0 flex-col gap-4 lg:gap-[18px]">
        <NasiyaHeadline total={totals.total} overdueCount={totals.overdueCount} />
        <NasiyaFilters counts={statusCounts(rows)} filter={filter} onFilter={setFilter} query={query} onQuery={setQuery} />
        <NasiyaStickers rows={visible} selectedId={selected?.customer.id} onSelect={select} />
      </section>
      {selected && <NasiyaSheet ref={sheetRef} row={selected} />}
    </div>
  );
}
