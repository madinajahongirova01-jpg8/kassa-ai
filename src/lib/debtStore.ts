"use client";

import { useSyncExternalStore } from "react";
import { debtCustomers, debtEvents, debtsToday, type DebtCustomer, type DebtEvent } from "@/data/debts";
import { customerBalance } from "@/lib/debts";

export type DebtState = {
  customers: DebtCustomer[];
  events: DebtEvent[];
};

const initialState: DebtState = { customers: debtCustomers, events: debtEvents };
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

export function recordFullRepayment(customerId: string) {
  update((current) => {
    const balance = customerBalance(customerId, current.events);
    if (balance <= 0) return current;
    return {
      customers: current.customers.map((c) => (c.id === customerId ? { ...c, dueDate: null } : c)),
      events: [
        ...current.events,
        {
          id: nextEventId(current.events),
          customerId,
          type: "payment",
          note: "Пурра баргардонд",
          tag: "Нақд",
          amount: -balance,
          date: debtsToday,
          time: nowTime(),
        },
      ],
    };
  });
}
