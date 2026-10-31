"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { HandNote } from "@/components/daftar/HandNote";
import { useT } from "@/components/i18n/I18nProvider";
import { NasiyaCalculator } from "@/components/nasiya/NasiyaCalculator";
import { NasiyaFilters } from "@/components/nasiya/NasiyaFilters";
import { NewCustomerForm, NewDebtForm } from "@/components/nasiya/NasiyaForms";
import { NasiyaHeadline, type NasiyaFormKind } from "@/components/nasiya/NasiyaHeadline";
import { NasiyaSheet } from "@/components/nasiya/NasiyaSheet";
import { NasiyaStickers } from "@/components/nasiya/NasiyaStickers";
import type { DebtBook } from "@/data/debts";
import { buildDebtRows, debtTotals, matchesQuery, matchesStatus, statusCounts, type StatusFilter } from "@/lib/debts";

export function NasiyaView({ book }: { book: DebtBook }) {
  const router = useRouter();
  const t = useT();
  const { today, businessName, customers, events } = book;
  const rows = useMemo(() => buildDebtRows(customers, events, today), [customers, events, today]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => (rows.find((r) => r.status === "overdue") ?? rows[0])?.customer.id);
  const [openForm, setOpenForm] = useState<NasiyaFormKind | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sheetRef = useRef<HTMLElement>(null);

  const totals = debtTotals(rows);
  const visible = rows.filter((row) => matchesStatus(row.status, filter) && matchesQuery(row.customer, query));
  const selected = rows.find((row) => row.customer.id === selectedId) ?? rows[0];

  function select(id: string) {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 1023px)").matches) sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleForm(kind: NasiyaFormKind) {
    setNotice(null);
    setEditingId(null);
    setOpenForm((current) => (current === kind ? null : kind));
  }

  function startEdit(customerId: string) {
    setNotice(null);
    setOpenForm(null);
    setEditingId(customerId);
  }

  function saved(customerId: string, text: string) {
    setOpenForm(null);
    setEditingId(null);
    setNotice(text);
    setFilter("all");
    setQuery("");
    setSelectedId(customerId);
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:h-[calc(100dvh-116px)] lg:min-h-[700px] lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-[30px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="flex min-w-0 flex-col gap-4 lg:gap-[18px]">
        <NasiyaHeadline total={totals.total} overdueCount={totals.overdueCount} openForm={openForm} onOpenForm={toggleForm} />
        <NasiyaCalculator />
        {openForm === "customer" && <NewCustomerForm onCreated={(id) => saved(id, t("nasiya.notices.customerAdded"))} onClose={() => setOpenForm(null)} />}
        {openForm === "debt" && (
          <NewDebtForm
            customers={customers}
            initialCustomerId={selected?.customer.id}
            today={today}
            onCreated={(id) => saved(id, t("nasiya.notices.debtAdded"))}
            onClose={() => setOpenForm(null)}
          />
        )}
        {notice && (
          <HandNote tone="green" role="status" className="text-xl leading-tight">
            {notice}
          </HandNote>
        )}
        <NasiyaFilters counts={statusCounts(rows)} filter={filter} onFilter={setFilter} query={query} onQuery={setQuery} />
        <NasiyaStickers rows={visible} empty={rows.length === 0} query={query} today={today} selectedId={selected?.customer.id} onSelect={select} onAddCustomer={() => toggleForm("customer")} />
      </section>
      {selected && (
        <NasiyaSheet
          ref={sheetRef}
          row={selected}
          today={today}
          businessName={businessName}
          editing={editingId === selected.customer.id}
          onEdit={() => startEdit(selected.customer.id)}
          onEditClose={() => setEditingId(null)}
          onEditSaved={() => saved(selected.customer.id, t("nasiya.notices.recordsSaved"))}
        />
      )}
    </div>
  );
}
