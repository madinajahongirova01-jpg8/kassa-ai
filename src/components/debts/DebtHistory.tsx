"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { DebtEvent, DebtEventType } from "@/data/debts";
import { cn } from "@/lib/cn";
import { formatLedgerDate } from "@/lib/ledger";
import { formatNumber, formatSomoni, MINUS } from "@/lib/format";

const VISIBLE = 4;

type HistoryFilter = DebtEventType | "all";

const filterOptions: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "Ҳама" },
  { value: "debt", label: "Қарзҳо" },
  { value: "payment", label: "Пардохтҳо" },
  { value: "reminder", label: "Ёдраскуниҳо" },
];

const dotClass = (event: DebtEvent, index: number) => {
  if (event.type === "reminder") return "bg-tertiary-container";
  if (event.type === "payment") return "bg-primary";
  return index === 0 || index === 1 ? "bg-tertiary" : "bg-outline-variant";
};

const tagClass = (event: DebtEvent) => {
  if (event.type === "reminder") return "bg-tertiary-fixed font-bold text-on-tertiary-fixed";
  if (event.type === "payment") return "bg-primary-container font-bold text-on-primary-container";
  return "bg-surface-container-high text-on-surface-variant";
};

function sortEvents(events: DebtEvent[]) {
  return [...events].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

function EventAmount({ event, faded }: { event: DebtEvent; faded: boolean }) {
  if (event.type === "reminder") return null;
  const sign = event.amount > 0 ? "+" : MINUS;
  return (
    <div
      className={cn(
        "font-headline-sm text-headline-sm font-extrabold tnum",
        event.type === "payment" ? "text-primary" : faded ? "font-bold text-on-surface-variant" : "text-tertiary",
      )}
    >
      {sign}
      {formatNumber(Math.abs(event.amount))} <span className="font-body-sm text-body-sm text-outline">смн</span>
    </div>
  );
}

export function DebtHistory({ events }: { events: DebtEvent[] }) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const filtered = sortEvents(events).filter((e) => filter === "all" || e.type === filter);
  const shown = expanded ? filtered : filtered.slice(0, VISIBLE);
  const year = filtered[0]?.date.slice(0, 4) ?? "2024";

  return (
    <section aria-label="Таърихи амалиёт" className="space-y-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="flex items-center justify-between gap-space-sm">
        <div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Таърихи амалиёт ва ёдраскуниҳо</h3>
          <p className="font-body-sm text-body-sm text-outline">Ҳамаи гардишҳои насия, пардохтҳо ва огоҳиҳо</p>
        </div>
        <label className="relative flex shrink-0 cursor-pointer items-center gap-1 font-headline-sm text-sm font-semibold text-primary hover:underline">
          <Icon name="filter_list" className="text-base" />
          {filter === "all" ? "Филтр" : filterOptions.find((o) => o.value === filter)?.label}
          <select
            aria-label="Филтри таърих"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as HistoryFilter);
              setExpanded(false);
            }}
            className="absolute inset-0 cursor-pointer appearance-none opacity-0"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="py-space-md text-center font-body-sm text-body-sm text-on-surface-variant">Сабт ёфт нашуд.</p>
      ) : (
        <ol className="relative space-y-space-md pl-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-surface-container-highest">
          {shown.map((event, index) => (
            <li key={event.id} className="relative">
              <div className={cn("absolute top-1 -left-[27px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-surface-container-lowest", dotClass(event, index))}>
                <span className="h-1.5 w-1.5 rounded-full bg-surface-container-lowest" />
              </div>
              <div className="flex items-center justify-between gap-space-md rounded-xl bg-surface-container-low/70 p-space-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{event.title}</span>
                    <span className={cn("rounded-full px-2 py-0.5 font-label-caps text-label-caps", tagClass(event))}>{event.tag}</span>
                  </div>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{event.note}</p>
                </div>
                <div className="shrink-0 text-right">
                  <EventAmount event={event} faded={index > 1} />
                  <span className="block font-body-sm text-body-sm text-outline">
                    {formatLedgerDate(event.date, false)}, {event.time}
                  </span>
                  {event.read && (
                    <span className="inline-flex items-center gap-0.5 font-body-sm text-body-sm font-medium text-primary">
                      <Icon name="done_all" className="text-xs" /> Хонда шуд
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="flex items-center justify-between gap-space-sm pt-space-xs">
        <span className="font-body-sm text-body-sm text-outline">
          Нишон додани {shown.length} аз {filtered.length} амалиёти соли {year}
        </span>
        {filtered.length > VISIBLE && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg bg-surface-container px-3 py-1.5 font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
          >
            {expanded ? "Камтар нишон додан" : "Боркунии ҳамаи таърих"}
          </button>
        )}
      </div>
    </section>
  );
}

export function DebtHistoryCompact({ events }: { events: DebtEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = sortEvents(events);
  const shown = expanded ? sorted : sorted.slice(0, 3);
  const dot = (event: DebtEvent) =>
    event.type === "payment" ? "bg-secondary" : event.type === "reminder" ? "bg-primary" : "bg-tertiary";
  const meta = (event: DebtEvent) => {
    const date = formatLedgerDate(event.date, false);
    if (event.type === "reminder") return `${date}, ${event.time}${event.read ? " • Хонда шуд" : ""}`;
    if (event.type === "payment") return `${date}, ${event.time} • ${formatSomoni(Math.abs(event.amount))} (${event.tag})`;
    return `${date}, ${event.time} • ${event.tag}`;
  };

  return (
    <div className="space-y-space-xs">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps font-semibold tracking-wider text-outline uppercase">Таърихи амалиётҳо</span>
        {sorted.length > 3 && (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="font-label-caps text-label-caps font-bold text-primary">
            {expanded ? "Камтар" : "Тамоми таърих"}
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {shown.map((event) => (
          <li key={event.id} className="flex items-start gap-2">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot(event))} />
            <div className="min-w-0">
              <p className="font-body-sm text-body-sm font-semibold text-on-surface">
                {event.title}
                {event.type === "debt" ? ` (+${formatSomoni(event.amount)})` : event.type === "reminder" ? ` (${event.tag})` : ""}
              </p>
              <p className="font-body-sm text-[11px] text-on-surface-variant">{meta(event)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
