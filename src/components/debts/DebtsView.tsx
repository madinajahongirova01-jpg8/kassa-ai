"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddDebtDialog, type NewDebtInput } from "@/components/debts/AddDebtDialog";
import { CustomerCards, CustomerList, type CustomerRow } from "@/components/debts/CustomerList";
import { CustomerProfile } from "@/components/debts/CustomerProfile";
import { DebtKpis, DebtKpisScroller, type DebtSummary } from "@/components/debts/DebtKpis";
import { DebtSearchDesktop, DebtStatusChips, DebtStatusTabs, type StatusCounts } from "@/components/debts/DebtFilters";
import { DebtHistory } from "@/components/debts/DebtHistory";
import { DebtReceiptCard } from "@/components/debts/DebtReceiptCard";
import { ReminderDialog, type ReminderChannel } from "@/components/debts/ReminderDialog";
import { RepaymentDialog } from "@/components/debts/RepaymentDialog";
import { SelectedCustomerPanel } from "@/components/debts/SelectedCustomerPanel";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Icon } from "@/components/ui/Icon";
import { currentBusiness } from "@/data/business";
import {
  debtCustomers,
  debtEvents,
  debtReceipts,
  debtsToday,
  type DebtCustomer,
  type DebtEvent,
  type DebtReceipt,
  type RepaymentMethod,
} from "@/data/debts";
import {
  customerBalance,
  customersToCsv,
  debtStatus,
  downloadCsv,
  dueLabel,
  matchesQuery,
  matchesStatus,
  paymentsInMonth,
  reminderText,
  sortCustomers,
  type DebtSort,
  type StatusFilter,
} from "@/lib/debts";
import { percentChange } from "@/lib/ledger";

type DialogState =
  | { kind: "repay"; customerId: string }
  | { kind: "add"; customerId: string | null }
  | { kind: "remind"; customerId: string }
  | { kind: "bulk" }
  | null;

