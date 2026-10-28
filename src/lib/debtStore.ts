"use client";

import { useSyncExternalStore } from "react";
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
import { customerBalance } from "@/lib/debts";

export type DebtState = {
  customers: DebtCustomer[];
  events: DebtEvent[];
  receipts: DebtReceipt[];
};

export type NewDebtRecord = {
  customerId: string | null;
  name: string;
  phone: string;
  description: string;
  amount: number;
  dueDate: string;
};

const initialState: DebtState = { customers: debtCustomers, events: debtEvents, receipts: debtReceipts };
let state = initialState;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(next: (current: DebtState) => DebtState) {
  state = next(state);
  listeners.forEach((listener) => listener());
}

export function useDebtState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initialState,
  );
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function nextEventId(events: DebtEvent[]) {
  return `e${Math.max(...events.map((e) => Number(e.id.replace(/\D/g, "")) || 0), 0) + 1}`;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function recordRepayment(customerId: string, amount: number, method: RepaymentMethod) {
  update((current) => {
    const balance = customerBalance(customerId, current.events);
    const full = amount >= balance;
    return {
      ...current,
      customers: full ? current.customers.map((c) => (c.id === customerId ? { ...c, dueDate: null } : c)) : current.customers,
      events: [
        ...current.events,
        {
          id: nextEventId(current.events),
          customerId,
          type: "payment",
          title: full ? "Қарз пурра пардохт шуд" : "Қисми қарз пардохт шуд",
          note: full ? "Қарзи боқимонда пӯшида шуд." : `Боқимонда: ${balance - amount} смн`,
          tag: method,
          amount: -amount,
          date: debtsToday,
          time: nowTime(),
        },
      ],
    };
  });
}

export function recordDebt(input: NewDebtRecord) {
  const customerId = input.customerId ?? `c${state.customers.length + 1}-${Date.now()}`;
  update((current) => {
    const existing = current.customers.find((c) => c.id === customerId);
    const ownerName = existing?.name ?? input.name;
    const [firstName, lastName] = ownerName.split(" ");
    const time = nowTime();
    const customers = existing
      ? current.customers.map((c) => (c.id === customerId ? { ...c, dueDate: input.dueDate } : c))
      : [
          ...current.customers,
          {
            id: customerId,
            name: input.name,
            initials: initialsOf(input.name),
            phone: input.phone,
            limit: 500,
            dueDate: input.dueDate,
            reliability: 90,
            avatarClassName: "bg-surface-container-highest text-on-surface-variant",
            mobileAvatarClassName: "bg-surface-container-high text-on-surface-variant",
          },
        ];
    return {
      customers,
      events: [
        ...current.events,
        {
          id: nextEventId(current.events),
          customerId,
          type: "debt",
          title: "Мол ба насия дода шуд",
          note: input.description,
          tag: "Қайди дастӣ",
          amount: input.amount,
          date: debtsToday,
          time,
        },
      ],
      receipts: [
        ...current.receipts,
        {
          id: String(Math.max(...current.receipts.map((r) => Number(r.id)), 1000) + 1),
          customerId,
          date: debtsToday,
          time,
          place: "Душанбе, Дӯкони марказӣ",
          source: "manual",
          signedBy: lastName ? `${firstName} ${lastName[0]}.` : firstName,
          items: [{ name: input.description, quantity: "1", price: input.amount, total: input.amount }],
        },
      ],
    };
  });
  return customerId;
}

export function recordReminder(customerId: string, channel: string, note: string) {
  update((current) => ({
    ...current,
    events: [
      ...current.events,
      {
        id: nextEventId(current.events),
        customerId,
        type: "reminder",
        title: "Ёдраскунӣ омода шуд",
        note,
        tag: channel,
        amount: 0,
        date: debtsToday,
        time: nowTime(),
      },
    ],
  }));
}