const sortOptions: { value: DebtSort; label: string }[] = [
  { value: "due", label: "Аз рӯи мӯҳлат" },
  { value: "amount", label: "Аз рӯи маблағ" },
  { value: "name", label: "Аз рӯи ном" },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function DebtsView() {
  const [customers, setCustomers] = useState<DebtCustomer[]>(debtCustomers);
  const [events, setEvents] = useState<DebtEvent[]>(debtEvents);
  const [receipts, setReceipts] = useState<DebtReceipt[]>(debtReceipts);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<DebtSort>("amount");
  const [selectedId, setSelectedId] = useState<string>("c1");
  const [dialog, setDialog] = useState<DialogState>(null);

  const allRows: CustomerRow[] = useMemo(
    () =>
      customers.map((customer) => {
        const balance = customerBalance(customer.id, events);
        return { customer, balance, status: debtStatus(customer, balance) };
      }),
    [customers, events],
  );

  const searched = allRows.filter((row) => matchesQuery(row.customer, query));
  const rows = sortCustomers(
    searched.filter((row) => matchesStatus(row.status, status)),
    sort,
  );
  const counts: StatusCounts = {
    all: searched.length,
    active: searched.filter((r) => matchesStatus(r.status, "active")).length,
    near: searched.filter((r) => r.status === "near").length,
    overdue: searched.filter((r) => r.status === "overdue").length,
    paid: searched.filter((r) => r.status === "paid").length,
  };

  const debtors = allRows.filter((r) => r.balance > 0);
  const overdueRows = allRows.filter((r) => r.status === "overdue");
  const paidThisMonth = paymentsInMonth(events, debtsToday.slice(0, 7));
  const total = debtors.reduce((sum, r) => sum + r.balance, 0);
  const summary: DebtSummary = {
    total,
    activeCount: debtors.length,
    overdue: overdueRows.reduce((sum, r) => sum + r.balance, 0),
    overdueCount: overdueRows.length,
    paidThisMonth,
    paidChange: percentChange(paidThisMonth, paymentsInMonth(events, "2024-04")),
    reliability: Math.round(customers.reduce((sum, c) => sum + c.reliability, 0) / Math.max(customers.length, 1)),
    collectedShare: total + paidThisMonth > 0 ? Math.round((paidThisMonth / (total + paidThisMonth)) * 100) : 0,
  };

  const selected = allRows.find((r) => r.customer.id === selectedId) ?? allRows[0];
  const selectedEvents = events.filter((e) => e.customerId === selected.customer.id);
  const selectedReceipt = [...receipts]
    .filter((r) => r.customerId === selected.customer.id)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[0];

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
  };

  const selectCustomer = (id: string, scroll: boolean) => {
    setSelectedId(id);
    if (scroll) {
      requestAnimationFrame(() => document.getElementById("selected-customer")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const nextEventId = () => `e${events.length + 1}-${Date.now()}`;

  const recordRepayment = (customerId: string, amount: number, method: RepaymentMethod) => {
    const balance = customerBalance(customerId, events);
    setEvents((current) => [
      ...current,
      {
        id: nextEventId(),
        customerId,
        type: "payment",
        title: amount >= balance ? "Қарз пурра пардохт шуд" : "Қисми қарз пардохт шуд",
        note: amount >= balance ? "Қарзи боқимонда пӯшида шуд." : `Боқимонда: ${balance - amount} смн`,
        tag: method,
        amount: -amount,
        date: debtsToday,
        time: nowTime(),
      },
    ]);
    if (amount >= balance) {
      setCustomers((current) => current.map((c) => (c.id === customerId ? { ...c, dueDate: null } : c)));
    }
    setDialog(null);
  };

  const recordDebt = (input: NewDebtInput) => {
    let customerId = input.customerId;
    if (!customerId) {
      customerId = `c${Date.now()}`;
      const created: DebtCustomer = {
        id: customerId,
        name: input.name,
        initials: initials(input.name),
        phone: input.phone,
        limit: 500,
        dueDate: input.dueDate,
        reliability: 90,
        avatarClassName: "bg-surface-container-highest text-on-surface-variant",
        mobileAvatarClassName: "bg-surface-container-high text-on-surface-variant",
      };
      setCustomers((current) => [...current, created]);
    } else {
      const id = customerId;
      setCustomers((current) => current.map((c) => (c.id === id ? { ...c, dueDate: input.dueDate } : c)));
    }
    const time = nowTime();
    const receiptId = String(Math.max(...receipts.map((r) => Number(r.id)), 1000) + 1);
    const ownerName = customers.find((c) => c.id === input.customerId)?.name ?? input.name;
    const [firstName, lastName] = ownerName.split(" ");
    setEvents((current) => [
      ...current,
      { id: nextEventId(), customerId, type: "debt", title: "Мол ба насия дода шуд", note: input.description, tag: "Қайди дастӣ", amount: input.amount, date: debtsToday, time },
    ]);
    setReceipts((current) => [
      ...current,
      {
        id: receiptId,
        customerId,
        date: debtsToday,
        time,
        place: "Душанбе, Дӯкони марказӣ",
        source: "manual",
        signedBy: lastName ? `${firstName} ${lastName[0]}.` : firstName,
        items: [{ name: input.description, quantity: "1", price: input.amount, total: input.amount }],
      },
    ]);
    setSelectedId(customerId);
    setStatus("all");
    setDialog(null);
  };

  const recordReminder = (customerId: string, channel: ReminderChannel) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    setEvents((current) => [
      ...current,
      {
        id: nextEventId(),
        customerId,
        type: "reminder",
        title: "Ёдраскунӣ омода шуд",
        note: reminderText(customer, customerBalance(customerId, current), currentBusiness.name),
        tag: channel,
        amount: 0,
        date: debtsToday,
        time: nowTime(),
      },
    ]);
  };

  const exportCsv = () =>
    downloadCsv(
      customersToCsv(rows.map((r) => ({ customer: r.customer, balance: r.balance, label: dueLabel(r.customer, r.balance) }))),
      `kassa-ai-nasiya-${debtsToday}.csv`,
    );

  const reminderTargets = (ids: string[]) =>
    allRows
      .filter((r) => ids.includes(r.customer.id) && r.balance > 0)
      .map((r) => ({ customer: r.customer, balance: r.balance, text: reminderText(r.customer, r.balance, currentBusiness.name) }));

  const dialogRow = dialog && "customerId" in dialog && dialog.customerId ? allRows.find((r) => r.customer.id === dialog.customerId) : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-space-md px-margin pt-space-xs pb-space-md md:space-y-space-lg md:px-space-lg md:py-space-md">
      <div className="flex items-center justify-between gap-space-sm md:hidden">
        <div className="flex items-center gap-space-xs">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          <h1 className="font-headline-sm text-headline-sm text-on-surface">Дафтари насия</h1>
        </div>
        <DemoBadge />
      </div>

      <div className="hidden flex-col justify-between gap-space-md md:flex lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Icon name="menu_book" className="text-base" />
            </span>
            <span className="font-label-caps text-label-caps tracking-wider text-outline uppercase">Дафтари насия ва ҳисобот</span>
            <DemoBadge />
          </div>
          <h1 className="mt-1 font-headline-lg text-headline-lg font-extrabold text-on-surface">Насия ва Муштариён</h1>
          <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
            Идоракунии мукаммали қарзҳои дӯкон ва муштариён бо ёдраскуниҳои SMS ва Telegram
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="flex items-center gap-space-xs rounded-lg bg-surface-container-high px-space-md py-2.5 font-headline-sm text-headline-sm text-on-surface shadow-xs transition-colors hover:bg-surface-container-highest disabled:opacity-50"
          >
            <Icon name="file_download" className="text-lg text-outline" />
            Содирот (Excel/CSV)
          </button>
          <button
            type="button"
            onClick={() => setDialog({ kind: "bulk" })}
            disabled={debtors.length === 0}
            className="flex items-center gap-space-xs rounded-lg bg-secondary-container px-space-md py-2.5 font-headline-sm text-headline-sm text-on-secondary-container shadow-xs transition-colors hover:bg-secondary-fixed-dim disabled:opacity-50"
          >
            <Icon name="forward_to_inbox" className="text-lg" />
            Ёдраскунии оммавӣ (SMS/TG)
          </button>
          <button
            type="button"
            onClick={() => setDialog({ kind: "add", customerId: null })}
            className="flex items-center gap-space-xs rounded-lg bg-tertiary-container px-space-lg py-2.5 font-headline-sm text-headline-sm text-on-tertiary-container shadow-md transition-all hover:opacity-90"
          >
            <Icon name="add_circle" className="text-xl" />
            Қарзи нав
          </button>
        </div>
      </div>

      <DebtKpis summary={summary} />
      <DebtKpisScroller summary={summary} />

      <div className="flex items-center gap-space-xs md:hidden">
        <button
          type="button"
          onClick={() => setDialog({ kind: "add", customerId: null })}
          className="flex min-h-11.5 flex-1 items-center justify-center gap-1.5 rounded-lg bg-tertiary-fixed font-headline-sm text-body-md font-bold text-on-tertiary-fixed shadow-xs transition-transform active:scale-[0.98]"
        >
          <Icon name="add_circle" className="text-[20px] text-tertiary" />
          Қарзи нав
        </button>
        <button
          type="button"
          aria-label="Ёдраскунии оммавӣ"
          onClick={() => setDialog({ kind: "bulk" })}
          disabled={debtors.length === 0}
          className="flex min-h-11.5 items-center justify-center rounded-lg bg-surface-container-lowest px-3.5 shadow-xs transition-colors active:bg-surface-container disabled:opacity-50"
        >
          <Icon name="forward_to_inbox" className="text-[20px] text-primary" />
        </button>
        <button
          type="button"
          aria-label="Содирот (Excel/CSV)"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="flex min-h-11.5 w-11.5 items-center justify-center rounded-lg bg-surface-container-lowest shadow-xs transition-colors active:bg-surface-container disabled:opacity-50"
        >
          <Icon name="ios_share" className="text-[20px] text-outline" />
        </button>
      </div>

      <div className="space-y-space-xs md:hidden">
        <div className="relative flex items-center rounded-xl bg-surface-container-lowest px-space-md py-1 shadow-xs">
          <Icon name="search" className="mr-2 text-[20px] text-outline" />
          <input
            type="search"
            aria-label="Ҷустуҷӯи муштарӣ"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ҷустуҷӯ бо ном ё рақам..."
            className="w-full bg-transparent py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>
        <Link href="/app/new" className="flex items-center gap-space-xs overflow-hidden rounded-full bg-surface-container-low px-3 py-1.5">
          <Icon name="auto_fix_high" className="shrink-0 text-[16px] text-tertiary" />
          <span className="truncate font-body-sm text-body-sm text-on-surface-variant">Овоз: «Ба Алишер 50 смн сабт кун»</span>
          <span className="ml-auto shrink-0 font-label-caps text-label-caps font-bold text-primary uppercase">Оғоз</span>
        </Link>
      </div>
      <div className="md:hidden">
        <DebtStatusChips status={status} counts={counts} onStatus={setStatus} />
      </div>

      <div className="space-y-space-sm md:hidden">
        <div className="flex items-center justify-between gap-space-sm px-1">
          <span className="font-label-caps text-label-caps font-semibold tracking-wider text-outline uppercase">
            Рӯйхати муштариён ({rows.length} нишон дода шудааст)
          </span>
          <label className="relative shrink-0 font-label-caps text-label-caps font-bold text-primary">
            {sortOptions.find((o) => o.value === sort)?.label ?? "Мураттабсозӣ"}
            <select
              aria-label="Мураттабсозӣ"
              value={sort}
              onChange={(event) => setSort(event.target.value as DebtSort)}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <CustomerCards rows={rows} selectedId={selected.customer.id} onSelect={(id) => selectCustomer(id, true)} onReset={resetFilters} />
      </div>
      <div className="md:hidden">
        <SelectedCustomerPanel
          key={selected.customer.id}
          customer={selected.customer}
          balance={selected.balance}
          status={selected.status}
          receipt={selectedReceipt}
          events={selectedEvents}
          onRepay={() => setDialog({ kind: "repay", customerId: selected.customer.id })}
          onRemind={() => setDialog({ kind: "remind", customerId: selected.customer.id })}
        />
      </div>

      <div className="hidden grid-cols-1 items-start gap-space-md md:grid lg:grid-cols-12">
        <div className="space-y-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-xs lg:col-span-5">
          <DebtSearchDesktop query={query} onQuery={setQuery} />
          <DebtStatusTabs status={status} counts={counts} onStatus={setStatus} />
          <CustomerList rows={rows} selectedId={selected.customer.id} onSelect={(id) => selectCustomer(id, false)} onReset={resetFilters} />
          <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container">
                <Icon name="mic" className="text-base" />
              </div>
              <div>
                <p className="font-body-sm text-body-sm font-semibold text-on-surface">Сабти фаврии насия</p>
                <p className="font-label-caps text-label-caps text-outline">Гуфтор: «Ба Алишер 50 смн сабт кун»</p>
              </div>
            </div>
            <Link href="/app/new" className="rounded-sm bg-surface-container-highest px-2 py-1 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container">
              Оғоз
            </Link>
          </div>
        </div>
        <div className="space-y-space-md lg:col-span-7">
          <CustomerProfile
            customer={selected.customer}
            balance={selected.balance}
            onRepay={() => setDialog({ kind: "repay", customerId: selected.customer.id })}
            onAddDebt={() => setDialog({ kind: "add", customerId: selected.customer.id })}
            onRemind={() => setDialog({ kind: "remind", customerId: selected.customer.id })}
          />
          <DebtReceiptCard receipt={selectedReceipt} />
          <DebtHistory key={selected.customer.id} events={selectedEvents} />
        </div>
      </div>

      {dialog?.kind === "repay" && dialogRow && (
        <RepaymentDialog
          customer={dialogRow.customer}
          balance={dialogRow.balance}
          onClose={() => setDialog(null)}
          onConfirm={(amount, method) => recordRepayment(dialogRow.customer.id, amount, method)}
        />
      )}
      {dialog?.kind === "add" && (
        <AddDebtDialog
          customers={allRows.map((r) => ({ customer: r.customer, balance: r.balance }))}
          initialCustomerId={dialog.customerId}
          onClose={() => setDialog(null)}
          onConfirm={recordDebt}
        />
      )}
      {dialog?.kind === "remind" && dialogRow && (
        <ReminderDialog targets={reminderTargets([dialogRow.customer.id])} onClose={() => setDialog(null)} onPrepared={recordReminder} />
      )}
      {dialog?.kind === "bulk" && (
        <ReminderDialog
          bulk
          targets={reminderTargets(sortCustomers(debtors, "due").map((r) => r.customer.id))}
          onClose={() => setDialog(null)}
          onPrepared={recordReminder}
        />
      )}
    </div>
  );
}
